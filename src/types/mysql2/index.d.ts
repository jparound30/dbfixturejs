/* eslint-disable no-unused-vars */
import mysql2 from 'mysql2'

/// TODO mysql2の型定義が実際のものとあっていない？
declare module 'mysql2' {
  interface FieldPacket {
    constructor: {
      name: 'FieldPacket'
    }
    catalog: string
    charsetNr: number
    db: string
    decimals: number
    default: any
    flags: number
    length: number
    name: string
    orgName: string
    orgTable: string
    protocol41: boolean
    table: string
    type: number
    zerofill: boolean
    columnType: number
  }
}
