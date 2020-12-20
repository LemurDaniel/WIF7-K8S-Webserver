const mysql = require('mysql');
const fs = require('fs');
const { use } = require('browser-sync');

const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;


const TABLE_IMG = 'doodles10';
const TABLE_ML5 = TABLE_IMG+'_ml5';
const MIN_CONF = 0.05;

const SQL_CREATE_IMG =      'create table '+TABLE_IMG+' ( '+
                            'img_id int NOT NULL PRIMARY KEY AUTO_INCREMENT,'+
                            'img_path nvarchar(100) NOT NULL unique,'+
                            'img_name nvarchar(50),'+
                            'user nvarchar(25),'+
                            'ml5_bestfit nvarchar(20),'+
                            'ml5_bestfit_conf Decimal(20,19),'+
                            'ml5 text ) ';

const SQL_CREATE_ML5 =      'create table '+TABLE_ML5+' ( '+
	                        'img_id int NOT NULL, '+
	                        'ml5 nvarchar(20), '+
	                        'ml5_confidence Decimal(20,19), '+
                            'FOREIGN KEY(img_id) REFERENCES '+TABLE_IMG+'(img_id) ) ';


const SQL_IS_UNIQUE =       'Select img_id From '+TABLE_IMG+' where img_path = ?';

const SQL_INSERT_IMG =      'Insert Into  '+TABLE_IMG+
                            ' (img_path, img_name, user, ml5_bestfit, ml5_bestfit_conf, ml5) '+
                            ' Values (?, ?, ?, ?, ?, ? )';

const SQL_UPDATE_IMG =      'Update '+TABLE_IMG+' Set '+
                            'img_name = ?, ml5_bestfit = ?, ml5_bestfit_conf = ?, ml5 = ?'+
                            ' Where img_path = ?';

const SQL_GET_IMG       =   'Select img_id, img_path, user, ml5_bestfit, ml5_bestfit_conf '+
                            ' from '+TABLE_IMG+' where '+
                            ' ml5_bestfit like ? And' +
                            ' img_name like ? And'+
                            ' user like ? '+
                            ' Order By ml5_bestfit_conf desc';

const SQL_INSERT_ML5    =   'Insert Into '+TABLE_ML5+
                            ' (img_id, ml5, ml5_confidence) '+
                            ' Values ( ?, ?, ? )';


func = {};

    func.getCon = () => {
        return mysql.createConnection({
            host: SQL_HOST,
            user: SQL_USER,
            password: SQL_PASSWORD,
            database: SQL_DATABASE
        });
    }


    func.call = (method) =>  {
        let con = func.getCon();
        con.connect( (err) => {
            console.log(err);
            method(con);
        });
    }


    func.insert_img = (con, body, callback) => {

        con.query(SQL_INSERT_IMG, 
            [body.img_path, 
            body.img_name, 
            body.user, 
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
            body.img_path], 
            callback);
    }

    func.is_unique_path = (con, img_path, callback) => {

        con.query(SQL_IS_UNIQUE, [img_path], function (error, result, fields) {
            callback(error, (result.length === 0));
        });
    }

    
    func.get_img = (con, params, callback) => {

        let img_name = params.img_name;
        let user = params.user;
        let ml5_bestfit = params.ml5_bestfit;

        if(!ml5_bestfit) ml5_bestfit = '%';
        if(!img_name) img_name = '%';
        if(!user) user = '%';

        con.query(SQL_GET_IMG,[
            ml5_bestfit,
            img_name,
            user],
            (err, res) => {
                if(err) return callback(err, null);
                
                let result = [];
                res.forEach(row => {
                    result.push({
                        img_id: row.img_id,
                        img_path: row.img_path,
                        img_name: row.img_name,
                        user: row.user,
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
    
    func.init_Database = function (doodles_path) {
    
        // Check for file indicating initialization
        fs.readFile(doodles_path+TABLE_IMG+'_EXISTS.info', (err, data) => {
            // If file exists then return
            if(!err) return;
            // else create table
            let con = func.getCon();
            con.connect((err) => {     
                con.query(SQL_CREATE_IMG,(error, result) => {
                    if(error) return console.log(error);
                    con.query(SQL_CREATE_ML5,(error, result) => {});
                    fs.writeFile(doodles_path+TABLE_IMG+'_EXISTS.info', '', (err) => {});
                });
            });
        });
    }

module.exports = func;