<template>
  <div class="knowledge-generator">
    <Card>
      <template #title>
        <div class="flex align-items-center gap-2">
          <i class="pi pi-sparkles"></i>
          {{ t('knowledge.generator.title') }}
        </div>
      </template>
      <template #content>
        <div class="generator-content">
          <div class="grid">
            <!-- 左侧：知识库选择和配置 -->
            <div class="col-12 md:col-4">
              <div class="p-4 border-1 border-round surface-border">
                <h4>{{ t('knowledge.generator.config.title') }}</h4>
                
                <!-- 知识库选择 -->
                <div class="field">
                  <label for="knowledgeSelect">{{ t('knowledge.generator.select.title') }}</label>
                  <MultiSelect
                    id="knowledgeSelect"
                    v-model="selectedKnowledge"
                    :options="knowledgeList"
                    optionLabel="title"
                    optionValue="id"
                    :placeholder="t('knowledge.generator.select.placeholder')"
                    class="w-full"
                    :maxSelectedLabels="3"
                  />
                  <small class="text-500">{{ t('knowledge.generator.select.hint') }}</small>
                </div>

                <!-- 生成主题 -->
                <div class="field">
                  <label for="topic">{{ t('knowledge.generator.topic.title') }}</label>
                  <InputText
                    id="topic"
                    v-model="generationTopic"
                    :placeholder="t('knowledge.generator.topic.placeholder')"
                    class="w-full"
                  />
                </div>

                <!-- 目标受众 -->
                <div class="field">
                  <label for="audience">{{ t('knowledge.generator.audience.title') }}</label>
                  <Dropdown
                    id="audience"
                    v-model="targetAudience"
                    :options="audienceOptions"
                    optionLabel="label"
                    optionValue="value"
                    :placeholder="t('knowledge.generator.audience.placeholder')"
                    class="w-full"
                  />
                </div>

                <!-- 幻灯片数量 -->
                <div class="field">
                  <label for="slideCount">{{ t('knowledge.generator.slides.count') }}</label>
                  <InputNumber
                    id="slideCount"
                    v-model="slideCount"
                    :min="5"
                    :max="50"
                    :step="1"
                    class="w-full"
                  />
                </div>

                <!-- 生成模式 -->
                <div class="field">
                  <label>{{ t('knowledge.generator.mode.title') }}</label>
                  <div class="flex flex-column gap-2 mt-2">
                    <div class="flex align-items-center">
                      <RadioButton
                        id="mode1"
                        v-model="generationMode"
                        name="mode"
                        value="comprehensive"
                      />
                      <label for="mode1" class="ml-2">{{ t('knowledge.generator.mode.comprehensive') }}</label>
                    </div>
                    <div class="flex align-items-center">
                      <RadioButton
                        id="mode2"
                        v-model="generationMode"
                        name="mode"
                        value="focused"
                      />
                      <label for="mode2" class="ml-2">{{ t('knowledge.generator.mode.focused') }}</label>
                    </div>
                    <div class="flex align-items-center">
                      <RadioButton
                        id="mode3"
                        v-model="generationMode"
                        name="mode"
                        value="summary"
                      />
                      <label for="mode3" class="ml-2">{{ t('knowledge.generator.mode.summary') }}</label>
                    </div>
                  </div>
                </div>

                <!-- 生成按钮 -->
                <div class="field">
                  <Button
                    :label="t('knowledge.generator.generate.button')"
                    icon="pi pi-sparkles"
                    @click="generateSlides"
                    :loading="generating"
                    :disabled="!canGenerate"
                    class="w-full p-button-success"
                  />
                </div>
              </div>
            </div>

            <!-- 右侧：预览和结果 -->
            <div class="col-12 md:col-8">
              <div class="p-4 border-1 border-round surface-border">
                <div class="flex justify-content-between align-items-center mb-3">
                  <h4>{{ t('knowledge.generator.preview.title') }}</h4>
                  <div class="flex gap-2" v-if="generatedSlides.length > 0">
                    <Button
                      :label="t('knowledge.generator.download.button')"
                      icon="pi pi-download"
                      @click="downloadSlides"
                      class="p-button-secondary p-button-sm"
                    />
                    <Button
                      :label="t('knowledge.generator.save.button')"
                      icon="pi pi-save"
                      @click="saveSlides"
                      :loading="saving"
                      class="p-button-primary p-button-sm"
                    />
                  </div>
                </div>

                <!-- 生成中状态 -->
                <div v-if="generating" class="text-center py-8">
                  <ProgressSpinner />
                  <p class="mt-3 text-500">{{ t('knowledge.generator.generating.message') }}</p>
                  <small class="text-400">{{ t('knowledge.generator.generating.hint') }}</small>
                </div>

                <!-- 生成结果 -->
                <div v-else-if="generatedSlides.length > 0" class="slides-preview">
                  <div class="flex justify-content-between align-items-center mb-3">
                    <span class="text-500">{{ t('knowledge.generator.slides.total') }}: {{ generatedSlides.length }}</span>
                    <div class="flex align-items-center gap-2">
                      <Button
                        icon="pi pi-chevron-left"
                        @click="previousSlide"
                        :disabled="currentSlideIndex === 0"
                        class="p-button-text p-button-sm"
                      />
                      <span class="text-sm">{{ currentSlideIndex + 1 }} / {{ generatedSlides.length }}</span>
                      <Button
                        icon="pi pi-chevron-right"
                        @click="nextSlide"
                        :disabled="currentSlideIndex === generatedSlides.length - 1"
                        class="p-button-text p-button-sm"
                      />
                    </div>
                  </div>

                  <Card v-if="currentSlide" class="slide-card">
                    <template #title>
                      <div class="flex justify-content-between align-items-center">
                        <span>{{ currentSlide.title }}</span>
                        <Button
                          icon="pi pi-pencil"
                          @click="editSlide(currentSlideIndex)"
                          class="p-button-text p-button-sm"
                          :title="t('knowledge.generator.edit.tooltip')"
                        />
                      </div>
                    </template>
                    <template #content>
                      <div class="slide-content">
                        <pre class="whitespace-pre-wrap">{{ currentSlide.content }}</pre>
                      </div>
                    </template>
                  </Card>
                </div>

                <!-- 空状态 -->
                <div v-else class="text-center py-8">
                  <i class="pi pi-sparkles text-6xl text-300"></i>
                  <p class="mt-3 text-500">{{ t('knowledge.generator.empty.message') }}</p>
                  <small class="text-400">{{ t('knowledge.generator.empty.hint') }}</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </Card>

    <!-- 编辑幻灯片对话框 -->
    <Dialog
      v-model:visible="showEditDialog"
      :header="t('knowledge.generator.edit.title')"
      :style="{ width: '70vw' }"
      :modal="true"
    >
      <div v-if="editingSlide" class="edit-content">
        <div class="field">
          <label for="slideTitle">{{ t('knowledge.generator.edit.title.label') }}</label>
          <InputText
            id="slideTitle"
            v-model="editingSlide.title"
            class="w-full"
          />
        </div>
        
        <div class="field">
          <label for="slideContent">{{ t('knowledge.generator.edit.content.label') }}</label>
          <Textarea
            id="slideContent"
            v-model="editingSlide.content"
            :rows="15"
            class="w-full"
          />
        </div>
        
        <div class="flex justify-content-end gap-2 mt-3">
          <Button
            :label="t('common.cancel')"
            @click="cancelEdit"
            class="p-button-secondary"
          />
          <Button
            :label="t('common.save')"
            @click="saveEdit"
            class="p-button-primary"
          />
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { t } from '@/i18n/index';
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import MultiSelect from 'primevue/multiselect';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import InputNumber from 'primevue/inputnumber';
import RadioButton from 'primevue/radiobutton';
import ProgressSpinner from 'primevue/progressspinner';
import Dialog from 'primevue/dialog';
import Textarea from 'primevue/textarea';
import { knowledgeApi } from '@/api/knowledge';

