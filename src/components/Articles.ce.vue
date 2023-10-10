<template>

  <div ref="root">

    <div v-if="fetching" class="flex w-full items-center justify-center space-x-4 m-4">
      <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span class="sr-only">Loading...</span>
      </div>
      <span class="text-xl font-medium">Finding articles...</span>
    </div>

    <div v-else>

      <div slot="summary">
        <span v-html="props.label" class="title"></span>
      </div>

      <div class="hs-dropdown relative inline-flex" data-hs-dropdown-auto-close="inside">
        <button id="hs-dropdown-item-checkbox" type="button" 
          class="ml-1 hs-dropdown-toggle py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
          Content providers
          <svg class="hs-dropdown-open:rotate-180 w-2.5 h-2.5 text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" aria-labelledby="hs-dropdown-item-checkbox">
          
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-openalex" data-provider="OpenAlex" name="hs-dropdown-item-checkbox-openalex" type="checkbox"
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.OpenAlex ? true : false"
              >
            </div>
            <img src="https://www.gitbook.com/cdn-cgi/image/width=24,dpr=2,height=24,fit=contain,format=auto/https%3A%2F%2F2520693015-files.gitbook.io%2F~%2Ffiles%2Fv0%2Fb%2Fgitbook-x-prod.appspot.com%2Fo%2Fspaces%252FpHVuV3Ib5KXeBKft4Kcl%252Ficon%252FogQFSOcLuYxWvYBhmDaU%252Fopenalex%2520logo%2520twitter.jpg%3Falt%3Dmedia%26token%3D5136a792-47d6-4d18-96eb-2012b55844d0" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-openalex" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">OpenAlex</span>
            </label>
          </div>

          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-wikidata" data-provider="Wikidata" name="hs-dropdown-item-checkbox-wikidata" type="checkbox"
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.Wikidata ? true : false"
              >
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-wikidata" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">Wikidata</span>
            </label>
          </div>
          
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-jstor" data-provider="JSTOR" name="hs-dropdown-item-checkbox-jstor" type="checkbox" 
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.JSTOR ? true : false"
              >
            </div>
            <img src="https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-jstor" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">JSTOR</span>
            </label>
          </div>
    
        </div>
      </div>

      <!--
      <div class="filters">

        <div id="providers">
          <span>Provider: </span>
          <sl-checkbox id="Wikidata" :checked="providersEnabled['Wikidata']" @click="setProviders">Wikidata</sl-checkbox><br/>
          <sl-checkbox id="JSTOR" :checked="providersEnabled['JSTOR']" @click="setProviders">JSTOR</sl-checkbox>        
        </div>

      </div>
      -->

    </div>

    <ve-articles-list 
      :id="id"
      :active="isActive"
      :articles="articles" 
      @get-next="getNext" 
      @item-selected="itemSelected"
    ></ve-articles-list>

  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Article, ArticleProvider } from '../types'
  // @ts-ignore
  import { HSDropdown } from '../lib/preline/components/hs-dropdown'

  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'

  import { Wikidata } from '../lib/document-providers/Wikidata'
  import { JSTOR } from '../lib/document-providers/JSTOR'
  import { OpenAlex } from '../lib/document-providers/OpenAlex'

  const store = useEntitiesStore()
  const { active, articlesMap, labels, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(shadowRoot, (shadowRoot) => new HSDropdown(shadowRoot).init() )

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  const entity = ref<any>()

  watch(entity, () => {
    if (!entity.value) return
    articles.value = []
    initProviders()
  })

  let articleProviders = [
    { class: OpenAlex, tag: 'OpenAlex', enabled: true},
    { class: Wikidata, tag: 'Wikidata', enabled: true},
    { class: JSTOR, tag: 'JSTOR', enabled: true},
  ]
  const providers = ref<any[]>([])
  const providersEnabled = ref<any>({})
  watch(providers, () => { if (isActive.value) getNext() })  

  function initProviders(limit = -1) {
    providers.value = articleProviders
      .filter(p => p.enabled)
      .map(p => ({ instance: new p.class(entity.value, refresh, limit), tag: p.tag }))
    providersEnabled.value = articleProviders
      .filter(p => p.enabled)
      .reduce((acc, p) => { acc[p.tag] = p.enabled; return acc }, {})
  }

  const sortby = ref<string>()
  watch(sortby, () => { 
  })

  const mainSubjectsFilter = ref<string[]>([])
  watch(mainSubjectsFilter, () => {
    // console.log(`mainSubjectsFilter=${mainSubjectsFilter.value}`)
  })

  watch(isActive, async () => {
    // console.log(`Articles.isActive=${isActive.value} qid=${qid.value}`)
    if (isActive.value) {
      if (qid.value !== entity.value?.id) {
        articles.value = []
        entity.value = await store.fetch(qid.value)
      } else if (!articles.value.length) {
        getNext()
      }
    }
  })

  // watch(active, () => console.log(`active=${active.value}`))

  watch(qid, async () => { 
    articles.value = []
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  onMounted(async () => {
    entity.value = await store.fetch(qid.value)
  })

  const mainSubjectsProcessed = new Set()
  function getMainSubjects(provider: ArticleProvider) {
    if (mainSubjectsProcessed.has(provider.id)) return
    provider.getMainSubjects().then((depicted: any) => {
      let updated = {...mainSubjects.value}
      let qids = Object.keys(depicted)
      if (qids.length === 0) return
      for (let qid of qids) {
        if (updated[qid]) updated[qid] += depicted[qid]
        else updated[qid] = depicted[qid]
      }
      mainSubjects.value = updated
    })
    mainSubjectsProcessed.add(provider.id)
  }

  let initial = true
  let fetching = false
  async function getNext() {
    if (fetching) return
    fetching = true
    let toAdd = 0
    for (let provider of providers.value) {
      if (providersEnabled.value[provider.tag]) {
        while (provider.instance.hasMore() && toAdd < 50) {
          let providerArticles = await provider.instance.next()
          if (initial) getMainSubjects(provider.instance)
          if (providerArticles.length === 0) break
          articles.value = [...articles.value, ...providerArticles]
          toAdd += providerArticles.length
        }
        if (initial) getMainSubjects(provider.instance)
        if (toAdd >= 50 && !initial) break
      }
    }
    initial = false
    fetching = false
  }

  function setProviders(e: any) {
    console.log('setProviders', e.target.id)
    e.preventDefault()
    e.stopPropagation()
    let providerTag = e.target.dataset.provider
    console.log(shadowRoot.value?.querySelectorAll(`[data-provider="${providerTag}"]`))
    shadowRoot.value?.querySelectorAll(`[data-provider="${providerTag}"]`).forEach((el: any) => el.checked = !el.checked)

    providers.value = providers.value.map(p => { p.hasMore = true; return p; } )
    providers.value.forEach(p => p.instance.reset())
    let copy = {...providersEnabled.value}
    copy[providerTag] = !copy[providerTag]
    console.log('setProviders', copy)
    providersEnabled.value = copy
    articles.value = []
    getNext()
  }
  const articles = ref<Article[]>([])
  watch(articles, () => {
    store.$state.articlesMap = {...articlesMap.value, ...Object.fromEntries(articles.value.map((a:Article) => [a.id, a])) }
    if (articles.value.length === 0) mainSubjects.value = {}
  })

  const mainSubjects = ref<any>({})
  watch (mainSubjects, () => {
    // console.log('mainSubjects', toRaw(mainSubjects.value))
    store.updateLabels(Object.keys(mainSubjects.value))
  })

  function itemSelected(e: any) {
    let selectedArticle = e.detail[0]
    console.log('itemSelected', selectedArticle)
    let provider = providers.value.find(p => p.instance.id === selectedArticle.api).instance
    provider.articleSelected(selectedArticle).then(qids => { 
      if (qids?.length > 0) store.updateLabels(qids) 
    })
  }

</script>

<style>
  @import '../tailwind.css';

  .title {
    font-size: 1.5em;
    font-weight: bold;
  }
  .count {
    font-size: 1.2;
    color: #666;
    padding-left: .5em;
  }
</style>