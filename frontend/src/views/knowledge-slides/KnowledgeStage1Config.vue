<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

// PrimeVue 组件
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import DataView from 'primevue/dataview';
import Tag from 'primevue/tag';
import Divider from 'primevue/divider';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import ProgressBar from 'primevue/progressbar';
import Chip from 'primevue/chip';
import Message from 'primevue/message';
import MultiSelect from 'primevue/multiselect';

import type { 
    KnowledgeSlideRequest, 
    KnowledgeStats, 
    KnowledgePreviewResult 
} from './dto';
import { knowledgeBasedSlideApi } from '@/api/knowledge-based-slide';
import { knowledgeApi, type Knowledge } from '@/api/knowledge';

const props = defineProps<{
    id?: string;
}>();

const emit = defineEmits<{
    (e: 'complete', slideId: string, request: KnowledgeSlideRequest): void;
    (e: 'error', error: string): void;
    (e: 'processing-update', isProcessing: boolean): void;
}>();

const toast = useToast();

// 表单数据
const slideRequest = ref<KnowledgeSlideRequest>({
    title: '',
    topic: '',
    requirements: '',
    targetAudience: '',
    slideCount: 10,
    theme: 'academic',
    knowledgeBaseIds: []
});

// 状态管理
const loading = ref(false);
const showPreviewDialog = ref(false);
const previewQuery = ref('');
const previewResults = ref<KnowledgePreviewResult | null>(null);
const knowledgeStats = ref<KnowledgeStats | null>(null);
const isPreviewLoading = ref(false);

// 知识库列表
const knowledgeList = ref<Knowledge[]>([]);
const isLoadingKnowledge = ref(false);

// 表单验证
const formErrors = ref<Record<string, string>>({});

// 主题选项
const themeOptions = [
    { label: '学术风格', value: 'academic' },
    { label: '默认风格', value: 'default' },
    { label: '法兰克福', value: 'frankfurt' },
    { label: '企鹅风格', value: 'penguin' },
    { label: 'Vuetiful', value: 'vuetiful' }
];

// 幻灯片数量选项
const slideCountOptions = [
    { label: '5-8 页（简短）', value: 6 },
    { label: '8-12 页（标准）', value: 10 },
    { label: '12-16 页（详细）', value: 14 },
    { label: '16-20 页（深入）', value: 18 }
];

// 计算属性
const canProceed = computed(() => {
    return slideRequest.value.title.trim() !== '' && 
           slideRequest.value.topic.trim() !== '' &&
           !loading.value &&
           Object.keys(formErrors.value).length === 0;
});

const progressValue = computed(() => {
    let progress = 0;
    if (slideRequest.value.title.trim()) progress += 20;
    if (slideRequest.value.topic.trim()) progress += 20;
    if (slideRequest.value.targetAudience.trim()) progress += 20;
    if (slideRequest.value.requirements.trim()) progress += 20;
    if (slideRequest.value.knowledgeBaseIds && slideRequest.value.knowledgeBaseIds.length > 0) progress += 20;
    return progress;
});

// 表单验证函数
const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!slideRequest.value.title.trim()) {
        errors.title = '演示标题不能为空';
    } else if (slideRequest.value.title.length > 100) {
        errors.title = '演示标题不能超过100个字符';
    }
    
    if (!slideRequest.value.topic.trim()) {
        errors.topic = '主题关键词不能为空';
    } else if (slideRequest.value.topic.length > 200) {
        errors.topic = '主题关键词不能超过200个字符';
    }
    
    if (slideRequest.value.requirements.length > 500) {
        errors.requirements = '具体需求不能超过500个字符';
    }
    
    if (slideRequest.value.targetAudience.length > 100) {
        errors.targetAudience = '目标受众不能超过100个字符';
    }

    if (!slideRequest.value.knowledgeBaseIds || slideRequest.value.knowledgeBaseIds.length === 0) {
        errors.knowledgeBaseIds = '请至少选择一个知识库文档';
    }

    formErrors.value = errors;
    return Object.keys(errors).length === 0;
};

// 实时验证
const validateField = (field: keyof KnowledgeSlideRequest) => {
    const tempErrors = { ...formErrors.value };
    delete tempErrors[field];
    formErrors.value = tempErrors;
    validateForm();
};

