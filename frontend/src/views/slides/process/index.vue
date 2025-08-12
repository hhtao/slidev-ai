<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Button from 'primevue/button';
import { API_BASE_URL } from '@/utils/api';

const route = useRoute();
const router = useRouter();

const error = ref('');
const eventSource = ref<EventSource | null>(null);
const isProcessing = ref(true);

type MessageItem = {
    type: 'toolcall' | 'toolcalled' | 'done';
    name?: string;
    status?: 'pending' | 'done';
};

const messages = ref<MessageItem[]>([]);

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

    const url = `${API_BASE_URL}/slides/process/make-outline/${id}`;
    eventSource.value = new EventSource(url, {
        withCredentials: true
    });

    eventSource.value.addEventListener('error', handleSSEError);
    eventSource.value.onmessage = (event) => {        
        try {
            const data = JSON.parse(event.data);

            if (data.type === 'toolcall') {
                // 新操作，加入队列
                messages.value.push({
                    type: 'toolcall',
                    name: data.toolcall.function.name,
                    status: 'pending'
                });
            } else if (data.type === 'toolcalled') {
                // 标记最后一个未完成的 toolcall 为 done
                for (let i = messages.value.length - 1; i >= 0; i--) {
                    if (messages.value[i].type === 'toolcall' && messages.value[i].status === 'pending') {
                        messages.value[i].status = 'done';
                        break;
                    }
                }
            }

            if (data.done) {
                isProcessing.value = false;
                messages.value.push({ type: 'done' });
                if (eventSource.value) eventSource.value.close();
            }
        } catch (error) {
            // ignore parse error
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
        <div class="header mb-4 flex align-items-center gap-2">
            <img src="/favicon.svg" alt="logo" class="w-8 h-8" />
            <h1>Processing Your Slide</h1>
        </div>

        <Card>
            <template #content>
                <div class="processing-content">
                    <div v-if="error" class="mb-4">
                        <Message severity="error">{{ error }}</Message>
                    </div>
                    <div class="dialog-flow">
                        <div v-for="(msg, idx) in messages" :key="idx" class="dialog-item">
                            <template v-if="msg.type === 'toolcall'">
                                <div class="flex items-center gap-2">
                                    <span class="pi pi-cog text-primary"></span>
                                    <span>
                                        正在执行操作：<b>{{ msg.name }}</b>
                                        <span v-if="msg.status === 'pending'" class="ml-2 text-xs text-gray-500">(进行中...)</span>
                                        <span v-else class="ml-2 text-xs text-green-600">(已完成)</span>
                                    </span>
                                </div>
                            </template>
                            <template v-else-if="msg.type === 'done'">
                                <div class="flex items-center gap-2 mt-2">
                                    <span class="pi pi-check-circle text-green-600"></span>
                                    <span class="font-bold text-green-700">流程已完成！</span>
                                </div>
                            </template>
                        </div>
                    </div>
                    <div class="flex justify-content-center mt-4">
                        <Button v-if="isProcessing" @click="cancelProcessing" label="取消" severity="secondary" />
                        <Button v-else @click="router.push('/dashboard')" label="返回仪表盘" />
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
.dialog-flow {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}
.dialog-item {
    padding: 0.75rem 1rem;
    background: #f8fafc;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.03);
}
.my-app-dark .dialog-item {
    background: #23272f;
}
</style>