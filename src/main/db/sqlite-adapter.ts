import initSqlJs, { type Database as SqlJsDb, type Statement } from 'sql.js'

/**
 * SQLite 适配层：基于 sql.js（WASM）实现 better-sqlite3 风格 API。
 * 优点：纯 JS/WASM，无需 node-gyp 编译工具链，开发/打包零障碍。
 */

export type SqlValue = number | string | Uint8Array | null
export type SqlRow = Record<string, SqlValue>

export interface RunResult {
  changes: number
  lastInsertRowid: number
}

export interface PreparedStatement {
  all(...params: SqlValue[]): SqlRow[]
  get(...params: SqlValue[]): SqlRow | undefined
  run(...params: SqlValue[]): RunResult
  free(): void
}

export interface SqliteDatabase {
  exec(sql: string): void
  prepare(sql: string): PreparedStatement
  export(): Uint8Array
  close(): void
}

class StatementWrapper implements PreparedStatement {
  constructor(
    private stmt: Statement,
    private db: SqlJsDb,
    private onWrite?: () => void
  ) {}

  private bindParams(params: SqlValue[]): void {
    if (params.length > 0) {
      this.stmt.bind(params as never)
    }
  }

  all(...params: SqlValue[]): SqlRow[] {
    this.bindParams(params)
    const rows: SqlRow[] = []
    while (this.stmt.step()) {
      rows.push(this.stmt.getAsObject() as SqlRow)
    }
    this.stmt.reset()
    return rows
  }

  get(...params: SqlValue[]): SqlRow | undefined {
    this.bindParams(params)
    const hasRow = this.stmt.step()
    const row = hasRow ? (this.stmt.getAsObject() as SqlRow) : undefined
    this.stmt.reset()
    return row
  }

  run(...params: SqlValue[]): RunResult {
    this.bindParams(params)
    this.stmt.step()
    this.stmt.reset()
    const changes = this.db.getRowsModified()
    const last = this.db.exec('SELECT last_insert_rowid() AS id')
    const lastInsertRowid = Number(last[0]?.values[0]?.[0] ?? 0)
    this.onWrite?.()
    return { changes, lastInsertRowid }
  }

  free(): void {
    this.stmt.free()
  }
}

class DatabaseWrapper implements SqliteDatabase {
  constructor(
    private db: SqlJsDb,
    private onWrite?: () => void
  ) {}

  exec(sql: string): void {
    this.db.exec(sql)
  }

  prepare(sql: string): PreparedStatement {
    return new StatementWrapper(this.db.prepare(sql), this.db, this.onWrite)
  }

  export(): Uint8Array {
    return this.db.export()
  }

  close(): void {
    this.db.close()
  }
}

let sqlModulePromise: Promise<Awaited<ReturnType<typeof initSqlJs>>> | null = null

async function loadSqlModule(wasmPath: string): Promise<Awaited<ReturnType<typeof initSqlJs>>> {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs({
      locateFile: () => wasmPath
    })
  }
  return sqlModulePromise
}

/** 创建数据库实例；data 为已有数据库文件内容（首次创建时传 undefined） */
export async function createDatabase(
  data: Uint8Array | undefined,
  wasmPath: string,
  onWrite?: () => void
): Promise<SqliteDatabase> {
  const SQL = await loadSqlModule(wasmPath)
  const db = data && data.length > 0 ? new SQL.Database(data) : new SQL.Database()
  db.run('PRAGMA foreign_keys = ON')
  return new DatabaseWrapper(db, onWrite)
}
