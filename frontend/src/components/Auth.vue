<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// PrimeVue components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Card from 'primevue/card'
import Message from 'primevue/message'

const router = useRouter()

const isLogin = ref(true)
const username = ref('')
const email = ref('')
const password = ref('')
const error = ref('')

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const toggleForm = () => {
    isLogin.value = !isLogin.value
    error.value = ''
}

const handleSubmit = async () => {
    try {
        if (isLogin.value) {
            // Login
            const response = await axios.post(`${API_BASE_URL}/auth/login`, {
                username: username.value,
                password: password.value
            })

            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken)
                router.push('/dashboard')
            } else {
                error.value = response.data.error || 'Login failed'
            }
        } else {
            // Register
            const response = await axios.post(`${API_BASE_URL}/auth/register`, {
                username: username.value,
                email: email.value,
                password: password.value
            })

            if (response.data.accessToken) {
                localStorage.setItem('token', response.data.accessToken)
                router.push('/dashboard')
            }
        }
    } catch (err: any) {
        // Handle validation errors from the backend
        if (err.response && err.response.data && err.response.data.message) {
            if (Array.isArray(err.response.data.message)) {
                error.value = err.response.data.message.join(', ')
            } else {
                error.value = err.response.data.message
            }
        } else {
            error.value = 'An error occurred. Please try again.'
        }
        console.error(err)
    }
}
</script>

<template>
    <div class="auth-container">
        <div class="auth-form">
            <div class="text-center mb-4">
                <h1 class="text-3xl font-bold">slidev-ai</h1>
                <p class="text-gray-600 mt-2">AI-powered presentation creation tool</p>
            </div>

            <Card>
                <template #title>
                    <h2>{{ isLogin ? 'Login' : 'Register' }}</h2>
                </template>

                <template #content>
                    <form @submit.prevent="handleSubmit">
                        <div class="p-field mb-4">
                            <label for="username" class="block mb-2">Username</label>
                            <InputText id="username" v-model="username" type="text" required class="w-full" />
                        </div>

                        <div v-if="!isLogin" class="p-field mb-4">
                            <label for="email" class="block mb-2">Email</label>
                            <InputText id="email" v-model="email" type="email" required class="w-full" />
                        </div>

                        <div class="p-field mb-4 w-100">
                            <label for="password" class="block mb-2">Password</label>
                            <Password id="password" v-model="password" :feedback="false" toggleMask required
                                class="w-full" />
                        </div>

                        <Button type="submit" :label="isLogin ? 'Login' : 'Register'" icon="pi pi-sign-in"
                            class="w-full mt-4" />

                        <div v-if="error" class="mt-4">
                            <Message severity="error">{{ error }}</Message>
                        </div>
                    </form>

                    <div class="mt-4 text-center">
                        <p>
                            {{ isLogin ? "Don't have an account?" : "Already have an account?" }}
                            <Button @click="toggleForm" :label="isLogin ? 'Register' : 'Login'" link />
                        </p>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<style scoped>
.auth-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
}

.auth-form {
    width: 100%;
    max-width: 400px;
}
</style>