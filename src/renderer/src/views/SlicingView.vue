<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface SliceRecord {
  id: number
  started_at: string
  ended_at: string | null
  title: string
  notes: string
  marker_count: number
}

interface MarkerRecord {
  id: number
  slice_id: number
  timestamp: number
  label: string
  created_at: string
}

const sliceTitle = ref('')
const markerLabel = ref('')
const activeSlice = ref<SliceRecord | null>(null)
const slices = ref<SliceRecord[]>([])
const markers = ref<MarkerRecord[]>([])
const selectedSlice = ref<number | null>(null)
const now = ref(Date.now())

const elapsedText = computed(() => {
  if (!activeSlice.value) return '--:--:--'
  const seconds = Math.max(0, Math.floor((now.value - new Date(activeSlice.value.started_at).getTime()) / 1000))
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(seconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
})

function fmtTime(seconds: number): string {
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')
  const s = String(Math.floor(seconds % 60)).padStart(2, '0')
  return `${h}:${m}:${s}`
}

async function refreshSlices(): Promise<void> {
  slices.value = (await window.api.slicing.list()) as SliceRecord[]
  activeSlice.value = slices.value.find((s) => s.ended_at === null) ?? null
}

async function refreshMarkers(sliceId: number | null = selectedSlice.value): Promise<void> {
  if (sliceId === null) {
    markers.value = []
    return
  }
  selectedSlice.value = sliceId
  markers.value = (await window.api.slicing.markers(sliceId)) as MarkerRecord[]
}

async function start(): Promise<void> {
  await window.api.slicing.start(sliceTitle.value.trim())
  sliceTitle.value = ''
  await refreshSlices()
}

async function end(): Promise<void> {
  if (!activeSlice.value) return
  await window.api.slicing.end(activeSlice.value.id)
  await refreshSlices()
}

async function mark(): Promise<void> {
  if (!activeSlice.value) return
  const label = markerLabel.value.trim() || '精彩时刻'
  await window.api.slicing.addMarker(activeSlice.value.id, label)
  markerLabel.value = ''
  await refreshSlices()
  if (selectedSlice.value === activeSlice.value.id) {
    await refreshMarkers()
  }
}

async function removeMarker(id: number): Promise<void> {
  await window.api.slicing.deleteMarker(id)
  await refreshMarkers()
}

async function removeSlice(id: number): Promise<void> {
  await window.api.slicing.deleteSlice(id)
  if (selectedSlice.value === id) {
    selectedSlice.value = null
    markers.value = []
  }
  await refreshSlices()
}

let timer: ReturnType<typeof setInterval> | undefined
onMounted(async () => {
  await refreshSlices()
  if (slices.value.length > 0) {
    await refreshMarkers(slices.value[0].id)
  }
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start">
    <!-- 左：活动切片控制台 -->
    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px">
      <h3 style="margin: 0 0 12px; color: var(--accent)">
        {{ activeSlice ? '● 切片进行中' : '○ 空闲' }}
      </h3>

      <template v-if="activeSlice">
        <div style="font-size: 32px; font-variant-numeric: tabular-nums; margin: 8px 0 14px">{{ elapsedText }}</div>
        <p class="muted" style="margin: 0 0 12px">
          {{ activeSlice.title || '未命名切片' }} · 开始于 {{ new Date(activeSlice.started_at).toLocaleTimeString() }}
        </p>
        <div class="toolbar">
          <input v-model="markerLabel" type="text" placeholder="打点标签（回车快速打点）" style="flex: 1" @keyup.enter="mark" />
          <button class="primary" @click="mark">打点</button>
          <button class="danger" @click="end">结束切片</button>
        </div>
        <div class="toolbar">
          <button v-for="label in ['BOSS', '好装备', '翻车', '高光']" :key="label" @click="() => { markerLabel = label; mark() }">
            {{ label }}
          </button>
        </div>
      </template>

      <template v-else>
        <div class="toolbar" style="margin-top: 8px">
          <input v-model="sliceTitle" type="text" placeholder="切片标题（可选）" style="flex: 1" @keyup.enter="start" />
          <button class="primary" @click="start">开始切片</button>
        </div>
        <p class="muted">开始后可通过快捷键打点记录精彩时刻，时间戳将实时推送到 OBS 叠加层</p>
      </template>
    </div>

    <!-- 右：历史切片与标记 -->
    <div style="background: var(--bg-panel); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px">
      <h3 style="margin: 0 0 12px; color: var(--accent)">切片历史</h3>
      <table style="font-size: 12px">
        <thead>
          <tr>
            <th>标题</th>
            <th>开始</th>
            <th>标记数</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in slices" :key="s.id">
            <td>
              <a href="#" @click.prevent="refreshMarkers(s.id)">{{ s.title || '未命名' }}</a>
            </td>
            <td>{{ new Date(s.started_at).toLocaleString() }}</td>
            <td>{{ s.marker_count }}</td>
            <td><button class="danger" style="padding: 2px 8px" @click="removeSlice(s.id)">删除</button></td>
          </tr>
          <tr v-if="slices.length === 0">
            <td colspan="4" class="empty">暂无切片记录</td>
          </tr>
        </tbody>
      </table>

      <template v-if="selectedSlice !== null">
        <h4 style="margin: 16px 0 8px; color: var(--text-dim)">标记列表</h4>
        <table style="font-size: 12px">
          <thead>
            <tr>
              <th>时间点</th>
              <th>标签</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in markers" :key="m.id">
              <td style="color: var(--accent); font-variant-numeric: tabular-nums">{{ fmtTime(m.timestamp) }}</td>
              <td>{{ m.label }}</td>
              <td><button class="danger" style="padding: 2px 8px" @click="removeMarker(m.id)">删除</button></td>
            </tr>
            <tr v-if="markers.length === 0">
              <td colspan="3" class="empty">该切片暂无标记</td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>
