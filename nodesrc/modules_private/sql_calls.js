const mysql = require('mysql');
const fs = require('fs');

const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;
const CON_LIMIT = 15;


const TABLE_IMG = process.env.SQL_TABLE_NAME;
const TABLE_ML5 = TABLE_IMG+'_ml5';
const TABLE_USER = TABLE_IMG+'_user';
const TABLE_SCORE = TABLE_IMG+'_score';
const MIN_CONF = 0.05;

const game1 = 'ASTO';

const SQL_CREATE_USER =     'create table '+TABLE_USER+' ( '+
                            'user_id nchar(16) PRIMARY KEY,'+
                            'username nvarchar(50) NOT NULL unique,'+
                            'username_display nvarchar(50) NOT NULL unique,'+
                            'bcrypt BINARY(60) NOT NULL ) ';

const SQL_CREATE_SCORE =    'create table '+TABLE_SCORE+' ( '+
                            'user_id nchar(16) NOT NULL,'+
                            'score int NOT NULL, '+
                            'timestamp nvarchar(64) NOT NULL, '+
                            'gamename nchar(4) NOT NULL, '+
                            'FOREIGN KEY(user_id) REFERENCES '+TABLE_USER+'(user_id) ,'+
                            'CONSTRAINT pk_score PRIMARY KEY (user_id,timestamp) )';

const SQL_CREATE_IMG =      'create table '+TABLE_IMG+' ( '+
                            'img_id int NOT NULL PRIMARY KEY AUTO_INCREMENT,'+
                            'user_id nchar(16) NOT NULL,'+
                            'img_path nchar(20) NOT NULL unique,'+
                            'img_name nvarchar(50),'+
                            'ml5_bestfit nvarchar(25),'+
                            'ml5_bestfit_conf Decimal(20,19),'+
                            'ml5 text, '+
                            'FOREIGN KEY(user_id) REFERENCES '+TABLE_USER+'(user_id) )';

const SQL_CREATE_ML5 =      'create table '+TABLE_ML5+' ( '+
	                        'img_id int NOT NULL, '+
	                        'ml5 nvarchar(25), '+
	                        'ml5_confidence Decimal(20,19), '+
                            'FOREIGN KEY(img_id) REFERENCES '+TABLE_IMG+'(img_id) ) ';

const SQL_INSERT_IMG =      'Insert Into  '+TABLE_IMG+
                            ' (img_path, img_name, user_id, ml5_bestfit, ml5_bestfit_conf, ml5) '+
                            ' Values (?, ?, ?, ?, ?, ? )';

const SQL_UPDATE_IMG =      'Update '+TABLE_IMG+' Set '+
                            'img_name = ?, ml5_bestfit = ?, ml5_bestfit_conf = ?, ml5 = ?'+
                            ' Where img_path = ? AND user_id = ?';

const SQL_GET_IMG       =   'Select img_path, du.username_display, img_name, ml5_bestfit, ml5_bestfit_conf '+
                            ' from '+TABLE_IMG+
                            ' join '+TABLE_USER+' as du on '+TABLE_IMG+'.user_id = du.user_id'+
                            ' where '+
                            ' ml5_bestfit like ? And' +
                            ' img_name like ? And'+
                            ' du.username_display like ? '+
                            ' Order By ml5_bestfit_conf desc';

const SQL_DELETE_IMG     =   'Delete From '+TABLE_IMG+' where img_path = ?';

const SQL_INSERT_SCORE  =   'Insert Into '+TABLE_SCORE+
                            ' (user_id, timestamp, score, gamename) '+
                            ' Values ( ?, ?, ?, ? )';

const SQL_INSERT_ML5    =   'Insert Into '+TABLE_ML5+
                            ' (img_id, ml5, ml5_confidence) '+
                            ' Values ( ?, ?, ? )';

const SQL_INSERT_USER    =  'Insert Into '+TABLE_USER+
                            ' (user_id, username, username_display, bcrypt) '+
                            ' Values ( ?, ?, ?, ? )';

const SQL_GET_HASH    =     'select user_id, username_display, bcrypt from '+TABLE_USER+
                            ' where username = ?';


