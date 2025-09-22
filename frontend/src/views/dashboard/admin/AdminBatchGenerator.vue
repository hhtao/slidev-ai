<template>
    <div class="admin-batch-generator">
        <!-- 页面头部 -->
        <div class="bg-white border-b border-gray-200 px-6 py-4">
            <div class="max-w-6xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">📋 批量PPT生成</h1>
                        <p class="text-gray-600 mt-1">一次性为多个知识库文档生成PPT</p>
                    </div>
                    <Button 
                        label="返回生成中心" 
                        icon="pi pi-arrow-left" 
                        outlined 
                        @click="router.push('/admin/slides')"
                    />
                </div>
            </div>
        </div>

        <!-- 主要内容区域 -->
        <div class="flex-1 bg-gray-50 p-6">
            <div class="max-w-6xl mx-auto space-y-6">
                
                <!-- 配置步骤 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    <!-- 左侧：配置面板 -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-cog text-blue-500"></i>
                                批量生成配置
                            </div>
                        </template>
                        <template #content>
                            <div class="space-y-4">
                                
                                <!-- 知识库选择 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        选择知识库文档
                                    </label>
                                    <MultiSelect 
                                        v-model="selectedKnowledge"
                                        :options="knowledgeOptions"
                                        optionLabel="title"
                                        optionValue="id"
                                        placeholder="选择要生成PPT的知识库文档"
                                        :filter="true"
                                        class="w-full"
                                        :loading="loading.knowledge"
                                    >
                                        <template #option="slotProps">
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-file-pdf text-red-500"></i>
                                                <div>
                                                    <div class="font-medium">{{ slotProps.option.title }}</div>
                                                    <div class="text-xs text-gray-500">{{ slotProps.option.summary }}</div>
                                                </div>
                                            </div>
                                        </template>
                                    </MultiSelect>
                                </div>

                                <!-- 主题选择 -->
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 mb-2">
                                        PPT主题
                                    </label>
                                    <Select 
                                        v-model="batchConfig.theme"
                                        :options="themeOptions"
                                        optionLabel="name"
                                        optionValue="name"
                                        placeholder="选择PPT主题"
                                        class="w-full"
                                    />
                                </div>

                                <!-- 生成参数 -->
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            幻灯片数量
                                        </label>
                                        <InputNumber 
                                            v-model="batchConfig.slideCount"
                                            :min="5"
                                            :max="50"
                                            class="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">
                                            生成语言
                                        </label>
                                        <Select 
                                            v-model="batchConfig.language"
                                            :options="languageOptions"
                                            optionLabel="label"
                                            optionValue="value"
                                            class="w-full"
                                        />
                                    </div>
                                </div>

                                <!-- 高级选项 -->
                                <Accordion>
                                    <AccordionTab header="高级选项">
                                        <div class="space-y-3">
                                            <div class="flex items-center gap-2">
                                                <Checkbox 
                                                    v-model="batchConfig.includeImages"
                                                    inputId="includeImages"
                                                    :binary="true"
                                                />
                                                <label for="includeImages" class="text-sm">包含图片</label>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <Checkbox 
                                                    v-model="batchConfig.autoExport"
                                                    inputId="autoExport"
                                                    :binary="true"
                                                />
                                                <label for="autoExport" class="text-sm">生成后自动导出PDF</label>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <Checkbox 
                                                    v-model="batchConfig.sendNotification"
                                                    inputId="sendNotification"
                                                    :binary="true"
                                                />
                                                <label for="sendNotification" class="text-sm">完成后发送通知</label>
                                            </div>
                                        </div>
                                    </AccordionTab>
                                </Accordion>

                                <!-- 操作按钮 -->
                                <div class="flex gap-3">
                                    <Button 
                                        label="开始批量生成"
                                        icon="pi pi-play"
                                        @click="startBatchGeneration"
                                        :disabled="selectedKnowledge.length === 0 || isGenerating"
                                        :loading="isGenerating"
                                        class="flex-1"
                                    />
                                    <Button 
                                        label="重置配置"
                                        icon="pi pi-refresh"
                                        outlined
                                        @click="resetConfig"
                                    />
                                </div>
                            </div>
                        </template>
                    </Card>

                    <!-- 右侧：预览和状态 -->
                    <Card>
                        <template #title>
                            <div class="flex items-center gap-2">
                                <i class="pi pi-eye text-green-500"></i>
                                生成预览
                            </div>
                        </template>
                        <template #content>
                            <div class="space-y-4">
                                
                                <!-- 生成预览 -->
                                <div v-if="selectedKnowledge.length > 0">
                                    <div class="text-sm text-gray-600 mb-3">
                                        将生成 {{ selectedKnowledge.length }} 个PPT项目
                                    </div>
                                    <div class="space-y-2 max-h-64 overflow-y-auto">
                                        <div 
                                            v-for="knowledgeId in selectedKnowledge" 
                                            :key="knowledgeId"
                                            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div class="flex items-center gap-2">
                                                <i class="pi pi-file-pdf text-red-500"></i>
                                                <span class="text-sm">{{ getKnowledgeTitle(knowledgeId) }}</span>
                                            </div>
                                            <Tag :value="`${batchConfig.slideCount} 页`" />
                                        </div>
                                    </div>
                                </div>
                                
                                <div v-else class="text-center py-8 text-gray-500">
                                    <i class="pi pi-info-circle text-4xl mb-3"></i>
                                    <p>请选择知识库文档开始配置</p>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 生成进度 -->
                <Card v-if="isGenerating || generationResults.length > 0">
                    <template #title>
                        <div class="flex items-center gap-2">
                            <i class="pi pi-cog" :class="{ 'pi-spin': isGenerating }"></i>
                            生成进度
                        </div>
                    </template>
                    <template #content>
                        <div class="space-y-4">
                            
                            <!-- 总体进度 -->
                            <div>
                                <div class="flex justify-between text-sm mb-2">
                                    <span>总体进度</span>
                                    <span>{{ completedCount }}/{{ totalCount }}</span>
                                </div>
                                <ProgressBar 
                                    :value="overallProgress"
                                    :showValue="false"
                                />
                            </div>

                            <!-- 详细进度 -->
                            <DataTable 
                                :value="generationResults"
                                class="mt-4"
                            >
                                <Column field="title" header="项目名称"></Column>
                                <Column field="status" header="状态">
                                    <template #body="slotProps">
                                        <Tag 
                                            :value="getStatusLabel(slotProps.data.status)"
                                            :severity="getStatusSeverity(slotProps.data.status)"
                                        />
                                    </template>
                                </Column>
                                <Column field="progress" header="进度">
                                    <template #body="slotProps">
                                        <ProgressBar 
                                            :value="slotProps.data.progress"
                                            :showValue="false"
                                            style="height: 6px"
                                        />
                                    </template>
                                </Column>
                                <Column header="操作">
                                    <template #body="slotProps">
                                        <div class="flex gap-2">
                                            <Button 
                                                v-if="slotProps.data.status === 'completed'"
                                                icon="pi pi-eye"
                                                text
                                                @click="previewResult(slotProps.data)"
                                                title="预览"
                                            />
                                            <Button 
                                                v-if="slotProps.data.status === 'completed'"
                                                icon="pi pi-download"
                                                text
                                                @click="downloadResult(slotProps.data)"
                                                title="下载"
                                            />
                                        </div>
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </template>
                </Card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';

