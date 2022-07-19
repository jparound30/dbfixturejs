"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableData = void 0;
const promise_1 = __importDefault(require("mysql2/promise"));
const dayjs_1 = __importDefault(require("dayjs"));
const DBColumnType_1 = require("./DBColumnType");
class TableData {
    schemaName;
    name;
    data;
    columnTypes;
    emptyStr;
    get tableName() {
        return this.schemaName ? `${this.schemaName}.${this.name}` : `${this.name}`;
    }
    constructor(init) {
        this.schemaName = init.schemaName ?? null;
        this.name = init.name;
        this.data = init.data ?? [];
        this.columnTypes = init.columnTypes;
        this.emptyStr = init.emptyStr;
    }
    createInsertSql() {
        const sql1 = `INSERT INTO ${this.tableName} `;
        const cols = '(' + this.columnTypes.map((v) => v.columnName).join(',') + ') VALUES\n';
        const values = this.data.map((row) => {
            const rowStr = row
                .map((col, index) => {
                const columnType = this.columnTypes[index].columnType;
                if ((0, DBColumnType_1.isStringDBColumnType)(this.columnTypes[index].columnType)) {
                    if (col !== null && col.toString().match(this.emptyStr)) {
                        return promise_1.default.escape('');
                    }
                }
                if (columnType === DBColumnType_1.DBColumnTypes.BIT) {
                    return `b'${col}'`;
                }
                else if (columnType === DBColumnType_1.DBColumnTypes.DATETIME) {
                    const val = (0, dayjs_1.default)(col).format('YYYY-MM-DD HH:mm:ss');
                    return promise_1.default.escape(val);
                }
                else if (columnType === DBColumnType_1.DBColumnTypes.TIMESTAMP) {
                    const val = (0, dayjs_1.default)(col).format('YYYY-MM-DD HH:mm:ss');
                    return promise_1.default.escape(val);
                }
                else if (columnType === DBColumnType_1.DBColumnTypes.DATE) {
                    const val = (0, dayjs_1.default)(col).format('YYYY-MM-DD');
                    return promise_1.default.escape(val);
                }
                if (typeof col === 'string') {
                    return promise_1.default.escape(col);
                }
                else if (typeof col === 'number') {
                    return col;
                }
                return promise_1.default.escape(col);
            })
                .join(',');
            return `(${rowStr})\n`;
        });
        return sql1 + cols + values;
    }
}
exports.TableData = TableData;
