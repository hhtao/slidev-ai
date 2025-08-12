import { createRouter, createWebHistory } from 'vue-router';

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
      component: () => import('@/views/users/Login.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/slides/Dashboard.vue')
    },
    {
      path: '/public',
      name: 'public',
      component: () => import('@/views/public/PublicSlides.vue')
    },
    {
      path: '/slides/create',
      name: 'create-slide',
      component: () => import('@/views/slides/CreateSlide.vue')
    },
    {
      path: '/slides/process/:id',
      name: 'slide-processing',
      component: () => import('@/views/slides/process/index.vue'),
      props: true
    },
    {
      path: '/preview/:hash',
      name: 'preview',
      component: () => import('@/views/slides/Preview.vue')
    }
  ]
})

export default router