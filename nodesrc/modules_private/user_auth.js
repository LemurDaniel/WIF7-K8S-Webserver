const fs = require('fs');
var crypto = require('crypto');
const bcrypt = require('bcrypt');
const route =  require('express').Router();
const jwt = require('jsonwebtoken');
const sql = require('./sql_calls');
const schema = require('./joi_models');



// Constants
const JWT_LIFESPAN = process.env.JWT_LIFESPAN; // hours
const SIGNING_KEY = process.env.JWT_SIGNING_KEY || process.env['jwt.private.pem'];;
const VERIFY_KEY = process.env.JWT_VERIFY_KEY || process.env['jwt.public.pem'];
const SIGNING_ALGO = process.env.JWT_SIGNING_ALGO;
const ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY;
const ENCRYPTION_IV = process.env.JWT_ENCRYPTION_IV;
const ENCRYPTION_ALGO = process.env.JWT_ENCRYPTION_ALGO;
const ENCRYPTION_ENABLE = (process.env.JWT_ENCRYPTION_ENABLE == 'true' ? true:false);
const HTTPS_ENABLE = (process.env.HTTPS_ENABLE == 'true' ? true:false);
// For testing
const AUTH2_USER = process.env.AUTH2_USER;
const AUTH2_PASS = process.env.AUTH2_PASS;

function encrypt(plain){

    const cipher =  crypto.createCipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex')); 
    let encrypted = cipher.update(plain); 
    encrypted = Buffer.concat([encrypted, cipher.final()]); 
     
    return encrypted.toString('base64'); 
}

function decrypt(encrypted){

    const encrypted_text = Buffer.from(encrypted, 'base64'); 
    const decipher = crypto.createDecipheriv(ENCRYPTION_ALGO, Buffer.from(ENCRYPTION_KEY, 'hex'), Buffer.from(ENCRYPTION_IV, 'hex')); 
    let decrypted = decipher.update(encrypted_text); 
    decrypted = Buffer.concat([decrypted, decipher.final()]); 
     
    return decrypted.toString(); 
}


function create_jwt(user_raw, res, auth2) {
    // Make sure only id and username_display gets encoded into JWT
    // no sensitive data like password or bycrypt hash
    user = { id: user_raw.id, username_display: user_raw.username_display };    

    if(AUTH2_USER && AUTH2_PASS){
        if(AUTH2_USER.includes(user_raw.username)) user.pass = AUTH2_PASS;
    }      

    // Genereate jwt
    let token = jwt.sign(user, SIGNING_KEY, { expiresIn: JWT_LIFESPAN+'h', algorithm:  SIGNING_ALGO });

    // Encrypt token
    if(ENCRYPTION_ENABLE) token = encrypt(token);

    // Set cookie with encrypted token
    if(HTTPS_ENABLE) res.setHeader('Set-Cookie', 'doodle_token='+token+'; path=/; HttpOnly; secure; max-age='+JWT_LIFESPAN*60*60);
    else res.setHeader('Set-Cookie', 'doodle_token='+token+'; path=/; HttpOnly; max-age='+JWT_LIFESPAN*60*60);
    
    return res;
}


function register_user (user, res) {

    // make password hash
    bcrypt.hash(user.password, 10, (err, hash) => {
        delete user.password;
        user.bcrypt = hash;
        user.id = crypto.randomBytes(8).toString('hex');

        // Insert new user
        sql.insert_user(sql.pool, user, (err) => {
            if(err) {
                if(err.code == 'ER_DUP_ENTRY') {
                    // if user_id duplicate, retry with different id. 2^64 or 16^16 possibilities, rare case
                    if(err.sqlMessage.includes("key 'PRIMARY'")) return register_user(user, res);
                    else return res.json({err: 'User already exists'});
                }
                else return res.json({err: err});
            }
                
            create_jwt(user, res).status(200).setHeader('Location', '/');
            res.json({req: 'done'});
        });
    })
}

route.post('/user/register', (req, res) => {

    const user = req.body;
    const validated = schema.user_register.validate(user);
    if(validated.error) return res.json(schema.error(validated.error));

    user.username = user.username.toLowerCase();
    
    register_user(user, res);
});


route.post('/user/login', (req, res) => {

    const user = req.body;

    // Search database for user
    sql.get_password_hash(sql.pool, user, (err, user) =>{
        if(!user.id) return res.json({err: 'User doesn\'t exist'});

        // compare passwords sent and in database
        bcrypt.compare(user.password, user.bcrypt, (err, result) => {
            if(!result) return res.send({err: 'Invalid Passwort'});

            create_jwt(user, res).status(200).setHeader('Location', '/');
            res.json({req: 'done'});
        });
    })
})

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
        return req.body.user = jwt.verify(token, VERIFY_KEY, { expiresIn: JWT_LIFESPAN+'h', algorithm:  [SIGNING_ALGO] });
    } catch (ex) {
        // if jwt invalid, deny access
        return false;
    }
}

const auth = (req, res, next) => {
    if(validate_token(req)) next();
    else res.redirect('/user');
}


// Only for testing
const auth2 = (req, res, next) => {
    if( !(AUTH2_USER && AUTH2_PASS) || 
            !validate_token(req) ||
            req.body.user.pass != AUTH2_PASS) return res.redirect('/404');
    else return next();
}

module.exports = { auth: auth, auth2: auth2, verify_token: validate_token, auth_routes: route};
