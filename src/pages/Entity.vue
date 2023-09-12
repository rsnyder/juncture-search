<template>

  <ve-header class="max-w-5xl m-auto rounded mb-4" color="#444A1E" logo="/images/phl-logo.png" title="Plant Humanities Lab">
    <ul>
      <li><a href="https://lab.plant-humanities.org">
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>
        Home</a></li>
      <li><a href="/">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) -->
          <path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/>
        </svg>
        Search
      </a></li>
    </ul>
  </ve-header>

  <main class="max-w-5xl m-auto rounded mb-4" >
    <div>
      <ve-entity-header></ve-entity-header>
    </div>
    <ve-viewers></ve-viewers>
  </main>
  
  </template>
    
  <script setup lang="ts">
  
    import { onMounted, toRaw, watch } from 'vue'
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
    let tab = (Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab) || 'images'
    store.setActive(tab)

    watch(route, () => {
      let qid = Array.isArray(route.params.qid) ? route.params.qid[0]: route.params.qid
      let language = (Array.isArray(route.query.lang) ? route.query.lang[0] : route.query.lang) || 'en'
      store.setQid(qid)
      store.setLanguage(language)
    })

    onMounted(() => {
      if (route.query.tab) {
        let tab = (Array.isArray(route.query.tab) ? route.query.tab[0] : route.query.tab) || 'images'
        store.setActive(tab)
      }
      else {
        store.setActive('images')
      }
    })

    watch(qid, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })
    watch(language, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })
    watch(active, () => { if (qid.value) setRoute(qid.value, language.value, active.value) })

  function setRoute(qid:string, lang:string, tab:string) {
    // console.log('setRoute', qid, lang, tab)
    let options:any = { name: 'entity', params: { qid } }
    let query:any = {}
    if (lang !== 'en') query.lang = lang
    if (tab !== 'images') query.tab = tab
    if (Object.keys(query).length > 0) options.query = query
    router.push(options)
  }

  </script>
  
  <style>
  </style>