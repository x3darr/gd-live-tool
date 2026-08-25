<script setup lang="ts">
import SearchView from '@renderer/components/SearchView.vue'
</script>

<template>
  <SearchView
    table="items"
    :columns="[
      { label: '名称', field: 'name' },
      { label: '类型', field: 'type' },
      { label: '稀有度', field: 'rarity' },
      { label: '等级', field: 'level' },
      { label: '需求', field: 'requirements' },
      { label: '属性', field: 'stats' },
      { label: '备注', field: 'notes' }
    ]"
    :filters="[
      { label: '类型', field: 'type' },
      { label: '稀有度', field: 'rarity' }
    ]"
  />
</template>
