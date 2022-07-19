"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isStringDBColumnType = exports.DBColumnTypes = void 0;
exports.DBColumnTypes = {
    DECIMAL: 0,
    TINY: 1,
    SHORT: 2,
    LONG: 3,
    FLOAT: 4,
    DOUBLE: 5,
    NULL: 6,
    TIMESTAMP: 7,
    LONGLONG: 8,
    INT24: 9,
    DATE: 10,
    TIME: 11,
    DATETIME: 12,
    YEAR: 13,
    NEWDATE: 14,
    VARCHAR: 15,
    BIT: 16,
    TIMESTAMP2: 17,
    DATETIME2: 18,
    TIME2: 19,
    JSON: 245,
    NEWDECIMAL: 246,
    ENUM: 247,
    SET: 248,
    TINY_BLOB: 249,
    MEDIUM_BLOB: 250,
    LONG_BLOB: 251,
    BLOB: 252,
    VAR_STRING: 253,
    STRING: 254,
    GEOMETRY: 255,
};
const convDBColumnTypeToNameTbl = new Map();
Object.entries(exports.DBColumnTypes).forEach((v) => {
    convDBColumnTypeToNameTbl.set(v[1], v[0]);
});
// eslint-disable-next-line no-unused-vars
function DBColumnTypeToName(type) {
    return convDBColumnTypeToNameTbl.get(type);
}
const isStringDBColumnType = (v) => {
    return (v === exports.DBColumnTypes.VARCHAR ||
        v === exports.DBColumnTypes.ENUM ||
        v === exports.DBColumnTypes.SET ||
        v === exports.DBColumnTypes.TINY_BLOB ||
        v === exports.DBColumnTypes.MEDIUM_BLOB ||
        v === exports.DBColumnTypes.LONG_BLOB ||
        v === exports.DBColumnTypes.BLOB ||
        v === exports.DBColumnTypes.VAR_STRING ||
        v === exports.DBColumnTypes.STRING);
};
exports.isStringDBColumnType = isStringDBColumnType;
