<template>
    <div class="admin-slide-generator">
        <!-- 页面头部 -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">🎯 管理员PPT生成中心</h1>
                        <p class="text-gray-600 mt-1">高级PPT生成和管理功能</p>
                    </div>
                    <div class="flex gap-3">
                        <Button 
                            label="系统统计" 
                            icon="pi pi-chart-bar" 
                            outlined 
                            @click="showAnalytics = true"
                        />
                        <Button 
                            label="返回仪表板" 
                            icon="pi pi-home" 
                            outlined 
                            @click="router.push('/dashboard')"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="flex-1 bg-gray-50 p-6">
            <div class="max-w-6xl mx-auto space-y-6">
                
                <!-- 快速操作卡片 -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow">
                        <template #content>
                            <div class="text-center p-4" @click="startSingleGeneration">
                                <i class="pi pi-plus-circle text-4xl text-blue-500 mb-3"></i>
                                <h3 class="text-lg font-semibold mb-2">单个PPT生成</h3>
                                <p class="text-gray-600 text-sm">基于知识库快速生成单个PPT</p>
                            </div>
                        </template>
                    </Card>
                    
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow">
                        <template #content>
                            <div class="text-center p-4" @click="startBatchGeneration">
                                <i class="pi pi-copy text-4xl text-green-500 mb-3"></i>
                                <h3 class="text-lg font-semibold mb-2">批量PPT生成</h3>
                                <p class="text-gray-600 text-sm">一次性为多个主题生成PPT</p>
                            </div>
                        </template>
                    </Card>
                    
                    <Card class="cursor-pointer hover:shadow-lg transition-shadow">
                        <template #content>
                            <div class="text-center p-4" @click="manageTemplates">
                                <i class="pi pi-palette text-4xl text-purple-500 mb-3"></i>
                                <h3 class="text-lg font-semibold mb-2">模板管理</h3>
                                <p class="text-gray-600 text-sm">创建和管理PPT模板</p>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 项目统计概览 -->
                <Card>
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-chart-line text-blue-500"></i>
                            系统概览
                        </div>
                    </template>
                    <template #content>
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div class="text-center p-4 bg-blue-50 rounded-lg">
                                <div class="text-2xl font-bold text-blue-600">{{ stats.totalProjects }}</div>
                                <div class="text-sm text-gray-600">总项目数</div>
                            </div>
                            <div class="text-center p-4 bg-green-50 rounded-lg">
                                <div class="text-2xl font-bold text-green-600">{{ stats.todayGenerated }}</div>
                                <div class="text-sm text-gray-600">今日生成</div>
                            </div>
                            <div class="text-center p-4 bg-purple-50 rounded-lg">
                                <div class="text-2xl font-bold text-purple-600">{{ stats.totalUsers }}</div>
                                <div class="text-sm text-gray-600">活跃用户</div>
                            </div>
                            <div class="text-center p-4 bg-orange-50 rounded-lg">
                                <div class="text-2xl font-bold text-orange-600">{{ stats.totalKnowledge }}</div>
                                <div class="text-sm text-gray-600">知识库文档</div>
                            </div>
                        </div>
                    </template>
                </Card>

                <!-- 最近项目 -->
                <Card>
                    <template #title>
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-2">
                                <i class="pi pi-list text-blue-500"></i>
                                最近的PPT项目
                            </div>
                            <Button 
                                label="查看全部" 
                                text 
                                @click="router.push('/admin/slides/projects')"
                            />
                        </div>
                    </template>
                    <template #content>
                        <DataTable 
                            :value="recentProjects" 
                            :loading="loading.projects"
                            responsiveLayout="scroll"
                            :paginator="true"
                            :rows="10"
                        >
                            <Column field="title" header="项目标题">
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-file-pdf text-red-500"></i>
                                        <span>{{ slotProps.data.title }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="user.username" header="创建者"></Column>
                            <Column field="theme" header="主题">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.theme" />
                                </template>
                            </Column>
                            <Column field="status" header="状态">
                                <template #body="slotProps">
                                    <Tag 
                                        :value="getStatusLabel(slotProps.data.status)" 
                                        :severity="getStatusSeverity(slotProps.data.status)"
                                    />
                                </template>
                            </Column>
                            <Column field="createdAt" header="创建时间">
                                <template #body="slotProps">
                                    {{ formatDate(slotProps.data.createdAt) }}
                                </template>
                            </Column>
                            <Column header="操作">
                                <template #body="slotProps">
                                    <div class="flex gap-2">
                                        <Button 
                                            icon="pi pi-eye" 
                                            text 
                                            @click="previewProject(slotProps.data)"
                                            :title="'预览项目'"
                                        />
                                        <Button 
                                            icon="pi pi-download" 
                                            text 
                                            @click="downloadProject(slotProps.data)"
                                            :title="'下载项目'"
                                        />
                                        <Button 
                                            icon="pi pi-trash" 
                                            text 
                                            severity="danger"
                                            @click="deleteProject(slotProps.data)"
                                            :title="'删除项目'"
                                        />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </template>
                </Card>
            </div>
        </div>

        <!-- 统计分析对话框 -->
        <Dialog 
            v-model:visible="showAnalytics" 
            header="系统统计分析" 
            :style="{ width: '80vw' }"
            modal
        >
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                        <template #title>用户活跃度</template>
                        <template #content>
                            <div class="h-64 flex items-center justify-center text-gray-500">
                                图表区域 - 用户活跃度趋势
                            </div>
                        </template>
                    </Card>
                    <Card>
                        <template #title>PPT生成统计</template>
                        <template #content>
                            <div class="h-64 flex items-center justify-center text-gray-500">
                                图表区域 - PPT生成数量趋势
                            </div>
                        </template>
                    </Card>
                </div>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';

const router = useRouter();
const authStore = useAuthStore();

// 权限检查
const isAdmin = computed(() => authStore.user?.role === 'admin');

// 响应式数据
const showAnalytics = ref(false);
const loading = ref({
    projects: false,
    stats: false
});

const stats = ref({
    totalProjects: 0,
    todayGenerated: 0,
    totalUsers: 0,
    totalKnowledge: 0
});

const recentProjects = ref([]);

// 获取统计数据
const fetchStats = async () => {
    loading.value.stats = true;
    try {
        // 使用现有的API获取项目统计
        const projectsRes = await axios.get(`${API_BASE_URL}/knowledge-slides/projects`);
        const projects = projectsRes.data.projects || [];
        
        // 计算今日生成数量
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayGenerated = projects.filter((p: any) => 
            new Date(p.createdAt) >= today
        ).length;
        
        stats.value = {
            totalProjects: projects.length,
            todayGenerated,
            totalUsers: 0, // 这里可以后续添加
            totalKnowledge: 0 // 这里可以后续添加
        };
    } catch (error) {
        console.error('获取统计数据失败:', error);
        // 设置默认值
        stats.value = {
            totalProjects: 0,
            todayGenerated: 0,
            totalUsers: 0,
            totalKnowledge: 0
        };
    } finally {
        loading.value.stats = false;
    }
};

// 获取最近项目
const fetchRecentProjects = async () => {
    loading.value.projects = true;
    try {
        const response = await axios.get(`${API_BASE_URL}/knowledge-slides/projects`, {
            params: { limit: 10, sort: 'recent' }
        });
        recentProjects.value = response.data.projects || [];
    } catch (error) {
        console.error('获取最近项目失败:', error);
    } finally {
        loading.value.projects = false;
    }
};

// 事件处理器
const startSingleGeneration = () => {
    router.push('/knowledge-slides/process?stage=config&admin=true');
};

const startBatchGeneration = () => {
    router.push('/admin/slides/batch');
};

const manageTemplates = () => {
    router.push('/admin/slides/templates');
};

const previewProject = async (project: any) => {
    try {
        // 先获取预览端口
        const response = await axios.get(`${API_BASE_URL}/knowledge-slides/project/${project.id}/preview-port`);
        
        if (response.data.success && response.data.data?.port) {
            const previewUrl = `http://localhost:${response.data.data.port}`;
            window.open(previewUrl, '_blank');
            
            console.log('预览项目:', project.title, '端口:', response.data.data.port);
        } else {
            throw new Error(response.data.error || '获取预览端口失败');
        }
    } catch (error) {
        console.error('启动预览失败:', error);
        alert('无法启动Slidev预览服务，请检查项目状态');
    }
};

const downloadProject = async (project: any) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/knowledge-slides/project/${project.id}/export`, {
            format: 'pdf'
        });
        // 处理下载逻辑
        console.log('下载项目:', project.title);
    } catch (error) {
        console.error('下载失败:', error);
    }
};

const deleteProject = async (project: any) => {
    if (!confirm(`确定要删除项目 "${project.title}" 吗？`)) {
        return;
    }
    
    try {
        await axios.delete(`${API_BASE_URL}/knowledge-slides/project/${project.id}`);
        await fetchRecentProjects(); // 刷新列表
        console.log('删除成功');
    } catch (error) {
        console.error('删除失败:', error);
    }
};

// 工具函数
const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
        draft: '草稿',
        generating: '生成中',
        completed: '已完成',
        failed: '生成失败'
    };
    return statusMap[status] || status;
};

const getStatusSeverity = (status: string) => {
    const severityMap: { [key: string]: string } = {
        draft: 'info',
        generating: 'warning',
        completed: 'success',
        failed: 'danger'
    };
    return severityMap[status] || 'info';
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 生命周期
onMounted(async () => {
    // 权限检查
    if (!isAdmin.value) {
        router.push('/dashboard');
        return;
    }
    
    // 并行获取数据
    await Promise.all([
        fetchStats(),
        fetchRecentProjects()
    ]);
});
</script>

<style scoped>
.admin-slide-generator {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.card:hover {
    transform: translateY(-2px);
    transition: transform 0.2s ease-in-out;
}
</style>