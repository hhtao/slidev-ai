<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { knowledgeBasedSlideApi, type KnowledgeBasedSlideRequest, type KnowledgeBasedSlideOutline } from '@/api/knowledge-based-slide';
import { useRouter } from 'vue-router';
import { useSlidesStore } from '@/store/slide';

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
import Panel from 'primevue/panel';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import ProgressBar from 'primevue/progressbar';
import Chip from 'primevue/chip';

const router = useRouter();
const toast = useToast();
const slidesStore = useSlidesStore();

// 表单数据
const slideRequest = ref<KnowledgeBasedSlideRequest>({
    title: '',
    topic: '',
    requirements: '',
    targetAudience: '',
    slideCount: 10,
    theme: 'academic'
});

// 状态管理
const isGenerating = ref(false);
const showPreviewDialog = ref(false);
const showOutlineDialog = ref(false);
const previewQuery = ref('');
const previewResults = ref<any>(null);
const generatedOutline = ref<KnowledgeBasedSlideOutline | null>(null);
const knowledgeStats = ref<any>(null);

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
const canGenerate = computed(() => {
    return slideRequest.value.title.trim() !== '' && 
           slideRequest.value.topic.trim() !== '' &&
           !isGenerating.value;
});

const progressValue = computed(() => {
    let progress = 0;
    if (slideRequest.value.title) progress += 25;
    if (slideRequest.value.topic) progress += 25;
    if (slideRequest.value.targetAudience) progress += 25;
    if (slideRequest.value.requirements) progress += 25;
    return progress;
});

// 生成PPT大纲
const generateOutline = async () => {
    if (!canGenerate.value) {
        toast.add({
            severity: 'warn',
            summary: '提醒',
            detail: '请填写标题和主题'
        });
        return;
    }

    isGenerating.value = true;
    
    try {
        console.log('开始生成PPT大纲...', slideRequest.value);
        const result = await knowledgeBasedSlideApi.generateOutline(slideRequest.value);
        console.log('生成结果:', result);
        
        if (result.success) {
            generatedOutline.value = result.data;
            showOutlineDialog.value = true;
            
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `成功生成 ${result.data.totalSlides} 页PPT大纲`
            });
        } else {
            const errorMessage = result.error || '无法生成PPT大纲';
            console.error('生成失败:', errorMessage);
            
            toast.add({
                severity: 'error',
                summary: '生成失败',
                detail: errorMessage
            });
            
            // 如果是知识库内容不足的问题，提供解决建议
            if (errorMessage.includes('未找到相关的知识库内容') || errorMessage.includes('知识库内容')) {
                setTimeout(() => {
                    toast.add({
                        severity: 'info',
                        summary: '建议',
                        detail: '请先上传相关文档到知识库，或尝试使用更通用的主题关键词',
                        life: 8000
                    });
                }, 2000);
            }
        }
    } catch (error: any) {
        console.error('生成大纲失败:', error);
        
        let errorMessage = '生成PPT大纲失败';
        
        if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || '请求参数错误';
        } else if (error.response?.status === 401) {
            errorMessage = '认证失败，请重新登录';
        } else if (error.response?.status === 500) {
            errorMessage = '服务器内部错误，请稍后重试';
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: errorMessage
        });
        
        // 提供额外的帮助信息
        if (errorMessage.includes('知识库') || errorMessage.includes('文档')) {
            setTimeout(() => {
                toast.add({
                    severity: 'info',
                    summary: '解决方案',
                    detail: '1. 检查知识库中是否有相关文档\n2. 尝试使用更简单的主题关键词\n3. 确保网络连接正常',
                    life: 10000
                });
            }, 2000);
        }
    } finally {
        isGenerating.value = false;
    }
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

    try {
        const result = await knowledgeBasedSlideApi.previewContent({
            query: previewQuery.value,
            limit: 5
        });
        
        if (result.success) {
            previewResults.value = result.data;
            
            if (result.data.totalFound === 0) {
                toast.add({
                    severity: 'info',
                    summary: '提示',
                    detail: '未找到相关的知识库内容'
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
            detail: '预览内容失败'
        });
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

// 跳转到新的独立流程
const startNewProcess = () => {
    router.push('/knowledge-slides/process?stage=config');
};

// 创建PPT（导航到标准创建流程）- 保留兼容性
const createSlideFromOutline = async () => {
    if (!generatedOutline.value) return;
    
    try {
        // 将生成的大纲内容转换为创建幻灯片的格式
        const slideContent = generateSlideContent(generatedOutline.value);
        
        // 创建FormData对象（符合API期望）
        const formData = new FormData();
        formData.append('title', generatedOutline.value.title);
        formData.append('content', slideContent);
        formData.append('theme', slideRequest.value.theme || 'academic');
        formData.append('visibility', 'private');
        
        const response = await slidesStore.createSlide(formData);
        
        if (response.status === 200 || response.status === 201) {
            const slideId = response.data.id;
            
            // 将新创建的slide加载到缓存中，防止saveOutlines时出现undefined错误
            await slidesStore.getSlideById(slideId);
            
            // 将知识库格式的大纲转换为标准格式
            const standardOutlines = generatedOutline.value.slides.map(slide => ({
                group: slide.title,
                content: slide.content
            }));
            
            // 使用转换后的标准格式大纲更新slide的outlines字段
            await slidesStore.saveOutlines(slideId, standardOutlines);
            
            // 跳转到Stage3（生成内容阶段）
            router.push({
                path: '/slides/process',
                query: {
                    id: slideId,
                    stage: 'markdown'
                }
            });
            
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: 'PPT项目已创建，正在跳转到内容生成阶段'
            });
            
            // 关闭对话框
            showOutlineDialog.value = false;
        } else {
            throw new Error('创建PPT失败');
        }
    } catch (error: any) {
        console.error('创建PPT失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '创建PPT失败，请稍后重试'
        });
    }
};

