<template>
  <div ref="root">
    <section
      v-for="(section, sidx) in content"
      :key="sidx"
      :id="section.id || `section-${sidx}`"
      :class="Array.from(section.classes).join(' ')"
    >
      <!--
      <template v-if="section.classes.has('heading')">

        <header v-if="!fixedHeader" :class="`header${essayConfig['force-hamburger'] ? '' : ' responsive'}`">
          <img class="logo" @click="doMenuAction({action:'load-page', path:'/'})" :src="logo">
          <input class="menu-btn" type="checkbox" id="menu-btn"/>
          <label class="menu-icon" for="menu-btn"><span class="navicon"></span></label>
          <ul class="menu">
            <template v-if="loginsEnabled">
              <li v-if="isAuthenticated" @click="doMenuAction({action:'logout'})"><i :class="`fas fa-user`"></i>Logout</li>
              <li v-else @click="doMenuAction({action:'authenticate'})"><i :class="`fas fa-user`"></i>Login using Github</li>
            </template>
            <li v-for="navItem in nav" :key="navItem.path" @click="doMenuAction(navItem)">
              <i v-if="navItem.icon" :class="navItem.icon"></i>{{ navItem.label }}
            </li>
          </ul>
        </header>

        <div :style="section.backgroundImage ? `backgroundImage: url(${section.backgroundImage})` : ''" v-html="section.html"></div>
      </template>
      -->

      <div v-if="section.classes.has('heading')" v-html="section.html"></div>

      <div
        v-else-if="section.classes.has('footer')"
        v-html="section.html"
      ></div>

      <template v-else>
        <h1 v-if="section.heading" v-html="section.heading"></h1>
        <div v-if="section.html" v-html="section.html"></div>
        <component v-if="section.component" :is="section.component"></component>

        <div
          v-if="section.cards"
          :class="Array.from(section.cards.classes).join(' ')"
        >
          <template v-if="section.cards.classes.has('entities')">
            <div class="my-grid">
              <ve-entity-card
                v-for="(card, cidx) in section.cards.content"
                :key="`${sidx}-${cidx}`"
                :eid="card.qid"
              ></ve-entity-card>
            </div>
          </template>

          <template v-else>
            <div
              v-for="(card, cidx) in section.cards.content"
              :key="`${sidx}-${cidx}`"
              :id="card.id"
              :class="Array.from(card.classes).join(' ')"
            >
              <div v-if="card.media" class="media" v-html="card.media"></div>
              <h2 v-if="card.heading" v-html="card.heading"></h2>
              <div v-if="card.content.length > 0" class="card-text">
                <input type="checkbox" :id="`exp-${sidx}-${cidx}`" />
                <div class="clamp-wrapper">
                  <p
                    v-for="(contentItem, ccidx) in card.content"
                    :key="`${sidx}-${cidx}-${ccidx}`"
                    :id="contentItem.id"
                    :class="Array.from(contentItem.classes).join(' ')"
                    v-html="contentItem.html"
                  ></p>
                </div>
                <label :for="`exp-${sidx}-${cidx}`" role="button">more</label>
              </div>
            </div>
          </template>
        </div>

        <template v-if="section.subsections">
          <div
            v-for="(subsection, cidx) in section.subsections"
            :key="`${sidx}-${cidx}`"
            :id="subsection.id"
            :class="Array.from(subsection.classes).join(' ')"
          >
            <div v-if="subsection.html" v-html="subsection.html"></div>
            <component
              v-if="subsection.component"
              :is="subsection.component"
            ></component>
          </div>
        </template>
      </template>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, toRaw, watch } from "vue";
import { marked } from "marked";

import { useEntitiesStore } from "../store/entities";
import { storeToRefs } from "pinia";
const store = useEntitiesStore();
const { language } = storeToRefs(store);

const markdown = ref();
const html = computed(() => markdown.value && parseMarkdown(markdown.value));
const content = computed(() => html.value && parseHtml(html.value));

