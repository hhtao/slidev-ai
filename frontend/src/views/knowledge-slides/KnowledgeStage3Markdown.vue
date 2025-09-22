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
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import Divider from 'primevue/divider';

import type { 
    KnowledgeSlideOutline, 
    KnowledgeSlidevProject, 
    KnowledgeMessageItem 
} from './dto';
import { knowledgeBasedSlideApi } from '@/api/knowledge-based-slide';
import { knowledgeSlidevApi } from '@/api/knowledge-slidev';

// 缺少的导入
import InputText from 'primevue/inputtext';

const props = defineProps<{
    id: string;
    outline?: KnowledgeSlideOutline;
}>();

const emit = defineEmits<{
    (e: 'complete', project: KnowledgeSlidevProject): void;
    (e: 'error', error: string): void;
    (e: 'processing-update', isProcessing: boolean): void;
}>();

const toast = useToast();

// 状态管理
const isGenerating = ref(false);
const error = ref('');
const eventSource = ref<EventSource | null>(null);
const generatedProject = ref<KnowledgeSlidevProject | null>(null);
const messages = ref<KnowledgeMessageItem[]>([]);
const connectionRetries = ref(0);
const hasFinished = ref(false);
const currentOutline = ref<KnowledgeSlideOutline | null>(null);
const generatedMarkdown = ref('');

// 对话框状态
const showMarkdownDialog = ref(false);
const showEditDialog = ref(false);
const editableMarkdown = ref('');

const MAX_RETRIES = 3;

// 计算属性
const canProceed = computed(() => {
    return generatedProject.value && !isGenerating.value;
});

const overallProgress = computed(() => {
    if (!isGenerating.value) return 0;
    if (hasFinished.value) return 100;
    
    // 根据消息计算进度
    const totalSteps = 5; // 分析大纲、生成内容、格式化、优化、完成
    let completedSteps = 0;
    
    if (messages.value.some(m => m.type === 'outline_generation' && m.status === 'done')) {
        completedSteps++;
    }
    if (messages.value.some(m => m.type === 'markdown_generation' && m.status === 'pending')) {
        completedSteps++;
    }
    if (messages.value.some(m => m.type === 'markdown_generation' && m.status === 'done')) {
        completedSteps += 3;
    }
    
    return Math.round((completedSteps / totalSteps) * 100);
});

// 加载大纲数据
const loadOutline = () => {
    if (props.outline) {
        currentOutline.value = props.outline;
        return;
    }
    
    // 从localStorage加载
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            currentOutline.value = data.outline;
        }
    } catch (error) {
        console.error('加载大纲数据失败:', error);
    }
};

// 检查是否已有生成的项目
const checkExistingProject = () => {
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            if (data.project) {
                generatedProject.value = data.project;
                generatedMarkdown.value = data.project.content || '';
                toast.add({
                    severity: 'success',
                    summary: '项目已恢复',
                    detail: '检测到之前生成的项目，已自动恢复'
                });
                return true;
            }
        }
    } catch (error) {
        console.error('检查现有项目失败:', error);
    }
    return false;
};

// 保存项目到localStorage
const saveProjectToStorage = (project: KnowledgeSlidevProject) => {
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        const data = savedData ? JSON.parse(savedData) : {};
        data.project = project;
        data.stage = 'preview';
        localStorage.setItem(`knowledge-slide-${props.id}`, JSON.stringify(data));
    } catch (error) {
        console.error('保存项目失败:', error);
    }
};

