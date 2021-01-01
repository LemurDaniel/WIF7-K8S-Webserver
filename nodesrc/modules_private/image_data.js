const fs = require('fs');
const crypto = require('crypto');
const routes =  require('express').Router();
const sql = require('./sql_calls');
const schema = require('./joi_models');
const { auth, auth2 } = require('./user_auth');
const { user } = require('./joi_models');


// Constants
const PATH = '/var/project/src/public/';
const DOODLES = PATH+'assets/doodles/';
const WEB_JSON = PATH+'assets/other/web.json';
const TRANSLATION = PATH+'assets/other/translation.json';
const TRANSLATION_ENG = PATH+'assets/other/class_names.txt';
const TRANSLATION_DE = PATH+'assets/other/class_names_german.txt';

fs.readFile(WEB_JSON, 'utf8', (err, data) => {
    if(err === null) return;
    fs.writeFile(WEB_JSON, '', () => {});
});

/* Create Translation File  */
fs.readFile(TRANSLATION, 'utf8', (err, data) => {
    if(err === null) return;
    const de = fs.readFileSync(TRANSLATION_DE, 'utf8').split('\r\n');
    const eng = fs.readFileSync(TRANSLATION_ENG, 'utf8').split('\r\n');
    const replace = { 'ä': 'ae', 'ö': 'oe', 'ü': 'ue' }
 
    const translation = {};
    for (let i = 0; i < eng.length; i++) {
        if(!eng[i]) continue;
        translation[eng[i]] = de[i];  
        Object.keys(replace).forEach(rp => {
            translation[eng[i]] = translation[eng[i]].split(rp).join(replace[rp]);
        });
    }
    fs.writeFileSync(TRANSLATION, JSON.stringify(translation, null, 4));
});



var func = {};

func.WEB = WEB_JSON;

func.TRANSLATION = TRANSLATION;

func.DOODLES = DOODLES;

func.PATH = PATH

func.HTML = (str) => PATH+'html/'+str+'.html';


// Write posted image to shared volume (todo env for shared volume path?)
func.write_img_to_file = (body, callback) => {

    // Get base64 Data
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



// Handling everything todo when new image is post to server
func.handle_new_image = (con, body,res) => {
   
    // Convert random 8Bytes to hex: 2^64 or 16^16 possible permutations
    body.img_path = crypto.randomBytes(8).toString('hex')+'.png';

    sql.insert_img(con, body, (err, result) => {

        if(err) {
            // if entry already exists just retry. It's so rare it will practically never happen
            if(err && err.code == 'ER_DUB_ENTRY') return func.handle_new_image(con, body, res);
            else return res.status(400).send('Something went wrong');
        }
       
        
        // sql.insert_into_ml5(con, result.insertId, body.ml5);
        
        func.write_img_to_file(body, (err, result) => {
            res.status(200).json({ img_path: body.img_path });
        });
    });
}


// Handling everything todo when existiting image on server is to be updated
func.handle_update_img = (con, body, res) => {  
    sql.update_img(con, body, (err, result) => {
                       
        if(err) return res.status(400).send({ err: 'Something went wrong' });;
        func.write_img_to_file(body, (err) => {
            res.status(200).json({ img_path: body.img_path });
        });
    });
}



// POSTS //
routes.post('/images/search', (req,res) => {
    sql.call((con) => {
        sql.get_img(con, req.body, (err, result) => {
            if(err) return res.json({ err: 'Something went wrong' });
            const hex = crypto.randomBytes(8).toString('hex');
            res.json( { key: hex, images: result } );
        });
    });
});

routes.post('/images/save', auth, (req,res) => {
    
    let body = req.body;
    const validated = schema.image.validate(body);
    if(validated.error) return res.status(400).json(schema.error(validated.error));
    
    sql.call( (con) => {      
        if (body.img_path.length === 0)
            func.handle_new_image(con, body, res);
        else
            func.handle_update_img(con, body, res);  
    });

});

/* Obsolete */
routes.post('/images/data', auth, (req,res) => {

    if(!req.body) return res.status(400).send('No Body');

    fs.readFile(DOODLES+req.body.img_path, 'base64', (err, data) =>{
        
        if(err) return res.status(404).send('Not Found');
        res.status(200).json({img_data: data});
    })
});

/* Testing */
routes.post('/images/delete', auth2, (req, res) => {
    sql.call( con => {
        sql.delete_img(con, req.body.img_path, (err, result) => {
            if(err) return res.json(err);
            else {
                fs.unlink(DOODLES+req.body.img_path, (err) => {
                    return res.json({ sql: result, fs: err});
                });
            }
        
        })
    });
})

// For Testing //
routes.get('/images/export/db', auth2, (req, res) => {
    sql.call( con => {
        const exp = {};
        sql.export_users(con, (err, users) => {
        sql.export_images(con, (err, images) => {
            exp.images = images;
            exp.users = users;
            res.json(exp);
        })
        });
    })    
})

routes.post('/images/import/db', auth2, (req, res) => {

    sql.call( con => {
        const body = req.body;
        const info = {};
        sql.import_users(con, body.users, (info_users) => {
        sql.import_images(con, body.images, (info_images) => {
            info.users = info_users;
            info.images = info_images;
            res.json(info);
        })
        });
    })    
})

routes.get('/images/export/data', auth2, (req, res) => {

    const data = [];
    fs.readdirSync(DOODLES).forEach(file => {
        if(file.includes('.info')) return;
        const base64 = fs.readFileSync(DOODLES+file, 'base64');
        data.push( { img_path: file, img_data: base64 } );
    });
    res.json(data);
})

routes.post('/images/import/data', auth2, (req, res) => {

    const data = req.body;
    const info = { done: [], err: [] };
    data.forEach(file => {
        try { 
            fs.writeFileSync(DOODLES+file.img_path, file.img_data, 'base64');
            info.done.push(file.img_path);
        } catch (err) { info.err.push(err) }
    });
    res.json(info);
})

module.exports = { helper: func, image_routes: routes }
