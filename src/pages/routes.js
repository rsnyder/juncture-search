import {createRouter} from 'vue-router'
import Home from './Home.vue';
import Entity from './Entity.vue';

const routes = [
  { name: 'home', path: '/', component: Home },
  { name: 'entity', path: '/entity/:qid', component: Entity },
]

export default function (history) {
  return createRouter({
    history,
    routes
  })
}