use test;

-- 数値型主要なもの
DROP TABLE IF EXISTS number_cols;
CREATE TABLE number_cols (
  k integer auto_increment PRIMARY KEY,
  c_bit BIT(10),
  c_int INT,
  c_bigint BIGINT,
  c_decimal DECIMAL(10,5),
  c_double DOUBLE
);

