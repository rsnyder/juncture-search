<template>

  <div>
    <table ref="main" class="table table-condensed">
      <tr class="property" v-for="(vals, pid) in claims" :key="pid">
        
        <th>
          <div class="prop-label">
            <a :href="`https://www.wikidata.org/wiki/Property:${pid}`" 
               v-html="labels[pid]"
               :data-type="vals[0].mainsnak.snaktype == 'value' ? vals[0].mainsnak.datavalue?.type : ''"
               target="_blank"
            ></a>
          </div>
        </th>

        <td>

          <template v-if="entity.claims[pid].length > 5">
            <div class="collapsible">
              <input type="checkbox" name="collapse" :id="`${props.moduleId}-${pid}`">

              <h2 class="handle">
                <label :for="`${props.moduleId}-${pid}`" 
                  v-html="`${entity.claims[pid].length} ${translations['items'] || 'items'}.  ${translations['Show more'] || 'Show more'}.`"></label>
              </h2>

              <div class="prop-values-content">

                <div v-for="(pval, idx) in entity.claims[pid]" :key="`prop-${pid}-${idx}`">

                  <!-- Property -->
                  <template v-if="pval.mainsnak.snaktype == 'value'">
                    <template v-if="pval.mainsnak.datavalue?.type === 'wikibase-entityid'">
                      <!--
                      <span class="prop-value wikibase-entityid" v-html="labels[pval.mainsnak.datavalue.value.id]" 
                            :id="`prop-${pid}-${idx}-${pval.mainsnak.datavalue.value.id}`" :data-qid="pval.mainsnak.datavalue.value.id" 
                            @click="entitySelected">
                      </span>
                      -->
                      <ve-entity-infobox 
                        :qid="pval.mainsnak.datavalue.value.id" 
                        v-html="labels[pval.mainsnak.datavalue.value.id] || pval.mainsnak.datavalue.value.id"
                      ></ve-entity-infobox>
                      <!-- <span v-if="descriptions[pval.mainsnak.datavalue.value.id]" class="description" v-html="description(pval.mainsnak.datavalue.value.id)"></span> -->
                    </template>
                    <span v-else-if="pval.mainsnak.datavalue?.type === 'wikibase-property'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`">
                      <a :href="`http://www.wikidata.org/entity/${pval.mainsnak.datavalue.value.id}`" target="_blank" v-html="`${labels[pval.mainsnak.datavalue.value.id]} (${pval.mainsnak.datavalue.value.id})`"></a>
                    </span>
                    <span v-else-if="pval.mainsnak.datavalue?.type === 'quantity'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="quantity(pval.mainsnak.datavalue.value)"></span>
                    <span v-else-if="pval.mainsnak.datavalue?.type === 'time'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="formattedTime(pval.mainsnak.datavalue.value)"></span>
                    <template v-else-if="pval.mainsnak.datavalue?.type === 'monolingualtext'">
                      <span v-if="pval.mainsnak.datavalue.value.language === language" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="`${pval.mainsnak.datavalue.value.text}`"></span>
                    </template>
                    <template v-else-if="pval.mainsnak.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(pval.mainsnak.datavalue.value)">
                      <a :href="`https://commons.wikimedia.org/wiki/File:${pval.mainsnak.datavalue.value}`" target="_blank">
                        <img :class="`prop-value ${pval.mainsnak.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(pval.mainsnak.datavalue.value)}&w=200`">
                      </a>              
                      <br/><a :href="`https://commons.wikimedia.org/wiki/File:${pval.mainsnak.datavalue.value}`" target="_blank" v-html="pval.mainsnak.datavalue.value"></a>              
                    </template>
                    <audio v-else-if="pval.mainsnak.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(pval.mainsnak.datavalue.value)" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" controls>
                      <source :src="commonsURL(pval.mainsnak.datavalue.value)" :type="commonsMediaAudioMime(pval.mainsnak.datavalue.value)">
                    </audio>
                    <a v-else-if="pval.mainsnak.datavalue?.type === 'url'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" :href="pval.mainsnak.datavalue.value" v-html="pval.mainsnak.datavalue.value" target="_blank"></a>
                    <a v-else-if="pval.mainsnak.datavalue?.type === 'external-id'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="pval.mainsnak.datavalue.value" :href="formatURL(pval.mainsnak.datavalue.value, pid)" target="_blank"></a>
                    <a v-else-if="pval.mainsnak.datavalue?.type === 'globecoordinate'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="coords(pval.mainsnak.datavalue.value)" target="_blank"></a>
                    <span v-else :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="pval.mainsnak.datavalue.value"></span>
                  </template>

                  <!-- qualifiers -->
                  <div v-if="pval.qualifiers" class="qualifier" v-for="(values, pid) in pval.qualifiers" :key="`qual-${pid}`">
                    <a class="prop-label" v-html="labels[pid] || pid" :href="`https://www.wikidata.org/wiki/Property:${pid}`"></a>:
                    <template v-for="(val, vidx) in values">
                      <template v-if="val.snaktype == 'value'">
                        <template v-if="val.datavalue?.type === 'wikibase-entityid'">
                          <!--
                          <span :class="`prop-value ${val.datavalue?.type}`" :key="`qual-${pid}-${vidx}`" v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                                :id="`qual-${pid}-${val.datavalue.value.id}`" :data-qid="val.datavalue.value.id" 
                                @click="entitySelected">
                          </span>
                          -->
                          <ve-entity-infobox 
                            :qid="val.datavalue.value.id" 
                            v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                          ></ve-entity-infobox>
                        </template>
                        <span v-else-if="val.datavalue?.type === 'quantity'" :class="`prop-value ${val.datavalue?.type}`" v-html="quantity(val.datavalue.value)"></span>
                        <span v-else-if="val.datavalue?.type === 'time'" :class="`prop-value ${val.datavalue?.type}`" v-html="formattedTime(val.datavalue.value)"></span>
                        <template v-else-if="val.datavalue?.type === 'monolingualtext'">
                          <span v-if="val.datavalue.value.language === language" :class="`prop-value ${val.datavalue?.type}`" v-html="`${val.datavalue.value.text}`"></span>
                        </template>
                        <img v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(val.datavalue.value)}&w=200`">                    
                        <audio v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" controls>
                          <source :src="commonsURL(val.datavalue.value)" :type="commonsMediaAudioMime(val.datavalue.value)">
                        </audio>
                        <a v-else-if="val.datavalue?.type === 'url'" :class="`prop-value ${val.datavalue?.type}`" :href="val.datavalue.value" v-html="val.datavalue.value" target="_blank"></a>
                        <a v-else-if="val.datavalue?.type === 'external-id'" :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value" :href="formatURL(val.datavalue.value, pid)" target="_blank"></a>
                        <a v-else-if="val.datavalue?.type === 'globecoordinate'" :class="`prop-value ${val.datavalue?.type}`" v-html="coords(val.datavalue.value)" target="_blank"></a>
                        <span v-else :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value"></span>
                      </template>
                    </template>
                  </div>
                  <!-- end qualifiers -->

                  <!-- references -->
                  <div v-if="pval.references" class="references collapsible">
                    <input type="checkbox" name="collapse" :id="`${props.moduleId}-${pid}-${idx}`">
                    <h2 class="handle">
                      <label :for="`${props.moduleId}-${pid}-${idx}`" 
                              v-html="`${pval.references.length} ${pval.references.length === 1 ? translations['reference'] || 'reference' : translations['references'] || 'references'}`"></label>
                    </h2>
                    <div class="ref-content">
                      <div class="reference" v-for="(reference, ridx) in pval.references" :key="`rf${ridx}`">
                          <div v-for="(values, pid, pidx) in reference.snaks" :key="`r${ridx}-${pidx}`">
                            <a class="prop-label" v-html="labels[pid] || pid" :href="`https://www.wikidata.org/wiki/Property:${pid}`"></a>:
                            <template v-for="(val, idx) in values">
                              
                              <template v-if="val.snaktype == 'value'">
                              
                                <template v-if="val.datavalue?.type === 'wikibase-entityid'">
                                  <!--
                                  <span :class="`prop-value ${val.datavalue?.type}`" :key="`r${ridx}-${pidx}-${idx}`" v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                                        :id="`r${ridx}-${pidx}-${val.datavalue.value.id}`" :data-qid="val.datavalue.value.id"
                                        @click="entitySelected">
                                  </span>
                                  -->
                                  <ve-entity-infobox 
                                    :qid="val.datavalue.value.id" 
                                    v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                                  ></ve-entity-infobox>
                                  <!-- <span v-if="descriptions[val.datavalue.value.id]" class="description" v-html="description(val.datavalue.value.id)"></span> -->
                                </template>
                                <span v-else-if="val.datavalue?.type === 'quantity'" :class="`prop-value ${val.datavalue?.type}`" v-html="quantity(val.datavalue.value)"></span>
                                <span v-else-if="val.datavalue?.type === 'time'" :class="`prop-value ${val.datavalue?.type}`" v-html="formattedTime(val.datavalue.value)"></span>
                                <template v-else-if="val.datavalue?.type === 'monolingualtext'">
                                  <span v-if="val.datavalue.value.language === language" :class="`prop-value ${val.datavalue?.type}`" v-html="`${val.datavalue.value.text}`"></span>
                                </template>
                                <img v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(val.datavalue.value)}&w=200`">                    
                                <audio v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" controls>
                                  <source :src="commonsURL(val.datavalue.value)" :type="commonsMediaAudioMime(val.datavalue.value)">
                                </audio>
                                <a v-else-if="val.datavalue?.type === 'url'" :class="`prop-value ${val.datavalue?.type}`" :href="val.datavalue.value" v-html="val.datavalue.value" target="_blank"></a>
                                <a v-else-if="val.datavalue?.type === 'external-id'" :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value" :href="formatURL(val.datavalue.value, pid)" target="_blank"></a>
                                <a v-else-if="val.datavalue?.type === 'globecoordinate'" :class="`prop-value ${val.datavalue?.type}`" v-html="coords(val.datavalue.value)" target="_blank"></a>
                                <span v-else :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value"></span>
                              </template>
                            </template>
                          </div>
                      </div>
                    </div>
                  </div>
                  <!-- end references -->

                </div>

              </div>
            </div>
          </template>

          <template v-else>
            <div v-for="(pval, idx) in entity.claims[pid]" :key="`prop-${pid}-${idx}`">

              <!-- Property -->
              <template v-if="pval.mainsnak.snaktype == 'value'">
                
                <template v-if="pval.mainsnak.datavalue?.type === 'wikibase-entityid'">
                  <!--
                  <span :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="labels[pval.mainsnak.datavalue.value.id] || pval.mainsnak.datavalue.value.id"
                        :id="`prop-${pid}-${idx}-${pval.mainsnak.datavalue.value.id}`" :data-qid="pval.mainsnak.datavalue.value.id" 
                        @click="entitySelected">
                  </span>
                  -->
                  <ve-entity-infobox 
                    :qid="pval.mainsnak.datavalue.value.id" 
                    v-html="labels[pval.mainsnak.datavalue.value.id] || pval.mainsnak.datavalue.value.id"
                  ></ve-entity-infobox>
                  <!-- <span v-if="descriptions[pval.mainsnak.datavalue.value.id]" class="description" v-html="description(pval.mainsnak.datavalue.value.id)"></span> -->
                </template>
                
                <span v-else-if="pval.mainsnak.datavalue?.type === 'wikibase-property'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`">
                  <a :href="`http://www.wikidata.org/entity/${pval.mainsnak.datavalue.value.id}`" target="_blank" v-html="`${labels[pval.mainsnak.datavalue.value.id]} (${pval.mainsnak.datavalue.value.id})`"></a>
                </span>
                
                <span v-else-if="pval.mainsnak.datavalue?.type === 'quantity'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="quantity(pval.mainsnak.datavalue.value)"></span>
                
                <span v-else-if="pval.mainsnak.datavalue?.type === 'time'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="formattedTime(pval.mainsnak.datavalue.value)"></span>
                
                <template v-else-if="pval.mainsnak.datavalue?.type === 'monolingualtext'">
                  <span v-if="pval.mainsnak.datavalue.value.language === language" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="`${pval.mainsnak.datavalue.value.text}`"></span>
                </template>
                
                <template v-else-if="pval.mainsnak.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(pval.mainsnak.datavalue.value)">
                  <a :href="`https://commons.wikimedia.org/wiki/File:${pval.mainsnak.datavalue.value}`" target="_blank">
                    <img :class="`prop-value ${pval.mainsnak.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(pval.mainsnak.datavalue.value)}&w=200`">
                  </a>              
                  <br/><a :href="`https://commons.wikimedia.org/wiki/File:${pval.mainsnak.datavalue.value}`" target="_blank" v-html="pval.mainsnak.datavalue.value"></a>              
                </template>
                
                <audio v-else-if="pval.mainsnak.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(pval.mainsnak.datavalue.value)" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" controls>
                  <source :src="commonsURL(pval.mainsnak.datavalue.value)" :type="commonsMediaAudioMime(pval.mainsnak.datavalue.value)">
                </audio>
                
                <a v-else-if="pval.mainsnak.datavalue?.type === 'url'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" :href="pval.mainsnak.datavalue.value" v-html="pval.mainsnak.datavalue.value" target="_blank"></a>
                
                <a v-else-if="pval.mainsnak.datavalue?.type === 'external-id'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="pval.mainsnak.datavalue.value" :href="formatURL(pval.mainsnak.datavalue.value, pid)" target="_blank"></a>
                
                <a v-else-if="pval.mainsnak.datavalue?.type === 'globecoordinate'" :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="coords(pval.mainsnak.datavalue.value)" target="_blank"></a>
                
                <span v-else :class="`prop-value ${pval.mainsnak.datavalue?.type}`" v-html="pval.mainsnak.datavalue.value"></span>
              </template>

              <!-- qualifiers -->
              <div v-if="pval.qualifiers" class="qualifier" v-for="(values, pid) in pval.qualifiers" :key="`qual-${pid}`">
                <a class="prop-label" v-html="labels[pid] || pid" :href="`https://www.wikidata.org/wiki/Property:${pid}`"></a>:
                <template v-for="(val, vidx) in values">
                  <template v-if="val.snaktype == 'value'">
                    <template v-if="val.datavalue?.type === 'wikibase-entityid'">
                      <!--
                      <span :class="`prop-value ${val.datavalue?.type}`" :key="`qual-${pid}-${vidx}`" v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                            :id="`qual-${pid}-${val.datavalue.value.id}`" :data-qid="val.datavalue.value.id" 
                            @click="entitySelected">
                      </span>
                      -->
                      <ve-entity-infobox 
                        :qid="val.datavalue.value.id" 
                        v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                      ></ve-entity-infobox>
                      <!-- <span v-if="descriptions[val.datavalue.value.id]" class="description" v-html="description(val.datavalue.value.id)"></span> -->
                    </template>
                    <span v-else-if="val.datavalue?.type === 'quantity'" :class="`prop-value ${val.datavalue?.type}`" v-html="quantity(val.datavalue.value)"></span>
                    <span v-else-if="val.datavalue?.type === 'time'" :class="`prop-value ${val.datavalue?.type}`" v-html="formattedTime(val.datavalue.value)"></span>
                    <template v-else-if="val.datavalue?.type === 'monolingualtext'">
                      <span v-if="val.datavalue.value.language === language" :class="`prop-value ${val.datavalue?.type}`" v-html="`${val.datavalue.value.text}`"></span>
                    </template>
                    <img v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(val.datavalue.value)}&w=200`">                    
                    <audio v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" controls>
                      <source :src="commonsURL(val.datavalue.value)" :type="commonsMediaAudioMime(val.datavalue.value)">
                    </audio>
                    <a v-else-if="val.datavalue?.type === 'url'" :class="`prop-value ${val.datavalue?.type}`" :href="val.datavalue.value" v-html="val.datavalue.value" target="_blank"></a>
                    <a v-else-if="val.datavalue?.type === 'external-id'" :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value" :href="formatURL(val.datavalue.value, pid)" target="_blank"></a>
                    <a v-else-if="val.datavalue?.type === 'globecoordinate'" :class="`prop-value ${val.datavalue?.type}`" v-html="coords(val.datavalue.value)" target="_blank"></a>
                    <span v-else :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value"></span>
                  </template>
                </template>
              </div>
              <!-- end qualifiers -->

              <!-- references -->
              <div v-if="pval.references" class="references collapsible">
                <input type="checkbox" name="collapse" :id="`${props.moduleId}-${pid}-${idx}`">
                <h2 class="handle">
                  <label :for="`${props.moduleId}-${pid}-${idx}`" 
                          v-html="`${pval.references.length} ${pval.references.length === 1 ? translations['reference'] || 'reference' : translations['references'] || 'references'}`"></label>
                </h2>
                <div class="ref-content">
                  <div class="reference" v-for="(reference, ridx) in pval.references" :key="`r${ridx}`">
                      <div v-for="(values, pid, pidx) in reference.snaks" :key="`r${ridx}-${pidx}`">
                        <a class="prop-label" v-html="labels[pid] || pid" :href="`https://www.wikidata.org/wiki/Property:${pid}`"></a>:
                        <template v-for="(val, idx) in values">
                          <template v-if="val.snaktype == 'value'">
                            <template v-if="val.datavalue?.type === 'wikibase-entityid'">
                              <!--<span :class="`prop-value ${val.datavalue?.type}`" :key="`r${ridx}-${pidx}-${idx}`" v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                                    :id="`r${ridx}-${pidx}-${val.datavalue.value.id}`" :data-qid="val.datavalue.value.id"
                                    @click="entitySelected">
                              </span>
                              -->
                              <ve-entity-infobox 
                                :qid="val.datavalue.value.id" 
                                v-html="labels[val.datavalue.value.id] || val.datavalue.value.id"
                              ></ve-entity-infobox>
                              <!-- <span v-if="descriptions[val.datavalue.value.id]" class="description" v-html="description(val.datavalue.value.id)"></span> -->
                            </template>
                            <span v-else-if="val.datavalue?.type === 'quantity'" :class="`prop-value ${val.datavalue?.type}`" v-html="quantity(val.datavalue.value)"></span>
                            <span v-else-if="val.datavalue?.type === 'time'" :class="`prop-value ${val.datavalue?.type}`" v-html="formattedTime(val.datavalue.value)"></span>
                            <template v-else-if="val.datavalue?.type === 'monolingualtext'">
                              <span v-if="val.datavalue.value.language === language" :class="`prop-value ${val.datavalue?.type}`" v-html="`${val.datavalue.value.text}`"></span>
                            </template>
                            <img v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaImageMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" :src="`https://commons.wikimedia.org/w/thumb.php?f=${encodeURIComponent(val.datavalue.value)}&w=200`">                    
                            <audio v-else-if="val.datavalue?.type === 'commonsMedia' && commonsMediaAudioMime(val.datavalue.value)" :class="`prop-value ${val.datavalue?.type}`" controls>
                              <source :src="commonsURL(val.datavalue.value)" :type="commonsMediaAudioMime(val.datavalue.value)">
                            </audio>
                            <a v-else-if="val.datavalue?.type === 'url'" :class="`prop-value ${val.datavalue?.type}`" :href="val.datavalue.value" v-html="val.datavalue.value" target="_blank"></a>
                            <a v-else-if="val.datavalue?.type === 'external-id'" :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value" :href="formatURL(val.datavalue.value, pid)" target="_blank"></a>
                            <a v-else-if="val.datavalue?.type === 'globecoordinate'" :class="`prop-value ${val.datavalue?.type}`" v-html="coords(val.datavalue.value)" target="_blank"></a>
                            <span v-else :class="`prop-value ${val.datavalue?.type}`" v-html="val.datavalue.value"></span>
                          </template>
                        </template>
                      </div>
                  </div>
                </div>
              </div>
              <!-- end references -->

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
  import {Md5} from 'ts-md5'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { language, labels, qid, urlformatters } = storeToRefs(store)

  // watch(entity, () => console.log(toRaw(entity.value)))
  // watch(labels, () => console.log(toRaw(labels.value)))

  const props = defineProps({
    moduleId: { type: String, default: () => '' },
    eid: { type: String }
  })

  const eid = ref()
  // watch(eid, () => console.log(`claims: ${eid.value}`))

  const entity = computed(() => {
    return store.entities[eid.value]
  })
  // watch(entity, () => console.log(toRaw(entity.value)))

  onMounted(() => eid.value = props.eid || qid.value)
  watch(qid, () => eid.value = qid.value)
  watch(props, () => eid.value = props.eid || qid.value)

  const translations = {}

  type Dictionary<T> = { [key: string]: T };
   
  const imageMimeTypes: Dictionary<string> = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', svg: 'image/svg+xml'}
  const audioMimeTypes: Dictionary<string> = {ogg: 'audio/ogg', wav: 'audio/wav', mp3: 'audio/mpeg'}

  const exclude = new Set ([
    'P1472', // Commons Creator page'
    'P935',  // Commons gallery'
    'P373',  // Commons category
    'P5008', // on focus list of Wikimedia project
    'P2959', // permanent duplicated item
    'P910',  // topic's main category
  ])

  const claims = computed(() => {
    let _claims = entity.value?.claims
    return _claims && Object.keys(_claims).length > 0 && Object.keys(labels.value).length > 0
      ? Object.fromEntries(Object.keys(_claims)
        .filter(pid => !exclude.has(pid))
        .filter((pid: string) => _claims[pid][0].mainsnak.datavalue?.type !== 'external-id')
        .map((pid: string) => ( {pid, label: labels.value[pid] ? pid : pid } ))
        .sort((a: any, b: any) => (a.label.toLowerCase() > b.label.toLowerCase()) ? 1 : -1)
        .map((p: any) => p.pid)
        .map(pid => [pid, _claims[pid]]))
      : []
  })
  // watch(claims, () => console.log('claims', toRaw(claims.value)))

  function entitySelected(e: any) {
    store.setQid(e.target.dataset.qid)
  }

  function quantity(val: any): string {
    let amount = val.amount[0] === '+' ? val.amount.slice(1) : val.amount
    let nfObject = new Intl.NumberFormat('en-US')
    let amountFormatted = nfObject.format(amount)
    if (val.unit === '1') {
      return amountFormatted
    } else {
      let unitQid = val.unit.split('/').pop()
      let unitLabel = labels.value[unitQid] 
        ? `<a href="https://www.wikidata.org/entity/${unitQid}" target="_blank">${labels.value[unitQid]}</a>` 
        : val.unit
      return `${amountFormatted} ${unitLabel}`
    }
  }

    function formattedTime(val: any) {
      const precision = val.precision
      const time = val.time[0] === '+' ? val.time.slice(1) : val.time
      /* precision
          6: millennium
          7: century
          8: 10 years
          9: years
          10: months
          11: days */
      if (precision === 11) {
        return time.slice(0,10)
      } else if (precision === 10) {
        return time.slice(0,7)
      } else if (precision === 9) {
        return time.slice(0,4)
      } else if (precision === 8) {
        return `${time.slice(0,3)}0's`  
      } else if (precision === 7) {
        return `${time.slice(0,2)}00's`  
      }
    }

    function coords(val: any) {
      return `${val.latitude.toFixed(4)},${val.longitude.toFixed(4)}`
    }

    function formatURL(val: any, pid: any): string {
      return urlformatters.value[pid] ? urlformatters.value[pid].replace(/\$1/, val) : val
    }
    
    function commonsMediaImageMime(val: string): string {
      return imageMimeTypes[(val.split('.').pop() || '').toLowerCase()]
    }
    
    function commonsMediaAudioMime(val: string): string {
      return audioMimeTypes[(val.split('.').pop() || '').toLowerCase()]
    }
    
    function commonsURL(val: string) {
      val = decodeURIComponent(val).replace(/ /g, '_')
      const _md5 = Md5.hashStr(val)
      return `https://upload.wikimedia.org/wikipedia/commons/${_md5.slice(0,1)}/${_md5.slice(0,2)}/${val}`
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

  .prop-value.wikibase-entityid {
    cursor: pointer;
  }

  .commonsMedia {
    max-width: 100%;
  }

  .qualifier {
    padding-left: 12px;
  }

  .references {
    padding-left: 12px;
  }

  .reference {
      padding-bottom: 12px;
  }

  .collapsible > input[type="checkbox"]:checked ~ .ref-content {
    padding: 0 0 0 0px;
    border: 1px solid #e8e8e8;
    border-top: 0;
    height: auto;
    overflow: visible;
  }

  .reference:nth-child(even) {
    background-color: #f2f2f2;
  }
  .reference:nth-child(odd) {
    background-color: #fff;
  }

</style>