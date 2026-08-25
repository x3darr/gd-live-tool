<script setup lang="ts">
import SearchView from '@renderer/components/SearchView.vue'
</script>

<template>
  <SearchView
    table="monsters"
    :columns="[
      { label: '名称', field: 'name' },
      { label: '区域', field: 'area' },
      { label: '类型', field: 'type' },
      { label: '等级', field: 'level' },
      { label: '掉落', field: 'drops' },
      { label: '备注', field: 'notes' }
    ]"
    :filters="[
      { label: '区域', field: 'area' },
      { label: '类型', field: 'type' }
    ]"
  />
</template>
