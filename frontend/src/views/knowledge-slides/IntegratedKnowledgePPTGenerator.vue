<template>
    <div class="integrated-ppt-generator">
        <!-- 配置阶段 -->
        <div v-if="currentStage === 'config'" class="config-stage">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">🤖 智能PPT生成</h2>
                
                <!-- 表单区域 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- 左侧：基本配置 -->
                    <div class="space-y-6">
                        <div class="field">
                            <label for="title" class="font-medium text-gray-700 mb-2 block">
                                演示标题 <span class="text-red-500">*</span>
                            </label>
                            <InputText
                                id="title"
                                v-model="slideRequest.title"
                                placeholder="例如：Vue.js 3 最佳实践分享"
                                class="w-full"
                                :class="{ 'p-invalid': formErrors.title }"
                                @input="validateField('title')"
                            />
                            <small v-if="formErrors.title" class="p-error">{{ formErrors.title }}</small>
                        </div>

                        <div class="field">
                            <label for="topic" class="font-medium text-gray-700 mb-2 block">
                                主题关键词 <span class="text-red-500">*</span>
                            </label>
                            <Textarea
                                id="topic"
                                v-model="slideRequest.topic"
                                placeholder="例如：Vue组件设计 响应式编程 性能优化"
                                rows="3"
                                class="w-full"
                                :class="{ 'p-invalid': formErrors.topic }"
                                @input="validateField('topic')"
                            />
                            <small v-if="formErrors.topic" class="p-error">{{ formErrors.topic }}</small>
                        </div>

                        <div class="field">
                            <label for="requirements" class="font-medium text-gray-700 mb-2 block">
                                具体需求
                            </label>
                            <Textarea
                                id="requirements"
                                v-model="slideRequest.requirements"
                                placeholder="例如：包含实际代码示例，重点介绍最新特性"
                                rows="4"
                                class="w-full"
                            />
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="field">
                                <label class="font-medium text-gray-700 mb-2 block">幻灯片数量</label>
                                <InputNumber v-model="slideRequest.slideCount" :min="5" :max="30" class="w-full" />
                            </div>
                            <div class="field">
                                <label class="font-medium text-gray-700 mb-2 block">主题样式</label>
                                <Dropdown
                                    v-model="slideRequest.theme"
                                    :options="themeOptions"
                                    option-label="label"
                                    option-value="value"
                                    class="w-full"
                                />
                            </div>
                        </div>

                        <!-- 操作按钮 -->
                        <div class="flex justify-between items-center pt-4">
                            <div class="flex space-x-2">
                                <Button label="加载示例" icon="pi pi-file" outlined @click="addExample" />
                                <Button 
                                    label="项目管理" 
                                    icon="pi pi-folder" 
                                    outlined 
                                    @click="goToManager" 
                                />
                            </div>
                            <Button
                                label="生成PPT"
                                icon="pi pi-cog"
                                :loading="isGenerating"
                                :disabled="!canProceed"
                                @click="generatePPT"
                                class="px-8"
                            />
                        </div>
                    </div>

                    <!-- 右侧：知识库统计 -->
                    <div class="space-y-6">
                        <Card class="shadow-sm">
                            <template #title>
                                <div class="flex items-center">
                                    <i class="pi pi-database text-blue-500 mr-2"></i>
                                    知识库统计
                                </div>
                            </template>
                            <template #content>
                                <div v-if="knowledgeStats" class="space-y-3">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">总文档数</span>
                                        <span class="font-semibold">{{ knowledgeStats.totalDocuments }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600">已向量化</span>
                                        <span class="font-semibold text-green-600">{{ knowledgeStats.vectorizedDocuments }}</span>
                                    </div>
                                </div>
                            </template>
                        </Card>
                    </div>
                </div>
            </div>
        </div>

        <!-- 大纲确认阶段 -->
        <div v-else-if="currentStage === 'outline'" class="outline-stage">
            <div class="bg-white rounded-lg shadow-lg p-6">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">📋 大纲确认</h2>
                    <div class="flex space-x-2">
                        <Button label="重新生成" icon="pi pi-refresh" outlined @click="regenerateOutline" />
                        <Button
                            label="确认生成"
                            icon="pi pi-check"
                            :loading="isGeneratingFinal"
                            @click="confirmAndGenerate"
                        />
                    </div>
                </div>

                <div v-if="generatedOutline" class="space-y-4">
                    <!-- 大纲概览 -->
                    <div class="grid grid-cols-3 gap-4 mb-6">
                        <div class="text-center bg-blue-50 p-4 rounded">
                            <div class="text-2xl font-bold text-blue-600">{{ generatedOutline.totalSlides }}</div>
                            <div class="text-sm text-gray-600">总幻灯片数</div>
                        </div>
                        <div class="text-center bg-green-50 p-4 rounded">
                            <div class="text-2xl font-bold text-green-600">{{ generatedOutline.usedKnowledge.length }}</div>
                            <div class="text-sm text-gray-600">参考文档数</div>
                        </div>
                        <div class="text-center bg-purple-50 p-4 rounded">
                            <div class="text-2xl font-bold text-purple-600">{{ generatedOutline.slides.length }}</div>
                            <div class="text-sm text-gray-600">内容页数</div>
                        </div>
                    </div>

                    <!-- 幻灯片列表 -->
                    <div class="space-y-3">
                        <div
                            v-for="(slide, index) in generatedOutline.slides"
                            :key="index"
                            class="border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex items-center space-x-2">
                                    <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded">
                                        第 {{ index + 1 }} 页
                                    </span>
                                    <h4 class="font-medium text-gray-900">{{ slide.title }}</h4>
                                </div>
                                <Button icon="pi pi-pencil" text @click="editSlide(index)" />
                            </div>
                            <p class="text-sm text-gray-600 line-clamp-2">{{ slide.content }}</p>
                        </div>
                    </div>
                </div>

                <div v-else-if="isGenerating" class="text-center py-12">
                    <ProgressSpinner style="width: 50px; height: 50px" />
                    <h3 class="text-lg font-medium text-gray-900 mt-4">正在生成大纲...</h3>
                </div>
            </div>
        </div>

        <!-- 完成阶段 -->
        <div v-else-if="currentStage === 'complete'" class="complete-stage">
            <div class="bg-white rounded-lg shadow-lg p-6 text-center">
                <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">🎉 PPT生成完成！</h2>
                <p class="text-gray-600 mb-6">您的演示文稿已成功生成</p>

                <div class="flex justify-center space-x-4 mb-6">
                    <Button 
                        label="下载Markdown文件" 
                        icon="pi pi-download" 
                        @click="downloadMarkdown" 
                        class="px-6"
                    />
                    <Button 
                        label="返回首页" 
                        icon="pi pi-home" 
                        outlined 
                        @click="goHome" 
                        class="px-6"
                    />
                </div>

                <!-- 使用指南 -->
                <Card class="max-w-lg mx-auto mt-6">
                    <template #title>
                        <i class="pi pi-info-circle text-blue-500 mr-2"></i>
                        使用指南
                    </template>
                    <template #content>
                        <div class="text-left space-y-2 text-sm">
                            <p><strong>1. 安装 Slidev:</strong></p>
                            <p class="bg-gray-100 p-2 rounded font-mono text-xs">npm install -g @slidev/cli</p>
                            
                            <p><strong>2. 运行演示:</strong></p>
                            <p class="bg-gray-100 p-2 rounded font-mono text-xs">slidev your-presentation.md</p>
                            
                            <p><strong>3. 打开浏览器预览</strong></p>
                            <p class="text-gray-600">系统会自动在浏览器中打开演示</p>
                            
                            <div class="border-t pt-2 mt-4">
                                <p class="text-xs text-gray-500">
                                    💡 更多信息请访问 
                                    <a href="https://sli.dev" target="_blank" class="text-blue-500 hover:underline">
                                        https://sli.dev
                                    </a>
                                </p>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 编辑对话框 -->
        <Dialog v-model:visible="showEditSlideDialog" header="编辑幻灯片" :style="{ width: '600px' }" modal>
            <div class="space-y-4">
                <div class="field">
                    <label class="font-medium text-gray-700 mb-2 block">标题</label>
                    <InputText v-model="editingSlideData.title" class="w-full" />
                </div>
                <div class="field">
                    <label class="font-medium text-gray-700 mb-2 block">内容</label>
                    <Textarea v-model="editingSlideData.content" rows="6" class="w-full" />
                </div>
            </div>
            <template #footer>
                <Button label="取消" text @click="showEditSlideDialog = false" />
                <Button label="保存" @click="saveEditedSlide" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { v4 as uuidv4 } from 'uuid';
import { knowledgeBasedSlideApi } from '@/api/knowledge-based-slide';
import type { 
    KnowledgeSlideRequest, 
    KnowledgeSlideOutline, 
    KnowledgeStats 
} from '@/api/knowledge-based-slide';
import type { KnowledgeSlidevProject } from '../dto';

// PrimeVue components
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import InputNumber from 'primevue/inputnumber';
import Dropdown from 'primevue/dropdown';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

const router = useRouter();
const toast = useToast();

// 当前阶段
const currentStage = ref<'config' | 'outline' | 'complete'>('config');

// 表单数据
const slideRequest = ref<KnowledgeSlideRequest>({
    title: '',
    topic: '',
    requirements: '',
    targetAudience: '',
    slideCount: 12,
    theme: 'academic'
});

// 状态管理
const formErrors = ref<Record<string, string>>({});
const isGenerating = ref(false);
const isGeneratingFinal = ref(false);
const knowledgeStats = ref<KnowledgeStats | null>(null);
const generatedOutline = ref<KnowledgeSlideOutline | null>(null);
const finalProject = ref<KnowledgeSlidevProject | null>(null);

// 编辑状态
const showEditSlideDialog = ref(false);
const editingSlideIndex = ref(-1);
const editingSlideData = ref({ title: '', content: '', keyPoints: [] as string[] });

// 主题选项
const themeOptions = [
    { label: '学术风格', value: 'academic' },
    { label: '默认主题', value: 'default' },
    { label: '商务风格', value: 'frankfurt' }
];

// 计算属性
const canProceed = computed(() => {
    return slideRequest.value.title.trim() !== '' &&
           slideRequest.value.topic.trim() !== '' &&
           Object.keys(formErrors.value).length === 0;
});

// 表单验证
const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!slideRequest.value.title.trim()) errors.title = '演示标题不能为空';
    if (!slideRequest.value.topic.trim()) errors.topic = '主题关键词不能为空';
    formErrors.value = errors;
    return Object.keys(errors).length === 0;
};

