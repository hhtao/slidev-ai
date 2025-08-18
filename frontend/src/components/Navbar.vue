<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import Menubar from 'primevue/menubar';
import Button from 'primevue/button';
import Avatar from 'primevue/avatar';
import { useAuthStore } from '@/store/auth';
import { UPLOADS_BASE_URL } from '@/utils/api';
const router = useRouter();
const darkMode = ref(false);
const authStore = useAuthStore();

// Toggle dark mode
const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
    document.documentElement.classList.toggle('my-app-dark', darkMode.value)
    localStorage.setItem('darkMode', darkMode.value.toString())
}

// Logout function
const logout = async () => {
    await authStore.logout();
}

// Initialize dark mode from localStorage or system preference
onMounted(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
        darkMode.value = savedDarkMode === 'true'
        document.documentElement.classList.toggle('my-app-dark', darkMode.value)
    } else {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            darkMode.value = true
            document.documentElement.classList.add('my-app-dark')
        }
    }
});


// Define menu items
const items = ref([
    {
        label: 'Public Slides',
        icon: 'pi pi-globe',
        command: () => {
            router.push('/public')
        }
    },
    {
        label: 'My Slides',
        icon: 'pi pi-folder',
        visible: () => authStore.user !== null,
        command: () => {
            router.push('/dashboard')
        }
    }
])

</script>

<template>
    <div class="navbar">
        <Menubar :model="items">
            <template #start>
                <div class="flex align-items-center gap-2">
                    <img src="/favicon.svg" alt="logo" class="w-8 h-8" />
                    <span class="font-bold text-2xl">slidev-ai</span>
                </div>
            </template>

            <template #end>
                <div class="flex items-center gap-2">
                    <Button :icon="darkMode ? 'pi pi-moon' : 'pi pi-sun'" @click="toggleDarkMode" rounded text
                        class="text-2xl"
                    />
                    <a href="https://github.com/LSTM-Kirigaya/slidev-ai" target="_blank" rel="noopener noreferrer"
                        class="text-2xl p-button p-button-text p-button-rounded h-[var(--p-button-icon-only-width)]">
                        <i class="pi pi-github"></i>
                    </a>
                    <div v-if="authStore.user" class="h-[32px] flex items-center gap-2">
                            <Avatar
                                v-if="authStore.user.avatar"
                                :image="`${UPLOADS_BASE_URL}/avatars/${authStore.user.avatar}`"
                                shape="circle"
                                class="cursor-pointer"
                                title="我的信息"
                                @click="router.push(`/profile/${authStore.user.id}`)"
                            />
                            <Avatar
                                v-else
                                :label="authStore.user.username.charAt(0).toUpperCase()"
                                shape="circle"
                                class="cursor-pointer"
                                title="我的信息"
                                @click="router.push(`/profile/${authStore.user.id}`)"
                            />
                        <Button label="Logout" @click="logout" icon="pi pi-sign-out" text size="small" />
                    </div>
                    <Button v-else label="Login" @click="router.push('/login')" icon="pi pi-sign-in" />
                </div>
            </template>
        </Menubar>
    </div>
</template>

<style scoped>
.navbar {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    z-index: 100;
}

:deep(.p-menubar) {
    border-radius: 0;
    border: none;
    padding: 0.5rem 1rem;
}
</style>