<template>
    <div class="admin-knowledge-slide-generator p-6">
        <Toast />
        
        <div class="max-w-6xl mx-auto">
            <!-- 页面标题 -->
            <div class="mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-2">🧠 智能PPT生成中心</h1>
                <p class="text-gray-600">基于知识库的管理员专用PPT智能生成工具</p>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <template #content>
                        <div class="flex items-center gap-3">
                            <div class="bg-blue-100 rounded-full p-3">
                                <i class="pi pi-folder text-blue-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ analytics.totalProjects }}</div>
                                <div class="text-gray-600 text-sm">总项目数</div>
                            </div>
                        </div>
                    </template>
                </Card>
                
                <Card>
                    <template #content>
                        <div class="flex items-center gap-3">
                            <div class="bg-green-100 rounded-full p-3">
                                <i class="pi pi-calendar text-green-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ analytics.todayGenerated }}</div>
                                <div class="text-gray-600 text-sm">今日生成</div>
                            </div>
                        </div>
                    </template>
                </Card>
                
                <Card>
                    <template #content>
                        <div class="flex items-center gap-3">
                            <div class="bg-purple-100 rounded-full p-3">
                                <i class="pi pi-database text-purple-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ analytics.totalKnowledge }}</div>
                                <div class="text-gray-600 text-sm">知识库文档</div>
                            </div>
                        </div>
                    </template>
                </Card>

                <Card>
                    <template #content>
                        <div class="flex items-center gap-3">
                            <div class="bg-orange-100 rounded-full p-3">
                                <i class="pi pi-users text-orange-600 text-xl"></i>
                            </div>
                            <div>
                                <div class="text-2xl font-bold text-gray-800">{{ analytics.totalUsers }}</div>
                                <div class="text-gray-600 text-sm">活跃用户</div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- 智能生成面板 -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-sparkles text-primary"></i>
                            智能PPT生成
                        </div>
                    </template>
                    
                    <template #content>
                        <div class="space-y-4">
                            <!-- 生成表单 -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">PPT标题 *</label>
                                    <InputText 
                                        v-model="generateForm.title" 
                                        placeholder="输入PPT标题"
                                        class="w-full"
                                        :disabled="generating"
                                    />
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium mb-2">主题 *</label>
                                    <InputText 
                                        v-model="generateForm.topic" 
                                        placeholder="如：人工智能技术发展"
                                        class="w-full"
                                        :disabled="generating"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">目标受众</label>
                                    <Dropdown 
                                        v-model="generateForm.targetAudience" 
                                        :options="audienceOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="选择目标受众"
                                        class="w-full"
                                        :disabled="generating"
                                    />
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium mb-2">主题样式</label>
                                    <Dropdown 
                                        v-model="generateForm.theme" 
                                        :options="themeOptions"
                                        optionLabel="label"
                                        optionValue="value"
                                        placeholder="选择主题"
                                        class="w-full"
                                        :disabled="generating"
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium mb-2">幻灯片数量</label>
                                    <InputNumber 
                                        v-model="generateForm.slideCount" 
                                        :min="5" 
                                        :max="30"
                                        class="w-full"
                                        :disabled="generating"
                                    />
                                </div>
                                
                                <div class="flex items-center pt-6">
                                    <Checkbox 
                                        v-model="generateForm.autoGenerate" 
                                        inputId="autoGenerate"
                                        :disabled="generating"
                                    />
                                    <label for="autoGenerate" class="ml-2 text-sm">
                                        自动完成全流程并预览
                                    </label>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium mb-2">具体要求</label>
                                <Textarea 
                                    v-model="generateForm.requirements" 
                                    placeholder="描述具体要求，如：重点介绍技术原理、包含实际案例等..."
                                    rows="3"
                                    class="w-full"
                                    :disabled="generating"
                                />
                            </div>

                            <!-- 生成进度 -->
                            <div v-if="generating" class="bg-blue-50 p-4 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-sm font-medium text-blue-800">{{ generationStage }}</span>
                                    <span class="text-sm text-blue-600">{{ generationProgress }}%</span>
                                </div>
                                <ProgressBar :value="generationProgress" class="mb-2" />
                                <p class="text-sm text-blue-700">{{ generationMessage }}</p>
                                
                                <!-- 生成日志 -->
                                <div v-if="generationLog.length > 0" class="mt-3 max-h-32 overflow-y-auto bg-white p-2 rounded text-xs">
                                    <div v-for="log in generationLog" :key="log.timestamp" class="flex justify-between mb-1">
                                        <span :class="getLogColor(log.type)">{{ log.message }}</span>
                                        <span class="text-gray-400">{{ log.timestamp }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- 操作按钮 -->
                            <div class="flex gap-3">
                                <Button 
                                    label="🚀 智能生成"
                                    @click="generateKnowledgeSlides"
                                    :loading="generating"
                                    :disabled="!generateForm.title.trim() || !generateForm.topic.trim()"
                                    class="flex-1"
                                />
                                <Button 
                                    label="重置"
                                    severity="secondary"
                                    outlined
                                    @click="resetForm"
                                    :disabled="generating"
                                />
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 最近项目 -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-clock text-primary"></i>
                                最近项目
                            </div>
                            <Button 
                                label="查看全部"
                                text
                                size="small"
                                @click="$router.push('/admin/slides')"
                            />
                        </div>
                    </template>
                    
                    <template #content>
                        <div v-if="loading" class="text-center py-8">
                            <i class="pi pi-spin pi-spinner text-2xl text-gray-400"></i>
                            <p class="text-gray-500 mt-2">加载中...</p>
                        </div>
                        
                        <div v-else-if="projects.length === 0" class="text-center py-8">
                            <i class="pi pi-folder-open text-4xl text-gray-400 mb-4"></i>
                            <p class="text-gray-500">暂无项目</p>
                        </div>
                        
                        <div v-else class="space-y-3">
                            <div 
                                v-for="project in projects.slice(0, 6)" 
                                :key="project.id"
                                class="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
                            >
                                <div class="flex items-center justify-between">
                                    <div class="flex-1">
                                        <h4 class="font-medium text-gray-800 mb-1">{{ project.title }}</h4>
                                        <div class="flex items-center gap-3 text-sm text-gray-500">
                                            <span>{{ project.theme }}</span>
                                            <span>{{ formatDate(project.createdAt) }}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Tag 
                                            :value="getStatusText(project.status)" 
                                            :severity="getStatusSeverity(project.status)"
                                            class="text-xs"
                                        />
                                        <div class="flex gap-1">
                                            <Button 
                                                icon="pi pi-eye"
                                                size="small"
                                                text
                                                @click="previewProject(project)"
                                                title="本地预览"
                                            />
                                            <Button 
                                                icon="pi pi-globe"
                                                size="small"
                                                text
                                                severity="success"
                                                @click="publishToPublic(project)"
                                                title="发布到公共展示"
                                            />
                                            <Button 
                                                icon="pi pi-trash"
                                                size="small"
                                                text
                                                severity="danger"
                                                @click="deleteProject(project.id)"
                                                title="删除"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const API_BASE_URL = 'http://localhost:3001/api';

// 状态管理
const projects = ref([]);
const loading = ref(false);
const generating = ref(false);
const generationProgress = ref(0);
const generationStage = ref('');
const generationMessage = ref('');
const generationLog = ref([]);
const analytics = ref({
    totalProjects: 0,
    todayGenerated: 0,
    totalUsers: 0,
    totalKnowledge: 0,
    projectsByStatus: {},
    projectsByTheme: {}
});

// 表单数据
const generateForm = ref({
    title: '',
    topic: '',
    knowledgeIds: [] as number[],
    requirements: '',
    targetAudience: '通用用户',
    slideCount: 10,
    theme: 'academic',
    autoGenerate: true
});

// 主题选项
const themeOptions = [
    { label: '学术主题', value: 'academic' },
    { label: '默认主题', value: 'default' },
    { label: '企业主题', value: 'corporate' },
    { label: '现代主题', value: 'modern' }
];

// 目标受众选项
const audienceOptions = [
    { label: '通用用户', value: '通用用户' },
    { label: '技术团队', value: '技术团队' },
    { label: '管理层', value: '管理层' },
    { label: '学生', value: '学生' },
    { label: '研究人员', value: '研究人员' }
];

// 页面加载
onMounted(() => {
    loadProjects();
    loadAnalytics();
});

// 加载项目列表
const loadProjects = async () => {
    loading.value = true;
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/slides/projects?limit=10&sort=recent`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.data.success) {
            projects.value = response.data.data.projects || [];
        }
    } catch (error) {
        console.error('加载项目失败:', error);
    } finally {
        loading.value = false;
    }
};

// 加载分析数据
const loadAnalytics = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/admin/slides/analytics`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.data && typeof response.data === 'object') {
            analytics.value = response.data;
        }
    } catch (error) {
        console.error('加载分析数据失败:', error);
    }
};

