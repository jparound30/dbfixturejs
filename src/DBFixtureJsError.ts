export class DBFixtureJsError extends Error {
  readonly cause?: Error

  constructor(msg: string, cause?: Error) {
    super(msg + '' + (cause ? ', cause : ' + cause.message : ''))
    this.name = new.target.name
  }
}
