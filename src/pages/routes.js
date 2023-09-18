import {createRouter} from 'vue-router'
import About from './About.vue';
import Home from './Home.vue';
import Entities from './Entities.vue';
import Entity from './Entity.vue';
import Markdown from './Markdown.vue';
import Tailwind from './Tailwind.vue';

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'about', path: '/about', component: About },
  { name: 'entity', path: '/entity/:qid', component: Entity },
  { name: 'entities', path: '/entities/', component: Entities },
  { name: 'md', path: '/md/:owner/:repo/:path*', component: Markdown },
  { name: 'tailwind', path: '/tailwind/:qid', component: Tailwind }
]

export default function (history) {
  return createRouter({
    history,
    routes
  })
}