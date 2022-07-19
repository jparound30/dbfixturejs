"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.excel2TableData = void 0;
const TableData_1 = require("./TableData");
const exceljs_1 = __importDefault(require("exceljs"));
const DBFixtureJsError_1 = require("./DBFixtureJsError");
function sheetNameToDbTableName(sheetName) {
    const schemaAndTable = sheetName.split('.', 2);
    if (!schemaAndTable.length) {
        throw new DBFixtureJsError_1.DBFixtureJsError("Invalid sheetName. sheetName expects 'tableName' or 'schemaName.tableName'");
    }
    let dbName;
    let tableName;
    if (schemaAndTable.length === 1) {
        tableName = schemaAndTable[0].trim();
        if (!tableName.length) {
            throw new DBFixtureJsError_1.DBFixtureJsError(`Invalid sheetName(empty string).`);
        }
    }
    else {
        dbName = schemaAndTable[0].trim();
        tableName = schemaAndTable[1].trim();
        if (!dbName.length || !tableName.length) {
            throw new DBFixtureJsError_1.DBFixtureJsError(`Invalid sheetName(empty string).`);
        }
    }
    return { dbName, tableName };
}
async function excel2TableData(excelFilePath, dbConn, options) {
    const ret = [];
    const emptyStr = options.emptyStrForStringColumn;
    const workbook = new exceljs_1.default.Workbook();
    const wb = await workbook.xlsx.readFile(excelFilePath);
    for (let ws of wb.worksheets) {
        const sheetName = ws.name;
        const { dbName, tableName } = sheetNameToDbTableName(sheetName);
        const headerRow = ws.getRow(1);
        const columnNameList = [];
        headerRow.eachCell({ includeEmpty: false }, (cell) => columnNameList.push(cell?.value?.toString() ?? '##INVALID##'));
        if (columnNameList.includes('##INVALID##')) {
            throw new DBFixtureJsError_1.DBFixtureJsError('First row of sheet must have column name');
        }
        const rowDataList = [];
        ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
            // skip header row
            if (rowNumber === 1) {
                return;
            }
            const rowData = new Array(columnNameList.length).fill(null);
            row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
                const valueType = cell.type;
                let cellValue;
                if (valueType === exceljs_1.default.ValueType.Number) {
                    cellValue = cell.value;
                }
                else if (valueType === exceljs_1.default.ValueType.String) {
                    cellValue = cell.value;
                }
                else if (valueType === exceljs_1.default.ValueType.Date) {
                    cellValue = cell.value;
                }
                else if (valueType === exceljs_1.default.ValueType.Null) {
                    cellValue = null;
                }
                else {
                    // TODO unsupported cell format
                    cellValue = null;
                }
                rowData[colNumber - 1] = cellValue;
            });
            rowDataList.push(rowData);
        });
        // extract column information from table
        const from = dbName ? `${dbName}.${tableName}` : `${tableName}`;
        const [, fields] = await dbConn.query(`SELECT * FROM ${from}  LIMIT 1`);
        let ct = [];
        fields.forEach((v) => {
            ct.push({ columnName: v.name, columnType: v.columnType });
        });
        let hasColumnsInSameOrder = true;
        columnNameList.forEach((v, index) => {
            if (hasColumnsInSameOrder && v !== ct[index].columnName) {
                hasColumnsInSameOrder = false;
            }
        });
        if (!hasColumnsInSameOrder) {
            throw new DBFixtureJsError_1.DBFixtureJsError('Not have columns in same order(table and excel)');
        }
        const td = new TableData_1.TableData({
            schemaName: dbName,
            name: tableName,
            columnTypes: ct,
            data: rowDataList,
            emptyStr: emptyStr,
        });
        ret.push(td);
    }
    return ret;
}
exports.excel2TableData = excel2TableData;
