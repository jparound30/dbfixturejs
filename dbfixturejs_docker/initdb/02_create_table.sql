use test;

-- 数値型主要なもの
DROP TABLE IF EXISTS number_cols;
CREATE TABLE number_cols
(
    k         integer auto_increment PRIMARY KEY,
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
    k           integer auto_increment PRIMARY KEY,
    c_datetime  DATETIME,
    c_timestamp TIMESTAMP,
    c_date      DATE,
    c_time      TIME,
    c_year      YEAR
)
