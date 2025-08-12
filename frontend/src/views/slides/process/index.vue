<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Button from 'primevue/button';
import { API_BASE_URL } from '@/utils/api';

const route = useRoute();
const router = useRouter();

const processingStatus = ref('Initializing...');
const progress = ref(0);
const error = ref('');
const eventSource = ref<EventSource | null>(null);
const isProcessing = ref(true);

const handleSSEError = (event: Event) => {
    console.error('SSE connection error:', event);
    error.value = 'Connection error. Please try again.';
    isProcessing.value = false;
}

const initializeSSE = () => {
    const id = route.params.id;
    if (!id) {
        error.value = 'Invalid slide ID'
        return
    }

    // 在线生成大纲
    const url = `${API_BASE_URL}/slides/process/make-outline/${id}`;
    eventSource.value = new EventSource(url, {
        withCredentials: true
    });

    eventSource.value.addEventListener('error', handleSSEError);
    eventSource.value.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('process debug');
            console.log(data);
        } catch (error) {

        }
    };
}

const cancelProcessing = () => {
    if (eventSource.value) {
        eventSource.value.close()
    }
    router.push('/dashboard')
}


onMounted(() => {
    initializeSSE()
})

onUnmounted(() => {
    if (eventSource.value) {
        eventSource.value.close()
    }
})
</script>

<template>
    <div class="slide-processing p-4">
        <div class="header mb-4">
            <h1>Processing Your Slide</h1>
        </div>

        <Card>
            <template #content>
                <div class="processing-content">
                    <div class="mb-4">
                        <ProgressBar :value="progress" :showValue="true" class="mb-2" />
                        <p class="text-center">{{ processingStatus }}</p>
                    </div>

                    <div v-if="error" class="mb-4">
                        <Message severity="error">{{ error }}</Message>
                    </div>

                    <div class="flex justify-content-center">
                        <Button v-if="isProcessing" @click="cancelProcessing" label="Cancel" severity="secondary" />
                        <Button v-else @click="router.push('/dashboard')" label="Back to Dashboard" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.slide-processing {
    max-width: 800px;
    margin: 0 auto;
}

.processing-content {
    min-height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}
</style>