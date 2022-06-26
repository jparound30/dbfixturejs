use test;

-- 複数テーブルテスト用
DROP TABLE IF EXISTS multi1;
CREATE TABLE multi1
(
    id         INTEGER AUTO_INCREMENT PRIMARY KEY,
    multi1     VARCHAR(10)
);

DROP TABLE IF EXISTS multi2;
CREATE TABLE multi2
(
    id         INTEGER AUTO_INCREMENT PRIMARY KEY,
    multi2     VARCHAR(10)
);

DROP TABLE IF EXISTS multi3;
CREATE TABLE multi3
(
    id         INTEGER AUTO_INCREMENT PRIMARY KEY,
    multi3     VARCHAR(10)
);

