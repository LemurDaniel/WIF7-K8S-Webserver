// Load Modules //
const http = require('http');
const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const cors = require('cors')
const fs = require('fs');
const mysql = require('mysql');
const sql = require('./js/sql_calls');
const helper = require('./js/helper');

const SQL_ENABLE = (process.env.SQL_ENABLE == 'true' ? true:false); 
console.log('SQL: '+SQL_ENABLE);

// Initialize DB
if(SQL_ENABLE) setTimeout(() => sql.init_Database(helper.DOODLES), 3000);


//Create Server//
const app = express();
app.use(express.static("/var/project/src"));
app.use(bodyParser.json());
app.use(cors());
app.set('json spaces', 2)

//const server = http.createServer(app);
const server = https.createServer({
    key: fs.readFileSync('./daniel-wif7-projekt.key.pem'),
    cert: fs.readFileSync('./daniel-wif7-projekt.cert.pem')
}, app);
server.listen(3000);

/*
// Catch 404 and forward to error handler //
app.use((req, res, next) => {
    next(createError(404));
});*/

// GET //
app.get('/', (req,res) => res.sendFile(helper.PATH+'html/draw.html'));
app.get('/web', (req,res) => res.sendFile(helper.WEB));
app.get('/translation', (req,res) => res.sendFile(helper.TRANSLATION));
app.get('/rocket', (req,res) => res.sendFile(helper.PATH+'html/rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile(helper.PATH+'html/tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile(helper.PATH+'html/draw.html'));
app.get('/info', (req,res) =>  res.json(process.env) );



// POSTS //
app.post('/images/search', (req,res) => {
    sql.call((con) => {
        sql.get_img(con, req.body, (err, result) => res.json(result));
    });
});

app.post('/images/data', (req,res) => {
    helper.get_img_from_file(req.body, (err) => res.json(req.body));
});

app.post('/images/save', (req,res) => {
    
    let body = req.body;
    if (!SQL_ENABLE) {
        if (body.img_path.length === 0) helper.get_rand_path(body);
        helper.write_img_to_file(body, (err, result) => {
            res.json(body);
        });
        return;
    }

    if (body.img_path.length === 0)
        sql.call( (con) => helper.handle_new_image(con, body, res));
    else
        sql.call( (con) => helper.handle_update_img(con, body, res));

});
