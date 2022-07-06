import mysql2, { Connection } from 'mysql2/promise'
import { TableData } from './TableData'
import { DBFixtureConnOption } from './DBFixtureConnOption'
import { DBFixtureOption } from './DBFixtureOption'
import { excel2TableData } from './excelConvert'

export class DBFixtureJs {
  private readonly dbConnOpt: DBFixtureConnOption
  private readonly options: Required<DBFixtureOption>
  private data?: TableData[]

  constructor(connOpts: DBFixtureConnOption, options: DBFixtureOption) {
    this.dbConnOpt = connOpts
    this.options = Object.assign({}, options, { emptyStrForStringColumn: options.emptyStrForStringColumn ?? 'EMPTY' })
  }

  public async load(filepath: string): Promise<void> {
    this.data = undefined
    const connection = await this.connect()

    try {
      this.data = await excel2TableData(filepath, connection, this.options)

      for (let td of this.data) {
        const insertSql = td.createInsertSql()
        await this.truncateTbl(td.tableName, connection)
        await this.executeSql([insertSql], connection)
      }
    } finally {
      await this.disconnect(connection)
    }
    return
  }

  private async connect(): Promise<Connection> {
    const opt = Object.assign({ supportBigNumbers: true, bigNumberStrings: true }, this.dbConnOpt)
    return mysql2.createConnection(opt)
  }
  private async disconnect(conn: Connection): Promise<void> {
    await conn.end()
  }

  public async createSqlFrom(filepath: string): Promise<string[]> {
    const ret: string[] = []
    const connection = await this.connect()

    try {
      const tds = await excel2TableData(filepath, connection, this.options)

      for (let td of tds) {
        const insertSql = td.createInsertSql()
        ret.push(insertSql)
      }
    } finally {
      await this.disconnect(connection)
    }
    return ret
  }

  private async truncateTbl(tableName: string, conn: mysql2.Connection) {
    await conn.execute(`TRUNCATE ${tableName}`)
  }

  private async executeSql(sqlList: string[], conn: mysql2.Connection): Promise<void> {
    for (const insertSql of sqlList) {
      await conn.query(insertSql)
    }
  }

  async cleanUp() {
    if (this.data === undefined) {
      return
    }

    const connection = await this.connect()

    try {
      for (let td of this.data) {
        await this.truncateTbl(td.tableName, connection)
      }
    } finally {
      await this.disconnect(connection)
    }
  }

  public export() {}
}
