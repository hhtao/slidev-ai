<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// PrimeVue components
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import Avatar from 'primevue/avatar'

const router = useRouter()
const user = ref<any>(null)
const darkMode = ref(false)

// Check if user is logged in
const checkAuthStatus = () => {
    const token = localStorage.getItem('token')
    if (token) {
        // In a real app, you would decode the token or fetch user data from the server
        // For now, we'll just set a placeholder
        user.value = {
            username: 'User',
            avatar: null
        }
    } else {
        user.value = null
    }
}

// Toggle dark mode
const toggleDarkMode = () => {
    darkMode.value = !darkMode.value
    document.documentElement.classList.toggle('my-app-dark', darkMode.value)
    localStorage.setItem('darkMode', darkMode.value.toString())
}

// Logout function
const logout = () => {
    localStorage.removeItem('token')
    user.value = null
    router.push('/login')
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

    checkAuthStatus()
})

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
        visible: () => user.value !== null,
        command: () => {
            router.push('/dashboard')
        }
    },
    {
        label: 'Create Slide',
        icon: 'pi pi-plus',
        visible: () => user.value !== null,
        command: () => {
            router.push('/create')
        }
    }
])

</script>

<template>
    <div class="navbar">
        <Menubar :model="items">
            <template #start>
                <div class="flex align-items-center">
                    <span class="font-bold text-2xl">slidev-ai</span>
                </div>
            </template>

            <template #end>
                <div class="flex items-center gap-2">
                    <Button :icon="darkMode ? 'pi pi-moon' : 'pi pi-sun'" @click="toggleDarkMode" rounded text />
                    <a href="https://github.com/LSTM-Kirigaya/slidev-ai" target="_blank" rel="noopener noreferrer"
                        class="p-button p-button-text p-button-rounded h-[var(--p-button-icon-only-width)]">
                        <i class="pi pi-github text-xl"></i>
                    </a>
                    <div v-if="user" class="h-[32px]">
                        <Avatar :label="user.username.charAt(0).toUpperCase()" shape="circle" />
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