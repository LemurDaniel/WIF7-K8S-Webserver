// Load Modules //
var http = require('http');
var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var cors = require('cors')
var fs = require('fs');

// Get Environment Variables
const SERVER_PORT = 3000;
const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;
const SQL_ENABLE = (process.env.SQL_ENABLE == 'true' ? true:false); 

console.log('SQL: '+SQL_ENABLE);

// Constants
const PATH = '/var/project/src/';
const CREATE_TABLE = './assets/other/createTable_Doodle.sql';
const DOODLES = './assets/doodles/';
const WEB_JSON = './assets/doodles/web.json';
const TRANSLATION = './assets/other/translation.json';
const TRANSLATION_ENG = './assets/other/class_names_space_seperated.txt';
const TRANSLATION_DE = './assets/other/class_names_german_space_seperated.txt';

// Define SQL Statements
const MAX_TRIES = 10;
const TABLE_IMG = 'doodles5';
const SQL_CREATE_TABLE =   'create table '+TABLE_IMG+' ( '+
                            'img_id int NOT NULL PRIMARY KEY AUTO_INCREMENT,'+
                            'img_path nvarchar(50) unique,'+
                            'img_name nvarchar(50),'+
                            'user nvarchar(25),'+
                            'ml5_bestfit nvarchar(15),'+
                            'ml5_bestfit_conf Decimal(20,19),'+
                            'ml5 text )';

const SQL_IS_UNIQUE =       'Select img_id From '+TABLE_IMG+' where img_path = ?';

const SQL_INSERT_IMG =      'Insert Into  '+TABLE_IMG+
                            ' (img_path, img_name, user, ml5_bestfit, ml5_bestfit_conf, ml5) Values (?, ?, ?, ?, ?, ?)';

const SQL_UPDATE_IMG =      'Update '+TABLE_IMG+' Set '+
                            'img_name = ?, ml5_bestfit = ?, ml5_bestfit_conf = ?, ml5 = ?'+
                            ' Where img_path = ?';


// MYSQL General Config
function getCon(){
    return mysql.createConnection({
        host: SQL_HOST,
        user: SQL_USER,
        password: SQL_PASSWORD,
        database: SQL_DATABASE
    });
}




//Create Server//
var app = express();
app.use(express.static("/var/project/src"));
app.use(bodyParser.json());
app.use(cors());

var server = http.createServer(app)
server.listen(SERVER_PORT);

// GET //
app.get('/', (req,res) => res.sendFile(PATH+'draw.html'));
app.get('/translation', (req,res) => res.sendFile(PATH+TRANSLATION));
app.get('/rocket', (req,res) => res.sendFile(PATH+'rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile(PATH+'tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile(PATH+'draw.html'));

// POST //
func_get_rand_path = (body) => body.img_path = body.img_name.toLowerCase().replace(' ','-')+'-'+Math.floor(Math.random() * 2147483647)+'.png';

app.post('/data', function(req,res){
    
    let body = req.body;
    if (!SQL_ENABLE) {
        if (body.img_path.length === 0) func_get_rand_path(body);
        func_write_img_to_file(body, (err, result) => {
            res.json(body);
        });
        return;
    }

    let con = getCon();

    con.connect( (err) => {
    // When new Image
        if (body.img_path.length === 0){

            func_is_unique_path(con, MAX_TRIES, body, () => {   
                func_insert_img(con, body, (err, result) => {
                    console.log(err);
                    if(err) return;
                    func_write_img_to_file(body, (err, result) => {
                        res.json(body);
                    });
                });
            });

        // Update Existing Image
        } else {

            func_update_img(con, body, (err, result) => {
                console.log(err);
                if(err) return;
                func_write_img_to_file(body, (err, result) => {
                    res.json(body);
                });
            });
        }

    });

});

function func_is_unique_path(con, tries, body, callback){
    if(tries <= 0) return;

    let unique = false;
    func_get_rand_path(body);
    console.log(body.img_path);
    con.query(SQL_IS_UNIQUE, [body.img_path], function (error, result, fields) {
        console.log(result);
        console.log(error);
        if(result.length === 0) callback();
        else func_is_unique_path(con, tries-1);
    });
}

function func_insert_img (con, body, callback) {
    
    con.query(SQL_INSERT_IMG, 
        [body.img_path, 
        body.img_name, 
        body.user, 
        body.ml5_best_fit.label,
        body.ml5_best_fit.confidence,
        JSON.stringify(body.ml5)], 
        (error, result) => {
            console.log(result);
            callback(error, result);
    });
}

function func_update_img (con, body, callback) {
    
    con.query(SQL_UPDATE_IMG, 
        [body.img_name,
        body.ml5_best_fit.label,
        body.ml5_best_fit.confidence,
        JSON.stringify(body.ml5),
        body.img_path], 
        (error, result) => {
            console.log(result);
            callback(error, result);
    });
}

function func_write_img_to_file(body, callback){

    // Get base64 Data and define path
    let base64 = body.img_data.replace(/^data:image\/png;base64,/, "");
    body.img_data = '';

    // Write image to file
    fs.writeFile(DOODLES+body.img_path, base64, 'base64', (err) => {

        // Write to JSON-File
        fs.readFile(WEB_JSON, (err, data) => {

            // If file is empty, initialize json as Object
            if(data.length === 0) var json = {};
            else var json = JSON.parse(data);
            
            // Append new Data

            json[body.img_path] = body;        

            fs.writeFile(WEB_JSON, JSON.stringify(json), callback);
        });    

    });
}









//---------------------------------------
// Create table if not existent
init_Database = function() {

    // Check for file indicating initialization
    fs.readFile(DOODLES+TABLE_IMG+'_EXISTS.info', (err, data) => {
        // If file exists then return
        if(!err) return;
        // else create table
        let con = getCon();
        con.connect((err) => {     
            con.query(SQL_CREATE_TABLE,(error, result) => {
                fs.writeFile(DOODLES+TABLE_IMG+'_EXISTS.info', '', (err) => {});
                console.log(error);
                console.log(result);
            });
        });
    });
}
setTimeout(init_Database, 1000);

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

  // tutorial
  // https://medium.com/swlh/read-html-form-data-using-get-and-post-method-in-node-js-8d2c7880adbf