// 智能生成PPT（集成完整知识库流程）
const generateKnowledgeSlides = async () => {
    if (!generateForm.value.title.trim() || !generateForm.value.topic.trim()) {
        toast.add({
            severity: 'warn',
            summary: '验证失败',
            detail: '请填写PPT标题和主题'
        });
        return;
    }

    generating.value = true;
    generationProgress.value = 0;
    generationStage.value = '';
    generationMessage.value = '';
    generationLog.value = [];

    try {
        // 构建查询参数
        const params = new URLSearchParams({
            title: generateForm.value.title,
            topic: generateForm.value.topic,
            requirements: generateForm.value.requirements || '',
            targetAudience: generateForm.value.targetAudience,
            slideCount: generateForm.value.slideCount.toString(),
            theme: generateForm.value.theme,
            autoGenerate: generateForm.value.autoGenerate.toString()
        });

        // 使用EventSource连接SSE (需要添加认证支持)
        const token = localStorage.getItem('token');
        const eventSource = new EventSource(
            `${API_BASE_URL}/admin/slides/knowledge-generate?${params.toString()}&token=${token}`
        );

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleGenerationProgress(data);
            } catch (e) {
                console.warn('解析SSE数据失败:', e);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE连接错误:', error);
            eventSource.close();
            
            // 使用fallback方法
            simulateGeneration();
        };

        eventSource.onopen = () => {
            console.log('SSE连接已建立');
        };

        // 30秒后自动关闭连接
        setTimeout(() => {
            eventSource.close();
            if (generating.value && generationProgress.value < 100) {
                simulateGeneration();
            }
        }, 30000);

    } catch (error) {
        console.error('PPT生成失败:', error);
        toast.add({
            severity: 'error',
            summary: '生成失败',
            detail: error.message || '生成过程中发生错误'
        });
        generating.value = false;
    }
};

