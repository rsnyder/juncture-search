<template>
  <div ref="root" id="articles-list">
    <ul>
      <li v-for="(article, idx) in articles" :key="qid">
        <div
          class="flex bg-white border shadow-sm rounded-xl p-4 md:p-5 dark:bg-gray-800 dark:border-gray-700 dark:shadow-slate-700/[.7]"
        >
          <div class="mr-2 text-right">{{ idx + 1 }}.</div>
          <div class="flex-col">
            <a
              class="text-lg font-medium text-blue-600 dark:text-blue-500 hover:underline"
              :href="article.url"
              target="_blank"
              v-html="article?.title || 'Untitled'"
            ></a>

            <div v-if="article.authors">
              <template
                v-for="(author, idx) in article.authors"
                :key="`author-${idx}`"
              >
                <template v-if="idx > 0">, </template>
                <ve-entity-infobox
                  v-if="author.id"
                  :qid="author.id"
                  v-html="author.label"
                ></ve-entity-infobox>
                <span v-else v-html="author.label"></span>
              </template>
            </div>

            <div v-html="citation_line(article)"></div>

            <div
              v-if="article.main_subjects"
              class="flex items-center flex-wrap space-x-2 mt-1"
            >
              <span class="text-md text-gray-600 dark:text-gray-400"
                >Subjects:</span
              >
              <template
                v-for="(subject, idx) in article.main_subjects"
                :key="subject.id"
              >
                <template v-if="idx > 0">, </template>
                <ve-entity-infobox
                  :qid="subject.id"
                  v-html="subject.label"
                ></ve-entity-infobox>
              </template>
            </div>

            <div class="flex items-center mt-2">
              <a
                class="h-4"
                href="javascript;;"
                @click="articleSelected(article, $event)"
                title="Show details modal"
              >
                <img
                  v-if="article.logo"
                  class="h-6 mr-[9px]"
                  :src="article.logo"
                  :alt="`${article.provider} logo`"
                />
              </a>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>

  <ve-modal-twp>
    <ve-article-card :article="selectedArticle"></ve-article-card>
  </ve-modal-twp>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";

import "@shoelace-style/shoelace/dist/components/dialog/dialog.js";
import "@shoelace-style/shoelace/dist/components/tooltip/tooltip.js";

import type { Article } from "../types";

const emit = defineEmits(["item-selected", "get-next"]);

const store = useEntitiesStore();
const { qid } = storeToRefs(store);

const props = defineProps({
  total: { type: Number, default: 0 },
  articles: { type: Array, default: () => [] },
  id: { type: String },
  active: { type: Boolean, default: true },
});

watch(props, () => {
  isActive.value = props.active;
  articles.value = props.articles as Article[];
});

const root = ref<HTMLElement | null>(null);
const shadowRoot = computed(() => root?.value?.parentNode);

const isActive = ref(props.active);

const selectedArticle = ref<Article | null>(null);
watch(selectedArticle, () => {
  if (selectedArticle.value) {
    let modal = shadowRoot.value?.querySelector("ve-modal-twp");
    let isOpen = modal?.getAttribute("open") !== null;
    if (isOpen) modal?.removeAttribute("open");
    else modal?.setAttribute("open", "");
  }
});

let doLayoutDebounceTimer: any;

const width = ref(0);
watch(width, () => {
  clearTimeout(doLayoutDebounceTimer);
  doLayoutDebounceTimer = setTimeout(() => doLayout(), 50);
});

const articles = ref<Article[]>(props.articles as Article[]);
// watch(articles, () => { if (articles.value.length > 0) console.log(toRaw(articles.value)) })

function doLayout() {
  // console.log('doLayout')
}

function articleSelected(article: Article, evt: Event) {
  evt.preventDefault();
  emit("item-selected", article);
  selectedArticle.value = article;
}

onMounted(() => {
  // dialog = shadowRoot.value?.querySelector('.dialog')
  // dialog.addEventListener('sl-hide', (evt:CustomEvent) => showDialog.value = false )

  let priorScrollY = 0;
  let checkGetMore = () => {
    if (isActive.value) {
      let scrollDirection = window.scrollY > priorScrollY ? "down" : "up";
      priorScrollY = window.scrollY;
      if (
        scrollDirection === "down" &&
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 2000
      )
        emit("get-next");
    }
  };

  let debouncedScrollHandler = (func, timeout) => {
    let timer: any;
    return () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, timeout);
    };
  };

  window.addEventListener("scroll", debouncedScrollHandler(checkGetMore, 50));
});

watch(root, () => {
  if (root.value) {
    width.value = root.value?.clientWidth || 0;
    const resizeObserver = new ResizeObserver(() => {
      if (root.value?.clientWidth && root.value?.clientWidth !== width.value)
        width.value = root.value?.clientWidth;
    });
    resizeObserver.observe(root.value);
  }
});

function citation_line(a: Article) {
  if (a.citation_line) return a.citation_line;
  let parts: string[] = [];
  if (a.publications) parts.push(a.publications.map((p) => p.label).join(", "));
  if (a.volume) parts.push(`Vol. ${a.volume}`);
  if (a.issue) parts.push(`No. ${a.issue}`);
  if (a.publication_date) parts.push(`(${a.publication_date.getFullYear()})`);
  if (a.pages) parts.push(`pp. ${a.pages}`);
  return parts.join(", ");
}
</script>

<style>
@import "../tailwind.css";
</style>
