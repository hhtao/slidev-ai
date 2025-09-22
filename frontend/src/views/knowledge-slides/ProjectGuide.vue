<template>
    <Dialog 
        :visible="visible" 
        @update:visible="(value) => emit('update:visible', value)"
        modal 
        header="项目引导助手"
        :style="{ width: '80vw', maxWidth: '900px' }"
        :closable="false"
    >
        <div class="project-guide">
            <!-- 步骤指示器 -->
            <div class="steps-indicator mb-6">
                <div class="flex justify-content-between">
                    <div 
                        v-for="(step, index) in steps" 
                        :key="index"
                        class="step-item flex flex-column align-items-center"
                        :class="{ 
                            'active': index === currentStep, 
                            'completed': index < currentStep,
                            'disabled': index > currentStep 
                        }"
                    >
                        <div class="step-circle">
                            <i v-if="index < currentStep" class="pi pi-check"></i>
                            <span v-else>{{ index + 1 }}</span>
                        </div>
                        <span class="step-label mt-2">{{ step.title }}</span>
                    </div>
                </div>
            </div>

            <!-- 步骤内容 -->
            <div class="step-content">
                <!-- 步骤1: 生成内容 -->
                <div v-if="currentStep === 0" class="generate-content-step">
                    <div class="text-center mb-4">
                        <i class="pi pi-lightbulb text-6xl text-yellow-500 mb-3"></i>
                        <h3>生成Slidev内容</h3>
                        <p class="text-gray-600">基于知识库为您的项目生成专业的演示文稿内容</p>
                    </div>
                    
                    <Card>
                        <template #content>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="feature-item">
                                    <div class="flex align-items-center gap-3 mb-2">
                                        <i class="pi pi-database text-blue-500"></i>
                                        <strong>智能检索</strong>
                                    </div>
                                    <p class="text-sm text-gray-600">从知识库中智能检索相关内容，确保演示文稿内容准确专业</p>
                                </div>
                                <div class="feature-item">
                                    <div class="flex align-items-center gap-3 mb-2">
                                        <i class="pi pi-cog text-green-500"></i>
                                        <strong>自动生成</strong>
                                    </div>
                                    <p class="text-sm text-gray-600">自动生成结构化大纲和Slidev格式的演示文稿内容</p>
                                </div>
                                <div class="feature-item">
                                    <div class="flex align-items-center gap-3 mb-2">
                                        <i class="pi pi-palette text-purple-500"></i>
                                        <strong>主题定制</strong>
                                    </div>
                                    <p class="text-sm text-gray-600">支持多种精美主题，打造专业的视觉效果</p>
                                </div>
                                <div class="feature-item">
                                    <div class="flex align-items-center gap-3 mb-2">
                                        <i class="pi pi-file-edit text-orange-500"></i>
                                        <strong>可编辑</strong>
                                    </div>
                                    <p class="text-sm text-gray-600">生成后可随时编辑和调整内容，满足个性化需求</p>
                                </div>
                            </div>
                        </template>
                    </Card>

                    <div class="text-center mt-4">
                        <Message severity="info">
                            <p>点击"开始生成"将跳转到知识库生成流程，完成后请返回继续后续步骤</p>
                        </Message>
                    </div>
                </div>

                <!-- 步骤2: 构建项目 -->
                <div v-else-if="currentStep === 1" class="build-project-step">
                    <div class="text-center mb-4">
                        <i class="pi pi-cog text-6xl text-blue-500 mb-3"></i>
                        <h3>构建静态站点</h3>
                        <p class="text-gray-600">将您的Slidev项目构建为可部署的静态网站</p>
                    </div>

                    <Card>
                        <template #content>
                            <div v-if="!building" class="build-ready">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div class="build-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-server text-blue-500"></i>
                                            <strong>静态生成</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">生成完全静态的HTML文件，无需服务器即可运行</p>
                                    </div>
                                    <div class="build-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-mobile text-green-500"></i>
                                            <strong>响应式设计</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">自适应各种设备屏幕，支持移动端浏览</p>
                                    </div>
                                    <div class="build-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-globe text-purple-500"></i>
                                            <strong>CDN友好</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">优化的资源结构，适合CDN部署和加速</p>
                                    </div>
                                    <div class="build-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-shield text-orange-500"></i>
                                            <strong>安全可靠</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">纯静态文件，无安全漏洞风险</p>
                                    </div>
                                </div>
                            </div>

                            <div v-else class="build-progress">
                                <div class="text-center mb-4">
                                    <ProgressSpinner />
                                    <h4 class="mt-3">正在构建项目...</h4>
                                    <p class="text-gray-600">请稍候，构建过程可能需要几分钟时间</p>
                                </div>

                                <div class="build-logs max-h-20rem overflow-y-auto border-1 border-gray-300 border-round p-3 bg-gray-50">
                                    <div 
                                        v-for="(message, index) in buildMessages" 
                                        :key="index"
                                        class="build-message mb-2"
                                        :class="`message-${message.type}`"
                                    >
                                        <i 
                                            :class="{
                                                'pi pi-info-circle text-blue-500': message.type === 'info',
                                                'pi pi-cog text-orange-500': message.type === 'build_progress',
                                                'pi pi-check-circle text-green-500': message.type === 'build_success',
                                                'pi pi-times-circle text-red-500': message.type === 'build_error'
                                            }"
                                        ></i>
                                        <span class="ml-2">{{ message.message }}</span>
                                        <small class="text-gray-500 ml-2">
                                            {{ new Date(message.timestamp).toLocaleTimeString() }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>

                <!-- 步骤3: 在线预览 -->
                <div v-else-if="currentStep === 2" class="preview-step">
                    <div class="text-center mb-4">
                        <i class="pi pi-eye text-6xl text-green-500 mb-3"></i>
                        <h3>在线预览</h3>
                        <p class="text-gray-600">启动预览服务，实时查看您的演示文稿效果</p>
                    </div>

                    <Card>
                        <template #content>
                            <div v-if="!previewing" class="preview-ready">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div class="preview-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-play text-green-500"></i>
                                            <strong>实时预览</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">即时查看演示文稿效果，支持全屏演示模式</p>
                                    </div>
                                    <div class="preview-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-arrows-alt text-blue-500"></i>
                                            <strong>交互控制</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">支持键盘快捷键，鼠标控制和触摸操作</p>
                                    </div>
                                    <div class="preview-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-share-alt text-purple-500"></i>
                                            <strong>分享链接</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">生成分享链接，方便与他人共享演示文稿</p>
                                    </div>
                                    <div class="preview-feature">
                                        <div class="flex align-items-center gap-3 mb-2">
                                            <i class="pi pi-download text-orange-500"></i>
                                            <strong>导出功能</strong>
                                        </div>
                                        <p class="text-sm text-gray-600">支持导出为PDF、PNG等多种格式</p>
                                    </div>
                                </div>
                            </div>

                            <div v-if="previewUrl" class="preview-ready mt-4">
                                <div class="border-1 border-gray-300 border-round p-3 bg-blue-50">
                                    <div class="flex align-items-center gap-3">
                                        <i class="pi pi-external-link text-blue-500"></i>
                                        <div class="flex-1">
                                            <strong>预览地址:</strong>
                                            <a :href="previewUrl" target="_blank" class="ml-2 text-blue-600 hover:text-blue-800">
                                                {{ previewUrl }}
                                            </a>
                                        </div>
                                        <Button 
                                            icon="pi pi-external-link" 
                                            label="打开预览"
                                            @click="openPreview"
                                            size="small"
                                        />
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Card>
                </div>
            </div>

            <!-- 操作按钮 -->
            <div class="flex justify-content-between mt-6">
                <Button 
                    label="上一步" 
                    icon="pi pi-chevron-left"
                    @click="previousStep"
                    outlined
                    :disabled="currentStep === 0"
                />
                
                <div class="flex gap-2">
                    <Button 
                        v-if="currentStep === 0"
                        label="开始生成" 
                        icon="pi pi-play"
                        @click="startGeneration"
                        class="p-button-success"
                    />
                    
                    <Button 
                        v-else-if="currentStep === 1"
                        label="开始构建" 
                        icon="pi pi-cog"
                        @click="buildProject"
                        :loading="building"
                        :disabled="!hasContent"
                        class="p-button-info"
                    />
                    
                    <Button 
                        v-else-if="currentStep === 2"
                        label="启动预览" 
                        icon="pi pi-eye"
                        @click="startPreview"
                        :loading="previewing"
                        :disabled="!isBuilt"
                        class="p-button-warning"
                    />
                    
                    <Button 
                        label="完成" 
                        icon="pi pi-check"
                        @click="complete"
                        v-if="currentStep === 2 && previewUrl"
                        class="p-button-success"
                    />
                    
                    <Button 
                        label="下一步" 
                        icon="pi pi-chevron-right"
                        icon-pos="right"
                        @click="nextStep"
                        :disabled="!canProceed"
                        v-if="currentStep < 2"
                    />
                </div>
            </div>
        </div>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';

// PrimeVue 组件
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';

import { knowledgeSlidevApi, type KnowledgeSlidevProject } from '@/api/knowledge-slidev';

interface Props {
    visible: boolean;
    project: KnowledgeSlidevProject;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'update', project: KnowledgeSlidevProject): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const router = useRouter();
const toast = useToast();

// 状态管理
const currentStep = ref(0);
const building = ref(false);
const previewing = ref(false);
const buildMessages = ref<Array<{ type: string; message: string; timestamp: number }>>([]);
const previewUrl = ref('');

// 步骤定义
const steps = [
    { title: '生成内容', icon: 'pi pi-lightbulb' },
    { title: '构建项目', icon: 'pi pi-cog' },
    { title: '在线预览', icon: 'pi pi-eye' }
];

// 计算属性
const hasContent = computed(() => {
    return !!(props.project.content && props.project.content.trim());
});

const isBuilt = computed(() => {
    return !!(props.project.buildPath);
});

const canProceed = computed(() => {
    switch (currentStep.value) {
        case 0:
            return hasContent.value;
        case 1:
            return isBuilt.value;
        case 2:
            return !!previewUrl.value;
        default:
            return false;
    }
});

// 监听项目变化，自动调整步骤
watch(() => props.project, (newProject) => {
    if (newProject) {
        // 根据项目状态自动定位到合适的步骤
        if (!hasContent.value) {
            currentStep.value = 0;
        } else if (!isBuilt.value) {
            currentStep.value = 1;
        } else {
            currentStep.value = 2;
        }
    }
}, { immediate: true });

// 步骤导航
const nextStep = () => {
    if (currentStep.value < steps.length - 1) {
        currentStep.value++;
    }
};

const previousStep = () => {
    if (currentStep.value > 0) {
        currentStep.value--;
    }
};

// 开始生成内容
const startGeneration = () => {
    // 跳转到知识库生成流程
    router.push({
        path: '/knowledge-slides/process',
        query: { 
            stage: 'config',
            projectId: props.project.id,
            title: props.project.title
        }
    });
    emit('update:visible', false);
};

// 构建项目
const buildProject = async () => {
    building.value = true;
    buildMessages.value = [];
    
    const eventSource = knowledgeSlidevApi.buildProject(
        props.project.id,
        (data) => {
            buildMessages.value.push({
                type: data.type || 'info',
                message: data.message || '处理中...',
                timestamp: Date.now()
            });

            if (data.type === 'build_success') {
                building.value = false;
                toast.add({
                    severity: 'success',
                    summary: '构建完成',
                    detail: '项目已成功构建为静态网站'
                });
                
                // 更新项目信息
                emit('update', { ...props.project, buildPath: data.data?.buildPath || 'built' });
                
                // 自动进入下一步
                setTimeout(() => {
                    nextStep();
                }, 1000);
            } else if (data.type === 'build_error') {
                building.value = false;
                toast.add({
                    severity: 'error',
                    summary: '构建失败',
                    detail: data.error || '构建过程中发生错误'
                });
            }
        },
        (error) => {
            building.value = false;
            toast.add({
                severity: 'error',
                summary: '构建出错',
                detail: '构建过程中发生网络错误'
            });
        }
    );
};

// 启动预览
const startPreview = async () => {
    previewing.value = true;
    
    try {
        const result = await knowledgeSlidevApi.getPreviewPort(props.project.id);
        if (result.success) {
            previewUrl.value = result.data.url;
            toast.add({
                severity: 'success',
                summary: '预览就绪',
                detail: 'Slidev预览服务已启动'
            });
        } else {
            toast.add({
                severity: 'error',
                summary: '预览失败',
                detail: result.error
            });
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '预览失败',
            detail: error.message
        });
    } finally {
        previewing.value = false;
    }
};

