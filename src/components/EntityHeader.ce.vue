<template>

    <div v-if="entity" class="card">
      
      <div class="text">
        <div class="label">
          <span class="label" v-html="entity.label"></span>
          <span class="wikidata-link">(<a target="_blank" :href="wikidataUrl" v-html="entity.id"></a>)</span>
        </div>
        <div v-if="entity.aliases" class="aliases" v-html="entity.aliases.join(' | ')"></div>
        <div v-if="entity.description" class="description" v-html="entity.description"></div>
        <div v-if="summaryText" class="summary-text">
          <div v-html="summaryText"></div>
          <div class="more" v-if="wikipedia">Source: <a :href="wikipedia.url">{{wikipedia.title}}</a></div>
        </div>
        <div class="links">
          <span v-if="wikipedia" class="wikipedia link" title="Wikipedia"><a target="_blank" :href="wikipedia.url"><img src="https://upload.wikimedia.org/wikipedia/commons/7/77/Wikipedia_svg_logo.svg"></a></span>
          <span class="wikimedia link" title="Wikidata"><a target="_blank" :href="wikidataUrl"><img src="https://upload.wikimedia.org/wikipedia/commons/f/ff/Wikidata-logo.svg"></a></span>
          <span v-if="commonsCategoryUrl" class="wikimedia link" title="Wikimedia Commons"><a target="_blank" :href="commonsCategoryUrl"><img src="https://upload.wikimedia.org/wikipedia/en/4/4a/Commons-logo.svg"></a></span>
          <span v-if="wikiquoteUrl" class="wikimedia link" title="Wikiquote"><a target="_blank" :href="wikiquoteUrl"><img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Wikiquote-logo.svg"></a></span>
          <span v-if="wikivoyageUrl" class="wikimedia link" title="Wikivoyage"><a target="_blank" :href="wikivoyageUrl"><img src="https://upload.wikimedia.org/wikipedia/commons/8/8a/Wikivoyage-logo.svg"></a></span>
        </div>
      </div>
      
      <div v-if="backgroundImage" class="image" :style="{backgroundImage}"></div>

    </div> <!-- card -->

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'

  const store = useEntitiesStore()
  const { qid } = storeToRefs(store)

  const entity = ref<any>()

  const wikipedia = computed(() => entity.value.sitelinks )
  const wikidataUrl = computed(() =>  `https://www.wikidata.org/entity/${entity.value.id}` )
  const commonsCategoryUrl = computed(() =>  '' )
  const wikiquoteUrl = computed(() =>  '' )
  const wikivoyageUrl = computed(() =>  '' )
  const summaryText = computed(() => entity.value.summaryText)
  const backgroundImage = ref<string>()

  onMounted(async () => entity.value = await store.fetch(qid.value, true))
  watch(qid, async () => { if (qid.value) entity.value = await store.fetch(qid.value, true) })

  watch(entity, () => setBackgroundImage())

  function setBackgroundImage() {
    let commonsImageFile = entity.value.claims?.P18 ? entity.value.claims.P18[0].mainsnak.datavalue.value : null
    if (commonsImageFile) backgroundImage.value = `url('${encodeUrl(store.mwImage(commonsImageFile, 500))}')`
  }

  function encodeUrl(url:string) {
    let parts = url.split('/')
    let encoded = `${parts.slice(0,-1).join('/')}/${encodeURIComponent(parts[parts.length-1])}`
    return encoded
  }

</script>

<style>

  .card {
    display: grid;
    grid-template-columns: 1fr minmax(0, 40%);
    grid-template-areas: "text image";
    padding: 12px;
    min-height: 300px;
    gap: 12px;
  }

  .text {
    grid-area: text;
    display: flex;
    flex-direction: column;
  }

  .image {
    grid-area: image;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 1.5em;
    font-weight: bold;
  }

  .aliases {
    font-size: 1.2em;
    font-style: italic;
    margin-bottom: 12px;
  }

  .description, .summary-text {
    font-size: 1.2em;
    margin: 0 0 12px 0;
  }

  .summary-text p {
    margin: 0 0 9px 0
  }

  .links {
    display: flex;
    gap: 12px;
    margin-top: auto;
  }

  .links img {
    height: 30px;
  }

</style>
