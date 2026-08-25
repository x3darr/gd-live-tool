<script setup lang="ts">
import SearchView from '@renderer/components/SearchView.vue'
</script>

<template>
  <SearchView
    table="constellations"
    :columns="[
      { label: '名称', field: 'name' },
      { label: '亲和', field: 'affinity' },
      { label: '层级', field: 'tier' },
      { label: '点数', field: 'points' },
      { label: '效果', field: 'effects' },
      { label: '解锁', field: 'unlocks' }
    ]"
    :filters="[{ label: '亲和', field: 'affinity' }]"
  />
</template>
