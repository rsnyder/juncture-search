<template>

  <div ref="root">
    <div @click="triggerNetlifyIdentityAction('login')">login</div>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  import netlifyIdentity from "netlify-identity-widget";

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'

  const store = useEntitiesStore()
  const { user } = storeToRefs(store)

  const props = defineProps({
  })

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement)

  onMounted(async () => {
    console.log('auth.omMounted', user.value)
    netlifyIdentity.init({
      APIUrl: "https://juncture-search.netlify.app/.netlify/identity",
      logo: false
    })
  })

  watch(user, () => {
    console.log('auth.user', user.value)
  })

  function triggerNetlifyIdentityAction(action) {
    console.log(`triggerNetlifyIdentityAction(${action})`)
    if (action == 'login' || action == 'signup') {
      netlifyIdentity.open(action)
      netlifyIdentity.on(action, user => {
        store.$state.user = {
          username: user.user_metadata.full_name,
          email: user.email,
          access_token: user.token.access_token,
          expires_at: user.token.expires_at,
          refresh_token: user.token.refresh_token,
          token_type: user.token.token_type
        }
        netlifyIdentity.close()
      })
    } else if (action == 'logout') {
      store.$state.user = null
      netlifyIdentity.logout()
    }
  }

</script>

<style>
  .callOut {
    visibility: hidden;
  }
</style>