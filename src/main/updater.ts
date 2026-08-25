import { autoUpdater } from 'electron-updater'
import { getSetting, setSetting } from './db/database'

const LAST_CHECK_KEY = 'update_last_check'
/** 检查间隔：24 小时 */
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000

let checking = false

/**
 * 检查更新：默认遵循 24h 节流；force 时忽略节流。
 * 更新源由 electron-builder.yml 的 publish 配置决定（GitHub Releases）。
 */
export async function checkForUpdates(force = false): Promise<{ status: string; message?: string }> {
  if (checking) {
    return { status: 'busy', message: '更新检查进行中' }
  }
  if (!force) {
    const last = getSetting(LAST_CHECK_KEY)
    if (last && Date.now() - Number(last) < CHECK_INTERVAL_MS) {
      return { status: 'throttled', message: '24 小时内已检查过，跳过' }
    }
  }

  checking = true
  try {
    autoUpdater.autoDownload = false
    const result = await autoUpdater.checkForUpdates()
    setSetting(LAST_CHECK_KEY, String(Date.now()))
    if (result?.updateInfo && result.updateInfo.version !== autoUpdater.currentVersion.version) {
      return { status: 'available', message: `发现新版本 ${result.updateInfo.version}` }
    }
    return { status: 'latest', message: '已是最新版本' }
  } catch (err) {
    // 离线或更新源不可达时静默失败（纯本地工具，不应打扰使用）
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  } finally {
    checking = false
  }
}
