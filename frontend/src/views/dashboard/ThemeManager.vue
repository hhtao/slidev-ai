<template>
    <div class="theme-manager">
        <div class="flex justify-content-between align-items-center mb-4">
            <h2>{{ t('theme.manager.title') }}</h2>
            <Button :label="t('theme.manager.updateAll')" icon="pi pi-refresh" @click="updateAllThemes"
                :loading="updatingAll" class="p-button-primary" />
        </div>

        <div v-if="themes.length === 0" class="text-center py-8">
            <i class="pi pi-box text-6xl text-400"></i>
            <p class="text-700 mt-4">{{ t('theme.manager.noThemes') }}</p>
        </div>

        <div class="grid">
            <div v-for="theme in themes" :key="theme.id" class="col-12 md:col-6 lg:col-4">
                <div class="border-1 border-round p-4 h-full flex flex-column">
                    <div class="flex align-items-center justify-content-between mb-3">
                        <h3 class="m-0">{{ theme.name }}</h3>
                        <Tag :value="theme.installed ? t('theme.manager.installed') : t('theme.manager.notInstalled')"
                            :severity="theme.installed ? 'success' : 'warning'" />
                    </div>

                    <div v-if="theme.images && theme.images.length > 0" class="mb-3">
                        <div class="flex overflow-x-auto">
                            <img v-for="(image, index) in theme.images" :key="index"
                                :src="`${API_BASE_URL}/uploads/theme-examples/${image.imageName}`"
                                :alt="`${theme.name} example ${index + 1}`"
                                class="w-8rem h-6rem object-cover border-round mr-2" @error="handleImageError" />
                        </div>
                    </div>

                    <div class="mt-auto">
                        <div class="flex justify-content-between">
                            <Button :label="t('theme.manager.update')" icon="pi pi-sync" @click="updateTheme(theme.id)"
                                :loading="updatingThemeId === theme.id" class="p-button-outlined p-button-secondary"
                                size="small" />
                            <a v-if="theme.github" :href="theme.github" target="_blank"
                                class="p-button p-button-link p-button-sm">
                                <i class="pi pi-github"></i>
                                {{ t('theme.manager.viewOnGithub') }}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 更新进度对话框 -->
        <Dialog v-model:visible="showUpdateDialog" :header="updateDialogTitle" :modal="true" :closable="false"
            :dismissableMask="false" :style="{ width: '50vw' }">
            <div class="flex flex-column">
                <div v-for="(log, index) in updateLogs" :key="index" class="mb-2">
                    <div :class="{
                        'text-green-500': log.type === 'success',
                        'text-blue-500': log.type === 'info',
                        'text-red-500': log.type === 'error',
                        'text-yellow-500': log.type === 'warning'
                    }">
                        {{ log.message }}
                    </div>
                </div>
                <div v-if="updateLoading" class="flex align-items-center">
                    <ProgressSpinner style="width: 30px; height: 30px" strokeWidth="4" />
                    <span class="ml-2">{{ t('theme.manager.updating') }}</span>
                </div>
            </div>

            <template #footer>
                <Button :label="t('common.close')" @click="closeUpdateDialog" :disabled="updateLoading"
                    class="p-button-text" />
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { t } from '@/i18n';
import axios from 'axios';
import { API_BASE_URL } from '@/utils/api';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';

interface ThemeImage {
    imageUrl: string;
    imageName: string;
}

interface Theme {
    id: number;
    name: string;
    github: string;
    images: ThemeImage[];
    installScripts: string[];
    installed: boolean;
    createdAt: string;
    updatedAt: string;
}

const themes = ref<Theme[]>([]);
const updatingAll = ref(false);
const updatingThemeId = ref<number | null>(null);
const toast = useToast();

// 更新对话框相关
const showUpdateDialog = ref(false);
const updateDialogTitle = ref('');
const updateLogs = ref<{ type: string; message: string }[]>([]);
const updateLoading = ref(false);

// 获取所有主题
const fetchThemes = async () => {
    try {
        const response = await axios.get<Theme[]>(`${API_BASE_URL}/mcp/themes`);
        themes.value = response.data;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('theme.manager.fetchError'),
            detail: (error as any).message,
            life: 5000
        });
    }
};

// 更新所有主题
const updateAllThemes = async () => {
    updatingAll.value = true;
    showUpdateDialog.value = true;
    updateDialogTitle.value = t('theme.manager.updateAllTitle');
    updateLogs.value = [];
    updateLoading.value = true;

    try {
        const eventSource = new EventSource(`${API_BASE_URL}/mcp/themes/update-all`, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateLogs.value.push(data);

            // 自动滚动到底部
            setTimeout(() => {
                const dialogContent = document.querySelector('.p-dialog-content');
                if (dialogContent) {
                    dialogContent.scrollTop = dialogContent.scrollHeight;
                }
            }, 0);
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            updateLoading.value = false;
            eventSource.close();
        };

        // 监听完成事件
        const handleComplete = () => {
            updateLoading.value = false;
            eventSource.close();
            // 刷新主题列表
            setTimeout(fetchThemes, 1000);
        };

        // 添加一个简单的超时机制
        setTimeout(() => {
            if (updateLoading.value) {
                updateLoading.value = false;
                eventSource.close();
            }
        }, 30000); // 30秒超时

    } catch (error) {
        updateLoading.value = false;
        toast.add({
            severity: 'error',
            summary: t('theme.manager.updateError'),
            detail: (error as any).message,
            life: 5000
        });
    }
};

// 更新单个主题
const updateTheme = async (themeId: number) => {
    updatingThemeId.value = themeId;
    showUpdateDialog.value = true;
    updateDialogTitle.value = t('theme.manager.updateThemeTitle');
    updateLogs.value = [];
    updateLoading.value = true;

    try {
        const theme = themes.value.find(t => t.id === themeId);
        const themeName = theme ? theme.name : 'Unknown';

        const eventSource = new EventSource(`${API_BASE_URL}/mcp/themes/${themeId}/update`, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateLogs.value.push(data);

            // 自动滚动到底部
            setTimeout(() => {
                const dialogContent = document.querySelector('.p-dialog-content');
                if (dialogContent) {
                    dialogContent.scrollTop = dialogContent.scrollHeight;
                }
            }, 0);
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            updateLoading.value = false;
            updatingThemeId.value = null;
            eventSource.close();
        };

        // 监听完成事件
        const handleComplete = () => {
            updateLoading.value = false;
            updatingThemeId.value = null;
            eventSource.close();
            // 刷新主题列表
            setTimeout(fetchThemes, 1000);
        };

        // 添加一个简单的超时机制
        setTimeout(() => {
            if (updateLoading.value) {
                updateLoading.value = false;
                updatingThemeId.value = null;
                eventSource.close();
            }
        }, 30000); // 30秒超时

    } catch (error) {
        updateLoading.value = false;
        updatingThemeId.value = null;
        toast.add({
            severity: 'error',
            summary: t('theme.manager.updateError'),
            detail: (error as any).message,
            life: 5000
        });
    }
};

// 关闭更新对话框
const closeUpdateDialog = () => {
    showUpdateDialog.value = false;
    updateLogs.value = [];
};

// 处理图片加载错误
const handleImageError = (event: any) => {
    event.target.style.display = 'none';
};

// 初始化数据
onMounted(() => {
    fetchThemes();
});
</script>

<style scoped>
.theme-manager {
    padding: 1rem;
}

.overflow-x-auto {
    -webkit-overflow-scrolling: touch;
}

.overflow-x-auto::-webkit-scrollbar {
    height: 6px;
}

.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}
</style>