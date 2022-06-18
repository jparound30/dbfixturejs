DROP USER IF EXISTS 'user';
CREATE USER IF NOT EXISTS 'user'@'%' IDENTIFIED WITH mysql_native_password BY 'user12345!';
GRANT ALL ON *.* TO 'user'@'%' WITH GRANT OPTION;
