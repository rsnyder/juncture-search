<template>
  <div v-html="html"></div>
</template>

<script setup lang="ts">
import { onMounted, ref, toRaw, watch } from "vue";
import { useRoute } from "vue-router";
import { marked } from "marked";

marked.use({
  walkTokens(token: any) {
    const { type, raw } = token;

    // Modify paragraph blocks beginning and ending with $$.
    if (type === "paragraph" && raw.startsWith(".ve-")) {
      token.type = "code";
      token.lang = "juncture";
      // token.text = token.raw.slice(3, -3); // Remove the $$ boundaries.
      // token.tokens.length = 0; // Remove child tokens.
    }
  },
  renderer: {
    code(code, language) {
      // Use custom juncture renderer.
      if (language === "juncture") {
        // console.log(marked.parse("<h1>Title</h1>", { mangle: false, headerIds: false }),);
        // return `<div class="juncture">${code}</div>`;
        return `<ve-header title="Test" color="#990001">
              <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
              </ul>
            </ve-header>`;
      }

      // Use default code renderer.
      return false;
    },
  },
});

const route = useRoute();

const markdown = ref("");
const html = ref("");

watch([markdown], () => {
  html.value = marked.parse(markdown.value, {
    mangle: false,
    headerIds: false,
  });
  let tmp = new DOMParser().parseFromString(html.value, "text/html").children[0]
    .children[1];
});

watch(route, () => {
  getMarkdown();
});
onMounted(() => {
  const wcScript = document.createElement("script");
  wcScript.setAttribute(
    "src",
    "https://jstor-labs.github.io/tailwind-preline/dist/js/index.js",
  );
  wcScript.setAttribute("type", "module");
  document.head.appendChild(wcScript);
  getMarkdown();
});

function getMarkdown() {
  let owner = route.params.owner;
  let repo = route.params.repo;
  let path = Array.isArray(route.params.path)
    ? route.params.path.join("/")
    : route.params.path;
  path = path ? (/\.md$/.test(path) ? path : `${path}.md`) : "README.md";
  // console.log(owner, repo, path);
  fetch(`https://raw.githubusercontent.com/${owner}/${repo}/main/${path}`)
    .then((response) => response.text())
    .then((md) => (markdown.value = md));
}
</script>

<style></style>
