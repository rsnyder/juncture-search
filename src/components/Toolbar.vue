<template>

  <div class="main">
    <div class="title" @click="onclick">
      <img v-if="logo" :src="logo">
      <span v-if="title" v-html="title"></span>
    </div>
    <ve-wikidata-search></ve-wikidata-search>
    <ve-language-selector></ve-language-selector>
    <!--<ve-theme-selector></ve-theme-selector> -->
  </div>
  
</template>

<script setup lang="ts">

  import { ref } from 'vue'
  import { storeToRefs } from 'pinia'
  import { useEntitiesStore } from '../store/entities'
  import { useRouter } from 'vue-router'
  
  const props = defineProps({
    title: { type: String },
    logo: { type: String }
  })

  const router = useRouter()

  const store = useEntitiesStore()

  const { language } = storeToRefs(store)

  function onclick(e:MouseEvent) {
    store.setQid(null)
    let options:any = { name: 'home', params: {} }
    if (language.value !== 'en') options.query = { lang: language.value }
    router.push(options)
  }

  const version = ref(process.env.npm_package_version)
  const mode = ref(process.env.NODE_ENV)

  console.log(process.env)
  console.log(`version=${version.value} mode=${mode.value}`)

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display: block;
  }

  .main {
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px;
    background-color: var(--sl-color-primary-600);
    border: 1px solid #444;
  }

  .title {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: 1.5rem;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  ve-wikidata-search {
    margin-left: auto;
  }

  /*
  .main > div {
    display: inline-block;
  }
  */

</style>
