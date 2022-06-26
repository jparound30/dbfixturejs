import { DBFixtureConnOpts, DBFixtureJs } from '../src'
import * as path from 'path'
import mysql2, { RowDataPacket } from 'mysql2/promise'
import dayjs from 'dayjs'
import { TextEncoder } from 'util'

const conf: DBFixtureConnOpts = {
  host: 'localhost',
  user: 'user',
  password: 'user12345!',
  database: 'test',
  charset: 'utf8mb4',
  timezone: '+09:00',
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
  const testdata2File = path.join(__dirname, 'test_data_datetime.xlsx')
  const testdata3File = path.join(__dirname, 'test_data_strings.xlsx')

  const testdataMultiTableFile = path.join(__dirname, 'test_data_multitables.xlsx')

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

  test('日時型のカラムに値が入れられること', async () => {
    await dbfixture.load(testdata2File)

    const result = await connection.query(`SELECT * FROM datetime_cols`)
    const data = result[0] as RowDataPacket[]

    expect(data[0].k).toBe(1)
    expect(data[0].c_datetime).toEqual(dayjs('2021-01-02 13:09:08').toDate())
    expect(data[0].c_timestamp).toEqual(dayjs('2021-01-02 01:09:08').toDate())
    expect(data[0].c_date).toEqual(dayjs('2021-01-09').toDate())
    expect(data[0].c_time).toBe('13:09:59')
    expect(data[0].c_year).toBe(2023)
  })

  test('文字列側のカラムに値が入れられること', async () => {
    await dbfixture.load(testdata3File)

    const result = await connection.query(`SELECT * FROM string_cols`)
    const data = result[0] as RowDataPacket[]

    expect(data[0].k).toBe(1)
    expect(data[0].c_char).toBe('10文字なんだけど？')
    expect(data[0].c_varchar).toBe('よくあるばーきゃら')
    const expect_c_binary = new TextEncoder().encode('binary?\0\0\0')
    expect(data[0].c_binary).toHaveLength(10)
    data[0].c_binary.forEach((v: number, i: number) => {
      expect(v).toBe(expect_c_binary[i])
    })
    const expect_c_varbinary = new TextEncoder().encode('whatisvar')
    expect(data[0].c_varbinary).toHaveLength(expect_c_varbinary.length)
    data[0].c_varbinary.forEach((v: number, i: number) => {
      expect(v).toBe(expect_c_varbinary[i])
    })
    const expect_c_blob = new TextEncoder().encode('this column is blob, but data strings in ascii chars stored ')
    expect(data[0].c_blob).toHaveLength(expect_c_blob.length)
    data[0].c_blob.forEach((v: number, i: number) => {
      expect(v).toBe(expect_c_blob[i])
    })
    expect(data[0].c_text).toBe(`なんだかながいてきすとが思いつかないので、適当に手が動くままに打たれた文字を入れておくよ。
ついでに改行も入れてみてどうなるか見てみるよ`)
    expect(data[0].c_enum).toBe('two')
    expect(data[0].c_set).toBe('b,d')
  })

  test('複数テーブルのエクセルに対応すること', async () => {
    await dbfixture.load(testdataMultiTableFile)

    const result1 = await connection.query(`SELECT * FROM multi1`)
    const data1 = result1[0] as RowDataPacket[]

    expect(data1[0].id).toBe(1)
    expect(data1[0].multi1).toBe('multi1')

    const result2 = await connection.query(`SELECT * FROM multi2`)
    const data2 = result2[0] as RowDataPacket[]

    expect(data2[0].id).toBe(1)
    expect(data2[0].multi2).toBe('multi2')

    const result3 = await connection.query(`SELECT * FROM multi3`)
    const data3 = result3[0] as RowDataPacket[]

    expect(data3[0].id).toBe(1)
    expect(data3[0].multi3).toBe('multi3')
  })
})
