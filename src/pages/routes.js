import {createRouter} from 'vue-router'
import Home from './Home.vue';
import Entity from './Entity.vue';
import Cache from './cache.vue';

const routes = [
  { name: 'home', path: '/', component: Home },

  { name: 'entity', path: '/entity/:qid', component: Entity },

  { name: 'cache', path: '/cache/:qid', component: Cache },

]

export default function (history) {
  return createRouter({
    history,
    routes
  })
}