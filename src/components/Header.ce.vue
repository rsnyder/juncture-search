<script setup lang="ts">
import { computed, ref, toRaw, watch } from "vue";

const root = ref<HTMLElement | null>(null);
const host = computed(() => (root.value?.getRootNode() as any)?.host);

const shadowRoot = computed(() => root?.value?.parentNode as HTMLElement);
const header = computed(() => shadowRoot.value?.querySelector("header"));
watch(header, (header) => {
  if (header) header.style.backgroundColor = props.color;
});

watch(host, () => {
  menuItems.value = host.value.querySelector("ul");
});

const menuItems = ref<HTMLUListElement>();

const props = defineProps({
  title: { type: String },
  logo: { type: String },
  url: { type: String },
  color: { type: String, default: "#444" },
  auth: { type: String },
});
</script>

<template>
  <header
    ref="root"
    class="relative flex flex-wrap 2xl:justify-start 2xl:flex-nowrap z-30 w-full text-sm py-4 dark:bg-gray-800"
  >
    <div class="max-w-[85rem] w-full mx-auto px-4" aria-label="Global">
      <div class="flex items-center gap-3 justify-between">
        <template v-if="logo">
          <a v-if="url" :href="url">
            <img :src="logo" alt="Website Logo" class="h-[3em] max-w-none" />
          </a>
          <img
            v-else
            :src="logo"
            alt="Website Logo"
            class="h-[3em] max-w-none"
          />
        </template>
        <div v-else></div>

        <div v-if="title" class="flex items-center space-x-2">
          <h1
            v-html="title"
            class="text-4xl text-white font-semibold font-serif"
          ></h1>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="2.2em"
            viewBox="0 0 512 512"
            style="transform: scaleX(-1)"
          >
            <!--! Font Awesome Free 6.4.2 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. -->
            <path
              style="fill: white"
              d="M505 442.7L405.3 343c-4.5-4.5-10.6-7-17-7H372c27.6-35.3 44-79.7 44-128C416 93.1 322.9 0 208 0S0 93.1 0 208s93.1 208 208 208c48.3 0 92.7-16.4 128-44v16.3c0 6.4 2.5 12.5 7 17l99.7 99.7c9.4 9.4 24.6 9.4 33.9 0l28.3-28.3c9.4-9.4 9.4-24.6.1-34zM208 336c-70.7 0-128-57.2-128-128 0-70.7 57.2-128 128-128 70.7 0 128 57.2 128 128 0 70.7-57.2 128-128 128z"
            />
          </svg>
        </div>
        <div v-else></div>
        <ve-menu
          v-if="menuItems"
          :auth="props.auth || null"
          v-html="menuItems.outerHTML"
        ></ve-menu>
        <div v-else></div>
      </div>
    </div>
  </header>
</template>

<style>
@import "../tailwind.css";
</style>
