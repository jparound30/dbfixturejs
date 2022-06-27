import { DBFixtureJs } from '../src'

const dbFixtureJs = new DBFixtureJs(
  {
    host: 'localhost',
    database: 'test',
    charset: 'utf8',
    user: 'user',
    password: 'user12345!',
  },
  {}
)

dbFixtureJs
  .load('./examples/testdata1.xlsx')
  .then(() => {
    dbFixtureJs.export()
  })
  .then(() => {
    process.exit(0)
  })
