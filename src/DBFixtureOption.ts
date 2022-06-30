export interface DBFixtureOption {
  /** 文字列型カラムに空文字を指定したい場合に利用する文字列（Excel上の空白はNULLとみなすため）
   * default: EMPTY */
  emptyStrForStringColumn?: string
}
