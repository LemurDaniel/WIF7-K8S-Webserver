// Load Modules //
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var fs = require('fs');

// Get Environment Variables
const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;


// MYSQL General Config
function getCon(){
    return mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER,
        password: SQL_PASSWORD,
        database: SQL_DATABASE
    });
}

// Tables
let tmp;

var TABLE_Img = "doodles";
var SQL_Create_Img;
fs.readFile('./sql/CreateTable_Doodle.sql', (err, data) => { SQL_Create_Img = data });


// Define SQL Statements
const SQL_Exists_Key =    'Select * From '+TABLE_Img+' where name_key = ?';
const SQL_insert_img =    'Insert Into  '+TABLE_Img+
                        ' (name_key, by_user, ml5_name, other_ml5_names) Values (?, ?, ?, ?)';



//Create Server//
var app = express();
app.use(express.static(path.join(__dirname,'./')));
app.use(bodyParser.json());

var server = http.createServer(app)
server.listen(3000);

// GET //
app.get('/', function(req,res){
     res.sendFile('./index.html');
  });


// POST //
app.post('/data', function(req,res){
    
    console.log(req.body);

    let con = getCon();
    con.connect((err) => {
        func_is_unique_key(con, 10, (rand) => {
            
            con.query(SQL_insert_img,[
                rand,
                req.body.user,
                req.body.ml5,
                req.body.other_ml5
            ],(error, result) => {
                console.log(error);
                console.log(result);
            });
            res.end("kkkk");
        });
    });
});

function func_is_unique_key(con, tries, func){
    if(tries <= 0) func("err");
    let unique = false;
    let rand = Math.floor(Math.random() * 2147483647);
    con.query(SQL_Exists_Key, [rand], function (error, result, fields) {
        console.log(result);
        if(result.length === 0) func(rand);
        else func_is_unique_key(con, tries-1);
    });
}

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf

  //ACIOS to call HTTP from Browser
 // https://www.freecodecamp.org/news/here-is-the-most-popular-ways-to-make-an-http-request-in-javascript-954ce8c95aaa/