<template>
  <div ref="root" id="image-grid">
    <div
      v-if="layout.length >= imageData.length"
      v-for="(img, idx) in imageData"
      class="pig-figure"
      :id="imageData.id"
      :style="layout[idx]"
    >
      <sl-tooltip
        :disabled="props.disableTooltips === 'true' ? '' : null"
        :content="imageData[idx].label || imageData[idx].file"
        hoist
        style="--sl-tooltip-arrow-size: 0"
        placement="bottom"
      >
        <img
          class="image"
          onload="this.style.opacity = 1"
          :src="imageData[idx].thumbnail"
          @click="imageSelected(idx)"
          @dragstart="onDragStart(idx, $event)"
          draggable
        />
      </sl-tooltip>

      <div class="caption">
        <div class="icons">
          <img
            v-if="imageData[idx].logo"
            class="provider-logo"
            :src="imageData[idx].logo"
            alt="Provider Logo"
          />
          <div class="license">
            <sl-tooltip
              :disabled="props.disableTooltips === 'true' ? '' : null"
              :content="`License: ${licenses[imageData[idx].license]?.label}`"
              hoist
              placement="top"
            >
              <a :href="imageData[idx].license" target="_blank">{{
                licenses[imageData[idx].license]?.shortcode ||
                imageData[idx].license
              }}</a>
            </sl-tooltip>
          </div>
          <sl-icon
            v-if="isLoggedIn"
            class="push"
            library="fa"
            :name="`${depictsEntity(imageData[idx]) ? 'fas' : 'far'}-thumbs-up`"
            @click="toggleDepicts(imageData[idx])"
          ></sl-icon>
          <sl-tooltip
            v-if="isLoggedIn"
            :disabled="props.disableTooltips === 'true' ? '' : null"
            content="Favorite"
            hoist
            placement="left"
          >
            <sl-icon
              library="fa"
              :name="`${imageData[idx].isFavorite ? 'fas' : 'far'}-star`"
              @click="toggleFavorite(imageData[idx])"
            ></sl-icon>
          </sl-tooltip>
        </div>
        <div class="size">
          <span v-if="imageData[idx].width"
            >{{ imageData[idx].width.toLocaleString() }} x
            {{ imageData[idx].height.toLocaleString() }}</span
          >
        </div>
      </div>
    </div>
  </div>

  <sl-dialog class="dialog" :style="{ '--width': dialogWidth }">
    <div>
      <ve-image-card :image="selectedImage"></ve-image-card>
    </div>
    <sl-button slot="footer" variant="primary" @click="selectedImage = null"
      >Close</sl-button
    >
  </sl-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";

import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";

import type { Image } from "../types";
import { licenses } from "../lib/licenses";

const emit = defineEmits(["item-selected", "get-next"]);

const store = useEntitiesStore();
const { isLoggedIn, qid } = storeToRefs(store);

const props = defineProps({
  total: { type: Number, default: 0 },
  items: { type: Array, default: () => [] },
  id: { type: String },
  active: { type: Boolean, default: true },
  disableTooltips: { type: String },
});

watch(props, () => {
  isActive.value = props.active;
  imageData.value = (props.items as Image[]) || [];
});

const root = ref<HTMLElement | null>(null);
const shadowRoot = computed(() => root?.value?.parentNode);

const isActive = ref(props.active);

const selectedImage = ref<Image | null>(null);
watch(selectedImage, () => {
  showDialog.value = selectedImage.value !== null;
});

let doLayoutDebounceTimer: any;

const width = ref(0);
watch(width, () => {
  clearTimeout(doLayoutDebounceTimer);
  if (width.value) doLayoutDebounceTimer = setTimeout(doLayout, 100);
});

let dialog: any;
const dialogWidth = ref("80vw");
const showDialog = ref(false);
watch(showDialog, () => {
  dialog.open = showDialog.value;
});

const imageData = <any>ref(props.items);
watch(imageData, async (current, prior) => {
  // console.log(`ImageGrid.imageData: size=${current.length}`)
  let added = imageData.value.slice(prior?.length || 0, imageData.value.length);
  await checkImagesSizes(added);
  doLayout();
});

function doLayout() {
  // console.log(`doLayout: width=${width.value} images=${imageData.value.length}`)
  if (imageData.value.length === 0) return [];

  let numImages = imageData.value.length;
  const minAspectRatio =
    width.value <= 640
      ? 2
      : width.value <= 1280
        ? 4
        : width.value <= 1920
          ? 5
          : 6;

  let _layout: any[] = [];

  let spaceBetweenImages = 10;

  let row: any[] = [];
  let translateX = 0;
  let translateY = 0;
  let rowAspectRatio = 0;

  // Loop through all our images, building them up into rows and computing
  // the working rowAspectRatio.
  imageData.value.forEach((image, index) => {
    rowAspectRatio += image.aspect_ratio;
    row.push(image);

    if (rowAspectRatio >= minAspectRatio || index + 1 === numImages) {
      rowAspectRatio = Math.max(rowAspectRatio, minAspectRatio);

      // Compute this row's height.
      const totalDesiredWidthOfImages =
        width.value - spaceBetweenImages * (row.length - 1);
      const rowHeight = totalDesiredWidthOfImages / rowAspectRatio;

      row.forEach((img) => {
        const imageWidth: number = rowHeight * img.aspect_ratio;
        _layout.push({
          width: `${Math.round(imageWidth)}px`,
          height: `${Math.round(rowHeight + 50)}px`,
          transform: `translate3d(${Math.round(translateX)}px, ${Math.round(
            translateY,
          )}px, 0)`,
        });
        translateX += imageWidth + spaceBetweenImages;
      });

      // Reset our state variables for next row.
      row = [];
      rowAspectRatio = 0;
      translateY += rowHeight + spaceBetweenImages + 50;
      translateX = 0;
    }
  });

  if (root.value)
    root.value.style.height = `${translateY - spaceBetweenImages}px`;
  layout.value = _layout;
}

