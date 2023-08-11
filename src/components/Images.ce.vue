<template>

  <div ref="root">
    <sl-details>
      <div slot="summary">
        <span v-html="props.label" class="title"></span>
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

  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'
  import type SlSelect from '@shoelace-style/shoelace/dist/components/select/select.js'

  import { Wikidata } from '../lib/image-providers/Wikidata'
  import { WikimediaCommons } from '../lib/image-providers/Commons'
  import { CommonsCategoryImages } from '../lib/image-providers/CommonsCategories'
  import { JSTOR } from '../lib/image-providers/JSTOR'

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
    initProviders(20)
  })

  let _providers = [
    { class: Wikidata, tag: 'Wikimedia Commons'},
    { class: WikimediaCommons, tag: 'Wikimedia Commons'},
    { class: CommonsCategoryImages, tag: 'Wikimedia Commons'},
    { class: JSTOR, tag: 'JSTOR'},
  ]
  const providers = ref<any[]>([])
  const providersEnabled = ref<any>({'Wikimedia Commons': true, 'JSTOR': true})
  watch(providers, () => {
    // providersEnabled.value = providers.value.reduce((acc, p) => { acc[p.tag] = true; return acc }, {})
    console.log(toRaw(providersEnabled.value))
    if (isActive.value) getNext()
  })  

  function initProviders(limit = -1) {
    console.log(`initProviders: entity=${entity.value.qid} refresh=${refresh} limit=${limit}`)
    providers.value = _providers.map(p => ({ instance: new p.class(entity.value, refresh, limit), tag: p.tag, hasMore: true }))
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
    console.log(`createdBy=${createdBy.value}`)
  })

  watch(isActive, async () => {
    console.log(`Images.isActive=${isActive.value} qid=${qid.value}`)
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
    // console.log(`tagged.watch.qid: isActive=${isActive.value} qid=${qid.value}`)
    images.value = []
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  onMounted(async () => {
    shadowRoot.value?.querySelector('#createdBy')?.addEventListener('sl-change', (e: any) => { createdBy.value = e.target.checked })
    shadowRoot.value?.querySelector('#depictedFilter')?.addEventListener('sl-change', (e: any) => {
      let depictsSelect = e.target as SlSelect
      depictsSelect.hide()
      depictsFilter.value = e.target.value 
    })
    entity.value = await store.fetch(qid.value)
  })

  async function getNext() {
    console.log(`Images.getNext: isActive=${isActive.value} qid=${qid.value}`)
    let toAdd: Image[] = []
    for (let provider of providers.value) {
      let tag = provider.tag
      let enabled = providersEnabled.value[tag]
      let hasMore = provider.hasMore
      console.log(`provider=${provider.tag} enabled=${enabled} hasMore=${hasMore}`)
      if (!enabled || !hasMore) continue
      let providerImages = await provider.instance.next()
      toAdd = [...toAdd, ...providerImages]
      if (providerImages.length === 50) break
      provider.hasMore = false
    }
    images.value = [...images.value, ...toAdd]
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
</style>