// 响应式数据
const knowledgeList = ref([]);
const selectedKnowledge = ref([]);
const generationTopic = ref('');
const targetAudience = ref('general');
const slideCount = ref(10);
const generationMode = ref('comprehensive');
const generating = ref(false);
const saving = ref(false);
const generatedSlides = ref([]);
const currentSlideIndex = ref(0);
const showEditDialog = ref(false);
const editingSlide = ref(null);
const editingIndex = ref(-1);

const toast = useToast();

// 计算属性
const canGenerate = computed(() => {
  return selectedKnowledge.value.length > 0 && generationTopic.value.trim().length > 0;
});

const currentSlide = computed(() => {
  return generatedSlides.value[currentSlideIndex.value] || null;
});

// 配置选项
const audienceOptions = ref([
  { label: t('knowledge.generator.audience.general'), value: 'general' },
  { label: t('knowledge.generator.audience.technical'), value: 'technical' },
  { label: t('knowledge.generator.audience.business'), value: 'business' },
  { label: t('knowledge.generator.audience.academic'), value: 'academic' },
  { label: t('knowledge.generator.audience.students'), value: 'students' }
]);

// 生命周期
onMounted(() => {
  loadKnowledgeList();
});

// 方法
const loadKnowledgeList = async () => {
  try {
    const response = await knowledgeApi.getList();
    knowledgeList.value = response.data;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.load.error'),
      life: 3000
    });
  }
};

