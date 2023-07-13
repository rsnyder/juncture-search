<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ images?.length.toLocaleString() }})</span>
    <!--<ve-image-grid  id="wd" :items="images" :active="isActive"></ve-image-grid> -->
    <ve-pig 
      id="wc"
      :active="isActive"
      :total="images?.length || 0" 
      :items="images"
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
    // console.log(`wd.watch.isActive: isActive=${isActive.value} qid=${qid.value} images=${allImages.value?.length || 0}`)
    if (isActive.value && !allImages.value) doQuery()
  })

  watch(qid, () => {
    allImages.value = null
    // console.log(`wd.watch.qid: qid=${qid.value} isActive=${isActive.value} images=0`)
    if (isActive.value) doQuery()
  })

  onMounted(() => { 
    // console.log(`wd.mounted: qid=${qid.value} isActive=${isActive.value} images=${allImages.value?.length || 0}`)
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
    thumb: string;
    alt: string;
    width: number;
    height: number;
  }

  const allImages = ref<ImageData[] | null>()
  watch(allImages, () => { 
    // console.log(`wd.watch.allImages: qid=${qid.value} isActive=${isActive.value} images=${allImages.value?.length || 0}`)
  })
  
  const start = ref(0)
  const limit = ref(50)
  const images = computed(() => allImages.value?.slice(start.value, start.value + limit.value))
  // watch(images, () => { console.log(toRaw(images.value)) })

  const metadata = ref()
  watch(metadata, () => { showDialog.value = metadata.value !== undefined })
  
  function doQuery() {
    // console.log('wd.doQuery')
    fetch(`/api/wikidata/${qid.value}`)
      .then(resp => resp.json())
      .then(data => allImages.value = data)
  }

  async function getMetadata(id: string) {
    return await store.fetch(id)
  }

  async function onclick(id: string) {
    metadata.value = await getMetadata(id)
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