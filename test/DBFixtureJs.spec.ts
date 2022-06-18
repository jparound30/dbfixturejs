import { DBFixtureConnOpts, DBFixtureJs } from '../src'
import * as path from 'path'
import mysql2 from 'mysql2/promise'

const conf: DBFixtureConnOpts = {
  host: 'localhost',
  user: 'user',
  password: 'user12345!',
  database: 'test',
  charset: 'utf8mb4',
}

let connection!: mysql2.Connection
beforeAll(async () => {
  const opt = Object.assign({}, conf)
  connection = await mysql2.createConnection(opt)
})
afterAll(async () => {
  await connection.end()
})

describe('DBFixtureJs', () => {
  const dbfixture = new DBFixtureJs(conf)

  const testdata1File = path.join(__dirname, 'test_data_numbers.xlsx')
  test('', async () => {
    await dbfixture.load(testdata1File)

    const result = await connection.query(`SELECT * FROM number_cols`)
    console.log(`result0: ${result[0]}`)
    console.dir(result[0])
    console.log(`result1: ${result[1]}`)
    console.dir(result[1])
  })
})
