/**
 * 数据库表结构 DDL（内嵌字符串，避免构建时资源复制问题）
 */
export const SCHEMA_SQL = `
-- 装备表：武器/护甲/饰品/遗物/组件
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT '',
  level INTEGER DEFAULT 0,
  requirements TEXT NOT NULL DEFAULT '',
  stats TEXT NOT NULL DEFAULT '[]',
  skills TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT ''
);

-- 词缀表：前缀/后缀/镶嵌物
CREATE TABLE IF NOT EXISTS affixes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slot TEXT NOT NULL DEFAULT '',
  rarity TEXT NOT NULL DEFAULT '',
  stats TEXT NOT NULL DEFAULT '[]',
  source TEXT NOT NULL DEFAULT ''
);

-- 怪物表：普通/精英/BOSS
CREATE TABLE IF NOT EXISTS monsters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '',
  level INTEGER DEFAULT 0,
  drops TEXT NOT NULL DEFAULT '[]',
  notes TEXT NOT NULL DEFAULT ''
);

-- 技能表：按专精归类
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mastery TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  stats TEXT NOT NULL DEFAULT '[]'
);

-- 星座表：神龛星座
CREATE TABLE IF NOT EXISTS constellations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  affinity TEXT NOT NULL DEFAULT '',
  tier INTEGER DEFAULT 1,
  points INTEGER DEFAULT 1,
  effects TEXT NOT NULL DEFAULT '',
  unlocks TEXT NOT NULL DEFAULT ''
);

-- 切片表：一次直播切片会话
CREATE TABLE IF NOT EXISTS slices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT ''
);

-- 切片标记表：切片内的时间点
CREATE TABLE IF NOT EXISTS slice_markers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slice_id INTEGER NOT NULL REFERENCES slices(id) ON DELETE CASCADE,
  timestamp REAL NOT NULL,
  label TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

-- 应用设置表
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_items_type ON items(type);
CREATE INDEX IF NOT EXISTS idx_affixes_name ON affixes(name);
CREATE INDEX IF NOT EXISTS idx_monsters_name ON monsters(name);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_mastery ON skills(mastery);
CREATE INDEX IF NOT EXISTS idx_constellations_name ON constellations(name);
CREATE INDEX IF NOT EXISTS idx_markers_slice ON slice_markers(slice_id);
`
