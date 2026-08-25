import { contextBridge, ipcRenderer } from 'electron'
import type { QueryableTable, SearchOptions } from '../main/modules/query'

/** 暴露给渲染进程的受控 API（contextBridge 隔离） */
const api = {
  // ---- 资料查询 ----
  search: (table: QueryableTable, options: SearchOptions) => ipcRenderer.invoke('db:search', table, options),
  getRecord: (table: QueryableTable, id: number) => ipcRenderer.invoke('db:get', table, id),
  distinct: (table: QueryableTable, column: string) => ipcRenderer.invoke('db:distinct', table, column),

  // ---- 切片打点 ----
  slicing: {
    start: (title?: string) => ipcRenderer.invoke('slicing:start', title),
    end: (sliceId: number) => ipcRenderer.invoke('slicing:end', sliceId),
    addMarker: (sliceId: number, label: string) => ipcRenderer.invoke('slicing:addMarker', sliceId, label),
    list: () => ipcRenderer.invoke('slicing:list'),
    markers: (sliceId: number) => ipcRenderer.invoke('slicing:markers', sliceId),
    deleteMarker: (markerId: number) => ipcRenderer.invoke('slicing:deleteMarker', markerId),
    deleteSlice: (sliceId: number) => ipcRenderer.invoke('slicing:deleteSlice', sliceId)
  },

  // ---- OBS 叠加层 ----
  overlay: {
    status: () => ipcRenderer.invoke('overlay:status'),
    start: () => ipcRenderer.invoke('overlay:start'),
    stop: () => ipcRenderer.invoke('overlay:stop'),
    setPort: (port: number) => ipcRenderer.invoke('overlay:setPort', port)
  },

  // ---- 应用 ----
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    checkUpdate: (force = false) => ipcRenderer.invoke('app:checkUpdate', force)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type Api = typeof api
