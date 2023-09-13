<template>

  <ve-header class="max-w-5xl m-auto rounded mb-4" color="#444A1E" logo="/images/phl-logo.png" title="Plant Humanities Lab" auth="netlify">
    <ul>
      <li><a href="https://lab.plant-humanities.org">
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z"/></svg>
        Home
      </a></li>
      <li><a href="/">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!-- Font Awesome Pro 5.15.4 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) --><path d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"/></svg>
        Search
      </a></li>
    </ul>
  </ve-header>



  <div class="max-w-5xl m-auto">

    <panel>
    <h1 class="text-2xl font-bold mb-4">Welcome to the Plant Humanities Search tool</h1>
    <p>This tool provides a convenient way to find web resources for a named entity (a person, place, plant, etc).</p>
    <p class="mt-4">Entity search results include:</p>
    <ul class="ml-4 max-w-md list-disc list-inside dark:text-gray-400">
      <li>High resolution images (public domain and open licensed)</li>
      <li>Journal articles</li>
      <li>Links to relevant web sites</li>
      <li>Maps</li>
      <li>Wikidata knowledge graph properties</li>
      <li>and more...</li>
    </ul>
  </panel>

    <panel class="bg-slate-100">
      <div class="flex-col w-full max-w-[500px] m-auto">
        <h1 class="text-3xl font-bold">Find an Entity</h1>
        <p class="mt-2">Search the Wikidata knowledge graph for a person, place, plant, animal, etc.</p>
        <ve-wikidata-search class="mt-4"></ve-wikidata-search>
        <!--<p class="mt-2">Example: <a href="/entity/Q171497">sunflower</a>, rose</p>-->
      </div>
    </panel>
    
    <panel>
      <h1 class="text-2xl font-bold mb-8">Some example entities...</h1>
      <div class="flex gap-x-8">
        <ve-entity-card-stack label="People">
          <ul>
            <li>Q1043</li>
            <li>Q1700717</li>
            <li>Q5194627</li>
            <li>Q157211</li>
            <li>Q5582</li>
            <li>Q127216</li>
          </ul>
        </ve-entity-card-stack>
        <ve-entity-card-stack label="Places">
          <ul>
            <li>Q1264942</li>
            <li>Q34687</li>
            <li>Q5194627</li>
            <li>Q157211</li>
            <li>Q5582</li>
            <li>Q127216</li>
          </ul>
        </ve-entity-card-stack>
        <ve-entity-card-stack label="Plants">
          <ul>
            <li>Q171497</li>
            <li>Q34687</li>
            <li>Q5194627</li>
            <li>Q157211</li>
            <li>Q5582</li>
            <li>Q127216</li>
          </ul>
        </ve-entity-card-stack>
        <ve-entity-card-stack label="Plants">
          <ul>
            <li>Q171497</li>
            <li>Q34687</li>
            <li>Q5194627</li>
            <li>Q157211</li>
            <li>Q5582</li>
            <li>Q127216</li>
          </ul>
        </ve-entity-card-stack>
      </div>
    </panel>

    <panel>
      <h1 class="text-2xl font-bold">Contribute to crowdsourced metadata</h1>
      <p>Lorem ipsum dolor sit amet, <ve-entity-infobox qid="Q171497">consectetur</ve-entity-infobox> adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
    </panel>

  </div>

</template>
    
  <script setup lang="ts">
  
    import { computed, onMounted, ref, toRaw, watch, nextTick } from 'vue'
    import { useRouter, useRoute } from 'vue-router'
    import Toolbar from '../components/Toolbar.vue'
    import Panel from '../components/Panel.vue'
    import Accordion from '../components/Accordion.vue'
    import Dropdown from '../components/Dropdown.vue'
    import Search from '../components/Search.vue'
    import { initFlowbite } from 'flowbite'

    import { useEntitiesStore } from '../store/entities'
    import { storeToRefs } from 'pinia'
    const store = useEntitiesStore()

    const { language, qid } = storeToRefs(store)
    
    const route = useRoute()
    const router = useRouter()

    const root = ref<HTMLElement | null>(null)
    
    onMounted(() => {
      initFlowbite()
      if (route.query.eid) store.setQid(route.query.eid as string)
    })

    watch(qid, () => { if (qid.value) setRoute(qid.value, language.value) })
    watch(language, () => { if (qid.value) setRoute(qid.value, language.value) })

  function setRoute(qid:string, lang:string) {
    let options:any = { name: 'entity', params: { qid } }
    if (lang !== 'en') options.query = { lang }
    router.push(options)
  }

  </script>
  
  <style>
    @import '../tailwind.css';

    a {
    @apply underline text-blue-600 hover:text-blue-800 visited:text-purple-600
    }

.card-stack {
  position: relative;
  margin: auto;
  width: 200px;
  height: 250px;
}
.card-stack div {
  width: 200px;
  height: 200px;
}

.card-stack > p {
  position: absolute;
  width: 100%;
  bottom: 0;
  left: 0;
  text-align: center;
  font-weight: bold;
  z-index: 1000;
}
.card-stack div {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #777;
  box-shadow: 0 1px 3px -2px rgba(0,0,0,.5);
  transition: all 0.3s ease-out;
}
.card-stack div:nth-child(1) {
  background-size: cover;
  z-index: 10;
}
.card-stack div:nth-child(2) {
  transform: rotate3d(0,0,1,7deg);
  z-index: 9;
}
.card-stack div:nth-child(3) {
  transform: rotate3d(0,0,1,-7deg);
  z-index: 8;
}
.card-stack div:nth-child(4) {
  transform: rotate3d(0,0,1,0deg);
  z-index: 7;
}

.card-stack:hover div:nth-child(1) {
  transform: scale(1.02);
}
.card-stack:hover div:nth-child(2) {
  transform: translate3d(10%, 0, 0) rotate3d(0,0,1,3deg);
}
.card-stack:hover div:nth-child(3) {
  transform: translate3d(-10%, 0, 0) rotate3d(0,0,1,-3deg);
}
.card-stack:hover div:nth-child(4) {
  transform: translate3d(2%, -5%, 0) rotate3d(0,0,1,2deg);
}
.card-stack:hover div:nth-child(5) {
  transform: translate3d(-5%, -2%, 0) rotate3d(0,0,1,2deg);
}

body {
  padding: 2em;
  background: #f8f8f8;
}
  

  </style>