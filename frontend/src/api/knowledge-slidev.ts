import http from './http';
import type { Result } from './base';

export interface KnowledgeSlidevProject {
    id: string;
    name: string;
    title: string;
    content: string;
    slides_path: string;
    theme: string;
    status: 'generating' | 'ready' | 'error';
    createdAt: string;
    updatedAt: string;
    previewPort?: number;
    buildPath?: string;
    convertedToPublic?: boolean;
    convertedAt?: string;
    publicSlideId?: number;
    publicUrl?: string;
}

export interface CreateSlidevProjectRequest {
    title: string;
    content: string;
    theme?: string;
}

export interface UpdateSlidevProjectRequest {
    content: string;
    title?: string;
}

export interface ExportSlidevRequest {
    format: 'pdf' | 'pptx' | 'png';
    theme?: string;
    dark?: boolean;
    withClicks?: boolean;
    width?: number;
    height?: number;
}

export interface ConvertToPublicRequest {
    title?: string;
    description?: string;
    visibility?: 'public' | 'private';
}

export interface ConvertToPublicResult {
    slideId: number;
    publicUrl: string;
    success: boolean;
    message: string;
}

export interface BuildStatus {
    built: boolean;
    buildPath?: string;
    buildTime?: string;
}

class KnowledgeSlidevApi {
    /**
     * 创建Slidev项目
     */
    async createProject(data: CreateSlidevProjectRequest): Promise<Result<KnowledgeSlidevProject>> {
        try {
            const response = await http.post('/knowledge-slides/create-project', data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.message || error.message
            };
        }
    }

    /**
     * 获取项目信息
     */
    async getProject(id: string): Promise<Result<KnowledgeSlidevProject>> {
        try {
            const response = await http.get(`/knowledge-slides/project/${id}`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 更新项目内容
     */
    async updateProject(id: string, data: UpdateSlidevProjectRequest): Promise<Result<KnowledgeSlidevProject>> {
        try {
            const response = await http.post(`/knowledge-slides/project/${id}/update`, data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 获取预览端口
     */
    async getPreviewPort(id: string): Promise<Result<{ port: number; url: string }>> {
        try {
            const response = await http.get(`/knowledge-slides/project/${id}/preview-port`);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 构建项目 (使用SSE)
     */
    buildProject(id: string, onMessage: (data: any) => void, onError?: (error: any) => void): EventSource {
        const eventSource = new EventSource(`/api/knowledge-slides/project/${id}/build`, {
            withCredentials: true
        });

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                onMessage(data);
            } catch (error) {
                console.error('Failed to parse SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            if (onError) {
                onError(error);
            }
        };

        return eventSource;
    }

    /**
     * 导出项目
     */
    async exportProject(id: string, options: ExportSlidevRequest): Promise<Result<{ exportPath: string | string[] }>> {
        try {
            const response = await http.post(`/knowledge-slides/project/${id}/export`, options);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 下载导出文件
     */
    async downloadFile(id: string, filename: string): Promise<void> {
        try {
            const response = await http.get(`/knowledge-slides/project/${id}/download/${filename}`, {
                responseType: 'blob'
            });

            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            throw new Error(error.response?.data?.error || error.message);
        }
    }

    /**
     * 获取项目列表
     */
    async getProjectList(): Promise<Result<KnowledgeSlidevProject[]>> {
        try {
            const response = await http.get('/knowledge-slides/projects');
            return {
                success: response.data.success,
                data: response.data.data || []
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 删除项目
     */
    async deleteProject(id: string): Promise<Result<void>> {
        try {
            const response = await http.delete(`/knowledge-slides/project/${id}`);
            return {
                success: response.data.success,
                data: undefined,
                message: response.data.message
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 转化为公开幻灯片
     */
    async convertToPublicSlide(id: string, data: ConvertToPublicRequest): Promise<Result<ConvertToPublicResult>> {
        try {
            const url = `/knowledge-slides/project/${id}/convert-to-public`;
            console.log('调用转化API, URL:', url, '数据:', data);
            const response = await http.post(url, data);
            console.log('转化API响应:', response.data);
            return {
                success: response.data.success,
                data: response.data.data,
                message: response.data.message
            };
        } catch (error: any) {
            console.error('转化API错误:', error);
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 获取构建状态
     */
    async getBuildStatus(id: string): Promise<Result<BuildStatus>> {
        try {
            const response = await http.get(`/knowledge-slides/project/${id}/build-status`);
            return {
                success: response.data.success,
                data: response.data.data
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || error.message
            };
        }
    }

    /**
     * 获取预览URL
     */
    getPreviewUrl(id: string, path: string = ''): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/knowledge-slides/preview/${id}/${path}`;
    }

    /**
     * 获取下载URL
     */
    getDownloadUrl(id: string, filename: string): string {
        const baseUrl = window.location.origin;
        return `${baseUrl}/api/knowledge-slides/project/${id}/download/${filename}`;
    }
}

export const knowledgeSlidevApi = new KnowledgeSlidevApi();
export default knowledgeSlidevApi;