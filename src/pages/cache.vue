<template>

  <div>
    <pre>{{ data }}</pre>
  </div>
  
  </template>
    
  <script setup lang="ts">
  
    import { computed, ref, onMounted, toRaw, watch } from 'vue'
    import { useRoute } from 'vue-router'

    const route = useRoute()
    const qid = computed(() => route.params.qid )

    const data = <any>ref({})
    
    onMounted(async () => {
      await putData({key: 'value'})
      data.value = await getData()
    })

    async function getData() {
      console.log(`getData: qid=${qid.value}`)
      let resp = await fetch(`/api/cache/${qid.value}`)
      if (resp.status === 200) {
        return await resp.json()
      } else if (resp.status === 404) {
        console.log(`getData: qid=${qid.value} not found`)
        return {}
      }
    }

    async function putData(obj:any) {
      console.log(`putData: qid=${qid.value}`)
      let resp = await fetch(`/api/cache/${qid.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obj)
      })
      console.log(resp)
    }

  </script>
  
  <style>
  </style>