// 打开预览
const openPreview = () => {
    if (previewUrl.value) {
        window.open(previewUrl.value, '_blank');
    }
};

// 完成引导
const complete = () => {
    toast.add({
        severity: 'success',
        summary: '引导完成',
        detail: '恭喜！您的Slidev项目已经准备就绪'
    });
    emit('update:visible', false);
};
</script>

<style scoped>
.project-guide {
    min-height: 400px;
}

.steps-indicator {
    border-bottom: 1px solid #e9ecef;
    padding-bottom: 1rem;
}

.step-item {
    flex: 1;
    position: relative;
}

.step-item:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 15px;
    left: 50%;
    right: -50%;
    height: 2px;
    background: #e9ecef;
    z-index: 0;
}

.step-item.completed:not(:last-child)::after {
    background: #28a745;
}

.step-circle {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #e9ecef;
    color: #6c757d;
    font-size: 12px;
    font-weight: bold;
    position: relative;
    z-index: 1;
}

.step-item.active .step-circle {
    background: #007bff;
    color: white;
}

.step-item.completed .step-circle {
    background: #28a745;
    color: white;
}

.step-label {
    font-size: 12px;
    color: #6c757d;
    text-align: center;
}

.step-item.active .step-label {
    color: #007bff;
    font-weight: bold;
}

.step-item.completed .step-label {
    color: #28a745;
}

.step-content {
    min-height: 300px;
    padding: 2rem 0;
}

.feature-item, .build-feature, .preview-feature {
    padding: 1rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    height: 100%;
}

.build-logs {
    font-family: 'Courier New', monospace;
    font-size: 12px;
}

.build-message {
    display: flex;
    align-items: center;
}

.message-build_success {
    color: #28a745;
}

.message-build_error {
    color: #dc3545;
}

.message-build_progress {
    color: #fd7e14;
}
</style>