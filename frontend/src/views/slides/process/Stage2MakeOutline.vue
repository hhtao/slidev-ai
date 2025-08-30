<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { MessageItem, OutlineItem } from './dto';
import EditableOutline from './EditableOutline.vue';
import { useToast } from 'primevue/usetoast';
import { useSlidesStore } from '@/store/slide';
import { API_BASE_URL } from '@/utils/api';
import ProcessSteps from '@/components/ProcessSteps.vue';
import { t } from '@/i18n';
import { IamBusy, IamFree } from '@/utils/loading';

const props = defineProps<{
    id: number;
}>();

const emit = defineEmits<{
    (e: 'complete'): void;
    (e: 'update:outlines', outlines: OutlineItem[]): void;
}>();

const router = useRouter();
const toast = useToast();
const slidesStore = useSlidesStore();

// State management
const error = ref<string>('');
const eventSource = ref<EventSource | null>(null);
const isProcessing = ref<boolean>(false);
const outlines = ref<OutlineItem[]>([]);
const connectionRetries = ref<number>(0);
const MAX_RETRIES = 3;
const hasFinished = ref<boolean>(false); // 正常完成
const isBusy = ref<boolean>(false); // 收到 busy

const messages = ref<MessageItem[]>([]);

// Computed properties
const outlineGenerated = computed<boolean>(() => {
    return outlines.value.length > 0;
});

// Methods
const handleSSEError = (event: Event) => {
    console.error('SSE connection error:', event);
    // 如果已经完成或已判定 busy，不再重试
    if (hasFinished.value || isBusy.value) {
        return;
    }

    if (connectionRetries.value < MAX_RETRIES) {
        connectionRetries.value++;
        toast.add({
            severity: 'warn',
            summary: t('process.outline.connection-issue'),
            detail: t('process.outline.reconnect.attempt', String(connectionRetries.value), String(MAX_RETRIES)),
            life: 3000
        });
        setTimeout(initializeSSE, 2000 * connectionRetries.value);
        return;
    }

    error.value = t('process.outline.error.sse');
    isProcessing.value = false;
    IamFree();

    messages.value.push({
        type: 'error',
        status: 'failed',
        error: error.value,
        timestamp: Date.now()
    });

    toast.add({
    severity: 'error',
    summary: t('process.outline.connection-failed'),
        detail: error.value,
        life: 5000
    });
};

const updateOutlines = (newOutlines: OutlineItem[]) => {
    outlines.value = newOutlines;
    emit('update:outlines', newOutlines);
};

// 添加对EditableOutline组件的引用
const editableOutlineRef = ref<InstanceType<typeof EditableOutline> | null>(null);

const collapseAllPanels = () => {
    if (editableOutlineRef.value && editableOutlineRef.value.collapseAll) {
        editableOutlineRef.value.collapseAll();
    }
};


const saveOutlines = async () => {
    const id = props.id;
    if (!id) {
    error.value = t('process.outline.error.invalid-id');
        return;
    }

    try {
        await slidesStore.saveOutlines(id, outlines.value);
        toast.add({
            severity: 'success',
            summary: t('process.outline.save-success'),
            life: 3000,
        });
    } catch (error) {
        console.error('Error saving outlines:', error);
        toast.add({
            severity: 'error',
            summary: t('process.outline.error'),
            detail: t('process.outline.save-error') + error,
            life: 5000
        });        
    }

}

const gotoGenMarkdown = async () => {
    collapseAllPanels();
    await saveOutlines();

    setTimeout(() => {
        emit('complete');
    }, 500);
};

