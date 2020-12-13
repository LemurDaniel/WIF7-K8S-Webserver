create table ? (
    img_id int NOT NULL AUTO_INCREMENT,
    img_path nvarchar(50) unique,
    img_name nvarchar(50),
    user nvarchar(25),
    ml5_bestfit nvarchar(10),
    ml5_bestfit_conf nvarchar(10);
    ml5 text
)


