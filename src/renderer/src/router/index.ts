import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'home', component: () => import('@renderer/views/HomeView.vue'), meta: { title: '首页' } },
  { path: '/items', name: 'items', component: () => import('@renderer/views/ItemsView.vue'), meta: { title: '装备查询' } },
  { path: '/affixes', name: 'affixes', component: () => import('@renderer/views/AffixesView.vue'), meta: { title: '词缀查询' } },
  { path: '/monsters', name: 'monsters', component: () => import('@renderer/views/MonstersView.vue'), meta: { title: '怪物查询' } },
  { path: '/skills', name: 'skills', component: () => import('@renderer/views/SkillsView.vue'), meta: { title: '技能查询' } },
  { path: '/constellations', name: 'constellations', component: () => import('@renderer/views/ConstellationsView.vue'), meta: { title: '星座查询' } },
  { path: '/overlay', name: 'overlay', component: () => import('@renderer/views/OverlayView.vue'), meta: { title: 'OBS 叠加层' } },
  { path: '/slicing', name: 'slicing', component: () => import('@renderer/views/SlicingView.vue'), meta: { title: '直播切片打点' } }
]

// Electron 本地文件场景使用 hash 路由，避免 file:// 路径解析问题
export default createRouter({
  history: createWebHashHistory(),
  routes
})
