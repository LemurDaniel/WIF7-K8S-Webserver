// Load Modules //
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');

// load custom moduless
const sql = require('./modules_private/sql_calls');
const { auth, verify_token, auth_routes } = require('./modules_private/user_auth');
const { image_routes, helper } = require('./modules_private/image_data');
const HTML = helper.HTML;


// Get environment variables
const SQL_ENABLE = (process.env.SQL_ENABLE == 'true' ? true:false); 
const HTTPS_ENABLE = (process.env.HTTPS_ENABLE == 'true' ? true:false);
const SSL_KEY = process.env.SSL_KEY;
const SSL_CERT = process.env.SSL_CERT;
console.log('SQL: '+SQL_ENABLE);
console.log('HTTPS: '+HTTPS_ENABLE);

// Initialize DB
if(SQL_ENABLE) setTimeout(() => sql.init_Database(helper.DOODLES), 3000);


//Create Server//
const app = express();
// Make everything in /public  publicly accessible
app.use(express.static('/var/project/src/public'));
// Use bodyParser to automatically convert json body to object
app.use(bodyParser.json());
// Use routes from authorization module and image module
app.use(auth_routes);
app.use(image_routes);
// Send nicley formatted Json
app.set('json spaces', 2)

// Create http or https server depending on environment Variable
var server;
if(HTTPS_ENABLE){
    server = https.createServer({
        key: SSL_KEY,
        cert: SSL_CERT
    }, app);
}else
    server = http.createServer(app);
server.listen(3000);

// GET //
app.get('/', auth, (req,res) => res.sendFile(HTML('index')));
app.get('/draw', auth, (req,res) => res.sendFile(HTML('draw')));
app.get('/rocket', auth, (req,res) => res.sendFile(HTML('rocket_game')));
app.get('/tictactoe', auth, (req,res) => res.sendFile(HTML('tictactoe')));
app.get('/translation', auth, (req,res) => res.sendFile(helper.TRANSLATION));

app.get('/web', auth, (req,res) => res.sendFile(helper.WEB));
app.get('/info', (req,res) =>  res.json(process.env) );

const authorized_html = fs.readFileSync(HTML('authorized'), 'utf-8'); 
app.get('/user', (req,res) => {
    
    // if not verifed direct to login page
    if(!verify_token(req)) return res.sendFile(HTML('authorize'));

    // if loggend in, show some info
    let html = authorized_html.replace('%0', req.body.user.username_display);
    html = html.replace('%1', process.env.HOSTNAME);
    html = html.replace('%2', process.env.NODE_VERSION);
    res.send(html);
    
});

app.get('/credits', (req,res) =>  res.sendFile(HTML('credits')));
app.get('/404', (req,res) => res.sendFile(HTML('codepen_template/404')));


// Catch 404 and forward to 404 page //
app.use((req, res, next) => {
    if(req.accepts('html'))
        res.status(404).redirect('/404');
});
