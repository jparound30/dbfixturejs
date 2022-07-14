import mysql2 from 'mysql2/promise'
import { DBFixtureOption } from './DBFixtureOption'
import { ColumnTypes, RowData, TableData } from './TableData'
import ExcelJS from 'exceljs'
import { DBFixtureJsError } from './DBFixtureJsError'
import { DBColumnType } from './DBColumnType'

function sheetNameToDbTableName(sheetName: string): { dbName?: string; tableName: string } {
  const schemaAndTable = sheetName.split('.', 2)
  if (!schemaAndTable.length) {
    throw new DBFixtureJsError("Invalid sheetName. sheetName expects 'tableName' or 'schemaName.tableName'")
  }
  let dbName: string | undefined
  let tableName: string
  if (schemaAndTable.length === 1) {
    tableName = schemaAndTable[0].trim()
    if (!tableName.length) {
      throw new DBFixtureJsError(`Invalid sheetName(empty string).`)
    }
  } else {
    dbName = schemaAndTable[0].trim()
    tableName = schemaAndTable[1].trim()
    if (!dbName.length || !tableName.length) {
      throw new DBFixtureJsError(`Invalid sheetName(empty string).`)
    }
  }
  return { dbName, tableName }
}

export async function excel2TableData(excelFilePath: string, dbConn: mysql2.Connection, options: Required<DBFixtureOption>): Promise<TableData[]> {
  const ret: TableData[] = []

  const emptyStr = options.emptyStrForStringColumn
  const workbook = new ExcelJS.Workbook()
  const wb = await workbook.xlsx.readFile(excelFilePath)

  for (let ws of wb.worksheets) {
    const sheetName = ws.name
    const { dbName, tableName } = sheetNameToDbTableName(sheetName)

    const headerRow = ws.getRow(1)
    const columnNameList: string[] = []
    headerRow.eachCell({ includeEmpty: false }, (cell) => columnNameList.push(cell?.value?.toString() ?? '##INVALID##'))
    if (columnNameList.includes('##INVALID##')) {
      throw new DBFixtureJsError('First row of sheet must have column name')
    }

    const rowDataList: RowData[] = []
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      // skip header row
      if (rowNumber === 1) {
        return
      }
      const rowData: RowData = new Array<string | number | Date | null>(columnNameList.length).fill(null)
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const valueType = cell.type
        let cellValue: RowData[0]
        if (valueType === ExcelJS.ValueType.Number) {
          cellValue = cell.value as number
        } else if (valueType === ExcelJS.ValueType.String) {
          cellValue = cell.value as string
        } else if (valueType === ExcelJS.ValueType.Date) {
          cellValue = cell.value as Date
        } else if (valueType === ExcelJS.ValueType.Null) {
          cellValue = null
        } else {
          // TODO unsupported cell format
          cellValue = null
        }
        rowData[colNumber - 1] = cellValue
      })
      rowDataList.push(rowData)
    })

    // extract column information from table
    const from = dbName ? `${dbName}.${tableName}` : `${tableName}`
    const [, fields] = await dbConn.query(`SELECT * FROM ${from}  LIMIT 1`)

    let ct: ColumnTypes = []
    fields.forEach((v) => {
      ct.push({ columnName: v.name, columnType: v.columnType as DBColumnType })
    })

    let hasColumnsInSameOrder = true
    columnNameList.forEach((v, index) => {
      if (hasColumnsInSameOrder && v !== ct[index].columnName) {
        hasColumnsInSameOrder = false
      }
    })
    if (!hasColumnsInSameOrder) {
      throw new DBFixtureJsError('Not have columns in same order(table and excel)')
    }

    const td = new TableData({
      schemaName: dbName,
      name: tableName,
      columnTypes: ct,
      data: rowDataList,
      emptyStr: emptyStr,
    })
    ret.push(td)
  }

  return ret
}
