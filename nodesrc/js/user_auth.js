const fs = require('fs');
var crypto = require('crypto');
const bcrypt = require('bcrypt');
const route =  require('express').Router();
const jwt = require('jsonwebtoken');
const sql = require('./sql_calls');



// Constants
const SIGNING_KEY = 'private_key';
const ENCRYPTION_KEY = 'encrypt_key';
const ENCRYPTION_ALGO = 'aes256';

//TODO
function verify_password(passwort) {
    return;
} 

route.post('/user/register', (req, res) => {

    const user = req.body;
    // verify input
    const pw_policy = verify_password(user.password);
    if(pw_policy) return res.status(400).send(pw_policy);

    sql.call( (con) => {
        // make password hash
        bcrypt.hash(user.password, 10, (err, hash) => {
            delete user.password;
            user.bcrypt = hash;

            // Insert new user
            sql.insert_user(con, user, (err) => {
                if(err) {
                    // if user already exists send error back
                    if(err.code == 'ER_DUP_ENTRY') return res.status(400).send('User already exists');
                    else return res.status(400).json(err);
                }
                
                res.status(300).send('User created');
            });
        });
    })
});


route.post('/user/login', (req, res) => {

    const user = req.body; 

    sql.call( (con) => {
        // Search database for user
        sql.get_password_hash(con, user, (err, user) =>{

            if(!user.id) return res.status(400).send('User is nonexistent');

            // compare passwords sent and in database
            bcrypt.compare(user.password, user.bcrypt, (err, result) => {
                if(!result) return res.status(400).send('Invalid password');

                // delete hash and password, so that they don't get stored in jwt token
                delete user.password;
                delete user.bcrypt;
                
                // Genereate jwt and store it in cookie for 24hours
                const token = jwt.sign(user, SIGNING_KEY, { expiresIn: '24h' });      // add secure for https
                // Encrypt token
                const cipher = crypto.createCipher(ENCRYPTION_ALGO, ENCRYPTION_KEY);
                let token_encrypted = cipher.update(token, 'utf8', 'hex')
                token_encrypted += cipher.final('hex');
                // Set cookie with encrypted token
                res.setHeader('Set-Cookie', 'webToken='+token_encrypted+'; path=/; HttpOnly; max-age='+24*60*60);
                res.status(300).send('OK');
            });
        });
    })
})

/* FOR Testing, to be removed */
route.get('/user/testuser', (req, res) => { 

    const user = { id: 2, username: 'testuser'};
    const token = jwt.sign(user, SIGNING_KEY, { expiresIn: '24h'});
   
    const cipher = crypto.createCipher(ENCRYPTION_ALGO, ENCRYPTION_KEY);
    let token_encrypted = cipher.update(token, 'utf8', 'hex')
    token_encrypted += cipher.final('hex');

    res.setHeader('Set-Cookie', 'webToken='+token_encrypted+'; path=/; HttpOnly; max-age='+24*60*60);
    res.status(300).send('OK');
});

route.post('/user/logout', (req, res) => { });


const auth = (req, res, next) => {

    // deny access if no cookie present
    if(!req.headers.cookie) return res.status(403).send('No Access token');

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
    if(!token) return res.status(403).send('No Access token');

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
        res.status(400).send('Invalid Token');  // make redirect to not logged in page
    }
}


module.exports = { auth: auth, auth_routes: route};




