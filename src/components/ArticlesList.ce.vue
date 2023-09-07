<template>

  <div ref="root" id="articles-list">
    <ul>
      <li v-for="article, idx in articles" :key="qid">
        <div class="flex bg-white border shadow-sm rounded-xl p-4 md:p-5 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]">
          <div class="mr-2 text-right">{{ idx + 1 }}.</div>
          <div class="flex-col">
            <a class="text-lg font-medium text-blue-600 dark:text-blue-500 hover:underline" :href="article.url" target="_blank" v-html="article?.title || 'Untitled'"></a>
            <div v-if="article.authors" v-html="article.authors.map(a => a.label).join(', ')"></div>
            <div v-html="citation_line(article)"></div>
            <div class="flex mt-2">
              <a class="mr-[9px] " v-if="article.api === 'wikidata-articles'" :href="`https://www.wikidata.org/entity/${article.id}`" target="_blank" title="Open Wikidata entity page">
                <img class="h-4" src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg">
              </a>
              <a class="h-4" href="javascript;;" @click="articleSelected(article, $event)" title="SHow details modal">
                <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 640 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M392.8 1.2c-17-4.9-34.7 5-39.6 22l-128 448c-4.9 17 5 34.7 22 39.6s34.7-5 39.6-22l128-448c4.9-17-5-34.7-22-39.6zm80.6 120.1c-12.5 12.5-12.5 32.8 0 45.3L562.7 256l-89.4 89.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l112-112c12.5-12.5 12.5-32.8 0-45.3l-112-112c-12.5-12.5-32.8-12.5-45.3 0zm-306.7 0c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3l112 112c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256l89.4-89.4c12.5-12.5 12.5-32.8 0-45.3z"/></svg>         
              </a>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>

  <ve-modal-twp>
    <ve-article-card :article="selectedArticle"></ve-article-card>
  </ve-modal-twp>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'

  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  import type { Article } from '../types'

  const emit = defineEmits(['item-selected', 'get-next'])
 
  const store = useEntitiesStore()
  const { qid } = storeToRefs(store)

  const props = defineProps({
    total: { type: Number, default: 0 },
    articles: { type: Array, default: () => [] },
    id: { type: String },
    active: { type: Boolean, default: true }
  })

  watch(props, () => {
    isActive.value = props.active
    articles.value = props.articles as Article[]
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const isActive = ref(props.active)

  const selectedArticle = ref<Article | null>(null)
  watch(selectedArticle, () => {
    if (selectedArticle.value) {
      let modal = shadowRoot.value?.querySelector('ve-modal-twp')
      let isOpen = modal?.getAttribute('open') !== null
      if (isOpen) modal?.removeAttribute('open')
      else modal?.setAttribute('open', '')
    }
  })

  let doLayoutDebounceTimer:any

  const width = ref(0)
  watch(width, () => { 
    clearTimeout(doLayoutDebounceTimer)
    doLayoutDebounceTimer = setTimeout(() => doLayout(), 50)
  })

  const articles = ref<Article[]>(props.articles as Article[])
  // watch(articles, () => { if (articles.value.length > 0) console.log(toRaw(articles.value)) })

  function doLayout() {
    // console.log('doLayout')
  }

  function articleSelected(article:Article, evt:Event) {
    evt.preventDefault()
    emit('item-selected', article)
    selectedArticle.value = article
  }

  onMounted(() => { 
    // dialog = shadowRoot.value?.querySelector('.dialog')
    // dialog.addEventListener('sl-hide', (evt:CustomEvent) => showDialog.value = false )
    
    let priorScrollY = 0
    let checkGetMore = () => {
      if (isActive.value) {
        let scrollDirection = window.scrollY > priorScrollY ? 'down' : 'up'
        priorScrollY = window.scrollY
        if (scrollDirection === 'down' && window.innerHeight + window.scrollY >= document.body.offsetHeight - 2000) emit('get-next')
      }
    }

    let debouncedScrollHandler = (func, timeout) => {
      let timer:any
      return () => {
        clearTimeout(timer)
        timer = setTimeout(() => { func() }, timeout)
      }    
    }

    window.addEventListener('scroll', debouncedScrollHandler(checkGetMore, 50))
  })

  watch(root, () => {
    if (root.value) {
      width.value = root.value?.clientWidth || 0
      const resizeObserver = new ResizeObserver(() => {
        if (root.value?.clientWidth && root.value?.clientWidth !== width.value)
          width.value = root.value?.clientWidth
      })
      resizeObserver.observe(root.value)
    }
  })

  function citation_line(a:Article) {
    if (a.citation_line) return a.citation_line
    let parts:string[] = []
    if (a.publications) parts.push(a.publications.map(p => p.label).join(', '))
    if (a.volume) parts.push(`Vol. ${a.volume}`)
    if (a.issue) parts.push(`No. ${a.issue}`)
    if (a.publication_date) parts.push(`(${a.publication_date.getFullYear()})`)
    if (a.pages) parts.push(`pp. ${a.pages}`)
    return parts.join(', ') 
  }

</script>

<style>
  @import '../tailwind.css';
</style>