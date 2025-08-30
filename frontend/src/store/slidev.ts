// stores/slidev.ts
import { API_BASE_URL, UPLOADS_BASE_URL } from '@/utils/api';
import { ThemeDto } from '@/views/slides/process/dto';
import axios from 'axios';
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSlidevStore = defineStore('slidev', () => {
    // 存储主题列表
    const themes = ref<ThemeDto[]>([]);

    // 正在加载标识
    const loading = ref<boolean>(false);

    // 加载错误信息
    const error = ref<string | null>(null);

    /**
     * 获取所有可用主题
     * @returns 主题列表
     */
    const getThemes = async (): Promise<ThemeDto[]> => {
        // 如果数据已存在且不为空，直接返回
        if (themes.value.length > 0) {
            return themes.value;
        }

        // 标记为正在加载
        loading.value = true;
        error.value = null;

        try {
            const response = await axios.get<ThemeDto[]>(`${API_BASE_URL}/mcp/themes`);
            themes.value = response.data;

            return themes.value;
        } catch (err) {
            console.error('Failed to fetch themes:', err);
            error.value = 'Failed to load themes';
            return [];
        } finally {
            // 移除加载标记
            loading.value = false;
        }
    };

    /**
     * 清除主题数据缓存
     */
    const clearThemes = () => {
        themes.value = [];
    };

    /**
     * 强制刷新：忽略缓存重新获取主题列表
     */
    const refreshThemes = async (): Promise<ThemeDto[]> => {
        clearThemes();
        return await getThemes();
    };

    const getImageSsoUrl = (image: { imageUrl: string; imageName: string }) => {        
        return `${UPLOADS_BASE_URL}/theme-examples/${image.imageName}`;
    }

    return { 
        themes, 
        loading, 
        error,
        getThemes, 
        clearThemes, 
        refreshThemes,
        getImageSsoUrl
    };
});