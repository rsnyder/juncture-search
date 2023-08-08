<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ images?.length.toLocaleString() }})</span>
    <ve-pig 
      :id="id"
      :active="isActive"
      :total="images?.length || 0" 
      :items="showing" 
      @get-next="getNext" 
    ></ve-pig>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../types'

  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'wc' },
  })

  const root = ref<HTMLElement | null>(null)
  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const entity = ref<any>()
  const commonsCategory = computed(() => entity.value?.claims.P373 && entity.value?.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_') )

  watch(entity, () => {
    images.value = []
    if (isActive.value && !images.value.length) doQuery()
    // if (entity.value?.claims.P373) doQuery()
  })

  watch(isActive, async () => {
    if (isActive.value && qid.value !== entity.value?.id) entity.value = await store.fetch(qid.value)
  })

  watch(qid, async () => { 
    images.value = []
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  onMounted(async () => {
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
    end.value = Math.min(50, images.value.length)
  })

  const showing = computed(() => { return images.value.slice(0, end.value) })

  const end = ref(0)
  function getNext() { end.value = Math.min(end.value + 50, images.value.length) }
  
  const sourcesToInclude = ['wikidata', 'commons', 'commons-categories']

  async function doQuery() {
    images.value = []
    const refreshQarg = new URL(location.href).searchParams.get('refresh')
    const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())
  
    if (!refresh) {
      let cachedResults = await fetch(`/api/cache/wc-${qid.value}`)
      if (cachedResults.ok) {
        images.value = await cachedResults.json()
        return
      }
    }

    let promises: Promise<any>[] = []
    if (sourcesToInclude.includes('commons')) promises.push(fetch(`/api/commons/${qid.value}`))
    if (sourcesToInclude.includes('wikidata')) promises.push(fetch(`/api/wikidata/${qid.value}`))
    if (sourcesToInclude.includes('atlas')) promises.push(fetch(`/api/atlas/${qid.value}`))
    if (commonsCategory.value && sourcesToInclude.includes('commons-categories')) promises.push(fetch(`/api/commons-categories/${commonsCategory.value}`))
    
    Promise.all(promises).then(async (responses) => {
      let idx = 0
      const commonsData = sourcesToInclude.includes('commons') ? await responses[idx++].json() : []
      const wikidataData = sourcesToInclude.includes('wikidata') ? await responses[idx++].json() : []
      const categoriesData = commonsCategory.value && sourcesToInclude.includes('commons-categories') ? await responses[idx++].json() : []
      let all:any = 
        scoreImages([...commonsData, ...wikidataData, ...categoriesData])
        .sort((a: any, b: any) => b.score - a.score)
      
      let ids = new Set()
      let deduped = all
        .filter(img => {
          if (ids.has(img.id)) return false
          ids.add(img.id)
          return true
        })
      images.value = deduped
      if (images.value.length) {
        cacheResults()
      }
    })
  }

  const depicts = ref<any>({})
  watch (depicts, () => {
    store.updateLabels(Object.keys(depicts.value))
  })
  
  function cacheResults() {
    fetch(`/api/cache/wc-${qid.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images.value)
    })
  }

  function scoreImages(images) {
    return images.map(img => {
      img.score = 0
      if (img.depicts) {
        let depicted: any = Object.values(img.depicts).find((d:any) => d.id === qid.value)
        if (depicted?.dro) img.score += 5
        else if (depicted?.prominent) img.score += 2
        else if (depicted) img.score += 1
      }
      if (img.imageQualityAssessment === 'featured') img.score += 3
      else if (img.imageQualityAssessment === 'quality') img.score += 2
      else if (img.imageQualityAssessment === 'valued') img.score += 1
      return img
    })
  }

</script>

<style>
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