const props = defineProps({
  page: { type: String, default: "default" },
});

// watch(content, () => console.log(toRaw(content.value)))

onMounted(async () => {
  let mdUrl =
    process.env.NODE_ENV === "development"
      ? `pages/${language.value}/${props.page}.md`
      : `https://raw.githubusercontent.com/juncture-digital/search/main/public/pages/${language.value}/${props.page}.md`;
  // console.log(`mode=${process.env.NODE_ENV} mdUrl=${mdUrl}`)
  markdown.value = await getMarkdown(mdUrl);
});

async function getMarkdown(path: string) {
  let response = await fetch(path);
  return await response.text();
}

// Convert essay Markdown into HTML.  Markdown headings are used to infer content heirarchy
function parseMarkdown(markdown: string): string {
  let tmp = new DOMParser().parseFromString(
    marked.parse(markdown, { mangle: false, headerIds: false }),
    "text/html",
  ).children[0].children[1];
  let essay = document.createElement("div");
  let currentSection: any = essay;
  currentSection.setAttribute("data-id", "1");
  let segments: any[] = [];
  let segment: any;

  Array.from(tmp.querySelectorAll("param"))
    .filter(
      (param) =>
        Object.values(param.attributes).find(
          (attr) =>
            attr.nodeName !== "id" &&
            attr.nodeName !== "class" &&
            attr.nodeName !== "component",
        ) === undefined,
    )
    .forEach((param) => {
      let prior = param.previousElementSibling;
      if (prior && param.id) prior.id = param.id;
      if (prior && param.className) prior.className = param.className;
      if (prior && param.attributes.getNamedItem("component")) {
        if (param.attributes.getNamedItem("component")) {
          let componentAttr: any = param.attributes.getNamedItem("component");
          if (componentAttr)
            prior.setAttribute("data-component", componentAttr.value);
        }
      }
      if (param.parentElement) param.parentElement.removeChild(param);
    });

  Array.from(tmp.children as HTMLCollectionOf<HTMLElement>).forEach(
    (el: HTMLElement) => {
      if (el.tagName[0] === "H" && isNumeric(el.tagName.slice(1))) {
        let sectionLevel = parseInt(el.tagName.slice(1));
        if (segments) {
          segments.forEach(
            (segment) => (currentSection.innerHTML += segment.outerHTML),
          );
          segments = [];
          segment = null;
        }

        currentSection = new DOMParser().parseFromString(
          "<section></section>",
          "text/html",
        ).children[0].children[1].children[0];
        let elClasses = Array.from(el.classList);
        el.removeAttribute("class");
        if (el.id) {
          currentSection.id = el.id;
          el.removeAttribute("id");
        }
        if (el.dataset.component) {
          currentSection.setAttribute("data-component", el.dataset.component);
          el.removeAttribute("data-component");
        }
        if (!el.innerHTML) el.style.display = "none";
        currentSection.innerHTML += el.outerHTML;

        let headings = Array.from(
          essay.querySelectorAll(`H${sectionLevel - 1}`),
        );
        let parent: any =
          sectionLevel === 1 || (headings && headings.length > 0)
            ? headings.pop()?.parentElement
            : null;
        if (parent) {
          let parentDataID = parent.dataset.id || "";
          let sectionSeq =
            parent.querySelectorAll(`H${sectionLevel}`).length + 1;
          let currentDataID = parentDataID
            ? `${parentDataID}.${sectionSeq}`
            : sectionSeq;
          currentSection.setAttribute("data-id", currentDataID);
        }

        if (elClasses.indexOf("cards") >= 0) {
          let wrapper = new DOMParser().parseFromString(
            `<section class="${elClasses.join(" ")}"></section>`,
            "text/html",
          ).children[0].children[1].children[0];
          currentSection.appendChild(wrapper);
        } else {
          currentSection.classList.add(...elClasses);
          let wrapper = parent ? parent.querySelector(":scope > .cards") : null;
          if (wrapper) {
            currentSection.classList.add("card");
            parent = wrapper;
          }
        }

        (parent || essay).appendChild(currentSection);
      } else if (
        el.tagName === "P" ||
        el.tagName === "UL" ||
        el.tagName === "OL"
      ) {
        let entityCardsSubsection =
          el.tagName === "UL"
            ? currentSection.querySelector("section.cards.entities")
            : null;
        if (entityCardsSubsection) {
          Array.from(el.children).forEach((child) => {
            let entityElem = new DOMParser().parseFromString(
              `<section class="card entity" data-qid="${child.innerHTML}"></section>`,
              "text/html",
            ).children[0].children[1].children[0];
            entityCardsSubsection.innerHTML += entityElem.outerHTML;
          });
        } else {
          let segID = `${currentSection.dataset.id}.${segments.length + 1}`;
          segment = new DOMParser().parseFromString("<div></div>", "text/html")
            .children[0].children[1].children[0];
          segment.setAttribute("data-id", segID);
          segment.setAttribute("id", segID);
          segment.classList.add("segment");
          segment.innerHTML = el.outerHTML;
          segments.push(segment);
        }
      } else {
        if (segment) {
          segment.innerHTML += el.outerHTML;
        } else {
          currentSection.innerHTML += el.outerHTML;
        }
      }
    },
  );
  if (segments) {
    segments.forEach(
      (segment) => (currentSection.innerHTML += segment.outerHTML),
    );
    segments = [];
  }

  return essay.innerHTML;
}

