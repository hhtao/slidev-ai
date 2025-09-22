<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { knowledgeApi, type Knowledge, type KnowledgeSearchParams } from '@/api/knowledge';
import { useAuthStore } from '@/store/auth';

// PrimeVue 组件
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import FileUpload from 'primevue/fileupload';
import Tag from 'primevue/tag';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const authStore = useAuthStore();
const toast = useToast();
const confirm = useConfirm();

// 数据状态
const knowledgeList = ref<Knowledge[]>([]);
const totalRecords = ref(0);
const loading = ref(false);
const selectedKnowledge = ref<Knowledge[]>([]);

// 分页和搜索
const currentPage = ref(1);
const pageSize = ref(10);
const searchKeyword = ref('');
const selectedContentType = ref('');
const selectedVisibility = ref('');

// 对话框状态
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showViewDialog = ref(false);
const currentKnowledge = ref<Knowledge | null>(null);

// 表单数据
const createForm = ref<{
    title: string;
    content: string;
    summary: string;
    contentType: string;
    visibility: 'public' | 'private';
    metadata: any;
}>({
    title: '',
    content: '',
    summary: '',
    contentType: 'text',
    visibility: 'public',
    metadata: {}
});

const editForm = ref<{
    title: string;
    content: string;
    summary: string;
    visibility: 'public' | 'private';
    metadata: any;
}>({
    title: '',
    content: '',
    summary: '',
    visibility: 'public',
    metadata: {}
});

// 选项数据
const contentTypeOptions = [
    { label: '全部类型', value: '' },
    { label: '文本', value: 'text' },
    { label: 'Markdown', value: 'md' },
    { label: 'PDF', value: 'pdf' },
    { label: 'Word文档', value: 'doc' },
];

const visibilityOptions = [
    { label: '全部', value: '' },
    { label: '公开', value: 'public' },
    { label: '私有', value: 'private' },
];

const createVisibilityOptions = [
    { label: '公开', value: 'public' },
    { label: '私有', value: 'private' },
];

// 计算属性
const isAdmin = computed(() => authStore.user?.role === 'admin');

// 获取向量状态标签
const getVectorStatusTag = (status: string) => {
    switch (status) {
        case 'pending': return { severity: 'info', label: '待处理' };
        case 'processing': return { severity: 'warning', label: '处理中' };
        case 'completed': return { severity: 'success', label: '已完成' };
        case 'failed': return { severity: 'danger', label: '失败' };
        default: return { severity: 'secondary', label: status };
    }
};

// 格式化文件大小
const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 格式化日期
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN');
};

// 加载知识库列表
const loadKnowledgeList = async () => {
    loading.value = true;
    try {
        const params: KnowledgeSearchParams = {
            page: currentPage.value,
            limit: pageSize.value,
        };

        if (searchKeyword.value) params.keyword = searchKeyword.value;
        if (selectedContentType.value) params.contentType = selectedContentType.value;
        if (selectedVisibility.value) params.visibility = selectedVisibility.value;

        const response = await knowledgeApi.getList(params);
        
        // 后端直接返回数据，不是Result包装格式
        if (response.data) {
            knowledgeList.value = response.data.knowledge;
            totalRecords.value = response.data.total;
        } else {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '加载失败'
            });
        }
    } catch (error) {
        console.error('加载知识库列表失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '网络请求失败'
        });
    } finally {
        loading.value = false;
    }
};

// 分页处理
const onPageChange = (event: any) => {
    currentPage.value = event.page + 1;
    pageSize.value = event.rows;
    loadKnowledgeList();
};

// 搜索处理
const handleSearch = () => {
    currentPage.value = 1;
    loadKnowledgeList();
};

// 重置搜索
const resetSearch = () => {
    searchKeyword.value = '';
    selectedContentType.value = '';
    selectedVisibility.value = '';
    currentPage.value = 1;
    loadKnowledgeList();
};

// 创建知识文档
const handleCreate = async () => {
    try {
        const response = await knowledgeApi.create(createForm.value);
        
        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: '知识文档创建成功'
            });
            showCreateDialog.value = false;
            resetCreateForm();
            loadKnowledgeList();
        } else {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '创建失败'
            });
        }
    } catch (error) {
        console.error('创建知识文档失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '网络请求失败'
        });
    }
};

