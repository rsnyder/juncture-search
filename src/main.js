import { createApp } from 'vue'
import App from './App.vue'
import store from './lib/store.js'
import router from './lib/router.js'
import { defineCustomElement } from 'vue'

import './themes/juncture.css'

import Auth from './components/Auth.ce.vue'
import BHL from './components/BHL.ce.vue'
import Claims from './components/Claims.ce.vue'
import CommonsCategories from './components/CommonsCategories.ce.vue'
import EntityCard from './components/EntityCard.ce.vue'
import EntityHeader from './components/EntityHeader.ce.vue'
import EntityInfoboxes from './components/EntityInfoboxes.ce.vue'
import ImageCard from './components/ImageCard.ce.vue'
import ImageGrid from './components/ImageGrid.ce.vue'
import JstorCC from './components/JstorCC.ce.vue'
import LanguageSelector from './components/LanguageSelector.ce.vue'
import Markdown from './components/Markdown.ce.vue'
import Modal from './components/Modal.ce.vue'
import Openverse from './components/Openverse.ce.vue'
import ProgressiveImageGrid from './components/ProgressiveImageGrid.ce.vue'
import Referencing from './components/Referencing.ce.vue'
import Sites from './components/Sites.ce.vue'
import Statements from './components/Statements.ce.vue'
import Tagged from './components/Tagged.ce.vue'
import Template from './components/Template.ce.vue'
import ThemeSelector from './components/ThemeSelector.ce.vue'
import Viewers from './components/Viewers.ce.vue'
import WikimediaCommons from './components/WikimediaCommons.ce.vue'
import WikidataImages from './components/WikidataImages.ce.vue'
import WikidataSearch from './components/WikidataSearch.ce.vue'

customElements.define('ve-auth', defineCustomElement(Auth))
customElements.define('ve-bhl', defineCustomElement(BHL))
customElements.define('ve-claims', defineCustomElement(Claims))
customElements.define('ve-commons-categories', defineCustomElement(CommonsCategories))
customElements.define('ve-entity-card', defineCustomElement(EntityCard))
customElements.define('ve-entity-header', defineCustomElement(EntityHeader))
customElements.define('ve-entity-infoboxes', defineCustomElement(EntityInfoboxes))
customElements.define('ve-image-card', defineCustomElement(ImageCard))
customElements.define('ve-image-grid', defineCustomElement(ImageGrid))
customElements.define('ve-jstor-cc', defineCustomElement(JstorCC))
customElements.define('ve-language-selector', defineCustomElement(LanguageSelector))
customElements.define('ve-markdown', defineCustomElement(Markdown))
customElements.define('ve-modal', defineCustomElement(Modal))
customElements.define('ve-openverse', defineCustomElement(Openverse))
customElements.define('ve-pig', defineCustomElement(ProgressiveImageGrid))
customElements.define('ve-referencing', defineCustomElement(Referencing))
customElements.define('ve-sites', defineCustomElement(Sites))
customElements.define('ve-statements', defineCustomElement(Statements))
customElements.define('ve-tagged', defineCustomElement(Tagged))
customElements.define('ve-template', defineCustomElement(Template))
customElements.define('ve-theme-selector', defineCustomElement(ThemeSelector))
customElements.define('ve-viewers', defineCustomElement(Viewers))
customElements.define('ve-wikimedia-commons', defineCustomElement(WikimediaCommons))
customElements.define('ve-wikidata-images', defineCustomElement(WikidataImages))
customElements.define('ve-wikidata-search', defineCustomElement(WikidataSearch))

const app = createApp(App)
app.use(router).use(store).mount('#app')
