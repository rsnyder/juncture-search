<template>
  <div
    ref="root"
    class="max-w-xs rounded overflow-hidden shadow-lg"
    @click="onclick"
  >
    <img class="max-h-[200px] w-full object-cover" :src="thumbnail" />
    <div class="px-6 py-4">
      <div class="font-bold text-xl mb-2" v-html="label"></div>
      <p class="text-gray-700 text-base" v-html="description"></p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { Md5 } from "ts-md5";

const props = defineProps({
  qid: { type: String },
});

const root = ref<HTMLElement | null>(null);

const store = useEntitiesStore();

const qid = ref<string>();
watch(qid, async () => (entity.value = await store.fetch(qid.value)));

const entity = ref<any>();
watch(entity, () => {
  label.value = entity.value.label;
  description.value = entity.value.description;
  let commonsImageFile = entity.value.image;
  if (commonsImageFile) {
    image.value = mwImage(commonsImageFile);
    thumbnail.value = mwImage(commonsImageFile, 500);
  }
  wikipediaLink.value = entity.value.wikipedia;
  summaryText.value = entity.value.summaryText;
});

const label = ref<string>();
const description = ref<string>();
const summaryText = ref<string>();
const wikipediaLink = ref<string>();
const image = ref<string>();
const thumbnail = ref<string>();
const backgroundImage = computed(
  () => thumbnail.value && `url('${encodeUrl(thumbnail.value)}')`,
);

onMounted(() => (qid.value = props.qid));
watch(props, () => (qid.value = props.qid));

function encodeUrl(url: string) {
  let parts = url.split("/");
  return `${parts.slice(0, -1).join("/")}/${encodeURIComponent(
    parts[parts.length - 1],
  )}`;
}

function mwImage(mwImg: string, width?: number) {
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = decodeURIComponent(mwImg).replace(/ /g, "_");
  const _md5 = Md5.hashStr(mwImg);
  const extension = mwImg.split(".").pop();
  let url = `https://upload.wikimedia.org/wikipedia/commons${
    width ? "/thumb" : ""
  }`;
  url += `/${_md5.slice(0, 1)}/${_md5.slice(0, 2)}/${mwImg}`;
  if (width) {
    url += `/${width}px-${mwImg}`;
    url +=
      extension === "svg"
        ? ".png"
        : extension?.indexOf("tif") === 0
          ? ".jpg"
          : "";
  }
  return url;
}

function onclick(e: MouseEvent) {
  store.setQid(qid.value);
}
</script>

<style>
@import "../tailwind.css";
</style>
