import Excel from 'exceljs'

export class DBFixtureJs {
  constructor(option: {}) {}

  public async load(filepath: string = './examples/testdata1.xlsx'): Promise<void> {
    console.log('load()')
    const workbook = new Excel.Workbook()
    const worksheet = await workbook.xlsx.readFile(filepath)
    // console.dir(worksheet)
    let worksheet1 = worksheet.getWorksheet(1)
    console.log('シート名: ' + worksheet1.name)
    worksheet1.eachRow((row, rowNumber) => {
      console.log(`row = ${rowNumber}`)
      row.eachCell((cell, colNum) => {
        console.log(`cell.type =  ${cell.type}, value = ${cell.value}`)
        for (let v in Excel.ValueType) {
          console.log('  v = ', v)
        }
      })
    })
    return
  }

  public export() {
    console.log('export()')
  }
}