// PrimeVue 组件
import Card from 'primevue/card';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import Select from 'primevue/select';
import InputNumber from 'primevue/inputnumber';
import Checkbox from 'primevue/checkbox';
import Accordion from 'primevue/accordion';
import AccordionTab from 'primevue/accordiontab';
import Tag from 'primevue/tag';
import ProgressBar from 'primevue/progressbar';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';

const router = useRouter();
const authStore = useAuthStore();

// 响应式数据
const selectedKnowledge = ref<number[]>([]);
const knowledgeOptions = ref([]);
const themeOptions = ref([]);
const isGenerating = ref(false);
const generationResults = ref([]);

const loading = ref({
    knowledge: false,
    themes: false
});

const batchConfig = ref({
    theme: 'academic',
    slideCount: 15,
    language: 'zh-CN',
    includeImages: true,
    autoExport: false,
    sendNotification: true
});

const languageOptions = [
    { label: '中文', value: 'zh-CN' },
    { label: '英文', value: 'en-US' },
    { label: '日文', value: 'ja-JP' }
];

// 计算属性
const completedCount = computed(() => 
    generationResults.value.filter(r => r.status === 'completed').length
);

const totalCount = computed(() => generationResults.value.length);

const overallProgress = computed(() => 
    totalCount.value > 0 ? (completedCount.value / totalCount.value) * 100 : 0
);

// 获取知识库列表
const fetchKnowledge = async () => {
    loading.value.knowledge = true;
    try {
        const response = await axios.get(`${API_BASE_URL}/knowledge`, {
            params: { limit: 100 }
        });
        knowledgeOptions.value = response.data.items || [];
    } catch (error) {
        console.error('获取知识库失败:', error);
    } finally {
        loading.value.knowledge = false;
    }
};

