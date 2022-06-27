import ExcelJS from 'exceljs'
import mysql2, { ResultSetHeader } from 'mysql2/promise'
import { DBFixtureJsOptions } from './index'
import { ColumnTypes, RowData, TableData } from './TableData'

export interface DBFixtureConnOpts {
  host: string
  user: string
  password: string
  database?: string
  charset?: string
}

class DBFixtureJsError extends Error {
  readonly cause?: Error

  constructor(msg: string, cause?: Error) {
    super(msg + '' + (cause ? ', cause : ' + cause.message : ''))
    this.name = new.target.name
  }
}

async function excel2TableData(excelFilePath: string, dbConn: mysql2.Connection, options: Required<DBFixtureJsOptions>): Promise<TableData[]> {
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
          console.warn(`非対応の書式が使われている ${cell.$col$row}`)
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
      ct.push({ columnName: v.name, columnType: v.columnType as TypesVal })
    })

    let hasColumnsInSameOrder = true
    columnNameList.forEach((excelCols, index) => {
      if (excelCols !== ct[index].columnName) {
        hasColumnsInSameOrder = false
      }
    })
    if (!hasColumnsInSameOrder) {
      throw new DBFixtureJsError('Not have columns in same order')
    }

    const td = new TableData({ schemaName: dbName, name: tableName, columnTypes: ct, data: rowDataList, emptyStr: emptyStr })
    ret.push(td)
  }

  return ret
}

export class DBFixtureJs {
  private readonly dbConnOpt: DBFixtureConnOpts
  private readonly options: Required<DBFixtureJsOptions>
  private data?: TableData[]

  constructor(connOpts: DBFixtureConnOpts, options: DBFixtureJsOptions) {
    this.dbConnOpt = connOpts
    this.options = Object.assign({}, options, { emptyStrForStringColumn: options.emptyStrForStringColumn ?? 'EMPTY' })
  }

  public async load(filepath: string): Promise<void> {
    this.data = undefined

    const opt = Object.assign({ supportBigNumbers: true, bigNumberStrings: true }, this.dbConnOpt)
    const connection = await mysql2.createConnection(opt)

    try {
      this.data = await excel2TableData(filepath, connection, this.options)

      for (let td of this.data) {
        const insertSql = td.createInsertSql()
        await this.truncateTbl(td.tableName, connection)
        await this.executeSql([insertSql], connection)
      }
    } finally {
      connection.end()
    }
    return
  }

  public createSqlFrom(filepath: string): string[] {
    // TODO
    return []
  }

  private async truncateTbl(tableName: string, conn: mysql2.Connection) {
    await conn.execute(`TRUNCATE ${tableName}`)
  }

  private async executeSql(sqlList: string[], conn: mysql2.Connection): Promise<void> {
    for (const insertSql of sqlList) {
      const [insData] = await conn.query(insertSql)
      console.log(`inserted records: ${(insData as ResultSetHeader).affectedRows}`)
    }
  }

  async cleanUp() {
    if (this.data === undefined) {
      return
    }

    const opt = Object.assign({ supportBigNumbers: true, bigNumberStrings: true }, this.dbConnOpt)
    const connection = await mysql2.createConnection(opt)

    try {
      for (let td of this.data) {
        await this.truncateTbl(td.tableName, connection)
      }
    } finally {
      connection.end()
    }
  }

  public export() {}
}

const ExcelValueType = {
  Null: 0,
  Merge: 1,
  Number: 2,
  String: 3,
  Date: 4,
  Hyperlink: 5,
  Formula: 6,
  SharedString: 7,
  RichText: 8,
  Boolean: 9,
  Error: 10,
} as const

const convTblForExcelValueType = new Map<number, string>()
Object.entries(ExcelValueType).forEach((v) => {
  convTblForExcelValueType.set(v[1], v[0])
})

// eslint-disable-next-line no-unused-vars
function excelValueTypeToString(type: number): string | undefined {
  return convTblForExcelValueType.get(type)
}

export const DBColumnTypes = {
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
} as const

const convTbl = new Map<number, string>()
Object.entries(DBColumnTypes).forEach((v) => {
  convTbl.set(v[1], v[0])
})

// eslint-disable-next-line no-unused-vars
function typeToString(type: number): string | undefined {
  return convTbl.get(type)
}

export type TypesVal = typeof DBColumnTypes[keyof typeof DBColumnTypes]

export const isStringColumnType = (v: TypesVal): boolean => {
  return (
    v === DBColumnTypes.VARCHAR ||
    v === DBColumnTypes.ENUM ||
    v === DBColumnTypes.SET ||
    v === DBColumnTypes.TINY_BLOB ||
    v === DBColumnTypes.MEDIUM_BLOB ||
    v === DBColumnTypes.LONG_BLOB ||
    v === DBColumnTypes.BLOB ||
    v === DBColumnTypes.VAR_STRING ||
    v === DBColumnTypes.STRING
  )
}