const generateSlides = async () => {
  if (!canGenerate.value) return;

  generating.value = true;
  try {
    const response = await knowledgeApi.generateSlides({
      knowledgeIds: selectedKnowledge.value,
      topic: generationTopic.value,
      audience: targetAudience.value,
      slideCount: slideCount.value,
      mode: generationMode.value
    });
    
    generatedSlides.value = response.data.slides;
    currentSlideIndex.value = 0;
    
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.generator.generate.success'),
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.generator.generate.error'),
      life: 3000
    });
  } finally {
    generating.value = false;
  }
};

const previousSlide = () => {
  if (currentSlideIndex.value > 0) {
    currentSlideIndex.value--;
  }
};

const nextSlide = () => {
  if (currentSlideIndex.value < generatedSlides.value.length - 1) {
    currentSlideIndex.value++;
  }
};

const editSlide = (index: number) => {
  editingIndex.value = index;
  editingSlide.value = { ...generatedSlides.value[index] };
  showEditDialog.value = true;
};

const saveEdit = () => {
  if (editingIndex.value >= 0 && editingSlide.value) {
    generatedSlides.value[editingIndex.value] = { ...editingSlide.value };
    showEditDialog.value = false;
    editingSlide.value = null;
    editingIndex.value = -1;
    
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.generator.edit.success'),
      life: 3000
    });
  }
};

const cancelEdit = () => {
  showEditDialog.value = false;
  editingSlide.value = null;
  editingIndex.value = -1;
};

const downloadSlides = () => {
  const slidesContent = generatedSlides.value
    .map((slide, index) => `---
# ${slide.title}

${slide.content}
`)
    .join('\n');
    
  const blob = new Blob([slidesContent], { type: 'text/markdown' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${generationTopic.value.replace(/\s+/g, '_')}_slides.md`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  
  toast.add({
    severity: 'success',
    summary: t('success.title'),
    detail: t('knowledge.generator.download.success'),
    life: 3000
  });
};

const saveSlides = async () => {
  saving.value = true;
  try {
    const slidesData = {
      title: generationTopic.value,
      audience: targetAudience.value,
      slides: generatedSlides.value,
      knowledgeIds: selectedKnowledge.value
    };
    
    await knowledgeApi.saveSlides(slidesData);
    
    toast.add({
      severity: 'success',
      summary: t('success.title'),
      detail: t('knowledge.generator.save.success'),
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('error.title'),
      detail: t('knowledge.generator.save.error'),
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.knowledge-generator {
  padding: 1rem;
}

.generator-content {
  min-height: 600px;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.slides-preview {
  min-height: 400px;
}

.slide-card {
  min-height: 300px;
}

.slide-content {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.edit-content {
  padding: 1rem;
}

:deep(.p-multiselect-label) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.p-progressspinner) {
  width: 3rem;
  height: 3rem;
}
</style>