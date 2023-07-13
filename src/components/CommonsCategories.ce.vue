<template>

  <div ref="root">
    <span v-html="props.label" class="title"></span> <span v-if="images" class="count">({{ images?.length.toLocaleString() }})</span>
    <ve-image-grid 
      id="cc"
      :active="isActive"
      :total="images?.length || 0" 
      :items="showing" 
      @get-next="getNext" 
    ></ve-image-grid>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { sha256 } from 'js-sha256'
  import { Md5 } from 'ts-md5'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  
  const store = useEntitiesStore()
  const { active, qid } = storeToRefs(store)

  const props = defineProps({
    label: { type: String },
    id: { type: String },
  })

  const root = ref<HTMLElement | null>(null)

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, async () => {
    // console.log(`cc.watch.isActive=${isActive.value} qid=${qid.value}`)
    if (isActive.value && qid.value !== entity.value?.id) entity.value = await store.fetch(qid.value)
  })
  
  onMounted(async () => {
    // console.log(`cc.onMounted: isActive=${isActive.value} qid=${qid.value}`)
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })
  watch(qid, async () => { 
    // console.log(`cc.watch.qid: isActive=${isActive.value} qid=${qid.value}`)
    if (isActive.value) entity.value = await store.fetch(qid.value)
  })
  const entity = ref<any>()
  watch(entity, () => {
    // console.log(toRaw(entity.value))
    if (entity.value?.claims.P373) doQuery()
  })

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

  const images = ref<Image[]>([])
  watch(images, () => { 
    if (images.value.length) console.log(toRaw(images.value))
    end.value = Math.min(20, images.value.length)
  })
  
  const categoryProps = {
      'Commons gallery': 'P935',
      'Commons category': 'P373',
      "topic's main category": 'P910'
  }

  function commonsImageUrl(url: string, width?: number): string {
    // Converts Wikimedia commons File URL to an image link
    //   If a width is provided a thumbnail is returned
    let mwImg: any = url.split('File:').pop()
    mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
    const ImgMD5 = Md5.hashStr(mwImg)
    const extension = mwImg.slice(mwImg.length-4)
    let imgUrl = `https://upload.wikimedia.org/wikipedia/commons/${width ? 'thumb/' : ''}`
    imgUrl += `${ImgMD5.slice(0,1)}/${ImgMD5.slice(0,2)}/${mwImg}`
    if (width) imgUrl += `/${width}px-${mwImg}`
    if (extension === '.svg') imgUrl += '.png'
    if (extension === '.tif' || extension === '.tiff') imgUrl += '.jpg'
    return imgUrl
  }

  function wikimediaCommonsSource(url: string) {
    url = decodeURIComponent(url)
    url = url.replace(/Special:FilePath\//, 'File:').replace(/ /g, '_')
    let path = url.split('/').slice(3)
    if (url.indexOf('https://upload.wikimedia.org/') === 0) url = `https://commons.wikimedia.org/wiki/File:${path[2] === 'thumb' ? path[5] : path[4]}`
    else if (url.indexOf('wikipedia.org/wiki') > 0) url = `https://commons.wikimedia.org/wiki/File:${path.pop()?.split(':').pop()}`
    return url 
  }

  function urlHash(url: string) {
    return sha256(commonsImageUrl(wikimediaCommonsSource(url)))
  }

  const end = ref(0)
  function getNext() {
    console.log('cc.getNext')
    end.value = Math.min(end.value + 20, images.value.length)
  }

  const showing = computed(() => images.value?.slice(0, end.value))
  watch(showing, () => { 
    if (showing.value?.length) console.log(`commonsCategories.watch.images: qid=${qid.value} isActive=${isActive.value} images=${images.value?.length} showing=${end.value}`)    
  })

  const imageExtensions = new Set('jpg jpeg png gif svg tif tiff'.split(' '))

  async function doQuery() {
    console.log('wc.doQuery')
    images.value = []
    let category = entity.value.claims.P373[0].mainsnak.datavalue.value
    let categoryImagesContinue = ''
    let collector:any[] = []
    while (categoryImagesContinue !== undefined) {
      let resp: any = await fetch(`https://commons.wikimedia.org/w/api.php?origin=*&action=query&generator=categorymembers&gcmlimit=500&gcmtitle=Category:${category.replace(/ /,'_')}&format=json&gcmnamespace=6&gcmtype=file&prop=imageinfo&iiprop=url&gcmcontinue=${categoryImagesContinue}`)
      if (resp.ok) {
        resp = await resp.json()
        categoryImagesContinue = resp.continue?.gcmcontinue
        let batch = Object.fromEntries(Object.values(resp.query.pages).map((page:any) => {
          // console.log(page)
          let pageid = page.pageid
          let id = urlHash(page.imageinfo[0].descriptionurl)
          let docid = page.title.replace(/File/,'commons')
          let url = page.imageinfo[0].descriptionurl
          return [pageid, {id, docid, pageid, url}]
        }))
        collector = [...collector, ...Object.values(batch)] 
      }
    }
    images.value = collector
      .filter((item:any) => imageExtensions.has(item.url.split('.').pop().toLowerCase()))
      .map((item: any) => transformItem(item))
  }

  function transformItem(item: any): Image {
    let doc: Image = {id: item.id, source: 'cc'}
    doc.thumbnail = commonsImageUrl(item.url, 300)
    return doc
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