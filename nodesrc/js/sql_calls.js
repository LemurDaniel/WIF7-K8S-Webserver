const mysql = require('mysql');
const fs = require('fs');

const SQL_HOST = process.env.SQL_HOST;
const SQL_USER = process.env.SQL_USER;
const SQL_PORT = process.env.SQL_PORT;
const SQL_PASSWORD = process.env.SQL_PASSWORD;
const SQL_DATABASE = process.env.SQL_DATABASE;


const TABLE_IMG = 'doodles5';
const SQL_CREATE_TABLE =    'create table '+TABLE_IMG+' ( '+
                            'img_id int NOT NULL PRIMARY KEY AUTO_INCREMENT,'+
                            'img_path nvarchar(100) unique,'+
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



func = {};

    func.getCon = () => {
        return mysql.createConnection({
            host: SQL_HOST,
            user: SQL_USER,
            password: SQL_PASSWORD,
            database: SQL_DATABASE
        });
    }


    func.insert_img = (con, body, callback) => {

        con.query(SQL_INSERT_IMG, 
            [body.img_path, 
            body.img_name, 
            body.user, 
            body.ml5_best_fit.label,
            body.ml5_best_fit.confidence,
            JSON.stringify(body.ml5)], 
            callback);
    }


    func.update_img = (con, body, callback) => {
    
        con.query(SQL_UPDATE_IMG, 
            [body.img_name,
            body.ml5_best_fit.label,
            body.ml5_best_fit.confidence,
            JSON.stringify(body.ml5),
            body.img_path], 
            (err, res) => callback(err, res));
    }

    func.is_unique_path = (con, img_path, callback) => {

        con.query(SQL_IS_UNIQUE, [img_path], function (error, result, fields) {
            callback(error, (result.length === 0));
        });
    }



    
    func.init_Database = function (doodles_path) {
    
        // Check for file indicating initialization
        fs.readFile(doodles_path+TABLE_IMG+'_EXISTS.info', (err, data) => {
            // If file exists then return
            if(!err) return;
            // else create table
            let con = func.getCon();
            con.connect((err) => {     
                con.query(SQL_CREATE_TABLE,(error, result) => {
                    fs.writeFile(doodles_path+TABLE_IMG+'_EXISTS.info', '', (err) => {});
                });
            });
        });
    }

module.exports = func;