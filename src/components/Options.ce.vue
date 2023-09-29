<script setup lang="ts">

import { computed, onMounted, ref, toRaw, watch } from 'vue'

// @ts-ignore
import { HSCollapse } from '../lib/preline/components/hs-collapse'
import { HSDropdown } from '../lib/preline/components/hs-dropdown'

const emit = defineEmits(['options-updated'])

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)
const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
watch(shadowRoot, (shadowRoot) => {
  new HSCollapse(shadowRoot).init() 
  new HSDropdown(shadowRoot).init() 
})

const props = defineProps({
  label: { type: String, default: 'Options' },
  options: { type: Object, default: () => ({}) },
})

const providers = computed(() => props.options.providers)
const providersEnabled = ref<any>({})

watch (providers, () => Object.fromEntries((providers.value as any[])?.map((provider: any) => [provider.label, provider])) || [])

onMounted(() => evalProps() )

watch (props, () => evalProps() )

function evalProps() {
  providersEnabled.value = Object.fromEntries((providers.value as any[])?.map((provider: any) => [provider.label, provider]) || [])
}

function setProviders(e: any) {
  let cb = e.target as HTMLInputElement
  let providerTag = cb.dataset.provider
  let copy = {...providersEnabled.value}
  if (providerTag) copy[providerTag].enabled = !copy[providerTag].enabled
  providersEnabled.value = copy
  emit('options-updated', {providers: Object.values(providersEnabled.value)})
}

</script>

<template>

  <div ref="root" class="flex items-center gap-4">
    <div class="" v-html="label"></div>
    <button type="button" id="hs-basic-collapse" data-hs-collapse="#hs-basic-collapse-heading"
      class="hs-collapse-toggle py-3 px-4 inline-flex justify-center items-center gap-2 rounded-md border border-transparent font-semibold bg-white hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all text-sm dark:focus:ring-offset-gray-800" 
    >
      <svg class="hs-collapse-open:rotate-180 w-2.5 h-2.5 text-black" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </div>

  <div id="hs-basic-collapse-heading" class="hs-collapse hidden w-full overflow-hidden transition-[height] duration-300" aria-labelledby="hs-basic-collapse">
    <div class="bg-slate-100 p-4 rounded">
      <div class="hs-dropdown relative inline-flex z-50" 
           data-hs-dropdown-auto-close="false"
        >
        <button id="hs-dropdown-item-checkbox" type="button" class="hs-dropdown-toggle py-3 px-4 inline-flex justify-center items-center gap-2 ml-1 mb-1 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
          Content providers
          <svg class="hs-dropdown-open:rotate-180 w-2.5 h-2.5 text-gray-600" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 5L8.16086 10.6869C8.35239 10.8637 8.64761 10.8637 8.83914 10.6869L15 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <div class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" aria-labelledby="hs-dropdown-item-checkbox">
          
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

        </div>
      </div>

    </div>
  </div>

</template>

<style>
  @import '../tailwind.css';
</style>
