<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Panel from 'primevue/panel';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Chip from 'primevue/chip';

import type { KnowledgeSlidevProject } from './dto';
import * as knowledgeSlidevApi from '@/api/knowledge-slidev';
import { useSlidesStore } from '@/store/slide';
import { useAuthStore } from '@/store/auth';
import { API_BASE_URL } from '@/utils/api';

// 缺少的导入
import InputText from 'primevue/inputtext';
import ProgressBar from 'primevue/progressbar';

const props = defineProps<{
    id: string;
    project?: KnowledgeSlidevProject;
}>();

const emit = defineEmits<{
    (e: 'complete'): void;
    (e: 'error', error: string): void;
}>();

const router = useRouter();
const toast = useToast();
const slidesStore = useSlidesStore();
const authStore = useAuthStore();

// 状态管理
const currentProject = ref<KnowledgeSlidevProject | null>(null);
const isLoading = ref(false);
const showDeleteDialog = ref(false);
const showSaveToPublicDialog = ref(false);
const previewUrl = ref('');
const saveToPublicProgress = ref(0);
const isSavingToPublic = ref(false);

// 计算属性
const projectStats = computed(() => {
    if (!currentProject.value?.content) return null;
    
    const content = currentProject.value.content;
    const lines = content.split('\n').length;
    const characters = content.length;
    const words = content.split(/\s+/).filter(word => word.length > 0).length;
    const slides = (content.match(/^---$/gm) || []).length + 1;
    
    return { lines, characters, words, slides };
});

// 加载项目数据
const loadProject = () => {
    if (props.project) {
        currentProject.value = props.project;
        return;
    }
    
    // 从localStorage加载
    try {
        const savedData = localStorage.getItem(`knowledge-slide-${props.id}`);
        if (savedData) {
            const data = JSON.parse(savedData);
            currentProject.value = data.project;
        }
    } catch (error) {
        console.error('加载项目数据失败:', error);
        emit('error', '加载项目数据失败');
    }
};

// 预览幻灯片
const previewSlides = async () => {
    if (!currentProject.value) return;
    
    isLoading.value = true;
    
    try {
        // 调用知识库Slidev API获取预览端口
        const response = await knowledgeSlidevApi.getPreviewPort(currentProject.value.id);
        
        if (response.success && response.data?.port) {
            const previewUrl = `http://localhost:${response.data.port}`;
            
            // 打开新窗口预览
            window.open(previewUrl, '_blank');
            
            toast.add({
                severity: 'success',
                summary: '预览已开启',
                detail: `幻灯片已在端口 ${response.data.port} 上启动预览`
            });
        } else {
            throw new Error(response.error || '获取预览端口失败');
        }
    } catch (error) {
        console.error('启动预览失败:', error);
        toast.add({
            severity: 'error',
            summary: '预览失败',
            detail: '无法启动Slidev预览服务'
        });
    } finally {
        isLoading.value = false;
    }
};

