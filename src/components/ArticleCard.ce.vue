<script setup lang="ts">

import { PropType, ref } from 'vue'
import { Article } from '../types'

const root = ref<HTMLElement | null>(null)

const props = defineProps({
  article: Object as PropType<Article>
})

</script>

<template>

  <div class="flex flex-col bg-white border shadow-sm rounded-xl p-4 md:p-5 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7] dark:text-gray-400">
    <pre v-text="JSON.stringify(props.article, null, 2)"></pre>
  </div>

</template>

<style>
  @import '../tailwind.css';
</style>