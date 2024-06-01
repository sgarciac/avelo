import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import MapView from '../views/MapView.vue'
import StationView from '../views/StationView.vue'
import AboutView from '../views/AboutView.vue'
import DataView from '../views/DataView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/station/:id', component: StationView, name: 'station' },
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/map',
      name: 'map',
      component: MapView
    },
    {
      path: '/about',
      name: 'about',
      component: AboutView
    },
    {
      path: '/data',
      name: 'data',
      component: DataView
    }
  ]
})

export default router
