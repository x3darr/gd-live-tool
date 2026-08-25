import { app, ipcMain } from 'electron'
import { searchRecords, getRecordById, getDistinctValues, type QueryableTable, type SearchOptions } from './modules/query'
import { startSlice, endSlice, addMarker, listSlices, listMarkers, deleteMarker, deleteSlice } from './modules/slicing'
import { getOverlayStatus, setOverlayPort, startOverlayServer, stopOverlayServer } from './obs/overlay-server'
import { checkForUpdates } from './updater'

/** 注册全部 IPC 通道（主进程处理函数） */
export function registerIpcHandlers(): void {
  // ---- 资料查询 ----
  ipcMain.handle('db:search', (_e, table: QueryableTable, options: SearchOptions) => searchRecords(table, options))
  ipcMain.handle('db:get', (_e, table: QueryableTable, id: number) => getRecordById(table, id))
  ipcMain.handle('db:distinct', (_e, table: QueryableTable, column: string) => getDistinctValues(table, column))

  // ---- 切片打点 ----
  ipcMain.handle('slicing:start', (_e, title?: string) => startSlice(title ?? ''))
  ipcMain.handle('slicing:end', (_e, sliceId: number) => endSlice(sliceId))
  ipcMain.handle('slicing:addMarker', (_e, sliceId: number, label: string) => addMarker(sliceId, label))
  ipcMain.handle('slicing:list', () => listSlices())
  ipcMain.handle('slicing:markers', (_e, sliceId: number) => listMarkers(sliceId))
  ipcMain.handle('slicing:deleteMarker', (_e, markerId: number) => deleteMarker(markerId))
  ipcMain.handle('slicing:deleteSlice', (_e, sliceId: number) => deleteSlice(sliceId))

  // ---- OBS 叠加层 ----
  ipcMain.handle('overlay:status', () => getOverlayStatus())
  ipcMain.handle('overlay:start', () => startOverlayServer())
  ipcMain.handle('overlay:stop', () => stopOverlayServer())
  ipcMain.handle('overlay:setPort', (_e, port: number) => setOverlayPort(port))

  // ---- 应用 ----
  ipcMain.handle('app:getVersion', () => app.getVersion())
  ipcMain.handle('app:checkUpdate', (_e, force = false) => checkForUpdates(force))
}