// 检查slide是否已经有outlines数据
const checkExistingOutlines = async () => {
    const id = props.id;
    if (!id) {
    error.value = t('process.outline.error.invalid-id');
        return;
    }

    try {
        // 获取slide数据
        const slideData = await slidesStore.getSlideById(id);
        
        if (!slideData) {
            error.value = t('process.outline.error.fetch-failed');
            return;
        }        

        
        // 检查是否有现成的outlines
        if (slideData.outlines) {
            try {
                let parsedOutlines = JSON.parse(slideData.outlines);
                console.log(parsedOutlines);
                
                if (typeof parsedOutlines === 'string') {
                    parsedOutlines = JSON.parse(parsedOutlines);
                }
                
                if (parsedOutlines && Array.isArray(parsedOutlines) && parsedOutlines.length > 0) {
                    updateOutlines(parsedOutlines);
                    isProcessing.value = false;
                    IamFree();

                    toast.add({
                        severity: 'success',
                        summary: t('process.outline.loaded-existing'),
                        detail: t('process.outline.using-existing'),
                        life: 3000
                    });
                    return true;
                }
            } catch (parseError) {
                console.error('Error parsing existing outlines:', parseError);
            }
        }

        // 如果没有现成的outlines，则初始化SSE
        initializeSSE();
        return false;
    } catch (err) {
    console.error('Error fetching slide data:', err);
    error.value = t('process.outline.error.fetch-failed');
        return false;
    }
};

const handleSSEMessage = async (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data);

        console.log('sse data', data);

        if (data.type === 'busy') {
            isBusy.value = true;
            isProcessing.value = false;
            IamFree();

            messages.value.push({ type: 'busy', status: 'failed', message: data.message, timestamp: Date.now() });
            toast.add({ severity: 'warn', summary: t('process.outline.slide-busy'), detail: data.message, life: 4000 });
            if (eventSource.value) {
                eventSource.value.close();
            }
            return;
        } else if (data.type === 'toolcall') {
            const toolcall = data.toolcall;
            const message: MessageItem = {
                type: 'toolcall',
                name: toolcall.function?.name,
                status: 'pending',
                timestamp: Date.now()
            };

            messages.value.push(message);

            if (toolcall.function?.name === 'slidev_save_outline') {
                try {
                    const args = JSON.parse(toolcall.function.arguments);
                    
                    if (args?.param?.outlines) {
                        updateOutlines(args.param.outlines);
                    }
                } catch (parseError) {
                    console.error('Error parsing outline:', parseError);
                }
            }

        } else if (data.type === 'toolcalled') {
            // Mark the last pending toolcall as done
            for (let i = messages.value.length - 1; i >= 0; i--) {
                if (messages.value[i].type === 'toolcall' && messages.value[i].status === 'pending') {
                    messages.value[i].status = 'done';
                    messages.value[i].timestamp = Date.now();
                    break;
                }
            }
        }

        if (data.done) {
            isProcessing.value = false;
            IamFree();
            hasFinished.value = true;

            
            toast.add({
                severity: 'success',
                summary: t('process.outline.processing-complete'),
                detail: t('process.outline.finished'),
                life: 3000
            });

            if (eventSource.value) {
                eventSource.value.close();
            }
        }
    } catch (parseError) {
        console.error('Error parsing SSE message:', parseError);
        messages.value.push({
            type: 'error',
            status: 'failed',
            error: 'Failed to parse server message',
            timestamp: Date.now()
        });
    }
};

const initializeSSE = () => {
    const id = props.id;
    if (!id || Array.isArray(id)) {
    error.value = t('process.outline.error.invalid-id');
        return;
    }

    isProcessing.value = true;
    IamBusy();

    try {
        const url = `${API_BASE_URL}/slides/process/make-outline/${id}`;
        eventSource.value = new EventSource(url, {
            withCredentials: true
        });

        eventSource.value.addEventListener('error', handleSSEError);
        eventSource.value.addEventListener('message', event => handleSSEMessage(event));
    } catch (setupError) {
        error.value = t('process.outline.error.init-conn');
        console.error('SSE setup error:', setupError);
    }
};

const cancelProcessing = () => {
    if (eventSource.value) {
        eventSource.value.close();
    }
    router.push('/dashboard');
};

const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
};

// Lifecycle hooks
onMounted(() => {
    checkExistingOutlines();
});

onUnmounted(() => {
    if (eventSource.value) {
        eventSource.value.close();
    }
});

