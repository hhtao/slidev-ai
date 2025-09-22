<template>
  <div class="knowledge-manager">
    <Card>
      <template #title>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-database"></i>
          {{ t('knowledge.manager.title') }}
        </div>
      </template>
      <template #content>
        <div class="knowledge-content">
          <div class="flex justify-content-between align-items-center mb-4">
            <div class="flex gap-2">
              <Button 
                :label="t('knowledge.upload.button')" 
                icon="pi pi-upload" 
                @click="showUploadDialog = true"
                class="p-button-success"
              />
              <Button 
                :label="t('knowledge.refresh.button')" 
                icon="pi pi-refresh" 
                @click="loadKnowledge"
                class="p-button-secondary"
              />
            </div>
            <div class="flex align-items-center gap-2">
              <span class="text-sm text-500">{{ t('knowledge.total.count') }}: {{ knowledgeList.length }}</span>
            </div>
          </div>

          <DataTable 
            :value="knowledgeList" 
            :loading="loading"
            :paginator="true" 
            :rows="10"
            :rowsPerPageOptions="[5, 10, 25]"
            v-model:selection="selectedKnowledge"
            dataKey="id"
            stripedRows
            responsiveLayout="scroll"
          >
            <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>
            
            <Column field="title" :header="t('knowledge.table.title')" sortable>
              <template #body="slotProps">
                <div class="flex align-items-center gap-2">
                  <i :class="getFileIcon(slotProps.data.type)"></i>
                  <span>{{ slotProps.data.title }}</span>
                </div>
              </template>
            </Column>
            
            <Column field="status" :header="t('knowledge.table.status')" sortable>
              <template #body="slotProps">
                <div class="flex align-items-center gap-2">
                  <Tag 
                    :value="getStatusLabel(slotProps.data.processingStatus || 'completed')" 
                    :severity="getStatusSeverity(slotProps.data.processingStatus || 'completed')"
                  />
                  <ProgressBar 
                    v-if="slotProps.data.processingStatus === 'processing'"
                    :value="slotProps.data.processingProgress || 0"
                    class="w-6rem"
                    :showValue="false"
                  />
                </div>
                <small v-if="slotProps.data.processingStage" class="text-500 block mt-1">
                  {{ getStageLabel(slotProps.data.processingStage) }}
                </small>
              </template>
            </Column>
            
            <Column field="size" :header="t('knowledge.table.size')" sortable>
              <template #body="slotProps">
                {{ formatFileSize(slotProps.data.size) }}
              </template>
            </Column>
            
            <Column field="createdAt" :header="t('knowledge.table.created')" sortable>
              <template #body="slotProps">
                {{ formatDate(slotProps.data.createdAt) }}
              </template>
            </Column>
            
            <Column :header="t('knowledge.table.actions')">
              <template #body="slotProps">
                <div class="flex gap-2">
                  <Button 
                    icon="pi pi-eye" 
                    class="p-button-text p-button-sm"
                    @click="viewKnowledge(slotProps.data)"
                    :title="t('knowledge.view.tooltip')"
                  />
                  <Button 
                    icon="pi pi-download" 
                    class="p-button-text p-button-sm"
                    @click="downloadKnowledge(slotProps.data)"
                    :title="t('knowledge.download.tooltip')"
                  />
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-text p-button-sm p-button-danger"
                    @click="confirmDelete(slotProps.data)"
                    :title="t('knowledge.delete.tooltip')"
                  />
                </div>
              </template>
            </Column>
          </DataTable>

          <div v-if="selectedKnowledge.length > 0" class="mt-3">
            <Button 
              :label="t('knowledge.batch.delete')" 
              icon="pi pi-trash" 
              class="p-button-danger p-button-sm"
              @click="confirmBatchDelete"
            />
          </div>
        </div>
      </template>
    </Card>

    <!-- 上传对话框 -->
    <Dialog 
      v-model:visible="showUploadDialog" 
      :header="t('knowledge.upload.title')" 
      :style="{ width: '50vw' }"
      :modal="true"
    >
      <div class="upload-content">
        <FileUpload
          ref="fileUpload"
          name="files"
          :multiple="true"
          :accept="acceptedFileTypes"
          :maxFileSize="maxFileSize"
          :chooseLabel="t('knowledge.upload.choose')"
          :uploadLabel="t('knowledge.upload.start')"
          :cancelLabel="t('knowledge.upload.cancel')"
          :customUpload="true"
          @uploader="customUploader"
        >
          <template #empty>
            <p>{{ t('knowledge.upload.drag.hint') }}</p>
          </template>
        </FileUpload>
        
        <div class="mt-3">
          <small class="text-500">
            {{ t('knowledge.upload.supported.formats') }}: PDF, DOC, DOCX, TXT, MD
          </small>
        </div>
      </div>
    </Dialog>

    <!-- 查看对话框 -->
    <Dialog 
      v-model:visible="showViewDialog" 
      :header="t('knowledge.view.title')" 
      :style="{ width: '70vw' }"
      :modal="true"
    >
      <div v-if="currentKnowledge" class="view-content">
        <div class="mb-3">
          <h4>{{ currentKnowledge.title }}</h4>
          <div class="flex gap-4 text-sm text-500">
            <span>{{ t('knowledge.table.type') }}: {{ currentKnowledge.type.toUpperCase() }}</span>
            <span>{{ t('knowledge.table.size') }}: {{ formatFileSize(currentKnowledge.size) }}</span>
            <span>{{ t('knowledge.table.created') }}: {{ formatDate(currentKnowledge.createdAt) }}</span>
          </div>
        </div>
        <Textarea 
          v-model="currentKnowledge.content" 
          :rows="20" 
          readonly 
          class="w-full"
          :placeholder="t('knowledge.content.loading')"
        />
      </div>
    </Dialog>

    <!-- 删除确认对话框 -->
    <ConfirmDialog />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { t } from '@/i18n/index';
