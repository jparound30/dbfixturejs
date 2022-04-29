import { DBFixtureJs } from '../src'

const dbFixtureJs = new DBFixtureJs({
  host: 'localhost',
  database: 'test',
  charset: 'utf8',
  user: 'admin',
  password: 'admin12345',
})

dbFixtureJs
  .load('./examples/testdata1.xlsx')
  .then(() => {
    dbFixtureJs.export()
  })
  .then(() => {
    process.exit(0)
  })
