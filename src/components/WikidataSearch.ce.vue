<template>

  <div ref="root" class="wikidata-search">
    <div id="autocompleteContainer" class="autocomplete__container" role="combobox">
      <input
        id="autocompleteInput"
        class="autocomplete__input"
        @keyup="inputHandler"
        autocomplete="off"
        role="textbox"
        placeholder="Search for entity"
      />
      <button
        id="autocompleteDropdownArrow"
        class="autocomplete__dropdown-arrow"
        :style="{visibility: wdResults.length > 0 ? 'visible' : 'hidden'}"
        @click="toggleDropdown"
        aria-label="toggle dropdown"
      >
        <svg fill-rule="evenodd" height="5" viewBox="0 0 10 5" width="10">
          <title>Open drop down</title>
          <path d="M10 0L5 5 0 0z"></path>
        </svg>
      </button>
      <ul id="autocompleteResults" class="autocomplete__results" role="listbox">
        <li v-for="item, idx in wdResults" :key="`result-${idx}`" @click="itemSelected(item)">
          <ul>
            <li>
              <span class="label" v-html="item.label"></span>
              <span v-if="item.aliases" class="aliases">({{item.aliases.join(', ')}})</span>
            </li>
            <li class="description" v-html="item.description"></li>
          </ul>
        </li>
        <li v-if="searchContinue" @click="doSearch" class="continue">More...</li>
      </ul>
    </div>
  </div>

</template>
  
<script setup lang="ts">

  import { computed, onMounted, ref, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
  import '@shoelace-style/shoelace/dist/components/menu/menu.js'
  import '@shoelace-style/shoelace/dist/components/menu-item/menu-item.js'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { language } = storeToRefs(store)

  const wdResults = ref<any[]>([])
  const autocompleteResults = ref<HTMLInputElement>()
  const autocompleteDropdownArrow = ref<HTMLElement>()
  const autocompleteContainer = ref<HTMLElement>()
  const autocompleteInput = ref<HTMLInputElement>()
  const searchContinue = ref<Number>(0)
  const dropdownIsOpen = ref<Boolean>(false)
  const searchFor = ref('')
  const isSearching = ref(false)

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  // watch(host, () => init())
  onMounted(() => init() )

  watch(dropdownIsOpen, (isOpen) => {
    if (isOpen) {
      autocompleteResults.value?.classList.add('visible')
      autocompleteDropdownArrow.value?.classList.add('expanded')
      autocompleteContainer.value?.setAttribute('aria-expanded', 'true')
    } else {
      autocompleteResults.value?.classList.remove('visible')
      autocompleteDropdownArrow.value?.classList.remove('expanded')
      autocompleteContainer.value?.setAttribute('aria-expanded', 'false')
      autocompleteInput.value?.setAttribute('aria-activedescendant', '')
    }
  })

  watch(searchFor, () => {
    wdResults.value = []
    searchContinue.value = 0
    doSearch()
  })

  function init() {
    autocompleteResults.value = shadowRoot.value?.querySelector('#autocompleteResults') as HTMLInputElement
    autocompleteInput.value = shadowRoot.value?.querySelector('#autocompleteInput') as HTMLInputElement
    autocompleteDropdownArrow.value = shadowRoot.value?.querySelector('#autocompleteDropdownArrow') as HTMLElement
    autocompleteContainer.value = shadowRoot.value?.querySelector('#autocompleteContainer') as HTMLElement
  }

  function reset() {
    if (autocompleteInput.value) autocompleteInput.value.value = ''
    wdResults.value = []
    searchContinue.value = 0
    dropdownIsOpen.value = false
  }

  let debounce:any = null
  function inputHandler() {
    if (debounce !== null) {
      clearTimeout(debounce)
      debounce = null
    }
    debounce = window.setTimeout(() => {
      if (autocompleteInput.value) searchFor.value = autocompleteInput.value.value.trim()
      debounce = null
    }, 500)
  }

  function toggleDropdown() {
    dropdownIsOpen.value = !dropdownIsOpen.value
  }

  function doSearch() {
    if (!searchFor.value || isSearching.value) return
    isSearching.value = true
    let url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${searchFor.value}&uselang=${language.value}&language=${language.value}&format=json&origin=*&continue=${searchContinue.value}`
    fetch(url)
      .then(res => res.json())
      .then(res => {
        searchContinue.value = res['search-continue']
        wdResults.value = [...wdResults.value, ...res.search]
        dropdownIsOpen.value = true
      })
      .catch(err => {
        console.log(err)
      })
      .finally(() => (isSearching.value = false))

  }

  function itemSelected(item:any) {
    store.setQid(item.id)
    reset()
  }

</script>

<style>

  :host {
    font-family: Roboto, sans-serif;
    /* display: inline-block; */
  }

  * {
    box-sizing: border-box;
  }

  .autocomplete__container {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: flex-end;
    float: left;
    width: 100%;
    max-width: 500px;
    height: 100%;
  }

  textarea:focus, input:focus{
    outline: none;
  }

  .wikidata-search {
    /* display: inline-block; */
    /* height: calc(1.5em + 0.75rem + 2px); */
    height: 40px;
    margin-right: 3px;
    border: 1px solid #ccc;
    border-radius: 3px;
    width: 100%;
    background-color: white;
  }

  .wikidata-search i {
    padding-left: 6px;
    font-size: 1.2rem;
    color: #333;
  }

  .autocomplete__results.visible {
    visibility: visible;
    min-width: 320px;
  }

  .autocomplete__input {
    display: block;
    width: 100%;
    min-width: 220px;
    height: 100%;
    border: none;
    padding-left: 0.5rem;
    border-radius: 3px;
    font-size: 1.1rem;
  }

  .autocomplete__input:focus {
    border-color: hsl(221, 61%, 40%);
  }

  .autocomplete__dropdown-arrow {
    position: absolute;
    right: 0;
    top: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    height: 100%;
    transition: transform 0.2s linear;
  }

  .autocomplete__dropdown-arrow.expanded {
    transform: rotate(-180deg);
  }

  .autocomplete__results {
    visibility: hidden;
    position: absolute;
    top: 100%;
    margin-top: 0;
    width: 100%;
    overflow-y: auto;
    border: 1px solid #999;
    padding: 0;
    max-height: 400px;
    background: white;
    z-index: 500;
  }

  .autocomplete__results > li {
    list-style: none;
    padding: 0.3rem 0.5rem;
    cursor: pointer;
    color: black;
  }

  .autocomplete__results ul {
    list-style-type: none;
    padding-left: 0;
  }

  .autocomplete__results > li:hover {
    background: hsl(212, 10%, 60%);
  }

  .autocomplete__results > li:focus {
    background: hsl(212, 10%, 70%);
  }

  .label {
    font-weight: bold;
  }

  .aliases {
    font-style: italic;
  }

  .description {
    font-size: 0.9rem;
    padding: 2px 0;
  }

  .continue {
    font-weight: bold;
    background-color: #ddd;
  }

  .search {
    display: grid;
    border-radius: 0;
    /* padding: 6px 30px; */
    background-color: #555; 
    color: white;
    width: 100%;
    align-items: center;
  }

</style>