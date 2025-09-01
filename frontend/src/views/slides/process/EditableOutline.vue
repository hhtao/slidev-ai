<script setup lang="ts">
import { ref, computed } from 'vue';
import { t } from '@/i18n/index';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Button from 'primevue/button';
import { OutlineItem } from './dto';

const props = defineProps<{
    outlines: OutlineItem[]
}>();

const emit = defineEmits<{
    (e: 'update:outlines', outlines: OutlineItem[]): void;
    (e: 'collapse-all'): void;
}>();

interface ExtendedOutlineItem extends OutlineItem {
    originalIndex: number;
}

const groupedOutlines = computed(() => {
    const groups: { [key: string]: ExtendedOutlineItem[] } = {};
    props.outlines.forEach((outline, index) => {
        if (!groups[outline.group]) {
            groups[outline.group] = [];
        }
        groups[outline.group].push({ ...outline, originalIndex: index });
    });
    return groups;
});

const expandedGroups = ref<Record<string, boolean>>({});

const initializeExpandedGroups = () => {
    Object.keys(groupedOutlines.value).forEach(group => {
        expandedGroups.value[group] = true;
    });
};

const updateGroup = (originalIndex: number, newGroup: string) => {
    const updatedOutlines = [...props.outlines];
    updatedOutlines[originalIndex].group = newGroup;
    emit('update:outlines', updatedOutlines);
};

const updateContent = (originalIndex: number, newContent: string) => {
    const updatedOutlines = [...props.outlines];
    updatedOutlines[originalIndex].content = newContent;
    emit('update:outlines', updatedOutlines);
};

const deleteOutline = (originalIndex: number) => {
    const updatedOutlines = [...props.outlines];
    updatedOutlines.splice(originalIndex, 1);
    emit('update:outlines', updatedOutlines);
};

const addOutline = (position: number, group: string) => {
    const updatedOutlines = [...props.outlines];
    updatedOutlines.splice(position, 0, {
        group,
        content: ''
    });
    emit('update:outlines', updatedOutlines);
    expandAll();
};

// 在组内某一项上方添加
const addOutlineAbove = (originalIndex: number, group: string) => {
    addOutline(originalIndex, group);
};

// 在组内某一项下方添加
const addOutlineBelow = (originalIndex: number, group: string) => {
    addOutline(originalIndex + 1, group);
};

// 添加组（上方或下方）
const addGroup = (referenceGroup: string, direction: 'above' | 'below') => {
    const updatedOutlines = [...props.outlines];
    // 找到当前组在 outlines 中的第一个元素位置
    const firstIndex = updatedOutlines.findIndex(o => o.group === referenceGroup);
    if (firstIndex === -1) return;

    // 新组名称（可以用时间戳避免冲突）
    const newGroupName = t('outline.default-group') + '-' + Date.now();

    const insertIndex = direction === 'above' ? firstIndex : firstIndex + groupedOutlines.value[referenceGroup].length;

    updatedOutlines.splice(insertIndex, 0, {
        group: newGroupName,
        content: ''
    });

    emit('update:outlines', updatedOutlines);
    expandAll();
};

const addGroupAbove = (group: string) => addGroup(group, 'above');
const addGroupBelow = (group: string) => addGroup(group, 'below');

// 删除整个组
const deleteGroup = (group: string) => {
    const updatedOutlines = props.outlines.filter(o => o.group !== group);
    emit('update:outlines', updatedOutlines);
};

const collapseAll = () => {
    Object.keys(expandedGroups.value).forEach(group => {
        expandedGroups.value[group] = false;
    });
    emit('collapse-all');
};

const expandAll = () => {
    Object.keys(expandedGroups.value).forEach(group => {
        expandedGroups.value[group] = true;
    });
};

const updateGroupExpanded = (group: string, expanded: boolean) => {
    expandedGroups.value[group] = expanded;
};

const updateExpandedGroups = () => {
    const newExpandedGroups: Record<string, boolean> = {};
    Object.keys(groupedOutlines.value).forEach(group => {
        newExpandedGroups[group] = expandedGroups.value[group] ?? true;
    });
    expandedGroups.value = newExpandedGroups;
};

computed(() => {
    updateExpandedGroups();
});

initializeExpandedGroups();

defineExpose({
    collapseAll, expandAll
});
</script>

<template>
    <Panel v-for="(groupOutlines, group) in groupedOutlines" :key="group"
        :header="t('outline.panel.group-header', String(group))" toggleable :collapsed="!expandedGroups[group]"
        @update:collapsed="(val: boolean) => updateGroupExpanded(group.toString(), !val)">

        <!-- group 操作按钮 -->
        <template #icons>
            <Button icon="pi pi-arrow-up" size="small" text
                :title="t('outline.add-group-above')"
                @click.stop="addGroupAbove(group.toString())" />
            <Button icon="pi pi-arrow-down" size="small" text
                :title="t('outline.add-group-below')"
                @click.stop="addGroupBelow(group.toString())" />
            <Button icon="pi pi-trash" size="small" text class="p-button-danger"
                @click.stop="deleteGroup(group.toString())" />
        </template>

        <TransitionGroup name="outline-list" tag="div">
            <div v-for="outline in groupOutlines" :key="outline.originalIndex"
                class="mb-4 p-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0 outline-item">
                <div class="mb-2">
                    <label class="block text-sm font-medium mb-1">{{ t('outline.panel.group') }}</label>
                    <InputText :model-value="outline.group"
                        @update:model-value="newGroup => updateGroup(outline.originalIndex, newGroup || '')"
                        class="w-full" size="small" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-1">{{ t('outline.panel.content') }}</label>
                    <Textarea :model-value="outline.content"
                        @update:model-value="newContent => updateContent(outline.originalIndex, newContent)"
                        class="w-full" rows="3" />
                </div>
                <div class="flex justify-between mt-2">
                    <div></div>
                    <div class="flex">
                        <Button :label="t('outline.add-above')" icon="pi pi-arrow-up" text size="small"
                            @click="addOutlineAbove(outline.originalIndex, outline.group)" />
                        <Button :label="t('outline.add-below')" icon="pi pi-arrow-down" text size="small"
                            @click="addOutlineBelow(outline.originalIndex, outline.group)" />
                        <Button :label="t('outline.delete-item')" icon="pi pi-trash" text size="small"
                            @click="deleteOutline(outline.originalIndex)" class="p-button-danger" />
                    </div>
                </div>
            </div>
        </TransitionGroup>
    </Panel>
</template>


<style scoped>
/* .outline-list-move,
.outline-list-enter-active,
.outline-list-leave-active {
  transition: all 0.35s ease-in-out;
}

.outline-list-enter-from,
.outline-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.outline-list-leave-active {
  position: absolute;
} */
</style>