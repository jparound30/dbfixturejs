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
    return dbFixtureJs.createSqlFrom('./examples/testdata1.xlsx')
  })
  .then((sqlList) => {
    for (let sql of sqlList) {
      console.log(sql)
    }
    process.exit(0)
  })
