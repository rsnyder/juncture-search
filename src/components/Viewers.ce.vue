<template>

  <div ref="root">
    <sl-tab-group name="root">
      <sl-tab slot="nav" panel="data" :active="active.indexOf('data') === 0">Data</sl-tab>
      <sl-tab slot="nav" panel="images" :active="active === 'images'">Images</sl-tab>
      <sl-tab slot="nav" panel="documents" :active="active === 'documents'">Documents</sl-tab>
      <sl-tab slot="nav" panel="sites" :active="active === 'sites'">Resource Web Sites</sl-tab>
      <sl-tab slot="nav" panel="related" :active="active === 'related'">Related Entities</sl-tab>

      <sl-tab-panel name="data">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="data-statements" :active="active === 'data-statements'">Entity Properties</sl-tab>
          <sl-tab slot="nav" panel="data-referencing" :active="active === 'data-referencing'">Referencing Entities</sl-tab>
          <sl-tab-panel name="data-statements">
            <ve-statements></ve-statements>
          </sl-tab-panel>
          <sl-tab-panel name="data-referencing">
            <ve-referencing id="data-referencing"></ve-referencing>
          </sl-tab-panel>
        </sl-tab-group>
      </sl-tab-panel>

      <sl-tab-panel name="images" viewer="images">
        <ve-images label="Images" id="images"></ve-images>
      </sl-tab-panel>

      <sl-tab-panel name="documents">
        <ve-articles label="articles" id="documents"></ve-articles>
      </sl-tab-panel>

      <sl-tab-panel name="sites">
        <ve-sites id="sites"></ve-sites>
      </sl-tab-panel>

      <sl-tab-panel name="related">
        <ve-mentioned-entities id="related"></ve-mentioned-entities>
      </sl-tab-panel>

      <!--
      <sl-tab-panel name="related">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="related-all" :active="active === 'related-all'">All</sl-tab>
          <sl-tab slot="nav" panel="related-people" :active="active === 'related-people'">People</sl-tab>
          <sl-tab slot="nav" panel="related-places" :active="active === 'related-places'">Places</sl-tab>
          <sl-tab-panel name="related-all">
            <ve-template label="Related Entities - All" id="related-all"></ve-template>
          </sl-tab-panel>
          <sl-tab-panel name="related-people">
            <ve-template label="Related Entities - People" id="related-people"></ve-template>
          </sl-tab-panel>
          <sl-tab-panel name="related-places">
            <ve-template label="Related Entities - Places" id="related-places"></ve-template>
          </sl-tab-panel>
        </sl-tab-group>
      </sl-tab-panel>
      -->

    </sl-tab-group>
  </div>

</template>

<script setup lang="ts">

  import '@shoelace-style/shoelace/dist/components/tab/tab.js'
  import '@shoelace-style/shoelace/dist/components/tab-group/tab-group.js'
  import '@shoelace-style/shoelace/dist/components/tab-panel/tab-panel.js'

  import { computed, ref, toRaw, watch } from 'vue'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { active } = storeToRefs(store)

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  let observer: any

  watch(shadowRoot, () => {
    let tabs = shadowRoot.value?.querySelector('sl-tab-group')
    if (tabs) init(tabs)
  })

  function init(root: HTMLElement) {
    observer = new MutationObserver((mutationsList) => {
      mutationsList
        .filter(rec => rec.attributeName === 'active')
        .map(rec => rec.target as HTMLElement)
        .filter(el => el.getAttribute('active') !== null)
        .forEach(el => {
          if (el?.nodeName === 'SL-TAB') store.setActive(el.getAttribute('panel') || 'images')
        })
    })
    observer.observe(root, { attributes: true, childList: true, subtree: true })
  }

</script>

<style>
</style>