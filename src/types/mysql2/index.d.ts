/* eslint-disable no-unused-vars */
import mysql2 from 'mysql2'

// node-mysql2の型定義が実際のものとあっていないためworkaroundとして内部で型を持つ
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
    // mod s
    characterSet: number
    encoding: string
    columnLength: number
    columnType: number
    // mod e
  }
}
