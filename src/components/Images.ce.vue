<template>
  <div ref="root">
    <!--
    <div v-if="fetching" class="flex w-full items-center justify-center space-x-4 m-4">
      <div class="animate-spin inline-block w-8 h-8 border-[3px] border-current border-t-transparent text-blue-600 rounded-full" role="status" aria-label="loading">
        <span class="sr-only">Loading...</span>
      </div>
      <span class="text-xl font-medium">Finding images...</span>
    </div>
    -->
    <ve-drawer
      class="w-full"
      :options="options"
      @options-updated="optionsUpdated"
    >
      <ve-image-grid
        :id="id"
        :active="isActive"
        :total="images?.length || 0"
        :items="images"
        :disable-tooltips="true"
        @get-next="getNext"
        @item-selected="itemSelected"
      ></ve-image-grid>
    </ve-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
import type { Image } from "../types";

import { Wikidata } from "../lib/image-providers/Wikidata";
import { WikimediaCommons } from "../lib/image-providers/Commons";
import { CommonsCategoryImages } from "../lib/image-providers/CommonsCategories";
import { JSTOR } from "../lib/image-providers/JSTOR";
import { Openverse } from "../lib/image-providers/Openverse";
import { Flickr } from "../lib/image-providers/Flickr";
import { BHL } from "../lib/image-providers/BHL";

const store = useEntitiesStore();
const { active, imagesMap, labels, qid } = storeToRefs(store);

const props = defineProps({
  label: { type: String },
  id: { type: String, default: "images" },
});

const root = ref<HTMLElement | null>(null);
const isActive = computed(() => active.value.split("/").pop() === props.id);

const refreshQarg = new URL(location.href).searchParams.get("refresh");
const refresh =
  refreshQarg !== null &&
  ["true", "1", "yes", ""].includes(refreshQarg.toLowerCase());

const entity = ref<any>();

watch(entity, () => {
  if (!entity.value) return;
  images.value = [];
  initProviders();
});

const options = ref<any>({});
watch(options, () => {
  console.log("options", toRaw(options.value));
  // providers.value.forEach(p => p.instance.reset())
  //images.value = []
  //getNext()
});

function optionsUpdated(e: any) {
  options.value = e.detail[0];
  console.log("optionsUpdated", options.value);
  depictsFilter.value = options.value.depicts?.selected || [];
}

let imageProviders = [
  { class: Wikidata, tag: "Wikimedia Commons", enabled: true },
  { class: WikimediaCommons, tag: "Wikimedia Commons", enabled: true },
  { class: CommonsCategoryImages, tag: "Wikimedia Commons", enabled: true },
  { class: JSTOR, tag: "JSTOR", enabled: true },
  { class: BHL, tag: "BHL", enabled: true },
  { class: Flickr, tag: "Flickr", enabled: true },
  { class: Openverse, tag: "Openverse", enabled: true },
];

const providers = ref<any[]>([]);
watch(providers, () => {
  if (isActive.value) getNext();
});

const depictsFilter = ref<string[]>([]);
watch(depictsFilter, () => {
  console.log("depictsFilter", depictsFilter.value);
  // depicts.value = {}
  images.value = [];
  providers.value.forEach((p) => p.instance.reset());
  getNext();
});

function setOptions() {
  options.value = {
    providers: Array.from(
      imageProviders
        .filter((p) => p.enabled)
        .reduce((acc, p) => {
          if (p.enabled) acc.add(p.tag);
          return acc;
        }, new Set()),
    ).map((tag) => ({
      label: tag,
      enabled: true,
      logo: imageProviders.find((p) => p.tag === tag)?.class.logo,
    })),
  };
}

function initProviders(limit = -1) {
  providers.value = imageProviders
    .filter((p) => p.enabled)
    .map((p) => ({
      instance: new p.class(entity.value, refresh, limit),
      tag: p.tag,
    }));
}

