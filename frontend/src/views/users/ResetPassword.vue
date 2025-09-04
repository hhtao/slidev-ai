<template>
    <div class="reset-password-container">
        <div class="reset-password-form">
            <div class="flex flex-col items-center mb-6">
                <h1 class="text-3xl font-bold mt-2">{{ t('reset-password.title') }}</h1>
                <p class="text-gray-600 m-2">{{ t('reset-password.validity') }}</p>
            </div>

            <Card>
                <template #content>
                    <div v-if="loading" class="flex flex-col items-center justify-center py-8 text-gray-500">
                        <i class="pi pi-spin pi-spinner text-2xl mb-3"></i>
                        {{ t('reset-password.loading') }}
                    </div>
                    
                    <div v-else-if="resetSuccess" class="text-center py-8">
                        <i class="pi pi-check-circle text-green-500 text-4xl mb-4"></i>
                        <h3 class="text-xl font-semibold mb-2">{{ t('reset-password.success-title') }}</h3>
                        <p class="text-gray-600 mb-4">{{ t('reset-password.success-message') }}</p>
                        <Button :label="t('reset-password.login-button')" @click="goToLogin" />
                    </div>
                    
                    <div v-else>
                        <Message v-if="error" severity="error" class="mb-4">{{ error }}</Message>
                        
                        <div class="mb-4">
                        </div>
                        
                        <form @submit.prevent="handleResetPassword">
                            <div class="p-field mb-4">
                                <label for="password" class="block mb-2">{{ t('reset-password.new-password') }}</label>
                                <Password id="password" v-model="password" :feedback="false" toggleMask required
                                    class="w-full" />
                            </div>
                            
                            <div class="p-field mb-4">
                                <label for="confirmPassword" class="block mb-2">{{ t('reset-password.confirm-password') }}</label>
                                <Password id="confirmPassword" v-model="confirmPassword" :feedback="false" toggleMask required
                                    class="w-full" />
                            </div>
                            
                            <Button type="submit" :label="t('reset-password.submit')" icon="pi pi-lock"
                                class="w-full mt-4" :disabled="isSubmitting" />
                        </form>
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from 'primevue/button';
import Password from 'primevue/password';
import Card from 'primevue/card';
import Message from 'primevue/message';
import { t } from '@/i18n/index';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

const route = useRoute();
const router = useRouter();

const hashId = route.params.hashId as string;
const password = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(true);
const isSubmitting = ref(false);
const resetSuccess = ref(false);

onMounted(() => {
    // Simulate loading check
    setTimeout(() => {
        loading.value = false;
    }, 500);
});

const validateForm = () => {
    if (!password.value || !confirmPassword.value) {
        error.value = t('reset-password.password-required');
        return false;
    }
    
    if (password.value !== confirmPassword.value) {
        error.value = t('reset-password.password-mismatch');
        return false;
    }
    
    if (password.value.length < 6) {
        error.value = t('reset-password.password-too-short');
        return false;
    }
    
    return true;
};

const handleResetPassword = async () => {
    error.value = '';
    
    if (!validateForm()) {
        return;
    }
    
    isSubmitting.value = true;
    
    try {
        const response = await axios.post(`${API_BASE_URL}/reset-password`, {
            hashId,
            newPassword: password.value
        });
        
        if (response.data.message === 'Password reset successfully') {
            resetSuccess.value = true;
        } else {
            error.value = response.data.message || t('reset-password.reset-failed');
        }
    } catch (err: any) {
        const errorMessage = err.response?.data?.message || t('reset-password.reset-failed');
        error.value = errorMessage;
    } finally {
        isSubmitting.value = false;
    }
};

const goToLogin = () => {
    router.push('/login');
};
</script>

<style scoped>
.reset-password-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 1rem;
    background-color: #f5f5f5;
}

.reset-password-form {
    width: 100%;
    max-width: 400px;
}

.my-app-dark .reset-password-container {
    background-color: #1e1e1e;
}
</style>