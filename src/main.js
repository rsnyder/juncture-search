import { createApp } from 'vue'
import App from './App.vue'
import store from './lib/store.js'
import router from './lib/router.js'
import { defineCustomElement } from 'vue'

import './themes/juncture.css'
import './tailwind.css'

import { registerIconLibrary } from '@shoelace-style/shoelace/dist/utilities/icon-library.js';
registerIconLibrary('fa', {
    resolver: name => {
      const filename = name.replace(/^fa[rbs]-/, '');
      let folder = 'regular';
      if (name.substring(0, 4) === 'fas-') folder = 'solid';
      if (name.substring(0, 4) === 'fab-') folder = 'brands';
      return `https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.1/svgs/${folder}/${filename}.svg`;
    },
    mutator: svg => svg.setAttribute('fill', 'currentColor')
  })

import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js'
setBasePath('https://raw.githubusercontent.com//juncture-digital/search/main/src')

import ArticleCard from './components/ArticleCard.ce.vue'
import Articles from './components/Articles.ce.vue'
import ArticlesList from './components/ArticlesList.ce.vue'
import Auth from './components/Auth.ce.vue'
import Claims from './components/Claims.ce.vue'
import EntityCard from './components/EntityCard.ce.vue'
import EntityCardStack from './components/EntityCardStack.ce.vue'
import EntityGrid from './components/EntityGrid.ce.vue'
import EntityHeader from './components/EntityHeader.ce.vue'
import EntityInfobox from './components/EntityInfobox.ce.vue'
import EntityInfoboxes from './components/EntityInfoboxes.ce.vue'
import Header from './components/Header.ce.vue'
import Images from './components/Images.ce.vue'
import ImageCard from './components/ImageCard.ce.vue'
import ImageGrid from './components/ImageGrid.ce.vue'
import LanguageSelector from './components/LanguageSelector.ce.vue'
import Menu from './components/Menu.ce.vue'
import Markdown from './components/Markdown.ce.vue'
import Modal from './components/Modal.ce.vue'
import ModalTWP from './components/ModalTWP.ce.vue'
import Referencing from './components/Referencing.ce.vue'
import Sites from './components/Sites.ce.vue'
import Statements from './components/Statements.ce.vue'
import Template from './components/Template.ce.vue'
import Viewers from './components/Viewers.ce.vue'
import WikidataScholarlyArticles from './components/WikidataScholarlyArticles.ce.vue'
import WikidataSearch from './components/WikidataSearch.ce.vue'

customElements.define('ve-article-card', defineCustomElement(ArticleCard))
customElements.define('ve-articles', defineCustomElement(Articles))
customElements.define('ve-articles-list', defineCustomElement(ArticlesList))
customElements.define('ve-auth', defineCustomElement(Auth))
customElements.define('ve-claims', defineCustomElement(Claims))
customElements.define('ve-entity-card', defineCustomElement(EntityCard))
customElements.define('ve-entity-card-stack', defineCustomElement(EntityCardStack))
customElements.define('ve-entity-grid', defineCustomElement(EntityGrid))
customElements.define('ve-entity-header', defineCustomElement(EntityHeader))
customElements.define('ve-entity-infobox', defineCustomElement(EntityInfobox))
customElements.define('ve-entity-infoboxes', defineCustomElement(EntityInfoboxes))
customElements.define('ve-header', defineCustomElement(Header))
customElements.define('ve-images', defineCustomElement(Images))
customElements.define('ve-image-card', defineCustomElement(ImageCard))
customElements.define('ve-image-grid', defineCustomElement(ImageGrid))
customElements.define('ve-language-selector', defineCustomElement(LanguageSelector))
customElements.define('ve-markdown', defineCustomElement(Markdown))
customElements.define('ve-menu', defineCustomElement(Menu))
customElements.define('ve-modal', defineCustomElement(Modal))
customElements.define('ve-modal-twp', defineCustomElement(ModalTWP))
customElements.define('ve-pal', defineCustomElement(ArticlesList))
customElements.define('ve-referencing', defineCustomElement(Referencing))
customElements.define('ve-sites', defineCustomElement(Sites))
customElements.define('ve-statements', defineCustomElement(Statements))
customElements.define('ve-template', defineCustomElement(Template))
customElements.define('ve-viewers', defineCustomElement(Viewers))
customElements.define('ve-wikidata-scholarly-articles', defineCustomElement(WikidataScholarlyArticles))
customElements.define('ve-wikidata-search', defineCustomElement(WikidataSearch))

const app = createApp(App)
app.use(router).use(store).mount('#app')

console.log(`version=${process.env.npm_package_version} env=${process.env.NODE_ENV}`)
