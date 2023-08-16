<template>

  <div ref="root">
    <sl-details>
      <div slot="summary">
        <span v-html="props.label" class="title"></span>
      </div>
      
      <div class="filters">
        
        <div>
          <sl-select id="depictedFilter" label="Select a Few" pill hoist multiple clearable>
            <sl-option v-for="(ct, qid) in depicts" :value="qid">{{ labels[qid] || qid }} ({{ ct }})</sl-option>
          </sl-select>
          <span>Sort by: </span>
          
          <sl-select value="score" hoist style="display:inline-block;width:120px;margin-left:1rem;border:none;">
            <sl-option value="score" @click="sortby = 'score'">Score</sl-option>
            <sl-option value="size" @click="sortby = 'size'">Size</sl-option>
          </sl-select>
        </div>
        
        <!--
        <div>
          <span>Created by: </span>
          <sl-checkbox id="createdBy" :checked="createdBy"></sl-checkbox>
        </div>
        -->

        <div id="providers">
          <span>Provider: </span>
          <sl-checkbox id="Wikimedia Commons" :checked="providersEnabled['Wikimedia Commons']" @click="setProviders">Wikimedia Commons</sl-checkbox>
          <sl-checkbox id="JSTOR" :checked="providersEnabled['JSTOR']" @click="setProviders">JSTOR</sl-checkbox>
          <sl-checkbox id="BHL" :checked="providersEnabled['BHL']" @click="setProviders">BHL</sl-checkbox>
          <sl-checkbox id="Flickr" :checked="providersEnabled['Flickr']" @click="setProviders">Flickr</sl-checkbox>
        </div>

      </div>
    </sl-details>

    <ve-image-grid 
      :id="id"
      :active="isActive"
      :total="images?.length || 0" 
      :items="images" 
      :disable-tooltips="true"
      @get-next="getNext" 
      @item-selected="itemSelected"
    ></ve-image-grid>

  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../types'

  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'
  import type SlSelect from '@shoelace-style/shoelace/dist/components/select/select.js'

  import { Wikidata } from '../lib/image-providers/Wikidata'
  import { WikimediaCommons } from '../lib/image-providers/Commons'
  import { CommonsCategoryImages } from '../lib/image-providers/CommonsCategories'
  import { JSTOR } from '../lib/image-providers/JSTOR'
  import { Openverse } from '../lib/image-providers/Openverse'
  import { Flickr } from '../lib/image-providers/Flickr'
  import { BHL } from '../lib/image-providers/BHL'

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

  const entity = ref<any>()

  watch(entity, () => {
    if (!entity.value) return
    images.value = []
    initProviders()
  })

  let imageProviders = [
    { class: Wikidata, tag: 'Wikimedia Commons', enabled: false},
    { class: WikimediaCommons, tag: 'Wikimedia Commons', enabled: true},
    { class: CommonsCategoryImages, tag: 'Wikimedia Commons', enabled: false},
    { class: JSTOR, tag: 'JSTOR', enabled: false},
    { class: BHL, tag: 'BHL', enabled: false},
    { class: Flickr, tag: 'Flickr', enabled: false},
    { class: Openverse, tag: 'Openverse', enabled: false},
  ]
  const providers = ref<any[]>([])
  const providersEnabled = ref<any>({})
  watch(providers, () => { if (isActive.value) getNext() })  

  function initProviders(limit = -1) {
    providers.value = imageProviders
      .filter(p => p.enabled)
      .map(p => ({ instance: new p.class(entity.value, refresh, limit), tag: p.tag }))
    providersEnabled.value = imageProviders
      .filter(p => p.enabled)
      .reduce((acc, p) => { acc[p.tag] = p.enabled; return acc }, {})
  }

  const sortby = ref<string>()
  watch(sortby, () => { 
  })

  const depictsFilter = ref<string[]>([])
  watch(depictsFilter, () => {
    c// onsole.log(`depictsFilter=${depictsFilter.value}`)
  })

  const createdBy = ref<boolean>(false)
  watch(createdBy, () => {
    // console.log(`createdBy=${createdBy.value}`)
  })

  watch(isActive, async () => {
    // console.log(`Images.isActive=${isActive.value} qid=${qid.value}`)
    if (isActive.value) {
      if (qid.value !== entity.value?.id) {
        images.value = []
        entity.value = await store.fetch(qid.value)
      } else if (!images.value.length) {
        getNext()
      }
    }
  })

  watch(qid, async () => { 
    // console.log(`Images.watch.qid: isActive=${isActive.value} qid=${qid.value}`)
    images.value = []
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  onMounted(async () => {
    // console.log(`Images.noMounted=${isActive.value} qid=${qid.value}`)
    shadowRoot.value?.querySelector('#createdBy')?.addEventListener('sl-change', (e: any) => { createdBy.value = e.target.checked })
    shadowRoot.value?.querySelector('#depictedFilter')?.addEventListener('sl-change', (e: any) => {
      let depictsSelect = e.target as SlSelect
      depictsSelect.hide()
      depictsFilter.value = e.target.value 
    })
    entity.value = await store.fetch(qid.value)
  })

  const depictsProcessed = new Set()
  function getDepicts(provider: any) {
    if (depictsProcessed.has(provider.id)) return
    provider.getDepicts().then((depicted: any) => {
      let updated = {...depicts.value}
      let qids = Object.keys(depicted)
      if (qids.length === 0) return
      for (let qid of qids) {
        if (updated[qid]) updated[qid] += depicted[qid]
        else updated[qid] = depicted[qid]
      }
      depicts.value = updated
    })
    depictsProcessed.add(provider.id)
  }

  let initial = true
  let fetching = false
  async function getNext() {
    if (fetching) return
    fetching = true
    let toAdd = 0
    for (let provider of providers.value) {
      if (providersEnabled.value[provider.tag]) {
        while (provider.instance.hasMore() && toAdd < 50) {
          let providerImages = await provider.instance.next()
          if (initial) getDepicts(provider.instance)
          if (providerImages.length === 0) break
          images.value = [...images.value, ...providerImages]
          toAdd += providerImages.length
        }
        if (initial) getDepicts(provider.instance)
        if (toAdd >= 50 && !initial) break
      }
    }
    initial = false
    fetching = false
  }

  function setProviders(e: any) {
    e.preventDefault()
    e.stopPropagation()
    let providerTag = e.target.id
    providers.value = providers.value.map(p => { p.hasMore = true; return p; } )
    providers.value.forEach(p => p.instance.reset())
    let copy = {...providersEnabled.value}
    copy[providerTag] = !copy[providerTag]
    providersEnabled.value = copy
    images.value = []
    getNext()
  }
  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
    if (images.value.length === 0) depicts.value = {}
  })

  const depicts = ref<any>({})
  watch (depicts, () => {
    // console.log('depicts', toRaw(depicts.value))
    store.updateLabels(Object.keys(depicts.value))
  })

  function itemSelected(e: any) {
    let selectedImage = e.detail[0]
    let provider = providers.value.find(p => p.instance.id === selectedImage.api).instance
    provider.imageSelected(selectedImage).then(qids => { 
      if (qids?.length > 0) store.updateLabels(qids) 
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