const validateField = (field: keyof KnowledgeSlideRequest) => {
    const tempErrors = { ...formErrors.value };
    delete tempErrors[field];
    formErrors.value = tempErrors;
    validateForm();
};

// 生成PPT主流程
const generatePPT = async () => {
    if (!validateForm()) return;

    isGenerating.value = true;
    currentStage.value = 'outline';

    try {
        const result = await knowledgeBasedSlideApi.generateOutline(slideRequest.value);
        if (result.success) {
            generatedOutline.value = result.data;
            toast.add({
                severity: 'success',
                summary: '大纲生成成功',
                detail: `已生成包含 ${result.data.totalSlides} 页的演示大纲`
            });
        } else {
            throw new Error(result.error || '大纲生成失败');
        }
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '生成失败', detail: error.message });
        currentStage.value = 'config';
    } finally {
        isGenerating.value = false;
    }
};

// 重新生成大纲
const regenerateOutline = async () => {
    generatedOutline.value = null;
    await generatePPT();
};

// 确认并生成最终内容
const confirmAndGenerate = async () => {
    if (!generatedOutline.value) return;

    isGeneratingFinal.value = true;
    try {
        const slideId = `kb-slide-${uuidv4()}`;
        const result = await knowledgeBasedSlideApi.generateMarkdown({
            outline: generatedOutline.value,
            slideId,
            format: 'slidev'
        });
        
        if (result.success) {
            finalProject.value = {
                id: slideId,
                name: generatedOutline.value.title,
                title: generatedOutline.value.title,
                content: result.data.markdown,
                slides_path: result.data.slides_path,
                theme: slideRequest.value.theme || 'academic',
                status: 'ready'
            };
            currentStage.value = 'complete';
            toast.add({ severity: 'success', summary: '生成完成', detail: '演示文稿已成功生成' });
        } else {
            throw new Error(result.error || 'Markdown生成失败');
        }
    } catch (error: any) {
        toast.add({ severity: 'error', summary: '生成失败', detail: error.message });
    } finally {
        isGeneratingFinal.value = false;
    }
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
    showEditSlideDialog.value = true;
};

