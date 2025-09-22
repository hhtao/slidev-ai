<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import KnowledgeStage1Config from './KnowledgeStage1Config.vue';
import KnowledgeStage2Outline from './KnowledgeStage2Outline.vue';
import KnowledgeStage3Markdown from './KnowledgeStage3Markdown.vue';
import KnowledgeStage4Preview from './KnowledgeStage4Preview.vue';
import ProcessSteps from '@/components/ProcessSteps.vue';
import type { 
    KnowledgeSlideRequest, 
    KnowledgeSlideOutline, 
    KnowledgeSlidevProject,
    KnowledgeSlideProcessState 
} from './dto';

// PrimeVue 组件
import Button from 'primevue/button';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

const route = useRoute();
const router = useRouter();

// 获取查询参数
const stage = computed(() => route.query.stage || 'config');
const id = computed(() => route.query.id as string);

// 状态管理
const processState = ref<KnowledgeSlideProcessState>({
    stage: stage.value as any,
    id: id.value,
    isProcessing: false
});

// 验证参数
const isValid = computed(() => {
    // config阶段不需要id参数
    if (processState.value.stage === 'config') {
        return true;
    }
    // 其他阶段需要有效的id参数
    return processState.value.id && processState.value.id.trim() !== '';
});

// 步骤配置
const steps = computed(() => [
    {
        label: '配置生成',
        description: '选择知识库和配置主题',
        active: processState.value.stage === 'config',
        completed: ['outline', 'markdown', 'preview'].includes(processState.value.stage)
    },
    {
        label: '生成大纲',
        description: '基于知识库智能生成大纲',
        active: processState.value.stage === 'outline',
        completed: ['markdown', 'preview'].includes(processState.value.stage)
    },
    {
        label: '生成内容',
        description: '生成详细的Markdown内容',
        active: processState.value.stage === 'markdown',
        completed: processState.value.stage === 'preview'
    },
    {
        label: '预览导出',
        description: '预览和导出最终PPT',
        active: processState.value.stage === 'preview',
        completed: false
    }
]);

// 事件处理器
const handleConfigComplete = (slideId: string, request: KnowledgeSlideRequest) => {
    processState.value.id = slideId;
    processState.value.request = request;
    processState.value.stage = 'outline';
    
    router.push({
        path: '/knowledge-slides/process',
        query: { id: slideId, stage: 'outline' }
    });
};

const handleOutlineComplete = (outline: KnowledgeSlideOutline) => {
    processState.value.outline = outline;
    processState.value.stage = 'markdown';
    
    router.push({
        path: '/knowledge-slides/process',
        query: { id: processState.value.id, stage: 'markdown' }
    });
};

const handleMarkdownComplete = (project: KnowledgeSlidevProject) => {
    processState.value.project = project;
    processState.value.stage = 'preview';
    
    router.push({
        path: '/knowledge-slides/process',
        query: { id: processState.value.id, stage: 'preview' }
    });
};

const handlePreviewComplete = () => {
    // 可以跳转到仪表板或其他页面
    router.push('/knowledge-slides');
};

// 处理错误
const handleError = (error: string) => {
    processState.value.error = error;
    processState.value.isProcessing = false;
};

// 处理处理状态更新
const handleProcessingUpdate = (isProcessing: boolean) => {
    processState.value.isProcessing = isProcessing;
};

// 初始化
onMounted(() => {
    // 根据当前stage更新processState
    processState.value.stage = stage.value as any;
    processState.value.id = id.value;
});
</script>

<template>
    <div class="knowledge-slides-process">
        <!-- 页面头部 -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">🤖 智能PPT生成</h1>
                        <p class="text-gray-600 mt-1">基于知识库的智能演示文稿生成</p>
                    </div>
                    <Button 
                        label="返回首页" 
                        icon="pi pi-home" 
                        outlined 
                        @click="router.push('/knowledge-slides')"
                    />
                </div>
                
                <!-- 步骤指示器 -->
                <div class="mt-6">
                    <ProcessSteps :steps="steps" />
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="flex-1 bg-gray-50">
            <div v-if="!isValid" class="p-6 max-w-4xl mx-auto">
                <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="pi pi-exclamation-triangle text-red-500"></i>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">
                                参数无效，请检查URL参数
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <transition name="fade" mode="out-in">
                <KnowledgeStage1Config
                    v-if="processState.stage === 'config'" 
                    key="config"
                    :id="processState.id"
                    @complete="handleConfigComplete"
                    @error="handleError"
                    @processing-update="handleProcessingUpdate"
                />

                <KnowledgeStage2Outline
                    v-else-if="processState.stage === 'outline'" 
                    key="outline"
                    :id="processState.id!"
                    :request="processState.request"
                    @complete="handleOutlineComplete"
                    @error="handleError"
                    @processing-update="handleProcessingUpdate"
                />

                <KnowledgeStage3Markdown
                    v-else-if="processState.stage === 'markdown'" 
                    key="markdown"
                    :id="processState.id!"
                    :outline="processState.outline"
                    @complete="handleMarkdownComplete"
                    @error="handleError"
                    @processing-update="handleProcessingUpdate"
                />

                <KnowledgeStage4Preview
                    v-else-if="processState.stage === 'preview'" 
                    key="preview"
                    :id="processState.id!"
                    :project="processState.project"
                    @complete="handlePreviewComplete"
                    @error="handleError"
                />

                <div v-else class="p-6 max-w-4xl mx-auto" key="error">
                    <div class="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <i class="pi pi-exclamation-triangle text-red-500"></i>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-red-700">
                                    无效的处理阶段：{{ processState.stage }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </transition>
        </div>

        <!-- 全局错误显示 -->
        <div v-if="processState.error" class="fixed bottom-4 right-4 z-50">
            <Message severity="error" :closable="true" @close="processState.error = ''">
                {{ processState.error }}
            </Message>
        </div>

        <!-- 全局加载指示器 -->
        <div v-if="processState.isProcessing" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 shadow-xl">
                <div class="flex items-center space-x-3">
                    <ProgressSpinner style="width: 30px; height: 30px" stroke-width="4" />
                    <span class="text-lg font-medium">正在处理...</span>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.knowledge-slides-process {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>