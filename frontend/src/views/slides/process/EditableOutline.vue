<script setup lang="ts">
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { OutlineItem } from './dto';

const props = defineProps<{
  outlines: OutlineItem[]
}>();

const emit = defineEmits<{
  (e: 'update:outlines', outlines: OutlineItem[]): void
}>();

// 为每个大纲项添加原始索引的类型
interface ExtendedOutlineItem extends OutlineItem {
  originalIndex: number;
}

// 按group分组
const groupedOutlines = computed(() => {
  const groups: { [key: string]: ExtendedOutlineItem[] } = {};
  props.outlines.forEach((outline, index) => {
    if (!groups[outline.group]) {
      groups[outline.group] = [];
    }
    groups[outline.group].push({...outline, originalIndex: index});
  });
  return groups;
});

// 更新group
const updateGroup = (originalIndex: number, newGroup: string) => {
  const updatedOutlines = [...props.outlines];
  updatedOutlines[originalIndex].group = newGroup;
  emit('update:outlines', updatedOutlines);
};

// 更新content
const updateContent = (originalIndex: number, newContent: string) => {
  const updatedOutlines = [...props.outlines];
  updatedOutlines[originalIndex].content = newContent;
  emit('update:outlines', updatedOutlines);
};
</script>

<template>
  <div class="space-y-6">
    <div 
      v-for="(groupOutlines, group) in groupedOutlines" 
      :key="group"
      class="border rounded-lg p-4 dark:border-gray-600"
    >
      <div class="font-bold text-lg mb-3 bg-gray-100 dark:bg-gray-700 p-2 rounded">
        Group: {{ group }}
      </div>
      <div 
        v-for="outline in groupOutlines" 
        :key="outline.originalIndex"
        class="mb-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0"
      >
        <div class="mb-2">
          <label class="block text-sm font-medium mb-1">Group</label>
          <InputText 
            :model-value="outline.group" 
            @update:model-value="newGroup => updateGroup(outline.originalIndex, newGroup || '')"
            class="w-full"
            size="small"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Content</label>
          <Textarea 
            :model-value="outline.content" 
            @update:model-value="newContent => updateContent(outline.originalIndex, newContent)"
            class="w-full"
            rows="3"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 使用PrimeVue和TailwindCSS，尽量不写自定义CSS */
</style>