import { useConfirm } from 'primevue/useconfirm';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Tag from 'primevue/tag';
import Dialog from 'primevue/dialog';
import FileUpload from 'primevue/fileupload';
import Textarea from 'primevue/textarea';
import ConfirmDialog from 'primevue/confirmdialog';
import ProgressBar from 'primevue/progressbar';
import { knowledgeApi } from '@/api/knowledge';

// 响应式数据
const knowledgeList = ref([]);
const selectedKnowledge = ref([]);
const loading = ref(false);
const showUploadDialog = ref(false);
const showViewDialog = ref(false);
const currentKnowledge = ref(null);
const processingIds = ref(new Set()); // 追踪正在处理的文档ID
let statusPollingInterval = null;

// 上传配置
const acceptedFileTypes = ref('.pdf,.doc,.docx,.txt,.md');
const maxFileSize = ref(10000000); // 10MB

const confirm = useConfirm();
const toast = useToast();

// 生命周期
onMounted(() => {
  loadKnowledge();
  startStatusPolling();
});

onUnmounted(() => {
  stopStatusPolling();
});

// 方法
const loadKnowledge = async () => {
  loading.value = true;
  try {
    const response = await knowledgeApi.getList();
    console.log('API响应:', response);
    
    // 根据API响应结构正确获取数据
    const data = response.data;
    if (data && data.knowledge && Array.isArray(data.knowledge)) {
      // 如果返回的是分页格式
      knowledgeList.value = data.knowledge;
    } else if (data && Array.isArray(data)) {
      // 如果直接返回数组
      knowledgeList.value = data;
    } else {
      // 默认空数组
      knowledgeList.value = [];
      console.warn('知识库数据格式不正确:', data);
    }
    
    // 更新正在处理的文档ID集合
    processingIds.value.clear();
    knowledgeList.value.forEach(item => {
      if (item.processingStatus === 'processing' || item.processingStatus === 'pending') {
        processingIds.value.add(item.id);
      }
    });
  } catch (error) {
    console.error('加载知识库失败:', error);
    knowledgeList.value = []; // 确保是数组
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.load.error'),
      life: 3000
    });
  } finally {
    loading.value = false;
  }
};

const getFileIcon = (type: string) => {
  const iconMap = {
    'pdf': 'pi pi-file-pdf',
    'doc': 'pi pi-file-word',
    'docx': 'pi pi-file-word',
    'txt': 'pi pi-file',
    'md': 'pi pi-file-edit'
  };
  return iconMap[type] || 'pi pi-file';
};

const getTypeSeverity = (type: string) => {
  const severityMap = {
    'pdf': 'danger',
    'doc': 'info',
    'docx': 'info',
    'txt': 'success',
    'md': 'warning'
  };
  return severityMap[type] || 'secondary';
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

// 获取状态标签
const getStatusLabel = (status: string) => {
  const statusMap = {
    'pending': t('knowledge.status.pending'),
    'processing': t('knowledge.status.processing'),
    'completed': t('knowledge.status.completed'),
    'failed': t('knowledge.status.failed')
  };
  return statusMap[status] || status;
};

// 获取状态严重级别
const getStatusSeverity = (status: string) => {
  const severityMap = {
    'pending': 'warning',
    'processing': 'info',
    'completed': 'success',
    'failed': 'danger'
  };
  return severityMap[status] || 'secondary';
};

// 获取阶段标签
const getStageLabel = (stage: string) => {
  const stageMap = {
    'uploading': t('knowledge.stage.uploading'),
    'parsing': t('knowledge.stage.parsing'),
    'vectorizing': t('knowledge.stage.vectorizing'),
    'storing': t('knowledge.stage.storing')
  };
  return stageMap[stage] || stage;
};

const viewKnowledge = async (knowledge: any) => {
  try {
    const response = await knowledgeApi.getContent(knowledge.id);
    currentKnowledge.value = {
      ...knowledge,
      content: response.data.content
    };
    showViewDialog.value = true;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.view.error'),
      life: 3000
    });
  }
};

