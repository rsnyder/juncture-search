<template>

  <!--
  <div ref="root">
    <toolbar logo="/images/juncture-logo.svg" title="Juncture Search"></toolbar>
    <ve-markdown></ve-markdown>
  </div>
  -->

  <div class="max-w-5xl m-auto">
    <panel>
      <div class="flex-col w-full max-w-[500px] m-auto">
        <h1 class="text-3xl font-bold">Juncture Search</h1>
        <p class="mt-2">High-resolution, open access images linked by all of Wikidata.  Curated metadata by the research community.</p>
        <ve-wikidata-search class="mt-4"></ve-wikidata-search>
        <p class="mt-2">Example: <a href="/entity/Q171497">sunflower</a>, rose</p>
      </div>
    </panel>

    <panel>
      <h1 class="text-2xl font-bold">Discover Web Content Focused on Specific Entities</h1>
      <p></p>
      <ul class="list-disc list-inside mt-2">
        <li>Images Illustrating a Particular Entity</li>
        <li>Scholarly Journal Articles Discussing an Entity</li>
        <li>Websites Offering Comprehensive Information and Resources on a Specific Entity</li>
      </ul>
    </panel>

    <panel>
    </panel>

    <panel>
      <h1 class="text-2xl font-bold">Contribute to crowdsourced metadata</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </panel>

  </div>

</template>
    
  <script setup lang="ts">
  
    import { computed, onMounted, ref, toRaw, watch, nextTick } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import Toolbar from '../components/Toolbar.vue'
    import Panel from '../components/Panel.vue'
    import Accordion from '../components/Accordion.vue'
    import Dropdown from '../components/Dropdown.vue'
    import Search from '../components/Search.vue'
    import { initFlowbite } from 'flowbite'

    import { useEntitiesStore } from '../store/entities'
    import { storeToRefs } from 'pinia'
    const store = useEntitiesStore()

    const { language, qid } = storeToRefs(store)
    
    const route = useRoute()
    const router = useRouter()

    const root = ref<HTMLElement | null>(null)
    
    onMounted(() => initFlowbite() )

    watch(qid, () => { if (qid.value) setRoute(qid.value, language.value) })
    watch(language, () => { if (qid.value) setRoute(qid.value, language.value) })

  function setRoute(qid:string, lang:string) {
    let options:any = { name: 'entity', params: { qid } }
    if (lang !== 'en') options.query = { lang }
    router.push(options)
  }

  </script>
  
  <style>
    @import '../tailwind.css';

    a {
    @apply underline text-blue-600 hover:text-blue-800 visited:text-purple-600
    }
  </style>