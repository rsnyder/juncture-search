<template>
  <div
    ref="root"
    class="card-stack"
    :style="{
      width: `${size}px`,
      height: `${size + 50}px`,
    }"
    @click="onClick"
  >
    <div
      v-for="(e, idx) in entityData"
      :key="e.qid"
      :style="{
        backgroundImage: `url(${e.thumbnail})`,
        width: `${size}px`,
        height: `${size}px`,
        zIndex: entityData.length - idx,
      }"
    ></div>
    <p v-html="label"></p>
  </div>

  <ve-modal-twp :title="label">
    <ve-entity-grid v-if="entityData.length">
      <ul>
        <li v-for="e in entityData" :key="e.qid" v-html="e.qid"></li>
      </ul>
    </ve-entity-grid>
  </ve-modal-twp>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
import { Md5 } from "ts-md5";

const store = useEntitiesStore();
const {} = storeToRefs(store);

const props = defineProps({
  label: { type: String, default: "" },
});

const root = ref<HTMLElement | null>(null);
const shadowRoot = computed(() => root?.value?.parentNode);
const host = computed(() => (root.value?.getRootNode() as any)?.host);

const size = ref(0);

watch(host, () => {
  getEntityIds();
});

let doLayoutDebounceTimer: any;
const width = ref(0);
watch(width, () => {
  clearTimeout(doLayoutDebounceTimer);
  if (width.value) doLayoutDebounceTimer = setTimeout(doLayout, 100);
});

const qids = ref<string[]>([]);
watch(qids, async () => (entityData.value = await getEntityData()));

const entityData = ref<any[]>([]);
watch(entityData, async () => {
  let aspectRatios = Object.fromEntries(
    await Promise.all(
      entityData.value.map((e: any) => getImageSize(e.thumbnail)),
    ),
  );
  entityData.value.forEach(
    (item: any) => (item.aspect_ratio = aspectRatios[item.thumbnail]),
  );
  doLayout();
});

async function getImageSize(src: string): Promise<[string, number]> {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () =>
      resolve([src, Number((img.width / img.height).toFixed(4))]);
    img.onerror = () => reject();
    img.src = src;
  });
}
function getEntityIds() {
  let slot = host.value;
  function parseSlot() {
    qids.value = Array.from(slot.querySelectorAll("li")).map(
      (li: any) => li.innerText,
    );
  }
  parseSlot();
  new MutationObserver((mutationsList: any) => {
    for (let mutation of mutationsList) {
      if (mutation.type === "childList") parseSlot();
    }
  }).observe(slot, { childList: true, subtree: true });
}

function doLayout() {
  size.value =
    width.value <= 640
      ? 125
      : width.value <= 1280
        ? 150
        : width.value <= 1920
          ? 150
          : 125;
  // console.log(`doLayout: width=${width.value} size=${size.value}`)
}

watch(root, () => {
  if (root.value) {
    width.value = root.value?.clientWidth || 0;
    const resizeObserver = new ResizeObserver(() => {
      if (root.value?.clientWidth && root.value?.clientWidth !== width.value)
        width.value = root.value?.clientWidth;
    });
    resizeObserver.observe(root.value);
  }
});

watch(host, () => {
  if (host.value) {
    const resizeObserver = new ResizeObserver(() => {
      width.value = host.value.parentElement.clientWidth;
    });
    resizeObserver.observe(host.value.parentElement);
  }
});

function onClick() {
  console.log("onClick");
  // showDialog.value = true
  let modal = shadowRoot.value?.querySelector("ve-modal-twp");
  let isOpen = modal?.getAttribute("open") !== null;
  if (isOpen) modal?.removeAttribute("open");
  else modal?.setAttribute("open", "");
}

async function getEntityData() {
  let entityIds = qids.value.map((q) => `wd:${q}`).join(") (");
  let query = `SELECT ?entity ?label ?description ?image WHERE {
      VALUES (?entity) { (${entityIds}) }
      ?entity rdfs:label ?label ; schema:description ?description .
      OPTIONAL { ?entity wdt:P18 ?image . }
      FILTER (LANG(?label) = "en")
      FILTER(LANG(?description) = 'en')
    }`;
  return fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/sparql-results+json",
      },
    },
  )
    .then((resp) => resp.json())
    .then((data) => {
      let parsed: any = {};
      data.results.bindings.forEach((b: any) => {
        let qid = b.entity.value.split("/").pop();
        if (parsed[qid]) parsed[qid].images.push(b.image?.value);
        else
          parsed[qid] = {
            qid,
            label: b.label.value,
            description: b.description?.value,
            images: [b.image?.value],
          };
      });
      return qids.value
        .map((qid) => parsed[qid])
        .filter((item: any) => item)
        .map((item: any) => {
          item.thumbnail = mwImage(item.images[0], 500);
          return item;
        });
    });
}

function mwImage(mwImg: string, width?: number) {
  // Converts Wikimedia commons image URL to a thumbnail link
  mwImg = mwImg.split("Special:FilePath/").pop() || mwImg;
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
</script>

<style>
@import "../tailwind.css";

.card-stack {
  position: relative;
}

.card-stack > p {
  position: absolute;
  width: 100%;
  bottom: 0;
  left: 0;
  text-align: center;
  font-weight: bold;
  z-index: 10;
}
.card-stack div {
  position: absolute;
  top: 0;
  left: 0;
  border: 1px solid #777;
  box-shadow: 0 1px 3px -2px rgba(0, 0, 0, 0.5);
  transition: all 0.3s ease-out;
}
.card-stack div:nth-child(1) {
  background-size: cover;
  z-index: 10;
}
.card-stack div:nth-child(2) {
  transform: rotate3d(0, 0, 1, 7deg);
  z-index: 9;
}
.card-stack div:nth-child(3) {
  transform: rotate3d(0, 0, 1, -7deg);
  z-index: 8;
}
.card-stack div:nth-child(4) {
  transform: rotate3d(0, 0, 1, 0deg);
  z-index: 7;
}

.card-stack:hover div:nth-child(1) {
  transform: scale(1.02);
}
.card-stack:hover div:nth-child(2) {
  transform: translate3d(10%, 0, 0) rotate3d(0, 0, 1, 3deg);
}
.card-stack:hover div:nth-child(3) {
  transform: translate3d(-10%, 0, 0) rotate3d(0, 0, 1, -3deg);
}
.card-stack:hover div:nth-child(4) {
  transform: translate3d(2%, -5%, 0) rotate3d(0, 0, 1, 2deg);
}
.card-stack:hover div:nth-child(5) {
  transform: translate3d(-5%, -2%, 0) rotate3d(0, 0, 1, 2deg);
}
</style>
