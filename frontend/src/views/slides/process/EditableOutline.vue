<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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

// 缓存每个 group 的本地输入值
const groupInputs = ref<Record<string, string>>({});

watch(groupedOutlines, (groups) => {
    Object.keys(groups).forEach(group => {
        if (!(group in groupInputs.value)) {
            groupInputs.value[group] = group
        }
    })
}, { immediate: true });

const handleGroupInput = (oldGroup: string, newGroup: string) => {
    groupInputs.value[oldGroup] = newGroup;
    updateGroupName(oldGroup, newGroup);
}

const expandedGroups = ref<Record<string, boolean>>({});

const initializeExpandedGroups = () => {
    Object.keys(groupedOutlines.value).forEach(group => {
        expandedGroups.value[group] = true;
    });
};

// 更新整个组名（一次性更新该组内所有 Outline 的 group 字段）
const updateGroupName = (oldGroup: string, newGroup: string) => {
    const updatedOutlines = props.outlines.map(o =>
        o.group === oldGroup ? { ...o, group: newGroup } : o
    );
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

const addOutlineAbove = (originalIndex: number, group: string) => {
    addOutline(originalIndex, group);
};
const addOutlineBelow = (originalIndex: number, group: string) => {
    addOutline(originalIndex + 1, group);
};

// 添加/删除组（保留原来的逻辑）
const addGroup = (referenceGroup: string, direction: 'above' | 'below') => {
    const updatedOutlines = [...props.outlines];
    const firstIndex = updatedOutlines.findIndex(o => o.group === referenceGroup);
    if (firstIndex === -1) return;
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
        toggleable
        :collapsed="!expandedGroups[group]"
        @update:collapsed="(val: boolean) => updateGroupExpanded(group.toString(), !val)"
    >

        <!-- header 槽：可编辑的 group 名称 -->
        <template #header>
            <div class="flex items-center justify-between w-full gap-2">
                <InputText v-model="groupInputs[group]"
                    @update:model-value="val => handleGroupInput(group.toString(), val || '')"
                    class="flex-grow max-w-[250px]" size="small"
                    @click.stop />
                <div class="flex gap-1">
                    <Button icon="pi pi-arrow-up" size="small" text :label="t('outline.add-group-above')"
                        @click.stop="addGroupAbove(group.toString())" />
                    <Button icon="pi pi-arrow-down" size="small" text :label="t('outline.add-group-below')"
                        @click.stop="addGroupBelow(group.toString())" />
                    <Button icon="pi pi-trash" size="small" text class="p-button-danger"
                        @click.stop="deleteGroup(group.toString())" />
                </div>
            </div>
        </template>


        <TransitionGroup name="outline-list" tag="div">
            <div v-for="outline in groupOutlines" :key="outline.originalIndex"
                class="mb-4 pt-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 outline-item">

                <!-- 只保留 content 编辑 -->
                <div>
                    <label class="block text-sm font-medium mb-1">{{ t('outline.panel.content') }}</label>
                    <Textarea :model-value="outline.content"
                        @update:model-value="newContent => updateContent(outline.originalIndex, newContent)"
                        class="w-full" rows="5" />
                </div>

                <div class="flex justify-between mt-2">
                    <div></div>
                    <div class="flex">
                        <Button :label="t('outline.add-above')" icon="pi pi-arrow-up" text size="small"
                            @click="addOutlineAbove(outline.originalIndex, outline.group)" />
                        <Button :label="t('outline.add-below')" icon="pi pi-arrow-down" text size="small"
                            @click="addOutlineBelow(outline.originalIndex, outline.group)" />
                        <Button icon="pi pi-trash" text size="small"
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