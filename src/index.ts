export interface DBFixtureConnOpts {
  host: string
  user: string
  password: string
  database?: string
  charset?: string
  debug?: boolean
}
export * from './DBFixtureJs'
