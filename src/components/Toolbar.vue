<template>

  <div class="main">
    <div @click="onclick">
      Header
    </div>
    <ve-wikidata-search></ve-wikidata-search>
    <ve-language-selector></ve-language-selector>
    <!--<ve-theme-selector></ve-theme-selector> -->
  </div>
  
</template>

<script setup lang="ts">

  import { storeToRefs } from 'pinia'
  import { useEntitiesStore } from '../store/entities'
  import { useRouter } from 'vue-router'
  const router = useRouter()

  const store = useEntitiesStore()

  const { language } = storeToRefs(store)

  function onclick(e:MouseEvent) {
    store.setQid(null)
    let options:any = { name: 'home', params: {} }
    if (language.value !== 'en') options.query = { lang: language.value }
    router.push(options)
  }

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

  ve-wikidata-search {
    margin-left: auto;
  }

  .main > div {
    display: inline-block;
  }

</style>
