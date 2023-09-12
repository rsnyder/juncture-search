<template>

  <div ref="root" class="relative">

    <div v-if="layout.length >= entityData.length" v-for="e, idx in entityData"
      :id="e.qid"
      class="absolute transition-all duration-500 ease-in-out shadow-md border-gray-200 rounded"
      :style="layout[idx]"
      @click="entitySelected(e.qid)"
    >
      <img class="object-cover rounded" :src="e.thumbnail" style="height:100%;width:100%;">
      <div v-html="e.label"
        class="text-white mt-[-2rem] h-[2rem] relative text-lg pl-2 pt-[3px] bg-gray-900/50 font-bold truncate text-ellipsis"
      ></div>
    </div>

  </div>

</template>

<script setup  lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import {Md5} from 'ts-md5'
 
  const store = useEntitiesStore()
  const { } = storeToRefs(store)

  const props = defineProps({
    aspectBase: { type: Number, default: 0 },
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  watch(host, () => { getEntityIds() })

  let doLayoutDebounceTimer:any
  const width = ref(0)
  watch(width, () => {
    clearTimeout(doLayoutDebounceTimer)
    if (width.value) doLayoutDebounceTimer = setTimeout(doLayout, 100)
  })

  const qids = ref<string[]>([])
  watch(qids, async () =>  entityData.value = await getEntityData() )
  
  const entityData = ref<any[]>([])
  watch(entityData, async () => {    
    let aspectRatios = Object.fromEntries(await Promise.all(entityData.value.map((e:any) => getImageSize(e.thumbnail))))
    entityData.value.forEach((item:any) => item.aspect_ratio = aspectRatios[item.thumbnail])
    doLayout()
  })

  async function getImageSize(src: string): Promise<[string, number]> {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => resolve([src, Number((img.width/img.height).toFixed(4))])
      img.onerror = () => reject()
      img.src = src
    })
  }
  function getEntityIds() {
    let slot = host.value.parentElement
    function parseSlot() {
      qids.value = Array.from(slot.querySelectorAll('li')).map((li: any) => li.innerText)
    }
    parseSlot()
    new MutationObserver(
      (mutationsList:any) => {
        for (let mutation of mutationsList) { if (mutation.type === 'childList') parseSlot() }      
      }
    ).observe(slot, { childList: true, subtree: true })
  }

  function entitySelected(qid: string) {
    store.setQid(qid)
  }

  function doLayout(maxAspect=1.25, minAspect=0.7) {
    
    function adjustedAspectRatio(img: any) {
      return  img.aspect_ratio > maxAspect
              ? maxAspect
              : img.aspect_ratio < minAspect
                ? minAspect
                : img.aspect_ratio
    }

    let numImages = entityData.value.length
    const minAspectRatio = props.aspectBase + (
        width.value <= 640 ? 2
      : width.value <= 1280 ? 4
      : width.value <= 1920 ? 5
      : 6)
    let _layout:any[] = []

    let spaceBetweenImages = 10

    let row:any[] = []
    let translateX = 0
    let translateY = 0
    let rowAspectRatio = 0

    // Loop through all our images, building them up into rows and computing
    // the working rowAspectRatio.
    entityData.value.forEach((image, index) => {
      rowAspectRatio += adjustedAspectRatio(image)
      row.push(image)

      if (rowAspectRatio >= minAspectRatio || index + 1 === numImages) {

        rowAspectRatio = Math.max(rowAspectRatio, minAspectRatio)

        // Compute this row's height.
        const totalDesiredWidthOfImages = width.value - spaceBetweenImages * (row.length - 1)
        const rowHeight = totalDesiredWidthOfImages / rowAspectRatio

        row.forEach(img => {
          const imageWidth: number = rowHeight * adjustedAspectRatio(img)
          _layout.push( {
            width: `${Math.round(imageWidth)}px`,
            height: `${Math.round(rowHeight)}px`,
            transform: `translate3d(${Math.round(translateX)}px, ${Math.round(translateY)}px, 0)`,
          })
          translateX += imageWidth + spaceBetweenImages
        })

        // Reset our state variables for next row.
        row = []
        rowAspectRatio = 0
        translateY += rowHeight + spaceBetweenImages
        translateX = 0
      }
    })

    if (root.value) root.value.style.height = `${translateY - spaceBetweenImages}px`
    layout.value = _layout
  }

  const layout = ref<any[]>([])
  // watch(layout, () => { console.log(toRaw(layout.value)) })

  watch(root, () => {
    if (root.value) {
      width.value = root.value?.clientWidth || 0
      const resizeObserver = new ResizeObserver(() => {
        if (root.value?.clientWidth && root.value?.clientWidth !== width.value)
          width.value = root.value?.clientWidth
      })
      resizeObserver.observe(root.value)
    }
  })

  async function getEntityData() {
    let entityIds = qids.value.map(q => `wd:${q}`).join(') (')
    let query = `SELECT ?entity ?label ?description ?image WHERE {
      VALUES (?entity) { (${entityIds}) }
      ?entity rdfs:label ?label ; schema:description ?description .
      OPTIONAL { ?entity wdt:P18 ?image . }
      FILTER (LANG(?label) = "en")
      FILTER(LANG(?description) = 'en')
    }`
    return fetch(`https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`, {
      headers: {
        Accept: 'application/sparql-results+json'
      }
    })
    .then(resp => resp.json())
    .then(data => {
      let parsed:any = {}
      data.results.bindings.forEach((b: any) => {
        let qid = b.entity.value.split('/').pop()
        if (parsed[qid]) parsed[qid].images.push(b.image?.value)
        else parsed[qid] = {qid, label: b.label.value, description: b.description?.value, images: [b.image?.value]}
      })
      return qids.value
        .map(qid => parsed[qid])
        .map((item:any) => {
          item.thumbnail = mwImage(item.images[0], 500)
          return item
        })
    })
  }

  function mwImage(mwImg: string, width?: number) {
    // Converts Wikimedia commons image URL to a thumbnail link
    mwImg = mwImg.split('Special:FilePath/').pop() || mwImg
    mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
    const _md5 = Md5.hashStr(mwImg)
    const extension = mwImg.split('.').pop()
    let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
    url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
    if (width) {
      url += `/${width}px-${mwImg}`
      url += extension === 'svg'
        ? '.png'
        : extension?.indexOf('tif') === 0 ? '.jpg' : ''
    }
    return url
  }
 
</script>

<style>
  @import '../tailwind.css';
</style>