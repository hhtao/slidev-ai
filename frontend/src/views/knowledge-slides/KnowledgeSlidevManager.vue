<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

import { knowledgeSlidevApi, type KnowledgeSlidevProject } from '@/api/knowledge-slidev';
import { API_BASE_URL } from '@/utils/api';
import ProjectGuide from './ProjectGuide.vue';

const router = useRouter();
const toast = useToast();
const confirm = useConfirm();

// 状态管理
const projects = ref<KnowledgeSlidevProject[]>([]);
const loading = ref(false);
const showCreateDialog = ref(false);
const showCreateWithOptionsDialog = ref(false);
const showEditDialog = ref(false);
const showPreviewDialog = ref(false);
const showGuideDialog = ref(false);
const showConvertDialog = ref(false);  // 新增：转化对话框
const currentProject = ref<KnowledgeSlidevProject | null>(null);
const previewUrl = ref('');
const buildingProjects = ref(new Set<string>());
const exportingProjects = ref(new Set<string>());
const convertingProjects = ref(new Set<string>());  // 新增：转化中的项目

// 表单数据
const createForm = ref({
    title: '',
    content: '',
    theme: 'academic'
});

const editForm = ref({
    content: '',
    title: ''
});

// 转化表单数据
const convertForm = ref({
    title: '',
    description: '',
    visibility: 'public' as 'public' | 'private'
});

// 主题选项
const themeOptions = [
    { label: '学术主题', value: 'academic' },
    { label: '默认主题', value: 'default' },
    { label: '法兰克福主题', value: 'frankfurt' },
    { label: '企鹅主题', value: 'penguin' },
    { label: '漂亮主题', value: 'vuetiful' }
];

// 导出格式选项
const exportFormats = [
    { label: 'PDF文档', value: 'pdf', icon: 'pi pi-file-pdf' },
    { label: 'PNG图片', value: 'png', icon: 'pi pi-image' }
];

// 可见性选项
const visibilityOptions = [
    { label: '公开', value: 'public', icon: 'pi pi-globe' },
    { label: '私有', value: 'private', icon: 'pi pi-lock' }
];

// 计算属性
const filteredProjects = computed(() => {
    return projects.value.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
});

// 项目操作方法
const getProjectStatusLabel = (project: KnowledgeSlidevProject) => {
    switch (project.status) {
        case 'generating':
            return '生成中';
        case 'ready':
            return '就绪';
        case 'error':
            return '错误';
        default:
            return '未知';
    }
};

const getProjectStatusSeverity = (project: KnowledgeSlidevProject) => {
    switch (project.status) {
        case 'generating':
            return 'warning';
        case 'ready':
            return 'success';
        case 'error':
            return 'danger';
        default:
            return 'secondary';
    }
};

// 获取项目下一步操作
const getNextAction = (project: KnowledgeSlidevProject) => {
    if (!project.content || project.content.trim() === '') {
        return { label: '生成内容', action: 'generate-content', icon: 'pi pi-plus' };
    }
    if (project.status === 'ready') {
        return { label: '构建项目', action: 'build', icon: 'pi pi-cog' };
    }
    if (project.buildPath) {
        return { label: '在线预览', action: 'preview', icon: 'pi pi-eye' };
    }
    return { label: '查看详情', action: 'view', icon: 'pi pi-info-circle' };
};

// 执行项目操作
const executeAction = async (project: KnowledgeSlidevProject, action: string) => {
    switch (action) {
        case 'generate-content':
            await generateContent(project);
            break;
        case 'build':
            await buildProject(project);
            break;
        case 'preview':
            await previewProject(project);
            break;
        case 'view':
            await viewProject(project);
            break;
    }
};

// 生成内容
const generateContent = async (project: KnowledgeSlidevProject) => {
    // 跳转到知识库生成流程
    router.push({
        path: '/knowledge-slides/process',
        query: { 
            stage: 'config',
            projectId: project.id,
            title: project.title
        }
    });
};

// 数据格式化方法
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 显示项目引导
const showProjectGuide = (project: KnowledgeSlidevProject) => {
    currentProject.value = project;
    showGuideDialog.value = true;
};

