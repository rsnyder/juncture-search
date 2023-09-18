<template>

  <div ref="root">

    <div v-if="fetching" class="flex w-full items-center justify-center space-x-4 m-4">
      <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span class="sr-only">Loading...</span>
      </div>
      <span class="text-xl font-medium">Finding articles...</span>
    </div>

    <sl-details v-else>
      <div slot="summary">
        <span v-html="props.label" class="title"></span>
      </div>
      
      <div class="filters">

        <div id="providers">
          <span>Provider: </span>
          <sl-checkbox id="Wikimedia Commons" :checked="providersEnabled['Wikimedia Commons']" @click="setProviders">Wikimedia Commons</sl-checkbox>
          <sl-checkbox id="JSTOR" :checked="providersEnabled['JSTOR']" @click="setProviders">JSTOR</sl-checkbox>        </div>
      </div>
    </sl-details>

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

  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'

  import { Wikidata } from '../lib/document-providers/Wikidata'
  import { JSTOR } from '../lib/document-providers/JSTOR'

  const store = useEntitiesStore()
  const { active, articlesMap, labels, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  const entity = ref<any>()

  watch(entity, () => {
    if (!entity.value) return
    articles.value = []
    initProviders()
  })

  let articleProviders = [
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

  const createdBy = ref<boolean>(false)
  watch(createdBy, () => {
    // console.log(`createdBy=${createdBy.value}`)
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
    e.preventDefault()
    e.stopPropagation()
    let providerTag = e.target.id
    providers.value = providers.value.map(p => { p.hasMore = true; return p; } )
    providers.value.forEach(p => p.instance.reset())
    let copy = {...providersEnabled.value}
    copy[providerTag] = !copy[providerTag]
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