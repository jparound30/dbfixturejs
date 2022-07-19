"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBFixtureJs = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const excelConvert_1 = require("./excelConvert");
class DBFixtureJs {
    dbConnOpt;
    options;
    data;
    constructor(connOpts, options) {
        this.dbConnOpt = connOpts;
        this.options = Object.assign({}, options, { emptyStrForStringColumn: options.emptyStrForStringColumn ?? 'EMPTY' });
    }
    async load(filepath) {
        this.data = undefined;
        const connection = await this.connect();
        try {
            this.data = await (0, excelConvert_1.excel2TableData)(filepath, connection, this.options);
            for (let td of this.data) {
                const insertSql = td.createInsertSql();
                await this.truncateTbl(td.tableName, connection);
                await this.executeSql([insertSql], connection);
            }
        }
        finally {
            await this.disconnect(connection);
        }
        return;
    }
    async connect() {
        const opt = Object.assign({ supportBigNumbers: true, bigNumberStrings: true }, this.dbConnOpt);
        return promise_1.default.createConnection(opt);
    }
    async disconnect(conn) {
        await conn.end();
    }
    async createSqlFrom(filepath) {
        const ret = [];
        const connection = await this.connect();
        try {
            const tds = await (0, excelConvert_1.excel2TableData)(filepath, connection, this.options);
            for (let td of tds) {
                const insertSql = td.createInsertSql();
                ret.push(insertSql);
            }
        }
        finally {
            await this.disconnect(connection);
        }
        return ret;
    }
    async truncateTbl(tableName, conn) {
        await conn.execute(`TRUNCATE ${tableName}`);
    }
    async executeSql(sqlList, conn) {
        for (const insertSql of sqlList) {
            await conn.query(insertSql);
        }
    }
    async cleanUp() {
        if (this.data === undefined) {
            return;
        }
        const connection = await this.connect();
        try {
            for (let td of this.data) {
                await this.truncateTbl(td.tableName, connection);
            }
        }
        finally {
            await this.disconnect(connection);
        }
    }
}
exports.DBFixtureJs = DBFixtureJs;
