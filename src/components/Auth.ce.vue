<template>
  <div ref="root">
    <sl-tooltip
      v-if="isLoggedIn"
      :content="`Logged in as ${user?.email}`"
      placement="bottom"
    >
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
import { onMounted, ref, toRaw, watch } from "vue";

import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";

import netlifyIdentity from "netlify-identity-widget";
import jwt_decode from "jwt-decode";

import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";

const store = useEntitiesStore();
const { isLoggedIn, user, userid } = storeToRefs(store);

const root = ref<HTMLElement | null>(null);

onMounted(async () => {
  // console.log("auth.onMounted");
  netlifyIdentity.on("init", (_user) => store.setUser(_user));
  netlifyIdentity.on("error", (err) => console.error("Error", err));
  netlifyIdentity.on("login", (_user) => {
    store.setUser(_user);
    netlifyIdentity.close();
  });
  netlifyIdentity.init({
    APIUrl: "https://juncture-search.netlify.app/.netlify/identity",
  });
  validate();
});

watch(user, () => {
  // console.log("auth.watch.user", user.value);
  if (user.value) localStorage.setItem("user", JSON.stringify(user.value));
  else if (localStorage.getItem("user")) localStorage.removeItem("user");
});

function login() {
  netlifyIdentity.open("login");
}

function logout() {
  store.setUser(null);
  netlifyIdentity.logout();
}

function validate() {
  // console.log("auth.validate");
  let _user: any =
    localStorage.getItem("user") &&
    JSON.parse(localStorage.getItem("user") || "{}");
  if (!_user) return Promise.resolve(null);
  if (!isLoggedIn.value) {
    // keep users logged in
    const formData = new FormData();
    formData.append("grant_type", "refresh_token");
    formData.append("refresh_token", _user.token.refresh_token);
    fetch("https://juncture-search.netlify.app/.netlify/identity/token", {
      method: "POST",
      body: formData,
    })
      .then((x) => x.json())
      .then((newToken: any) => {
        _user.token.access_token = newToken.access_token;
        _user.token.refresh_token = newToken.refresh_token;
        _user.token.expires_at =
          (jwt_decode(newToken.access_token) as any).exp * 1000;
        localStorage.setItem("user", JSON.stringify(_user));
        store.setUser(_user);
      });
    return null;
  }
  return null;
}
</script>

<style>
:host {
  color: white;
  font-weight: bold;
  cursor: pointer;
}
</style>
