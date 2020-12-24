const fs = require('fs');
var crypto = require('crypto');
const bcrypt = require('bcrypt');
const route =  require('express').Router();
const jwt = require('jsonwebtoken');
const sql = require('./sql_calls');
const schema = require('./joi_models');



// Constants
const JWT_LIFESPAN = process.env.JWT_LIFESPAN; // hours
const SIGNING_KEY = process.env.JWT_SIGNING_KEY;
const VERIFY_KEY = process.env.JWT_VERIFY_KEY;
const SIGNING_ALGO = process.env.JWT_SIGING_ALGO;
const ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.JWT_ENCRYPTION_IV;
const ENCRYPTION_ALGO = process.env.JWT_ENCRYPTION_ALGO;
const ENCRYPTION_ENABLE = (process.env.JWT_ENCRYPTION_ENABLE == 'true' ? true:false);
const HTTPS_ENABLE = (process.env.HTTPS_ENABLE == 'true' ? true:false);

function encrypt(plain){

    const cipher =  crypto.createCipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex')); 
    let encrypted = cipher.update(plain); 
    encrypted = Buffer.concat([encrypted, cipher.final()]); 
     
    return encrypted.toString('hex'); 
}

function decrypt(encrypted){

    const encrypted_text = Buffer.from(encrypted, 'hex'); 
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex')); 
    let decrypted = decipher.update(encrypted_text); 
    decrypted = Buffer.concat([decrypted, decipher.final()]); 
     
    return decrypted.toString(); 
}


function create_jwt(user, res) {
    // Make sure only id and username_display gets encoded into JWT
    // no sensitive data like password or bycrypt hash
    user = { id: user.id, username_display: user.username_display };            

    // Genereate jwt and store it in cookie for 24hours
    let token = jwt.sign(user, SIGNING_KEY, { expiresIn: JWT_LIFESPAN+'h', algorithm:  SIGNING_ALGO });

    // Encrypt token
    if(ENCRYPTION_ENABLE) token = encrypt(token);

    // Set cookie with encrypted token
    if(HTTPS_ENABLE) res.setHeader('Set-Cookie', 'doodle_token='+token+'; path=/; HttpOnly; secure; max-age='+JWT_LIFESPAN*60*60);
    else res.setHeader('Set-Cookie', 'doodle_token='+token+'; path=/; HttpOnly; max-age='+JWT_LIFESPAN*60*60);
    
    return res;
}


route.post('/user/register', (req, res) => {

    const user = req.body;
    const validated = schema.user_register.validate(user);
    if(validated.error) return res.json(schema.error(validated.error));

    sql.call( (con) => {
        // make password hash
        bcrypt.hash(user.password, 10, (err, hash) => {
            delete user.password;
            user.bcrypt = hash;

            // Insert new user
            sql.insert_user(con, user, (err) => {
                if(err) {
                    // if user already exists send error back
                    if(err.code == 'ER_DUP_ENTRY') return res.json({code: 10, err: 'User already exists'});
                    else return res.json({code: 20, err: err});
                }
                
                create_jwt(user, res).status(200).setHeader('Location', '/');
                //res.redirect('/');
                res.json({req: 'done'});
            });
        });
    })
});


route.post('/user/login', (req, res) => {

    const user = req.body;

    sql.call( (con) => {
        // Search database for user
        sql.get_password_hash(con, user, (err, user) =>{

            if(!user.id) return res.json({code: 11, err: 'User doesn\'t exist'});

            // compare passwords sent and in database
            bcrypt.compare(user.password, user.bcrypt, (err, result) => {
                if(!result) return res.send({code: 11, err: 'Invalid Passwort'});

                create_jwt(user, res).status(200).setHeader('Location', '/');
                res.json({req: 'done'});
            });
        });
    })
})

/* FOR Testing, to be removed */
route.get('/user/testuser', (req, res) => { 

    create_jwt({ id: 2, username_display: 'testuser'}, res);
    res.status(200).send('OK');
});

route.get('/user/logout', (req, res) => { 
    if(HTTPS_ENABLE) res.setHeader('Set-Cookie', 'doodle_token=nix; path=/; HttpOnly; secure; max-age=0');
    else res.setHeader('Set-Cookie', 'doodle_token=nix; path=/; HttpOnly; max-age=0');
    res.status(300).redirect('/user');
});


const validate_token = (req) => {

    // deny access if no cookie present
    if(!req.headers.cookie) return false;

    //split cookies to array
    const cookies = req.headers.cookie.split(';');
    let token;
    for(let i=0; i<cookies.length; i++){
        // check wether one of the cookies include name: doodle_token
        if(!cookies[i].includes('doodle_token')) continue;
        // get the value of the doodle_token
        token = cookies[i].split('=')[1].trim();
    }

    // if no jwt present, deny access
    if(!token) return false;

    try {
        // decrypt token
        if(ENCRYPTION_ENABLE) token = decrypt(token);

        // if jwt verified, grant access
        req.body.user = jwt.verify(token, VERIFY_KEY, { expiresIn: JWT_LIFESPAN+'h', algorithm:  [SIGNING_ALGO] });
        return true;
    } catch (ex) {
        // if jwt invalid, deny access
        return false;
    }
}

const auth = (req, res, next) => {
    if(validate_token(req)) next();
    else res.redirect('/user');
}


module.exports = { auth: auth, verify_token: validate_token, auth_routes: route};