function // Creates content object from input HTML
parseHtml(html: string): any[] {
  let root = new DOMParser().parseFromString(html, "text/html").children[0]
    .children[1];
  return Array.from(
    root.querySelectorAll(":scope > section") as NodeListOf<HTMLElement>,
  ).map((section: HTMLElement) => {
    let classes = new Set(
      section.className.split(" ").filter((cls) => cls !== ""),
    );
    let backgroundImage = section.querySelector("p.background-image > img");
    let html: string = Array.from(section.querySelectorAll(":scope > .segment"))
      .filter((el) => !el.querySelector(".background-image"))
      .map((el) => el.innerHTML)
      .join(" ");
    let cards, subsections;

    let cardsSection = section.querySelector(":scope > section.cards");
    if (cardsSection) {
      let cardClasses = new Set(
        cardsSection.className.split(" ").filter((cls) => cls !== ""),
      );
      cards = {
        classes: cardClasses,
        content: Array.from(cardsSection.querySelectorAll("section")).map(
          (el) => {
            let card = <any>{};
            if (el.id) card.id = el.id;
            if (el.className)
              card.classes = new Set(
                el.className.split(" ").filter((cls) => cls !== ""),
              );
            if (el.dataset.qid) card.qid = el.dataset.qid;
            Object.entries({
              media: "video, p img",
              heading: "h1, h2, h3, h4, h5, h6",
            }).forEach((entry) => {
              let [fld, selector] = entry;
              let found = el.querySelector(selector);
              if (found)
                card[fld] = fld === "media" ? found.outerHTML : found.innerHTML;
            });
            card.content = Array.from(el.querySelectorAll("p, ul, ol"))
              .filter((cc) => cc.textContent)
              .map((cc) => {
                return {
                  html: cc.tagName === "P" ? cc.innerHTML : cc.outerHTML,
                  id: cc.id,
                  classes: new Set(
                    cc.className.split(" ").filter((cls) => cls !== ""),
                  ),
                };
              });
            return card;
          },
        ),
      };
    }

    if (!cards) {
      subsections = Array.from(
        section.querySelectorAll(":scope > section"),
      ).map((el: any) => {
        let resp: any = {
          html: el.innerHTML,
          classes: new Set(
            el.className.split(" ").filter((cls: string) => cls !== ""),
          ),
        };
        if (el.dataset.component) resp.component = el.dataset.component;
        return resp;
      });
    }

    let heading: any = section.querySelector("h1, h2, h3, h4, h5, h6");
    let result: any = {
      heading: heading ? heading.innerHTML : null,
      classes,
      html,
    };
    if (section.id) result.id = section.id;
    if (backgroundImage)
      result.backgroundImage = backgroundImage.attributes.getNamedItem("src");
    if (cards) result.cards = cards;
    if (subsections) result.subsections = subsections;
    if (section.dataset.component) result.component = section.dataset.component;

    return result;
  });
}

