<template>
  <div ref="root">
    <table v-if="entity" clsss="table table-striped table-condensed">
      <tr v-for="(claim, idx) in externalIdClaims" :key="`prop-${idx}`">
        <th>
          <div class="property" style="display:flex;">
            <div 
              v-html="idProps[claim.property] ? idProps[claim.property].country.symbol : ''" 
              :title="idProps[claim.property] && idProps[claim.property].country.label" 
              style="float:left;display:inline-block; min-width:25px;"
            ></div>
            <a :href="`https://www.wikidata.org/wiki/Property:${claim.property}`" 
                :title="descriptions[claim.property]"
                v-html="labels[claim.property]"
                target="_blank"
            ></a>
          </div>
        </th>
        <td class="description">
          <div v-html="idProps[claim.property] && idProps[claim.property].description"></div>
          <!-- <div v-html="idProp(claim.property).description"></div> -->
        </td>
        <td>
          <a :class="`prop-value ${claim.datatype}`" v-html="claim.datavalue?.value" :href="formatURL(claim)" target="_blank"></a>
          <!-- <property-values :prop="prop" :translations="translations" @entity-selected="entitySelected"></property-values> -->
        </td>
      </tr>
    </table>

  </div>
</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'
  import * as jsonld from 'jsonld'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { active, qid, labels, language, urlformatters } = storeToRefs(store)

  const props = defineProps({
    label: { type: String, default: 'Template' },
    id: { type: String, default: 'template' },
  })

  const sparqlEndpoint = 'https://query.wikidata.org/sparql'

  const isActive = computed(() => active.value.split('/').pop() === props.id)

  watch(qid, async () => { if (qid.value) entity.value = await store.fetch(qid.value, true) })
  onMounted(async () => { if (qid.value) entity.value = await store.fetch(qid.value, true) })

  const entity = ref<any>()

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

    label: {
      '@id': 'rdfs:label',
      // '@container': '@set'
    },
    country: {
      '@id': 'wdt:P17',
      '@type': '@id'
    },
    description: {
      '@id': 'schema:description',
      // '@container': '@set'
    },
    'subject item of this property': {
      '@id': 'wdt:P1629',
      '@type': '@id',
      // '@container': '@set'
    },
    'Unicode character': 'wdt:P487'
  }

  const sparql = `
    CONSTRUCT {

      ?idProp a schema:Thing ;
              rdfs:label ?label ;
              schema:description ?description ;
              wdt:P1629 ?si ;
              wdt:P17 ?co .

      ?si  wdt:P1629  ?subjectItem ;
          rdfs:label ?subjectItemLabel ;
          schema:description ?subjectItemDescription .

      ?co  wdt:P17  ?country ;
          rdfs:label ?countryLabel ;
          wdt:P487 ?countryChar .
    
    } WHERE {
        
      VALUES (?idProp) { {{qids}} }

      ?idProp rdfs:label ?label ;
              schema:description ?description .
      FILTER (LANG(?label) = "{{language}}" || LANG(?label) = "en") .
      FILTER (LANG(?description) = "{{language}}" || LANG(?description) = "en") .

      OPTIONAL {
          ?idProp p:P1629 ?si .
          ?si     ps:P1629 ?subjectItem .
          ?subjectItem rdfs:label ?subjectItemLabel .
          FILTER (LANG(?subjectItemLabel) = "{{language}}" || LANG(?subjectItemLabel) = "en") .
          OPTIONAL {
            ?subjectItem schema:description ?subjectItemDescription .
            FILTER (LANG(?subjectItemDescription) = "{{language}}" || LANG(?subjectItemDescription) = "en") .
          }
      }

      OPTIONAL {
          ?idProp p:P17 ?co .
          ?co     ps:P17 ?country .
          ?country rdfs:label ?countryLabel .
          FILTER (LANG(?countryLabel) = "{{language}}" || LANG(?countryLabel) = "en") .
          OPTIONAL {
            ?country wdt:P487 ?countryChar .
          }
      }
    }`

  const externalIdClaims = computed(() => 
    Object.values(entity.value?.claims || [])
      .filter((claimVals: any) => claimVals[0].mainsnak.datatype === 'external-id')
      .map((claimVals: any) => claimVals[0].mainsnak)
  )

  const externalIdProps = computed(() => externalIdClaims.value.map((claim: any) => `wd:${claim.property}`))

  const descriptions:any = {} // TODO

  watch(isActive, () => getIdProps() )
  watch(entity, () => getIdProps() )

  const idProps = ref({})
  // watch(idProps, () => console.log(toRaw(idProps.value)))

  async function getIdProps() {
    let pids = externalIdProps.value.filter((pid: string) => !idProps.value[pid])
    if (pids.length > 0) {
      let query = sparql.replace(/{{qids}}/, `(${pids.join(') (')})`).replace(/{{language}}/g, language.value)
      let resp = await fetch(sparqlEndpoint, {
        method: 'POST',
        body: new URLSearchParams({query}), 
        headers: { Accept: 'application/ld+json', 'Content-type': 'application/x-www-form-urlencoded' }
      })
      let jld = await resp.json()
      jld = await jsonld.frame(jld, {'@context': context, '@type': 'Entity'})
      let _idProps: any = {...idProps.value}
      if (!_idProps[language.value]) _idProps[language.value] = {}
      jld['@graph'].forEach((rec: any) => {
        _idProps[language.value][rec['@id'].slice(3)] = {
          label: rec.label ? rec.label['@value'] : '',
          description: rec['subject item of this property'] && rec['subject item of this property'].description
            ? rec['subject item of this property'].description['@value']
            : rec.description ? rec.description['@value'] : '',
          country: rec.country
            ? {
                label: rec.country.label ? rec.country.label['@value'] : '', 
                symbol: rec.country['Unicode character'] ? rec.country['Unicode character'] : ''
              }
            : {label: '', symbol: ''}
        }
      })
      idProps.value = {...idProps.value, ..._idProps[language.value]}

    }
  }

  function formatURL(claim: any) {
    let pid = claim.property
    // console.log(urlformatters.value[pid])
    return urlformatters.value[pid] ? urlformatters.value[pid].replace(/\$1/, claim.datavalue?.value) : claim.datavalue?.value
  }

</script>

<style>

  .module-content-wrapper {
    font-size: 1rem;
    color: #333;
    background: white;
  }

  table {
    border-collapse: collapse;
    text-indent: initial;
    border-spacing: 2px;
  }

  .table-condensed>tbody>tr>td,
  .table-condensed>tbody>tr>th,
  .table-condensed>tfoot>tr>td,
  .table-condensed>tfoot>tr>th,
  .table-condensed>thead>tr>td,
  .table-condensed>thead>tr>th {
    padding: 5px;
  }

  th > div, td > div {
    display: inline;
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
    padding: 16px 10px;
    width: 35% !important;
  }
  th a {
    color: #0A4273;
    font-size: 1rem;
    line-height: 1.3;
  }
  td, th {
    display: table-cell;
    vertical-align: top;
    padding: 9px 6px;

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

  .description {
    width: 33%;
  }

  a.wikidata {
    color: #0A4273;
  }
  tr:nth-child(even) {
    background-color: #f2f2f2;
  }

</style>