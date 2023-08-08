<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ total.toLocaleString() }})</span>
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
  import type { Image } from '../types'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  
  const store = useEntitiesStore()
  const { active, imagesMap, qid } = storeToRefs(store)

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

  const total = ref(0)
  const images = ref<Image[]>([])
  watch(images, () => {
    store.$state.imagesMap = {...imagesMap.value, ...Object.fromEntries(images.value.map((i:Image) => [i.id, i])) }
  })  

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
        // 'ps_subject:*',
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
      provider: 'JSTOR',
      logo: 'https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png',
    }
    doc.url = `https://www.jstor.org/stable/${item.doi.indexOf('10.2307') === 0 ? item.doi.slice(8) : item.doi}`
    if (item.item_title) doc.label = item.item_title
    if (item.ps_desc) doc.description = item.ps_desc.join(' ')
    if (item.ps_source) doc.attribution = item.ps_source.join(' ')
    if (item.primary_agents?.length > 0) doc.creator = item.primary_agents.join('; ')
    let ccLicense = item.cc_reuse_license[0]?.toLowerCase() || ''
    if (ccLicense.indexOf('public domain mark') >= 0) doc.license = 'https://creativecommons.org/publicdomain/mark/1.0'
    else if (ccLicense.indexOf('creative commons: free reuse (cc0)') >= 0) doc.license = 'https://creativecommons.org/publicdomain/zero/1.0'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial-noderivs') >= 0) doc.license = 'CC BY-NC-ND'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial-sharealike') >= 0) doc.license = 'CC BY-NC-SA'
    else if (ccLicense.indexOf('creative commons: attribution-noncommercial') >= 0) doc.license = 'CC BY-NC'
    else if (ccLicense.indexOf('creative commons: attribution-noderivs') >= 0) doc.license = 'CC BY-ND'
    else if (ccLicense.indexOf('creative commons: attribution-sharealike') >= 0) doc.license = 'https://creativecommons.org/licenses/by-sa/4.0'
    else if (ccLicense.indexOf('creative commons: attribution') >= 0) doc.license = 'https://creativecommons.org/licenses/by/4.0'
    else doc.license = item.cc_reuse_license[0]
    doc.thumbnail = `https://www.jstor.org/api/cached/thumbnails/202003101501/byitem/${item.id}/0`
    return doc
  }

  async function itemSelected(evt: CustomEvent) {
    let id = evt.detail[0].id
    let image = imagesMap.value[id]
    if (image.width && image.height) return

    // Fetch info.json file to get image dimensions
    let resp:any = await fetch(`/api/jstor/${id}`)
    if (resp.ok) {
      let imageInfo = await resp.json()
      image.width = imageInfo.width
      image.height = imageInfo.height
      let idx = images.value.findIndex((i:Image) => i.id === id)
      if (idx > -1) {
        let updated = [...images.value]
        updated[idx] = image
        images.value = updated
        store.$state.imagesMap = {...Object.fromEntries(updated.map((i:Image) => [i.id, i])) }
      }
    }
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