// Watchers
watch(error, (newError) => {
    if (newError) {
        toast.add({
            severity: 'error',
            summary: t('process.outline.error'),
            detail: newError,
            life: 5000
        });
    }
});
</script>

<template>
    <div class="p-4 max-w-4xl mx-auto">
        <ProcessSteps />
        <Card>
            <template #content>
                <div v-if="error">
                    <Message severity="error" :closable="false">{{ error }}</Message>
                </div>

                <div v-else>
                    <!-- Processing state with progress -->
                    <div v-if="isProcessing && !outlineGenerated"
                        class="flex flex-col items-center justify-center py-10 space-y-4">
                        <ProgressSpinner />
                        <p class="mt-2 text-center">
                            {{ t('process.outline.generating') }}
                            <span class="block text-sm text-gray-500">{{ t('process.outline.generating.help') }}</span>
                        </p>
                    </div>

                    <!-- Message stream with timestamps -->
                    <div class="mb-6 space-y-3">
                        <transition-group name="message" tag="div" class="space-y-3">
                            <div v-for="(message, index) in messages" :key="index"
                                class="p-3 rounded transition-all animate-fade-in" :class="{
                                    'bg-purple-50 border-l-4 border-purple-500': message.type === 'done',
                                    'bg-red-50 border-l-4 border-red-500': message.type === 'error'
                                }">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <span v-if="message.type === 'toolcall'" class="font-medium">
                                            <i class="pi pi-cog mr-2 animate-spin"
                                                v-if="message.status === 'pending'"></i>
                                            <i class="pi pi-check mr-2" v-else-if="message.status === 'done'"></i>
                                            {{ message.name || t('process.outline.error.unknown-tool') }}
                                        </span>
                                        <span v-else-if="message.type === 'toolcalled'" class="font-medium">
                                            <i class="pi pi-check-circle mr-2"></i>
                                            {{ t('process.outline.tool-response') }}
                                        </span>
                                        <span v-else-if="message.type === 'error'" class="font-medium text-red-600">
                                            <i class="pi pi-exclamation-triangle mr-2"></i>
                                            {{ t('process.outline.error') }}: {{ message.error || t('process.outline.error.unknown') }}
                                        </span>
                                    </div>
                                    <span class="text-xs text-gray-500">
                                        {{ formatTimestamp(message.timestamp) }}
                                    </span>
                                </div>
                                <div v-if="message.status === 'pending'" class="mt-1">
                                    <ProgressSpinner style="width: 20px; height: 20px" />
                                </div>
                            </div>
                        </transition-group>
                    </div>

                    <!-- 显示可编辑的大纲 -->
                    <div v-if="outlineGenerated">
                        <h2 class="text-xl font-bold mb-4">{{ t('process.outline.generated') }}</h2>
                        <EditableOutline ref="editableOutlineRef" :outlines="outlines" @update:outlines="updateOutlines"
                            @collapse-all="() => { }" />
                    </div>

                    <!-- Empty state -->
                    <div v-if="!isProcessing && !outlineGenerated" class="text-center py-10">
                        <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">{{ t('process.outline.processing-completed-no-outline') }}</p>
                        <Button :label="t('process.outline.try-again')" icon="pi pi-refresh" class="mt-4" @click="initializeSSE" />
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-between items-center">
                    <Button :label="t('process.outline.cancel')" icon="pi pi-times" @click="cancelProcessing" severity="secondary"
                        :disabled="!isProcessing" />
                    <div class="flex space-x-2">
                        <Button :label="t('process.outline.save-draft')" icon="pi pi-save" severity="info"
                            :disabled="isProcessing || !outlineGenerated" @click="saveOutlines"/>
                        <Button :label="t('process.outline.continue')" icon="pi pi-arrow-right" icon-pos="right"
                            :disabled="isProcessing || !outlineGenerated" @click="gotoGenMarkdown" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.message-enter-active {
    transition: all 0.3s ease;
}

.message-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}
</style>