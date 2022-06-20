import { DBFixtureConnOpts, DBFixtureJs } from '../src'
import * as path from 'path'
import mysql2, { RowDataPacket } from 'mysql2/promise'

const conf: DBFixtureConnOpts = {
  host: 'localhost',
  user: 'user',
  password: 'user12345!',
  database: 'test',
  charset: 'utf8mb4',
}

let connection!: mysql2.Connection
beforeAll(async () => {
  const opt = Object.assign({ supportBigNumbers: true, bigNumberStrings: true }, conf)
  connection = await mysql2.createConnection(opt)
})
afterAll(async () => {
  await connection.end()
})

describe('DBFixtureJs', () => {
  const dbfixture = new DBFixtureJs(conf)

  const testdata1File = path.join(__dirname, 'test_data_numbers.xlsx')
  test('整数型のカラムに値が入れられること', async () => {
    await dbfixture.load(testdata1File)

    const result = await connection.query(`SELECT * FROM number_cols`)
    const data = result[0] as RowDataPacket[]

    expect(data[0].k).toBe(1)
    expect(data[0].c_bit).toHaveLength(2)
    expect(data[0].c_bit[0]).toBe(0b00000000)
    expect(data[0].c_bit[1]).toBe(0b00010101)
    expect(data[0].c_int).toBe(1234567)
    expect(data[0].c_bigint).toBe('9876543210')
    expect(data[0].c_decimal).toBe('123.45678')
    expect(data[0].c_double).toBeCloseTo(987.654321, 9)
  })
})
