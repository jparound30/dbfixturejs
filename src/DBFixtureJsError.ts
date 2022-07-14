export class DBFixtureJsError extends Error {
  readonly cause?: Error

  constructor(msg?: string, cause?: Error) {
    super(msg)
    this.name = new.target.name
    this.cause = cause
  }
}
