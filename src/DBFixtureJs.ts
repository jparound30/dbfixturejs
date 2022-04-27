import Excel from 'exceljs'
import mysql2 from 'mysql2/promise'

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

  public async load(filepath: string = './examples/testdata1.xlsx'): Promise<void> {
    console.log('load()')

    const opt = Object.assign({}, this.dbConnOpt)
    const connection = await mysql2.createConnection(opt)

    const workbook = new Excel.Workbook()
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
    headerRow.eachCell({ includeEmpty: true }, (cell) => columnNameList.push(cell?.value?.toString() ?? '##INVALID##'))
    if (columnNameList.includes('##INVALID##')) {
      return
    }
    console.log(`columnNameList = ${columnNameList}`)

    const rowDataList: RowData[] = []
    worksheet1.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        return
      }
      console.log(`row = ${rowNumber}`)
      // eslint-disable-next-line no-unused-vars
      const rowData: RowData = []
      row.eachCell({ includeEmpty: true }, (cell) => {
        console.log(`cell.type =  ${cell.type}, value = ${cell.value}, text = ${cell.text}`)
        rowData.push(cell.value?.toString() ?? '##NULL##')
      })
      rowDataList.push(rowData)
    })

    const from = dbName ? `${dbName}.${tableName}` : `${tableName}`
    if (from.includes(' ')) {
      return
    }

    // eslint-disable-next-line no-unused-vars
    const [data, fields] = await connection.query(`SELECT * FROM ${from}`)

    let ct: ColumnTypes = []
    fields.forEach((v) => {
      console.log(`カラム名:[${v.name}]\t型: ${typeToString(v.columnType)}`)
      ct.push({ columnName: v.name, columnType: v.columnType as TypesVal })
    })
    console.log(ct)

    const td1 = new TableData({ schemaName: dbName, name: tableName, columnTypes: ct, data: rowDataList })
    console.log(td1)

    console.log(td1.createInsertSql())
    return
  }

  public export() {
    console.log('export()')
  }
}

const Types = {
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
Object.entries(Types).forEach((v) => {
  convTbl.set(v[1], v[0])
})
console.log(convTbl)

function typeToString(type: number): string | undefined {
  return convTbl.get(type)
}

type RowData = Array<string>

type TypesVal = typeof Types[keyof typeof Types]

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
    const cols = '(' + this.columnTypes.map((v) => v.columnName).join(',') + ') VALUES '
    return sql1 + cols
  }
}
