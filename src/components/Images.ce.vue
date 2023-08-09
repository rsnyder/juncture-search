<template>

  <div ref="root">
    <sl-details>
      <div slot="summary">
        <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ (tagged?.total || 0).toLocaleString() }})</span>
      </div>
      <div class="filters">
        <div>
          <sl-select id="depictedFilter" label="Select a Few" pill hoist multiple clearable>
            <sl-option v-for="(ct, qid) in depicts" :value="qid">{{ labels[qid] || qid }}</sl-option>
          </sl-select>
          <span>Sort by: </span>
          <sl-select value="score" hoist style="display:inline-block;width:120px;margin-left:1rem;border:none;">
            <sl-option value="score" @click="sortby = 'score'">Score</sl-option>
            <sl-option value="size" @click="sortby = 'size'">Size</sl-option>
          </sl-select>
        </div>
        <div>
          <span>Created by: </span>
          <sl-checkbox id="createdBy" :checked="createdBy"></sl-checkbox>
        </div>
      </div>
    </sl-details>

    <ve-pig 
      :id="id"
      :active="isActive"
      :total="images?.length || 0" 
      :items="images" 
      @get-next="getNext" 
    ></ve-pig>

  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../types'
  import { Tagged } from '../lib/image-providers/Tagged'

  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'
  import type SlSelect from '@shoelace-style/shoelace/dist/components/select/select.js'

  const store = useEntitiesStore()
  const { active, imagesMap, labels, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  let tagged

  const sortby = ref<string>()
  watch(sortby, () => { 
    tagged.filterAndSort(sortby.value)
      .next().then(_images => images.value = [..._images])
  })

  const depictsFilter = ref<string[]>([])
  watch(depictsFilter, () => {
    console.log(`depictsFilter=${depictsFilter.value}`)
  })

  const createdBy = ref<boolean>(false)
  watch(createdBy, () => {
    console.log(`createdBy=${createdBy.value}`)
  })

  const entity = ref<any>()
  const commonsCategory = computed(() => entity.value?.claims.P373 && entity.value?.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_') )

  watch(isActive, async () => {
    if (isActive.value && qid.value !== entity.value?.id) entity.value = await store.fetch(qid.value)
  })

  watch(qid, async () => { 
    // console.log(`tagged.watch.qid: isActive=${isActive.value} qid=${qid.value}`)
    tagged = new Tagged(qid.value, refresh)
    tagged.next().then(_images => images.value = [..._images])
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  onMounted(async () => {
    shadowRoot.value?.querySelector('#createdBy')?.addEventListener('sl-change', (e: any) => { createdBy.value = e.target.checked })
    shadowRoot.value?.querySelector('#depictedFilter')?.addEventListener('sl-change', (e: any) => {
      let depictsSelect = e.target as SlSelect
      depictsSelect.hide()
      depictsFilter.value = e.target.value 
    })
    if (isActive.value) entity.value = await store.fetch(qid.value)
    tagged = new Tagged(qid.value, refresh)
    tagged.next().then(_images => images.value = [..._images])
  })

  function getNext() {
    tagged.next().then(_images => images.value = [...images.value, ..._images])
  }

  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
  })

  const depicts = ref<any>({})
  watch (depicts, () => {
    store.updateLabels(Object.keys(depicts.value))
  })

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
</style>../lib/image-providers/tagged