<script setup lang="ts">
import SearchView from '@renderer/components/SearchView.vue'
</script>

<template>
  <SearchView
    table="affixes"
    :columns="[
      { label: '名称', field: 'name' },
      { label: '适用部位', field: 'slot' },
      { label: '稀有度', field: 'rarity' },
      { label: '属性', field: 'stats' },
      { label: '来源', field: 'source' }
    ]"
    :filters="[
      { label: '部位', field: 'slot' },
      { label: '稀有度', field: 'rarity' }
    ]"
  />
</template>
