const fs = require('fs');


// Constants
const PATH = '/var/project/src/';
const DOODLES = PATH+'/assets/doodles/';
const WEB_JSON = PATH+'/assets/doodles/web.json';
const TRANSLATION = PATH+'/assets/other/translation.json';
const TRANSLATION_ENG = PATH+'/assets/other/class_names_space_seperated.txt';
const TRANSLATION_DE = PATH+'/assets/other/class_names_german_space_seperated.txt';

fs.readFile(WEB_JSON, 'utf8', (err, data) => {
    if(err === null) return;
    fs.writeFile(WEB_JSON, '', () => {});
});

/* Create Translation File  */
fs.readFile(TRANSLATION, 'utf8', (err, data) => {
    if(err === null) return;
    fs.readFile(TRANSLATION_DE, 'utf8', (err, data) => {

        var g_arr = data.split(' ');

        fs.readFile(TRANSLATION_ENG, 'utf8', (err, data) => {
            var eng_arr = data.split(' ');

            var translation = {};
            for (let i = 0; i < eng_arr.length; i++) {
                translation[eng_arr[i]] = g_arr[i];  
            }
            fs.writeFile(TRANSLATION, JSON.stringify(translation, null, 4), () => {});
        });
    });
});

var func = {};

func.WEB = WEB_JSON;

func.TRANSLATION = TRANSLATION;

func.DOODLES = DOODLES;

func.PATH = PATH;

func.write_img_to_file = (body, callback) => {

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

            fs.writeFile(WEB_JSON, JSON.stringify(json, null, 4), callback);
        });    

    });
}

module.exports = func;
