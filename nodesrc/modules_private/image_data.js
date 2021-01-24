const fs = require('fs');
const crypto = require('crypto');
const routes =  require('express').Router();
const sql = require('./sql_calls');
const schema = require('./joi_models');
const { auth, auth2, enc, dec } = require('./user_auth');
const { user } = require('./joi_models');
const user_auth = require('./user_auth');


// Constants
const PATH = '/var/project/src/public/';
const DOODLES = PATH+'assets/doodles/';
const TRANSLATION = PATH+'assets/other/translation.json';
const TRANSLATION_ENG = PATH+'assets/other/class_names.txt';
const TRANSLATION_DE = PATH+'assets/other/class_names_german.txt';

const CACHE = PATH+'assets/doodles/cache/';
const TTL = process.env.CACHE_TTL || 10; //seconds
if(!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);

function read_cache(func, arguments) {
    param = Object.values(arguments).join('').toLowerCase();
    key = CACHE+func + '-' + param + '.json';

    if(fs.existsSync(key)) {
        try{
            cached_val = JSON.parse(fs.readFileSync(key));
            if (cached_val && cached_val.exp > Date.now()) return cached_val.content;
        }catch(err){}
    } 
    return null;
}

function write_cache(func, arguments, data) {
    param = Object.values(arguments).join('').toLowerCase();
    key = CACHE+func + '-' + param + '.json';

    const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('base64'); // identifies changes in result
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
        const obj = { key: data.hash };
        if( !key_sent || obj.key != key_sent ) obj.images = data.data;
        res.json( obj )
    }

    const cached = read_cache('search', param);
    if(cached) return send_data(cached);

    sql.get_img(sql.pool, param, (err, result) => {
        if(err) return res.json({ err: 'Something went wrong' });

        const obj = write_cache('search', param, result);
        return send_data(obj);
    });
});


routes.post('/images/save', auth, (req,res) => {
    
    const body = req.body;
    const validated = schema.image.validate(body);
    if(validated.error) return res.status(400).json(schema.error(validated.error));
      
    const base64 = body.img_data.replace(/^data:image\/png;base64,/, '');
    const sql_method = (body.img_path.length == 0 ? sql.insert_img : sql.update_img);

    if(body.img_path.length == 0) // Convert random 8Bytes to hex: 2^64 or 16^16 possible permutations
        body.img_path = crypto.randomBytes(8).toString('hex')+'.png';

    fs.writeFile(DOODLES+body.img_path, base64, 'base64', (err) => {
        if (err) return res.status(500).json({ err: 'Something went wrong' });

        const func = (i) => sql_method(sql.pool, body, (sql_err, result) => {
            if(!sql_err) return res.status(200).json({ img_path: body.img_path });
            else if(i) return func(i-1);
            res.status(500).json( { err: 'Something went wrong' }); 
            fs.unlink(body.img_path, () => null);
        });
        func(5); // trie 5 times
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
    sql.delete_img(sql.pool, req.body.img_path, (err, result) => {
        if(err) return res.json(err);
        else    fs.unlink(DOODLES+req.body.img_path, (err) => res.json({ sql: result, fs: err}) );   
    })
})

// For Testing //
routes.get('/images/export/db', auth2, (req, res) => {

    const exp = {};
    sql.call( null, (con, end) => {
        sql.export_users(con, (err, users) => {
        sql.export_images(con, (err, images) => {
            end();
            exp.images = images;
            exp.users = users;
            res.json(exp);
        })
        });
    })    
})

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

routes.get('/images/export/data', auth2, (req, res) => {

    const data = [];
    fs.readdirSync(DOODLES).forEach(file => {
        if(file.includes('.info')) return;
        const base64 = fs.readFileSync(DOODLES+file, 'base64');
        data.push( { img_path: file, img_data: base64 } );
    });

    const date = new Date().toISOString().replace('T', '--').split(':').join('-').split('.')[0];
    const path = DOODLES+'IMG_EXPORT-'+date+'.json';
    fs.writeFileSync(path, JSON.stringify(data),'utf-8');
    res.sendFile(path);
})

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
