<template>
  <div ref="root">
    <span v-html="props.label" class="title"></span>
    <span v-if="ids" class="count">({{ ids?.length.toLocaleString() }})</span>
    <ve-pal
      :id="id"
      :active="isActive"
      :articles="items"
      @get-next="getNext()"
      @item-selected="itemSelected"
    ></ve-pal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
import * as jsonld from "jsonld";
import type { Article } from "../types";

const store = useEntitiesStore();
const { active, qid } = storeToRefs(store);

const props = defineProps({
  label: { type: String },
  id: { type: String, default: "wd-docs" },
});

const root = ref<HTMLElement | null>(null);

const IDS_SPARQL = `
    SELECT DISTINCT ?item ?main_subject ?pubdate WHERE {
        VALUES (?about) { (wd:{{qid}}) }
        # main subject: P921
        # instance of: P31
        # scholarly article: Q13442814
        ?item wdt:P921 ?about ;
              wdt:P31 wd:Q13442814 ;
              wdt:P921 ?main_subject .
        OPTIONAL { ?item wdt:P577 ?pubdate . }
      }
      ORDER BY DESC(?pubdate)`;

const ITEMS_SPARQL = `
    CONSTRUCT {

      ?item a schema:Thing ;
              rdfs:label ?item_label ;
              wdt:P1476  ?title ;
              wdt:P478   ?volume ;
              wdt:P433   ?issue ;
              wdt:P304   ?pages ;
              wdt:P577   ?pubdate ;
              wdt:P356   ?DOI ;
              wdt:P1433  ?pi ;
              wdt:P31    ?ins ;
              wdt:P50    ?an ;
              wdt:P2093  ?ans ;
              wdt:P921   ?ms .
          
      ?ans wdt:P2093  ?author_name ;
           pq:P1545   ?ans_seq .
      ?an  wdt:P50    ?author ;
           rdfs:label ?author_label ;
           pq:P1545   ?au_seq .
      ?ms  wdt:P921   ?main_subject ;
           rdfs:label ?main_subject_label .
      ?pi  wdt:P1433  ?published_in ;
           rdfs:label ?published_in_label .
      ?ins wdt:P31    ?instance_of ;
           rdfs:label ?instance_of_label .

    } WHERE {

      VALUES (?item) { ({{qids}}) }

      OPTIONAL {
        ?item rdfs:label ?item_label .
        FILTER (LANG(?item_label) = "en") .
      }
      OPTIONAL { ?item wdt:P1476 ?title . }
      OPTIONAL { ?item wdt:P478 ?volume . }
      OPTIONAL { ?item wdt:P433 ?issue . }
      OPTIONAL { ?item wdt:P304 ?pages . }
      OPTIONAL { ?item wdt:P577 ?pubdate . }
      OPTIONAL { ?item wdt:P356 ?DOI . }

      # main subject
      OPTIONAL {
          ?item p:P921 ?ms .
          ?ms   ps:P921 ?main_subject .
          ?main_subject rdfs:label ?main_subject_label .
          FILTER (LANG(?main_subject_label) = "en") .
      }

      # instance of
      OPTIONAL {
          ?item p:P31 ?ins .
          ?ins  ps:P31 ?instance_of .
          ?instance_of rdfs:label ?instance_of_label .
          FILTER (LANG(?instance_of_label) = "en") .
      }

      # published in
      OPTIONAL {
          ?item p:P1433 ?pi .
          ?pi   ps:P1433 ?published_in .
          ?published_in rdfs:label ?published_in_label .
          FILTER (LANG(?published_in_label) = "en") .    
      }

      # author name string
      OPTIONAL {
          ?item p:P2093 ?ans .
          ?ans  ps:P2093 ?author_name .
          OPTIONAL {
              ?ans pq:P1545 ?ans_seq .
          }
      }

      # author
      OPTIONAL {
          ?item   p:P50 ?an .
          ?an     ps:P50 ?author .
          ?author rdfs:label ?author_label .
          FILTER (LANG(?author_label) = "en") .    
          OPTIONAL {
              ?an pq:P1545 ?au_seq .
          }
      }

    }`;

