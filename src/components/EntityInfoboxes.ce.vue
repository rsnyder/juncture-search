<template>
  <div class="entity-infoboxes">
    <div ref="root"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import tippy from "tippy.js";

const root = ref<HTMLElement | null>(null);
const host = computed(() => (root.value?.getRootNode() as any)?.host);

const infoboxTargets = <any>ref();

let instances: any[] = [];

let observer: MutationObserver;

watch(host, () => {
  init(host.value.parentNode);
});

watch(infoboxTargets, () => {
  // console.log(`infoboxTargets=${Object.keys(infoboxTargets.value).length}`)
  initTippy(Object.values(infoboxTargets.value));
});

function init(root: HTMLElement) {
  observer = new MutationObserver((mutationsList) => {
    let addedNodeMutations = mutationsList.filter(
      (m) => m.addedNodes.length > 0,
    );
    for (let i = 0; i < addedNodeMutations.length; i++) {
      let addedNodes = Array.from(addedNodeMutations[i].addedNodes);
      if (
        addedNodes
          .map((node) =>
            (<HTMLElement>node).nodeType === 1 ? node : node.parentNode,
          )
          .filter((node) => (<HTMLElement>node).nodeType === 1)
          .find((el) => (<HTMLElement>el).querySelector("[data-qid]"))
      ) {
        findTargets(root);
        break;
      }
    }
  });
  // findTargets(root)
  observer.observe(root, { attributes: true, childList: true, subtree: true });
}

function findTargets(root: HTMLElement) {
  nextTick(() => {
    infoboxTargets.value = Object.fromEntries(
      Array.from(root.querySelectorAll("[data-qid]")).map((el) => [
        (el as HTMLElement).dataset.qid,
        el,
      ]),
    );
  });
}

function initTippy(targets: any[]) {
  // console.log(`initTippy: targets=${targets.length}`)
  nextTick(() => {
    if (instances.length > 0) {
      instances.forEach((instance) => instance.destroy());
      instances = [];
    }
    instances = tippy(targets, {
      allowHTML: true,
      interactive: true,
      delay: [100, null],
      placement: "auto",
      theme: "light-border",
      touch: "hold",
      onShow: (instance) => {
        let eid = <string>(<HTMLElement>instance.reference).dataset.qid;
        instance.setContent(`<ve-entity-card eid="${eid}"></ve-entity-card>`);
      },
      onHide: () => {},
    });
  });
}
</script>

<style scoped></style>
