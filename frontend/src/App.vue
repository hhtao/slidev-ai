<script setup lang="ts">
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import { useAuthStore } from './store/auth';
import Toast from 'primevue/toast';
import Divider from 'primevue/divider';


const router = useRouter();
const authStore = useAuthStore();

// Check if user is authenticated
const checkAuth = async () => {
    const res = await authStore.login();
    if (!res.success) {
        router.push('/login');
    }
}

// Check auth on mount
onMounted(() => {
    checkAuth();
});
</script>

<template>
    <Toast />
    <Navbar />
    <div class="router-main">
        <router-view />
    </div>

    <!-- Footer -->
    <Divider />
    <div class="text-center p-4 text-gray-500 text-sm">
        Slidev AI - 由
        <a href="https://kirigaya.cn/about" target="_blank" class="text-primary">锦恢</a>
        和
        <a href="https://peacesheep.xyz/home" target="_blank" class="text-primary">太平羊羊</a>
        共同呈现
    </div>
</template>

<style>
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    color: #333;
    background-color: #f5f5f5;
}

.p-dataview-content {
    background-color: #f5f5f5 !important;
}

.my-app-dark body {
    background-color: #333;
}

.my-app-dark .p-dataview-content {
    background-color: #1c1c1c !important;
}

.router-main {
    min-height: calc(100vh - 150px);
}

#app {
    min-height: 100vh;
}

a {
    text-decoration: none;
    color: inherit;
}

.p-component {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}

/* Dark mode styles */
.my-app-dark {
    background-color: #1e1e1e;
    color: #e0e0e0;
}

.my-app-dark body {
    background-color: #1e1e1e;
    color: #e0e0e0;
}

.my-app-dark .p-card {
    background: #2d2d2d;
    color: #e0e0e0;
}


.my-app-dark .p-button {
    color: #fff;
}
</style>