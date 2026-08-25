import { app } from 'electron'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { SCHEMA_SQL } from './schema'
import { createDatabase, type SqliteDatabase, type SqlValue } from './sqlite-adapter'

let db: SqliteDatabase | null = null
let persistTimer: ReturnType<typeof setTimeout> | null = null

function getDbPath(): string {
  return join(app.getPath('userData'), 'gd-live-tool.db')
}

/** sql.js 的 WASM 文件路径（随应用打包分发） */
function getWasmPath(): string {
  return join(app.getAppPath(), 'node_modules/sql.js/dist/sql-wasm.wasm')
}

/** 防抖持久化：写操作后 300ms 内合并落盘，避免高频写入反复 export */
function schedulePersist(): void {
  if (persistTimer) {
    clearTimeout(persistTimer)
  }
  persistTimer = setTimeout(() => {
    persistTimer = null
    persistNow()
  }, 300)
}

/** 立即将内存数据库导出写回磁盘文件 */
export function persistNow(): void {
  if (!db) return
  const data = db.export()
  writeFileSync(getDbPath(), Buffer.from(data))
}

/** 初始化数据库（主进程启动时调用一次，须在注册 IPC 之前） */
export async function initDb(): Promise<void> {
  if (db) return
  const dbPath = getDbPath()
  let data: Uint8Array | undefined
  if (existsSync(dbPath)) {
    data = new Uint8Array(readFileSync(dbPath))
  }
  db = await createDatabase(data, getWasmPath(), schedulePersist)
  // 初始化表结构（幂等）
  db.exec(SCHEMA_SQL)
  // 首次创建时确保文件落盘
  schedulePersist()
}

/** 获取全局数据库实例（须在 initDb 完成后调用） */
export function getDb(): SqliteDatabase {
  if (!db) {
    throw new Error('数据库尚未初始化，请先调用 initDb()')
  }
  return db
}

/** 读取应用设置项 */
export function getSetting(key: string): string | null {
  const row = getDb()
    .prepare('SELECT value FROM settings WHERE key = ?')
    .get(key) as { value: SqlValue } | undefined
  return row ? String(row.value) : null
}

/** 写入应用设置项 */
export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value)
}
