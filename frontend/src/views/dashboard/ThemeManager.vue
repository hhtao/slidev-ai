<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { t } from '@/i18n';
import { API_BASE_URL } from '@/utils/api';
import { useToast } from 'primevue/usetoast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Tag from 'primevue/tag';
import Carousel from 'primevue/carousel';
import { useSlidevStore } from '@/store/slidev';
import { ThemeDto } from '../slides/process/dto';

const themes = ref<ThemeDto[]>([]);
const loading = ref(true);
const updatingAll = ref(false);
const updatingThemeId = ref<number | null>(null);
const toast = useToast();

// 更新对话框相关
const showUpdateDialog = ref(false);
const updateDialogTitle = ref('');
const updateLogs = ref<{ type: string; message: string }[]>([]);
const updateLoading = ref(false);

const slidevStore = useSlidevStore();

// 处理图片加载错误
const handleImageError = (e: Event) => {
    const target = e.target as HTMLImageElement;
    target.style.display = 'none';
};

// 获取所有主题
const fetchThemes = async () => {
    try {
        loading.value = true;
        themes.value = await slidevStore.getThemes();

    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: t('theme.manager.fetchError'),
            detail: error.message,
            life: 5000
        });
    } finally {
        loading.value = false;
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

    } catch (error: any) {
        updateLoading.value = false;
        updatingAll.value = false;
        toast.add({
            severity: 'error',
            summary: t('theme.manager.updateError'),
            detail: error.message,
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

    } catch (error: any) {
        updateLoading.value = false;
        updatingThemeId.value = null;
        toast.add({
            severity: 'error',
            summary: t('theme.manager.updateError'),
            detail: error.message,
            life: 5000
        });
    }
};

// 关闭更新对话框
const closeUpdateDialog = () => {
    showUpdateDialog.value = false;
    updateLogs.value = [];
    updatingAll.value = false;
    updatingThemeId.value = null;
};

// 初始化数据
onMounted(() => {
    fetchThemes();
});
</script>

<template>
    <div class="p-6 min-h-screen">
        <!-- 标题和操作区 -->
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h2 class="text-2xl font-bold">{{ t('theme.manager.title') }}</h2>
            <Button :label="t('theme.manager.updateAll')" icon="pi pi-refresh" @click="updateAllThemes"
                :loading="updatingAll" class="p-button-primary"
                :class="{ 'opacity-70 cursor-not-allowed': updatingAll }" />
        </div>

        <!-- 更新日志对话框 -->
        <Dialog v-model:visible="showUpdateDialog" modal :header="updateDialogTitle" :style="{ width: '50rem' }"
            :breakpoints="{ '1199px': '75vw', '575px': '90vw' }" :draggable="false" :closeOnEscape="false"
            :closable="false">
            <div class="flex flex-col">
                <div class="flex-1 max-h-96 overflow-y-auto p-4 bg-gray-100 dark:bg-gray-800 rounded">
                    <div v-for="(log, index) in updateLogs" :key="index"
                        class="mb-2 p-3 rounded border-l-4"
                        :class="{
                            'bg-blue-50 dark:bg-blue-900/30 border-blue-500': log.type === 'info',
                            'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-500': log.type === 'warn',
                            'bg-red-50 dark:bg-red-900/30 border-red-500': log.type === 'error',
                            'bg-green-50 dark:bg-green-900/30 border-green-500': log.type === 'success'
                        }">
                        <div class="flex items-start">
                            <i class="mr-2 mt-1" 
                                :class="{
                                    'pi pi-info-circle text-blue-500': log.type === 'info',
                                    'pi pi-exclamation-triangle text-yellow-500': log.type === 'warn',
                                    'pi pi-times-circle text-red-500': log.type === 'error',
                                    'pi pi-check-circle text-green-500': log.type === 'success'
                                }"></i>
                            <div>
                                <span class="font-medium text-sm opacity-75">{{ log.type.toUpperCase() }}</span>
                                <p class="mt-1">{{ log.message }}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="updateLogs.length === 0" class="text-center py-8 text-gray-500">
                        <ProgressSpinner class="w-6 h-6 mx-auto" strokeWidth="4" />
                        <p class="mt-2">{{ t('theme.manager.updating') }}</p>
                    </div>
                </div>

                <div v-if="updateLoading" class="mt-4 flex items-center">
                    <ProgressSpinner class="w-4 h-4 mr-2" strokeWidth="4" />
                    <span>{{ t('theme.manager.updating') }}</span>
                </div>
            </div>

            <template #footer>
                <Button :label="t('common.close')" icon="pi pi-times" @click="closeUpdateDialog"
                    :disabled="updateLoading" autofocus />
            </template>
        </Dialog>

        <!-- 加载中状态 -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-16 rounded-xl shadow-sm bg-card">
            <ProgressSpinner class="w-12 h-12" strokeWidth="4" />
            <p class="mt-4 text-lg text-muted-foreground">{{ t('theme.manager.loading') }}</p>
        </div>

        <!-- 无主题状态 -->
        <div v-else-if="themes.length === 0"
            class="flex flex-col items-center justify-center py-16 rounded-xl shadow-sm bg-card">
            <i class="pi pi-box text-7xl opacity-40"></i>
            <p class="mt-4 text-lg text-muted-foreground">{{ t('theme.manager.noThemes') }}</p>
        </div>

        <!-- 主题卡片网格 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div v-for="theme in themes" :key="theme.id"
                class="rounded-xl shadow-sm p-card hover:shadow-md transition-shadow duration-300 overflow-hidden flex flex-col bg-card">
                <!-- 卡片头部 -->
                <div class="p-5 pb-3 flex justify-between items-start">
                    <h3 class="text-lg font-semibold">{{ theme.name }}</h3>
                    <Tag :value="theme.installed ? t('theme.manager.installed') : t('theme.manager.notInstalled')"
                        :severity="theme.installed ? 'success' : 'warning'" class="text-xs py-1 px-2" />
                </div>

                <!-- 图片区域 -->
                <div class="px-5 py-4 flex-1 flex items-center justify-center bg-muted">
                    <div v-if="theme.images?.length" class="w-full max-h-64">
                        <Carousel :value="theme.images" :numVisible="1" :numScroll="1" circular :autoplayInterval="3000"
                            :showNavigators="theme.images.length > 1" :showIndicators="theme.images.length > 1"
                            class="rounded-lg overflow-hidden">
                            <template #item="slotProps">
                                <div class="flex justify-center items-center h-64 bg-background">
                                    <img :src="slidevStore.getImageSsoUrl(slotProps.data)"
                                        :alt="slotProps.data.imageName"
                                        class="max-h-full max-w-full object-contain rounded"
                                        @error="handleImageError" />
                                </div>
                            </template>
                        </Carousel>
                    </div>
                    <div v-else
                        class="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
                        <i class="pi pi-image text-6xl mb-3"></i>
                        <p class="text-sm">{{ t('theme.manager.noImages') }}</p>
                    </div>
                </div>

                <!-- 操作按钮组 -->
                <div class="mt-5 p-5 pt-3 bg-muted">
                    <div class="flex gap-3">
                        <Button :label="t('theme.manager.update')"
                            icon="pi pi-sync" @click="updateTheme(theme.id)"
                            :loading="updatingThemeId === theme.id"
                            class="flex-1" size="small"
                        />
                        <a v-if="theme.github" :href="theme.github" target="_blank"
                            class="p-button p-button-text flex-1 flex justify-center items-center gap-2 text-sm">
                            <i class="pi pi-github"></i>
                            {{ t('theme.manager.viewOnGithub') }}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>


<style scoped></style>