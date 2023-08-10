<template>

  <div ref="root">
    <sl-tab-group>
      <sl-tab slot="nav" panel="data" :active="activeGroup === 'data' ? '' : null">Data</sl-tab>
      <sl-tab slot="nav" panel="images" :active="activeGroup === 'images' ? '' : null">Images</sl-tab>
      <sl-tab slot="nav" panel="documents" :active="activeGroup === 'documents' ? '' : null">Documents</sl-tab>
      <sl-tab slot="nav" panel="related" :active="activeGroup === 'related' ? '' : null">Related Entities</sl-tab>

      <sl-tab-panel name="data">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="wd-statements" :active="activeViewer === 'wd-statements' ? '' : null">Entity Properties</sl-tab>
          <sl-tab slot="nav" panel="wd-referencing" :active="activeViewer === 'wd-referencing' ? '' : null">Referencing Entities</sl-tab>
          <sl-tab slot="nav" panel="wd-sites" :active="activeViewer === 'wd-sites' ? '' : null">Site Links</sl-tab>
          <sl-tab-panel name="wd-statements">
            <ve-statements></ve-statements>
          </sl-tab-panel>
          <sl-tab-panel name="wd-referencing">
            <ve-referencing id="wd-referencing"></ve-referencing>
          </sl-tab-panel>
          <sl-tab-panel name="wd-sites">
            <ve-sites id="wd-sites"></ve-sites>
          </sl-tab-panel>
        </sl-tab-group>
      </sl-tab-panel>

      <sl-tab-panel name="images">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="images" :active="activeViewer === 'images' ? '' : null">Images</sl-tab>
          <sl-tab slot="nav" panel="tagged" :active="activeViewer === 'tagged' ? '' : null">Tagged</sl-tab>
          <sl-tab slot="nav" panel="bhl" :active="activeViewer === 'bhl' ? '' : null">Biodiversity Heritage Library</sl-tab>
          <sl-tab slot="nav" panel="flickr" :active="activeViewer === 'ov' ? '' : null">Flickr</sl-tab>
          <sl-tab slot="nav" panel="ov" :active="activeViewer === 'ov' ? '' : null">Openverse</sl-tab>
          <sl-tab slot="nav" panel="jstor-cc" :active="activeViewer === 'jstor-cc' ? '' : null">JSTOR</sl-tab>
          <sl-tab slot="nav" panel="wc" :active="activeViewer === 'wc' ? '' : null">Wikimedia Commons</sl-tab>
          <sl-tab slot="nav" panel="wd" :active="activeViewer === 'wd' ? '' : null">Wikidata</sl-tab>
          <sl-tab slot="nav" panel="cc" :active="activeViewer === 'cc' ? '' : null">Commons Categories</sl-tab>
          <sl-tab-panel name="images">
            <ve-images label="Aggregated Images" id="images"></ve-images>
          </sl-tab-panel>
          <sl-tab-panel name="tagged">
            <ve-tagged label="Tagged Images" id="tagged"></ve-tagged>
          </sl-tab-panel>
          <sl-tab-panel name="bhl">
            <ve-bhl label="Biodiversity Heritage Library" id="bhl"></ve-bhl>
          </sl-tab-panel>
          <sl-tab-panel name="flickr">
            <ve-flickr label="Flickr" id="flickr"></ve-flickr>
          </sl-tab-panel>
          <sl-tab-panel name="ov">
            <ve-openverse label="Openverse" id="ov"></ve-openverse>
          </sl-tab-panel>
          <sl-tab-panel name="jstor-cc">
            <ve-jstor-cc label="JSTOR Community Collections" id="jstor-cc"></ve-jstor-cc>
          </sl-tab-panel>
          <sl-tab-panel name="wc">
            <ve-wikimedia-commons label="Wikimedia Commons" id="wc"></ve-wikimedia-commons>
          </sl-tab-panel>
          <sl-tab-panel name="wd">
            <ve-wikidata-images label="Wikidata" id="wd"></ve-wikidata-images>
          </sl-tab-panel>
          <sl-tab-panel name="cc">
            <ve-commons-categories label="Commons Categories" id="cc"></ve-commons-categories>
          </sl-tab-panel>
        </sl-tab-group>
      </sl-tab-panel>

      <sl-tab-panel name="documents">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="jstor-docs" :active="activeViewer === 'jstor-docs' ? '' : null">JSTOR</sl-tab>
          <sl-tab slot="nav" panel="wd-docs" :active="activeViewer === 'wd-docs' ? '' : null">Wikidata</sl-tab>
          <sl-tab slot="nav" panel="ia" :active="activeViewer === 'ia' ? '' : null">Internet Archive</sl-tab>
          <sl-tab-panel name="jstor-docs">
            <ve-template label="JSTOR" id="jstor-docs"></ve-template>
          </sl-tab-panel>
          <sl-tab-panel name="wd-docs">
            <ve-wikidata-scholarly-articles label="Wikidata" id="wd-docs"></ve-wikidata-scholarly-articles>
          </sl-tab-panel>
          <sl-tab-panel name="ia">
            <ve-template label="Internet Archive" id="ia"></ve-template>
          </sl-tab-panel>
        </sl-tab-group>
      </sl-tab-panel>

      <sl-tab-panel name="related">
        <sl-tab-group placement="start">
          <sl-tab slot="nav" panel="related-all" :active="activeViewer === 'related-all' ? '' : null">All</sl-tab>
          <sl-tab slot="nav" panel="related-people" :active="activeViewer === 'related-people' ? '' : null">People</sl-tab>
          <sl-tab slot="nav" panel="related-places" :active="activeViewer === 'related-places' ? '' : null">Places</sl-tab>
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

  // watch(active, () => console.log(toRaw(active.value)))
  const activeGroup = computed(() => active.value.split('/')[0])
  const activeViewer = computed(() => active.value.split('/')[1])

  const group = ref()
  const viewer = ref()
  watch(group, () => { if (group.value && viewer.value) store.setActive(`${group.value}/${viewer.value}`) })
  watch(viewer, () => { if (group.value && viewer.value) store.setActive(`${group.value}/${viewer.value}`) })

  function init(root: HTMLElement) {
    observer = new MutationObserver((mutationsList) => {
      mutationsList
        .filter(rec => rec.attributeName === 'active' && rec.target.nodeName === 'SL-TAB-PANEL')
        .map(rec => rec.target as HTMLElement)
        .filter(el => el.getAttribute('active') !== null)
        .forEach(el => {
          if (el.parentElement?.parentElement?.nodeName === 'SL-TAB-PANEL') {
            viewer.value = el.getAttribute('name')
          } else {
            viewer.value = undefined
            group.value = el.getAttribute('name')
            let found = Array.from(el.children[0].children).find((c:any) => c.active && c.nodeName === 'SL-TAB-PANEL')
            if (found) viewer.value = found.getAttribute('name') || undefined
            // else viewer.value = defaults[group.value]
          }
        })
    })
    observer.observe(root, { attributes: true, childList: true, subtree: true })
  }

</script>

<style>

</style>