import { app, BrowserWindow, Menu, Tray, nativeImage } from 'electron'
import { checkForUpdates } from './updater'
import { join } from 'path'

let tray: Tray | null = null

/** 创建系统托盘：显示/隐藏主窗口、检查更新、退出 */
export function createTray(getWindow: () => BrowserWindow | null): void {
  const iconPath = join(__dirname, '../../resources/tray-icon.png')
  let icon = nativeImage.createEmpty()
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('黎明图鉴 · gd-live-tool')

  const menu = Menu.buildFromTemplate([
    {
      label: '显示主界面',
      click: () => {
        const win = getWindow()
        if (win) {
          win.show()
          win.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: '检查更新',
      click: () => {
        void checkForUpdates(true)
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.quit()
      }
    }
  ])
  tray.setContextMenu(menu)

  // 双击托盘恢复窗口
  tray.on('double-click', () => {
    const win = getWindow()
    if (win) {
      win.show()
      win.focus()
    }
  })
}
