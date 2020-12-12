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

var s = "flashlight belt mushroom pond strawberry pineapple sun cow ear bush pliers watermelon apple baseball feather shoe leaf lollipop crown ocean horse mountain mosquito mug hospital saw castle angel underwear traffic_light cruise_ship marker blueberry flamingo face hockey_stick bucket campfire asparagus skateboard door suitcase skull cloud paint_can hockey_puck steak house_plant sleeping_bag bench snowman arm crayon fan shovel leg washing_machine harp toothbrush tree bear rake megaphone knee guitar calculator hurricane grapes paintbrush couch nose square wristwatch penguin bridge octagon submarine screwdriver rollerskates ladder wine_bottle cake bracelet broom yoga finger fish line truck snake bus stitches snorkel shorts bowtie pickup_truck tooth snail foot crab school_bus train dresser sock tractor map hedgehog coffee_cup computer matches beard frog crocodile bathtub rain moon bee knife boomerang lighthouse chandelier jail pool stethoscope frying_pan cell_phone binoculars purse lantern birthday_cake clarinet palm_tree aircraft_carrier vase eraser shark skyscraper bicycle sink teapot circle tornado bird stereo mouth key hot_dog spoon laptop cup bottlecap The_Great_Wall_of_China The_Mona_Lisa smiley_face waterslide eyeglasses ceiling_fan lobster moustache carrot garden police_car postcard necklace helmet blackberry beach golf_club car panda alarm_clock t-shirt dog bread wine_glass lighter flower bandage drill butterfly swan owl raccoon squiggle calendar giraffe elephant trumpet rabbit trombone sheep onion church flip_flops spreadsheet pear clock roller_coaster parachute kangaroo duck remote_control compass monkey rainbow tennis_racquet lion pencil string_bean oven star cat pizza soccer_ball syringe flying_saucer eye cookie floor_lamp mouse toilet toaster The_Eiffel_Tower airplane stove cello stop_sign tent diving_board light_bulb hammer scorpion headphones basket spider paper_clip sweater ice_cream envelope sea_turtle donut hat hourglass broccoli jacket backpack book lightning drums snowflake radio banana camel canoe toothpaste chair picture_frame parrot sandwich lipstick pants violin brain power_outlet triangle hamburger dragon bulldozer cannon dolphin zebra animal_migration camouflage scissors basketball elbow umbrella windmill table rifle hexagon potato anvil sword peanut axe television rhinoceros baseball_bat speedboat sailboat zigzag garden_hose river house pillow ant tiger stairs cooler see_saw piano fireplace popsicle dumbbell mailbox barn hot_tub teddy-bear fork dishwasher peas hot_air_balloon keyboard microwave wheel fire_hydrant van camera whale candle octopus pig swing_set helicopter saxophone passport bat ambulance diamond goatee fence grass mermaid motorbike microphone toe cactus nail telephone hand squirrel streetlight bed firetruck";
var res =  s.split(" ");
var s2 = '';
res.forEach(el => s2 += el+'<br>');
fs.writeFile('text.txt', JSON.stringify(json), (err, data) => res.json(json));

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
app.get('/', (req,res) => res.sendFile('/var/project/src/draw.html'));
app.get('/rocket', (req,res) => res.sendFile('/var/project/src/rocket_game.html'));
app.get('/tictactoe', (req,res) => res.sendFile('/var/project/src/tictactoe.html'));
app.get('/draw', (req,res) => res.sendFile('/var/project/src/draw.html'));

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