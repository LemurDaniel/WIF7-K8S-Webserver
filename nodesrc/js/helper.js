const fs = require('fs');
const sql = require('./sql_calls');


// Constants
const PATH = '/var/project/src';
const DOODLES = PATH+'/assets/doodles/';
const WEB_JSON = PATH+'/assets/doodles/web.json';
const TRANSLATION = PATH+'/assets/other/translation.json';
const TRANSLATION_ENG = PATH+'/assets/other/class_names.txt';
const TRANSLATION_DE = PATH+'/assets/other/class_names_german.txt';

fs.readFile(WEB_JSON, 'utf8', (err, data) => {
    if(err === null) return;
    fs.writeFile(WEB_JSON, '', () => {});
});

/* Create Translation File  */
fs.readFile(TRANSLATION, 'utf8', (err, data) => {
    if(err === null) return;
    let de = fs.readFileSync(TRANSLATION_DE, 'utf8').split('\r\n');
    let eng = fs.readFileSync(TRANSLATION_ENG, 'utf8').split('\r\n');

    var translation = {};
    for (let i = 0; i < eng.length; i++) {
        translation[eng[i]] = de[i];  
    }
    fs.writeFileSync(TRANSLATION, JSON.stringify(translation, null, 4));
});

var func = {};

func.WEB = WEB_JSON;

func.TRANSLATION = TRANSLATION;

func.DOODLES = DOODLES;

func.PATH = PATH;


// Write postet image to shared volume (todo env for shared volume path?)
func.write_img_to_file = (body, callback) => {

    // Get base64 Data and define path
    let base64 = body.img_data.replace(/^data:image\/png;base64,/, "");
    body.img_data = '';

    // Write image to file
    fs.writeFile(DOODLES+body.img_path, base64, 'base64', (err) => {

        callback(err);
        
        // Write to JSON-File
        let file = fs.readFileSync(WEB_JSON, 'utf-8');

        // If file is empty, initialize json as Object
        if(!file || file.length === 0) var json = {};
        else var json = JSON.parse(file);
            
        // Append new Data
        json[body.img_path] = body;        
        fs.writeFileSync(WEB_JSON, JSON.stringify(json, null, 4));
    });
}

// read image form shared volume on browser request
func.get_img_from_file = (body, callback) => {

    fs.readFile(DOODLES+body.img_path, 'base64', (err, data) =>{
        console.log(err)
        console.log(data);
        body.img_data = data;
        callback(err);
    })
}


// create a random unique path on shared volume
func.get_rand_path = (body) => {
    body.img_path = body.img_name.toLowerCase().replaceAll(' ','-');
    body.img_path += '-'+Math.floor(Math.random() * 2147483647)+'.png';
}


// Handling everything todo when new image is post to server
func.handle_new_image = (con, body,res) => {
    func.get_rand_path(body);
    sql.is_unique_path(con, body.img_path, (err, unique) => { 
            
        if(!unique) return;
        sql.insert_img(con, body, (err, result) => {

            if(err) return;
            sql.insert_into_ml5(con, result.insertId, body.ml5);
            func.write_img_to_file(body, (err, result) => {
                res.json(body);
            });
        });
    });
}


// Handling everything todo when existiting image on server is to be updated
func.handle_update_img = (con, body, res) => {  
    sql.update_img(con, body, (err, result) => {
                
        if(err) return;
        func.write_img_to_file(body, (err) => {
            res.json(body);
        });
    });
}

module.exports = func;
