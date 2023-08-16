<template>

  <sl-tab-group ref="root">
    <sl-tab slot="nav" panel="formatted">Formatted</sl-tab>
    <sl-tab slot="nav" panel="raw">Raw</sl-tab>
 
    <sl-tab-panel name="formatted">
      <div v-if="image" class="card">
        
        <div id="image">
          <img :src="image?.thumbnail" :alt="image.title" />
          <div v-if="image.depicts">
            <h4>Depicted entities</h4>
            <ul>
              <li v-for="depict in image.depicts" :data-qid="depict.id" :key="depict.id">
                <div>{{ depict.label || labels[depict.id] }}</div>
              </li>
            </ul>
          </div>
        </div>
        
        <div id="metadata">
          
          <h2 v-html="image.title || image.file?.replace(/_/g, ' ').replace(/\.png|\.jpg|\.jpeg$/i,'')"></h2>
          
          <div v-if="image.description">
            <span>Description</span>
            <span class="description" v-html="image.description"></span>
          </div>
          
          <div>
            <span>Source</span>
            <a v-if="image.source" :href="image.source" v-html="image.source" target="_blank"></a>
          </div>

          <div>
            <h4>Image links</h4>
            <ul>
              <li>
                <span class="label">Original</span> <a :href="image.url" v-html="image.url" target="_blank"></a>
              </li>
              <li>
                <span class="label">Thumbnail</span> <a :href="image.thumbnail" v-html="image.thumbnail" target="_blank"></a>
              </li>
              <li>
                <span class="label">IIIF</span> <a :href="image.iiif" v-html="image.iiif" target="_blank"></a>
              </li>
            </ul>
          </div>

          <div v-if="image.pageid">
            <span>ID</span>
            <a :href="`https://commons.wikimedia.org/wiki/Special:EntityData/M${image.pageid}.json`" v-html="`M${image.pageid}`" target="_blank"></a>
          </div>

          <!--
          <div>
            <span>Metadata</span>
            <a :href="`https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&prop=imageinfo&iiprop=extmetadata|size|mime&pageids=${image.pageid}`" v-html="image.pageid" target="_blank"></a>
          </div>
          -->

          <div class="provider">
            <span>Provider</span>
            <img v-if="image.logo" :src="image.logo" :alt="image.logo" />
            <span v-html="image.provider"></span>
          </div>

          <div v-if="image.width">
            <span>Size</span> {{ image.width?.toLocaleString() }} x {{ image.height?.toLocaleString() }}
          </div>

          <div>
            <span>Aspect ratio</span> {{ image.aspect_ratio?.toFixed(2) }}
          </div>

          <div v-if="image.format">
            <span>Format</span> <span v-html="image.format?.split('/').pop()?.toUpperCase()"></span>
          </div>

          <div v-if="image.coords">
            <span>Coordinates</span> <span v-html="image.coords"></span>
          </div>

          <div v-if="image.imageQualityAssessment">
            <span>Quality assessment</span> <span v-html="image.imageQualityAssessment"></span>
          </div>

          <div>
            <span>License</span>
            <a :href="image.license" v-html="licenses[image.license].code || image.license" target="_blank"></a>
          </div>

          <div v-if="image.attribution">
            <span>Attribution</span> <span v-html="image.attribution"></span>
          </div>

          <div v-if="image.creator">
            <span>Created by</span>
            <span v-if="image.creator" v-html="image.creator.label"></span>
          </div>

          <div v-if="image.depicts">
            <h4>Depicted entities</h4>
            <ul>
              <li v-for="depict in image.depicts" :key="depict.id">
                {{ depict.label || labels[depict.id] }}
              </li>
            </ul>
          </div>

        </div>
      </div>
    </sl-tab-panel>

    <sl-tab-panel name="raw">
      <pre>{{ JSON.stringify(image, replacer, 2) }}</pre>
    </sl-tab-panel>

  </sl-tab-group>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { licenses } from '../lib/licenses'
  import { useEntitiesStore } from '../store/entities'
  import type { Image } from '../types'
  import { storeToRefs } from 'pinia'

  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/popup/popup.js'
  import '@shoelace-style/shoelace/dist/components/tab/tab.js'
  import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js'
  import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js'

  const store = useEntitiesStore()
  const { labels } = storeToRefs(store)

  // Sorts object keys for JSON stringification
  const replacer = (_, value) =>
    value instanceof Object && !(value instanceof Array) 
      ? Object.keys(value)
        .sort()
        .reduce((sorted, key) => {
          sorted[key] = value[key];
          return sorted 
        }, {})
      : value;

  const props = defineProps({
    image: { type: Object }
  })

  const root = ref<HTMLElement | null>(null)
  const host = computed(() => (root.value?.getRootNode() as any)?.host)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const image = computed(() => props.image as Image)

  watch(image, () => {
    if (image.value?.pageid && !image.value?.attribution) getImageInfo()
  })

  function getImageInfo() {
    let pageid = image.value.pageid || ''
    if (pageid) {
      fetch(`https://commons.wikimedia.org/w/api.php?origin=*&format=json&action=query&prop=imageinfo&iiprop=extmetadata|size|mime&pageids=${pageid}`)
      .then(response => response.json())
      .then(data => data.query.pages[pageid]?.imageinfo[0])
      .then(imageinfo => {
        if (imageinfo.extmetadata.Attribution) {
          image.value.attribution = imageinfo.extmetadata.Attribution.value
        } else if (imageinfo.extmetadata.Artist) {
          image.value.attribution = `<em>${image.value.file}</em> from <a href="${image.value.url}" target="_blank">Wikimedia Commons</a> by ${imageinfo.extmetadata.Artist.value}, ${imageinfo.extmetadata.LicenseShortName.value}`
        }
      })
    }
  }

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display:inline-block;
    width: 100%;
  }

  #image {
    display: flex;
    gap: 1rem;
  }

  #image img {
    max-height: 400px;
  }

  #metadata {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .license img {
    height: 2.5rem;
  }

  .provider {
    display: flex;
    align-items: center;
    font-weight: 700;
  }

  .provider img {
    height: 1.5rem;
    margin-right: 0.5rem;
  }

  #metadata > div > span:first-of-type,
  .label {
    font-weight: bold;
    margin-right: 0.5rem;
  }
  #metadata > div > span:first-of-type:after,
  .label:after {
    content: ': ';
  }

  h2, h3, h4 {
    margin: 0;
  }

  ul {
    margin: .5rem 0;
  }

</style>