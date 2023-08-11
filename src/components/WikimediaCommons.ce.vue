<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ (provider?.total || 0).toLocaleString() }})</span>
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
  import { WikimediaCommons } from '../lib/image-providers/Commons'

  const store = useEntitiesStore()
  const { active, labels, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String, default: 'wc' },
  })

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  let provider

  const images = ref<Image[]>([])

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (isActive.value && !images.value.length) getNext() })

  watch(qid, () => {
    images.value = []
    provider = new WikimediaCommons(qid.value, refresh)
    if (isActive.value) getNext()
  })

  onMounted(() => {
    provider = new WikimediaCommons(qid.value, refresh)
    if (isActive.value) getNext()
  })
  
  function getNext() { 
    provider.next().then((next:Image[]) => { images.value = [...images.value, ...next] })
   }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
    let mid = `M${id}`
    console.log(`itemSelected: ${mid}`)
    fetch(`https://commons.wikimedia.org/wiki/Special:EntityData/${mid}.json`)
    .then(resp => resp.json())
    .then(resp => {
      let image = images.value.find((i:Image) => i.id === id)
      if (image) {
        let depicted = resp.entities[mid].statements.P180.map((s:any) => s.mainsnak.datavalue.value.id)
        store.updateLabels(depicted).then(() => {
          if (image) image.depicts = depicted.map((d:string) => ({ id: d, label: labels.value[d] }))
        })
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