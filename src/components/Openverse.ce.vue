<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ total.toLocaleString() }})</span>
    <ve-pig 
      :id="id"
      :active="isActive"
      :items="images" 
      @get-next="doQuery()" 
      @item-selected="itemSelected" 
    ></ve-pig>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import { licenseUrl } from '../lib/licenses'
  import type { Image } from '../types'

  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'openverse' },
  })

  const root = ref<HTMLElement | null>(null)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (isActive.value && !images.value.length) doQuery() })

  const entity = ref<any>()
  watch(entity, () => { if (isActive.value) doQuery() })

  watch(qid, async () => {
    images.value = []
    if (isActive) entity.value = await store.fetch(qid.value)  
  })

  onMounted(async () => { 
    if (isActive && qid.value) entity.value = await store.fetch(qid.value)  
  })

  const total = ref(0)
  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
 })
  
  let priorPage = 0
  let isFetching = false

  async function doQuery(page=0) {
    if (isFetching) return
    isFetching = true
    
    let args = {
      q: `"${entity.value.label}"`,
      page_size: 20,
      page: page || priorPage + 1,
      license_type: 'all-cc',
    }
    let qargs = Object.keys(args).map(k => `${k}=${args[k]}`).join('&')
  
    let resp:any = await fetch(`/api/openverse/?${qargs}`)
    isFetching = false
    if (resp.ok) {
      resp = await resp.json()
      priorPage = resp.page
      images.value = [...images.value, ...resp.results.map((item: any) => transformItem(item))]
      total.value = resp.result_count
    }
  }

  function transformItem(item: any): any {
    let doc: any = {id: item.id, source: 'openverse', images:{}}
    doc.url = item.detail_url
    if (item.title) doc.label = item.title
    if (item.license) doc.license = licenseUrl(item.license)
    doc.thumbnail = item.thumbnail
    doc.aspect_ratio = Number((item.width/item.height).toFixed(4)),

    doc.details = {}
    return doc
  }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
    console.log('itemSelected', id)
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