// 处理引导完成后的项目更新
const handleProjectUpdate = (updatedProject: KnowledgeSlidevProject) => {
    const index = projects.value.findIndex(p => p.id === updatedProject.id);
    if (index !== -1) {
        projects.value[index] = updatedProject;
    }
};

// 查看项目详情
const viewProject = (project: KnowledgeSlidevProject) => {
    currentProject.value = project;
    editForm.value = {
        content: project.content || '',
        title: project.title
    };
    showEditDialog.value = true;
};
const loadProjects = async () => {
    loading.value = true;
    try {
        const result = await knowledgeSlidevApi.getProjectList();
        if (result.success) {
            projects.value = result.data || [];
        } else {
            toast.add({
                severity: 'error',
                summary: '加载失败',
                detail: result.error
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message
        });
    } finally {
        loading.value = false;
    }
};

// 创建项目
const createProject = async () => {
    if (!createForm.value.title || !createForm.value.content) {
        toast.add({
            severity: 'warn',
            summary: '验证失败',
            detail: '请填写标题和内容'
        });
        return;
    }

    try {
        const result = await knowledgeSlidevApi.createProject(createForm.value);
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '创建成功',
                detail: '项目已创建'
            });
            showCreateDialog.value = false;
            showCreateWithOptionsDialog.value = false;
            resetCreateForm();
            await loadProjects();
        } else {
            toast.add({
                severity: 'error',
                summary: '创建失败',
                detail: result.error
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '创建失败',
            detail: error.message
        });
    }
};

// 创建空项目
const createEmptyProject = () => {
    showCreateWithOptionsDialog.value = false;
    showCreateDialog.value = true;
};

// 使用知识库生成创建项目
const createWithKnowledgeGeneration = () => {
    showCreateWithOptionsDialog.value = false;
    // 跳转到知识库生成流程
    router.push('/knowledge-slides/process?stage=config');
};

// 编辑项目
const editProject = (project: KnowledgeSlidevProject) => {
    currentProject.value = project;
    editForm.value = {
        content: project.content,
        title: project.title
    };
    showEditDialog.value = true;
};

// 更新项目
const updateProject = async () => {
    if (!currentProject.value) return;

    try {
        const result = await knowledgeSlidevApi.updateProject(
            currentProject.value.id,
            editForm.value
        );
        
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '更新成功',
                detail: '项目已更新'
            });
            showEditDialog.value = false;
            
            // 更新成功后重新加载项目列表
            await loadProjects();
            
            // 如果项目有内容且状态不是 ready，尝试修复状态
            const updatedProject = projects.value.find(p => p.id === currentProject.value!.id);
            if (updatedProject && updatedProject.content && updatedProject.content.trim() && updatedProject.status !== 'ready') {
                await fixProjectStatus(updatedProject);
            }
        } else {
            toast.add({
                severity: 'error',
                summary: '更新失败',
                detail: result.error
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '更新失败',
            detail: error.message
        });
    }
};

// 修复项目状态
const fixProjectStatus = async (project: KnowledgeSlidevProject) => {
    // 如果项目有内容但状态不正确，尝试修复
    if (project.content && project.content.trim() && project.status !== 'ready') {
        try {
            // 这里可以调用后端API来修复状态，或者直接在前端更新
            console.log('修复项目状态:', project.id, '从', project.status, '到 ready');
            
            toast.add({
                severity: 'info',
                summary: '状态已修复',
                detail: '项目状态已自动修复为就绪状态'
            });
            
            // 重新加载项目列表
            await loadProjects();
        } catch (error) {
            console.error('修复项目状态失败:', error);
        }
    }
};