watch(isActive, async () => {
  // console.log(`Images.isActive=${isActive.value} qid=${qid.value}`)
  if (isActive.value) {
    if (qid.value !== entity.value?.id) {
      images.value = [];
      entity.value = await store.fetch(qid.value);
    } else if (!images.value.length) {
      getNext();
    }
  }
});

watch(qid, async () => {
  console.log(`Images.watch.qid: isActive=${isActive.value} qid=${qid.value}`);
  images.value = [];
  if (isActive.value) entity.value = await store.fetch(qid.value);
});

onMounted(async () => {
  setOptions();
  entity.value = await store.fetch(qid.value);
});

const depictsProcessed = new Set();
function getDepicts(provider: any) {
  if (depictsProcessed.has(provider.id)) return;
  // provider.getDepicts(depictsFilter.value).then((depicted: any) => {
  provider.getDepicts([]).then((depicted: any) => {
    console.log("getDepicts", provider.id, Object.keys(depicted).length);
    let updated = { ...depicts.value };
    let qids = Object.keys(depicted);
    if (qids.length === 0) return;
    for (let qid of qids) {
      if (updated[qid]) updated[qid] += depicted[qid];
      else updated[qid] = depicted[qid];
    }
    depicts.value = updated;
  });
  depictsProcessed.add(provider.id);
}

let initial = true;
const fetching = ref<boolean>(false);

async function getNext() {
  let isEnabled = (tag: string) =>
    options.value.providers.find((p: any) => p.label === tag)?.enabled;
  if (fetching.value) return;
  fetching.value = true;
  let toAdd = 0;
  for (let provider of providers.value) {
    // console.log(`getNext ${provider.instance.id} enabled=${isEnabled(provider.tag)} hasMore=${provider.instance.hasMore()} filter=${depictsFilter.value.length}`)
    if (isEnabled(provider.tag)) {
      while (provider.instance.hasMore() && toAdd < 50) {
        let providerImages = await provider.instance.next();
        if (depictsFilter.value.length > 0) {
          let filter = new Set(depictsFilter.value);
          providerImages = providerImages.filter((i: Image) => {
            let matches = (i.depicts || []).filter((d: any) =>
              filter.has(d.id),
            );
            // console.log('filter', i.id, matches.length)
            return matches.length > 0;
          });
        }
        // console.log('getNext', provider.instance.id, provider.instance.hasMore())
        if (initial) getDepicts(provider.instance);
        console.log(
          `${provider.instance.id}: filter=${depictsFilter.value} selected=${providerImages.length}`,
        );
        if (providerImages.length === 0) break;
        images.value = [...images.value, ...providerImages];
        toAdd += providerImages.length;
      }
      if (initial) getDepicts(provider.instance);
      if (toAdd >= 50 && !initial) break;
    }
  }
  //initial = false
  fetching.value = false;
}

const images = ref<Image[]>([]);
watch(images, () => {
  store.$state.imagesMap = {
    ...imagesMap.value,
    ...Object.fromEntries(images.value.map((i: Image) => [i.id, i])),
  };
  // if (images.value.length === 0) depicts.value = {}
});

const depicts = ref<any>({});
watch(depicts, async () => {
  if (Object.keys(depicts.value).length > 0)
    console.log("depicts", toRaw(depicts.value));
  await store.updateLabels(Object.keys(depicts.value));
  let copy = { ...options.value };
  copy.depicts = { entities: depicts.value, selected: [] };
  options.value = copy;
});

function itemSelected(e: any) {
  let selectedImage = e.detail[0];
  let provider = providers.value.find(
    (p) => p.instance.id === selectedImage.api,
  ).instance;
  provider.imageSelected(selectedImage).then((qids) => {
    if (qids?.length > 0) store.updateLabels(qids);
  });
}
</script>

<style>
@import "../tailwind.css";

.title {
  font-size: 1.5em;
  font-weight: bold;
}
.count {
  font-size: 1.2;
  color: #666;
  padding-left: 0.5em;
}
</style>
