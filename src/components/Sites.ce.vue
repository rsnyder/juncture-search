<template>
  <div ref="root" class="relative overflow-x-auto shadow-md sm:rounded-lg">
    <table class="w-full text-sm text-left dark:text-gray-400">
      <thead
        class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400"
      >
        <tr>
          <th scope="col" class="px-6 py-3">Web Site</th>
          <th scope="col" class="px-6 py-3">Description</th>
          <th scope="col" class="px-6 py-3">Link</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="site in sites"
          :key="site.id"
          class="bg-white border-b dark:bg-gray-900 dark:border-gray-700"
        >
          <th
            scope="row"
            class="w-2/5 items-center px-6 py-2 font-medium text-gray-900 dark:text-white"
          >
            <img
              v-if="site.logo"
              :src="site.logo"
              class="w-6 h-6 mr-2 inline-block border shadow-md"
            />
            <span class="text-base" v-html="site.label"></span>
            <span
              v-if="site.country?.symbol"
              class="ml-2"
              v-html="site.country.symbol"
            ></span>
          </th>
          <td class="px-6 py-4">
            <span v-html="site.description"></span>
          </td>
          <td class="px-6 py-4">
            <table
              class="w-full text-sm text-left text-gray-500 dark:text-gray-400"
            >
              <tbody>
                <tr v-for="item in site.items" :key="`${site.id}=${item.id}`">
                  <a :href="item.url" target="_blank" v-html="item.id"></a>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";

import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
const store = useEntitiesStore();
const { active, qid } = storeToRefs(store);

type Site = {
  id: string;
  label: string;
  description?: string;
  logo?: string;
  country?: {
    label: string;
    symbol: string;
  };
  items: [
    {
      id: string;
      url: string;
    },
  ];
};

const props = defineProps({
  label: { type: String, default: "Sites" },
  id: { type: String, default: "sites" },
});

const isActive = computed(() => active.value.split("/").pop() === props.id);

watch(qid, async () => {
  if (qid.value) entity.value = await store.fetch(qid.value, true);
});
onMounted(async () => {
  if (qid.value) entity.value = await store.fetch(qid.value, true);
});

const entity = ref<any>();
const sites = ref<Site[]>([]);
// watch(sites, () => console.log(toRaw(sites.value)))

watch(isActive, () => doQuery());
watch(entity, () => doQuery());

function doQuery() {
  let query = `SELECT DISTINCT ?site ?siteLabel ?siteLogo ?siteDescription ?itemId ?url ?countryLabel ?countryChar WHERE {
      VALUES (?item) {(wd:${qid.value})}
      ?item ?a ?itemId .   
      ?prop wikibase:propertyType wikibase:ExternalId ;
            wikibase:directClaim ?a ; 
            wdt:P1629 ?site ;
            wdt:P1630 ?formatterurl .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en" } 
      BIND(IRI(REPLACE(?itemId, '^(.+)$', ?formatterurl)) AS ?url).
      OPTIONAL { ?site wdt:P154 ?siteLogo . }
      OPTIONAL { ?site schema:description ?siteDescription. FILTER (LANG(?siteDescription) = "en") . }
      OPTIONAL {
        ?prop p:P17 ?co .
        ?co ps:P17 ?country .
        ?country rdfs:label ?countryLabel .
        FILTER (LANG(?countryLabel) = "en") .
        OPTIONAL { ?country wdt:P487 ?countryChar . }
      }
    }`;
  return fetch(
    `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`,
    {
      headers: { Accept: "application/sparql-results+json" },
    },
  )
    .then((resp) => resp.json())
    .then((data) => {
      let _sites: any = {};
      data.results.bindings.forEach((b: any) => {
        let siteId = b.site.value.split("/").pop();
        let _site = _sites[siteId];
        if (_site) {
          let itemId = b.itemId.value.split("/").pop();
          if (!_site.items.find((i: any) => i.id === itemId))
            _site.items.push({ id: itemId, url: b.url.value });
        } else {
          _site = {
            id: siteId,
            label: b.siteLabel.value,
            description: b.siteDescription?.value,
            logo: b.siteLogo?.value,
            items: [{ id: b.itemId.value, url: b.url.value }],
          };
          if (b.countryLabel) {
            _site.country = {
              label: b.countryLabel.value,
              symbol: b.countryChar?.value,
            };
          }
          _sites[siteId] = _site;
        }
      });
      sites.value = (Object.values(_sites) as Site[]).sort((a: Site, b: Site) =>
        a.label.localeCompare(b.label),
      );
    });
}
</script>

<style>
@import "../tailwind.css";

a {
  @apply underline text-blue-600 hover:text-blue-800 visited:text-purple-600;
}
</style>
