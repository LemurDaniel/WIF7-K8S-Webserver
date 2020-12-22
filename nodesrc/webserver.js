// Load Modules //
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const sql = require('./js/sql_calls');

const { auth, auth_routes } = require('./js/user_auth');
const { image_routes, helper } = require('./js/image_data');

const SQL_ENABLE = (process.env.SQL_ENABLE == 'true' ? true:false); 
console.log('SQL: '+SQL_ENABLE);

// Initialize DB
if(SQL_ENABLE) setTimeout(() => sql.init_Database(helper.DOODLES), 3000);


//Create Server//
const app = express();
app.use(express.static("/var/project/src"));
app.use(bodyParser.json());
app.use(auth_routes);
app.use(image_routes);
app.set('json spaces', 2)

const server = http.createServer(app);
/*
const server = https.createServer({
    key: fs.readFileSync('./daniel-wif7-projekt.key.pem'),
    cert: fs.readFileSync('./daniel-wif7-projekt.cert.pem')
}, app);*/
server.listen(3000);

/*
// Catch 404 and forward to error handler //
app.use((req, res, next) => {
    next(createError(404));
});*/

// GET //
app.get('/', auth, (req,res) => res.sendFile(helper.PATH+'html/draw.html'));
app.get('/web', auth, (req,res) => res.sendFile(helper.WEB));
app.get('/translation', auth, (req,res) => res.sendFile(helper.TRANSLATION));
app.get('/rocket', auth, (req,res) => res.sendFile(helper.PATH+'html/rocket_game.html'));
app.get('/tictactoe', auth, (req,res) => res.sendFile(helper.PATH+'html/tictactoe.html'));
app.get('/draw', auth, (req,res) => res.sendFile(helper.PATH+'html/draw.html'));
app.get('/info', auth, (req,res) =>  res.json(process.env) );






