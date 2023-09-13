<script setup lang="ts">

import { computed, ref, toRaw, watch } from 'vue'

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)

const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
const header = computed(() => shadowRoot.value?.querySelector('header'))
watch(header, (header) => { if (header) header.style.backgroundColor = props.color})

watch(host, () => {
  menuItems.value = host.value.querySelector('ul')
})

const menuItems = ref<HTMLUListElement>()

const props = defineProps({
  title: { type: String },
  logo: { type: String },
  color: { type: String, default: '#444' },
  auth: { type: String },
})

</script>

<template>
  
  <header ref="root"
    class="relative flex flex-wrap 2xl:justify-start 2xl:flex-nowrap z-30 w-full text-sm py-4 dark:bg-gray-800">
    
    <div class="max-w-[85rem] w-full mx-auto px-4 2xl:flex 2xl:items-center 2xl:justify-between" aria-label="Global">

      <div class="flex items-center gap-3 justify-between">
        <img v-if="logo" :src="logo" alt="Website Logo" class="h-[3em] max-w-none">
        <div v-else></div>
        <h1 v-if="title" v-html="title" class="text-4xl text-white font-semibold font-serif"></h1>
        <div v-else></div>
        <ve-menu v-if="menuItems" :auth="props.auth || null" v-html="menuItems.outerHTML"></ve-menu>
        <div v-else></div>
      </div>
  
    </div>

  </header>

</template>

<style>
  @import '../tailwind.css';
</style>
