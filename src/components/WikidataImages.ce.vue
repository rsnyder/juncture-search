<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images.length > 0" class="count">({{ (wikidata?.total || 0).toLocaleString() }})</span>
    <ve-pig
      :id="id"
      :active="isActive"
      :total="wikidata?.total || 0" 
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
  import { Wikidata } from '../lib/image-providers/Wikidata'

  const store = useEntitiesStore()
  const { active, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'wd' },
  })

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  let wikidata

  const images = ref<Image[]>([])

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (isActive.value && !images.value.length) getNext() })

  watch(qid, () => {
    images.value = []
    wikidata = new Wikidata(qid.value, refresh)
    if (isActive.value) getNext()
  })

  onMounted(() => {
    wikidata = new Wikidata(qid.value, refresh)
    if (isActive.value) getNext()
  })
  
  function getNext() { 
    wikidata.next().then((next:Image[]) => { images.value = [...images.value, ...next] })
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