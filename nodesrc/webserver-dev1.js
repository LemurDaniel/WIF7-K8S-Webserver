// Load Modules //
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var mysql = require('mysql');
var cors = require('cors')
var fs = require('fs');

/*
Create Translation File  */
fs.readFile('./js/model-tfjs/class_names_german_space_seperated.txt', 'utf8', (err, data) => {
    var german = data;
    //console.log(data);
    var g_arr = data.split(' ');
    //console.log(g_arr);

    fs.readFile('./js/model-tfjs/class_names_space_seperated.txt', 'utf8', (err, data) => {
        var eng = data;
        var eng_arr = data.split(' ');
        //console.log(eng_arr);

        var translation = {};
        for (let i = 0; i < eng_arr.length; i++) {
            translation[eng_arr[i]] = g_arr[i];
            //console.log(translation);  
        }
        fs.writeFile('./js/model-tfjs/english_german_map.json', JSON.stringify(translation), (err, data) => console.log(data));
    });
});
//*/

// Get Environment Variables
const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;

const PATH = '/var/project/src/';

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
app.get('/translation', (req,res) => res.sendFile(PATH+'js/model-tfjs/english_german_map.json'));
app.get('/rocket', (req,res) => res.sendFile(PATH+'rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile(PATH+'tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile(PATH+'draw.html'));

// POST //
app.post('/data', function(req,res){
    
    // Get base64 Data and define path
    let base64 = req.body.img_data.replace(/^data:image\/png;base64,/, "");
    let path = 'pics/'+Math.floor(Math.random() * 2147483647)+'.png';

    // Write image to file
    fs.writeFile(path, base64, 'base64', (err) => {
        
        // Replace img_data with path where image is saved
        if(err) req.body.img_data = null;
        else req.body.img_data = path; 

        // Write to JSON-File
        // TODO - Replace with Database-Calls
        fs.readFile('web.json', (err, data) => {

            // If file is empty, initialize json as array
            if(data.length === 0) var json = [];
            else var json = JSON.parse(data);
            
            // Append new Data
            json.push(req.body);
            fs.writeFile('web.json', JSON.stringify(json), (err, data) => res.json(json));
        });    

    });
    //res.json(req.body);
});

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf