<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import ProgressSpinner from 'primevue/progressspinner';
import ProgressBar from 'primevue/progressbar';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import DataView from 'primevue/dataview';
import Textarea from 'primevue/textarea';

import type { 
    KnowledgeSlideRequest, 
    KnowledgeSlideOutline, 
    KnowledgeMessageItem 
} from './dto';
import { knowledgeBasedSlideApi } from '@/api/knowledge-based-slide';

// 缺少的导入
import InputText from 'primevue/inputtext';

const props = defineProps<{
    id: string;
    request?: KnowledgeSlideRequest;
}>();

const emit = defineEmits<{
    (e: 'complete', outline: KnowledgeSlideOutline): void;
    (e: 'error', error: string): void;
    (e: 'processing-update', isProcessing: boolean): void;
}>();

const toast = useToast();

// 状态管理
const isGenerating = ref(false);
const error = ref('');
const eventSource = ref<EventSource | null>(null);
const generatedOutline = ref<KnowledgeSlideOutline | null>(null);
const messages = ref<KnowledgeMessageItem[]>([]);
const connectionRetries = ref(0);
const hasFinished = ref(false);
const currentRequest = ref<KnowledgeSlideRequest | null>(null);

// 对话框状态
const showOutlineDialog = ref(false);
const showEditDialog = ref(false);
const editingSlideIndex = ref(-1);
const editingSlideData = ref({
    title: '',
    content: '',
    keyPoints: [] as string[]
});

const MAX_RETRIES = 3;

// 计算属性
const canProceed = computed(() => {
    return generatedOutline.value && !isGenerating.value;
});

const overallProgress = computed(() => {
    if (!isGenerating.value) return 0;
    if (hasFinished.value) return 100;
    
    // 根据消息计算进度
    const totalSteps = 4; // 搜索、分析、生成、完善
    let completedSteps = 0;
    
    if (messages.value.some(m => m.type === 'content_search' && m.status === 'done')) {
        completedSteps++;
    }
    if (messages.value.some(m => m.type === 'outline_generation' && m.status === 'pending')) {
        completedSteps++;
    }
    if (messages.value.some(m => m.type === 'outline_generation' && m.status === 'done')) {
        completedSteps += 2;
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
});

// 加载已保存的请求数据
const loadRequest = () => {
    if (props.request) {
        currentRequest.value = props.request;
        return;
    }
    
    // 从localStorage加载
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            currentRequest.value = data.request;
        }
    } catch (error) {
        console.error('加载请求数据失败:', error);
    }
};

// 检查是否已有生成的大纲
const checkExistingOutline = () => {
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.outline) {
                generatedOutline.value = data.outline;
                toast.add({
                    severity: 'success',
                    summary: '大纲已恢复',
                    detail: '检测到之前生成的大纲，已自动恢复'
                });
                return true;
            }
        }
    } catch (error) {
        console.error('检查现有大纲失败:', error);
    }
    return false;
};

// 保存大纲到localStorage
const saveOutlineToStorage = (outline: KnowledgeSlideOutline) => {
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        const data = savedData ? JSON.parse(savedData) : {};
        data.outline = outline;
        data.stage = 'markdown';
        localStorage.setItem(`knowledge-slide-${props.id}`, JSON.stringify(data));
    } catch (error) {
        console.error('保存大纲失败:', error);
    }
};

// 生成大纲
const generateOutline = async () => {
    if (!currentRequest.value) {
        emit('error', '缺少请求配置数据');
        return;
    }

    isGenerating.value = true;
    hasFinished.value = false;
    error.value = '';
    messages.value = [];
    connectionRetries.value = 0;
    emit('processing-update', true);

    try {
        console.log('开始生成大纲...', currentRequest.value);
        
        // 添加初始消息
        messages.value.push({
            type: 'content_search',
            status: 'pending',
            message: '正在搜索相关知识库内容...',
            timestamp: Date.now()
        });

        const result = await knowledgeBasedSlideApi.generateOutline(currentRequest.value);
        
        if (result.success) {
            generatedOutline.value = result.data;
            hasFinished.value = true;
            
            // 保存到localStorage
            saveOutlineToStorage(result.data);
            
            // 添加完成消息
            messages.value.push({
                type: 'done',
                status: 'done',
                message: `成功生成 ${result.data.totalSlides} 页PPT大纲`,
                timestamp: Date.now()
            });

            toast.add({
                severity: 'success',
                summary: '大纲生成成功',
                detail: `已生成包含 ${result.data.totalSlides} 页的演示大纲`,
                life: 5000
            });
            
            // 自动打开预览对话框
            setTimeout(() => {
                showOutlineDialog.value = true;
            }, 1000);
            
        } else {
            throw new Error(result.error || '大纲生成失败');
        }
    } catch (error: any) {
        console.error('生成大纲失败:', error);
        
        let errorMessage = '生成大纲失败';
        
        if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || '请求参数错误';
        } else if (error.response?.status === 404) {
            errorMessage = '未找到相关的知识库内容，请检查关键词或上传相关文档';
        } else if (error.response?.status === 500) {
            errorMessage = '服务器内部错误，请稍后重试';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        error.value = errorMessage;
        emit('error', errorMessage);
        
        messages.value.push({
            type: 'error',
            status: 'failed',
            error: errorMessage,
            timestamp: Date.now()
        });

        toast.add({
            severity: 'error',
            summary: '生成失败',
            detail: errorMessage,
            life: 8000
        });

    } finally {
        isGenerating.value = false;
        emit('processing-update', false);
    }
};

// 重新生成大纲
const regenerateOutline = () => {
    generatedOutline.value = null;
    showOutlineDialog.value = false;
    generateOutline();
};

// 编辑幻灯片
const editSlide = (index: number) => {
    if (!generatedOutline.value) return;
    
    const slide = generatedOutline.value.slides[index];
    editingSlideIndex.value = index;
    editingSlideData.value = {
        title: slide.title,
        content: slide.content,
        keyPoints: [...slide.keyPoints]
    };
    showEditDialog.value = true;
};

// 保存编辑的幻灯片
const saveEditedSlide = () => {
    if (!generatedOutline.value || editingSlideIndex.value < 0) return;
    
    const slide = generatedOutline.value.slides[editingSlideIndex.value];
    slide.title = editingSlideData.value.title;
    slide.content = editingSlideData.value.content;
    slide.keyPoints = editingSlideData.value.keyPoints;
    
    // 更新localStorage
    saveOutlineToStorage(generatedOutline.value);
    
    showEditDialog.value = false;
    editingSlideIndex.value = -1;
    
    toast.add({
        severity: 'success',
        summary: '保存成功',
        detail: '幻灯片内容已更新'
    });
};

// 添加关键点
const addKeyPoint = () => {
    editingSlideData.value.keyPoints.push('');
};

// 删除关键点
const removeKeyPoint = (index: number) => {
    editingSlideData.value.keyPoints.splice(index, 1);
};

// 进入下一阶段
const proceedToMarkdown = () => {
    if (!generatedOutline.value) return;
    
    // 保存最新状态
    saveOutlineToStorage(generatedOutline.value);
    
    toast.add({
        severity: 'info',
        summary: '进入下一阶段',
        detail: '正在跳转到内容生成阶段...'
    });
    
    setTimeout(() => {
        emit('complete', generatedOutline.value!);
    }, 1000);
};

// 获取消息图标
const getMessageIcon = (type: KnowledgeMessageItem['type']) => {
    switch (type) {
        case 'content_search': return 'pi pi-search';
        case 'outline_generation': return 'pi pi-list';
        case 'done': return 'pi pi-check-circle';
        case 'error': return 'pi pi-times-circle';
        default: return 'pi pi-info-circle';
    }
};

// 获取消息颜色
const getMessageSeverity = (type: KnowledgeMessageItem['type'], status?: string) => {
    if (type === 'error') return 'error';
    if (type === 'done') return 'success';
    if (status === 'done') return 'info';
    return 'secondary';
};

// 组件挂载
onMounted(() => {
    loadRequest();
    
    // 检查是否已有大纲，如果没有则开始生成
    if (!checkExistingOutline()) {
        // 延迟一下开始生成，让用户看到界面
        setTimeout(() => {
            generateOutline();
        }, 1000);
    }
});

// 组件卸载时清理
onUnmounted(() => {
    if (eventSource.value) {
        eventSource.value.close();
    }
});
</script>

