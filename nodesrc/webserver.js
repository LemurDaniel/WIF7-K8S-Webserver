// Load Modules //
const http = require('http');
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

// Get Environment Variables
const SERVER_PORT = 3000;

// Initialize DB
if(SQL_ENABLE) setTimeout(() => sql.init_Database(helper.DOODLES), 1000);


//Create Server//
var app = express();
app.use(express.static("/var/project/src"));
app.use(bodyParser.json());
app.use(cors());

var server = http.createServer(app)
server.listen(SERVER_PORT);

/*
// Catch 404 and forward to error handler //
app.use((req, res, next) => {
    next(createError(404));
});*/

// GET //
app.get('/', (req,res) => res.sendFile(helper.PATH+'draw.html'));
app.get('/web', (req,res) => res.sendFile(helper.WEB));
app.get('/translation', (req,res) => res.sendFile(helper.TRANSLATION));
app.get('/rocket', (req,res) => res.sendFile(helper.PATH+'rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile(helper.PATH+'tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile(helper.PATH+'draw.html'));



// POST //
func_get_rand_path = (body) => {
    body.img_path = body.img_name.toLowerCase().replaceAll(' ','-');
    body.img_path += '-'+Math.floor(Math.random() * 2147483647)+'.png';
}

app.post('/data', function(req,res){
    
    let body = req.body;
    if (!SQL_ENABLE) {
        if (body.img_path.length === 0) func_get_rand_path(body);
        helper.write_img_to_file(body, (err, result) => {
            res.json(body);
        });
        return;
    }

    let con = sql.getCon();

    con.connect( (err) => {
    // When new Image
        if (body.img_path.length === 0){

            func_get_rand_path(body);
            sql.is_unique_path(con, body.img_path, (err, unique) => { 
                if(!unique) return;

                sql.insert_img(con, body, (err, result) => {
 
                    // 
                    if(err) return;
                    helper.write_img_to_file(body, (err, result) => {
                        res.json(body);
                    });
                });
            });

    // Update Existing Image
        } else {

            sql.update_img(con, body, (err, result) => {
                
                if(err) return;
                helper.write_img_to_file(body, (err, result) => {
                    res.json(body);
                });
            });
        }

    });

});


//*/

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf