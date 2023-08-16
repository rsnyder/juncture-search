<template>
  <div ref="root">
    <table ref="main" clsss="table table-condensed">
      <tr class="property" v-for="(prop, idx) in claims" :key="`prop-${idx}`">
        
        <th>
          <div class="prop-label">
            <a :href="`https://www.wikidata.org/wiki/Property:${prop.id}`" 
               :title="prop.description"
               v-html="prop.label"
               :data-type="prop.type"
               target="_blank"
            ></a>
          </div>
        </th>

        <td>

          <template v-if="prop.values.length > 5">
            <div class="collapsible">
              <input type="checkbox" name="collapse" :id="`related-${prop.id}`">

              <h2 class="handle">
                <label :for="`related-${prop.id}`" 
                  v-html="`${prop.values.length} ${translations['items'] || 'items'}.  ${translations['Show more'] || 'show more'}.`"></label>
              </h2>
    
              <div class="prop-values-content">

                <div v-for="(pval, idx) in prop.values" :key="`prop-${prop.id}-${idx}`">

                  <div v-if="prop.type === 'WikibaseItem'" class="prop-value">
                    <span class="wikibase-entityid" v-html="pval.value.label" @click="entitySelected"
                          :data-qid="pval.value.id" :id="`related-${prop.id}-${idx}-${pval.value.id}`">
                    </span>
                    <span class="description" v-html="pval.value.description"></span>
                  </div>
                  <div v-else class="prop-value">
                    <span :class="prop.type" v-html="pval.value.label" @click="entitySelected"></span>
                    <span class="description" v-html="pval.value.description"></span>
                  </div>

                </div>
              
              </div>
            
            </div>

          </template>

          <template v-else>

            <div v-for="(pval, idx) in prop.values" :key="`prop-${prop.id}-${idx}`">
  
              <div v-if="prop.type === 'WikibaseItem'" class="prop-value">
                <span class="wikibase-entityid" v-html="pval.value.label" @click="entitySelected"
                      :data-qid="pval.value.id" :id="`related-${prop.id}-${idx}-${pval.value.id}`">
                </span>
                <span class="description" v-html="pval.value.description"></span>
              </div>
              <div v-else class="prop-value">
                <span :class="prop.type" v-html="pval.value.label" @click="entitySelected"></span>
                <span class="description" v-html="pval.value.description"></span>
              </div>

            </div>

          </template>

        </td>
      </tr>
    </table>

    <!--<ve-entity-infoboxes></ve-entity-infoboxes>-->

  </div>
</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import * as jsonld from 'jsonld'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { active, qid, language } = storeToRefs(store)

  const props = defineProps({
    id: { type: String, default: 'template' }
  })

  const isActive = computed(() => active.value.split('/').pop() === props.id)
  watch(isActive, () => { if (entity.value.id !== qid.value && isActive.value) loadData() })


  watch(qid, async () => { if (qid.value) entity.value = await store.fetch(qid.value, true) })
  onMounted(async () => { if (qid.value) entity.value = await store.fetch(qid.value, true) })
  
  const entity = ref<any>()
  watch(entity, () => loadData() )

  const claims = ref()
  const translations = {}

  // watch(claims, () => console.log(toRaw(claims.value)))

  const sparqlEndpoint = 'https://query.wikidata.org/sparql'

  const sparqlTemplate = `
    CONSTRUCT {

      ?item a wd:Q35120 ;
            rdfs:label ?itemLabel ;
            ?prop ?relatedItem .
              
      ?prop a wd:Q18616576 ;
            rdfs:label ?propLabel ;
            wikibase:propertyType ?propertyType .
      
      ?relatedItem rdfs:label ?relatedItemLabel ;
                  schema:description ?relatedItemDescription .
    
    } WHERE {
        
      VALUES (?item) {( wd:{{qid}} )}
      ?item rdfs:label ?itemLabel . FILTER(LANG(?itemLabel) = '{{language}}' || LANG(?itemLabel) = 'en')

      ?relatedItem ?prop ?item ;
                  rdfs:label ?relatedItemLabel ;
                  schema:description ?relatedItemDescription .
      FILTER NOT EXISTS { ?relatedItem wdt:P31 ?item }
      FILTER(LANG(?relatedItemLabel) = '{{language}}' || LANG(?relatedItemLabel) = 'en')
      FILTER(LANG(?relatedItemDescription) = '{{language}}' || LANG(?relatedItemDescription) = 'en')

      ?p wikibase:directClaim ?prop .
      OPTIONAL {
          ?p rdfs:label ?propLabel .
          ?p wikibase:propertyType ?propertyType .
          FILTER(LANG(?propLabel) = '{{language}}' || LANG(?propLabel) = 'en')
      }
    }`
  
  const context = {
    wd: 'http://www.wikidata.org/entity/',
    wdt: 'http://www.wikidata.org/prop/direct/',
    rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
    schema: 'http://schema.org/',
    skos: 'http://www.w3.org/2004/02/skos/core#',
    xsd: 'http://www.w3.org/2001/XMLSchema#',
    wikibase: 'http://wikiba.se/ontology#',

    Entity: 'wd:Q35120',
    Property: 'wd:Q18616576',

    id: '@id',
    type: '@type',
    language: '@language',

    label: {
        '@id': 'rdfs:label',
        // '@container': '@set'
    },
    dataType: {
        '@id': 'wikibase:propertyType',
        '@type': '@id'
    },
    description: {
        '@id': 'schema:description',
        // '@container': '@set'
    }
  }

  const exclude = [
    'Wikidata property example',
    'category\'s main topic',
    'category combines topics'
  ]

  async function loadData() {
    let query = sparqlTemplate.replace(/{{qid}}/, entity.value.id).replace(/{{language}}/g, language.value)
    let resp = await fetch(sparqlEndpoint, {
      method: 'POST',
      body: new URLSearchParams({query}), 
      headers: { Accept: 'application/ld+json', 'Content-type': 'application/x-www-form-urlencoded' }
    })
    if (resp.ok) {
      let jld = await resp.json()
      let entities = normalizeJsonld(await jsonld.frame(jld, {'@context': context, '@type': 'Entity', options: {compactArrays: false }}))
      let properties = normalizeJsonld(await jsonld.frame(jld, { '@context': context, '@type': 'Property', options: {compactArrays: false } }))

      claims.value = asClaims(entities, properties).filter((prop: any) => exclude.indexOf(prop.label) === -1)
    }
  }

  function normalizeJsonld(jsonld: any) {
    if (jsonld['@graph']) return jsonld
    let normalized: any = { '@context': jsonld['@context'], '@graph': [{}] }
    Object.keys(jsonld).filter(key => key !== '@context').forEach(key => normalized['@graph'][0][key] = jsonld[key])
    return normalized
  }

  function asClaims(entities: any, properties: any): any {
    let claims: any[] = []
    let entity: any = entities['@graph'].length > 0 ? entities['@graph'][0] : {}
    let props: any = {}
    properties['@graph'].forEach((rec: any) => props[rec.id] = rec)
    for (let [key, value] of Object.entries(entity)) {
      if (typeof value === 'object') value = [value]
      if (!Array.isArray(value)) continue
      if (Array.isArray(value[0])) value = value[0]
      if (props[key]) {
        let prop = props[key]
        let claim = {
          id: key.split(':').pop(),
          label: valueOf(prop.label),
          description: valueOf(prop.description),
          type: prop.dataType.split(':').pop(), 
          values: (<any[]>value).map(val => {
            return {
              value: {
                id: val.id.slice(3),
                label: valueOf(val.label),
                description: valueOf(val.description)
              }
            }
          })
        }
        claims.push(claim)
      }
    }
    return claims
  }

  function valueOf(val: any) {
    let array: any[] = Array.isArray(val) ? val : val ? [val] : []
    let valsByLang = asLangObj(array)
    return valsByLang[language.value] || valsByLang.en || ''
  }

  function asLangObj(array: any) {
    if (array) {
      const initialValue = {}
      return array.reduce((obj: any, item: any) => {
        return {...obj, [item.language]: item['@value']}
      }, initialValue)
    } else {
      return {}
    }
  }

  function entitySelected(e: any) {
    store.setQid(e.target.dataset.qid)
  }

</script>

<style>

table {
    border-collapse: collapse;
    text-indent: initial;
    border-spacing: 2px;
    background-color: white;
  }

  .table-condensed>tbody>tr>td,
  .table-condensed>tbody>tr>th,
  .table-condensed>tfoot>tr>td,
  .table-condensed>tfoot>tr>th,
  .table-condensed>thead>tr>td,
  .table-condensed>thead>tr>th {
    padding: 5px;
  }

  table tbody tr th,
  table tbody tr td {
    line-height: 1.42857143;
    vertical-align: top;
    border-top: 1px solid #ddd;
  }
  tr {
    height: 40px;
  }
  th {
    display: table-cell;
    vertical-align: top;
    font-weight: bold;
    text-align: -internal-center;
    text-align: left;
    padding: 9px 6px; 
    min-width: 162px;
  }
  th a {
    color: #0164b9;
    font-size: 1.1rem;
    line-height: 1.1rem;
    text-decoration: none;
  }
  td {
    display: table-cell;
    vertical-align: inherit;
    padding: 9px 12px;
    width: 100%;
  }

  a.wikidata {
    color: #0164b9;
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

  /* CSS for the collapse/expand interaction */
  .collapsible > input[type="checkbox"] {
    position: absolute;
    left: -100vw;
  }

  .collapsible .prop-values-content,
  .collapsible .ref-content {
    overflow-y: hidden;
    height: 0;
    transition: height 0.3s ease;
  }

  .collapsible label {
    display: block;
  }

  .collapsible > input[type="checkbox"]:checked ~ .prop-values-content {
    padding: 0 0 0 18px;
    border: 1px solid #e8e8e8;
    border-top: 0;
    height: auto;
    overflow: visible;
  }

  .collapsible .handle {
    margin: 0;
    font-size: 1.125em;
    line-height: 1.2em;
  }

  .collapsible label {
    color: #0A4273;
    cursor: pointer;
    font-weight: normal;
    font-size: .8em;
    /* padding-top: 3px; */
    padding-left: 0;
  }

  .collapsible label:hover,
  .collapsible label:focus {
    text-decoration: underline;
  }

  .collapsible .handle label:before {
    font-family: 'fontawesome';
    content: "+";
    display: inline-block;
    margin-right: 3px;
    font-size: .9em;
    font-weight: bold;
    line-height: 1rem;
    vertical-align: middle;
    padding-bottom: 3px;
  }

  .collapsible > input[type="checkbox"]:checked ~ .handle label:before {
    content: "-";
  }

  a.prop-label {
    color: #0A4273;
    cursor: pointer;
    text-decoration: none;
  }

  a.prop-value {
    color: #337ab7;
    text-decoration: none;
  }
  
  .prop-values h2 label {
    font-size: 1rem;
  }

  .prop-value {
    display: inline;
    line-height: 1.2rem;
    /* These are technically the same, but use both */
    overflow-wrap: break-word;
    word-wrap: break-word;

    -ms-word-break: break-all;
    /* This is the dangerous one in WebKit, as it breaks things wherever */
    word-break: break-all;
    /* Instead use this non-standard one: */
    word-break: break-word;

    /* Adds a hyphen where the word breaks, if supported (No Blink) */
    -ms-hyphens: auto;
    -moz-hyphens: auto;
    -webkit-hyphens: auto;
    hyphens: auto;
  }

  span.wikibase-entityid {
    display: inline;
    cursor: pointer;
    color: #0164b9;
  }

  span.description {
    margin-left: 6px;
    color: #666;
    font-size: 90%;
  }

</style>