<template>

  <div ref="root">
    
    <div v-if="fetching" class="flex w-full items-center justify-center space-x-4 m-4">
      <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span class="sr-only">Loading...</span>
      </div>
      <span class="text-xl font-medium">Finding images...</span>
    </div>

    <sl-details v-else>
      <div slot="summary">
        <span v-html="props.label" class="title"></span>
      </div>
      
      <div class="flex items-center">
        
      <div class="hs-dropdown relative inline-flex z-50" data-hs-dropdown-auto-close="inside">
        <button id="hs-dropdown-item-checkbox" type="button" class="hs-dropdown-toggle py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
          Content providers
          <svg class="hs-dropdown-open:rotate-180 w-2.5 h-2.5 text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" aria-labelledby="hs-dropdown-item-checkbox">
          
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-wikidata" data-provider="Wikimedia Commons" name="hs-dropdown-item-checkbox-wikidata" type="checkbox"
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled['Wikimedia Commons'] ? '' : null"
              >
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-wikidata" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">Wikimedia Commons</span>
            </label>
          </div>
          
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-jstor" data-provider="JSTOR" name="hs-dropdown-item-checkbox-jstor" type="checkbox" 
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.JSTOR ? '' : null"
              >
            </div>
            <img src="https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-jstor" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">JSTOR</span>
            </label>
          </div>
    
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-bhl" data-provider="BHL" name="hs-dropdown-item-checkbox-bhl" type="checkbox" 
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.BHL ? '' : null"
              >
            </div>
            <img src="https://www.biodiversitylibrary.org/favicon.ico" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-bhl" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">Biodiversity Heritage Library</span>
            </label>
          </div>
 
          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-flickr" data-provider="Flickr" name="hs-dropdown-item-checkbox-flickr" type="checkbox" 
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.Flickr ? '' : null"
              >
            </div>
            <img src="https://combo.staticflickr.com/pw/favicon.ico" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-flickr" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">Flickr</span>
            </label>
          </div>

          <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <div class="flex items-center h-5">
              <input id="hs-dropdown-item-checkbox-openverse" data-provider="Flickr" name="hs-dropdown-item-checkbox-openverse" type="checkbox" 
                @click="setProviders"
                class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
                aria-describedby="hs-dropdown-item-checkbox-delete-description" 
                :checked="providersEnabled.Openverse ? '' : null"
              >
            </div>
            <img src="https://openverse.org/openverse-logo.svg" class="ml-4 h-4 w-4">
            <label for="hs-dropdown-item-checkbox-openverse" class="ml-2">
              <span class="text-sm font-semibold text-gray-800 dark:text-gray-300">Openverse</span>
            </label>
          </div>

        </div>
      </div>

        <div class="flex items-center gap-8">
          <sl-select id="depictedFilter" placeholder="Select entities" style="border:none;" pill hoist multiple clearable>
            <sl-option v-for="(ct, qid) in depicts" :value="qid">{{ labels[qid] || qid }} ({{ ct }})</sl-option>
          </sl-select>
          
          <!--
          <span>Sort by: </span>
          <sl-select value="score" hoist style="display:inline-block;width:120px;margin-left:1rem;border:none;">
            <sl-option value="score" @click="sortby = 'score'">Score</sl-option>
            <sl-option value="size" @click="sortby = 'size'">Size</sl-option>
          </sl-select>
          -->
        </div>
        
        <!--
        <div>
          <span>Created by: </span>
          <sl-checkbox id="createdBy" :checked="createdBy"></sl-checkbox>
        </div>
        -->

        <!--
        <div id="providers">
          <span>Provider: </span>
          <sl-checkbox id="Wikimedia Commons" :checked="providersEnabled['Wikimedia Commons']" @click="setProviders">Wikimedia Commons</sl-checkbox>
          <sl-checkbox id="JSTOR" :checked="providersEnabled['JSTOR']" @click="setProviders">JSTOR</sl-checkbox>
          <sl-checkbox id="BHL" :checked="providersEnabled['BHL']" @click="setProviders">BHL</sl-checkbox>
          <sl-checkbox id="Flickr" :checked="providersEnabled['Flickr']" @click="setProviders">Flickr</sl-checkbox>
        </div>
        -->

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
  // @ts-ignore
  import { HSDropdown } from '../lib/preline/components/hs-dropdown'

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
  watch(shadowRoot, (shadowRoot) => new HSDropdown(shadowRoot).init() )

  const refreshQarg = new URL(location.href).searchParams.get('refresh')
  const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())

  const entity = ref<any>()

  watch(entity, () => {
    if (!entity.value) return
    images.value = []
    initProviders()
  })

  let imageProviders = [
    { class: Wikidata, tag: 'Wikimedia Commons', enabled: true},
    { class: WikimediaCommons, tag: 'Wikimedia Commons', enabled: true},
    { class: CommonsCategoryImages, tag: 'Wikimedia Commons', enabled: true},
    { class: JSTOR, tag: 'JSTOR', enabled: true},
    { class: BHL, tag: 'BHL', enabled: true},
    { class: Flickr, tag: 'Flickr', enabled: true},
    { class: Openverse, tag: 'Openverse', enabled: true},
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
    console.log('providersEnabled', providersEnabled.value)
  }

  const sortby = ref<string>()
  watch(sortby, () => { 
  })

  const depictsFilter = ref<string[]>([])
  watch(depictsFilter, () => {
    console.log(`depictsFilter=${depictsFilter.value}`)
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
    console.log(shadowRoot.value?.querySelector('#depictedFilter'))
    shadowRoot.value?.querySelector('#createdBy')?.addEventListener('sl-change', (e: any) => { createdBy.value = e.target.checked })
    shadowRoot.value?.querySelector('#depictedFilter')?.addEventListener('sl-change', (e: any) => {
      console.log('depictedFilter', e.target.value)
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
        // console.log('getNext', provider.instance.id, provider.instance.hasMore())
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
  @import '../tailwind.css';

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