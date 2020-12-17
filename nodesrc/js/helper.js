const fs = require('fs');


// Constants
const PATH = '/var/project/src/';
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
        if(file.length === 0) var json = {};
        else var json = JSON.parse(data);
            
        // Append new Data
        json[body.img_path] = body;        
        fs.writeFileSync(WEB_JSON, JSON.stringify(json, null, 4));
    });
}

module.exports = func;
