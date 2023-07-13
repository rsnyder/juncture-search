<template>

<div ref="root">
    <h1 v-html="props.label"></h1>
    <div class="cards">
      <div v-for="img in images" :key="img.id" @click="onclick(img.id)">
        <img :src="img.thumb" :alt="img.title"/>
      </div>
    </div>
  </div>

  <sl-dialog :label="label" class="dialog" :style="{'--width':dialogWidth}">
    <div v-if="metadata" class="metadata">
      <ve-statements :eid="metadata.id"></ve-statements>
    </div>
    <sl-button slot="footer" variant="primary" @click="showDialog = false">Close</sl-button>
  </sl-dialog>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/dialog/dialog.js'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'

  import * as jsonld from 'jsonld'

  const root = ref<HTMLElement | null>(null)
  const shadowRoot = computed(() => root?.value?.parentNode)

  const store = useEntitiesStore()
  const { active, qid, language } = storeToRefs(store)

  const props = defineProps({
    label: { type: String, default: 'Template' },
    id: { type: String, default: 'template' },
  })

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => {
    console.log(`wd.watch.isActive: isActive=${isActive.value} qid=${qid.value} images=${ids.value?.length || 0}`)
    if (isActive.value && !ids.value) getDepictIds()
  })

  watch(qid, () => {
    ids.value = null
    console.log(`wd.watch.qid: qid=${qid.value} isActive=${isActive.value} images=0`)
    if (isActive.value) getDepictIds()
  })

  onMounted(() => { 
    console.log(`wd.mounted: qid=${qid.value} isActive=${isActive.value} images=${ids.value?.length || 0}`)
    dialog = shadowRoot.value?.querySelector('.dialog')
    dialog.addEventListener('sl-hide', (evt:CustomEvent) => {
      if (evt.target === dialog) metadata.value = undefined
    })
    if (isActive.value) getDepictIds() 
  })

  let dialog: any
  const dialogWidth = ref('80vw')
  const showDialog = ref(false)
  watch(showDialog, () => { dialog.open = showDialog.value })
  
  const start = ref(0)
  const limit = ref(12)
  
  const ids = ref<string[] | null>()
  watch(ids, async () => { 
    console.log(`wd.watch.ids: qid=${qid.value} isActive=${isActive.value} ids=${ids.value?.length || 0}`)
    // if (images.value) console.log(toRaw(images.value))
    if (ids.value) images.value = await getDepictItems(ids.value.slice(start.value, start.value + limit.value))
  })

  const entities = ref<any[]>([])
  watch(entities, () => {
    const langVals = new Set(['labels', 'descriptions', 'aliases'])
    entities.value.forEach(ent => {
      Object.keys(ent).forEach(key => {
        if (langVals.has(key)) {
          ent[key] = Object.fromEntries(ent[key].map((val: any) => [val.language, val['@value']]))
        }
      })
    })
    console.log(toRaw(entities.value))
    store.addEntities(entities.value)
  })

  const images = ref<any[] | null>()
  watch(images, () => { 
    console.log(`wd.watch.images: qid=${qid.value} isActive=${isActive.value} images=${images.value?.length || 0}`)
    if (images.value) console.log(toRaw(images.value))
  })

  const toShow = computed(() => {
    ids.value?.slice(start.value, start.value + limit.value)
  })

  const metadata = ref()
  watch(metadata, () => { showDialog.value = metadata.value !== undefined })

  const sparqlEndpoint = 'https://query.wikidata.org/sparql'

  const depictsIdsSPARQL = `
  SELECT DISTINCT ?item ?inception WHERE {
    {
      BIND (wd:{{qid}} AS ?item )
      ?item wdt:P18 ?image .
      OPTIONAL { ?item wdt:P571 ?inception . }
    } UNION {
      VALUES (?depicts) { ( wd:{{qid}} ) }
      ?item wdt:P180|wdt:P921 ?depicts ;
            wdt:P18 ?image .
      OPTIONAL { ?item wdt:P571 ?inception . }
    }
  }
  ORDER BY DESC(?inception)
  `

  const depictsItemsSPARQL = `
  CONSTRUCT {

    ?item a schema:Thing ;
          rdfs:label ?item_label ;
          schema:description ?item_description ;
          wdt:P1476  ?title ;
          wdt:P571   ?inception ;
          wdt:P18    ?image ;
          wdt:P170   ?cr ;
          wdt:P180   ?de ;
          wdt:P921   ?ms ;
          wdt:P6108  ?manifest .
        
    ?cr  wdt:P170   ?creator ;
         rdfs:label ?creator_label .
    ?de  wdt:P180   ?depicts ;
         rdfs:label ?depicts_label .
    ?ms  wdt:P921   ?main_subject ;
         rdfs:label ?main_subject_label .

  } WHERE {
    
    VALUES (?item) { {{qids}} }

    ?item p:P18 ?imgStmt .
    ?imgStmt ps:P18 ?image .
    ?imgStmt wikibase:rank ?rank .

    OPTIONAL { ?item rdfs:label ?item_label . 
      # FILTER (LANG(?item_label) = '{{language}}') . 
    }
    OPTIONAL { ?item schema:description ?item_description . FILTER (LANG(?item_description) = '{{language}}') . }
    OPTIONAL { ?item wdt:P1476 ?title . }
    OPTIONAL { ?item wdt:P571 ?inception . }
    OPTIONAL { ?item wdt:P6108 ?manifest . }

    # depicts
    OPTIONAL {
      ?item p:P180 ?de .
      ?de   ps:P180 ?depicts .
      ?depicts rdfs:label ?depicts_label .
      FILTER (LANG(?depicts_label) = '{{language}}') .
    }

    # main subject
    OPTIONAL {
      ?item p:P921 ?ms .
      ?ms   ps:P921 ?main_subject .
      ?main_subject rdfs:label ?main_subject_label .
      FILTER (LANG(?main_subject_label) = '{{language}}') .
    }

    # instance of
    OPTIONAL {
      ?item p:P31 ?ins .
      ?ins  ps:P31 ?instance_of .
      ?instance_of rdfs:label ?instance_of_label .
      FILTER (LANG(?instance_of_label) = '{{language}}') .
    }
      
    # creator
    OPTIONAL {
      ?item   p:P170 ?cr .
      ?cr     ps:P170 ?creator .
      ?creator rdfs:label ?creator_label .
      FILTER (LANG(?creator_label) = '{{language}}') .    
    }
  }
  `

  const context = {
    wd: 'http://www.wikidata.org/entity/',
    wdt: 'http://www.wikidata.org/prop/direct/',
    p: 'http://www.wikidata.org/prop/',
    pq: 'http://www.wikidata.org/prop/qualifier/',
    ps: 'http://www.wikidata.org/prop/statement/',
    wds: 'http://www.wikidata.org/entity/statement/',
    wdv: 'http://www.wikidata.org/value/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'http://schema.org/',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    Entity: 'schema:Thing',
    id: '@id',
    type: '@type',
    language: '@language',

    labels: {
      '@id': 'rdfs:label',
      '@container': '@set'
    },
    aliases: {
      '@id': 'skos:altLabel',
      '@container': '@set'
    },
    depicts: {
      '@id': 'wdt:P180',
      '@container': '@set'
    },
    country: {
      '@id': 'wdt:P17',
      '@type': '@id'
    },
    descriptions: {
      '@id': 'schema:description',
      '@container': '@set'
    },
    creator: {
      '@id': 'wdt:P170',
      '@type': '@id'
    },
    image: {
      '@id': 'wdt:P18',
      '@type': '@id',
      //'@container': '@set'
    },
    inception: {
      '@id': 'wdt:P571',
      '@type': 'xsd:dateTime'
    },
    instance_of: {
      '@id': 'wdt:P31',
      //'@container': '@set'
    },
    main_subject: {
      '@id': 'wdt:P921',
      '@container': '@set'
    },
    manifest: {
      '@id': 'wdt:P6108'
    },
    published_in: 'wdt:P1433',
    'title': {
      '@id': 'wdt:P1476'
    },
    total_items: {
      '@id': 'schema:numberOfItems',
      '@type': 'xsd:integer'
    }
  }

  async function getDepictIds() {
    let query = depictsIdsSPARQL.replace(/{{qid}}/g, qid.value || '')
    let resp: any = await fetch(sparqlEndpoint, {
      method: 'POST',
      body: new URLSearchParams({ query }), 
      headers: { Accept: 'application/sparql-results+json', 'Content-type': 'application/x-www-form-urlencoded' }
    })
    if (resp.ok) {
      resp = await resp.json()
      ids.value = resp.results.bindings
        .map((item: any) => item.item.value.split('/').pop())
    }
  }

  async function getDepictItems(qids:string[]) {
    let query = depictsItemsSPARQL.replace(/{{qids}}/, `(wd:${qids.join(') (wd:')})`).replace(/{{language}}/g, language.value)
    let resp: any = await fetch(sparqlEndpoint, {
      method: 'POST',
      body: new URLSearchParams({query}), 
      headers: { Accept: 'application/ld+json', 'Content-type': 'application/x-www-form-urlencoded' }
    })
    if (resp.ok) {
      let jld:any = await resp.json()
      console.log(jld)
      jld = await jsonld.frame(
        jld, 
        { '@context': <any>context, 
          '@type': 'Entity',
          // '@omitGraph': false
        })
      // simulate omitGraph
      if (!jld['@graph']) {
        let context = jld['@context']
        delete jld['@context']
        jld = {'@context': context, '@graph': [jld]}
      }
      jld['@graph'].forEach((item:any) => { if (item.image) item.thumb = store.mwImage(item.image, 300) })
      return jld['@graph']
    }
  }

  async function getMetadata(id: string) {
    let data = await store.fetch(id.replace(/^wd:/, ''))
    return data
  }

  async function onclick(id: string) {
    metadata.value = await getMetadata(id)
  }

</script>

<style>

  h1 {
    margin-top: 0;
    font-size: 1.6em;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    grid-gap: 16px;
    align-items: stretch;
    padding: 8px;
  }

  .cards > div {
    padding: 12px;
    display: flex;
    flex-direction: column;
  }

</style>