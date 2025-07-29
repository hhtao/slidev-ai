import { createRouter, createWebHistory } from 'vue-router'
import Auth from '../components/Auth.vue'
import Dashboard from '../components/Dashboard.vue'
import CreateSlide from '../components/CreateSlide.vue'
import Preview from '../components/Preview.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard'
    },
    {
      path: '/login',
      name: 'login',
      component: Auth
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/create',
      name: 'create',
      component: CreateSlide
    },
    {
      path: '/preview/:hash',
      name: 'preview',
      component: Preview
    }
  ]
})

export default router