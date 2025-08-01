<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Card from 'primevue/card'
import ProgressBar from 'primevue/progressbar'
import Message from 'primevue/message'
import Button from 'primevue/button'
import { API_BASE_URL } from '@/utils/api'

const route = useRoute()
const router = useRouter()

const processingStatus = ref('Initializing...')
const progress = ref(0)
const error = ref('')
const eventSource = ref<EventSource | null>(null)
const isProcessing = ref(true)

// 处理SSE事件
const handleSSEEvent = (event: MessageEvent) => {
    try {
        const data = JSON.parse(event.data)

        // 根据事件类型处理不同的状态
        switch (data.type) {
            case 'progress':
                processingStatus.value = data.message
                progress.value = data.progress || progress.value
                break

            case 'completed':
                processingStatus.value = 'Processing completed!'
                progress.value = 100
                isProcessing.value = false

                // 可以在这里添加跳转到预览页面的逻辑
                // setTimeout(() => {
                //   router.push(`/preview/${data.previewHash}`)
                // }, 1000)
                break

            case 'error':
                error.value = data.message
                isProcessing.value = false
                break

            default:
                // 预留拓展点
                handleCustomEvent(data)
                break
        }
    } catch (e) {
        console.error('Error parsing SSE data:', e)
    }
}

// 预留的拓展点，供用户自定义处理事件
const handleCustomEvent = (data: any) => {
    console.log('Custom event received:', data)
    // 用户可以在这里添加自定义的事件处理逻辑
}

// 处理SSE连接错误
const handleSSEError = (event: Event) => {
  console.error('SSE connection error:', event)
  error.value = 'Connection error. Please try again.'
  isProcessing.value = false
}

// 初始化SSE连接
const initializeSSE = () => {
    const slideId = route.params.slideId
    if (!slideId) {
        error.value = 'Invalid slide ID'
        return
    }

    const token = localStorage.getItem('token')
    if (!token) {
        router.push('/login')
        return
    }

    // 建立SSE连接
    const url = `${API_BASE_URL}/slides/${slideId}/process`
    eventSource.value = new EventSource(url, {
        withCredentials: true
    })

    eventSource.value.addEventListener('message', handleSSEEvent)
    eventSource.value.addEventListener('error', handleSSEError)
}

// 取消处理
const cancelProcessing = () => {
    if (eventSource.value) {
        eventSource.value.close()
    }
    router.push('/dashboard')
}

// 组件挂载时初始化SSE连接
onMounted(() => {
    initializeSSE()
})

// 组件卸载时关闭SSE连接
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