function isNumeric(arg: any): boolean {
  return !isNaN(arg);
}
</script>

<style>
.my-grid {
  display: grid;
  justify-items: center;
  /* 280px is the minimum a column can get, you might need to adjust it based on your needs. */
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  grid-gap: 10px;
}

.my-grid > * {
  width: 100%;
  max-width: 400px;
}

html {
  scroll-behavior: smooth;
}

.default section h1 {
  text-align: center;
  font-family: Georgia, "serif";
  font-size: 30px;
  margin-bottom: 40px;
}

section >>> p {
  font-size: 18px;
  font-weight: 300;
  line-height: 1.4;
}

section.center p {
  text-align: center;
}

section p.button {
  padding-top: 30px;
}

p.button a sup {
  display: none;
}

section .button a {
  color: #fff !important;
  background-color: #495867;
  border-radius: 50px;
  text-decoration: none;
  font-size: 24px;
  font-family: Roboto, "sans-serif";
  padding: 12px 48px;
  box-shadow: 0 3px 40px rgb(0 0 0 / 25%);
}

.fixed-header.header {
  position: fixed;
  top: 0;
  background-color: #495867;
}

.fixed-header > section:first-of-type {
  margin-top: 80px;
}

.heading .button a {
  color: #000 !important;
  background-color: #ffe55a;
  border-radius: 50px;
  text-decoration: none;
  font-size: 30px;
  font-family: Roboto, "sans-serif";
  padding: 16px 72px;
  box-shadow: 0px 3px 40px rgba(0, 0, 0, 0.25);
}

.notification {
  font-size: 1.4em;
  font-weight: 500;
}

/************ Footer ***********/
section.footer {
  padding: 24px;
  background-color: #222029 !important;
  color: white;
}

.footer ul {
  display: grid;
  grid-auto-flow: column;
  align-items: center;
  margin: 0;
  list-style: none;
  padding-inline-start: 0;
}

@media (max-width: 48em) {
  .footer ul {
    display: block;
  }
  .footer li {
    margin-bottom: 24px;
  }
}

.footer li:not(:first-child) {
  justify-self: end;
}

.footer li a {
  color: white !important;
  text-decoration: none;
}

.footer li a sup {
  display: none;
}

.footer img {
  height: 30px;
  padding: 4px 12px;
  vertical-align: middle;
}
/************ End Footer ***********/

/************ Cards ***********/
.cards {
  display: grid;
  grid-auto-flow: row;
  gap: 1em;
}

.card {
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.card h2 {
  /* margin-top: 40px; */
  margin-bottom: 0;
  font-weight: 400;
}

.card .media {
  text-align: center;
  /* min-height: 300px;*/
}

.card .media video {
  border-radius: 8px;
}

.card >>> img {
  width: 100%;
  max-height: 300px;
  border-radius: 8px;
}

.card p {
  font-size: 18px;
  font-weight: 300;
  line-height: 1.4;
  margin: 0;
}

.card p:first-of-type {
  padding-top: 20px;
}

.horizontal .card {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 50% 50%;
  grid-column: 1 / span3;
  align-items: flex-start;
  grid-template-areas:
    "card-heading card-media"
    "card-text    card-media";
}
.horizontal .card h2 {
  margin-top: 0;
  grid-area: card-heading;
  font-family: Georgia, "serif";
  font-size: 30px;
  font-weight: normal;
}
.horizontal .card .card-text {
  grid-area: card-text;
}
.horizontal .card .media {
  grid-area: card-media;
}

@media (min-width: 48em) {
  .cards {
    grid-auto-flow: column !important;
    grid-auto-columns: 1fr;
  }
}

@media (max-width: 48em) {
  #about .horizontal .card {
    display: block;
  }

  #about .horizontal .card .media {
    margin-bottom: 40px;
  }
}

