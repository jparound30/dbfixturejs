import ExcelJS from 'exceljs'
import mysql2, { ResultSetHeader } from 'mysql2/promise'
import dayjs from 'dayjs'

export interface DBFixtureConnOpts {
  host: string
  user: string
  password: string
  database?: string
  charset?: string
}

export class DBFixtureJs {
  private readonly dbConnOpt: DBFixtureConnOpts

  constructor(option: DBFixtureConnOpts) {
    this.dbConnOpt = option
  }

  public async load(filepath: string): Promise<void> {
    console.log('load()')

    const opt = Object.assign({}, this.dbConnOpt)
    const connection = await mysql2.createConnection(opt)

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = await workbook.xlsx.readFile(filepath)
      // console.dir(worksheet)
      let worksheet1 = worksheet.getWorksheet(1)
      console.log('シート名: ' + worksheet1.name)
      const schemaAndTable = worksheet1.name.split('.', 2)
      if (schemaAndTable.length === 0) {
        return
      }
      let dbName: string | undefined
      let tableName: string
      if (schemaAndTable.length === 1) {
        tableName = schemaAndTable[0]
      } else {
        dbName = schemaAndTable[0]
        tableName = schemaAndTable[1]
      }
      const headerRow = worksheet1.getRow(1)
      const columnNameList: string[] = []
      headerRow.eachCell({ includeEmpty: false }, (cell) => columnNameList.push(cell?.value?.toString() ?? '##INVALID##'))
      if (columnNameList.includes('##INVALID##')) {
        return
      }
      // console.log(`columnNameList = ${columnNameList}`)

      const rowDataList: RowData[] = []
      worksheet1.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) {
          return
        }
        const rowData: RowData = new Array<string | number | Date | null>(columnNameList.length).fill(null)
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          // console.log(`${colNumber} cell.type =  ${excelValueTypeToString(cell.type)}, value = ${cell.value}, text = ${cell.text}`)
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
      return
    }

    // eslint-disable-next-line no-unused-vars
    const [data, fields] = await connection.query(`SELECT *
                                                       FROM ${from}
                                                       LIMIT 1`)

    let ct: ColumnTypes = []
    fields.forEach((v) => {
      // console.log(`カラム名:[${v.name}]\t型: ${typeToString(v.columnType)}`)
      ct.push({ columnName: v.name, columnType: v.columnType as TypesVal })
    })

      let hasClmnInSameOrder = true
      columnNameList.forEach((excelCols, index) => {
        if (excelCols !== ct[index].columnName) {
          hasClmnInSameOrder = false
        }
      })
      if (!hasClmnInSameOrder) {
        console.log('テーブルのカラム順とExcelのカラム順が異なる')
        return
      }

    const td1 = new TableData({ schemaName: dbName, name: tableName, columnTypes: ct, data: rowDataList })
    // console.log(td1)

    const inserSql = td1.createInsertSql()
    console.log(inserSql)

    await this.truncateTbl(td1.tableName, connection)

      const [insData] = await connection.query(inserSql)
      console.log(`inserted records: ${(insData as ResultSetHeader).affectedRows}`)
    } finally {
      connection.end()
    }
    return
  }

  private async truncateTbl(target: string, conn: mysql2.Connection) {
    console.log(`truncateTable: ${target}`)
    // eslint-disable-next-line no-unused-vars
    await conn.execute(`TRUNCATE ${target}`)
  }

  public export() {
    console.log('export()')
  }
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

function excelValueTypeToString(type: number): string | undefined {
  return convTblForExcelValueType.get(type)
}

const DBColumnTypes = {
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

function typeToString(type: number): string | undefined {
  return convTbl.get(type)
}

type RowData = Array<string | number | Date | null>

type TypesVal = typeof DBColumnTypes[keyof typeof DBColumnTypes]

type ColumnTypes = Array<{ columnName: string; columnType: TypesVal }>

class TableData {
  readonly schemaName: string | null
  readonly name: string
  data: RowData[]
  columnTypes: ColumnTypes

  get tableName() {
    return this.schemaName ? `${this.schemaName}.${this.name}` : `${this.name}`
  }

  constructor(init: { schemaName?: string; name: string; data?: RowData[]; columnTypes: ColumnTypes }) {
    this.schemaName = init.schemaName ?? null
    this.name = init.name
    this.data = init.data ?? []
    this.columnTypes = init.columnTypes
  }

  public createInsertSql(): string {
    const sql1 = `INSERT INTO ${this.tableName} `
    const cols = '(' + this.columnTypes.map((v) => v.columnName).join(',') + ') VALUES \n'
    const values = this.data.map((row) => {
      const rowStr = row
        .map((col, index) => {
          if (typeof col === 'string') {
            return mysql2.escape(col)
          } else if (typeof col === 'number') {
            return col
          } else if (col instanceof Date) {
            let dateStr: string
            if (this.columnTypes[index].columnType === DBColumnTypes.DATETIME) {
              dateStr = dayjs(col).format('YYYY-MM-DD HH:mm:ss')
            } else if (this.columnTypes[index].columnType === DBColumnTypes.TIMESTAMP) {
              dateStr = dayjs(col).format('YYYY-MM-DD HH:mm:ss')
            } else {
              dateStr = dayjs(col).format('YYYY-MM-DD HH:mm:ss')
            }

            return mysql2.escape(dateStr)
          }
          return mysql2.escape(col)
        })
        .join(',')
      return `(${rowStr}) \n`
    })
    return sql1 + cols + values
  }
}
