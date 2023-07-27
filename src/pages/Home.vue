<template>

  <div ref="root">
    <toolbar logo="/images/vue.svg" title="Juncture Search"></toolbar>
    <ve-markdown></ve-markdown>
  </div>
  
  </template>
    
  <script setup lang="ts">
  
    import { computed, onMounted, ref, toRaw, watch, nextTick } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import Toolbar from '../components/Toolbar.vue'
  
    import { useEntitiesStore } from '../store/entities'
    import { storeToRefs } from 'pinia'
    const store = useEntitiesStore()

    const { language, qid } = storeToRefs(store)
    
    const route = useRoute()
    const router = useRouter()

    const root = ref<HTMLElement | null>(null)
    
    watch(qid, () => { if (qid.value) setRoute(qid.value, language.value) })
    watch(language, () => { if (qid.value) setRoute(qid.value, language.value) })

  function setRoute(qid:string, lang:string) {
    let options:any = { name: 'entity', params: { qid } }
    if (lang !== 'en') options.query = { lang }
    router.push(options)
  }

  </script>
  
  <style>
  </style>../../src/store/entities