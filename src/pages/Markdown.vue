<template>
  <div v-html="html"></div>
</template>
  
<script setup lang="ts">

  import { onMounted, ref, toRaw, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { marked } from 'marked'

  marked.use({
    walkTokens(token:any) {
      const { type, raw } = token;

      // Modify paragraph blocks beginning and ending with $$.
      if (type === 'paragraph' && raw.startsWith('.ve-')) {
        token.type = 'code';
        token.lang = 'juncture';
        // token.text = token.raw.slice(3, -3); // Remove the $$ boundaries.
        // token.tokens.length = 0; // Remove child tokens.
      }
    },
    renderer: {
      code(code, language) {
        // Use custom juncture renderer.
        if (language === 'juncture') {
          console.log(code)
          return `<div class="juncture">${code}</div>`;
        }

        // Use default code renderer.
        return false;
      }
    }
  })

  const route = useRoute()

  const markdown = ref('')
  const html = ref('')

  watch([markdown], () => {
    html.value = marked.parse(markdown.value, {mangle: false, headerIds: false})
    let tmp = new DOMParser().parseFromString(html.value, 'text/html').children[0].children[1]
    console.log(tmp)   
  })

  watch(route, () => { getMarkdown() })
  onMounted(() => { getMarkdown() })

  function getMarkdown() {
    let owner = route.params.owner
    let repo = route.params.repo
    let path = Array.isArray(route.params.path) ? route.params.path.join('/') : route.params.path
    path = path ? /\.md$/.test(path) ? path : `${path}.md` : 'README.md'
    console.log(owner, repo, path)
    fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`)
      .then(response => response.text())
      .then(md => markdown.value = md )
  }

</script>

<style>
</style>