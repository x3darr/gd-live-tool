import { createServer, type Server } from 'http'
import { getSetting, setSetting } from '../db/database'
import { listMarkers } from '../modules/slicing'
import { getDb } from '../db/database'

const DEFAULT_PORT = 8765
const OVERLAY_PORT_KEY = 'overlay_port'

let server: Server | null = null

/** 获取叠加层要展示的实时状态：当前活动切片与最近标记 */
function getOverlayState(): unknown {
  const db = getDb()
  const active = db
    .prepare('SELECT id, started_at, title FROM slices WHERE ended_at IS NULL ORDER BY started_at DESC LIMIT 1')
    .get() as { id: number; started_at: string; title: string } | undefined

  if (!active) {
    return { activeSlice: null, markers: [] }
  }
  const markers = listMarkers(active.id)
  return {
    activeSlice: {
      id: active.id,
      startedAt: active.started_at,
      title: active.title,
      elapsedSeconds: Math.max(0, (Date.now() - new Date(active.started_at).getTime()) / 1000)
    },
    markers: markers.slice(-10).reverse()
  }
}

/** 叠加层页面：深色半透明、无交互，适合 OBS Browser Source */
const OVERLAY_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background: transparent;
    font-family: "Microsoft YaHei", sans-serif;
    color: #eee;
    width: 100vw; height: 100vh;
    overflow: hidden;
  }
  #panel {
    position: absolute; left: 16px; bottom: 16px;
    min-width: 320px; max-width: 480px;
    background: rgba(10, 10, 14, 0.78);
    border: 1px solid rgba(255, 200, 60, 0.35);
    border-radius: 10px;
    padding: 12px 16px;
    backdrop-filter: blur(4px);
    display: none;
  }
  #panel.visible { display: block; }
  #title { font-size: 18px; font-weight: bold; color: #ffc83c; margin-bottom: 6px; }
  #clock { font-size: 20px; font-variant-numeric: tabular-nums; margin-bottom: 4px; }
  #markers { list-style: none; max-height: 160px; overflow: hidden; }
  #markers li { font-size: 13px; color: #cfd6e4; padding: 2px 0; }
  #markers li .t { color: #ffc83c; margin-right: 8px; font-variant-numeric: tabular-nums; }
  #hint { position: absolute; right: 16px; bottom: 16px; font-size: 12px; color: rgba(238,238,238,0.45); }
</style>
</head>
<body>
<div id="panel">
  <div id="title">切片打点中</div>
  <div id="clock">00:00:00</div>
  <ul id="markers"></ul>
</div>
<div id="hint">gd-live-tool overlay</div>
<script>
  function fmt(s) {
    s = Math.floor(s);
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return h + ':' + m + ':' + sec;
  }
  async function refresh() {
    try {
      const res = await fetch('/api/state');
      const state = await res.json();
      const panel = document.getElementById('panel');
      const clock = document.getElementById('clock');
      const list = document.getElementById('markers');
      if (state.activeSlice) {
        panel.classList.add('visible');
        clock.textContent = fmt(state.activeSlice.elapsedSeconds);
        list.innerHTML = state.markers.map(function (m) {
          return '<li><span class="t">' + fmt(m.timestamp) + '</span>' + m.label + '</li>';
        }).join('');
      } else {
        panel.classList.remove('visible');
      }
    } catch (e) { /* 服务未启动时静默 */ }
  }
  refresh();
  setInterval(refresh, 1000);
</script>
</body>
</html>`

function getPort(): number {
  const raw = getSetting(OVERLAY_PORT_KEY)
  const port = raw ? Number.parseInt(raw, 10) : NaN
  return Number.isInteger(port) && port > 0 && port < 65536 ? port : DEFAULT_PORT
}

/** 启动叠加层本地服务（仅绑定 127.0.0.1，无外部暴露） */
export function startOverlayServer(): { port: number } {
  if (server) {
    return { port: getPort() }
  }
  const port = getPort()
  server = createServer((req, res) => {
    const url = req.url ?? '/'
    if (url === '/overlay' || url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(OVERLAY_HTML)
    } else if (url === '/api/state') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify(getOverlayState()))
    } else {
      res.writeHead(404)
      res.end('Not Found')
    }
  })
  server.listen(port, '127.0.0.1')
  return { port }
}

/** 停止叠加层服务 */
export function stopOverlayServer(): void {
  if (server) {
    server.close()
    server = null
  }
}

/** 查询服务状态 */
export function getOverlayStatus(): { running: boolean; port: number } {
  return { running: server !== null, port: getPort() }
}

/** 修改端口（下次启动生效） */
export function setOverlayPort(port: number): void {
  setSetting(OVERLAY_PORT_KEY, String(port))
  stopOverlayServer()
  startOverlayServer()
}
