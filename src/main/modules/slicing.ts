import { getDb } from '../db/database'

export interface SliceRecord {
  id: number
  started_at: string
  ended_at: string | null
  title: string
  notes: string
  marker_count: number
}

export interface MarkerRecord {
  id: number
  slice_id: number
  timestamp: number
  label: string
  created_at: string
}

/** 开始一次切片会话，返回切片 ID */
export function startSlice(title = ''): number {
  const db = getDb()
  const now = new Date().toISOString()
  const info = db.prepare('INSERT INTO slices (started_at, title) VALUES (?, ?)').run(now, title)
  return Number(info.lastInsertRowid)
}

/** 结束切片会话 */
export function endSlice(sliceId: number): void {
  getDb().prepare('UPDATE slices SET ended_at = ? WHERE id = ? AND ended_at IS NULL').run(new Date().toISOString(), sliceId)
}

/** 追加标记：timestamp 为相对切片开始的秒数 */
export function addMarker(sliceId: number, label: string): MarkerRecord {
  const db = getDb()
  const slice = db.prepare('SELECT started_at FROM slices WHERE id = ?').get(sliceId) as { started_at: string } | undefined
  if (!slice) {
    throw new Error(`切片不存在: ${sliceId}`)
  }
  const startMs = new Date(slice.started_at).getTime()
  const timestamp = (Date.now() - startMs) / 1000
  const now = new Date().toISOString()
  const info = db.prepare('INSERT INTO slice_markers (slice_id, timestamp, label, created_at) VALUES (?, ?, ?, ?)').run(sliceId, timestamp, label, now)
  return {
    id: Number(info.lastInsertRowid),
    slice_id: sliceId,
    timestamp,
    label,
    created_at: now
  }
}

/** 列出全部切片（含标记数，按开始时间倒序） */
export function listSlices(): SliceRecord[] {
  return getDb()
    .prepare(
      `SELECT s.id, s.started_at, s.ended_at, s.title, s.notes,
              (SELECT COUNT(*) FROM slice_markers m WHERE m.slice_id = s.id) AS marker_count
       FROM slices s ORDER BY s.started_at DESC`
    )
    .all() as unknown as SliceRecord[]
}

/** 获取切片内全部标记 */
export function listMarkers(sliceId: number): MarkerRecord[] {
  return getDb().prepare('SELECT id, slice_id, timestamp, label, created_at FROM slice_markers WHERE slice_id = ? ORDER BY timestamp').all(sliceId) as unknown as MarkerRecord[]
}

/** 删除标记 */
export function deleteMarker(markerId: number): void {
  getDb().prepare('DELETE FROM slice_markers WHERE id = ?').run(markerId)
}

/** 删除切片（级联删除标记） */
export function deleteSlice(sliceId: number): void {
  getDb().prepare('DELETE FROM slices WHERE id = ?').run(sliceId)
}