const saveEditedSlide = () => {
    if (!generatedOutline.value || editingSlideIndex.value < 0) return;
    const slide = generatedOutline.value.slides[editingSlideIndex.value];
    slide.title = editingSlideData.value.title;
    slide.content = editingSlideData.value.content;
    slide.keyPoints = editingSlideData.value.keyPoints;
    showEditSlideDialog.value = false;
    toast.add({ severity: 'success', summary: '保存成功', detail: '幻灯片已更新' });
};

// 其他操作
const addExample = () => {
    slideRequest.value = {
        title: 'Vue.js 3 组件设计最佳实践',
        topic: 'Vue.js 组件 响应式 Composition API',
        requirements: '面向有Vue基础的开发者，包含实际代码示例',
        targetAudience: '前端开发工程师',
        slideCount: 12,
        theme: 'academic'
    };
};

const previewPresentation = () => {
    if (finalProject.value) {
        // 为知识库项目创建临时预览
        const markdown = finalProject.value.content;
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        
        // 下载文件供用户本地预览
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalProject.value.name}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.add({
            severity: 'info',
            summary: '预览文件已下载',
            detail: '请使用 Slidev CLI 在本地预览：slidev ' + `${finalProject.value.name}.md`,
            life: 8000
        });
    }
};

const goHome = () => {
    router.push('/knowledge-slides');
};

// 跳转到项目管理器
const goToManager = () => {
    router.push('/knowledge-slides/manager');
};

// 下载Markdown文件
const downloadMarkdown = () => {
    if (finalProject.value) {
        const blob = new Blob([finalProject.value.content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${finalProject.value.name}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.add({
            severity: 'success',
            summary: '下载成功',
            detail: 'Markdown文件已下载到本地'
        });
    }
};

// 加载知识库统计
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

onMounted(() => {
    loadKnowledgeStats();
});
</script>

<style scoped>
.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>