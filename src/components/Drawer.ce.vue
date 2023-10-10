<script setup lang="ts">

import { computed, onMounted, ref, watch } from 'vue'
import '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import '@shoelace-style/shoelace/dist/components/option/option.js'
import '@shoelace-style/shoelace/dist/components/select/select.js'
import type SLDrawer from '@shoelace-style/shoelace/dist/components/drawer/drawer.js'
import type SLOption from '@shoelace-style/shoelace/dist/components/option/option.js'
import type SLSelect from '@shoelace-style/shoelace/dist/components/select/select.js'

import { useEntitiesStore } from '../store/entities'
import { storeToRefs } from 'pinia'
const store = useEntitiesStore()
const { labels } = storeToRefs(store)

const emit = defineEmits(['options-updated'])

const root = ref<HTMLElement | null>(null)
const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
const drawer = computed(() => shadowRoot.value?.querySelector('.drawer') as SLDrawer)
watch (drawer, (drawer) => {
  shadowRoot.value.querySelector('#open-drawer')?.addEventListener('click', () => { drawer.open = !drawer.open })
})

const entitySelect = ref<HTMLElement | null>(null)
watch(entitySelect, (entitySelect) => entitySelect?.addEventListener('sl-change', (e: any) => setEntities(e)) )

const props = defineProps({
  label: { type: String, default: 'Options' },
  options: { type: Object, default: () => ({}) },
})

onMounted(() => options.value = props.options )
watch(props, () => options.value = props.options )

const options = ref()

const providers = computed(() => options.value?.providers || [])
const providersEnabled = computed(() => Object.fromEntries((providers.value as any[])?.map((provider: any) => [provider.label, provider]) || []))

const depicted = computed(() => Array.from(Object.entries(options.value?.depicts?.entities || {}).map(([qid, count]) => ({ qid, count, label: labels.value[qid] })) || []))

function setProviders(e: any) {
  let _options = {...options.value}
  let provider = _options.providers.find((p: any) => p.label === e.target.dataset.provider)
  provider.enabled = !provider.enabled  
  emit('options-updated', _options)
}

function setEntities(e: any) {
  let _options = {...options.value}
  _options.depicts.selected = (entitySelect.value as HTMLOptionElement)?.value
  emit('options-updated', _options)
}

</script>

