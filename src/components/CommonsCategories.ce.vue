<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images.length > 0" class="count">({{ (provider?.total || 0).toLocaleString() }})</span>
    <ve-pig
      :id="id"
      :active="isActive"
      :total="provider?.total || 0" 
      :items="images"
      @item-selected="itemSelected"
      @get-next="getNext" 
    ></ve-pig>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../types'
  import { CommonsCategoryImages } from '../lib/image-providers/CommonsCategories'

  const store = useEntitiesStore()
  const { active, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'cc' },
  })

  const root = ref<HTMLElement | null>(null)

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  let provider

  watch(qid, async () => { 
    images.value = []
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  const entity = ref<any>()
  const commonsCategory = computed(() => entity.value?.claims?.P373 && entity.value?.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_'))

  const images = ref<Image[]>([])

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, async() => {
    if (isActive.value) {
      if (qid.value !== entity.value?.id) {
        images.value = []
        entity.value = await store.fetch(qid.value)
      } else if (!images.value.length) {
        getNext()
      }
    }
  })

  watch(commonsCategory, () => {
    if (!commonsCategory.value) return
    images.value = []
    provider = new CommonsCategoryImages(commonsCategory.value, refresh)
    if (isActive.value) getNext()
  })

  onMounted(async() => {
    entity.value = await store.fetch(qid.value)
  })
  
  function getNext() { 
    provider.next().then((next:Image[]) => { images.value = [...images.value, ...next] })
   }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
    console.log(`itemSelected: ${id}`)
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