<template>

  <div ref="root">
    <div v-for="e in entities.filter(e => e.types).sort((a:Entity, b:Entity) => a.label.localeCompare(b.label))" :key="e.id"
      class="flex items-center p-2 space-x-4 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
      @click="itemSelected(e)"
    >
      <img v-if="e.images" :src="e.images.thumbnail" :alt="e.label" class="w-12 h-12 rounded-full">
      <div v-else class="w-12 h-12 rounded-full bg-gray-200"></div>
      <div class="flex flex-col">
        <div class="flex items-center space-x-2">
          <h3 class="font-bold" v-html="e.label"></h3>
          <div v-if="e.types" class="font-light text-sm">({{ e.types.join(', ') }})</div>
        </div>
        <div v-if="e.description" v-html="e.description"></div>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  import * as jsonld from 'jsonld'
  import { Md5 } from 'ts-md5'
  import yaml from 'js-yaml'

  type Entity = {
    aliases: string[],
    category: string,
    description: string,
    details?: {
      types: string[],
      id: string,
      image?: string
    },
    id: string,
    instance_of?: string[],
    label: string,
    image?: string,
    images?: {
      best: string,
      default: string
      thumbnail: string
    },
    part_of?: string[],
    subclass_of?: string[],
    types: string[],
  }

  const store = useEntitiesStore()
  const { active, language, labels, qid } = storeToRefs(store)

  const root = ref<HTMLElement | null>(null)
  // const shadowRoot = computed(() => root?.value?.parentNode)
  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const props = defineProps({
    label: { type: String },
    id: { type: String }
  })

  const entity = ref<any>()
  watch(qid, async () => entity.value = await store.fetch(qid.value) )
  watch(entity, async () => entities.value = await loadData() )

  onMounted(async () =>  {
    await loadEntityTypes()
    entity.value = await store.fetch(qid.value) 
  })

  const isLoading = ref(true)
  const loadedEntityId = ref('')
  const totalEntities = ref(0)
  const categories = ref<any[]>([])
  const selectedCategory = ref('')
  const byCategory = ref({})
  
  const entities = ref<Entity[]>([])
  watch(entities, () => console.log(toRaw(entities.value)))

  const exclude = new Set(['wd:Q101896'])

  const sparqlEndpoint = 'https://query.wikidata.org/sparql'

  const mwUrlSparqlTemplate = `
    SELECT ?mwPage WHERE {
      ?mwPage schema:about wd:{{qid}} .
      ?mwPage schema:isPartOf <https://{{language}}.wikipedia.org/> .
    }`

  const mentionsSparqlTemplate = `
    SELECT ?mwPage ?entity WHERE {
      VALUES ?mwPage { {{pages}} }
      ?mwPage schema:about ?entity .
    }`

  const entitiesSparqlTemplate = `
  CONSTRUCT {
    ?item a schema:Thing ;
          rdfs:label ?label ;
          schema:description ?description ;
          skos:altLabel ?alias ;
          wdt:P31 ?instanceOf ;
          wdt:P279 ?subclassOf ;
          wdt:P361 ?partOf ;
          wdt:P106 ?occupation ;
          wdt:P625 ?coords ;
          wdt:P6766 ?wof_id ;
          wdt:P18 ?image .

  } WHERE {

    VALUES (?item) { {{qids}} }

    # label
    ?item rdfs:label ?label .
    FILTER (lang(?label) = '{{language}}' || lang(?label) = 'en') .

    # description
    OPTIONAL {
      ?item schema:description ?description .
      FILTER (lang(?description) = '{{language}}' || lang(?description) = 'en') .
    }

    # aliases
    OPTIONAL {
      ?item skos:altLabel ?alias .
      FILTER (lang(?alias) = '{{language}}' || lang(?alias) = 'en') .
    }

    # instance of
    OPTIONAL {
      ?item wdt:P31* ?instanceOf .
    }

    # subclass of
    OPTIONAL {
      ?item wdt:P279* ?subclassOf .
    }

    # part of
    OPTIONAL {
      ?item wdt:P361 ?partOf .
    }

    # occupation
    OPTIONAL {
      ?item wdt:P106 ?occupation .
    }

    # image
    OPTIONAL {
      ?item wdt:P18 ?image .
    }

    # coordinate location
    OPTIONAL {
      ?item wdt:P625 ?coords .
    }

    # who's on first (geojson link)
    OPTIONAL {
      ?item wdt:P6766 ?wof_id .
    }

  } ORDER BY ?item`

  const context = {
    wd: 'http://www.wikidata.org/entity/',
    wdt: 'http://www.wikidata.org/prop/direct/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'http://schema.org/',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    Entity: 'schema:Thing',

    id: '@id',

    aliases: {
      '@id': 'skos:altLabel',
      '@language': 'en'
    },
    category: '@type',
    coords: {
      '@id': 'wdt:P625',
      '@type': 'http://www.opengis.net/ont/geosparql#wktLiteral',
      //'@container': '@set'
    },
    description: {
      '@id': 'schema:description',
      '@language': 'en'
    },
    image: {
      '@id': 'wdt:P18',
      '@type': '@id',
      //'@container': '@set'
    },
    instance_of: {
      '@id': 'wdt:P31',
      '@type': '@id',
      '@container': '@set'
    },
    label: {
      '@id': 'rdfs:label',
      '@language': 'en'
    },
    occupation: {
      '@id': 'wdt:P106',
      '@type': '@id',
      '@container': '@set'
    },
    part_of: {
      '@id': 'wdt:P361',
      '@type': '@id',
      '@container': '@set'
    },
    qid: 'schema:identifier',
    subclass_of: {
      '@id': 'wdt:P279',
      '@type': '@id',
      '@container': '@set'
    },
    title: {
      '@id': 'http://labs-wiki.jstor.org/prop/direct/P118'
    },
    whos_on_first_id: {
      '@id': 'wdt:P6766'
    },
    wikipedia_page: {
      '@id': 'schema:isPartOf',
      '@type': '@id'
    },
    youtube_video_id: {
      '@id': 'http://labs-wiki.jstor.org/prop/direct/P8'
    },
    person: 'wd:Q5',
    mammal: 'wd:Q7377',
    plant: 'wd:Q756',
    entity: 'wd:Q35120',
    place: 'wd:Q17334923',
    building: 'wd:Q41176',
    written_work: 'wd:Q47461344',
    fictional_character: 'wd:Q95074',
    location: 'wd:Q17334923'
  }

  async function loadEntityTypes() {
    let resp: any = await fetch('/entity-types.yaml')
    if (resp.ok) {
      resp = await resp.text()
      let typeData: any = await yaml.load(resp)
      let _byCategory: any = {}
      Object.entries(typeData.categories).forEach(([category, values]) => {
        let ids = new Set()
        let snippets = new Set();
        (<string[]>values).forEach((val:string) => {
          if ((val[0] === 'Q' || val[0] === 'P') && isNumeric(val.slice(1))) ids.add(val)
          else snippets.add(val)
        })
        _byCategory[category] = {ids, snippets}
      })
      byCategory.value = _byCategory
    }
  }

  function typeIds(item: any): string[] {
    let qids = new Set()
    if (item.coords) qids.add('P625')
    if (item.whos_on_first_id) qids.add('P6766')
    if (item.occupation) item.occupation.forEach((occupation: any) => {
      if (typeof occupation === 'string') qids.add(occupation.slice(3))
      // else occupation.occupation.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
    })
    if (item.instance_of) item.instance_of.forEach((instance_of: any) => {
      if (typeof instance_of === 'string') qids.add(instance_of.slice(3))
      else instance_of.instance_of.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
    })
    if (item.subclass_of) item.subclass_of.forEach((subclass_of: any) => {
      if (typeof subclass_of === 'string') qids.add(subclass_of.slice(3))
      else subclass_of.subclass_of.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
    })
    if (item.part_of) item.part_of.forEach((part_of: any) => {
      if (typeof part_of === 'string') qids.add(part_of.slice(3))
      else {
        if (part_of.part_of) part_of.part_of.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
        if (part_of.subclass_of) part_of.subclass_of.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
        if (part_of.instance_of) part_of.instance_of.filter((arg: any) => typeof arg === 'string').forEach((qid: string) => qids.add(qid.slice(3)))
      }
    })
    return <string[]>Array.from(qids)
  }

  function findQids(items: any[]): string[] {
    let qids = new Set()
    items.forEach(item => typeIds(item).forEach(qid => qids.add(qid)))
    return <string[]>Array.from(qids)
  }

  function addLabels(vals: any) {
    return (<string[]>Array.from(vals))
      .map((val:string) => val.slice(0,3) === 'wd:' ? val : `wd:${val}`)
      // .map((qid: string) => labels[qid] ? `${labels[qid]} (${qid.replace(/^wd:/,'')})` : qid)
      .map((qid: string) => labels[qid] ? `  - ${qid.replace(/^wd:/,'')}  # ${labels[qid]}` : qid)
  }

  function setIntersection(a: any, b: any) {
    return new Set([...a].filter(x => b.has(x)))
  }

  function inferTypes(item: any, itemTypes: string[], seq: number) {
    // let itemQids = typeIds(item)
    let types: any = new Set()
    Object.entries(byCategory.value).forEach(([category, obj]) => {
      if (setIntersection(itemTypes, (<any>obj).ids).size > 0) {
        types.add(category)
      } else {
        if (Array.from((<any>obj).snippets).find(snippet => item.description && item.description.indexOf(snippet) >= 0))
        types.add(category)
      }
    })
    let msg = `${seq}: ${item.label} (${item.description}) [${Array.from(types)}]`
    if (types.size === 0) {
      types.add('Other')
      if (item.instance_of) msg += ` types:[${addLabels(itemTypes)}]`
    }
    types.add('All')
    return Array.from(types)
  }

  async function transform(items: any[]): Promise<Entity[]> {
    let qids: string[] = findQids(items)
    await store.updateLabels(qids)
    return items.map((item, seq) => {
      if (item.image) {
        let itemTypes: string[] = typeIds(item)
        let imageUrl = Array.isArray(item.image) ? item.image[0] : item.image
        item.images = {
          thumbnail: mwImage(imageUrl, 200),
          default: mwImage(imageUrl, 800),
          best: mwImage(imageUrl)
        },
        item.details = {types: addLabels(itemTypes).sort()}
        item.types = inferTypes(item, itemTypes, seq)
      }
      return item
    })
  }

  function typeStats(items: any[]) {
    let stats: any = {}
    items.forEach((item, seq) => {
      if (item.types && item.types.length > 0) {
        item.types.forEach((type: any) => {
          if (!stats[type]) stats[type] = 0
          stats[type] += 1
        })
      }
    })
    return Object.entries(stats)
      .map(([label, count]) => ({label, count}))
      .sort((a:any, b:any) => b.count - a.count)
      .map((rec:any) => ({label: `${rec.label} (${rec.count})`, value: rec.label, count: rec.count}))
  }

  async function loadData(): Promise<Entity[]> {
    // console.log(`MentionedEntities.loadData: qid=${qid.value} isActive=${isActive.value} entity=${entity.value?.id} loadedEntityId=${loadedEntityId.value}`)
    let _entities: Entity[] = []
    if (isActive.value && entity.value && entity.value.id !== loadedEntityId) {
      isLoading.value = true
      _entities = await transform(await mentionedEntities())
      categories.value = typeStats(entities.value)
      selectedCategory.value = categories.value[0]
      totalEntities.value = entities.value.length
      loadedEntityId.value = entity.value.id
      isLoading.value = false
    }
    return _entities
  }

  async function mentionedEntities() {
    let mentions: any = await mentionTitles()
    mentions = await mentionQids(mentions)
    let qids = Object.values(mentions).filter((mention: any) => mention.qid).map((mention: any) => mention.qid)
    if (qids.length > 0) {
      let query = entitiesSparqlTemplate.replace(/{{qids}}/, `(${qids.join(') (')})`).replace(/{{language}}/g, language.value)
      let resp = await fetch(sparqlEndpoint, {
        method: 'POST',
        body: new URLSearchParams({query}), 
        headers: { Accept: 'application/ld+json', 'Content-type': 'application/x-www-form-urlencoded' }
      })
      let jld = await resp.json()
      jld = await jsonld.frame(jld, {'@context': <any>context, '@type': 'Entity'})
      return jld['@graph']
    }
  }

  async function mentionTitles() {
    let html = await mwPage()
    if (html) {
      let tmp = new DOMParser().parseFromString(html, 'text/html').children[0].children[1]
      let mentions: any = {}
      Array.from(tmp.querySelectorAll('a'))
        .filter(link => link.href.indexOf(`${window.location.origin}/wiki/`) === 0)
        .filter(link => link.href.indexOf('Special:') < 0 && link.href.indexOf('File:') < 0 && link.href.indexOf('Category:') < 0)
        .map(link => link.href.split('/').pop())
        .forEach((title: any) => mentions[title] = {title, count: (mentions[title] || 0) + 1})
      return mentions
    }
  }

  async function mentionQids(mentions: any[]) {
    let pages = Object.keys(mentions).map(title => `<https://${language.value}.wikipedia.org/wiki/${encodeURIComponent(title)}>`).join(' ')
    let query = mentionsSparqlTemplate.replace(/{{pages}}/, pages)
    let resp: any = await fetch(sparqlEndpoint, {
      method: 'POST',
      body: new URLSearchParams({query}), 
      headers: { Accept: 'application/sparql-results+json', 'Content-type': 'application/x-www-form-urlencoded' }
    })
    if (resp.ok) {
      resp = await resp.json()
      if (resp.results.bindings) {
        resp.results.bindings.forEach((rec: any) => {
          let title: any = decodeURIComponent(rec.mwPage.value).split('/').pop()
          let qid = `wd:${rec.entity.value.split('/').pop()}`
          if (mentions[title]) mentions[title].qid = qid
        })
      }
    }
    return mentions
  }

  async function mwUrl() {
    let query = mwUrlSparqlTemplate.replace(/{{qid}}/, entity.value.id).replace(/{{language}}/g, language.value)
    let resp: any = await fetch(sparqlEndpoint, {
      method: 'POST',
      body: new URLSearchParams({query}), 
      headers: { Accept: 'application/sparql-results+json', 'Content-type': 'application/x-www-form-urlencoded' }
    })
    if (resp.ok) {
      resp = await resp.json()
      if (resp.results.bindings) return resp.results.bindings[0].mwPage.value
    }
  }

  async function mwPage() {
    let _mwUrl = await mwUrl()
    if (_mwUrl) {
      let title = _mwUrl.split('/').pop()
      let url = `https://${language.value}.wikipedia.org/w/api.php?origin=*&action=parse&page=${title}&prop=text&formatversion=2&format=json`
      let resp: any = await fetch(url)
      if (resp.ok) {
        resp = await resp.json()
        return resp.parse.text
      }
    }
  }

  function mwImage(mwImg: string, width?: number) {
    // Converts Wikimedia commons image URL to a thumbnail link
    mwImg = (Array.isArray(mwImg) ? mwImg[0] : mwImg).split('Special:FilePath/').pop()
    mwImg = decodeURIComponent(mwImg).replace(/ /g,'_')
    const _md5 = Md5.hashStr(mwImg)
    const extension = mwImg.split('.').pop()
    let url = `https://upload.wikimedia.org/wikipedia/commons${width ? '/thumb' : ''}`
    url += `/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${mwImg}`
    if (width) {
      url += `/${width}px-${mwImg}`
      if (extension === 'svg') {
        url += '.png'
      } else if (extension === 'tif' || extension === 'tiff') {
        url += '.jpg'
      }
    }
    return url
  }

  function itemSelected(item: any) {
    store.setQid(item.id.replace(/^wd:/,''))
  }

function isNumeric(arg: any) { return !isNaN(arg) }

</script>

<style>
  @import '../tailwind.css';
</style>