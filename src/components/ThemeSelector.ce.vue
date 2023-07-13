<template>
  <div>
    <sl-dropdown>
      <sl-button slot="trigger" caret v-html="selectedTheme.label"></sl-button>
      <sl-menu>
        <sl-menu-item v-for="theme in themes" v-html="theme.label" @click="selectedTheme = theme"></sl-menu-item>
      </sl-menu>
    </sl-dropdown>
  </div>

</template>

<script setup lang="ts">

  import { onMounted, ref, watch } from 'vue'
  import '@shoelace-style/shoelace/dist/components/button/button.js'
  import '@shoelace-style/shoelace/dist/components/dropdown/dropdown.js'
  import '@shoelace-style/shoelace/dist/components/icon/icon.js'
  import '@shoelace-style/shoelace/dist/components/menu/menu.js'
  import '@shoelace-style/shoelace/dist/components/menu-item//menu-item.js'

  const emit = defineEmits(['theme-selected'])

  const themes = [
    {code: 'light', label: 'Light', tooltip: 'Light theme'},
    {code: 'dark', label: 'Dark', tooltip: 'Dark theme'},
    {code: 'juncture', label: 'Juncture', tooltip: 'Juncture theme'}
  ]

  const props = defineProps({
    default: { type: String, default: 'light' }
  })

  const selectedTheme = ref<any>(themes.find(theme => theme.code === props.default))

  onMounted(() => evalProps() )
  watch(props, () => evalProps() )

  watch (selectedTheme, () => {
    emit('theme-selected', selectedTheme.value)
  })

  function evalProps() {
    selectedTheme.value = themes.find(theme => theme.code === props.default)
  }

</script>