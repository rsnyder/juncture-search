<template>
  <ve-drawer class="w-full">
    <ve-images class="w-full"></ve-images>
  </ve-drawer>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw } from "vue";
import { useEntitiesStore } from "../store/entities";
const store = useEntitiesStore();

onMounted(() => {
  store.setActive("images");
  store.setQid("Q171497");
});

const options = ref<any>({
  providers: [
    {
      label: "Wikimedia Commons",
      enabled: true,
      logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Commons-logo.svg/178px-Commons-logo.svg.png",
    },
    {
      label: "JSTOR",
      enabled: true,
      logo: "https://about.jstor.org/wp-content/themes/aboutjstor2017/static/JSTOR_Logo2017_90.png",
    },
    {
      label: "Biodiversity Heritage Library",
      enabled: true,
      logo: "https://www.biodiversitylibrary.org/favicon.ico",
    },
    {
      label: "Flickr",
      enabled: true,
      logo: "https://combo.staticflickr.com/pw/favicon.ico",
    },
    {
      label: "Openverse",
      enabled: true,
      logo: "https://openverse.org/openverse-logo.svg",
    },
  ],
});

function optionsUpdated(e: any) {
  // console.log("optionsUpdated", toRaw(e.detail));
}
</script>

<style>
@import "../tailwind.css";
</style>
