<script setup lang="ts">
import { onMounted, ref } from 'vue'

const running = ref(false)
const port = ref(8765)
const portInput = ref('')
const overlayUrl = ref('')
const message = ref('')

async function refreshStatus(): Promise<void> {
  const status = await window.api.overlay.status()
  running.value = status.running
  port.value = status.port
  portInput.value = String(status.port)
  overlayUrl.value = status.running ? `http://127.0.0.1:${status.port}/overlay` : ''
}

async function toggle(): Promise<void> {
  if (running.value) {
    await window.api.overlay.stop()
    message.value = '叠加层服务已停止'
  } else {
    await window.api.overlay.start()
    message.value = '叠加层服务已启动'
  }
  await refreshStatus()
}

async function applyPort(): Promise<void> {
  const p = Number.parseInt(portInput.value, 10)
  if (!Number.isInteger(p) || p < 1024 || p > 65535) {
    message.value = '端口无效（1024-65535）'
    return
  }
  await window.api.overlay.setPort(p)
  await refreshStatus()
  message.value = `端口已更新为 ${p}`
}

onMounted(refreshStatus)
</script>

<template>
  <div>
    <div class="toolbar">
      <button :class="{ primary: !running }" @click="toggle">
        {{ running ? '停止服务' : '启动服务' }}
      </button>
      <span :class="['tag', running ? 'gold' : '']">{{ running ? '● 运行中' : '○ 已停止' }}</span>
      <input v-model="portInput" type="text" style="width: 90px" placeholder="端口" />
      <button @click="applyPort">应用端口</button>
    </div>
    <p v-if="message" class="muted" style="margin-bottom: 12px">{{ message }}</p>

    <div style="max-width: 720px; background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px">
      <h3 style="margin: 0 0 12px; color: var(--accent)">OBS 配置步骤</h3>
      <ol class="muted" style="line-height: 2; margin: 0; padding-left: 20px">
        <li>在本页点击「启动服务」，确认状态为「运行中」</li>
        <li>打开 OBS → 来源 → 添加 → 「浏览器」</li>
        <li>勾选「自定义浏览器源」，URL 填入：<code style="color: var(--accent)">{{ overlayUrl || '（服务启动后显示）' }}</code></li>
        <li>宽高按需设置（建议 480×300），叠加层自动显示切片打点信息</li>
        <li>叠加层仅监听 127.0.0.1 本机回环地址，不会暴露到局域网</li>
      </ol>
    </div>
  </div>
</template>
