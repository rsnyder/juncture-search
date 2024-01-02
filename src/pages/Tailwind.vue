<template>
  <ve-entity-card v-if="qid" :qid="qid"></ve-entity-card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import EntityCard from "../components/EntityCard.vue";

const route = useRoute();

const qid = ref<string>();
watch(qid, () => console.log(qid.value));

watch(route, () => {
  qid.value = Array.isArray(route.params.qid)
    ? route.params.qid[0]
    : route.params.qid;
});

onMounted(() => {
  qid.value = Array.isArray(route.params.qid)
    ? route.params.qid[0]
    : route.params.qid;
});
</script>

<style>
@import "../tailwind.css";
</style>