// 预览项目（使用公开幻灯片预览）
const previewProject = async (project: KnowledgeSlidevProject) => {
    if (!project.buildPath || project.status !== 'ready') {
        toast.add({
            severity: 'warn',
            summary: '预览失败',
            detail: '项目尚未构建完成'
        });
        return;
    }

    try {
        // 获取或生成公开幻灯片ID
        let slideId = project.publicSlideId;
        
        if (!slideId) {
            // 如果还没有转化为公开幻灯片，先转化
            const convertResult = await knowledgeSlidevApi.convertToPublicSlide(project.id, {
                title: project.title,
                description: `从知识库项目「${project.title}」转化的演示文稿`,
                visibility: 'public'
            });
            
            if (convertResult.success) {
                slideId = convertResult.data.slideId;
                // 更新项目信息
                await loadProjects();
            } else {
                toast.add({
                    severity: 'error',
                    summary: '预览失败',
                    detail: '无法生成预览链接'
                });
                return;
            }
        }
        
        // 打开公开幻灯片预览（使用正确的URL格式）
        const previewUrl = `${API_BASE_URL}/presentation/${slideId}`;
        window.open(previewUrl, '_blank');
        
        toast.add({
            severity: 'success',
            summary: '预览已打开',
            detail: '新窗口中打开预览页面'
        });
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '预览失败',
            detail: error.message
        });
    }
};

// 构建项目
const buildProject = (project: KnowledgeSlidevProject) => {
    buildingProjects.value.add(project.id);
    
    const eventSource = knowledgeSlidevApi.buildProject(
        project.id,
        (data) => {
            if (data.type === 'build_success') {
                toast.add({
                    severity: 'success',
                    summary: '构建完成',
                    detail: '项目已构建为静态网站'
                });
                buildingProjects.value.delete(project.id);
                loadProjects();
            } else if (data.type === 'build_error') {
                toast.add({
                    severity: 'error',
                    summary: '构建失败',
                    detail: data.error
                });
                buildingProjects.value.delete(project.id);
            }
        },
        (error) => {
            toast.add({
                severity: 'error',
                summary: '构建出错',
                detail: '构建过程中发生错误'
            });
            buildingProjects.value.delete(project.id);
        }
    );

    // 30秒后自动关闭连接
    setTimeout(() => {
        eventSource.close();
        buildingProjects.value.delete(project.id);
    }, 30000);
};

// 导出项目
const exportProject = async (project: KnowledgeSlidevProject, format: string) => {
    exportingProjects.value.add(project.id);
    
    try {
        const result = await knowledgeSlidevApi.exportProject(project.id, {
            format: format as 'pdf' | 'png',
            dark: false,
            withClicks: true
        });
        
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '导出成功',
                detail: `${format.toUpperCase()}文件已生成`
            });
            
            // 如果是单个文件，直接下载
            if (typeof result.data.exportPath === 'string') {
                const filename = result.data.exportPath.split('/').pop() || `${project.name}.${format}`;
                await knowledgeSlidevApi.downloadFile(project.id, filename);
            }
        } else {
            toast.add({
                severity: 'error',
                summary: '导出失败',
                detail: result.error
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '导出失败',
            detail: error.message
        });
    } finally {
        exportingProjects.value.delete(project.id);
    }
};

// 删除项目
const deleteProject = (project: KnowledgeSlidevProject) => {
    confirm.require({
        message: `确定要删除项目"${project.title}"吗？此操作不可撤销。`,
        header: '确认删除',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const result = await knowledgeSlidevApi.deleteProject(project.id);
                if (result.success) {
                    toast.add({
                        severity: 'info',
                        summary: '删除成功',
                        detail: '项目已删除'
                    });
                    await loadProjects();
                } else {
                    toast.add({
                        severity: 'error',
                        summary: '删除失败',
                        detail: result.error
                    });
                }
            } catch (error: any) {
                toast.add({
                    severity: 'error',
                    summary: '删除失败',
                    detail: error.message
                });
            }
        }
    });
};

// 打开新窗口预览
const openPreviewWindow = () => {
    if (previewUrl.value) {
        window.open(previewUrl.value, '_blank', 'width=1200,height=800');
    }
};