<template>
    <div class="knowledge-stage2-outline p-6">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：大纲生成状态 -->
                <div class="lg:col-span-2">
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-list"></i>
                                智能大纲生成
                            </div>
                        </template>
                        
                        <template #content>
                            <!-- 请求配置概览 -->
                            <div v-if="currentRequest" class="mb-6">
                                <h3 class="font-medium text-gray-800 mb-3">生成配置</h3>
                                <div class="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div class="flex items-center gap-2">
                                        <strong>标题:</strong>
                                        <span>{{ currentRequest.title }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <strong>关键词:</strong>
                                        <span>{{ currentRequest.topic }}</span>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <strong>幻灯片数量:</strong>
                                        <Tag :value="currentRequest.slideCount.toString()" />
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <strong>主题:</strong>
                                        <Tag :value="currentRequest.theme" severity="info" />
                                    </div>
                                </div>
                            </div>

                            <!-- 生成进度 -->
                            <div v-if="isGenerating" class="mb-6">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm font-medium text-gray-700">生成进度</span>
                                    <span class="text-sm text-gray-600">{{ overallProgress }}%</span>
                                </div>
                                <ProgressBar :value="overallProgress" />
                                
                                <!-- 状态消息 -->
                                <div class="mt-4 space-y-2 max-h-60 overflow-y-auto">
                                    <div 
                                        v-for="(message, index) in messages" 
                                        :key="index"
                                        class="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded"
                                    >
                                        <i 
                                            :class="getMessageIcon(message.type)"
                                            class="text-lg"
                                            :style="{ color: getMessageSeverity(message.type, message.status) === 'success' ? '#10b981' : 
                                                           getMessageSeverity(message.type, message.status) === 'error' ? '#ef4444' : 
                                                           getMessageSeverity(message.type, message.status) === 'info' ? '#3b82f6' : '#6b7280' }"
                                        ></i>
                                        <span class="flex-1">{{ message.message }}</span>
                                        <ProgressSpinner 
                                            v-if="message.status === 'pending'" 
                                            style="width: 20px; height: 20px"
                                            stroke-width="4"
                                        />
                                        <i 
                                            v-else-if="message.status === 'done'"
                                            class="pi pi-check text-green-500"
                                        ></i>
                                        <i 
                                            v-else-if="message.status === 'failed'"
                                            class="pi pi-times text-red-500"
                                        ></i>
                                    </div>
                                </div>
                            </div>

                            <!-- 生成结果 -->
                            <div v-if="generatedOutline && !isGenerating" class="mb-6">
                                <div class="flex justify-content-between align-items-center mb-4">
                                    <h3 class="font-medium text-gray-800">生成结果</h3>
                                    <div class="flex gap-2">
                                        <Tag 
                                            :value="`${generatedOutline.totalSlides} 页幻灯片`" 
                                            severity="success" 
                                        />
                                        <Tag 
                                            :value="`基于 ${generatedOutline.usedKnowledge.length} 个文档`" 
                                            severity="info" 
                                        />
                                    </div>
                                </div>
                                
                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div class="flex items-start gap-3">
                                        <i class="pi pi-check-circle text-green-500 mt-1"></i>
                                        <div>
                                            <h4 class="font-medium text-green-800">{{ generatedOutline.title }}</h4>
                                            <p class="text-green-700 mt-1">{{ generatedOutline.summary }}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 错误显示 -->
                            <Message v-if="error" severity="error" class="mb-6">
                                {{ error }}
                            </Message>

                            <!-- 操作按钮 -->
                            <div class="flex gap-3">
                                <Button 
                                    v-if="!generatedOutline && !isGenerating"
                                    label="🚀 开始生成大纲"
                                    @click="generateOutline"
                                    size="large"
                                />
                                
                                <Button 
                                    v-if="generatedOutline && !isGenerating"
                                    label="📋 查看详细大纲"
                                    @click="showOutlineDialog = true"
                                    size="large"
                                />
                                
                                <Button 
                                    v-if="generatedOutline && !isGenerating"
                                    label="🔄 重新生成"
                                    severity="secondary"
                                    @click="regenerateOutline"
                                    outlined
                                />
                                
                                <Button 
                                    v-if="canProceed"
                                    label="➡️ 生成内容"
                                    severity="success"
                                    @click="proceedToMarkdown"
                                    size="large"
                                />
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 右侧：帮助信息 -->
                <div>
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-lightbulb"></i>
                                大纲生成说明
                            </div>
                        </template>
                        
                        <template #content>
                            <div class="space-y-4 text-sm">
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">🔍 智能检索</h4>
                                    <p class="text-gray-600">
                                        系统会根据您的关键词从知识库中检索最相关的内容，
                                        并基于相关性评分进行智能筛选。
                                    </p>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">📋 大纲生成</h4>
                                    <p class="text-gray-600">
                                        AI会分析检索到的内容，自动生成结构化的演示大纲，
                                        包括标题、关键点和内容组织。
                                    </p>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">✏️ 编辑功能</h4>
                                    <p class="text-gray-600">
                                        生成后可以编辑大纲内容、调整标题、修改关键点，
                                        确保符合您的具体需求。
                                    </p>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">⚡ 处理时间</h4>
                                    <p class="text-gray-600">
                                        大纲生成通常需要30秒到2分钟，取决于知识库规模
                                        和内容复杂度。
                                    </p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- 大纲详情对话框 -->
        <Dialog 
            v-model:visible="showOutlineDialog" 
            modal 
            header="📋 演示大纲详情" 
            style="width: 90vw; max-width: 1200px"
            maximizable
        >
            <div v-if="generatedOutline" class="space-y-6">
                <!-- 大纲概要 -->
                <Card>
                    <template #title>{{ generatedOutline.title }}</template>
                    <template #subtitle>{{ generatedOutline.summary }}</template>
                    <template #content>
                        <div class="flex gap-4">
                            <Tag :value="`${generatedOutline.totalSlides} 页幻灯片`" severity="info" />
                            <Tag :value="`基于 ${generatedOutline.usedKnowledge.length} 个文档`" severity="success" />
                        </div>
                    </template>
                </Card>

                <!-- 幻灯片列表 -->
                <Panel header="📑 幻灯片内容" toggleable>
                    <div class="space-y-4">
                        <div 
                            v-for="(slide, index) in generatedOutline.slides" 
                            :key="index"
                            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                            <div class="flex justify-content-between align-items-start mb-3">
                                <h4 class="font-medium text-gray-800 text-lg">
                                    第 {{ index + 1 }} 页: {{ slide.title }}
                                </h4>
                                <div class="flex gap-2">
                                    <Button
                                        icon="pi pi-pencil"
                                        size="small"
                                        text
                                        @click="editSlide(index)"
                                    />
                                    <Tag 
                                        v-if="slide.sourceKnowledge.length > 0"
                                        :value="`${slide.sourceKnowledge.length} 个引用`"
                                        severity="secondary"
                                        size="small"
                                    />
                                </div>
                            </div>
                            
                            <div v-if="slide.content" class="mb-3">
                                <p class="text-gray-600 text-sm leading-relaxed">{{ slide.content }}</p>
                            </div>
                            
                            <div v-if="slide.keyPoints.length > 0">
                                <h5 class="text-sm font-medium text-gray-700 mb-2">关键要点:</h5>
                                <ul class="text-sm text-gray-600 space-y-1">
                                    <li v-for="point in slide.keyPoints" :key="point" class="flex items-start gap-2">
                                        <span class="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                                        <span>{{ point }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Panel>

                <!-- 引用文档 -->
                <Panel header="📚 参考文档" toggleable collapsed>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div 
                            v-for="doc in generatedOutline.usedKnowledge" 
                            :key="doc.id"
                            class="border border-gray-200 rounded-lg p-3"
                        >
                            <div class="flex justify-content-between align-items-start">
                                <span class="font-medium text-sm flex-1 mr-2">{{ doc.title }}</span>
                                <Tag 
                                    :value="doc.contentType.toUpperCase()"
                                    severity="info"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                </Panel>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="关闭" 
                        severity="secondary" 
                        @click="showOutlineDialog = false"
                        outlined
                    />
                    <Button 
                        label="🔄 重新生成" 
                        severity="warning"
                        @click="regenerateOutline"
                        outlined
                    />
                    <Button 
                        label="➡️ 生成内容" 
                        severity="success"
                        @click="proceedToMarkdown"
                        icon="pi pi-arrow-right"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 编辑幻灯片对话框 -->
        <Dialog 
            v-model:visible="showEditDialog" 
            modal 
            header="✏️ 编辑幻灯片" 
            style="width: 60vw; max-width: 800px"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">标题</label>
                    <InputText 
                        v-model="editingSlideData.title"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">内容描述</label>
                    <Textarea 
                        v-model="editingSlideData.content"
                        rows="3"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <div class="flex justify-content-between align-items-center mb-2">
                        <label class="text-sm font-medium">关键要点</label>
                        <Button
                            label="添加要点"
                            icon="pi pi-plus"
                            size="small"
                            @click="addKeyPoint"
                        />
                    </div>
                    <div class="space-y-2">
                        <div 
                            v-for="(point, index) in editingSlideData.keyPoints"
                            :key="index"
                            class="flex gap-2"
                        >
                            <InputText 
                                v-model="editingSlideData.keyPoints[index]"
                                class="flex-1"
                                :placeholder="`要点 ${index + 1}`"
                            />
                            <Button
                                icon="pi pi-trash"
                                severity="danger"
                                size="small"
                                text
                                @click="removeKeyPoint(index)"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="取消" 
                        severity="secondary" 
                        @click="showEditDialog = false"
                        outlined
                    />
                    <Button 
                        label="保存" 
                        @click="saveEditedSlide"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-stage2-outline {
    min-height: calc(100vh - 200px);
}

:deep(.p-card-title) {
    font-size: 1.25rem;
    font-weight: 600;
}

:deep(.p-panel-content) {
    padding: 1rem;
}

:deep(.p-dialog-content) {
    padding: 1.5rem;
}

.leading-relaxed {
    line-height: 1.75;
}
</style>