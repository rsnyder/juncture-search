<template>

  <div ref="root">
    <img :src="image.thumbnail" @click="onSelected">
    <div class="caption">
      <div class="title">
        <img :src="image.logo">
        <div class="license-badges">
          <img v-for="url in licenseBadges" :src="url" />
        </div>
        <sl-icon library="fa" name="far-star"></sl-icon>
      </div>
    </div>
  </div>

  <sl-dialog class="dialog" :style="{'--width':dialogWidth}">
    <div>
      <ve-image-card :image="image"></ve-image-card>
    </div>
    <sl-button slot="footer" variant="primary" @click="showDialog = false">Close</sl-button>
  </sl-dialog>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, onUpdated, ref, toRaw, watch } from 'vue'
  import { licenses } from '../lib/licenses'

  import { useEntitiesStore } from '../store/entities'
  import type { Image } from '../images'
  import { storeToRefs } from 'pinia'

  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'

  const store = useEntitiesStore()
  const { imagesMap } = storeToRefs(store)

  const props = defineProps({
    id: { type: String },
    class: { type: String },
    // style: { type: String }
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  watch(root, () => clearStyling())
  onUpdated(() => clearStyling())

  const image = computed(() => imagesMap.value[props.id || ''] as Image)
  watch(image, () => { console.log(toRaw(image.value)) })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })

  onMounted(() => {
    // console.log(toRaw(props))
    // console.log(`ProgressiveImageGrid.onMounted: isActive=${isActive.value} images=${imageData.value.length}`)
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => showDialog.value = false )
  })

  const licenseBadges = computed(() => {
    return licenses[image.value.license]?.badges.slice(1) || []
  })

  function onSelected() {
    console.log('onSelected')
    showDialog.value = true
  }

  function clearStyling() {
    if (root.value) {
      root.value.className = ''
      root.value.style.transform = ''
      root.value.style.transition = ''
      root.value.style.width = ''
      root.value.style.height = ''
    }
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display:inline-block;
    flex-direction: column;
    width: 100%;
    border: 1px solid #ccc;
  }

  :host(:hover) {
    box-shadow: rgba(50, 50, 93, 0.25) 0px 6px 12px -2px, rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
  }

  .main {
    display: flex;
    flex-direction: column;
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background-color: white;
  }

  .caption {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
  }

  .title {
    display: flex;
    gap: 6px;
    align-items: center;
    width: 100%;
    padding: 3px;
  }

  .license-badges {
    display: flex;
    gap: 6px;
    align-items: center;
    padding: 3px;
  }

  .title img,
  .license-badges img {
    width: 24px;
    height: 24px;
  }

  .title sl-icon {
    font-size: 26px;
  }

  img {
    width: 100%;
    object-fit: contain;
  }

</style>