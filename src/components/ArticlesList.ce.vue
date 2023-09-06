<template>

  <div ref="root" id="articles-list">
    <ul>
      <li v-for="article, idx in articles" :key="qid" @click="articleSelected(article)">
        <div class="flex">
          <span class="w-10 mr-2 text-right">{{ idx + 1 }}.</span>
          <a class="font-medium text-blue-600 dark:text-blue-500 hover:underline" :href="article.url" target="_blank" v-html="article?.title || 'Untitled'"></a>
        </div>
        <!--<ul class="subjects">
          <li v-for="subject in article['main subject']" :key="subject['@id']" v-html="subject.label"></li>
        </ul>-->
      </li>
    </ul>
  </div>

    <sl-dialog class="dialog" :style="{'--width':dialogWidth}">
    <div>
      {{ selectedArticle?.id }}
    </div>
    <sl-button slot="footer" variant="primary" @click="selectedArticle = null">Close</sl-button>
  </sl-dialog>

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
    showDialog.value = selectedArticle.value !== null 
  })

  let doLayoutDebounceTimer:any

  const width = ref(0)
  watch(width, () => { 
    clearTimeout(doLayoutDebounceTimer)
    doLayoutDebounceTimer = setTimeout(() => doLayout(), 50)
  })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  const articles = ref<Article[]>(props.articles as Article[])
  // watch(articles, () => { if (articles.value.length > 0) console.log(toRaw(articles.value)) })

  function doLayout() {
    // console.log('doLayout')
  }

  function articleSelected(article:Article) {
    emit('item-selected', article)
  }

  onMounted(() => { 
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => showDialog.value = false )
    
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


</script>

<style>
  @import '../tailwind.css';
</style>