// 生成Markdown内容
const generateMarkdown = async () => {
    if (!currentOutline.value) {
        emit('error', '缺少大纲数据');
        return;
    }

    isGenerating.value = true;
    hasFinished.value = false;
    error.value = '';
    messages.value = [];
    connectionRetries.value = 0;
    emit('processing-update', true);

    try {
        console.log('开始生成Markdown内容...', currentOutline.value);
        
        // 添加初始消息
        messages.value.push({
            type: 'outline_generation',
            status: 'pending',
            message: '正在分析大纲结构...',
            timestamp: Date.now()
        });

        // 构建生成请求
        const generateRequest = {
            outline: currentOutline.value,
            slideId: props.id,
            format: 'slidev' // 指定生成Slidev格式
        };

        const result = await knowledgeBasedSlideApi.generateMarkdown(generateRequest);
        
        if (result.success) {
            // 创建知识库Slidev项目
            const createProjectRequest = {
                title: currentOutline.value.title,
                content: result.data.markdown,
                theme: currentOutline.value.theme || 'academic'
            };
            
            // 调用knowledge-slidev API创建项目
            const projectResult = await knowledgeSlidevApi.createProject(createProjectRequest);
            
            if (projectResult.success) {
                const project: KnowledgeSlidevProject = {
                    id: projectResult.data.id,
                    name: projectResult.data.name,
                    title: projectResult.data.title,
                    content: projectResult.data.content,
                    slides_path: projectResult.data.slides_path,
                    theme: projectResult.data.theme,
                    status: projectResult.data.status,
                    createdAt: projectResult.data.createdAt,
                    updatedAt: projectResult.data.updatedAt
                };
                
                generatedProject.value = project;
                generatedMarkdown.value = result.data.markdown;
                hasFinished.value = true;
                
                // 保存到localStorage
                saveProjectToStorage(project);
                
                // 添加完成消息
                messages.value.push({
                    type: 'done',
                    status: 'done',
                    message: 'Slidev项目创建完成',
                    timestamp: Date.now()
                });

                toast.add({
                    severity: 'success',
                    summary: '项目创建成功',
                    detail: 'Slidev项目已创建并可预览',
                    life: 5000
                });
                
                // 自动打开预览对话框
                setTimeout(() => {
                    showMarkdownDialog.value = true;
                }, 1000);
            } else {
                throw new Error(projectResult.error || 'Slidev项目创建失败');
            }
            
        } else {
            throw new Error(result.error || 'Markdown生成失败');
        }
    } catch (error: any) {
        console.error('生成Markdown失败:', error);
        
        let errorMessage = '生成Markdown内容失败';
        
        if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || '大纲数据格式错误';
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

// 重新生成Markdown
const regenerateMarkdown = () => {
    generatedProject.value = null;
    generatedMarkdown.value = '';
    showMarkdownDialog.value = false;
    generateMarkdown();
};

// 编辑Markdown
const editMarkdown = () => {
    editableMarkdown.value = generatedMarkdown.value;
    showEditDialog.value = true;
};

// 保存编辑的Markdown
const saveEditedMarkdown = () => {
    if (!generatedProject.value) return;
    
    generatedProject.value.content = editableMarkdown.value;
    generatedMarkdown.value = editableMarkdown.value;
    
    // 更新localStorage
    saveProjectToStorage(generatedProject.value);
    
    showEditDialog.value = false;
    
    toast.add({
        severity: 'success',
        summary: '保存成功',
        detail: 'Markdown内容已更新'
    });
};

// 下载Markdown文件
const downloadMarkdown = () => {
    if (!generatedMarkdown.value || !generatedProject.value) return;
    
    const blob = new Blob([generatedMarkdown.value], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedProject.value.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.add({
        severity: 'info',
        summary: '下载完成',
        detail: 'Markdown文件已下载到本地'
    });
};

// 进入预览阶段
const proceedToPreview = () => {
    if (!generatedProject.value) return;
    
    // 保存最新状态
    saveProjectToStorage(generatedProject.value);
    
    toast.add({
        severity: 'info',
        summary: '进入预览阶段',
        detail: '正在跳转到预览页面...'
    });
    
    setTimeout(() => {
        emit('complete', generatedProject.value!);
    }, 1000);
};

// 获取消息图标
const getMessageIcon = (type: KnowledgeMessageItem['type']) => {
    switch (type) {
        case 'outline_generation': return 'pi pi-list';
        case 'markdown_generation': return 'pi pi-file-edit';
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

// 格式化Markdown预览
const formatMarkdownPreview = (markdown: string) => {
    // 限制预览长度
    return markdown.length > 1000 ? markdown.substring(0, 1000) + '...' : markdown;
};

// 计算统计信息
const markdownStats = computed(() => {
    if (!generatedMarkdown.value) return null;
    
    const lines = generatedMarkdown.value.split('\n');
    const characters = generatedMarkdown.value.length;
    const words = generatedMarkdown.value.split(/\s+/).filter(word => word.length > 0).length;
    const slides = (generatedMarkdown.value.match(/^---$/gm) || []).length + 1;
    
    return { lines: lines.length, characters, words, slides };
});

// 组件挂载
onMounted(() => {
    loadOutline();
    
    // 检查是否已有项目，如果没有则开始生成
    if (!checkExistingProject()) {
        // 延迟一下开始生成，让用户看到界面
        setTimeout(() => {
            generateMarkdown();
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
    <div class="knowledge-stage3-markdown p-6">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左侧：Markdown生成状态 -->
                <div class="lg:col-span-2">
                    <Card>
                        <template #title>
                            <div class="flex align-items-center gap-2">
                                <i class="pi pi-file-edit"></i>
                                智能内容生成
                            </div>
                        </template>
                        
                        <template #content>
                            <!-- 大纲概览 -->
                            <div v-if="currentOutline" class="mb-6">
                                <h3 class="font-medium text-gray-800 mb-3">基于大纲</h3>
                                <div class="bg-gray-50 rounded-lg p-4">
                                    <div class="flex items-center justify-between mb-2">
                                        <h4 class="font-medium">{{ currentOutline.title }}</h4>
                                        <div class="flex gap-2">
                                            <Tag :value="`${currentOutline.totalSlides} 页`" />
                                            <Tag :value="`${currentOutline.usedKnowledge.length} 个文档`" severity="info" />
                                        </div>
                                    </div>
                                    <p class="text-gray-600 text-sm">{{ currentOutline.summary }}</p>
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
                            <div v-if="generatedProject && !isGenerating" class="mb-6">
                                <div class="flex justify-content-between align-items-center mb-4">
                                    <h3 class="font-medium text-gray-800">生成结果</h3>
                                    <div v-if="markdownStats" class="flex gap-2">
                                        <Tag :value="`${markdownStats.slides} 页`" severity="success" />
                                        <Tag :value="`${markdownStats.words} 词`" severity="info" />
                                        <Tag :value="`${markdownStats.characters} 字符`" severity="secondary" />
                                    </div>
                                </div>
                                
                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div class="flex items-start gap-3">
                                        <i class="pi pi-check-circle text-green-500 mt-1"></i>
                                        <div class="flex-1">
                                            <h4 class="font-medium text-green-800">{{ generatedProject.name }}</h4>
                                            <p class="text-green-700 mt-1">Slidev演示文稿已生成完成</p>
                                            <div class="mt-2">
                                                <pre class="text-xs text-gray-600 bg-white p-2 rounded border max-h-32 overflow-y-auto">{{ formatMarkdownPreview(generatedMarkdown) }}</pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- 错误显示 -->
                            <Message v-if="error" severity="error" class="mb-6">
                                {{ error }}
                            </Message>

                            <!-- 操作按钮 -->
                            <div class="flex gap-3 flex-wrap">
                                <Button 
                                    v-if="!generatedProject && !isGenerating"
                                    label="🚀 开始生成内容"
                                    @click="generateMarkdown"
                                    size="large"
                                />
                                
                                <Button 
                                    v-if="generatedProject && !isGenerating"
                                    label="📄 查看完整内容"
                                    @click="showMarkdownDialog = true"
                                    size="large"
                                />
                                
                                <Button 
                                    v-if="generatedProject && !isGenerating"
                                    label="✏️ 编辑内容"
                                    severity="secondary"
                                    @click="editMarkdown"
                                    outlined
                                />
                                
                                <Button 
                                    v-if="generatedProject && !isGenerating"
                                    label="💾 下载文件"
                                    severity="info"
                                    @click="downloadMarkdown"
                                    outlined
                                />
                                
                                <Button 
                                    v-if="generatedProject && !isGenerating"
                                    label="🔄 重新生成"
                                    severity="warning"
                                    @click="regenerateMarkdown"
                                    outlined
                                />
                                
                                <Button 
                                    v-if="canProceed"
                                    label="👁️ 预览效果"
                                    severity="success"
                                    @click="proceedToPreview"
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
                                <i class="pi pi-info-circle"></i>
                                内容生成说明
                            </div>
                        </template>
                        
                        <template #content>
                            <div class="space-y-4 text-sm">
                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">📝 内容生成</h4>
                                    <p class="text-gray-600">
                                        基于大纲和知识库内容，AI会自动生成详细的Slidev格式
                                        演示文稿，包括标题、内容和代码示例。
                                    </p>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">🎨 Slidev特性</h4>
                                    <ul class="text-gray-600 space-y-1">
                                        <li>• 支持Markdown语法</li>
                                        <li>• 内置代码高亮</li>
                                        <li>• 支持Vue组件</li>
                                        <li>• 响应式设计</li>
                                    </ul>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">✏️ 编辑功能</h4>
                                    <p class="text-gray-600">
                                        生成后可以直接编辑Markdown内容，调整格式、
                                        添加内容或修改样式。
                                    </p>
                                </div>

                                <Divider />

                                <div>
                                    <h4 class="font-medium text-gray-800 mb-2">💾 导出选项</h4>
                                    <ul class="text-gray-600 space-y-1">
                                        <li>• 下载Markdown文件</li>
                                        <li>• 在线预览效果</li>
                                        <li>• 导出PDF格式</li>
                                        <li>• 发布到网站</li>
                                    </ul>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </div>

        <!-- Markdown内容对话框 -->
        <Dialog 
            v-model:visible="showMarkdownDialog" 
            modal 
            header="📄 Slidev演示文稿内容" 
            style="width: 90vw; max-width: 1200px"
            maximizable
        >
            <div v-if="generatedProject" class="space-y-4">
                <!-- 项目信息 -->
                <div class="flex justify-content-between align-items-center">
                    <div>
                        <h3 class="font-medium text-lg">{{ generatedProject.name }}</h3>
                        <p class="text-gray-600">{{ generatedProject.slides_path }}</p>
                    </div>
                    <div v-if="markdownStats" class="flex gap-2">
                        <Tag :value="`${markdownStats.slides} 页幻灯片`" severity="info" />
                        <Tag :value="`${markdownStats.words} 个词`" severity="success" />
                    </div>
                </div>

                <!-- Markdown内容 -->
                <Panel header="📋 Markdown源码" toggleable>
                    <div class="relative">
                        <pre class="text-sm text-gray-800 bg-gray-50 p-4 rounded border max-h-96 overflow-auto whitespace-pre-wrap">{{ generatedMarkdown }}</pre>
                        <Button
                            icon="pi pi-copy"
                            class="absolute top-2 right-2"
                            size="small"
                            text
                            @click="() => {
                                navigator.clipboard.writeText(generatedMarkdown);
                                toast.add({ severity: 'info', summary: '已复制', detail: '内容已复制到剪贴板' });
                            }"
                        />
                    </div>
                </Panel>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="关闭" 
                        severity="secondary" 
                        @click="showMarkdownDialog = false"
                        outlined
                    />
                    <Button 
                        label="✏️ 编辑" 
                        severity="info"
                        @click="editMarkdown"
                        outlined
                    />
                    <Button 
                        label="💾 下载" 
                        severity="success"
                        @click="downloadMarkdown"
                        outlined
                    />
                    <Button 
                        label="👁️ 预览效果" 
                        severity="primary"
                        @click="proceedToPreview"
                        icon="pi pi-arrow-right"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 编辑Markdown对话框 -->
        <Dialog 
            v-model:visible="showEditDialog" 
            modal 
            header="✏️ 编辑Markdown内容" 
            style="width: 90vw; max-width: 1200px"
            maximizable
        >
            <div class="space-y-4">
                <div class="flex justify-content-between align-items-center">
                    <span class="text-sm text-gray-600">提示：可以直接编辑Slidev格式的Markdown内容</span>
                    <Button
                        label="重置"
                        icon="pi pi-refresh"
                        size="small"
                        text
                        @click="editableMarkdown = generatedMarkdown"
                    />
                </div>
                
                <Textarea 
                    v-model="editableMarkdown"
                    rows="25"
                    class="w-full font-mono text-sm"
                    style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;"
                />
                
                <div v-if="editableMarkdown" class="text-xs text-gray-500">
                    {{ editableMarkdown.split('\n').length }} 行，{{ editableMarkdown.length }} 字符
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
                        @click="saveEditedMarkdown"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-stage3-markdown {
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

pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>