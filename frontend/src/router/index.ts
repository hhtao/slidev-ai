import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

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
      path: '/register',
      name: 'register',
      component: () => import('@/views/users/Register.vue')
    },
    {
      path: '/reset-password/:hashId',
      name: 'reset-password',
      component: () => import('@/views/users/ResetPassword.vue'),
      props: true
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('@/views/dashboard/index.vue')
    },
    {
      path: '/invitations',
      name: 'invitations',
      component: () => import('@/views/dashboard/InvitationManager.vue'),
      beforeEnter: (_to, _from, next) => {
        const authStore = useAuthStore();
        if (authStore.user?.role === 'admin') {
          next();
        } else {
          next('/dashboard');
        }
      }
    },
    {
      path: '/public',
      name: 'public',
      component: () => import('@/views/public/PublicSlides.vue')
    },
    // 可选 userId 访问他人主页
    {
      path: '/profile/:userId',
      name: 'user-profile',
      component: () => import('@/views/users/Profile/index.vue'),
      props: true
    },
    {
      path: '/slides/process',
      name: 'slide-processing',
      component: () => import('@/views/slides/process/index.vue')
    },
    {
      path: '/preview/:hash',
      name: 'preview',
      component: () => import('@/views/slides/Preview.vue')
    }
  ]
})

export default router