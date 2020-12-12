// Load Modules //
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var cors = require('cors')
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
fs.readFile('./sql/createTable_Doodle.sql', (err, data) => { SQL_Create_Img = data });
//fs.close();


// Define SQL Statements
const SQL_Exists_Key =    'Select * From '+TABLE_Img+' where name_key = ?';
const SQL_insert_img =    'Insert Into  '+TABLE_Img+
                        ' (name_key, by_user, ml5_name, other_ml5_names) Values (?, ?, ?, ?)';



//Create Server//
var app = express();
app.use(express.static("/var/project/src"));
app.use(bodyParser.json());
app.use(cors());

var server = http.createServer(app)
server.listen(3000);

// GET //
app.get('/', (req,res) => res.sendFile('/var/project/src/draw.html'));
app.get('/rocket', (req,res) => res.sendFile('/var/project/src/rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile('/var/project/src/tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile('/var/project/src/draw.html'));

// POST //
app.post('/data', function(req,res){
    
    console.log(req.body);
    fs.readFile('web.json', (err, data) => {
        console.log(err+'\n\n'+data)
        if(data.length === 0) var json = [];
        else var json = JSON.parse(data);
        json.push(req.body);
        console.log(json);
        fs.writeFile('web.json', JSON.stringify(data), (err, data) => console.log(err+'\n\n'+data));
    });

    res.json(req.body);
});

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf

  //ACIOS to call HTTP from Browser
 // https://www.freecodecamp.org/news/here-is-the-most-popular-ways-to-make-an-http-request-in-javascript-954ce8c95aaa/