func = {};

    func.pool = mysql.createPool({
        connectionLimit : CON_LIMIT,
        host: SQL_HOST,
        user: SQL_USER,
        password: SQL_PASSWORD,
        database: SQL_DATABASE
      });

    func.call = (err_callback, method) =>  {
        if(err_callback == null) err_callback = (err) => console.log(err);

        func.pool.getConnection( (err, con) => {
            if(err) err_callback(err);
            else method(con, () => con.release() );
        });
    }

    func.insert_score = (con, body, callback) => con.query(SQL_INSERT_SCORE, [body.user.id, Date.now(), body.score, game1], callback);

    func.delete_img = (con, img_path, callback) => con.query(SQL_DELETE_IMG, [img_path], callback);

    func.insert_img = (con, body, callback) => {

        con.query(SQL_INSERT_IMG, 
            [body.img_path, 
            body.img_name,
            body.user.id,
            body.ml5_bestfit.label,
            body.ml5_bestfit.confidence,
            JSON.stringify(body.ml5)], 
            callback);
    }

    func.update_img = (con, body, callback) => {
    
        con.query(SQL_UPDATE_IMG, 
            [body.img_name,
            body.ml5_bestfit.label,
            body.ml5_bestfit.confidence,
            JSON.stringify(body.ml5),
            body.img_path,
            body.user.id], 
            callback);
    }

    func.get_img = (con, params, callback) => {

        let img_name = params.img_name+'%';
        let user_display = params.user_searched+'%';
        let ml5_bestfit = params.ml5_bestfit+'%';

        if(!ml5_bestfit) ml5_bestfit = '%';
        if(!img_name) img_name = '%';
        if(!user_display) user_display = '%';

        con.query(SQL_GET_IMG,[
            ml5_bestfit,
            img_name,
            user_display],
            (err, res) => {
                if(err) return callback(err, null);
                
                let result = [];
                res.forEach(row => {
                    result.push({
                        img_path: row.img_path,
                        img_name: row.img_name,
                        user_display: row.username_display,
                        ml5_bestfit: {
                            label: row.ml5_bestfit,
                            confidence: row.ml5_bestfit_conf
                        }
                    });
                });
                callback(err, result);
            });
    }

    func.insert_into_ml5 = (con, img_id, ml5) => {

        for(let i=1; i<ml5.length; i++){
            if (ml5[i].confidence <= MIN_CONF) continue; //if smaller than MIN_CONF don't save

            con.query(SQL_INSERT_ML5, [
                img_id,
                ml5[i].label,
                ml5[i].confidence],
                (err, res) => {});
        }
    }


    func.insert_user = (con, user, callback) => {

        con.query(SQL_INSERT_USER, [
            user.id,
            user.username,
            user.username_display,
            user.bcrypt
        ], (err, res) => {
            callback(err, user);
        });
    }


    func.get_password_hash = (con, user, callback) => {

        con.query(SQL_GET_HASH, [user.username], (err, res) => {
            if(res && res.length > 0){
                user.id =  res[0].user_id;
                user.username_display = res[0].username_display;
                user.bcrypt = res[0].bcrypt.toString();
            }
            callback(err, user);
        });
    }

    
    func.init_Database = function (doodles_path, error_callback, callback) {
    
        func.call(error_callback, (con, end) => {

            // Check for file indicating that tables have been initialized
            if (fs.existsSync(doodles_path+TABLE_IMG+'_EXISTS.info')) return callback();

            // iterate through all statements to create tables in order
            // one big statement with several 'create tables' kept causing errors
            const statements = [SQL_CREATE_USER, SQL_CREATE_SCORE, SQL_CREATE_IMG, SQL_CREATE_ML5];
            const func = (con, i) => {
                con.query(statements[i],(error, result) => {
                    console.log(error)
                    if(error && error.errno != 1050) return console.log(error);
                    else if( (!error || error.errno == 1050) && i + 1 < 3) return func(con, i + 1);

                    fs.writeFile(doodles_path+TABLE_IMG+'_EXISTS.info', '', (err) => {console.log()});
                    callback();
                })
            }
            func(con, 0);
        });
    }




    func.export_images = (con, callback) => {
        con.query('Select * from ' + TABLE_IMG, (err, res) => {
            if (err) return callback(err, null);

            let images = [];
            res.forEach(row => {
                images.push({
                    img_id: row.img_id,
                    img_path: row.img_path,
                    img_name: row.img_name,
                    user_id: row.user_id,
                    ml5_bestfit: {
                        label: row.ml5_bestfit,
                        confidence: row.ml5_bestfit_conf
                    },
                    ml5: row.ml5,
                });
            });
            callback(err, res);
        })
    }


    func.export_users = (con, callback) => {
        con.query('Select * from ' + TABLE_USER, (err, res) => {
            if (err) return callback(err, null);

            let users = [];
            res.forEach(row => {
                users.push({
                    user_id: row.user_id,
                    username: row.username,
                    username_display: row.username_display,
                    bcrypt: row.bcrypt.toString()
                });
            });
            callback(null, users);
        })
    }

    func.export_scores = (con, callback) => {
        con.query('Select * from ' + TABLE_SCORE, (err, res) => {
            if (err) return callback(err, null);

            let scores = [];
            res.forEach(row => {
                scores.push({
                    user_id: row.user_id,
                    gamename: row.gamename,
                    timestamp: row.timestamp,
                    score: row.score
                });
            });
            callback(null, scores);
        })
    }

    func.import_users = (con, users, callback) => {

        if (!users || users.length == 0) return callback(null);
        const qu = (i, info) => {
            const user = users[i];
            con.query('Insert into '+TABLE_USER+' Values( ?, ?, ?, ? )', [
                user.user_id,
                user.username,
                user.username_display,
                user.bcrypt],
                (err, res) => { 
                    if(err) info.err.push( { user: user.username, err: err } );
                    else info.done.push(user.username);
                    if((i+1) >= users.length) return callback(info);
                    else qu(i+1, info);
                });
        }
        qu(0, { err: [], done: []});
    }

    func.import_images = (con, images, callback) => {

        if (!images || images.length == 0) return callback(null);
        const qu = (i, info) => {
            const image = images[i];
            con.query('Insert into '+TABLE_IMG+' Values( ?, ?, ?, ?, ?, ?, ? )', [
                image.img_id,
                image.user_id,
                image.img_path,
                image.img_name,
                image.ml5_bestfit,
                image.ml5_bestfit_conf,
                image.ml5],
                (err, res) => { 
                    if(err) info.err.push( { image: image.img_path, err: err } );
                    else info.done.push(image.img_path);
                    if((i+1) >= images.length) return callback(info);
                    else qu(i+1, info);
                });
        }
        qu(0, { err: [], done: [] } );
    }

module.exports = func;