// 获取主题列表
const fetchThemes = async () => {
    loading.value.themes = true;
    try {
        const response = await axios.get(`${API_BASE_URL}/mcp/themes`);
        themeOptions.value = response.data || [];
    } catch (error) {
        console.error('获取主题失败:', error);
    } finally {
        loading.value.themes = false;
    }
};

// 开始批量生成
const startBatchGeneration = async () => {
    if (selectedKnowledge.value.length === 0) return;
    
    isGenerating.value = true;
    
    // 初始化结果数组
    generationResults.value = selectedKnowledge.value.map(knowledgeId => ({
        knowledgeId,
        title: getKnowledgeTitle(knowledgeId),
        status: 'pending',
        progress: 0,
        projectId: null
    }));
    
    // 逐个生成PPT
    for (let i = 0; i < generationResults.value.length; i++) {
        const result = generationResults.value[i];
        
        try {
            result.status = 'generating';
            result.progress = 10;
            
            // 调用批量生成API
            const response = await axios.post(`${API_BASE_URL}/admin/slides/batch-generate`, {
                knowledgeId: result.knowledgeId,
                config: batchConfig.value
            });
            
            result.projectId = response.data.projectId;
            result.progress = 50;
            
            // 等待生成完成
            await pollGenerationStatus(result);
            
        } catch (error) {
            console.error(`生成失败 - ${result.title}:`, error);
            result.status = 'failed';
            result.progress = 0;
        }
    }
    
    isGenerating.value = false;
    
    // 发送完成通知
    if (batchConfig.value.sendNotification) {
        showNotification();
    }
};

// 轮询生成状态
const pollGenerationStatus = async (result: any) => {
    const maxAttempts = 60; // 最多等待10分钟
    let attempts = 0;
    
    while (attempts < maxAttempts) {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/knowledge-slides/project/${result.projectId}`
            );
            
            const status = response.data.status;
            
            if (status === 'completed') {
                result.status = 'completed';
                result.progress = 100;
                break;
            } else if (status === 'failed') {
                result.status = 'failed';
                result.progress = 0;
                break;
            } else {
                result.progress = Math.min(50 + (attempts * 2), 90);
            }
            
            await new Promise(resolve => setTimeout(resolve, 10000)); // 等待10秒
            attempts++;
            
        } catch (error) {
            console.error('轮询状态失败:', error);
            break;
        }
    }
    
    if (attempts >= maxAttempts && result.status !== 'completed') {
        result.status = 'timeout';
    }
};

// 重置配置
const resetConfig = () => {
    selectedKnowledge.value = [];
    generationResults.value = [];
    batchConfig.value = {
        theme: 'academic',
        slideCount: 15,
        language: 'zh-CN',
        includeImages: true,
        autoExport: false,
        sendNotification: true
    };
};

// 工具函数
const getKnowledgeTitle = (knowledgeId: number) => {
    const knowledge = knowledgeOptions.value.find((k: any) => k.id === knowledgeId);
    return knowledge?.title || `知识库 ${knowledgeId}`;
};

const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
        pending: '等待中',
        generating: '生成中',
        completed: '已完成',
        failed: '生成失败',
        timeout: '超时'
    };
    return statusMap[status] || status;
};

const getStatusSeverity = (status: string) => {
    const severityMap: { [key: string]: string } = {
        pending: 'info',
        generating: 'warning',
        completed: 'success',
        failed: 'danger',
        timeout: 'danger'
    };
    return severityMap[status] || 'info';
};

const previewResult = async (result: any) => {
    try {
        // 先获取预览端口
        const response = await axios.get(`${API_BASE_URL}/knowledge-slides/project/${result.projectId}/preview-port`);
        
        if (response.data.success && response.data.data?.port) {
            const previewUrl = `http://localhost:${response.data.data.port}`;
            window.open(previewUrl, '_blank');
        } else {
            throw new Error(response.data.error || '获取预览端口失败');
        }
    } catch (error) {
        console.error('启动预览失败:', error);
        alert('无法启动Slidev预览服务');
    }
};

const downloadResult = async (result: any) => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/knowledge-slides/project/${result.projectId}/export`,
            { format: 'pdf' }
        );
        // 处理下载
        console.log('下载项目:', result.title);
    } catch (error) {
        console.error('下载失败:', error);
    }
};

const showNotification = () => {
    // 显示完成通知
    console.log('批量生成完成！');
};

// 生命周期
onMounted(async () => {
    // 权限检查
    if (authStore.user?.role !== 'admin') {
        router.push('/dashboard');
        return;
    }
    
    // 并行获取数据
    await Promise.all([
        fetchKnowledge(),
        fetchThemes()
    ]);
});
</script>

<style scoped>
.admin-batch-generator {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
</style>