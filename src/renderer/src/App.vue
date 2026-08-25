<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const version = ref('')
const route = useRoute()

onMounted(async () => {
  try {
    version.value = await window.api.app.getVersion()
  } catch {
    version.value = ''
  }
})
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <div class="brand">☀ 黎明图鉴</div>
      <nav>
        <RouterLink to="/">首页</RouterLink>
        <RouterLink to="/items">装备查询</RouterLink>
        <RouterLink to="/affixes">词缀查询</RouterLink>
        <RouterLink to="/monsters">怪物查询</RouterLink>
        <RouterLink to="/skills">技能查询</RouterLink>
        <RouterLink to="/constellations">星座查询</RouterLink>
        <RouterLink to="/overlay">OBS 叠加层</RouterLink>
        <RouterLink to="/slicing">直播切片打点</RouterLink>
      </nav>
      <div class="muted" style="margin-top: 16px; padding: 0 12px; font-size: 12px">
        v{{ version }}
      </div>
    </aside>
    <main class="content">
      <h1 class="page-title">{{ route.meta.title }}</h1>
      <RouterView />
    </main>
  </div>
</template>
