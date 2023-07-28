<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ total.toLocaleString() }})</span>
    <!--
    <ve-image-grid 
      id="openverse" 
      :active="isActive"
      :total="total" 
      :items="images" 
      @get-next="doQuery()" 
      @item-selected="itemSelected" 
    ></ve-image-grid>
    -->
    <ve-pig 
      id="bhl"
      :active="isActive"
      :items="images" 
      @get-next="doQuery()"
      @item-selected="itemSelected"
    ></ve-pig>
  </div>

  <sl-dialog :label="label" class="dialog" :style="{'--width':dialogWidth}">
    <div v-if="metadata" class="metadata">
      <ve-statements :eid="metadata.id"></ve-statements>
    </div>
    <sl-button slot="footer" variant="primary" @click="showDialog = false">Close</sl-button>
  </sl-dialog>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import { licenseUrl } from '../lib/licenses'
  import type { Image } from '../images'

  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (isActive.value && !images.value.length) doQuery() })

  const entity = ref<any>()
  watch(entity, () => { if (isActive.value) doQuery() })

  watch(qid, async () => {
    images.value = []
    if (isActive) entity.value = await store.fetch(qid.value)  
  })

  onMounted(async () => {
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => { if (evt.target === dialog) metadata.value = undefined })
    if (isActive && qid.value) entity.value = await store.fetch(qid.value)  
  })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  const total = ref(0)
  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
 })

  const metadata = ref()
  watch(metadata, () => { showDialog.value = metadata.value !== undefined })
  
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
      source: 'bio_diversity'
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
    // console.log(item)
    let doc: any = {id: item.id, source: 'openverse', images:{}}
    doc.attribution = item.attribution
    doc.creator = item.creator_url
    doc.url = item.url
    if (item.title) doc.label = item.title
    if (item.license) doc.license = licenseUrl(item.license)
    doc.source = item.foreign_landing_url
    doc.provider = 'Biodiversity Heritage Library'
    doc.logo = 'https://www.biodiversitylibrary.org/favicon.ico'
    doc.thumbnail = item.thumbnail
    doc.aspect_ratio = Number((item.width/item.height).toFixed(4)),

    doc.details = {}
    return doc
  }

  async function getMetadata(id: string) {
    return await store.fetch(id)
  }

  function updateImage(id: string, image: Image) {
    let idx = images.value.findIndex((i:Image) => i.id === id)
    if (idx > -1) {
      let updated = [...images.value]
      updated[idx] = image
      images.value = updated
      store.$state.imagesMap = {...Object.fromEntries(updated.map((i:Image) => [i.id, i])) }
      // console.log('updated', toRaw(imagesMap.value[id]))
      // console.log('updated', toRaw(image))
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
        // console.log(photo)
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


    // metadata.value = await getMetadata(evt.detail[0].id)
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