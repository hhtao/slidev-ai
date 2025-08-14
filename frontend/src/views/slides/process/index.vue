<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import { API_BASE_URL } from '@/utils/api';
import { OutlineItem } from './dto';
import EditableOutline from './EditableOutline.vue';
import { useToast } from 'primevue/usetoast';

const route = useRoute();
const router = useRouter();
const toast = useToast();

// State management
const error = ref<string>('');
const eventSource = ref<EventSource | null>(null);
const isProcessing = ref<boolean>(true);
const outlines = ref<OutlineItem[]>([]);
const connectionRetries = ref<number>(0);
const MAX_RETRIES = 3;

type MessageItem = {
    type: 'toolcall' | 'toolcalled' | 'done' | 'error';
    name?: string;
    status?: 'pending' | 'done' | 'failed';
    timestamp?: number;
    error?: string;
};

const messages = ref<MessageItem[]>([]);

// Computed properties
const outlineGenerated = computed<boolean>(() => {
    return outlines.value.length > 0 && outlines.value.some(outline => 
        outline.title.trim() !== '' || outline.content.trim() !== ''
    );
});

const processingProgress = computed<number>(() => {
    const total = messages.value.length;
    const completed = messages.value.filter(m => 
        m.type === 'toolcalled' || 
        (m.type === 'toolcall' && m.status === 'done')
    ).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
});

// Methods
const handleSSEError = (event: Event) => {
    console.error('SSE connection error:', event);
    
    if (connectionRetries.value < MAX_RETRIES) {
        connectionRetries.value++;
        toast.add({
            severity: 'warn',
            summary: 'Connection Issue',
            detail: `Attempting to reconnect (${connectionRetries.value}/${MAX_RETRIES})...`,
            life: 3000
        });
        setTimeout(initializeSSE, 2000 * connectionRetries.value);
        return;
    }
    
    error.value = 'Failed to establish connection after multiple attempts. Please try again later.';
    isProcessing.value = false;
    
    messages.value.push({
        type: 'error',
        status: 'failed',
        error: error.value,
        timestamp: Date.now()
    });
    
    toast.add({
        severity: 'error',
        summary: 'Connection Failed',
        detail: error.value,
        life: 5000
    });
};

const updateOutlines = (newOutlines: OutlineItem[]) => {
    if (Array.isArray(newOutlines)) {
        outlines.value = newOutlines.map(outline => ({
            title: outline.title || '',
            content: outline.content || ''
        }));
    }
};

const initializeSSE = () => {
    const id = route.params.id;
    if (!id || Array.isArray(id)) {
        error.value = 'Invalid slide ID';
        return;
    }

    try {
        const url = `${API_BASE_URL}/slides/process/make-outline/${id}`;
        eventSource.value = new EventSource(url, {
            withCredentials: true
        });

        eventSource.value.addEventListener('error', handleSSEError);
        
        eventSource.value.onmessage = (event) => {        
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'toolcall') {
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
                            const parsedArgs = JSON.parse(toolcall.function.arguments);
                            if (parsedArgs?.outline?.outlines) {
                                updateOutlines(parsedArgs.outline.outlines);
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
                    messages.value.push({ 
                        type: 'done',
                        timestamp: Date.now()
                    });
                    if (eventSource.value) {
                        eventSource.value.close();
                    }
                    toast.add({
                        severity: 'success',
                        summary: 'Processing Complete',
                        detail: 'Outline generation finished successfully',
                        life: 3000
                    });
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
    } catch (setupError) {
        error.value = 'Failed to initialize connection';
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
    initializeSSE();
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
            summary: 'Error',
            detail: newError,
            life: 5000
        });
    }
});
</script>

