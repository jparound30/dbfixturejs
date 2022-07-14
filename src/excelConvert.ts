import mysql2 from 'mysql2/promise'
import { DBFixtureOption } from './DBFixtureOption'
import { ColumnTypes, RowData, TableData } from './TableData'
import ExcelJS from 'exceljs'
import { DBFixtureJsError } from './DBFixtureJsError'
import { DBColumnType } from './DBColumnType'

export async function excel2TableData(excelFilePath: string, dbConn: mysql2.Connection, options: Required<DBFixtureOption>): Promise<TableData[]> {
  const ret: TableData[] = []

  const emptyStr = options.emptyStrForStringColumn
  const workbook = new ExcelJS.Workbook()
  const wb = await workbook.xlsx.readFile(excelFilePath)

  for (let ws of wb.worksheets) {
    const schemaAndTable = ws.name.split('.', 2)
    if (schemaAndTable.length === 0) {
      return ret
    }
    let dbName: string | undefined
    let tableName: string
    if (schemaAndTable.length === 1) {
      tableName = schemaAndTable[0]
    } else {
      dbName = schemaAndTable[0]
      tableName = schemaAndTable[1]
    }
    const headerRow = ws.getRow(1)
    const columnNameList: string[] = []
    headerRow.eachCell({ includeEmpty: false }, (cell) => columnNameList.push(cell?.value?.toString() ?? '##INVALID##'))
    if (columnNameList.includes('##INVALID##')) {
      throw new DBFixtureJsError('Includes invalid data in Excel file')
    }

    const rowDataList: RowData[] = []
    ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) {
        return
      }
      const rowData: RowData = new Array<string | number | Date | null>(columnNameList.length).fill(null)
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const valueType = cell.type
        if (valueType === ExcelJS.ValueType.Number) {
          rowData[colNumber - 1] = cell.value as number
        } else if (valueType === ExcelJS.ValueType.String) {
          rowData[colNumber - 1] = cell.value as string
        } else if (valueType === ExcelJS.ValueType.Date) {
          rowData[colNumber - 1] = cell.value as Date
        } else if (valueType === ExcelJS.ValueType.Null) {
          rowData[colNumber - 1] = null
        } else {
          // TODO unsupported cell format
          rowData[colNumber - 1] = null
        }
      })
      rowDataList.push(rowData)
    })

    const from = dbName ? `${dbName}.${tableName}` : `${tableName}`
    if (from.includes(' ')) {
      throw new DBFixtureJsError('Includes invalid table name in Excel file')
    }

    const [, fields] = await dbConn.query(`SELECT *
                                               FROM ${from}
                                               LIMIT 1`)

    let ct: ColumnTypes = []
    fields.forEach((v) => {
      ct.push({ columnName: v.name, columnType: v.columnType as DBColumnType })
    })

    let hasColumnsInSameOrder = true
    for (const excelCols of columnNameList) {
      const index = columnNameList.indexOf(excelCols)
      if (excelCols !== ct[index].columnName) {
        hasColumnsInSameOrder = false
        break
      }
    }
    if (!hasColumnsInSameOrder) {
      throw new DBFixtureJsError('Not have columns in same order')
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
