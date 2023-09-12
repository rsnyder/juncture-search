<script setup lang="ts">

import { computed, onMounted, ref, toRaw, watch } from 'vue'

// @ts-ignore
import { HSDropdown } from '../lib/preline/components/hs-dropdown'
import netlifyIdentity from 'netlify-identity-widget'
import jwt_decode from 'jwt-decode'
import { useEntitiesStore } from '../store/entities'

import { storeToRefs } from 'pinia'

const root = ref<HTMLElement | null>(null)
const host = computed(() => (root.value?.getRootNode() as any)?.host)
const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)
watch(shadowRoot, (shadowRoot) => new HSDropdown(shadowRoot).init() )

const store = useEntitiesStore()

watch(host, () => { getMenuItems() })

const menuItems = ref<any[]>([])

const { isLoggedIn, user } = storeToRefs(store)

const props = defineProps({
  logo: { type: String },
  title: { type: String }
})

function getMenuItems() {
  function parseSlot() {
    menuItems.value = Array.from(host.value.querySelectorAll('li'))
      .map((li: any) => {
        const a = li.querySelector('a') as HTMLAnchorElement
        let label = a.innerText
        let icon = li.querySelector('svg') as SVGElement
        return { label, icon, href: a.href }
      })
    }
    
    parseSlot()
    new MutationObserver(
      (mutationsList:any) => {
        for (let mutation of mutationsList) { if (mutation.type === 'childList') parseSlot() }      
      }
    ).observe(host.value, { childList: true, subtree: true })
  }

  onMounted(async () => {
    netlifyIdentity.on('init', _user => store.setUser(_user))
    netlifyIdentity.on('error', err => console.error('Error', err))
    netlifyIdentity.on('login', _user => {
      store.setUser(_user)
      netlifyIdentity.close()
    })
    netlifyIdentity.init({ APIUrl: 'https://juncture-search.netlify.app/.netlify/identity'})
    validate()
  })

  watch(user, () => {
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
    else if (localStorage.getItem('user')) localStorage.removeItem('user')
  })

  function login(evt:Event) {
    evt.preventDefault()
    netlifyIdentity.open('login')
  }

  function logout(evt:Event) {
    evt.preventDefault()
    store.setUser(null)
    netlifyIdentity.logout()
  }

  function validate() {
    let _user: any = localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}' )
    if (!_user) return Promise.resolve(null)
    if (!isLoggedIn.value) {
      // keep users logged in
      const formData = new FormData()
      formData.append('grant_type', 'refresh_token')
      formData.append('refresh_token', _user.token.refresh_token)
      fetch('https://juncture-search.netlify.app/.netlify/identity/token', {
        method : 'POST',
        body : formData
      }).then(x=>x.json()).then((newToken: any) => {
        _user.token.access_token=newToken.access_token
        _user.token.refresh_token=newToken.refresh_token
        _user.token.expires_at = (jwt_decode(newToken.access_token) as any).exp * 1000
        localStorage.setItem('user', JSON.stringify(_user))
        store.setUser(_user)
      })
      return null
    }
    return null
  }

  function toggleLogin(evt:Event) {
    evt.preventDefault()
    isLoggedIn.value = !isLoggedIn.value
    console.log(`toggleLogin: isLoggedIn=${isLoggedIn.value}`)
    let menu = shadowRoot.value.querySelector('.hs-dropdown.open')?.querySelector('.hs-dropdown-menu') as HTMLElement
    menu.classList.remove('block')
    menu.classList.add('hidden')
  }

</script>

<template>

  <nav class="hs-dropdown relative inline-flex" ref="root" >
    
    <button 
      id="hs-dropdown-custom-icon-trigger" 
      type="button"
      aria-label="Site navigation menu"
      class="hs-dropdown-toggle p-3 inline-flex justify-center items-center gap-2 rounded-md border font-medium bg-white text-gray-700 shadow-sm align-middle hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-blue-600 transition-all text-sm dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-gray-700 dark:text-gray-400 dark:hover:text-white dark:focus:ring-offset-gray-800">
      <svg class="w-4 h-4" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path fill-rule="evenodd"
          d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z" />
      </svg>
    </button>

    <div
      class="hs-dropdown-menu transition-[opacity,margin] duration hs-dropdown-open:opacity-100 opacity-0 hidden min-w-[15rem] bg-white shadow-md rounded-lg p-2 mt-2 dark:bg-gray-800 dark:border dark:border-gray-700" 
      aria-labelledby="hs-dropdown-custom-icon-trigger">
      <a v-for="item in menuItems" :key="item.href" 
        class="flex items-center gap-x-2 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300" 
        :href="item.href"
      >
        <svg v-if="item.icon" v-html="item.icon.outerHTML" class="w-4 h-4 text-gray-500"></svg>
        <span v-else class="w-4"></span>
        <span v-html="item.label" class="font-medium"></span>
      </a>

      <a v-if="isLoggedIn"
        class="flex items-center gap-x-2 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300" 
        href="javascript;;" 
        @click="logout"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z"/></svg>
        <span class="font-medium">({{user.email}})</span> <span class="font-medium">Logout</span>
      </a>
      <a v-else
        class="flex items-center gap-x-2 py-2 rounded-md text-sm text-gray-800 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300" 
        href="javascript;;" 
        @click="login"
      >
        <svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 448 512"><!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M304 128a80 80 0 1 0 -160 0 80 80 0 1 0 160 0zM96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM49.3 464H398.7c-8.9-63.3-63.3-112-129-112H178.3c-65.7 0-120.1 48.7-129 112zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3z"/></svg>
        <span class="font-medium">Login</span>
      </a>

    </div>

  </nav>

</template>

<style>
  @import '../tailwind.css';
</style>
