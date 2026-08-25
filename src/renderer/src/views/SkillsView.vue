<script setup lang="ts">
import SearchView from '@renderer/components/SearchView.vue'
</script>

<template>
  <SearchView
    table="skills"
    :columns="[
      { label: '名称', field: 'name' },
      { label: '专精', field: 'mastery' },
      { label: '类别', field: 'category' },
      { label: '描述', field: 'description' },
      { label: '数据', field: 'stats' }
    ]"
    :filters="[
      { label: '专精', field: 'mastery' },
      { label: '类别', field: 'category' }
    ]"
  />
</template>
