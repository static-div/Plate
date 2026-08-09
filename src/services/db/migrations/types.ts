export interface Migration {
  version: number
  /** Raw SQL, passed straight to driver.execute(). May contain multiple statements. */
  up: string
}
