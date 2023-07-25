<template>

  <div ref="root">
    <sl-details>
      <div slot="summary">
        <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ filteredAndSorted?.length.toLocaleString() }})</span>
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
      :items="showing" 
      @get-next="getNext" 
    ></ve-pig>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import type { Image } from '../images'

  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/checkbox/checkbox.js'
  import '@shoelace-style/shoelace/dist/components/details/details.js'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
  import '@shoelace-style/shoelace/dist/components/menu/menu.js'
  import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'
  import '@shoelace-style/shoelace/dist/components/option/option.js'
  import '@shoelace-style/shoelace/dist/components/select/select.js'
  import type SlSelect from '@shoelace-style/shoelace/dist/components/select/select.js'

  const store = useEntitiesStore()
  const { active, labels, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)
  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const sortby = ref<string>()
  watch(sortby, () => { 
    // console.log(`sortby=${sortby.value}`)
    if (sortby.value === 'score')
    filteredAndSorted.value = [...filteredAndSorted.value.sort((a: any, b: any) => b.score - a.score)]
    else if (sortby.value === 'size')
    filteredAndSorted.value = [...filteredAndSorted.value.sort((a: any, b: any) => b.size - a.size)]
  })

  const depictsFilter = ref<string[]>([])
  watch(depictsFilter, () => {
    console.log('depictsFilter', depictsFilter.value)
    if (depictsFilter.value.length) filteredAndSorted.value = [...images.value.filter((i: any) => depictsFilter.value.every((d: string) => i.depicts[d]))]
    else filteredAndSorted.value = [...images.value]
  })

  const createdBy = ref<boolean>(false)
  watch(createdBy, () => {
    // console.log(`createdBy=${createdBy.value}`)
    if (createdBy.value) filteredAndSorted.value = [...images.value.filter((i: any) => i.createdBy)]
    else filteredAndSorted.value = [...images.value]
  })

  const entity = ref<any>()
  const commonsCategory = computed(() => entity.value?.claims.P373 && entity.value?.claims.P373[0].mainsnak.datavalue.value.replace(/ /g,'_') )

  watch(entity, () => {
    images.value = []
    if (isActive.value && !images.value.length) doQuery()
    // if (entity.value?.claims.P373) doQuery()
  })

  watch(isActive, async () => {
    if (isActive.value && qid.value !== entity.value?.id) entity.value = await store.fetch(qid.value)
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
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })

  const images = ref<Image[]>([])
  watch(images, () => {
    showStats()
    // console.log(`tagged.images.length=${images.value.length}`)
    filteredAndSorted.value = [...images.value]
    end.value = Math.min(50, images.value.length)
  })

  const filteredAndSorted = ref<Image[]>([])
  watch (filteredAndSorted, () => {
    console.log(`filteredAndSorted=${filteredAndSorted.value.length}`)
    console.log(filteredAndSorted.value.slice(0, 10))
    let depicted = {}
    filteredAndSorted.value.forEach((img:Image) => {
      if (img.depicts && Object.keys(img.depicts).length > 0) {
        Object.keys(img.depicts).forEach(qid => {
          if (!depicted[qid]) depicted[qid] = 0
          depicted[qid]++
        })
      }
    })
    depicts.value = depicted
  })

  const showing = computed(() => { return filteredAndSorted.value.slice(0, end.value) })

  const end = ref(0)
  function getNext() { end.value = Math.min(end.value + 50, filteredAndSorted.value.length) }
  
  const sourcesToInclude = ['wikidata', 'commons', 'atlas', 'commons-categories']

  async function doQuery() {
    images.value = []
    const refreshQarg = new URL(location.href).searchParams.get('refresh')
    const refresh = refreshQarg !== null && ['true', '1', 'yes', ''].includes(refreshQarg.toLowerCase())
  
    if (!refresh) {
      let cachedResults = await fetch(`/api/cache/${qid.value}`)
      // console.log(`fromCache=${cachedResults.ok}`)
      if (cachedResults.ok) {
        images.value = await cachedResults.json()
        return
      }
    }

    // console.log(`tagged.doQuery: qid=${qid.value} commonsCategory=${commonsCategory.value} isActive=${isActive.value}`)
    let promises: Promise<any>[] = []
    if (sourcesToInclude.includes('commons')) promises.push(fetch(`/api/commons/${qid.value}`))
    if (sourcesToInclude.includes('wikidata')) promises.push(fetch(`/api/wikidata/${qid.value}`))
    if (sourcesToInclude.includes('atlas')) promises.push(fetch(`/api/atlas/${qid.value}`))
    if (commonsCategory.value && sourcesToInclude.includes('commons-categories')) promises.push(fetch(`/api/commons-categories/${commonsCategory.value}`))
    
    Promise.all(promises).then(async (responses) => {
      let idx = 0
      const commonsData = sourcesToInclude.includes('commons') ? await responses[idx++].json() : []
      const wikidataData = sourcesToInclude.includes('wikidata') ? await responses[idx++].json() : []
      const atlasData = sourcesToInclude.includes('atlas') ? await responses[idx++].json() : []
      const categoriesData = commonsCategory.value && sourcesToInclude.includes('commons-categories') ? await responses[idx++].json() : []
      let all:any = 
        scoreImages([...atlasData, ...commonsData, ...wikidataData, ...categoriesData])
        .sort((a: any, b: any) => b.score - a.score)
      
      let ids = new Set()
      let deduped = all
        .filter(img => {
          if (ids.has(img.id)) return false
          ids.add(img.id)
          return true
        })
      images.value = deduped
      if (images.value.length) {
        cacheResults()
      }
    })
  }

  const depicts = ref<any>({})
  watch (depicts, () => {
    store.updateLabels(Object.keys(depicts.value))
  })

  function showStats() {
    let sources = {}
    let licenses = {}
    let depicted = {}
    let misc = {hasDepicts: 0, hasCoords: 0, hasIiif: 0, depicts: 0, createdby: 0}
    images.value.forEach((img:Image) => {
      let source = img.source || 'unknown'
      if (!sources[source]) sources[source] = 0
      sources[source]++
      
      let licenseCode = licenses[img.license]?.code
      if (!licenses[licenseCode]) licenses[licenseCode] = 0
      licenses[licenseCode]++

      if (img.depicts && Object.keys(img.depicts).length > 0) {
        misc.hasDepicts++
        Object.keys(img.depicts).forEach(qid => {
          if (!depicted[qid]) depicted[qid] = 0
          depicted[qid]++
        })
      }
      if (img.coords) misc.hasCoords++
      if (img.iiif) misc.hasIiif++
      if (img.imageQualityAssessment) {
        if (!misc[img.imageQualityAssessment]) misc[img.imageQualityAssessment] = 0
        misc[img.imageQualityAssessment]++
      }
      if (img.createdBy === qid.value) misc.createdby++
      if (img.depicts && qid.value && img.depicts[qid.value]) misc.depicts++
    })
    // console.log(sources)
    // console.log(licenses)
    console.log(misc)
    // console.log(depicted)
  }
  
  function cacheResults() {
    fetch(`/api/cache/${qid.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(images.value)
    })
  }

  function scoreImages(images) {
    return images.map(img => {
      img.score = 0
      if (img.depicts) {
        let depicted: any = Object.values(img.depicts).find((d:any) => d.id === qid.value)
        if (depicted?.dro) img.score += 5
        else if (depicted?.prominent) img.score += 2
        else if (depicted) img.score += 1
      }
      if (img.imageQualityAssessment === 'featured') img.score += 3
      else if (img.imageQualityAssessment === 'quality') img.score += 2
      else if (img.imageQualityAssessment === 'valued') img.score += 1
      return img
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