import { getDb } from '../db/database'
import type { SqlValue } from '../db/sqlite-adapter'

/** 可查询的数据表白名单（防 SQL 注入，仅允许内部定义的表） */
const TABLE_DEFS: Record<string, { search: string[]; columns: string }> = {
  items: { search: ['name', 'type', 'rarity', 'notes'], columns: 'id, name, type, rarity, level, requirements, stats, skills, notes' },
  affixes: { search: ['name', 'slot', 'rarity', 'source'], columns: 'id, name, slot, rarity, stats, source' },
  monsters: { search: ['name', 'area', 'type', 'notes'], columns: 'id, name, area, type, level, drops, notes' },
  skills: { search: ['name', 'mastery', 'category', 'description'], columns: 'id, name, mastery, category, description, stats' },
  constellations: { search: ['name', 'affinity', 'effects', 'unlocks'], columns: 'id, name, affinity, tier, points, effects, unlocks' }
}

export type QueryableTable = keyof typeof TABLE_DEFS

export interface SearchOptions {
  keyword?: string
  /** 过滤字段，如 { type: '武器' } */
  filters?: Record<string, string>
  limit?: number
}

/**
 * 通用搜索：按关键字模糊匹配 + 可选字段过滤。
 * 表名与字段均来自内部白名单，杜绝注入风险。
 */
export function searchRecords(table: QueryableTable, options: SearchOptions = {}): unknown[] {
  const def = TABLE_DEFS[table]
  if (!def) {
    throw new Error(`未知数据表: ${table}`)
  }
  const where: string[] = []
  const params: SqlValue[] = []

  const keyword = options.keyword?.trim()
  if (keyword) {
    const like = `%${keyword}%`
    where.push(`(${def.search.map((col) => `${col} LIKE ?`).join(' OR ')})`)
    for (let i = 0; i < def.search.length; i++) {
      params.push(like)
    }
  }

  for (const [col, value] of Object.entries(options.filters ?? {})) {
    if (value) {
      where.push(`${col} = ?`)
      params.push(value)
    }
  }

  const limit = Math.min(options.limit ?? 200, 1000)
  const sql = `SELECT ${def.columns} FROM ${table}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY name LIMIT ?`
  params.push(limit)
  return getDb().prepare(sql).all(...params)
}

/** 按 ID 查询单条记录 */
export function getRecordById(table: QueryableTable, id: number): unknown {
  const def = TABLE_DEFS[table]
  if (!def) {
    throw new Error(`未知数据表: ${table}`)
  }
  return getDb().prepare(`SELECT ${def.columns} FROM ${table} WHERE id = ?`).get(id)
}

/** 获取某字段的去重值列表（用于筛选下拉框，如装备类型、怪物区域） */
export function getDistinctValues(table: QueryableTable, column: string): string[] {
  const def = TABLE_DEFS[table]
  if (!def || !def.search.includes(column)) {
    throw new Error(`未知数据表或字段: ${table}.${column}`)
  }
  const rows = getDb().prepare(`SELECT DISTINCT ${column} FROM ${table} WHERE ${column} != '' ORDER BY ${column}`).all() as Array<Record<string, string>>
  return rows.map((r) => r[column])
}