// 文件选择处理
const handleFileSelect = async (event: any) => {
    console.log('文件选择事件:', event);
    const file = event.files[0];
    if (!file) {
        console.log('没有选择文件');
        return;
    }

    console.log('开始上传文件:', file.name, '大小:', file.size);
    
    // 显示上传进度
    loading.value = true;
    
    try {
        console.log('调用 knowledgeApi.uploadFile...');
        const response = await knowledgeApi.uploadFile(file);
        console.log('上传结果:', response);
        
        if (response && response.id) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: '文件上传成功，正在后台处理'
            });
            loadKnowledgeList();
        } else {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '上传失败'
            });
        }
    } catch (error) {
        console.error('文件上传错误:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '文件上传失败: ' + (error.response?.data?.message || error.message)
        });
    } finally {
        loading.value = false;
    }
};

// 查看知识文档
const viewKnowledge = async (knowledge: Knowledge) => {
    try {
        const response = await knowledgeApi.getById(knowledge.id);
        if (response.data) {
            currentKnowledge.value = response.data;
            showViewDialog.value = true;
        }
    } catch (error) {
        console.error('加载详情失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '加载详情失败'
        });
    }
};

// 编辑知识文档
const editKnowledge = async (knowledge: Knowledge) => {
    try {
        const response = await knowledgeApi.getById(knowledge.id);
        if (response.data) {
            currentKnowledge.value = response.data;
            editForm.value = {
                title: response.data.title,
                content: response.data.content,
                summary: response.data.summary || '',
                visibility: response.data.visibility,
                metadata: response.data.metadata || {}
            };
            showEditDialog.value = true;
        }
    } catch (error) {
        console.error('加载编辑数据失败:', error);
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '加载编辑数据失败'
        });
    }
};

// 保存编辑
const handleEdit = async () => {
    if (!currentKnowledge.value) return;

    try {
        const response = await knowledgeApi.update(currentKnowledge.value.id, editForm.value);
        
        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: '知识文档更新成功'
            });
            showEditDialog.value = false;
            loadKnowledgeList();
        } else {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: '更新失败'
            });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: '网络请求失败'
        });
    }
};

// 删除知识文档
const deleteKnowledge = (knowledge: Knowledge) => {
    confirm.require({
        message: `确定要删除知识文档"${knowledge.title}"吗？`,
        header: '确认删除',
        icon: 'pi pi-exclamation-triangle',
        accept: async () => {
            try {
                const response = await knowledgeApi.delete(knowledge.id);
                
                if (response.data) {
                    toast.add({
                        severity: 'success',
                        summary: '成功',
                        detail: '知识文档删除成功'
                    });
                    loadKnowledgeList();
                } else {
                    toast.add({
                        severity: 'error',
                        summary: '错误',
                        detail: '删除失败'
                    });
                }
            } catch (error) {
                toast.add({
                    severity: 'error',
                    summary: '错误',
                    detail: '网络请求失败'
                });
            }
        }
    });
};

// 重置创建表单
const resetCreateForm = () => {
    createForm.value = {
        title: '',
        content: '',
        summary: '',
        contentType: 'text',
        visibility: 'public',
        metadata: {}
    };
};

// 组件挂载时加载数据
onMounted(() => {
    loadKnowledgeList();
});
</script>

