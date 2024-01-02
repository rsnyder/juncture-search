<template>
  <div ref="root" id="main">
    <sl-button @click="showDialog = !showDialog">
      <sl-icon
        v-if="props.buttonIcon"
        slot="prefix"
        :name="props.buttonIcon"
        style="font-size: 20px"
      ></sl-icon>
      {{ props.buttonLabel }}
    </sl-button>

    <sl-dialog :label="label" class="dialog" :style="{ '--width': width }">
      <div v-if="metadata" class="metadata"></div>
      <sl-button slot="footer" variant="primary" @click="showDialog = false"
        >Close</sl-button
      >
    </sl-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, toRaw, watch } from "vue";

import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/icon/icon.js";

const props = defineProps({
  doi: { type: String },
  token: { type: String },
  label: { type: String },
  buttonLabel: { type: String, default: "Show me" },
  buttonIcon: { type: String },
  width: { type: String },
});

const root = ref<HTMLElement | null>(null);
const shadowRoot = computed(() => root?.value?.parentNode);
const content = computed(
  () => shadowRoot.value?.querySelector("#main") as HTMLElement,
);

const width = ref("80vw");
const showDialog = ref(false);
watch(showDialog, () => {
  dialog.open = showDialog.value;
  if (!metadata.value) getMetadata();
});

let dialog: any;

const metadata = ref<any>();
watch(metadata, () => {
  if (!metadata.value) showDialog.value = false;
});

watch(props, () => {
  metadata.value = null;
  getMetadata();
});

watch(content, () => {
  dialog = shadowRoot.value?.querySelector(".dialog");
  dialog.addEventListener("sl-hide", (evt: CustomEvent) => {
    if (evt.target === dialog) showDialog.value = false;
  });
});

function getMetadata() {
  let url = `https://bgsnochsrl.execute-api.us-east-1.amazonaws.com/prod/metadata/${props.doi}`;
  fetch(url)
    .then((resp) => resp.json())
    .then((data) => (metadata.value = data));
}
</script>

<style>
* {
  box-sizing: border-box;
}

:host {
  display: inline-block;
}

sl-dialog::part(body) {
  padding-top: 0;
}

sl-dialog::part(panel) {
  max-width: unset;
}

.metadata {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem;
}

.label {
  font-weight: bold;
  margin-right: 0.5rem;
}
.label:after {
  content: ": ";
}
</style>
