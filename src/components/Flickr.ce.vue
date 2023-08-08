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
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import { licenseUrl } from '../lib/licenses'
  import type { Image } from '../types'

  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'bhl' },
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
      source: 'flickr'
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
    return {
      aspect_ratio: Number((item.width/item.height).toFixed(4)),
      attribution: item.attribution,
      creator: item.creator_url,
      details: item,
      id: item.id,
      label: item.title,
      license: licenseUrl(item.license),
      logo: 'https://combo.staticflickr.com/pw/favicon.ico',
      provider: 'Flickr',
      source: item.foreign_landing_url,
      thumbnail: item.thumbnail,
      url: item.url,
    }
  }


  function updateImage(id: string, image: Image) {
    let idx = images.value.findIndex((i:Image) => i.id === id)
    if (idx > -1) {
      let updated = [...images.value]
      updated[idx] = image
      images.value = updated
      store.$state.imagesMap = {...Object.fromEntries(updated.map((i:Image) => [i.id, i])) }
    }
  }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
    let image = imagesMap.value[id]
    let flickrId = image.source.split('/').pop()
    
    fetch (`/api/flickr/getInfo/${flickrId}`)
      .then(response => response.json())
      .then(data => data.photo)
      .then(photo => {
        if (photo.description) {
          image.description = photo.description._content
          updateImage(id, image)
        }
      })
    
      fetch (`/api/flickr/getSizes/${flickrId}`)
      .then(response => response.json())
      .then(data => data.sizes)
      .then(sizes => {
        let original = sizes.size.find((s:any) => s.label === 'Original')
        if (original) {
          image.url = original.source
          image.width = original.width
          image.height = original.height
          updateImage(id, image)
        }
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