const context = {
  wd: "http://www.wikidata.org/entity/",
  wdt: "http://www.wikidata.org/prop/direct/",
  p: "http://www.wikidata.org/prop/",
  pq: "http://www.wikidata.org/prop/qualifier/",
  ps: "http://www.wikidata.org/prop/statement/",
  wds: "http://www.wikidata.org/entity/statement/",
  wdv: "http://www.wikidata.org/value/",
  rdfs: "http://www.w3.org/2000/01/rdf-schema#",
  schema: "http://schema.org/",
  skos: "http://www.w3.org/2004/02/skos/core#",
  xsd: "http://www.w3.org/2001/XMLSchema#",
  Entity: "schema:Thing",
  label: {
    "@id": "rdfs:label",
    "@language": "en",
  },
  aliases: {
    "@id": "skos:altLabel",
    "@language": "en",
  },
  depicts: {
    "@id": "wdt:P180",
  },
  country: {
    "@id": "wdt:P17",
    "@type": "@id",
  },
  description: {
    "@id": "schema:description",
    "@language": "en",
  },
  author: {
    "@id": "wdt:P50",
    // '@container': '@set'
  },
  "author name string": "wdt:P2093",
  "cites work": "wdt:P2860",
  creator: {
    "@id": "wdt:P170",
    "@type": "@id",
  },
  DOI: "wdt:P356",
  image: {
    "@id": "wdt:P18",
    "@type": "@id",
  },
  inception: {
    "@id": "wdt:P571",
    "@type": "xsd:dateTime",
  },
  "instance of": {
    "@id": "wdt:P31",
    // '@container': '@set'
  },
  issue: "wdt:P433",
  "language of work or name": "wdt:P407",
  "main subject": {
    "@id": "wdt:P921",
    // '@container': '@set'
  },
  ordinal: "pq:P1545",
  pages: "wdt:P304",
  "publication date": {
    "@id": "wdt:P577",
    "@type": "xsd:dateTime",
  },
  "published in": "wdt:P1433",
  title: {
    "@id": "wdt:P1476",
  },
  "subject item of this property": {
    "@id": "wdt:P1629",
  },
  "total items": {
    "@id": "schema:numberOfItems",
    "@type": "xsd:integer",
  },
  "Unicode character": {
    "@id": "wdt:P487",
  },
  volume: "wdt:P478",
};

const ids = ref<string[]>([]);
watch(ids, async () => {
  let numIds = ids.value.length;
  end.value = Math.min(50, numIds);
  if (numIds === 0) items.value = [];
  else getItems();
});

const items = ref<Article[]>([]);
// watch(items, () => { console.log(toRaw(items.value)) })

const isActive = computed(() => active.value.split("/").pop() === props.id);
watch(isActive, () => {
  if (isActive.value && ids.value.length === 0) getIds();
});

watch(qid, () => {
  ids.value = [];
  if (qid.value && isActive.value) getIds();
});

onMounted(() => {
  if (isActive.value) getIds();
});

const end = ref(0);
function getNext() {
  end.value = Math.min(end.value + 50, ids.value?.length || 0);
  getItems();
}

function getIds() {
  let query = IDS_SPARQL.replace(/{{qid}}/g, qid.value).trim();
  // console.log(query)
  fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/sparql-results+json",
      },
    },
  )
    .then((resp) => resp.json())
    .then((data) => {
      let _mainSubjects = {};
      let _ids: string[] = [];
      let distinct = new Set();
      data.results.bindings.forEach((b: any) => {
        let id = b.item.value.split("/").pop();
        if (!distinct.has(id)) _ids.push(id);
        distinct.add(id);
        let ms = b.main_subject?.value.split("/").pop();
        if (ms !== qid.value) {
          if (!_mainSubjects[ms]) _mainSubjects[ms] = 0;
          _mainSubjects[ms]++;
        }
      });
      // console.log(Object.entries(_mainSubjects).sort((a:any, b:any) => b[1] - a[1]))
      ids.value = _ids;
    });
}

let fetching = false;
function getItems() {
  let qids = ids.value.slice(items.value.length, end.value);
  if (fetching || qids.length === 0) return;
  fetching = true;
  console.log("getItems", items.value.length, end.value, qids.length);
  let query = ITEMS_SPARQL.replace(
    /{{qids}}/g,
    qids.map((q) => `wd:${q}`).join(") ("),
  ).trim();

  fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Accept: "application/ld+json",
        "Content-type": "application/x-www-form-urlencoded",
      },
    },
  )
    .then((resp) => resp.json())
    .then((jld) =>
      jsonld.frame(jld, { "@context": context, "@type": "Entity" }),
    )
    .then((jld) => {
      if (jld["@graph"]) return jld;
      let normalized: any = { "@context": jld["@context"], "@graph": [{}] };
      Object.keys(jsonld)
        .filter((key) => key !== "@context")
        .forEach((key) => (normalized["@graph"][0][key] = jld[key]));
      return normalized;
    })
    .then((jld) => jld["@graph"])
    .then((entities) => {
      entities.map((entity: any) => {
        if (entity["@id"]) {
          entity.id = entity["@id"].split(":").pop();
          delete entity["@id"];
        }
        if (entity["@type"]) delete entity["@type"];
        if (!Array.isArray(entity["main subject"]))
          entity["main subject"] = [entity["main subject"]];
        if (!Array.isArray(entity.title)) entity.title = [entity.title];
        return entity;
      });
      fetching = false;
      items.value = [...items.value, ...entities];
    });
}

async function itemSelected(evt: CustomEvent) {
  let id = evt.detail[0].id;
  console.log("itemSelected", id);
}
</script>

<style>
.title {
  font-size: 1.5em;
  font-weight: bold;
}
.count {
  font-size: 1.2;
  color: #666;
  padding-left: 0.5em;
}
</style>