// 下载项目文件
const downloadProject = () => {
    if (!currentProject.value) return;
    
    const blob = new Blob([currentProject.value.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentProject.value.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.add({
        severity: 'success',
        summary: '下载完成',
        detail: 'Slidev项目文件已下载'
    });
};

// 导出PDF
const exportPDF = async () => {
    if (!currentProject.value) return;
    
    isLoading.value = true;
    
    try {
        // 调用知识库Slidev API导出PDF
        const response = await knowledgeSlidevApi.exportProject(currentProject.value.id, {
            format: 'pdf',
            dark: false,
            withClicks: false
        });
        
        if (response.success) {
            // 下载PDF文件
            const filename = `${currentProject.value.name}.pdf`;
            const downloadUrl = `/api/knowledge-slides/project/${currentProject.value.id}/download/${filename}`;
            
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            toast.add({
                severity: 'success',
                summary: 'PDF导出成功',
                detail: 'PDF文件已生成并下载'
            });
        } else {
            throw new Error(response.error || 'PDF导出失败');
        }
    } catch (error) {
        console.error('导出PDF失败:', error);
        toast.add({
            severity: 'error',
            summary: '导出失败',
            detail: 'PDF导出失败，请稍后重试'
        });
    } finally {
        isLoading.value = false;
    }
};

// 保存到公共幻灯片
const saveToPublicSlides = async () => {
    if (!currentProject.value || !authStore.user) {
        toast.add({
            severity: 'error',
            summary: '保存失败',
            detail: '项目数据或用户信息缺失'
        });
        return;
    }
    
    showSaveToPublicDialog.value = true;
};

// 确认保存到公共幻灯片
const confirmSaveToPublic = async () => {
    if (!currentProject.value || !authStore.user) return;
    
    isSavingToPublic.value = true;
    saveToPublicProgress.value = 0;
    
    try {
        // 第一步：创建标准幻灯片
        saveToPublicProgress.value = 20;
        
        // 将知识库项目的内容转换为标准格式
        const slideContent = `---
layout: cover
background: 'https://cover.sli.dev'
---

# ${currentProject.value.title}

基于知识库智能生成的演示文稿

---

${currentProject.value.content.split('---').slice(1).join('---')}`;
        
        // 创建FormData，符合标准幻灯片API格式
        const formData = new FormData();
        formData.append('title', currentProject.value.title);
        formData.append('content', slideContent);
        formData.append('theme', currentProject.value.theme || 'academic');
        formData.append('visibility', 'public'); // 设置为公开
        
        saveToPublicProgress.value = 40;
        
        // 调用标准幻灯片创建API
        const response = await slidesStore.createSlide(formData);
        
        if (response.status === 200 || response.status === 201) {
            const slideId = response.data.id;
            saveToPublicProgress.value = 60;
            
            // 加载新创建的slide到缓存
            await slidesStore.getSlideById(slideId);
            
            // 创建标准格式的大纲
            const standardOutlines = [];
            const slidePages = currentProject.value.content.split('---').filter(page => page.trim());
            
            for (let i = 0; i < slidePages.length; i++) {
                const page = slidePages[i].trim();
                const lines = page.split('\n').filter(line => line.trim());
                const title = lines.find(line => line.startsWith('#'))?.replace('#', '').trim() || `第${i + 1}页`;
                
                standardOutlines.push({
                    group: title,
                    content: page
                });
            }
            
            saveToPublicProgress.value = 80;
            
            // 保存大纲到标准幻灯片
            await slidesStore.saveOutlines(slideId, standardOutlines);
            
            saveToPublicProgress.value = 100;
            
            // 成功提示
            toast.add({
                severity: 'success',
                summary: '保存成功',
                detail: `已成功保存到公共幻灯片！幻灯片ID: ${slideId}`
            });
            
            // 关闭对话框
            setTimeout(() => {
                showSaveToPublicDialog.value = false;
                isSavingToPublic.value = false;
                saveToPublicProgress.value = 0;
            }, 2000);
            
        } else {
            throw new Error('创建幻灯片失败');
        }
        
    } catch (error) {
        console.error('保存到公共幻灯片失败:', error);
        toast.add({
            severity: 'error',
            summary: '保存失败',
            detail: '保存到公共幻灯片失败，请稍后重试'
        });
        
        isSavingToPublic.value = false;
        saveToPublicProgress.value = 0;
    }
};

// 发布到网站
const publishToWeb = async () => {
    if (!currentProject.value) return;
    
    isLoading.value = true;
    let eventSource: EventSource | null = null;
    
    try {
        // 先构建项目
        toast.add({
            severity: 'info',
            summary: '开始构建',
            detail: '正在构建Slidev项目...'
        });
        
        // 监听构建进度（SSE）
        eventSource = knowledgeSlidevApi.buildProject(
            currentProject.value.id,
            (data) => {
                if (data.type === 'build_progress') {
                    toast.add({
                        severity: 'info',
                        summary: '构建进度',
                        detail: data.message
                    });
                } else if (data.type === 'build_success') {
                    // 构建成功，生成发布URL
                    const publishUrl = `${window.location.origin}/api/knowledge-slides/preview/${currentProject.value.id}/`;
                    
                    // 复制URL到剪贴板
                    navigator.clipboard.writeText(publishUrl).then(() => {
                        toast.add({
                            severity: 'success',
                            summary: '发布成功',
                            detail: '演示已发布，链接已复制到剪贴板'
                        });
                    }).catch(() => {
                        toast.add({
                            severity: 'success',
                            summary: '发布成功',
                            detail: `演示已发布，访问地址：${publishUrl}`
                        });
                    });
                    
                    // 关闭EventSource
                    if (eventSource) {
                        eventSource.close();
                    }
                    isLoading.value = false;
                } else if (data.type === 'build_error') {
                    throw new Error(data.error || '构建失败');
                } else if (data.done) {
                    // SSE流结束
                    if (eventSource) {
                        eventSource.close();
                    }
                    isLoading.value = false;
                }
            },
            (error) => {
                console.error('构建失败:', error);
                toast.add({
                    severity: 'error',
                    summary: '发布失败',
                    detail: '项目构建失败，请稍后重试'
                });
                if (eventSource) {
                    eventSource.close();
                }
                isLoading.value = false;
            }
        );
        
    } catch (error) {
        console.error('发布失败:', error);
        toast.add({
            severity: 'error',
            summary: '发布失败',
            detail: '发布到网站失败，请稍后重试'
        });
        if (eventSource) {
            eventSource.close();
        }
        isLoading.value = false;
    }
};

// 编辑项目
const editProject = () => {
    // 返回到Markdown编辑阶段
    router.push({
        path: '/knowledge-slides/process',
        query: { id: props.id, stage: 'markdown' }
    });
};

// 重新生成
const regenerateProject = () => {
    // 返回到配置阶段
    router.push({
        path: '/knowledge-slides/process',
        query: { id: props.id, stage: 'config' }
    });
};

// 删除项目
const deleteProject = () => {
    try {
        // 从localStorage删除
        localStorage.removeItem(`knowledge-slide-${props.id}`);
        
        showDeleteDialog.value = false;
        
        toast.add({
            severity: 'info',
            summary: '项目已删除',
            detail: '项目数据已清除'
        });
        
        // 跳转到知识库首页
        setTimeout(() => {
            router.push('/knowledge-slides');
        }, 1000);
        
    } catch (error) {
        console.error('删除项目失败:', error);
        toast.add({
            severity: 'error',
            summary: '删除失败',
            detail: '删除项目失败'
        });
    }
};

// 完成并返回
const completeAndReturn = () => {
    toast.add({
        severity: 'success',
        summary: '任务完成',
        detail: '知识库PPT生成已完成'
    });
    
    setTimeout(() => {
        emit('complete');
    }, 1000);
};

// 创建新项目
const createNewProject = () => {
    router.push('/knowledge-slides/process?stage=config');
};

// 复制内容到剪贴板
const copyContent = async () => {
    if (!currentProject.value?.content) return;
    
    try {
        await navigator.clipboard.writeText(currentProject.value.content);
        toast.add({
            severity: 'info',
            summary: '复制成功',
            detail: '内容已复制到剪贴板'
        });
    } catch (error) {
        console.error('复制失败:', error);
        toast.add({
            severity: 'error',
            summary: '复制失败',
            detail: '无法复制到剪贴板'
        });
    }
};

// 组件挂载
onMounted(() => {
    loadProject();
    
    if (!currentProject.value) {
        emit('error', '未找到项目数据');
    }
});
</script>

<template>
    <div class="knowledge-stage4-preview p-6">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <div v-if="!currentProject" class="text-center py-12">
                <i class="pi pi-exclamation-triangle text-4xl text-gray-400 mb-4"></i>
                <h3 class="text-xl font-medium text-gray-700 mb-2">未找到项目数据</h3>
                <p class="text-gray-500 mb-6">项目可能已被删除或数据损坏</p>
                <Button 
                    label="创建新项目" 
                    @click="createNewProject"
                    icon="pi pi-plus"
                />
            </div>

            <div v-else class="space-y-6">
                <!-- 项目概览 -->
                <Card>
                    <template #title>
                        <div class="flex align-items-center gap-2">
                            <i class="pi pi-eye"></i>
                            项目预览
                        </div>
                    </template>
                    
                    <template #content>
                        <div class="space-y-6">
                            <!-- 项目信息 -->
                            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                                <div class="flex justify-content-between align-items-start mb-4">
                                    <div>
                                        <h2 class="text-2xl font-bold text-gray-800 mb-2">{{ currentProject.name }}</h2>
                                        <p class="text-gray-600">基于知识库智能生成的Slidev演示文稿</p>
                                    </div>
                                    <div class="flex gap-2">
                                        <Tag 
                                            :value="currentProject.status === 'ready' ? '已完成' : '生成中'"
                                            :severity="currentProject.status === 'ready' ? 'success' : 'warning'"
                                        />
                                        <Tag :value="currentProject.theme" severity="info" />
                                    </div>
                                </div>
                                
                                <!-- 统计信息 -->
                                <div v-if="projectStats" class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-blue-600">{{ projectStats.slides }}</div>
                                        <div class="text-sm text-gray-600">幻灯片页数</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-green-600">{{ projectStats.words }}</div>
                                        <div class="text-sm text-gray-600">总词数</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-purple-600">{{ projectStats.characters }}</div>
                                        <div class="text-sm text-gray-600">字符数</div>
                                    </div>
                                    <div class="text-center">
                                        <div class="text-2xl font-bold text-orange-600">{{ projectStats.lines }}</div>
                                        <div class="text-sm text-gray-600">行数</div>
                                    </div>
                                </div>
                            </div>

                            <!-- 操作区域 -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <!-- 预览操作 -->
                                <Card class="h-full">
                                    <template #title>
                                        <div class="flex align-items-center gap-2 text-lg">
                                            <i class="pi pi-eye text-blue-500"></i>
                                            预览演示
                                        </div>
                                    </template>
                                    <template #content>
                                        <p class="text-gray-600 text-sm mb-4">
                                            在浏览器中实时预览Slidev演示效果
                                        </p>
                                        <Button 
                                            label="🚀 启动预览"
                                            class="w-full"
                                            @click="previewSlides"
                                        />
                                    </template>
                                </Card>

                                <!-- 导出操作 -->
                                <Card class="h-full">
                                    <template #title>
                                        <div class="flex align-items-center gap-2 text-lg">
                                            <i class="pi pi-download text-green-500"></i>
                                            导出文件
                                        </div>
                                    </template>
                                    <template #content>
                                        <p class="text-gray-600 text-sm mb-4">
                                            下载Markdown源文件或导出PDF格式
                                        </p>
                                        <div class="space-y-2">
                                            <Button 
                                                label="📄 下载MD文件"
                                                class="w-full"
                                                severity="secondary"
                                                @click="downloadProject"
                                                outlined
                                            />
                                            <Button 
                                                label="📑 导出PDF"
                                                class="w-full"
                                                severity="info"
                                                :loading="isLoading"
                                                @click="exportPDF"
                                                outlined
                                            />
                                        </div>
                                    </template>
                                </Card>

                                <!-- 分享操作 -->
                                <Card class="h-full">
                                    <template #title>
                                        <div class="flex align-items-center gap-2 text-lg">
                                            <i class="pi pi-share-alt text-purple-500"></i>
                                            分享发布
                                        </div>
                                    </template>
                                    <template #content>
                                        <p class="text-gray-600 text-sm mb-4">
                                            保存到公共幻灯片或发布到网站
                                        </p>
                                        <div class="space-y-2">
                                            <Button 
                                                label="💾 保存到公共幻灯片"
                                                class="w-full"
                                                severity="success"
                                                @click="saveToPublicSlides"
                                                outlined
                                            />
                                            <Button 
                                                label="🌐 发布到网站"
                                                class="w-full"
                                                severity="info"
                                                :loading="isLoading"
                                                @click="publishToWeb"
                                                outlined
                                            />
                                            <Button 
                                                label="📋 复制内容"
                                                class="w-full"
                                                severity="secondary"
                                                @click="copyContent"
                                                outlined
                                            />
                                        </div>
                                    </template>
                                </Card>
                            </div>

                            <!-- 内容预览 -->
                            <Panel header="📝 内容预览" toggleable collapsed>
                                <div class="relative">
                                    <pre class="text-sm text-gray-800 bg-gray-50 p-4 rounded border max-h-80 overflow-auto whitespace-pre-wrap">{{ currentProject.content }}</pre>
                                    <Button
                                        icon="pi pi-copy"
                                        class="absolute top-2 right-2"
                                        size="small"
                                        text
                                        @click="copyContent"
                                    />
                                </div>
                            </Panel>
                        </div>
                    </template>
                </Card>

                <!-- 操作按钮 -->
                <div class="flex gap-4 justify-center flex-wrap">
                    <Button 
                        label="✏️ 编辑内容"
                        severity="secondary"
                        @click="editProject"
                        outlined
                    />
                    <Button 
                        label="🔄 重新生成"
                        severity="warning"
                        @click="regenerateProject"
                        outlined
                    />
                    <Button 
                        label="🗑️ 删除项目"
                        severity="danger"
                        @click="showDeleteDialog = true"
                        outlined
                    />
                    <Button 
                        label="✅ 完成"
                        severity="success"
                        @click="completeAndReturn"
                        size="large"
                    />
                </div>
            </div>
        </div>

        <!-- 保存到公共幻灯片对话框 -->
        <Dialog 
            v-model:visible="showSaveToPublicDialog" 
            modal 
            header="💾 保存到公共幻灯片" 
            style="width: 500px"
        >
            <div class="space-y-4">
                <Message severity="info">
                    将当前知识库PPT保存到公共幻灯片系统，供其他用户查看和下载。
                </Message>
                
                <div class="bg-gray-50 rounded p-3 space-y-2">
                    <div><strong>项目名称：</strong>{{ currentProject?.title }}</div>
                    <div><strong>主题：</strong>{{ currentProject?.theme }}</div>
                    <div><strong>幻灯片页数：</strong>{{ projectStats?.slides || 0 }}页</div>
                    <div><strong>可见性：</strong>公开</div>
                </div>
                
                <div v-if="isSavingToPublic" class="space-y-2">
                    <div class="flex justify-content-between align-items-center">
                        <span>保存进度：</span>
                        <span>{{ saveToPublicProgress }}%</span>
                    </div>
                    <ProgressBar :value="saveToPublicProgress" />
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="取消" 
                        severity="secondary" 
                        @click="showSaveToPublicDialog = false"
                        :disabled="isSavingToPublic"
                        outlined
                    />
                    <Button 
                        label="确认保存" 
                        severity="success"
                        @click="confirmSaveToPublic"
                        :loading="isSavingToPublic"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 删除确认对话框 -->
        <Dialog 
            v-model:visible="showDeleteDialog" 
            modal 
            header="⚠️ 确认删除" 
            style="width: 400px"
        >
            <div class="space-y-4">
                <Message severity="warn">
                    确定要删除这个项目吗？此操作不可撤销。
                </Message>
                <div class="bg-gray-50 rounded p-3">
                    <strong>项目名称：</strong>{{ currentProject?.name }}
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="取消" 
                        severity="secondary" 
                        @click="showDeleteDialog = false"
                        outlined
                    />
                    <Button 
                        label="确认删除" 
                        severity="danger"
                        @click="deleteProject"
                    />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-stage4-preview {
    min-height: calc(100vh - 200px);
}

:deep(.p-card-title) {
    font-size: 1.1rem;
    font-weight: 600;
}

:deep(.p-card-content) {
    padding: 1rem;
}

:deep(.p-panel-content) {
    padding: 1rem;
}

pre {
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>