// 预览知识库内容
const previewContent = async () => {
    if (!previewQuery.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: '提醒',
            detail: '请输入预览查询内容'
        });
        return;
    }

    isPreviewLoading.value = true;
    
    try {
        const result = await knowledgeBasedSlideApi.previewContent({
            query: previewQuery.value,
            limit: 8
        });
        
        if (result.success) {
            previewResults.value = result.data;
            
            if (result.data.totalFound === 0) {
                toast.add({
                    severity: 'info',
                    summary: '提示',
                    detail: '未找到相关的知识库内容，建议：1. 检查关键词拼写 2. 使用更通用的词汇 3. 确保已上传相关文档'
                });
            }
        } else {
            toast.add({
                severity: 'error',
                summary: '预览失败',
                detail: result.error || '无法预览内容'
            });
        }
    } catch (error) {
        console.error('预览内容失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '预览内容失败，请检查网络连接'
        });
    } finally {
        isPreviewLoading.value = false;
    }
};

// 加载知识库统计信息
const loadKnowledgeStats = async () => {
    try {
        const result = await knowledgeBasedSlideApi.getKnowledgeStats();
        if (result.success) {
            knowledgeStats.value = result.data;
        }
    } catch (error) {
        console.error('加载统计信息失败:', error);
    }
};

// 加载知识库列表
const loadKnowledgeList = async () => {
    isLoadingKnowledge.value = true;
    try {
        const result = await knowledgeApi.getList({
            page: 1,
            limit: 100
        });

        if (result.success && result.data) {
            // 只显示已向量化完成的知识库文档
            knowledgeList.value = result.data.knowledge.filter(k => k.vectorStatus === 'completed');
        }
    } catch (error) {
        console.error('加载知识库列表失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '加载知识库列表失败'
        });
    } finally {
        isLoadingKnowledge.value = false;
    }
};

// 进入下一阶段
const proceedToOutline = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'warn',
            summary: '表单验证失败',
            detail: '请修正表单中的错误后重试'
        });
        return;
    }

    loading.value = true;
    emit('processing-update', true);

    try {
        // 生成唯一的项目ID
        const slideId = props.id || `kb-slide-${uuidv4()}`;
        
        // 保存配置到localStorage（临时存储）
        localStorage.setItem(`knowledge-slide-${slideId}`, JSON.stringify({
            id: slideId,
            request: slideRequest.value,
            createdAt: new Date().toISOString(),
            stage: 'outline'
        }));

        toast.add({
            severity: 'success',
            summary: '配置保存成功',
            detail: '正在进入大纲生成阶段...'
        });

        // 延迟一下让用户看到成功消息
        setTimeout(() => {
            emit('complete', slideId, slideRequest.value);
        }, 1000);

    } catch (error: any) {
        console.error('保存配置失败:', error);
        emit('error', error.message || '保存配置失败，请稍后重试');
        
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '保存配置失败，请稍后重试'
        });
    } finally {
        loading.value = false;
        emit('processing-update', false);
    }
};

// 添加示例数据
const addExample = () => {
    slideRequest.value = {
        title: 'Vue.js 3 组件设计最佳实践',
        topic: 'Vue.js 组件 响应式 Composition API 生命周期',
        requirements: '面向有一定Vue基础的开发者，重点介绍Vue 3的新特性和组件设计模式，包含实际代码示例和案例分析',
        targetAudience: '前端开发工程师、技术团队',
        slideCount: 12,
        theme: 'academic',
        knowledgeBaseIds: []
    };

    // 重新验证表单
    validateForm();

    toast.add({
        severity: 'info',
        summary: '示例已加载',
        detail: '您可以基于示例进行修改'
    });
};

// 获取相关性标签样式
const getRelevanceTagSeverity = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'info';
    if (score >= 0.4) return 'warn';
    return 'secondary';
};

// 格式化相关性得分
const formatRelevanceScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
};

// 加载现有配置（如果有）
const loadExistingConfig = () => {
    if (props.id) {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                if (data.request) {
                    slideRequest.value = data.request;
                    validateForm();
                    
                    toast.add({
                        severity: 'info',
                        summary: '配置已恢复',
                        detail: '已恢复之前保存的配置'
                    });
                }
            } catch (error) {
                console.error('加载配置失败:', error);
            }
        }
    }
};

// 组件挂载时加载数据
onMounted(() => {
    loadKnowledgeStats();
    loadExistingConfig();
    loadKnowledgeList();
});
</script>

<template>
    <div class="knowledge-stage1-config p-6">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：配置表单 -->
                <div class="lg:col-span-2">
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-cog"></i>
                                配置生成参数
                            </div>
                        </template>
                        
                        <template #content>
                            <!-- 进度指示 -->
                            <div class="mb-6">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600">配置完成度</span>
                                    <span class="text-sm font-medium">{{ progressValue }}%</span>
                                </div>
                                <ProgressBar :value="progressValue" />
                            </div>

                            <div class="grid grid-cols-1 gap-6">
                                <!-- 演示标题 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">
                                        演示标题 <span class="text-red-500">*</span>
                                    </label>
                                    <InputText 
                                        v-model="slideRequest.title"
                                        class="w-full"
                                        :class="{ 'p-invalid': formErrors.title }"
                                        placeholder="例如：Vue.js 最佳实践分享"
                                        @input="validateField('title')"
                                    />
                                    <small v-if="formErrors.title" class="text-red-500">
                                        {{ formErrors.title }}
                                    </small>
                                </div>

                                <!-- 知识库选择 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">
                                        选择知识库 <span class="text-red-500">*</span>
                                    </label>
                                    <MultiSelect
                                        v-model="slideRequest.knowledgeBaseIds"
                                        :options="knowledgeList"
                                        optionLabel="title"
                                        optionValue="id"
                                        placeholder="请选择要使用的知识库文档"
                                        class="w-full"
                                        :maxSelectedLabels="3"
                                        :loading="isLoadingKnowledge"
                                        @change="validateField('knowledgeBaseIds')"
                                    />
                                    <small class="text-gray-500 block mt-1">
                                        选择相关的知识库文档，系统将从这些文档中检索和生成内容
                                    </small>
                                    <small v-if="formErrors.knowledgeBaseIds" class="text-red-500 block">
                                        {{ formErrors.knowledgeBaseIds }}
                                    </small>
                                </div>

                                <!-- 主题关键词 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">
                                        主题关键词 <span class="text-red-500">*</span>
                                    </label>
                                    <InputText 
                                        v-model="slideRequest.topic"
                                        class="w-full"
                                        :class="{ 'p-invalid': formErrors.topic }"
                                        placeholder="例如：Vue.js 组件设计 响应式 状态管理"
                                        @input="validateField('topic')"
                                    />
                                    <small class="text-gray-500 block mt-1">
                                        输入相关关键词，用空格分隔，系统将从知识库中检索相关内容
                                    </small>
                                    <small v-if="formErrors.topic" class="text-red-500 block">
                                        {{ formErrors.topic }}
                                    </small>
                                </div>

                                <!-- 具体需求 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">具体需求</label>
                                    <Textarea 
                                        v-model="slideRequest.requirements"
                                        rows="4"
                                        class="w-full"
                                        :class="{ 'p-invalid': formErrors.requirements }"
                                        placeholder="例如：面向中级开发者，包含实际案例和代码示例，重点突出最佳实践"
                                        @input="validateField('requirements')"
                                    />
                                    <small v-if="formErrors.requirements" class="text-red-500">
                                        {{ formErrors.requirements }}
                                    </small>
                                </div>

                                <!-- 目标受众 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">目标受众</label>
                                    <InputText 
                                        v-model="slideRequest.targetAudience"
                                        class="w-full"
                                        :class="{ 'p-invalid': formErrors.targetAudience }"
                                        placeholder="例如：前端开发工程师、技术团队"
                                        @input="validateField('targetAudience')"
                                    />
                                    <small v-if="formErrors.targetAudience" class="text-red-500">
                                        {{ formErrors.targetAudience }}
                                    </small>
                                </div>

                                <!-- 幻灯片数量和主题 -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium mb-2">幻灯片数量</label>
                                        <Select
                                            v-model="slideRequest.slideCount"
                                            :options="slideCountOptions"
                                            option-label="label"
                                            option-value="value"
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium mb-2">演示主题</label>
                                        <Select
                                            v-model="slideRequest.theme"
                                            :options="themeOptions"
                                            option-label="label"
                                            option-value="value"
                                            class="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <!-- 操作按钮 -->
                            <div class="flex gap-3 mt-8">
                                <Button 
                                    :label="loading ? '保存中...' : '🚀 开始生成'"
                                    :loading="loading"
                                    :disabled="!canProceed"
                                    @click="proceedToOutline"
                                    class="flex-1"
                                    size="large"
                                />
                                <Button 
                                    label="📋 加载示例"
                                    severity="secondary"
                                    @click="addExample"
                                    outlined
                                />
                                <Button 
                                    label="🔍 预览内容"
                                    severity="info"
                                    @click="showPreviewDialog = true"
                                    outlined
                                />
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 右侧：指南和统计 -->
                <div class="space-y-6">
                    <!-- 知识库统计 -->
                    <Card v-if="knowledgeStats">
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-database"></i>
                                知识库状态
                            </div>
                        </template>
                        
                        <template #content>
                            <div class="space-y-3">
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">总文档数</span>
                                    <Chip :label="knowledgeStats.totalDocuments.toString()" />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">已向量化</span>
                                    <Chip 
                                        :label="knowledgeStats.vectorizedDocuments.toString()" 
                                        severity="success"
                                    />
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-gray-600">公开文档</span>
                                    <Chip 
                                        :label="knowledgeStats.publicDocuments.toString()" 
                                        severity="info"
                                    />
                                </div>
                            </div>
                            
                            <Message 
                                v-if="knowledgeStats.totalDocuments === 0"
                                severity="warn" 
                                class="mt-4"
                            >
                                暂无知识库文档，请先上传文档
                            </Message>
                        </template>
                    </Card>

                    <!-- 使用指南 -->
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-info-circle"></i>
                                使用指南
                            </div>
                        </template>
                        
                        <template #content>
                            <div class="space-y-4 text-sm">
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">📝 配置要点</h4>
                                    <ul class="text-gray-600 space-y-1">
                                        <li>• 标题要具体明确，体现演示主题</li>
                                        <li>• 选择相关的知识库文档</li>
                                        <li>• 关键词要准确，便于检索相关内容</li>
                                        <li>• 需求描述要详细，影响生成质量</li>
                                        <li>• 受众定位要清晰，影响内容深度</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">🎯 最佳实践</h4>
                                    <ul class="text-gray-600 space-y-1">
                                        <li>• 先选择知识库再预览相关内容</li>
                                        <li>• 关键词多样化提高检索覆盖面</li>
                                        <li>• 合理选择幻灯片数量</li>
                                        <li>• 可以随时返回修改配置</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">⚡ 生成特性</h4>
                                    <ul class="text-gray-600 space-y-1">
                                        <li>• 智能内容检索和匹配</li>
                                        <li>• 基于选定知识库生成大纲</li>
                                        <li>• 支持多种演示主题</li>
                                        <li>• 实时进度显示</li>
                                    </ul>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- 内容预览对话框 -->
        <Dialog 
            v-model:visible="showPreviewDialog" 
            modal 
            header="📖 知识库内容预览" 
            style="width: 80vw; max-width: 1000px"
        >
            <div class="space-y-4">
                <div class="flex gap-2">
                    <InputText
                        v-model="previewQuery"
                        class="flex-1"
                        placeholder="输入关键词预览相关内容..."
                        @keyup.enter="previewContent"
                    />
                    <Button 
                        label="搜索" 
                        icon="pi pi-search"
                        :loading="isPreviewLoading"
                        @click="previewContent"
                    />
                </div>

                <div v-if="previewResults">
                    <div class="mb-4 flex justify-between items-center">
                        <Tag 
                            :value="`找到 ${previewResults.totalFound} 个相关文档`"
                            severity="info"
                        />
                        <Button
                            v-if="previewResults.totalFound > 0"
                            label="使用此关键词"
                            size="small"
                            @click="() => {
                                slideRequest.topic = previewQuery;
                                showPreviewDialog = false;
                                validateField('topic');
                            }"
                        />
                    </div>

                    <DataView 
                        :value="previewResults.documents" 
                        layout="list"
                        :paginator="previewResults.documents.length > 5"
                        :rows="5"
                    >
                        <template #list="slotProps">
                            <div class="border border-gray-200 rounded-lg p-4 mb-3 hover:bg-gray-50 transition-colors">
                                <div class="flex justify-content-between align-items-start mb-2">
                                    <h4 class="font-medium text-gray-800 flex-1 mr-4">{{ slotProps.data.title }}</h4>
                                    <div class="flex gap-2 flex-shrink-0">
                                        <Tag 
                                            :value="formatRelevanceScore(slotProps.data.relevanceScore)"
                                            :severity="getRelevanceTagSeverity(slotProps.data.relevanceScore)"
                                            size="small"
                                        />
                                        <Tag 
                                            :value="slotProps.data.contentType.toUpperCase()"
                                            severity="secondary"
                                            size="small"
                                        />
                                    </div>
                                </div>
                                <p class="text-sm text-gray-600 line-height-3">{{ slotProps.data.extractedText }}</p>
                            </div>
                        </template>
                    </DataView>
                    
                    <div v-if="previewResults.documents.length === 0" class="text-center py-8">
                        <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500">未找到相关内容</p>
                        <p class="text-sm text-gray-400 mt-2">
                            建议：调整关键词或确保知识库中有相关文档
                        </p>
                    </div>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-stage1-config {
    min-height: calc(100vh - 200px);
}

:deep(.p-card-title) {
    font-size: 1.25rem;
    font-weight: 600;
}

:deep(.p-dataview-content) {
    background: transparent;
}

:deep(.p-message) {
    margin: 0;
}

.line-height-3 {
    line-height: 1.75;
}
</style>