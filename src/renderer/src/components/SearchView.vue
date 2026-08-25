<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { QueryableTable, SearchOptions } from '../../../main/modules/query'

/**
 * 通用资料查询组件：关键字搜索 + 字段过滤 + 结果表格。
 * 所有查询模块（装备/词缀/怪物/技能/星座）复用此组件。
 */
const props = defineProps<{
  table: QueryableTable
  /** 列配置：显示名 → 数据字段 */
  columns: Array<{ label: string; field: string }>
  /** 过滤下拉：显示名 → 数据字段 */
  filters?: Array<{ label: string; field: string }>
}>()

const keyword = ref('')
const filterValues = ref<Record<string, string>>({})
const distinctOptions = ref<Record<string, string[]>>({})
const records = ref<Array<Record<string, unknown>>>([])
const loading = ref(false)

async function loadDistinct(): Promise<void> {
  for (const f of props.filters ?? []) {
    try {
      distinctOptions.value[f.field] = await window.api.distinct(props.table, f.field)
    } catch {
      distinctOptions.value[f.field] = []
    }
  }
}

async function search(): Promise<void> {
  loading.value = true
  try {
    const options: SearchOptions = { keyword: keyword.value }
    const activeFilters = Object.fromEntries(
      Object.entries(filterValues.value).filter(([, v]) => v)
    )
    if (Object.keys(activeFilters).length > 0) {
      options.filters = activeFilters
    }
    records.value = (await window.api.search(props.table, options)) as Array<Record<string, unknown>>
  } finally {
    loading.value = false
  }
}

function reset(): void {
  keyword.value = ''
  filterValues.value = {}
  void search()
}

watch(() => props.table, loadDistinct)

onMounted(() => {
  void loadDistinct()
  void search()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <input
        v-model="keyword"
        type="text"
        placeholder="输入关键字搜索…"
        style="width: 260px"
        @keyup.enter="search"
      />
      <select
        v-for="f in filters ?? []"
        :key="f.field"
        v-model="filterValues[f.field]"
        style="min-width: 120px"
        @change="search"
      >
        <option value="">{{ f.label }}：全部</option>
        <option v-for="opt in distinctOptions[f.field] ?? []" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
      <button class="primary" :disabled="loading" @click="search">搜索</button>
      <button :disabled="loading" @click="reset">重置</button>
    </div>

    <table>
      <thead>
        <tr>
          <th v-for="c in columns" :key="c.field">{{ c.label }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="r in records" :key="String(r.id)">
          <td v-for="c in columns" :key="c.field">
            <span v-if="Array.isArray(r[c.field])">{{ (r[c.field] as unknown[]).join('、') }}</span>
            <span v-else-if="r[c.field] === null || r[c.field] === ''" class="muted">—</span>
            <span v-else>{{ r[c.field] }}</span>
          </td>
        </tr>
        <tr v-if="records.length === 0 && !loading">
          <td :colspan="columns.length" class="empty">暂无数据（待导入游戏资料）</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
