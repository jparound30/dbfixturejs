use test;

-- 数値型主要なもの
DROP TABLE IF EXISTS number_cols;
CREATE TABLE number_cols
(
    k         INTEGER AUTO_INCREMENT PRIMARY KEY,
    c_bit     BIT(10),
    c_int     INT,
    c_bigint  BIGINT,
    c_decimal DECIMAL(10, 5),
    c_double  DOUBLE
);


-- 日時型主要なもの
DROP TABLE IF EXISTS datetime_cols;
CREATE TABLE datetime_cols
(
    k           INTEGER AUTO_INCREMENT PRIMARY KEY,
    c_datetime  DATETIME,
    c_timestamp TIMESTAMP,
    c_date      DATE,
    c_time      TIME,
    c_year      YEAR
);


-- 文字列型主要なもの
DROP TABLE IF EXISTS string_cols;
CREATE TABLE string_cols
(
    k           INTEGER AUTO_INCREMENT PRIMARY KEY,
    c_char      CHAR(10),
    c_varchar   VARCHAR(10),
    c_binary    BINARY(10),
    c_varbinary VARBINARY(10),
    c_blob      BLOB,
    c_text      TEXT,
    c_enum      ENUM ('one', 'two', 'three'),
    c_set       SET ('a','b','c', 'd')
);