<template>
    <div class="knowledge-manager">
        <Toast />
        <ConfirmDialog />
        
        <!-- 页面标题和操作按钮 -->
        <div class="flex justify-content-between align-items-center mb-4">
            <h2 class="text-2xl font-bold">知识库管理</h2>
            <div class="flex gap-2">
                <FileUpload 
                    mode="basic" 
                    :auto="false"
                    choose-label="上传文件"
                    accept=".txt,.md,.pdf,.doc,.docx"
                    :max-file-size="10000000"
                    @select="handleFileSelect"
                    class="p-button-outlined"
                />
                <Button 
                    label="新建文档" 
                    icon="pi pi-plus" 
                    @click="showCreateDialog = true"
                />
            </div>
        </div>

        <!-- 搜索和筛选 -->
        <div class="flex flex-wrap gap-3 mb-4 p-3 border-round surface-50">
            <div class="flex-1 min-w-20rem">
                <InputText
                    v-model="searchKeyword"
                    placeholder="搜索标题、内容或摘要..."
                    class="w-full"
                    @keyup.enter="handleSearch"
                />
            </div>
            <Select
                v-model="selectedContentType"
                :options="contentTypeOptions"
                option-label="label"
                option-value="value"
                placeholder="内容类型"
                class="w-10rem"
            />
            <Select
                v-model="selectedVisibility"
                :options="visibilityOptions"
                option-label="label"
                option-value="value"
                placeholder="可见性"
                class="w-8rem"
            />
            <Button label="搜索" icon="pi pi-search" @click="handleSearch" />
            <Button label="重置" icon="pi pi-refresh" severity="secondary" @click="resetSearch" />
        </div>

        <!-- 数据表格 -->
        <DataTable
            v-model:selection="selectedKnowledge"
            :value="knowledgeList"
            :loading="loading"
            :paginator="true"
            :rows="pageSize"
            :total-records="totalRecords"
            :lazy="true"
            paginator-template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            :rows-per-page-options="[10, 25, 50]"
            current-page-report-template="显示 {first} 到 {last} 条，共 {totalRecords} 条记录"
            @page="onPageChange"
            class="p-datatable-sm"
        >
            <Column selection-mode="multiple" header-style="width: 3rem"></Column>
            
            <Column field="title" header="标题" sortable>
                <template #body="{ data }">
                    <div class="font-medium">{{ data.title }}</div>
                    <div class="text-sm text-500" v-if="data.filename">{{ data.filename }}</div>
                </template>
            </Column>
            
            <Column field="contentType" header="类型" sortable>
                <template #body="{ data }">
                    <Tag :value="data.contentType.toUpperCase()" severity="info" />
                </template>
            </Column>
            
            <Column field="fileSize" header="大小" sortable>
                <template #body="{ data }">
                    {{ formatFileSize(data.fileSize) }}
                </template>
            </Column>
            
            <Column field="vectorStatus" header="向量状态" sortable>
                <template #body="{ data }">
                    <Tag 
                        :value="getVectorStatusTag(data.vectorStatus).label"
                        :severity="getVectorStatusTag(data.vectorStatus).severity"
                    />
                </template>
            </Column>
            
            <Column field="visibility" header="可见性" sortable>
                <template #body="{ data }">
                    <Tag 
                        :value="data.visibility === 'public' ? '公开' : '私有'"
                        :severity="data.visibility === 'public' ? 'success' : 'warning'"
                    />
                </template>
            </Column>
            
            <Column field="user.username" header="创建者" sortable v-if="isAdmin">
                <template #body="{ data }">
                    {{ data.user?.username || '-' }}
                </template>
            </Column>
            
            <Column field="createdAt" header="创建时间" sortable>
                <template #body="{ data }">
                    {{ formatDate(data.createdAt) }}
                </template>
            </Column>
            
            <Column header="操作" style="width: 12rem">
                <template #body="{ data }">
                    <div class="flex gap-1">
                        <Button 
                            icon="pi pi-eye" 
                            size="small" 
                            severity="info" 
                            text 
                            @click="viewKnowledge(data)"
                            title="查看"
                        />
                        <Button 
                            icon="pi pi-pencil" 
                            size="small" 
                            text 
                            @click="editKnowledge(data)"
                            title="编辑"
                        />
                        <Button 
                            icon="pi pi-trash" 
                            size="small" 
                            severity="danger" 
                            text 
                            @click="deleteKnowledge(data)"
                            title="删除"
                        />
                    </div>
                </template>
            </Column>
        </DataTable>

        <!-- 创建文档对话框 -->
        <Dialog 
            v-model:visible="showCreateDialog" 
            modal 
            header="新建知识文档" 
            style="width: 50vw"
            @hide="resetCreateForm"
        >
            <div class="flex flex-column gap-3">
                <div>
                    <label class="block text-sm font-medium mb-1">标题 *</label>
                    <InputText v-model="createForm.title" class="w-full" placeholder="请输入文档标题" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">摘要</label>
                    <InputText v-model="createForm.summary" class="w-full" placeholder="请输入文档摘要" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">内容 *</label>
                    <Textarea 
                        v-model="createForm.content" 
                        rows="10" 
                        class="w-full" 
                        placeholder="请输入文档内容"
                    />
                </div>
                
                <div class="flex gap-3">
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">内容类型</label>
                        <Select
                            v-model="createForm.contentType"
                            :options="contentTypeOptions.filter(opt => opt.value !== '')"
                            option-label="label"
                            option-value="value"
                            class="w-full"
                        />
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium mb-1">可见性</label>
                        <Select
                            v-model="createForm.visibility"
                            :options="createVisibilityOptions"
                            option-label="label"
                            option-value="value"
                            class="w-full"
                        />
                    </div>
                </div>
            </div>
            
            <template #footer>
                <Button label="取消" text @click="showCreateDialog = false" />
                <Button label="创建" @click="handleCreate" :disabled="!createForm.title || !createForm.content" />
            </template>
        </Dialog>

        <!-- 编辑文档对话框 -->
        <Dialog 
            v-model:visible="showEditDialog" 
            modal 
            header="编辑知识文档" 
            style="width: 50vw"
        >
            <div class="flex flex-column gap-3" v-if="currentKnowledge">
                <div>
                    <label class="block text-sm font-medium mb-1">标题 *</label>
                    <InputText v-model="editForm.title" class="w-full" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">摘要</label>
                    <InputText v-model="editForm.summary" class="w-full" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">内容 *</label>
                    <Textarea v-model="editForm.content" rows="10" class="w-full" />
                </div>
                
                <div>
                    <label class="block text-sm font-medium mb-1">可见性</label>
                    <Select
                        v-model="editForm.visibility"
                        :options="createVisibilityOptions"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                    />
                </div>
            </div>
            
            <template #footer>
                <Button label="取消" text @click="showEditDialog = false" />
                <Button label="保存" @click="handleEdit" :disabled="!editForm.title || !editForm.content" />
            </template>
        </Dialog>

        <!-- 查看文档对话框 -->
        <Dialog 
            v-model:visible="showViewDialog" 
            modal 
            header="查看知识文档" 
            style="width: 60vw"
        >
            <div v-if="currentKnowledge" class="flex flex-column gap-3">
                <div>
                    <h3 class="mt-0">{{ currentKnowledge.title }}</h3>
                    <p class="text-500 text-sm mb-3" v-if="currentKnowledge.summary">
                        {{ currentKnowledge.summary }}
                    </p>
                </div>
                
                <div class="flex gap-4 mb-3">
                    <div class="flex align-items-center gap-2">
                        <span class="text-sm text-500">类型:</span>
                        <Tag :value="currentKnowledge.contentType.toUpperCase()" severity="info" />
                    </div>
                    <div class="flex align-items-center gap-2">
                        <span class="text-sm text-500">可见性:</span>
                        <Tag 
                            :value="currentKnowledge.visibility === 'public' ? '公开' : '私有'"
                            :severity="currentKnowledge.visibility === 'public' ? 'success' : 'warning'"
                        />
                    </div>
                    <div class="flex align-items-center gap-2">
                        <span class="text-sm text-500">向量状态:</span>
                        <Tag 
                            :value="getVectorStatusTag(currentKnowledge.vectorStatus).label"
                            :severity="getVectorStatusTag(currentKnowledge.vectorStatus).severity"
                        />
                    </div>
                </div>
                
                <div class="border-1 border-200 border-round p-3 bg-50">
                    <div class="text-sm text-500 mb-2">内容:</div>
                    <pre class="white-space-pre-wrap font-family-inherit">{{ currentKnowledge.content }}</pre>
                </div>
                
                <div class="flex justify-content-between text-sm text-500">
                    <span>创建时间: {{ formatDate(currentKnowledge.createdAt) }}</span>
                    <span>更新时间: {{ formatDate(currentKnowledge.updatedAt) }}</span>
                </div>
            </div>
            
            <template #footer>
                <Button label="关闭" @click="showViewDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<style scoped>
.knowledge-manager {
    padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
    padding: 0.5rem;
}

:deep(.p-dialog .p-dialog-content) {
    padding: 1.5rem;
}

pre {
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.9em;
    line-height: 1.4;
}
</style>