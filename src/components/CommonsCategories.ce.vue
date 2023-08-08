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

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { sha256 } from 'js-sha256'
  import { Md5 } from 'ts-md5'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../types'

  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'cc' },
  })

  const root = ref<HTMLElement | null>(null)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, async () => {
    if (isActive.value && qid.value !== entity.value?.id) entity.value = await store.fetch(qid.value)
  })
  
  onMounted(async () => { if (isActive.value) entity.value = await store.fetch(qid.value) })
  watch(qid, async () => { 
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })
  const entity = ref<any>()
  watch(entity, () => { if (entity.value?.claims.P373) doQuery() })

  const commonsCategory = computed(() => entity.value?.claims.P373 && entity.value?.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_') )

  const end = ref(0)
  function getNext() { end.value = Math.min(end.value + 20, images.value.length) }

  const images = ref<Image[]>([])
  watch(images, () => { 
    if (images.value.length) {
      store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
      end.value = Math.min(20, images.value.length)
    }
  })
  
  const showing = computed(() => { return images.value ? images.value.slice(0, end.value) : [] })
  watch(showing, () => { if (showing.value.length ) console.log(`cc.showing=${showing.value.length}`) })

  const categoryProps = {
    'Commons gallery': 'P935',
    'Commons category': 'P373',
    "topic's main category": 'P910'
  }

  const imageExtensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))

  async function doQuery() {
    images.value = []
    let resp = await fetch(`/api/commons-categories/${commonsCategory.value}`)
    if (resp.ok) {
      let data = await resp.json()
      images.value = data
        .filter((item:any) => imageExtensions.has(item.url.split('.').pop().toLowerCase()))
    }
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