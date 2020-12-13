// Load Modules //
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var cors = require('cors')
var fs = require('fs');

// Constants
const PATH = '/var/project/src/';
const CREATE_TABLE = './assets/other/createTable_Doodle.sql';
const DOODLES = './assets/doodles/';
const WEB_JSON = './assets/other/web.json';
const TRANSLATION = './assets/other/translation.json';
const TRANSLATION_ENG = './assets/other/class_names_space_seperated.txt';
const TRANSLATION_DE = './assets/other/class_names_german_space_seperated.txt';

/*
Create Translation File  */
fs.readFile(TRANSLATION_DE, 'utf8', (err, data) => {
    var g_arr = data.split(' ');

    fs.readFile(TRANSLATION_ENG, 'utf8', (err, data) => {
        var eng_arr = data.split(' ');

        var translation = {};
        for (let i = 0; i < eng_arr.length; i++) {
            translation[eng_arr[i]] = g_arr[i];  
        }
        fs.writeFile(TRANSLATION, JSON.stringify(translation), () => {});
    });
});
//*/

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
fs.readFile(CREATE_TABLE, (err, data) => { SQL_Create_Img = data });


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
app.get('/', (req,res) => res.sendFile(PATH+'draw.html'));
app.get('/translation', (req,res) => res.sendFile(PATH+TRANSLATION));
app.get('/rocket', (req,res) => res.sendFile(PATH+'rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile(PATH+'tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile(PATH+'draw.html'));

// POST //
app.post('/data', function(req,res){
    
    // Get base64 Data and define path
    let base64 = req.body.img_data.replace(/^data:image\/png;base64,/, "");
    if (req.body.img_path.length === 0){
        req.body.img_path = req.body.img_name.toLowerCase()+'-'+Math.floor(Math.random() * 2147483647)+'.png';
    }

    // Write image to file
    fs.writeFile(DOODLES+req.body.img_path, base64, 'base64', (err) => {

        // Write to JSON-File
        // TODO - Replace with Database-Calls
        fs.readFile(WEB_JSON, (err, data) => {

            // If file is empty, initialize json as array
            if(data.length === 0) var json = {};
            else var json = JSON.parse(data);
            
            // Append new Data
            req.body.img_data = '';
            json[req.body.img_path] = req.body;        

            fs.writeFile(WEB_JSON, JSON.stringify(json), (err, data) => res.json(req.body));
        });    

    });
    //res.json(req.body);
});

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf