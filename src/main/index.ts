import { app, BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc'
import { createTray } from './tray'
import { startOverlayServer } from './obs/overlay-server'
import { checkForUpdates } from './updater'
import { initDb } from './db/database'

// 退出标记：窗口关闭时隐藏到托盘，仅用户主动退出时真正退出
let isQuitting = false

let mainWindow: BrowserWindow | null = null

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    title: '黎明图鉴 · gd-live-tool',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // 外部链接一律交给系统浏览器，避免在应用内新开窗口
  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // 关闭时隐藏到托盘而非退出（托盘图标存在期间）
  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  // 开发模式加载 dev server，生产加载构建产物
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

const gotSingleInstanceLock = app.requestSingleInstanceLock()

if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  app.whenReady().then(async () => {
    // 应用退出标记（配合窗口 close 拦截）
    isQuitting = false

    // 先初始化数据库，再注册 IPC
    await initDb()
    registerIpcHandlers()
    createMainWindow()
    createTray(() => mainWindow)

    // 叠加层本地服务随应用启动
    startOverlayServer()

    // 启动时静默检查更新（24h 节流由 updater 内部处理）
    void checkForUpdates(false)

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow()
      }
    })
  })

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.on('window-all-closed', () => {
    // 托盘应用：保留后台运行，不因窗口关闭而退出
  })
}
