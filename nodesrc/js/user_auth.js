const fs = require('fs');
var crypto = require('crypto');
const bcrypt = require('bcrypt');
const route =  require('express').Router();
const jwt = require('jsonwebtoken');
const sql = require('./sql_calls');
const schema = require('./joi-models');



// Constants
const SIGNING_KEY = process.env.JWT_SIGNING_KEY;
const ENCRYPTION_KEY = process.env.JWT_ENCRYPTION_KEY;
const ENCRYPTION_ALGO = process.env.JWT_ENCRYPTION_ALGO;
const HTTPS_ENABLE = (process.env.HTTPS_ENABLE == 'true' ? true:false);


function create_jwt(user, res) {
    // Make sure only id and username_display gets encoded into JWT
    // no sensitive data like password or bycrypt hash
    user = { id: user.id, username_display: user.username_display };            

    // Genereate jwt and store it in cookie for 24hours
    const token = jwt.sign(user, SIGNING_KEY, { expiresIn: '24h' });

    // Encrypt token
    const cipher = crypto.createCipher(ENCRYPTION_ALGO, ENCRYPTION_KEY);
    let token_encrypted = cipher.update(token, 'utf8', 'hex')
    token_encrypted += cipher.final('hex');

    // Set cookie with encrypted token
    if(HTTPS_ENABLE) res.setHeader('Set-Cookie', 'webToken='+token_encrypted+'; path=/; HttpOnly; secure; max-age='+24*60*60);
    else res.setHeader('Set-Cookie', 'webToken='+token_encrypted+'; path=/; HttpOnly; max-age='+24*60*60);
    
    return res;
}


route.post('/user/register', (req, res) => {

    const user = req.body;
    const validated = schema.user_register.validate(user);
    if(validated.error) return res.status(400).send(validated.error);

    sql.call( (con) => {
        // make password hash
        bcrypt.hash(user.password, 10, (err, hash) => {
            delete user.password;
            user.bcrypt = hash;

            // Insert new user
            sql.insert_user(con, user, (err) => {
                if(err) {
                    // if user already exists send error back
                    if(err.code == 'ER_DUP_ENTRY') return res.status(400).json({err: 'User already exists'});
                    else return res.status(400).json(err);
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
    const validated = schema.user_login.validate(user);
    if(validated.error) return res.status(400).send(validated.error);

    sql.call( (con) => {
        // Search database for user
        sql.get_password_hash(con, user, (err, user) =>{

            if(!user.id) return res.status(400).json({err: 'User doesn\'t exist'});

            // compare passwords sent and in database
            bcrypt.compare(user.password, user.bcrypt, (err, result) => {
                if(!result) return res.status(400).send('Invalid password');

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

route.post('/user/logout', (req, res) => { });


const auth = (req, res, next) => {

    if(req.originalUrl == '/user') return next();
    // deny access if no cookie present
    if(!req.headers.cookie) return res.status(400).redirect('/user');

    //split cookies to array
    const cookies = req.headers.cookie.split(';');
    let token;
    for(let i=0; i<cookies.length; i++){
        // check wether one of the cookies include name: webToken
        if(!cookies[i].includes('webToken')) continue;
        // get the value of the webToken
        token = cookies[i].split('=')[1].trim();
    }

    // if no jwt present, deny access
    if(!token) {
        return res.status(403).redirect('/user');
        //res.status(403).setHeader('Location', '/');
        res.send('No Access token'); 
    }

    try {
        // decrypt token
        const cipher = crypto.createDecipher(ENCRYPTION_ALGO, ENCRYPTION_KEY);
        let token_decrypted = cipher.update(token, 'hex', 'utf8')
        token_decrypted += cipher.final('utf8');

        // if jwt verified, grant access
        req.body.user = jwt.verify(token_decrypted, SIGNING_KEY);
        next();
    } catch (ex) {
        // if jwt invalid, deny access
        return res.status(400).redirect('/user');
        ///res.send('Invalid Token'); 
    }
}


module.exports = { auth: auth, auth_routes: route};