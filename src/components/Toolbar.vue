<template>

  <div class="main">
    <div class="title" @click="onclick">
      <img v-if="logo" class="logo" :src="logo">
      <span v-if="title" v-html="title"></span>
    </div>
    <ve-wikidata-search></ve-wikidata-search>
    <!-- <ve-language-selector></ve-language-selector> -->
    <ve-auth></ve-auth>
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

</script>

<style>

  * { box-sizing: border-box; }

  :host {
    display: block;
  }

  .main {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 6px;
    /* background-color: var(--sl-color-primary-600); */
    background-color: #5A162E;
    border: 1px solid #444;
  }

  .title {
    display: flex;
    gap: 18px;
    align-items: center;
    font-size: 2.0rem;
    color: white;
    font-weight: bold;
    cursor: pointer;
  }

  .logo {
    width: 48px;
    height: 48px;
    background-color: white;
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
