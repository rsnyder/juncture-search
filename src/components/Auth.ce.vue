<template>

  <div ref="root">

    <sl-tooltip v-if="isLoggedIn" :content="`Logged in as ${user?.email}`" placement="bottom">
      <div @click="logout">Logout</div>
    </sl-tooltip>

    <sl-tooltip v-else content="Login" placement="bottom">
      <div @click="login">Login</div>
    </sl-tooltip>

    <!--
    <div v-if="isLoggedIn" @click="triggerNetlifyIdentityAction('logout')">logout</div>
    <div v-else @click="triggerNetlifyIdentityAction('login')">login</div>
    -->

  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js'

  import netlifyIdentity from "netlify-identity-widget";
  import jwt_decode from 'jwt-decode'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'

  const store = useEntitiesStore()
  const { user } = storeToRefs(store)

  const root = ref<HTMLElement | null>(null)

  onMounted(async () => {
    validate()
    /*
    let _user: any = localStorage.getItem('gotrue.user')
    if (_user) {
      store.$state.user = JSON.parse(_user)
      if (user.value) console.log('auth.omMounted', user.value, new Date(user.value.expires_at))
    }
    */
    netlifyIdentity.on('init', _user => {
      console.log('init', _user)
      if (_user && tokenIsValid(_user.token.expires_at)) store.$state.user = _user
    })
    netlifyIdentity.on('open', () => console.log('Widget opened'))
    netlifyIdentity.on('close', () => console.log('Widget closed'))
    netlifyIdentity.on('error', err => console.error('Error', err))
    netlifyIdentity.on('login', () => console.log('on.login'))
    netlifyIdentity.on('login', _user => {
      console.log('logged in', _user)
      store.$state.user = _user
      netlifyIdentity.close()
    })
    netlifyIdentity.init({
      APIUrl: "https://juncture-search.netlify.app/.netlify/identity",
      logo: false
    })

  })

  const isLoggedIn = computed(() => user.value != null)

  watch(user, () => {
    console.log('auth.user', toRaw(user.value))
    if (user.value) localStorage.setItem('user', JSON.stringify(user.value))
    else if (localStorage.getItem('user')) localStorage.removeItem('user')
  })

  function login() {
    netlifyIdentity.open('login')
  }

  function logout() {
    store.$state.user = null
    netlifyIdentity.logout()
  }

  function tokenIsValid(expiration:number) {
    let isExpired = expiration <= Date.now()
    console.log(`tokenIsValid=${!isExpired}`)
    return !isExpired
  }

  function validate() {
    let _user: any = localStorage.getItem('user') && JSON.parse(localStorage.getItem('user') || '{}' )
    if (!_user) return Promise.resolve(null)
    if (!tokenIsValid(_user.token.expires_at)) {
      // keep users logged in
      console.log('refreshing token')
      const formData = new FormData()
      formData.append('grant_type', 'refresh_token')
      formData.append('refresh_token', _user.token.refresh_token)
      fetch('https://juncture-search.netlify.app/.netlify/identity/token', {
        method : 'POST',
        body : formData
      }).then(x=>x.json()).then((newToken: any) => {
        console.log('newToken', newToken)
        _user.token.access_token=newToken.access_token
        _user.token.refresh_token=newToken.refresh_token
        _user.token.expires_at = (jwt_decode(newToken.access_token) as any).exp * 1000
        localStorage.setItem('user', JSON.stringify(_user))
        store.$state.user = _user
      })
      return null
      }
      return null
    }


</script>

<style>
:host {
  color: white;
  font-weight: bold;
  cursor: pointer;
}
</style>