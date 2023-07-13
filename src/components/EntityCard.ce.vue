<template>

  <div ref="root" id="card" class="card" @click="onclick">
    <div v-if="backgroundImage" class="image" :style="{backgroundImage}"></div>
    <div class="label" v-html="label"></div>
    <div class="description" v-html="description"></div>
    <div v-if="summaryText" class="summary" v-html="summaryText"></div>
    <div class="links">
      <span v-if="wikipediaLink" class="logo" title="Wikipedia">
        <a target="_blank" :href="wikipediaLink">
          <img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Wikipedia_svg_logo.svg"/>
        </a>
      </span>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useEntitiesStore } from '../store/entities'
  import { Md5 } from 'ts-md5'

  const props = defineProps({
    eid: { type: String },
    language: { type: String },
    label: { type: String },
    description: { type: String },
    image: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)

  const store = useEntitiesStore()

  const eid = ref<string>()
  watch(eid, async () => entity.value = await store.fetch(eid.value) )
  
  const entity = ref<any>()
  watch(entity, () => {
    // console.log(toRaw(entity.value))
    label.value = props.label || entity.value.label
    description.value = props.description || entity.value.description
    let commonsImageFile = entity.value.image
    // console.log(commonsImageFile)
    if (commonsImageFile) backgroundImage.value = `url('${encodeUrl(mwImage(commonsImageFile, 500))}')`
    // backgroundImage.value = entity.value?.thumbnail && `url('${encodeUrl(entity.value.thumbnail)}')`
    wikipediaLink.value = entity.value.wikipedia
    summaryText.value = entity.value.summaryText
  })

  const label = ref<string>()
  const description = ref<string>()
  const summaryText = ref<string>()
  const backgroundImage = ref<string>()
  const wikipediaLink = ref<string>()

  onMounted(() => applyProps())
  watch(props, () => applyProps())

  function applyProps() {
    if (props.eid && eid.value !== props.eid) eid.value = props.eid
    if (props.label) label.value = props.label
    if (props.description) description.value = props.description
    if (props.image) backgroundImage.value = props.image
  }

  function encodeUrl(url:string) {
    let parts = url.split('/')
    let encoded = `${parts.slice(0,-1).join('/')}/${encodeURIComponent(parts[parts.length-1])}`
    return encoded
  }

  function unwrap(html:string) {
    let inner = new DOMParser().parseFromString(html, 'text/html')
    return inner.children[0].children[1].children[0].innerHTML
  }

  function mwImage(mwImg: string, width: number) {
    // Converts Wikimedia commons image URL to a thumbnail link
    mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
    const _md5 = Md5.hashStr(mwImg)
    const extension = mwImg.split('.').pop()
    let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
    url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
    if (width) {
      url += `/${width}px-${mwImg}`
      if (extension === 'svg') {
        url += '.png'
      } else if (extension === 'tif' || extension === 'tiff') {
        url += '.jpg'
      }
    }
    return url
  }

  function onclick(e:MouseEvent) {
    store.setQid(eid.value)
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display:inline-block;
    width: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid #ddd;
    border-radius: 3px;
    /* min-height: 150px; */
    background-color: white;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
    height: 100%;
    cursor: pointer;
  }

  .label, .description, .summary, .links {
    margin: 6px;
    font-size: 1rem;
  }

  .label {
    font-size: 130%;
    font-weight: bold;
  }

  .description {
    font-size: 110%;
    font-weight: 400;
 }

  .summary {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 6;
    overflow: hidden;
    line-height: 1.2rem;
    font-weight: 300;
  }

  .summary p {
    margin: 0 0 6px 0;
  }

  .spacer {
    grid-area: 4 / 1 / 5 / 2;
    height: 100%
  }

  .links {
    grid-area: 5 / 1 / 6 / 2;
  }

  .image {
    height: 200px;
    width: 100%;
    object-fit: contain;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
  }

  .logo img {
    height: 24px;
    margin-right: 12px;
    cursor: pointer;
  }

</style>