// 生成幻灯片内容文本
const generateSlideContent = (outline: KnowledgeBasedSlideOutline): string => {
    let content = `# ${outline.title}\n\n`;
    content += `${outline.summary}\n\n`;
    content += `## 主要内容\n\n`;
    
    outline.slides.forEach((slide, index) => {
        content += `### ${index + 1}. ${slide.title}\n\n`;
        
        slide.keyPoints.forEach(point => {
            content += `- ${point}\n`;
        });
        
        content += '\n';
    });
    
    content += `## 参考资料\n\n`;
    content += `本演示基于以下 ${outline.usedKnowledge.length} 个知识库文档：\n\n`;
    
    outline.usedKnowledge.forEach((doc, index) => {
        content += `${index + 1}. ${doc.title} (${doc.contentType})\n`;
    });
    
    return content;
};

// 获取相关性标签样式
const getRelevanceTagSeverity = (score: number) => {
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'info';
    if (score >= 0.4) return 'warning';
    return 'secondary';
};

// 格式化相关性得分
const formatRelevanceScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
};

// 组件挂载时加载数据
onMounted(() => {
    loadKnowledgeStats();
});
</script>

<template>
    <div class="knowledge-based-slide-generator p-4">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <!-- 页面标题 -->
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">
                    🤖 智能PPT生成器
                </h1>
                <p class="text-gray-600">
                    基于本地知识库内容，AI驱动生成专业演示文稿
                </p>
                
                <!-- 知识库统计信息 -->
                <div v-if="knowledgeStats" class="mt-4 flex gap-4">
                    <Chip :label="`📚 ${knowledgeStats.totalDocuments} 个文档`" />
                    <Chip :label="`🔍 ${knowledgeStats.vectorizedDocuments} 个已向量化`" />
                    <Chip :label="`🌐 ${knowledgeStats.publicDocuments} 个公开`" />
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：生成表单 -->
                <div class="lg:col-span-2">
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-magic-wand"></i>
                                PPT生成配置
                            </div>
                        </template>
                        
                        <template #content>
                            <!-- 进度指示 -->
                            <div class="mb-4">
                                <div class="flex justify-content-between align-items-center mb-2">
                                    <span class="text-sm text-gray-600">配置完成度</span>
                                    <span class="text-sm font-medium">{{ progressValue }}%</span>
                                </div>
                                <ProgressBar :value="progressValue" />
                            </div>

                            <div class="grid grid-cols-1 gap-4">
                                <!-- 演示标题 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">演示标题 *</label>
                                    <InputText 
                                        v-model="slideRequest.title"
                                        class="w-full"
                                        placeholder="例如：Vue.js 最佳实践分享"
                                    />
                                </div>

                                <!-- 主题关键词 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">主题关键词 *</label>
                                    <InputText 
                                        v-model="slideRequest.topic"
                                        class="w-full"
                                        placeholder="例如：Vue.js 组件设计 响应式 状态管理"
                                    />
                                    <small class="text-gray-500">
                                        输入相关关键词，用空格分隔，系统将从知识库中检索相关内容
                                    </small>
                                </div>

                                <!-- 具体需求 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">具体需求</label>
                                    <Textarea 
                                        v-model="slideRequest.requirements"
                                        rows="3"
                                        class="w-full"
                                        placeholder="例如：面向中级开发者，包含实际案例和代码示例，重点突出最佳实践"
                                    />
                                </div>

                                <!-- 目标受众 -->
                                <div>
                                    <label class="block text-sm font-medium mb-2">目标受众</label>
                                    <InputText 
                                        v-model="slideRequest.targetAudience"
                                        class="w-full"
                                        placeholder="例如：前端开发工程师、技术团队"
                                    />
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
                            <div class="flex gap-3 mt-6">
                                <Button 
                                    label="🚀 新流程生成"
                                    @click="startNewProcess"
                                    class="flex-1"
                                    size="large"
                                />
                                <Button 
                                    :label="isGenerating ? '生成中...' : '旧流程生成'"
                                    :loading="isGenerating"
                                    :disabled="!canGenerate"
                                    @click="generateOutline"
                                    severity="secondary"
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

                <!-- 右侧：使用说明和提示 -->
                <div>
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-info-circle"></i>
                                使用指南
                            </div>
                        </template>
                        
                        <template #content>
                            <div class="space-y-4">
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">📝 如何使用</h4>
                                    <ul class="text-sm text-gray-600 space-y-1">
                                        <li>• 填写演示标题和主题关键词</li>
                                        <li>• 描述具体需求和目标受众</li>
                                        <li>• 选择合适的幻灯片数量</li>
                                        <li>• 点击生成获得AI大纲</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">🎯 最佳实践</h4>
                                    <ul class="text-sm text-gray-600 space-y-1">
                                        <li>• 关键词要具体明确</li>
                                        <li>• 需求描述要详细清晰</li>
                                        <li>• 确保知识库有相关内容</li>
                                        <li>• 可以多次调整优化</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">🚀 智能特性</h4>
                                    <ul class="text-sm text-gray-600 space-y-1">
                                        <li>• 自动检索相关文档</li>
                                        <li>• 智能生成大纲结构</li>
                                        <li>• 提取关键要点</li>
                                        <li>• 支持内容预览</li>
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
            style="width: 70vw"
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
                        @click="previewContent"
                    />
                </div>

                <div v-if="previewResults">
                    <div class="mb-3">
                        <Tag 
                            :value="`找到 ${previewResults.totalFound} 个相关文档`"
                            severity="info"
                        />
                    </div>

                    <DataView 
                        :value="previewResults.documents" 
                        layout="list"
                        :paginator="false"
                    >
                        <template #list="slotProps">
                            <div class="border border-gray-200 rounded-lg p-4 mb-3">
                                <div class="flex justify-content-between align-items-start mb-2">
                                    <h4 class="font-medium text-gray-800">{{ slotProps.data.title }}</h4>
                                    <div class="flex gap-2">
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
                                <p class="text-sm text-gray-600">{{ slotProps.data.extractedText }}</p>
                            </div>
                        </template>
                    </DataView>
                </div>
            </div>
        </Dialog>

        <!-- 大纲预览对话框 -->
        <Dialog 
            v-model:visible="showOutlineDialog" 
            modal 
            header="🎯 生成的PPT大纲" 
            style="width: 80vw"
        >
            <div v-if="generatedOutline" class="space-y-4">
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
                <Panel header="📋 幻灯片内容">
                    <div class="space-y-3">
                        <div 
                            v-for="(slide, index) in generatedOutline.slides" 
                            :key="index"
                            class="border border-gray-200 rounded-lg p-4"
                        >
                            <div class="flex justify-content-between align-items-start mb-2">
                                <h4 class="font-medium text-gray-800">
                                    第 {{ index + 1 }} 页: {{ slide.title }}
                                </h4>
                                <Tag 
                                    v-if="slide.sourceKnowledge.length > 0"
                                    :value="`${slide.sourceKnowledge.length} 个引用`"
                                    severity="secondary"
                                    size="small"
                                />
                            </div>
                            
                            <div v-if="slide.keyPoints.length > 0" class="mb-2">
                                <h5 class="text-sm font-medium text-gray-700 mb-1">关键要点:</h5>
                                <ul class="text-sm text-gray-600">
                                    <li v-for="point in slide.keyPoints" :key="point" class="mb-1">
                                        • {{ point }}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </Panel>

                <!-- 引用文档 -->
                <Panel header="📚 参考文档">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div 
                            v-for="doc in generatedOutline.usedKnowledge" 
                            :key="doc.id"
                            class="border border-gray-200 rounded p-3"
                        >
                            <div class="flex justify-content-between align-items-start">
                                <span class="font-medium text-sm">{{ doc.title }}</span>
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
                        label="🚀 创建PPT" 
                        @click="createSlideFromOutline"
                        icon="pi pi-arrow-right"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-based-slide-generator {
    min-height: calc(100vh - 100px);
}

:deep(.p-card-title) {
    font-size: 1.25rem;
    font-weight: 600;
}

:deep(.p-dataview-content) {
    background: transparent;
}

:deep(.p-panel-content) {
    padding: 1rem;
}
</style>