<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ images?.length.toLocaleString() }})</span>
    <ve-pig 
      :id="id"
      :active="isActive"
      :total="images?.length || 0" 
      :items="showing"
      @item-selected="itemSelected"
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

  const images = ref<Image[] | null>()
  watch(images, () => { 
    if (images.value) {
      store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
      end.value = Math.min(50, images.value.length)
    }
  })

  const showing = computed(() => { return images.value ? images.value.slice(0, end.value) : [] })

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (isActive.value && !images.value) doQuery() })

  watch(qid, () => {
    images.value = null
    if (isActive.value) doQuery()
  })

  onMounted(() => { if (isActive.value) doQuery()  })

  const end = ref(0)
  function getNext() { end.value = Math.min(end.value + 50, images.value?.length || 0) }
  
  function doQuery() {
    fetch(`/api/commons/${qid.value}`)
      .then(resp => resp.json())
      .then(data => images.value = data.sort((a: any, b: any) => b.score - a.score))
  }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
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