<template>
  <div>
    <ve-claims :eid="eid"></ve-claims>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
const store = useEntitiesStore();
const { qid } = storeToRefs(store);

const props = defineProps({
  eid: { type: String },
});

const eid = ref();
// watch(eid, () => console.log(`statements: ${eid.value}`))

onMounted(() => (eid.value = props.eid || qid.value));
watch(qid, () => (eid.value = qid.value));
watch(props, () => (eid.value = props.eid));
</script>
