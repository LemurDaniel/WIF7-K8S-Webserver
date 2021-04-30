const fs = require('fs');
const crypto = require('crypto');
const routes =  require('express').Router();

const sql = require('./sql_calls');
const schema = require('./joi_models');
const { auth, auth2, enc, dec } = require('./user_auth');
const { user } = require('./joi_models');


// Constants
const PATH = '/var/project/src/public/';
const DOODLES = PATH+'assets/doodles/';
const TRANSLATION = PATH+'assets/other/translation.json';
const TRANSLATION_ENG = PATH+'assets/other/class_names.txt';
const TRANSLATION_DE = PATH+'assets/other/class_names_german.txt';
const CACHE = PATH+'assets/doodles/cache/';
const TTL = process.env.CACHE_TTL || 10; //seconds

// create chache folder if non-existant
if(!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);

// read cache from folder
// each search request consisting of 'image class', 'image name' and 'user name' is encoded in one filename
function read_cache(func, arguments) {
    param = Object.values(arguments).join('').toLowerCase();
    key = CACHE+func + '-' + param + '.json';

    if(fs.existsSync(key)) {
        try{
            // read existing cache and check if it's expired
            cached_val = JSON.parse(fs.readFileSync(key));
            if (cached_val && cached_val.exp > Date.now()) return cached_val.content;
        }catch(err){}
    } 
    return null;
}

// write to cache file in folder
// conditions like one container writing shortly after another container has read its content
// which causes it to therefore operate on stale data and then search the database again
// can be ignored. Regardless of that the cache file will always be overwritten with a valid entry.
function write_cache(func, arguments, data) {
    param = Object.values(arguments).join('').toLowerCase();
    key = CACHE+func + '-' + param + '.json';

    // hash identifies changes in result
    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('base64'); 
    const object = { hash: hash, data: data };
    const cached_val = JSON.stringify({ exp: Date.now()+(TTL*1000), content: object }, null, 4);
    fs.writeFile(key, cached_val, (err) => {});

    return object;
}

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

func.TRANSLATION = TRANSLATION;

func.DOODLES = DOODLES;

func.PATH = PATH

func.HTML = (str) => PATH+'html/'+str+'.html';


// POSTS //
routes.post('/images/search', (req,res) => {

    const param = req.body.param;
    const key_sent = req.body.key;

    const send_data = (data) => {
        // the hash key detects changes in the search result
        // When repeated searches with the same parameter  are done but no previous change in the database occured
        // the website conatainer with the images won't be updated.
        const obj = { key: data.hash };
        if( !key_sent || obj.key != key_sent ) obj.images = data.data;
        res.json( obj )
    }

    // check cache before searching the database
    const cached = read_cache('search', param);
    if(cached) return send_data(cached);

    // search database for images according to search parameters
    sql.get_img(sql.pool, param, (err, result) => {
        if(err) return res.json({ err: 'Something went wrong' });

        // write results to cache
        const obj = write_cache('search', param, result);
        return send_data(obj);
    });
});


routes.post('/images/save', auth, (req,res) => {
    
    // get json body from post request
    const body = req.body;

    // validate json body
    const validated = schema.image.validate(body);
    if(validated.error) return res.status(400).json(schema.error(validated.error));
      
    // get pure base64 image date out of image date string in json body
    const base64 = body.img_data.replace(/^data:image\/png;base64,/, '');

    // choose whether to insert a new image or update an existing image
    // the image_path is the primary key of all images in the database
    // if one is provided in the post request then update the corresponding image in the database
    const sql_method = (body.img_path.length == 0 ? sql.insert_img : sql.update_img);

    // Convert random 8_Bytes to a hex string: 2^64 or 16^16 possible permutations
    if(body.img_path.length == 0) 
        body.img_path = crypto.randomBytes(8).toString('hex')+'.png';


    // write the image data to a file in the filesystem
    fs.writeFile(DOODLES+body.img_path, base64, 'base64', (err) => {
        
        // if image couldn't be saved in filesystem throw send back an error
        if (err) return res.status(500).json({ err: 'Something went wrong' });

        // if image was saved succesfully define the function to write its metadata into the database
        const func = (i) => sql_method(sql.pool, body, (sql_err, result) => {
            // send back status 200 when metadata was saved succesfully
            if(!sql_err) return res.status(200).json({ img_path: body.img_path });
            // attempt another trie if failed
            else if(i) return func(i-1);

            // when metadata couldn't be saved, send back 500
            res.status(500).json( { err: 'Something went wrong' }); 
            fs.unlink(body.img_path, () => null);
        });
        func(5); // trie 5 times
    });

});




/* Testing */
// delete metadate of an existing image from the database via a post request
routes.post('/images/delete', auth2, (req, res) => {
    sql.delete_img(sql.pool, req.body.img_path, (err, result) => {
        if(err) return res.json(err);
        else    fs.unlink(DOODLES+req.body.img_path, (err) => res.json({ sql: result, fs: err}) );   
    })
})

// Send back all database entries encoded in json //
routes.get('/images/export/db', auth2, (req, res) => {

    const exp = {};
    sql.call( null, (con, end) => {
        sql.export_users(con, (err, users) => {
        sql.export_images(con, (err, images) => {
        sql.export_scores(con, (err, scores) => {
            end();
            exp.images = images;
            exp.users = users;
            exp.scores = scores;
            res.json(exp);
        })
        })
        });
    })    
})

// Import json as entries in the database //
routes.post('/images/import/db', auth2, (req, res) => {

    const body = req.body;
    const info = {};
    sql.call( null, (con, end) => {
        sql.import_users(con, body.users, (info_users) => {
        sql.import_images(con, body.images, (info_images) => {
            end();
            info.users = info_users;
            info.images = info_images;
            res.json(info);
        })
        });
    })    
})

// Export image data from the filesystem into json //
routes.get('/images/export/data', auth2, (req, res) => {

    const data = [];
    fs.readdirSync(DOODLES).forEach(file => {
        if(file.includes('.info') || file == 'cache') return;
        const base64 = fs.readFileSync(DOODLES+file, 'base64');
        data.push( { img_path: file, img_data: base64 } );
    });

    const date = new Date().toISOString().replace('T', '--').split(':').join('-').split('.')[0];
    const path = DOODLES+'IMG_EXPORT-'+date+'.json';
    fs.writeFileSync(path, JSON.stringify(data),'utf-8');
    res.sendFile(path);
})

// Import image data from json into the filesystem //
routes.post('/images/import/data', auth2, (req, res) => {

    let data = req.body;
    if(data.data_path) data = JSON.parse(fs.readFileSync(DOODLES+data.data_path, 'utf-8'));

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