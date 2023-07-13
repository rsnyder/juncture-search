<template>

  <div ref="root">
    <h1 v-html="props.label"></h1>
    <span v-html="initCtr"></span>
  </div>

</template>

<script setup lang="ts">

  import { computed, onMounted, ref, toRaw, watch } from 'vue'

  import { useEntitiesStore } from '../store/entities'
  import { storeToRefs } from 'pinia'
  const store = useEntitiesStore()
  const { active, entity } = storeToRefs(store)

  const props = defineProps({
    label: { type: String, default: 'Template' },
    id: { type: String, default: 'template' },
  })

  const isActive = computed(() => active.value.split('/').pop() === props.id)

  const initCtr = ref(0)
  const qid = ref()

  watch(isActive, () => { if (entity.value.id !== qid.value && isActive.value) init() })
  watch(entity, () => { if (entity.value.id !== qid.value && isActive.value) init() })

  function init() {
    // Do expensive processing
    console.log(`init ${props.id}`)
    qid.value = entity.value.id
    ++initCtr.value
  }

</script>

<style>

  h1 {
    margin-top: 0;
    font-size: 1.6em;
  }

</style>