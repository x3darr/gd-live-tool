<script setup lang="ts">
import { onMounted, ref } from 'vue'

const overlayUrl = ref('')
const version = ref('')

onMounted(async () => {
  try {
    version.value = await window.api.app.getVersion()
    const status = await window.api.overlay.status()
    if (status.running) {
      overlayUrl.value = `http://127.0.0.1:${status.port}/overlay`
    }
  } catch {
    // 浏览器直接打开时的降级处理
  }
})
</script>

<template>
  <div>
    <p class="muted" style="max-width: 720px; line-height: 1.8">
      黎明图鉴是一款<b>纯本地运行</b>的恐怖黎明（Grim Dawn）资料查询工具：装备 / 词缀 / 怪物 /
      技能 / 星座速查，并支持 OBS 叠加层与直播切片打点。所有数据存储在本地 SQLite 数据库，不调用任何外部服务。
    </p>

    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-top: 20px">
      <div class="card">
        <div class="card-title">📦 资料查询</div>
        <p class="muted">装备、词缀、怪物、技能、星座五大模块，支持关键字搜索与分类筛选。</p>
      </div>
      <div class="card">
        <div class="card-title">🎬 OBS 叠加层</div>
        <p class="muted">
          本地 HTTP 服务（127.0.0.1:8765），OBS 添加「浏览器源」即可叠加切片打点实时信息。
        </p>
        <div v-if="overlayUrl">
          <span class="tag gold">叠加层地址</span>
          <code style="font-size: 12px; word-break: break-all">{{ overlayUrl }}</code>
        </div>
      </div>
      <div class="card">
        <div class="card-title">⏱ 直播切片打点</div>
        <p class="muted">记录直播精彩时刻时间戳，辅助后期剪辑切片，数据本地留存。</p>
      </div>
    </div>

    <p class="muted" style="margin-top: 20px; font-size: 12px">v{{ version }} · 纯本地工具，数据不离开您的电脑</p>
  </div>
</template>

<style scoped>
.card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px 16px;
}

.card-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: var(--accent);
}
</style>