.card input,
.card label {
  display: none;
}
/************ End Cards ***********/

/************ Card text clamping ***********/
.clamp input,
.clamp-5 input,
.clamp-10 input,
.clamp-15 input,
.clamp-20 input,
.clamp label,
.clamp-5 label,
.clamp-10 label,
.clamp-15 label,
.clamp-20 label {
  display: unset;
}

.clamp input,
.clamp-5 input,
.clamp-10 input,
.clamp-15 input,
.clamp-20 input {
  display: none;
  opacity: 0;
  position: absolute;
  pointer-events: none;
}
.clamp .clamp-wrapper,
.clamp-5 .clamp-wrapper,
.clamp-10 .clamp-wrapper,
.clamp-15 .clamp-wrapper,
.clamp-20 .clamp-wrapper {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}
.clamp-5 .clamp-wrapper {
  -webkit-line-clamp: 5;
}
.clamp-10 .clamp-wrapper {
  -webkit-line-clamp: 10;
}
.clamp-15 .clamp-wrapper {
  -webkit-line-clamp: 15;
}
.clamp-20 .clamp-wrapper {
  -webkit-line-clamp: 20;
}

.clamp-wrapper p {
  margin-block-start: 0;
}

.clamp input:focus ~ label,
.clamp-5 input:focus ~ label,
.clamp-10 input:focus ~ label,
.clamp-15 input:focus ~ label,
.clamp-20 input:focus ~ label {
  outline: -webkit-focus-ring-color auto 5px;
}
.clamp input:checked + div,
.clamp-5 input:checked + div,
.clamp-10 input:checked + div,
.clamp-15 input:checked + div,
.clamp-20 input:checked + div {
  -webkit-line-clamp: unset;
}
.clamp input:checked ~ label,
.clamp-5 input:checked ~ label,
.clamp-10 input:checked ~ label,
.clamp-15 input:checked ~ label,
.clamp-20 input:checked ~ label,
.clamp-wrapper:not(.truncated) ~ label {
  display: none;
}
.clamp label,
.clamp-5 label,
.clamp-10 label,
.clamp-15 label,
.clamp-20 label {
  border-radius: 4px;
  padding: 0.2em 0.6em 0.3em 0.6em;
  border: 1px solid #605c2a;
  background-color: #605c2a;
  color: #fff;
  font-size: 0.8em;
  cursor: pointer;
}
/************ End Card text clamping ***********/

/************ Menu ***********/
/* Pure CSS hamburger menu -  https://codepen.io/mutedblues/pen/MmPNPG */

/* header */

#default {
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: relative;
  color: black;
}

section {
  padding: 24px;
  background-color: white;
}

section:nth-child(odd) {
  background-color: #f5f5f5;
}

section h1 {
  text-align: center;
  font-family: Georgia, "serif";
  font-size: 30px;
  margin-bottom: 40px;
  font-weight: normal;
}

section.heading {
  display: grid;
  grid-template-rows: 58px 1fr;
  padding: 0;
  min-height: 400px;
}

section.heading header {
  grid-area: 1 / 1 / 2 / 2;
}

section.heading > div {
  grid-area: 1 / 1 / 3 / 2;
  align-self: center;
  justify-self: stretch;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center center;
  background-size: cover;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: #5b152e;
  color: white;
}

section.heading p {
  font-size: 2.5em;
  font-family: Georgia, "serif";
  font-weight: normal;
  line-height: 1.2;
  padding: 0;
  margin-left: 20%;
  margin-right: 20%;
  margin-top: 40px;
  margin-bottom: 0;
  text-align: center;
  color: white;
}