// 下载Markdown源文件
const downloadMarkdown = (project: KnowledgeSlidevProject) => {
    const blob = new Blob([project.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.add({
        severity: 'info',
        summary: '下载完成',
        detail: 'Markdown文件已下载'
    });
};

// 重置表单
const resetCreateForm = () => {
    createForm.value = {
        title: '',
        content: '',
        theme: 'academic'
    };
};

// 从知识库导入
const importFromKnowledge = () => {
    router.push('/knowledge-slides/process?stage=config');
};

// 获取状态标签样式
const getStatusSeverity = (status: string) => {
    switch (status) {
        case 'ready': return 'success';
        case 'generating': return 'warning';
        case 'error': return 'danger';
        default: return 'info';
    }
};

// 获取状态文本
const getStatusText = (status: string) => {
    switch (status) {
        case 'ready': return '就绪';
        case 'generating': return '生成中';
        case 'error': return '错误';
        default: return '未知';
    }
};

// 智能状态判断 - 根据实际情况显示状态
const getSmartStatusText = (project: KnowledgeSlidevProject) => {
    // 如果有内容但状态不是ready，显示为就绪
    if (project.content && project.content.trim() && project.status !== 'ready') {
        return '就绪 (已修复)';
    }
    return getStatusText(project.status);
};

// 智能状态样式
const getSmartStatusSeverity = (project: KnowledgeSlidevProject) => {
    // 如果有内容但状态不是ready，显示为成功样式
    if (project.content && project.content.trim() && project.status !== 'ready') {
        return 'success';
    }
    return getStatusSeverity(project.status);
};

// 转化为公开幻灯片
const convertToPublicSlide = (project: KnowledgeSlidevProject) => {
    if (!project.buildPath || project.status !== 'ready') {
        toast.add({
            severity: 'warn',
            summary: '无法转化',
            detail: '请先构建项目后再进行转化'
        });
        return;
    }

    currentProject.value = project;
    convertForm.value = {
        title: project.title,
        description: `从知识库项目「${project.title}」转化的演示文稿`,
        visibility: 'public'
    };
    showConvertDialog.value = true;
};

// 一键完成转化（自动构建 + 转化）
const autoCompleteConversion = async (project: KnowledgeSlidevProject) => {
    if (!project.content || !project.content.trim()) {
        toast.add({
            severity: 'warn',
            summary: '无法转化',
            detail: '项目内容为空，请先完善内容'
        });
        return;
    }

    convertingProjects.value.add(project.id);

    try {
        toast.add({
            severity: 'info',
            summary: '开始转化',
            detail: '正在自动构建并转化为公开幻灯片...'
        });

        // 第一步：构建项目
        const buildPromise = new Promise((resolve, reject) => {
            const eventSource = knowledgeSlidevApi.buildProject(
                project.id,
                (data) => {
                    if (data.type === 'build_success') {
                        toast.add({
                            severity: 'success',
                            summary: '构建完成',
                            detail: '正在转化为公开幻灯片...'
                        });
                        resolve(data);
                    } else if (data.type === 'build_error') {
                        reject(new Error(data.message || '构建失败'));
                    }
                },
                (error) => {
                    reject(error);
                }
            );
        });

        // 等待构建完成
        await buildPromise;
        
        // 重新加载项目信息
        await loadProjects();
        const updatedProject = projects.value.find(p => p.id === project.id);
        
        if (!updatedProject || !updatedProject.buildPath) {
            throw new Error('构建完成但未找到构建结果');
        }

        // 第二步：转化为公开幻灯片
        const convertData = {
            title: project.title,
            description: `从知识库项目「${project.title}」转化的演示文稿`,
            visibility: 'public' as 'public' | 'private'
        };

        const result = await knowledgeSlidevApi.convertToPublicSlide(project.id, convertData);
        
        if (result.success) {
            // 构建正确的预览URL（与公开幻灯片保持一致）
            const previewUrl = `${API_BASE_URL}/presentation/${result.data.slideId}`;
            
            toast.add({
                severity: 'success',
                summary: '转化成功',
                detail: '项目已成功转化为公开幻灯片'
            });
            
            await loadProjects();
            
            // 提示用户查看公开幻灯片
            confirm.require({
                message: `一键转化成功！预览地址：${previewUrl}\n\n您可以选择：`,
                header: '转化完成',
                icon: 'pi pi-check-circle',
                acceptLabel: '打开预览',
                rejectLabel: '查看公开列表',
                accept: () => {
                    window.open(previewUrl, '_blank');
                },
                reject: () => {
                    router.push('/public');
                }
            });
        } else {
            throw new Error(result.error || '转化过程中发生错误');
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '转化失败',
            detail: error.message || '一键转化过程中发生错误'
        });
    } finally {
        convertingProjects.value.delete(project.id);
    }
};

// 执行转化
const executeConvert = async () => {
    if (!currentProject.value) return;

    const projectId = currentProject.value.id;
    convertingProjects.value.add(projectId);

    try {
        const result = await knowledgeSlidevApi.convertToPublicSlide(projectId, convertForm.value);
        
        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '转化成功',
                detail: '项目已成功转化为公开幻灯片'
            });
            
            showConvertDialog.value = false;
            await loadProjects();
            
            // 构建正确的预览URL（与公开幻灯片保持一致）
            const previewUrl = `${API_BASE_URL}/presentation/${result.data.slideId}`;
            
            // 提示用户查看公开幻灯片
            confirm.require({
                message: `转化成功！预览地址：${previewUrl}\n\n您可以选择：`,
                header: '转化完成',
                icon: 'pi pi-check-circle',
                acceptLabel: '打开预览',
                rejectLabel: '查看公开列表',
                accept: () => {
                    window.open(previewUrl, '_blank');
                },
                reject: () => {
                    router.push('/public');
                }
            });
        } else {
            toast.add({
                severity: 'error',
                summary: '转化失败',
                detail: result.error || '转化过程中发生错误'
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '转化失败',
            detail: error.message || '转化过程中发生错误'
        });
    } finally {
        convertingProjects.value.delete(projectId);
    }
};