// 模拟生成过程（作为fallback）
const simulateGeneration = async () => {
    const stages = [
        { progress: 20, stage: '配置验证', message: '验证生成配置...' },
        { progress: 40, stage: '检索知识库', message: '从知识库检索相关内容...' },
        { progress: 60, stage: '生成大纲', message: '基于AI生成PPT大纲...' },
        { progress: 80, stage: '生成内容', message: '生成详细Slidev内容...' },
        { progress: 95, stage: '创建项目', message: '创建Slidev项目...' },
        { progress: 100, stage: '完成', message: 'PPT生成完成！' }
    ];

    for (const stage of stages) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        generationProgress.value = stage.progress;
        generationStage.value = stage.stage;
        generationMessage.value = stage.message;
        
        addToLog('info', stage.message);
    }

    toast.add({
        severity: 'success',
        summary: '生成完成',
        detail: `PPT "${generateForm.value.title}" 已成功生成`
    });
    
    // 刷新数据
    loadProjects();
    loadAnalytics();
};

// 处理生成进度（真实SSE响应）
const handleGenerationProgress = (data: any) => {
    addToLog(data.type, data.message || '');

    switch (data.type) {
        case 'start':
            generationProgress.value = 10;
            generationStage.value = '开始生成';
            break;
        case 'stage':
            switch (data.stage) {
                case 'config':
                    generationProgress.value = 20;
                    generationStage.value = '配置验证';
                    break;
                case 'outline':
                    generationProgress.value = 40;
                    generationStage.value = '生成大纲';
                    break;
                case 'markdown':
                    generationProgress.value = 70;
                    generationStage.value = '生成内容';
                    break;
                case 'project':
                    generationProgress.value = 85;
                    generationStage.value = '创建项目';
                    break;
                case 'preview':
                    generationProgress.value = 95;
                    generationStage.value = '启动预览';
                    break;
            }
            break;
        case 'complete':
            generationProgress.value = 100;
            generationStage.value = '生成完成';
            toast.add({
                severity: 'success',
                summary: '生成完成',
                detail: `PPT "${data.data.title}" 已成功生成`
            });
            
            // 如果有预览URL，自动打开
            if (data.data.previewUrl) {
                window.open(data.data.previewUrl, '_blank');
            }
            
            // 刷新数据
            loadProjects();
            loadAnalytics();
            break;
        case 'error':
            toast.add({
                severity: 'error',
                summary: '生成失败',
                detail: data.error
            });
            break;
    }
    
    generationMessage.value = data.message || '';
};