@media (max-width: 48em) {
  section.heading p {
    font-size: 2em;
  }
  .button a {
    font-size: 24px !important;
    padding: 8px 48px !important;
  }
}

.header {
  display: grid;
  grid-template-columns: auto 1fr auto auto;
  align-items: center;
  background-color: #495867;
  box-shadow: 1px 1px 4px 0 rgba(0, 0, 0, 0.1);
  width: 100%;
  z-index: 3;
}

.fixed-header .header {
  background-color: #495867;
  position: fixed;
  height: 80px;
}
.header,
.header ul,
.header li {
  background-color: transparent;
  color: white;
  border-right: none;
}
.fixed-header .header,
.fixed-header .header ul,
.fixed-header .header li {
  background-color: #495867;
  color: white;
  border-right: none;
}
.header ul {
  float: right;
  margin: -26px 0 0 0;
  padding: 0;
  list-style: none;
  overflow: hidden;
  filter: brightness(125%);
}

.header li {
  display: block;
  padding: 10px 20px;
  /* border-right: 1px solid #f4f4f4; */
  text-decoration: none;
  cursor: pointer;
}

.header li:hover {
  text-decoration: underline;
  filter: brightness(150%);
}

.header li svg {
  margin-right: 6px;
  min-width: 20px;
}

.header li a:hover,
.header .menu-btn:hover {
  background-color: #f4f4f4;
}

.header .logo {
  display: block;
  float: left;
  font-size: 2em;
  padding: 16px 36px;
  text-decoration: none;
  cursor: pointer;
}

img.logo {
  height: 48px;
  width: auto;
}

.version {
  font-size: 0.9rem;
  font-weight: 300;
}

/* menu */

.header .menu {
  clear: both;
  max-height: 0;
  display: none;
  transition: max-height 0.2s ease-out;
  position: absolute;
  top: 100px;
  right: 0;
}

/* menu icon */

.header .menu-icon {
  cursor: pointer;
  display: inline-block;
  /* float: right; */
  padding: 40px 36px;
  position: relative;
  user-select: none;
}

.header .menu-icon .navicon {
  background: #fff;
  display: block;
  height: 4px;
  border-radius: 2px;
  position: relative;
  transition: background 0.2s ease-out;
  width: 32px;
}

.header .menu-icon .navicon:before,
.header .menu-icon .navicon:after {
  background: #fff;
  content: "";
  display: block;
  height: 100%;
  position: absolute;
  transition: all 0.2s ease-out;
  width: 100%;
  border-radius: 2px;
}

.header .menu-icon .navicon:before {
  top: 10px;
}

.header .menu-icon .navicon:after {
  top: -10px;
}

/* menu btn */

.header .menu-btn {
  display: none;
}

.header .menu-btn:checked ~ .menu {
  /* max-height: 240px; */
  max-height: unset;
  display: unset;
}

.header .menu-btn:checked ~ .menu-icon .navicon {
  background: transparent;
}

.header .menu-btn:checked ~ .menu-icon .navicon:before {
  transform: rotate(-45deg);
}

.header .menu-btn:checked ~ .menu-icon .navicon:after {
  transform: rotate(45deg);
}

.header .menu-btn:checked ~ .menu-icon:not(.steps) .navicon:before,
.header .menu-btn:checked ~ .menu-icon:not(.steps) .navicon:after {
  top: 0;
}

/* 48em = 768px */
@media (min-width: 48em) {
  header.header.responsive li {
    float: left;
    padding: 20px 20px;
  }
  header.header.responsive ul {
    margin: 0;
  }
  header.header.responsive li a {
    padding: 20px 30px;
  }
  header.header.responsive .menu {
    clear: none;
    float: right;
    max-height: none;
  }
  header.header.responsive .menu-icon {
    display: none;
  }
}
/************ End Memu ***********/

.spacer {
  display: inline-block;
}
</style>
