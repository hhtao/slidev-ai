import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/store/auth';

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/',
            redirect: '/public'
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
            path: '/themes',
            name: 'themes',
            component: () => import('@/views/dashboard/ThemeManager.vue'),
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
            path: '/slides/import',
            name: 'ImportSlide',
            component: () => import('../views/dashboard/ImportSlide.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/knowledge',
            name: 'knowledge',
            component: () => import('@/views/knowledge/KnowledgeManager.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/knowledge-slides',
            name: 'knowledge-slides',
            component: () => import('@/views/knowledge-slides/KnowledgeSlidevManager.vue'),
            meta: { requiresAuth: true }
        },
        {
            path: '/preview/:hash',
            name: 'preview',
            component: () => import('@/views/slides/Preview.vue')
        }
    ]
})

// 路由守卫
router.beforeEach((to, _from, next) => {
    const authStore = useAuthStore();

    // 检查路由是否需要认证
    if (to.meta?.requiresAuth && !authStore.user) {
        // 如果需要认证但没有登录，跳转到登录页
        next('/login');
    } else {
        // 否则正常导航
        next();
    }
});

export default router