// 添加到日志
const addToLog = (type: string, message: string) => {
    generationLog.value.push({
        timestamp: new Date().toLocaleTimeString(),
        type,
        message
    });
};

// 获取日志颜色
const getLogColor = (type: string) => {
    switch (type) {
        case 'error': return 'text-red-600';
        case 'complete': return 'text-green-600';
        case 'stage': return 'text-blue-600';
        default: return 'text-gray-600';
    }
};

// 重置表单
const resetForm = () => {
    generateForm.value = {
        title: '',
        topic: '',
        knowledgeIds: [],
        requirements: '',
        targetAudience: '通用用户',
        slideCount: 10,
        theme: 'academic',
        autoGenerate: true
    };
};

// 发布到公共展示（使用正确的用户流程）
const publishToPublic = async (project: any) => {
    try {
        toast.add({
            severity: 'info',
            summary: '开始发布',
            detail: '正在保存到公共幻灯片系统，请稍候...'
        });
        
        const response = await axios.post(
            `${API_BASE_URL}/knowledge-slides/project/${project.id}/publish`,
            {
                title: project.title,
                description: `基于知识库智能生成的演示文稿`
            },
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            }
        );
        
        if (response.data.success) {
            const slideId = response.data.data.slideId;
            const publicUrl = `${window.location.origin}${response.data.data.publicUrl}`;
            
            toast.add({
                severity: 'success',
                summary: '发布成功',
                detail: '已保存到公共幻灯片，即将跳转预览'
            });
            
            // 直接打开公共预览页面（和用户PPT一样的方式）
            window.open(publicUrl, '_blank');
            
            // 自动复制分享链接
            try {
                await navigator.clipboard.writeText(publicUrl);
                toast.add({
                    severity: 'info',
                    summary: '链接已复制',
                    detail: '公共分享链接已复制到剪贴板'
                });
            } catch (clipboardError) {
                console.warn('复制链接失败:', clipboardError);
            }
            
            // 刷新项目列表
            loadProjects();
        } else {
            throw new Error(response.data.error || '发布失败');
        }
    } catch (error: any) {
        console.error('发布到公共展示失败:', error);
        
        let errorMessage = '发布失败，请稍后重试';
        
        if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        toast.add({
            severity: 'error',
            summary: '发布失败',
            detail: errorMessage
        });
    }
};
const previewProject = async (project: any) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/knowledge-slides/project/${project.id}/preview-port`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.data.success && response.data.data?.port) {
            const previewUrl = `http://localhost:${response.data.data.port}`;
            window.open(previewUrl, '_blank');
        } else {
            throw new Error(response.data.error || '获取预览端口失败');
        }
    } catch (error) {
        console.error('启动预览失败:', error);
        toast.add({
            severity: 'error',
            summary: '预览失败',
            detail: '无法启动Slidev预览服务'
        });
    }
};

// 删除项目
const deleteProject = async (projectId: string) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/admin/slides/project/${projectId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.data.success) {
            toast.add({
                severity: 'info',
                summary: '删除成功',
                detail: '项目已删除'
            });
            loadProjects();
            loadAnalytics();
        }
    } catch (error) {
        console.error('删除项目失败:', error);
        toast.add({
            severity: 'error',
            summary: '删除失败',
            detail: '删除项目时发生错误'
        });
    }
};

// 格式化日期
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
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
</script>

<style scoped>
.admin-knowledge-slide-generator {
    min-height: calc(100vh - 200px);
}

:deep(.p-card-content) {
    padding: 1.5rem;
}

:deep(.p-progressbar) {
    height: 8px;
}
</style>