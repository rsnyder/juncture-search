<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ total.toLocaleString() }})</span>
    <!--
    <ve-image-grid 
      id="jstor" 
      :active="isActive"
      :total="total" 
      :items="images" 
      @get-next="doQuery" 
      @item-selected="itemSelected" 
    ></ve-image-grid>
    -->
    <ve-pig 
      id="jstor"
      :active="isActive"
      :items="images" 
      @get-next="doQuery" 
      @item-selected="itemSelected" 
    ></ve-pig>
  </div>

  <sl-dialog :label="label" class="dialog" :style="{'--width':dialogWidth}">
    <div v-if="metadata" class="metadata">
      <ve-statements :eid="metadata.id"></ve-statements>
    </div>
    <sl-button slot="footer" variant="primary" @click="showDialog = false">Close</sl-button>
  </sl-dialog>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  
  const store = useEntitiesStore()
  const { active, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const searchEndpoint = '/api/search/jstor/basic'

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { 
    if (isActive.value && !images.value.length) {
      pager = ''
      doQuery()
    }
  })

  const entity = ref<any>()
  watch(entity, () => { 
    if (isActive.value) {
      pager = ''
      doQuery()
    }
  })

  watch(qid, async () => {
    images.value = []
    if (isActive) entity.value = await store.fetch(qid.value)  
  })

  onMounted(async () => { 
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => { if (evt.target === dialog) metadata.value = undefined })
    if (isActive && qid.value) entity.value = await store.fetch(qid.value)  
  })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  interface Image {
    aspect_ratio?: number
    attribution?: string
    creator?: string
    creator_url?: string
    depicts?: string[]
    description?: string
    detail_url?: string
    foreign_landing_url?: string
    format?: string
    id: string
    height?: number
    license?: string
    license_url?: string
    license_version?: string
    provider?: string
    score?: number
    source?: string
    tags?: string[]
    title?: string
    thumbnail?: string
    url?: string
    width?: number
  }

  const total = ref(0)
  const images = ref<Image[]>([])
  watch(images, () => { console.log(toRaw(images.value)) } )
  
  const metadata = ref()
  watch(metadata, () => { showDialog.value = metadata.value !== undefined })
  
  let pager: string = ''

  let isFetching = false
  async function doQuery(exclude:string[] = []) {
    if (isFetching || (images.value.length > 0 && images.value.length >= total.value)) return
    // console.log('doQuery', qid.value, pager)
    isFetching = true
    let label = entity.value.label.indexOf(' ') > 0 ? `"${entity.value.label}"^2` : `${entity.value.label}^2`
    let aliases = entity.value.aliases.map((alias:string) => alias.indexOf(' ') > 0 ? `"${alias}"^1` : `${alias}^1`)
    
    let query = label
    for (let i = 0; i < aliases.length; i++) {
      let nextTerm = ` OR ${aliases[i]}`
      if ((query.length + nextTerm.length) <= 250) query += nextTerm
      else break
    }

    let searchArgs: any = {
      query,
      limit: 20,
      tokens: ['16124', '24905214', '25794673', '24905191', '25794673', '24905216'],
      filter_queries: [
        'ps_subject:*',
        'cc_reuse_license:*'
      ],
      content_set_flags: ['contributed_images'],
    }
    if (pager) searchArgs.page_mark = pager
    if (exclude.length > 0 && Array.isArray(exclude)) searchArgs.filter_queries.push(`-doi:(${ exclude.join(' OR ')})`)


    let results: any = {total:0, items:[]}
    let resp: any = await fetch(searchEndpoint, {
      method: 'POST',
      headers: {'Content-Type': 'application/json', Accept: 'application/json'},
      body: JSON.stringify(searchArgs)
    })
    if (resp.ok) {
      resp = await resp.json()
      if (resp.paging && resp.paging.next) pager = resp.paging.next
      results = {total: resp.total || 0, items: resp.results}
      let updated: any = [...images.value || [], ...results.items.map((item: any) => transformItem(item))]
      images.value = updated
      total.value = results.total
    }
    isFetching = false
  }

  function transformItem(item: any): any {
    let doc: any = {
      id: item.doi, 
      provider: 'jstor',
      depicts: [qid.value]
    }
    doc.url = `https://www.jstor.org/stable/${item.doi.indexOf('10.2307') === 0 ? item.doi.slice(8) : item.doi}`
    // doc.images = {id: sha256(doc.url)}
    if (item.item_title) doc.title = item.item_title
    if (item.ps_desc) doc.description = item.ps_desc.join(' ')
    if (item.ps_source) doc.attribution = item.ps_source.join(' ')
    if (item.primary_agents?.length > 0) doc.creator = item.primary_agents.join('; ')
    if (item.cc_reuse_license && item.cc_reuse_license.length == 1) {
      if (item.cc_reuse_license[0] === 'Creative Commons: Free Reuse (CC0)') doc.license = 'CC0'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution') doc.license = 'CC BY'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution') doc.license = 'CC BY-SA'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution-NonCommercial') doc.license = 'CC BY-NC'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution-NoDerivs') doc.license = 'CC BY-ND'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution-NonCommercial-ShareAlike') doc.license = 'CC BY-NC-SA'
      else if (item.cc_reuse_license[0] === 'Creative Commons: Attribution-NonCommercial-NoDerivs') doc.license = 'CC BY-NC-ND'
      else doc.license = item.cc_reuse_license[0]
    }
    // doc.images.default = `https://www.jstor.org/stable/${item.doi.indexOf('10.2307') === 0 ? item.doi.slice(8) : item.doi}`
    doc.thumbnail = `https://www.jstor.org/api/cached/thumbnails/202003101501/byitem/${item.id}/0`
    /*
    doc.details = Object.fromEntries(Object.entries(item)
      .filter(([key, value]) => {
        // if (exclude.has(key)) return false
        if (Array.isArray(value) && value.length == 0) return false
        if (value === '' || value === null) return false
        if (typeof value === 'object' && Object.keys(<any>value).length == 0) return false
        return true
      })
      .map(args => [args[0], args[1]]
    ))
    */
    return doc
  }
  
  async function getMetadata(id: string) {
    return await store.fetch(id)
  }

  async function itemSelected(evt: CustomEvent) {
    metadata.value = await getMetadata(evt.detail[0].id)
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