import mysql2 from 'mysql2/promise'
import dayjs from 'dayjs'
import { DBColumnTypes, isStringDBColumnType, DBColumnType } from './DBColumnType'

export type RowData = Array<string | number | Date | null>
export type ColumnTypes = Array<{ columnName: string; columnType: DBColumnType }>

export class TableData {
  readonly schemaName: string | null
  readonly name: string
  data: RowData[]
  columnTypes: ColumnTypes
  readonly emptyStr: string

  get tableName() {
    return this.schemaName ? `${this.schemaName}.${this.name}` : `${this.name}`
  }

  constructor(init: { schemaName?: string; name: string; data?: RowData[]; columnTypes: ColumnTypes; emptyStr: string }) {
    this.schemaName = init.schemaName ?? null
    this.name = init.name
    this.data = init.data ?? []
    this.columnTypes = init.columnTypes
    this.emptyStr = init.emptyStr
  }

  public createInsertSql(): string {
    const sql1 = `INSERT INTO ${this.tableName} `
    const cols = '(' + this.columnTypes.map((v) => v.columnName).join(',') + ') VALUES \n'
    const values = this.data.map((row) => {
      const rowStr = row
        .map((col, index) => {
          const columnType = this.columnTypes[index].columnType
          if (isStringDBColumnType(this.columnTypes[index].columnType)) {
            if (col !== null && col.toString().match(this.emptyStr)) {
              return mysql2.escape('')
            }
          }
          if (columnType === DBColumnTypes.BIT) {
            return `b'${col}'`
          } else if (columnType === DBColumnTypes.DATETIME) {
            const val = dayjs(col).format('YYYY-MM-DD HH:mm:ss')
            return mysql2.escape(val)
          } else if (columnType === DBColumnTypes.TIMESTAMP) {
            const val = dayjs(col).format('YYYY-MM-DD HH:mm:ss')
            return mysql2.escape(val)
          } else if (columnType === DBColumnTypes.DATE) {
            const val = dayjs(col).format('YYYY-MM-DD')
            return mysql2.escape(val)
          }
          if (typeof col === 'string') {
            return mysql2.escape(col)
          } else if (typeof col === 'number') {
            return col
          }
          return mysql2.escape(col)
        })
        .join(',')
      return `(${rowStr}) \n`
    })
    return sql1 + cols + values
  }
}