const layout = ref<any[]>([]);
// watch(layout, () => { console.log(toRaw(layout.value)) })

function imageSelected(index: number) {
  selectedImage.value = imageData.value[index] as Image;
  emit("item-selected", selectedImage.value);
}

function onDragStart(index:number, event: DragEvent) {
  event.dataTransfer?.setData('text/plain', imageData.value[index].id)
}

onMounted(() => {
  dialog = shadowRoot.value?.querySelector(".dialog");
  dialog.addEventListener(
    "sl-hide",
    (evt: CustomEvent) => (showDialog.value = false),
  );

  let priorScrollY = 0;
  let checkGetMore = () => {
    if (isActive.value) {
      let scrollDirection = window.scrollY > priorScrollY ? "down" : "up";
      priorScrollY = window.scrollY;
      if (
        scrollDirection === "down" &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 2000
      )
        emit("get-next");
    }
  };

  let debouncedScrollHandler = (func, timeout) => {
    let timer: any;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, timeout);
    };
  };

  window.addEventListener("scroll", debouncedScrollHandler(checkGetMore, 100));
});

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

async function checkImagesSizes(images: Image[]) {
  let promises = images
    .filter((image: any) => !image.width)
    .map((image: any) => getImageSize(image));

  if (promises.length) {
    let results = await Promise.all(promises);
    results.forEach((result: any) => {
      let found: any = images.find((item: any) => result.id === item.id);
      found.width = result.width;
      found.height = result.height;
      found.aspect_ratio = result.aspect_ratio;
      found.format = result.format;
    });
  }
}

async function getImageSize(
  image: any,
  minWidth = 200,
): Promise<{ image: any; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.onload = () => {
      let width = img.width < minWidth ? minWidth : img.width;
      let height =
        img.width < minWidth ? (img.height * minWidth) / img.width : img.height;
      let aspect_ratio = Number((width / height).toFixed(4));
      resolve({ ...image, aspect_ratio, format: "image/jpeg" });
    };
    img.onerror = () => reject();
    img.src = image.thumbnail;
  });
}

function toggleFavorite(image: Image) {
  image.isFavorite = !image.isFavorite;
}

function depictsEntity(image: Image) {
  return qid.value && image.depicts && image.depicts[qid.value] !== undefined;
}

function toggleDepicts(image: Image) {
  if (qid.value) {
    // if (image.depicts[qid.value]) delete image.depicts[qid.value]
    // else image.depicts[qid.value] = {id: qid.value}
  }
}
</script>

<style>
* {
  box-sizing: border-box;
}

#image-grid {
  position: relative;
  margin: 2rem;
}

.pig-figure {
  position: absolute;
  display: flex;
  flex-direction: column;
  /* overflow: hidden; */
  width: 100px;
  box-shadow: 2px 2px 4px 0 #ccc;
}

.pig-figure:hover {
  box-shadow:
    rgba(50, 50, 93, 0.25) 0px 6px 12px -2px,
    rgba(0, 0, 0, 0.3) 0px 3px 7px -3px;
}

.image {
  left: 0;
  top: 0;
  width: 100%;
  opacity: 0;
  background-color: #d5d5d5;
}

.image:hover {
  cursor: pointer;
}

.caption {
  height: 100%;
  width: 100%;
  z-index: 1;
  padding: 6px 3px 3px 3px;
}

.icons {
  display: flex;
  align-items: center;
  gap: 6px;
}

.size {
  width: 100%;
  font-size: 0.8em;
  margin-top: 3px;
}

.provider-logo {
  height: 20px;
}

.license {
  cursor: pointer;
  display: inline-block;
}

.image-card {
  font-size: 0.85em;
  display: flex;
  flex-direction: column;
}

.title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9em;
}

.title img {
  width: 16px;
  opacity: 1;
}

.clamp {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  /* margin-bottom: 6px; */
}

.text {
  margin: 6px 0;
  height: 50px;
}

.text p {
  margin: 0;
  padding: 0;
}

.license {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 0.8em;
  margin-left: 0.5rem;
}

a.license {
  color: black;
  text-decoration: none;
  font-size: 0.9rem;
}

sl-icon {
  font-size: 1.2rem;
}

.push {
  margin-left: auto;
}
</style>