<template>
    <div class="p-4 max-w-4xl mx-auto">
        <Card>
            <template #title>
                <div class="flex justify-between items-center">
                    <h1>Presentation Outline Generator</h1>
                    <Button 
                        icon="pi pi-times" 
                        outlined 
                        @click="cancelProcessing" 
                        severity="secondary"
                        aria-label="Cancel processing"
                    />
                </div>
            </template>

            <template #content>
                <div v-if="error">
                    <Message severity="error" :closable="false">{{ error }}</Message>
                </div>

                <div v-else>
                    <!-- Processing state with progress -->
                    <div v-if="isProcessing && !outlineGenerated"
                        class="flex flex-col items-center justify-center py-10 space-y-4">
                        <ProgressSpinner />
                        <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div 
                                class="bg-blue-600 h-2.5 rounded-full" 
                                :style="{ width: `${processingProgress}%` }"
                            ></div>
                        </div>
                        <p class="mt-2 text-sm text-gray-600">
                            Progress: {{ processingProgress }}%
                        </p>
                        <p class="mt-2 text-center">
                            Generating outline...
                            <span class="block text-sm text-gray-500">Please wait while we process your presentation</span>
                        </p>
                    </div>

                    <!-- Message stream with timestamps -->
                    <div class="mb-6 space-y-3">
                        <div 
                            v-for="(message, index) in messages" 
                            :key="index" 
                            class="p-3 rounded transition-all"
                            :class="{
                                'bg-blue-50 border-l-4 border-blue-500': message.type === 'toolcall' && message.status === 'pending',
                                'bg-green-50 border-l-4 border-green-500': message.type === 'toolcalled',
                                'bg-purple-50 border-l-4 border-purple-500': message.type === 'done',
                                'bg-red-50 border-l-4 border-red-500': message.type === 'error'
                            }"
                        >
                            <div class="flex justify-between items-start">
                                <div>
                                    <span v-if="message.type === 'toolcall'" class="font-medium">
                                        <i class="pi pi-cog mr-2 animate-spin" v-if="message.status === 'pending'"></i>
                                        <i class="pi pi-check mr-2" v-else-if="message.status === 'done'"></i>
                                        {{ message.name || 'Unknown tool' }}
                                    </span>
                                    <span v-else-if="message.type === 'toolcalled'" class="font-medium">
                                        <i class="pi pi-check-circle mr-2"></i>
                                        Tool response received
                                    </span>
                                    <span v-else-if="message.type === 'done'" class="font-medium">
                                        <i class="pi pi-check-circle mr-2"></i>
                                        Process completed!
                                    </span>
                                    <span v-else-if="message.type === 'error'" class="font-medium text-red-600">
                                        <i class="pi pi-exclamation-triangle mr-2"></i>
                                        Error: {{ message.error || 'Unknown error' }}
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
                    </div>

                    <!-- Editable outline section -->
                    <div v-if="outlineGenerated" class="animate-fade-in">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-xl font-bold">Presentation Outline</h2>
                            <span class="text-sm text-gray-500">
                                {{ outlines.length }} {{ outlines.length === 1 ? 'slide' : 'slides' }}
                            </span>
                        </div>
                        <EditableOutline 
                            :outlines="outlines" 
                            @update:outlines="updateOutlines" 
                        />
                    </div>

                    <!-- Empty state -->
                    <div v-if="!isProcessing && !outlineGenerated" class="text-center py-10">
                        <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-600">Processing completed but no outline was generated.</p>
                        <Button 
                            label="Try Again" 
                            icon="pi pi-refresh" 
                            class="mt-4" 
                            @click="initializeSSE"
                        />
                    </div>
                </div>
            </template>

            <template #footer>
                <div class="flex justify-between items-center">
                    <Button 
                        label="Cancel" 
                        icon="pi pi-times" 
                        @click="cancelProcessing" 
                        severity="secondary"
                        :disabled="!isProcessing"
                    />
                    <div class="flex space-x-2">
                        <Button 
                            label="Save Draft" 
                            icon="pi pi-save" 
                            severity="info"
                            :disabled="isProcessing || !outlineGenerated"
                        />
                        <Button 
                            label="Continue to Markdown" 
                            icon="pi pi-arrow-right" 
                            iconPos="right"
                            :disabled="isProcessing || !outlineGenerated"
                            @click="() => router.push(`/slides/${route.params.id}/process/markdown`)"
                        />
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
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>