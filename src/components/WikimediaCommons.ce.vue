<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ images?.length.toLocaleString() }})</span>
    <ve-image-grid id="wc" :items="images" @item-selected="itemSelected" :active="isActive"></ve-image-grid>
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
  
  const store = useEntitiesStore()
  const { active, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => {
    // console.log(`wc.watch.isActive: isActive=${isActive.value} qid=${qid.value} images=${images.value?.length || 0}`)
    if (isActive.value && !images.value) doQuery()
  })

  watch(qid, () => {
    images.value = null
    // console.log(`wc.watch.qid: qid=${qid.value} isActive=${isActive.value} images=0`)
    if (isActive.value) doQuery()
  })

  onMounted(() => { 
    // console.log(`wc.mounted: qid=${qid.value} isActive=${isActive.value} images=${images.value?.length || 0}`)
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => {
      if (evt.target === dialog) metadata.value = undefined
    })
    if (isActive.value) doQuery() 
  })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  interface ImageData {
    id: string;
    thumb: string;
    alt: string;
    width: number;
    height: number;
    createdBy: boolean;
    depicts: any[];
  }

  const images = ref<ImageData[] | null>()
  watch(images, () => { 
    // console.log(`wc.watch.images: qid=${qid.value} isActive=${isActive.value} images=${images.value?.length || 0}`)
    // console.log(toRaw(images.value))
    let distinct = new Set(images.value?.map(image => image.id))
    let numCreatedBy = images.value?.reduce((acc, cur) => acc + (cur.createdBy ? 1 : 0), 0)
    let numDepicts = images.value?.reduce((acc, cur) => acc + (cur.depicts.find(depicted => qid.value === depicted.id) ? 1 : 0), 0)
    // console.log(`distinct=${distinct.size} depicts=${numDepicts} createdBy=${numCreatedBy}`)
  })
  
  const metadata = ref()
  watch(metadata, () => { showDialog.value = metadata.value !== undefined })
  
  function doQuery() {
    // console.log('wc.doQuery')
    Promise.all([
      fetch(`/api/commons/wc/${qid.value}`),
      fetch(`/api/commons/wd/${qid.value}`)
    ]).then(async ([commons, wikidata]) => {
      const commonsData = await commons.json()
      const wikidataData = await wikidata.json()
      images.value = [...commonsData, ...wikidataData].sort((a: any, b: any) => b.score - a.score)
    })
  }

  async function getMetadata(id: string) {
    return await store.fetch(id)
  }

  async function itemSelected(evt: CustomEvent) {
    metadata.value = await getMetadata(evt.detail[0].id)
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