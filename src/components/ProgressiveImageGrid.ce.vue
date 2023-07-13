<template>

  <div ref="root" id="image-grid"></div>

  <sl-dialog class="dialog" :style="{'--width':dialogWidth}">
    <div>
      <ve-image-card :image="selectedImage"></ve-image-card>
    </div>
    <sl-button slot="footer" variant="primary" @click="selectedImage = null">Close</sl-button>
  </sl-dialog>

</template>

<script setup lang="ts">

  import { computed, nextTick, onMounted, ref, toRaw, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { Pig } from '../pig'
  import type { Image } from '../images'
  const emit = defineEmits(['item-selected', 'get-next'])
 
  const props = defineProps({
    total: { type: Number, default: 0 },
    items: { type: Array, default: () => [] },
    id: { type: String },
    active: { type: Boolean, default: true }
  })

  watch(props, () => {
    isActive.value = props.active
    imageData.value = props.items as Image[] || []
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const isActive = ref(props.active)

  const selectedImage = ref<Image | null>(null)
  watch(selectedImage, () => showDialog.value = selectedImage.value !== null )

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  let pig
  function initPig() {
    if (pig) return
    pig = new Pig(imageData.value, {
      container: shadowRoot.value?.querySelector('#image-grid') as HTMLElement,
      loadMoreCallback: () => { emit('get-next') },
      onClickHandler: imageSelected
    }).enable()
  }

  const imageData = <any>ref(props.items)
  watch(imageData, async (current, prior) => {
    console.log(`ProgressiveImageGrid.watch.imageData: size=${current.length}`)
    // console.log(toRaw(imageData.value))
    
    if (imageData.value.length === 0) {
      if (pig) pig.disable()
      pig = null
      return
    }
    
    let added = imageData.value.slice(prior?.length || 0, imageData.value.length)
    await checkImagesSizes(added)

    if (pig) {
      // console.log(`ProgressiveImageGrid.watch.imageData: added=${added.length}`)
      if (added.length) pig.addImages(added)
      else pig.update(imageData.value)
    } else {
      initPig()
    }
  })

  function imageSelected(index:number) {
    console.log(`ProgressiveImageGrid.imageSelected: index=${index}`, toRaw(imageData.value[index]))
    selectedImage.value = imageData.value[index] as Image
  }

  onMounted(() => { 
    // console.log(`ProgressiveImageGrid.onMounted: isActive=${isActive.value} images=${imageData.value.length}`)
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => showDialog.value = false )
    if (isActive.value && imageData.value.length > 0) initPig()
  })

  watch(isActive, () => {
    // console.log(`ProgressiveImageGrid.watch.isActive: isActive=${isActive.value} images=${imageData.value.length}`)
  })

  async function checkImagesSizes(images:Image[]) {
    
    let promises = images
      .filter((image:any) => !image.width)
      .map((image:any) => getImageSize(image))

    if (promises.length) {
      let results = await Promise.all(promises)
      results.forEach((result:any) => {
        let found:any = images.find((item:any) => result.id === item.id)
        found.width = result.width
        found.height = result.height
        found.aspect_ratio = result.aspect_ratio
        found.mime = result.mime
      })
    }
  }

  async function getImageSize(image: any, minWidth=200): Promise<{ image:any, width: number, height: number }> {
    return new Promise((resolve, reject) => {
      let img = new Image()
      img.onload = () => {
        let width = img.width < minWidth ? minWidth : img.width
        let height = img.width < minWidth ? img.height * minWidth/img.width : img.height
        let aspect_ratio = Number((width/height).toFixed(4))
        resolve({...image, width, height, aspect_ratio, mime: 'image/jpeg'})
      }
      img.onerror = () => reject()
      img.src = image.thumbnail
    })
  }

</script>

<style>

  * { box-sizing: border-box; }

  #image-grid {
    position: relative;
    margin: 2rem;    
  }

  .pig-figure {
    display: flex;
    flex-direction: column;
    background-color: #D5D5D5;
    overflow: hidden;
    left: 0;
    position: absolute;
    top: 0;
    margin: 0;
  }

  .pig-figure:hover {
    cursor: pointer;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  }

  .pig-figure img {
    left: 0;
    /* position: absolute; */
    top: 0;
    /* height: 100%; */
    width: 100%;
    opacity: 0;
    transition: 0.5s ease opacity;
    -webkit-transition: 0.5s ease opacity;
  }

  .pig-figure img.pig-thumbnail {
    -webkit-filter: blur(30px);
    filter: blur(30px);
    left: auto;
    position: relative;
    width: auto;
  }

  .pig-figure img.pig-loaded {
    opacity: 1;
  }

  .pig-figure .caption {
    height: 50px;
    background-color: white;
    z-index: 1;
    padding: 6px 3px 3px 3px;
  }

  .pig-figure .caption {
    display: flex;
    flex-direction: column;
    gap: 2px;
    height: 50px;
    background-color: white;
    z-index: 1;
  }

  .image-card {
    font-size: 0.85em;
    display: flex;
    flex-direction: column;
  }

  .title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.9em;
  }

  .title img {
    width: 16px;
    opacity: 1;
  }

  .size {
    font-size: 0.8em;
  }
  .clamp {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    /* margin-bottom: 6px; */
  }

  .text {
    margin: 6px 0;
    height: 50px;
  }

  .text p {
    margin: 0;
    padding: 0;
  }

  .license {
    display: flex;
    align-items: center;
    gap: 3px;
    font-size: 0.8em;
    margin-left: 0.5rem;
  }

  a.license {
    color: black;
    text-decoration: none;
    font-size: 0.9rem;
  }

</style>