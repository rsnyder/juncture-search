import {createRouter} from 'vue-router'
import Home from './Home.vue';
import Entity from './Entity.vue';
import Markdown from './Markdown.vue';

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'entity', path: '/entity/:qid', component: Entity },
  { name: 'md', path: '/md/:owner/:repo/:path*', component: Markdown }
]

export default function (history) {
  return createRouter({
    history,
    routes
  })
}