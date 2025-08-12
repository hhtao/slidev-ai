<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Card from 'primevue/card';
import Message from 'primevue/message';
import { useAuthStore } from '@/store/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const email = ref('');
const password = ref('');
const error = ref('');

const handleSubmit = async () => {
    const res = await authStore.register({
        username: username.value,
        email: email.value,
        password: password.value
    });

    if (res.success) {
        router.push('/dashboard');
    } else {
        error.value = res.error || 'Registration failed';
    }
}
</script>

<template>
    <div>
        <div class="auth-container">
            <div class="auth-form">
                <div class="flex flex-col items-center mb-4">
                    <h1 class="text-3xl font-bold mt-2">slidev-ai</h1>
                    <p class="text-gray-600 mt-2">AI-powered presentation creation tool</p>
                </div>

                <Card>
                    <template #title>
                        <h2>Register</h2>
                    </template>

                    <template #content>
                        <form @submit.prevent="handleSubmit">
                            <div class="p-field mb-4">
                                <label for="username" class="block mb-2">Username</label>
                                <InputText id="username" v-model="username" type="text" required class="w-full" />
                            </div>

                            <div class="p-field mb-4">
                                <label for="email" class="block mb-2">Email</label>
                                <InputText id="email" v-model="email" type="email" required class="w-full" />
                            </div>

                            <div class="p-field mb-4 w-100">
                                <label for="password" class="block mb-2">Password</label>
                                <Password id="password" v-model="password" :feedback="false" toggleMask required
                                    class="w-full" />
                            </div>

                            <Button type="submit" label='Register' icon="pi pi-user-plus"
                                class="w-full mt-4" />

                            <div v-if="error" class="mt-4">
                                <Message severity="error">{{ error }}</Message>
                            </div>
                        </form>

                        <div class="mt-4 text-center">
                            <p>
                                Already have an account?
                                <Button @click="router.push('/login')" label='Login' link />
                            </p>
                        </div>
                    </template>
                </Card>
            </div>
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