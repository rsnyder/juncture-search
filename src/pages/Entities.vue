<template>

  <ve-entity-grid aspect-base="2">
    <ul>
      <li>Q171497</li>
      <li>Q34687</li>
      <li>Q5194627</li>
      
      <li>Q157211</li>
      <li>Q5582</li>
      <li>Q20265518</li>
      <li>Q127216</li>
      
    </ul>
  </ve-entity-grid>
  
</template>
    
<script setup lang="ts">

  import { onMounted, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'

  const route = useRoute()

  const qid = ref<string>()
  watch(qid, () => console.log(qid.value))

  watch(route, () => {
    qid.value = Array.isArray(route.params.qid) ? route.params.qid[0]: route.params.qid
  })

  onMounted(() => {
    qid.value = Array.isArray(route.params.qid) ? route.params.qid[0]: route.params.qid
  })

</script>
  
<style>
  @import '../tailwind.css';
</style>