const downloadKnowledge = async (knowledge: any) => {
  try {
    const response = await knowledgeApi.download(knowledge.id);
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', knowledge.title);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.download.error'),
      life: 3000
    });
  }
};

const confirmDelete = (knowledge: any) => {
  confirm.require({
    message: t('knowledge.delete.confirm', { title: knowledge.title }),
    header: t('knowledge.delete.title'),
    icon: 'pi pi-exclamation-triangle',
    accept: () => deleteKnowledge(knowledge.id)
  });
};

const confirmBatchDelete = () => {
  confirm.require({
    message: t('knowledge.batch.delete.confirm', { count: selectedKnowledge.value.length }),
    header: t('knowledge.delete.title'),
    icon: 'pi pi-exclamation-triangle',
    accept: () => batchDeleteKnowledge()
  });
};

const deleteKnowledge = async (id: string) => {
  try {
    await knowledgeApi.delete(id);
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.delete.success'),
      life: 3000
    });
    loadKnowledge();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.delete.error'),
      life: 3000
    });
  }
};

const batchDeleteKnowledge = async () => {
  try {
    const ids = selectedKnowledge.value.map(k => k.id);
    await knowledgeApi.batchDelete(ids);
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.batch.delete.success'),
      life: 3000
    });
    selectedKnowledge.value = [];
    loadKnowledge();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.batch.delete.error'),
      life: 3000
    });
  }
};

const customUploader = async (event: any) => {
  const files = event.files;
  const formData = new FormData();
  
  for (let file of files) {
    formData.append('files', file);
  }

  try {
    const response = await knowledgeApi.upload(formData);
    
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.upload.success'),
      life: 3000
    });
    
    showUploadDialog.value = false;
    
    // 如果返回了文档ID，将其添加到追踪列表
    if (response.data.id) {
      processingIds.value.add(response.data.id);
    }
    
    loadKnowledge();
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.upload.error'),
      life: 3000
    });
  }
};

// 状态轮询相关方法
const startStatusPolling = () => {
  statusPollingInterval = setInterval(async () => {
    if (processingIds.value.size > 0) {
      await pollProcessingStatus();
    }
  }, 3000); // 每3秒轮询一次
};

const stopStatusPolling = () => {
  if (statusPollingInterval) {
    clearInterval(statusPollingInterval);
    statusPollingInterval = null;
  }
};

const pollProcessingStatus = async () => {
  const idsToCheck = Array.from(processingIds.value);
  
  for (const id of idsToCheck) {
    try {
      const status = await knowledgeApi.getStatus(id);
      
      // 更新列表中对应项的状态
      const index = knowledgeList.value.findIndex(item => item.id === id);
      if (index !== -1) {
        knowledgeList.value[index] = {
          ...knowledgeList.value[index],
          processingStatus: status.data.processingStatus,
          processingProgress: status.data.processingProgress,
          processingStage: status.data.processingStage,
          processingError: status.data.processingError
        };
      }
      
      // 如果处理完成或失败，从追踪列表中移除
      if (status.data.processingStatus === 'completed' || status.data.processingStatus === 'failed') {
        processingIds.value.delete(id);
        
        if (status.data.processingStatus === 'completed') {
          toast.add({
            severity: 'success',
            summary: t('success.title'),
            detail: `文档 "${knowledgeList.value[index]?.title || ''}" 处理完成`,
            life: 3000
          });
        } else {
          toast.add({
            severity: 'error',
            summary: t('error.title'),
            detail: `文档 "${knowledgeList.value[index]?.title || ''}" 处理失败: ${status.data.processingError || '未知错误'}`,
            life: 5000
          });
        }
      }
    } catch (error) {
      console.error('获取状态失败:', error);
      // 如果获取状态失败，也从追踪列表中移除
      processingIds.value.delete(id);
    }
  }
};
</script>

<style scoped>
.knowledge-manager {
  padding: 1rem;
}

.knowledge-content {
  min-height: 400px;
}

.upload-content {
  padding: 1rem;
}

.view-content {
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

:deep(.p-fileupload .p-fileupload-content) {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  text-align: center;
  padding: 2rem;
  transition: border-color 0.2s;
}

:deep(.p-fileupload .p-fileupload-content:hover) {
  border-color: #3b82f6;
}
</style>