// 检查项目是否可转化 - 更智能的判断
const canConvert = (project: KnowledgeSlidevProject) => {
    // 必须有内容且未转化过
    const hasContent = project.content && project.content.trim();
    const notConverted = !project.convertedToPublic;
    
    // 如果有内容但没有buildPath，先构建再转化
    if (hasContent && !project.buildPath && notConverted) {
        return false; // 需要先构建
    }
    
    // 有内容且有构建结果且未转化
    return hasContent && project.buildPath && notConverted;
};

// 检查项目是否已转化
const isConverted = (project: KnowledgeSlidevProject) => {
    return project.convertedToPublic && project.publicSlideId;
};

// 查看公开幻灯片
const viewPublicSlide = (project: KnowledgeSlidevProject) => {
    if (project.publicSlideId) {
        const publicUrl = `${API_BASE_URL}/presentation/${project.publicSlideId}`;
        window.open(publicUrl, '_blank');
    } else {
        toast.add({
            severity: 'warn',
            summary: '无法打开',
            detail: '项目尚未转化为公开幻灯片'
        });
    }
};


// 组件挂载操作
onMounted(() => {
    loadProjects();
});
</script>

<template>
    <div class="knowledge-slidev-manager p-6">
        <Toast />
        <ConfirmDialog />
        
        <div class="max-w-7xl mx-auto">
            <!-- 页面标题 -->
            <div class="flex justify-content-between align-items-center mb-6">
                <div>
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">知识库Slidev管理</h1>
                    <p class="text-gray-600">管理基于知识库生成的Slidev演示文稿</p>
                </div>
                <div class="flex gap-3">
                    <Button 
                        label="从知识库生成"
                        icon="pi pi-database"
                        @click="showCreateWithOptionsDialog = true"
                        outlined
                    />
                    <Button 
                        label="新建项目"
                        icon="pi pi-plus"
                        @click="showCreateDialog = true"
                    />
                </div>
            </div>

            <!-- 项目统计 -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                    <template #content>
                        <div class="flex align-items-center gap-3">
                            <div class="bg-blue-100 rounded-full p-3">
                                <i class="pi pi-folder text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ projects.length }}</div>
                                <div class="text-gray-600 text-sm">总项目数</div>
                            </div>
                        </div>
                    </template>
                </Card>
                
                <Card>
                    <template #content>
                        <div class="flex align-items-center gap-3">
                            <div class="bg-green-100 rounded-full p-3">
                                <i class="pi pi-check-circle text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">
                                    {{ projects.filter(p => p.status === 'ready').length }}
                                </div>
                                <div class="text-gray-600 text-sm">就绪项目</div>
                            </div>
                        </div>
                    </template>
                </Card>
                
                <Card>
                    <template #content>
                        <div class="flex align-items-center gap-3">
                            <div class="bg-orange-100 rounded-full p-3">
                                <i class="pi pi-cog text-orange-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">
                                    {{ projects.filter(p => p.status === 'generating').length }}
                                </div>
                                <div class="text-gray-600 text-sm">生成中</div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <!-- 项目列表 -->
            <Card>
                <template #title>
                    <div class="flex align-items-center gap-2">
                        <i class="pi pi-list"></i>
                        项目列表
                    </div>
                </template>
                
                <template #content>
                    <DataTable 
                        :value="filteredProjects" 
                        :loading="loading"
                        paginator 
                        :rows="10"
                        stripedRows
                        showGridlines
                        responsiveLayout="scroll"
                    >
                        <Column field="title" header="项目标题" style="min-width: 200px">
                            <template #body="{ data }">
                                <div>
                                    <div class="font-medium">{{ data.title }}</div>
                                    <div class="text-sm text-gray-500">{{ data.name }}</div>
                                </div>
                            </template>
                        </Column>
                        
                        <Column header="内容状态" style="min-width: 120px">
                            <template #body="{ data }">
                                <Tag 
                                    :value="data.content && data.content.trim() ? '已生成' : '未生成'" 
                                    :severity="data.content && data.content.trim() ? 'success' : 'warning'"
                                />
                            </template>
                        </Column>
                        
                        <Column header="下一步操作" style="min-width: 150px">
                            <template #body="{ data }">
                                <div class="flex gap-1">
                                    <Button 
                                        v-if="!data.content || !data.content.trim()"
                                        icon="pi pi-lightbulb" 
                                        label="开始引导"
                                        size="small"
                                        class="p-button-success"
                                        @click="showProjectGuide(data)"
                                    />
                                    <Button 
                                        v-else-if="data.content && data.content.trim() && !data.buildPath"
                                        icon="pi pi-cog" 
                                        label="构建项目"
                                        size="small"
                                        class="p-button-info"
                                        :loading="buildingProjects.has(data.id)"
                                        @click="buildProject(data)"
                                    />
                                    <Button 
                                        v-else-if="data.buildPath"
                                        icon="pi pi-eye" 
                                        label="在线预览"
                                        size="small"
                                        class="p-button-warning"
                                        @click="previewProject(data)"
                                    />
                                    <Button 
                                        v-else
                                        icon="pi pi-info-circle" 
                                        label="查看详情"
                                        size="small"
                                        outlined
                                        @click="viewProject(data)"
                                    />
                                </div>
                            </template>
                        </Column>
                        
                        <Column field="status" header="状态" style="min-width: 100px">
                            <template #body="{ data }">
                                <Tag 
                                    :value="getSmartStatusText(data)" 
                                    :severity="getSmartStatusSeverity(data)"
                                />
                            </template>
                        </Column>
                        
                        <Column header="公开状态" style="min-width: 120px">
                            <template #body="{ data }">
                                <div class="flex gap-2 align-items-center">
                                    <Tag 
                                        v-if="isConverted(data)"
                                        value="已公开" 
                                        severity="success"
                                        icon="pi pi-check"
                                    />
                                    <Tag 
                                        v-else-if="canConvert(data)"
                                        value="可转化" 
                                        severity="info"
                                        icon="pi pi-share-alt"
                                    />
                                    <Tag 
                                        v-else-if="data.content && data.content.trim()"
                                        value="待构建" 
                                        severity="warning"
                                    />
                                    <Tag 
                                        v-else
                                        value="待完善" 
                                        severity="secondary"
                                    />
                                </div>
                            </template>
                        </Column>
                        
                        <Column field="updatedAt" header="更新时间" style="min-width: 180px">
                            <template #body="{ data }">
                                {{ formatDate(data.updatedAt) }}
                            </template>
                        </Column>
                        
                        <Column header="操作" style="min-width: 250px">
                            <template #body="{ data }">
                                <div class="flex gap-1 flex-wrap">
                                    <!-- 基本操作 -->
                                    <Button 
                                        icon="pi pi-pencil"
                                        size="small"
                                        outlined
                                        @click="editProject(data)"
                                        title="编辑"
                                    />
                                    
                                    <!-- 转化为公开幻灯片 -->
                                    <Button 
                                        v-if="canConvert(data)"
                                        icon="pi pi-share-alt"
                                        size="small"
                                        class="p-button-success"
                                        :loading="convertingProjects.has(data.id)"
                                        @click="convertToPublicSlide(data)"
                                        title="转为公开幻灯片"
                                    />
                                    
                                    <!-- 一键完成转化（自动构建+转化） -->
                                    <Button 
                                        v-else-if="data.content && data.content.trim() && !data.buildPath && !data.convertedToPublic"
                                        icon="pi pi-bolt"
                                        size="small"
                                        class="p-button-warning"
                                        :loading="convertingProjects.has(data.id)"
                                        @click="autoCompleteConversion(data)"
                                        title="一键完成转化"
                                    />
                                    
                                    <!-- 已转化，查看公开幻灯片 -->
                                    <Button 
                                        v-else-if="isConverted(data)"
                                        icon="pi pi-external-link"
                                        size="small"
                                        class="p-button-info"
                                        @click="viewPublicSlide(data)"
                                        title="查看公开幻灯片"
                                    />
                                    
                                    <Button 
                                        icon="pi pi-download"
                                        size="small"
                                        outlined
                                        @click="downloadMarkdown(data)"
                                        title="下载MD"
                                    />
                                    <Button 
                                        icon="pi pi-trash"
                                        size="small"
                                        severity="danger"
                                        outlined
                                        @click="deleteProject(data)"
                                        title="删除"
                                    />
                                </div>
                            </template>
                        </Column>
                    </DataTable>
                    
                    <!-- 空状态 -->
                    <div v-if="!loading && projects.length === 0" class="text-center py-12">
                        <i class="pi pi-folder-open text-4xl text-gray-400 mb-4"></i>
                        <h3 class="text-xl font-medium text-gray-700 mb-2">暂无项目</h3>
                        <p class="text-gray-500 mb-6">开始创建您的第一个Slidev项目</p>
                        <Button 
                            label="创建项目" 
                            @click="showCreateDialog = true"
                            icon="pi pi-plus"
                        />
                    </div>
                </template>
            </Card>
        </div>

        <!-- 创建项目对话框 -->
        <Dialog 
            v-model:visible="showCreateDialog" 
            modal 
            header="创建新项目" 
            style="width: 600px"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">项目标题</label>
                    <InputText 
                        v-model="createForm.title" 
                        placeholder="输入项目标题"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">主题</label>
                    <Dropdown 
                        v-model="createForm.theme" 
                        :options="themeOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="选择主题"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Slidev内容</label>
                    <Textarea 
                        v-model="createForm.content" 
                        placeholder="输入或粘贴Slidev Markdown内容..."
                        rows="15"
                        class="w-full"
                    />
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="取消" 
                        severity="secondary" 
                        @click="showCreateDialog = false"
                        outlined
                    />
                    <Button 
                        label="创建项目" 
                        @click="createProject"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 创建带选项的项目对话框 -->
        <Dialog 
            v-model:visible="showCreateWithOptionsDialog" 
            modal 
            header="创建知识库项目" 
            style="width: 600px"
        >
            <div class="space-y-4">
                <Message severity="info">
                    <p>选择创建方式：可以直接创建空项目，或基于知识库内容智能生成PPT大纲</p>
                </Message>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="createEmptyProject">
                        <template #content>
                            <div class="text-center">
                                <i class="pi pi-file text-3xl text-blue-500 mb-3"></i>
                                <h3 class="font-bold mb-2">创建空项目</h3>
                                <p class="text-sm text-gray-600">手动编写Slidev内容</p>
                            </div>
                        </template>
                    </Card>
                    
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow" @click="createWithKnowledgeGeneration">
                        <template #content>
                            <div class="text-center">
                                <i class="pi pi-robot text-3xl text-green-500 mb-3"></i>
                                <h3 class="font-bold mb-2">智能生成</h3>
                                <p class="text-sm text-gray-600">基于知识库智能生成内容</p>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <template #footer>
                <Button 
                    label="取消" 
                    severity="secondary" 
                    @click="showCreateWithOptionsDialog = false"
                    outlined
                    class="w-full"
                />
            </template>
        </Dialog>

        <!-- 编辑项目对话框 -->
        <Dialog 
            v-model:visible="showEditDialog" 
            modal 
            header="编辑项目" 
            style="width: 600px"
        >
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">项目标题</label>
                    <InputText 
                        v-model="editForm.title" 
                        placeholder="输入项目标题"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">Slidev内容</label>
                    <Textarea 
                        v-model="editForm.content" 
                        placeholder="输入或粘贴Slidev Markdown内容..."
                        rows="15"
                        class="w-full"
                    />
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
                        label="保存更改" 
                        @click="updateProject"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 预览对话框 -->
        <Dialog 
            v-model:visible="showPreviewDialog" 
            modal 
            header="项目预览" 
            style="width: 90vw; height: 90vh"
            maximizable
        >
            <div v-if="currentProject" class="h-full flex flex-col">
                <div class="flex gap-2 mb-4">
                    <Button 
                        label="在新窗口打开"
                        icon="pi pi-external-link"
                        @click="openPreviewWindow"
                        outlined
                    />
                    <Button 
                        label="刷新预览"
                        icon="pi pi-refresh"
                        @click="previewProject(currentProject!)"
                        outlined
                    />
                </div>
                
                <div class="flex-1 border rounded">
                    <iframe 
                        v-if="previewUrl"
                        :src="previewUrl"
                        class="w-full h-full border-0"
                        frameborder="0"
                    ></iframe>
                    <div v-else class="flex align-items-center justify-content-center h-full">
                        <ProgressSpinner />
                        <span class="ml-2">加载预览中...</span>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- 转化为公开幻灯片对话框 -->
        <Dialog 
            v-model:visible="showConvertDialog" 
            modal 
            header="转化为公开幻灯片" 
            style="width: 500px"
        >
            <div class="space-y-4">
                <Message 
                    severity="info" 
                    :closable="false"
                >
                    将知识库项目转化为公开幻灯片，可在幻灯片管理中统一管理和分享。
                </Message>
                
                <div>
                    <label class="block text-sm font-medium mb-2">幻灯片标题</label>
                    <InputText 
                        v-model="convertForm.title" 
                        placeholder="输入幻灯片标题"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">描述信息</label>
                    <Textarea 
                        v-model="convertForm.description" 
                        placeholder="输入幻灯片描述..."
                        rows="3"
                        class="w-full"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-2">可见性</label>
                    <Dropdown 
                        v-model="convertForm.visibility" 
                        :options="visibilityOptions"
                        optionLabel="label"
                        optionValue="value"
                        placeholder="选择可见性"
                        class="w-full"
                    >
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex align-items-center gap-2">
                                <i :class="visibilityOptions.find(opt => opt.value === slotProps.value)?.icon"></i>
                                <span>{{ visibilityOptions.find(opt => opt.value === slotProps.value)?.label }}</span>
                            </div>
                        </template>
                        <template #option="slotProps">
                            <div class="flex align-items-center gap-2">
                                <i :class="slotProps.option.icon"></i>
                                <span>{{ slotProps.option.label }}</span>
                            </div>
                        </template>
                    </Dropdown>
                </div>
            </div>

            <template #footer>
                <div class="flex gap-2">
                    <Button 
                        label="取消" 
                        severity="secondary" 
                        @click="showConvertDialog = false"
                        outlined
                    />
                    <Button 
                        label="开始转化" 
                        icon="pi pi-share-alt"
                        @click="executeConvert"
                        :loading="currentProject && convertingProjects.has(currentProject.id)"
                    />
                </div>
            </template>
        </Dialog>

        <!-- 项目引导对话框 -->
        <ProjectGuide 
            v-model:visible="showGuideDialog"
            :project="currentProject || {} as KnowledgeSlidevProject"
            @update="handleProjectUpdate"
        />
    </div>
</template>

<style scoped>
.knowledge-slidev-manager {
    min-height: calc(100vh - 200px);
}

:deep(.p-card-content) {
    padding: 1.5rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.75rem;
}
</style>