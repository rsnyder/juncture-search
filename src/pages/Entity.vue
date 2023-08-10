<template>

  <div>
    <toolbar logo="/images/juncture-logo.svg" title="Juncture Search"></toolbar>
    <div>
      <ve-entity-header></ve-entity-header>
    </div>
    <ve-viewers></ve-viewers>
  </div>
  
  </template>
    
  <script setup lang="ts">
  
    import { watch } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import Toolbar from '../components/Toolbar.vue'

    import '@shoelace-style/shoelace/dist/components/tag/tag.js'

    import { useEntitiesStore } from '../store/entities'
    import { storeToRefs } from 'pinia'
    const store = useEntitiesStore()

    const { active, language, qid } = storeToRefs(store)
    
    const route = useRoute()
    const router = useRouter()

    store.setQid(Array.isArray(route.params.qid) ? route.params.qid[0] : route.params.qid )
    store.setLanguage((Array.isArray(route.query.lang) ? route.query.lang[0] : route.query.lang) || 'en')
    let tab = (Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab) || 'images/images'
    store.setActive(tab)

    watch(route, () => {
      let qid = Array.isArray(route.params.qid) ? route.params.qid[0]: route.params.qid
      let language = (Array.isArray(route.query.lang) ? route.query.lang[0] : route.query.lang) || 'en'
      store.setQid(qid)
      store.setLanguage(language)
    })

    watch(qid, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })
    watch(language, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })
    watch(active, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })

  function setRoute(qid:string, lang:string, tab:string) {
    let options:any = { name: 'entity', params: { qid } }
    let query:any = {}
    if (lang !== 'en') query.lang = lang
    if (tab !== 'data/wd-statements') query.tab = tab
    if (Object.keys(query).length > 0) options.query = query
    router.push(options)
  }

  </script>
  
  <style>
  </style>

  ../../src/store/entities