<template>

  <div ref="root" class="relative">
    
    <slot name="label"></slot>
    <svg id="open-drawer" class="svg-icon" style="width: 1.5em; height: 1.5em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M225.863111 251.064889V71.111111a28.444444 28.444444 0 0 0-56.888889 0v177.834667c-69.632 11.093333-123.050667 71.395556-123.050666 144.099555 0 72.689778 53.418667 132.963556 123.050666 144.056889V952.888889a28.444444 28.444444 0 0 0 56.888889 0V534.983111c64.256-15.331556 112.213333-73.073778 112.213333-141.952s-47.971556-126.634667-112.213333-141.966222zM192 482.218667c-49.180444 0-89.187556-40.007111-89.187556-89.187556s40.007111-89.187556 89.187556-89.187555 89.187556 40.007111 89.187556 89.187555-40.007111 89.187556-89.187556 89.187556z" fill="" /><path d="M221.184 331.491556l-3.953778-0.782223a14.222222 14.222222 0 1 0-5.475555 27.918223l3.953777 0.782222a14.222222 14.222222 0 0 0 5.475556-27.918222zM167.850667 340.238222a77.525333 77.525333 0 0 0-38.840889 67.029334 14.222222 14.222222 0 1 0 28.430222 0c0-17.436444 9.429333-33.678222 24.576-42.368a14.222222 14.222222 0 0 0-14.165333-24.661334zM538.752 507.064889V71.111111a28.444444 28.444444 0 0 0-56.888889 0v433.834667c-69.632 11.093333-123.050667 71.395556-123.050667 144.099555 0 72.689778 53.418667 132.963556 123.050667 144.056889V952.888889a28.444444 28.444444 0 0 0 56.888889 0V790.983111c64.256-15.331556 112.227556-73.073778 112.227556-141.952s-47.985778-126.634667-112.227556-141.966222zM504.888889 738.218667a89.287111 89.287111 0 0 1-89.187556-89.187556c0-49.166222 40.007111-89.187556 89.187556-89.187555s89.187556 40.021333 89.187555 89.187555a89.272889 89.272889 0 0 1-89.187555 89.187556z" fill="" /><path d="M534.072889 587.505778l-3.953778-0.796445a14.222222 14.222222 0 0 0-5.461333 27.918223l3.953778 0.796444a14.208 14.208 0 0 0 16.682666-11.221333 14.222222 14.222222 0 0 0-11.221333-16.696889zM480.739556 596.238222a77.553778 77.553778 0 0 0-38.840889 67.043556 14.222222 14.222222 0 1 0 28.430222 0c0-17.450667 9.429333-33.692444 24.576-42.382222a14.208 14.208 0 1 0-14.165333-24.661334zM978.076444 293.475556c0-68.878222-47.971556-126.634667-112.227555-141.966223V71.111111a28.444444 28.444444 0 0 0-56.888889 0v78.279111c-69.632 11.093333-123.050667 71.395556-123.050667 144.099556 0 72.689778 53.432889 132.977778 123.050667 144.071111V952.888889a28.444444 28.444444 0 0 0 56.888889 0V435.441778c64.256-15.331556 112.227556-73.088 112.227555-141.966222zM832 382.663111c-49.180444 0-89.187556-40.007111-89.187556-89.187555s40.007111-89.187556 89.187556-89.187556 89.187556 40.007111 89.187556 89.187556-40.007111 89.187556-89.187556 89.187555z" fill="" /><path d="M861.184 231.936l-3.953778-0.782222a14.222222 14.222222 0 0 0-5.475555 27.918222l3.953777 0.782222a14.208 14.208 0 0 0 16.682667-11.221333 14.208 14.208 0 0 0-11.207111-16.696889zM807.850667 240.682667a77.525333 77.525333 0 0 0-38.840889 67.029333 14.222222 14.222222 0 1 0 28.444444 0c0-17.436444 9.415111-33.678222 24.576-42.368a14.222222 14.222222 0 0 0-14.179555-24.661333z" fill="" /></svg>
    <slot></slot>

    <sl-drawer label="Options" contained placement="start" class="drawer" style="--size: 400px;">
      <template v-for="provider, idx) in providers">
            
        <div class="relative flex items-center py-2 px-3 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          <div class="flex items-center h-5">
            <input 
              type="checkbox"
              :id="`hs-dropdown-item-checkbox-${idx}`" 
              :data-provider="(provider as any).label" 
              :name="`hs-dropdown-item-checkbox-checkbox-${idx}`"
              class="border-gray-200 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:checked:bg-blue-500 dark:checked:border-blue-500 dark:focus:ring-offset-gray-800" 
              aria-describedby="hs-dropdown-item-checkbox-delete-description" 
              :data-enabled="providersEnabled[(provider as any).label]?.enabled ? true : false"
              :checked="providersEnabled[(provider as any).label]?.enabled"
              @click="setProviders"
            >
          </div>
          <img :src="(provider as any).logo" class="ml-4 h-4 w-4">
          <label :for="`hs-dropdown-item-checkbox-checkbox-${idx}`" class="ml-2">
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-300" v-html="(provider as any).label"></span>
          </label>
        </div>

      </template>

      <br/>
      <div></div>
      <sl-select ref="entitySelect" label="Select a Few" value="" multiple clearable>
        <sl-option  v-for="d in depicted" :key="d.qid" :value="d.qid">{{ d.label }} ({{ d.count }})</sl-option>
      </sl-select>

      <div class="h-[400px]"></div>

    </sl-drawer>

  </div>

</template>

<style>
  @import '../tailwind.css';

  sl-drawer::part(panel) {
    margin: 45px 0 1px 1px;
    height: auto;
}

</style>
