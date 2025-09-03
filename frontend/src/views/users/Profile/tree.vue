<script setup lang="ts">
import Card from 'primevue/card';

import { t } from '@/i18n';

const props = defineProps<{
    nodes: { id: number; label: string; x: number; y: number; desc: string }[]
    edges: number[][]
    selectedDescription: string | null
}>()

const selectedNode = defineModel('selectedNode');
</script>

<template>
    <Card>
        <template #title>
            <div class="text-xl font-semibold">{{ t('express-ego') }}</div>
            <div v-if="props.selectedDescription" class="mt-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ props.selectedDescription }}
            </div>
        </template>

        <template #content>
            <div class="relative w-full h-[600px]">
                <svg viewBox="0 0 400 700" class="w-full h-full">
                    <!-- edges -->
                    <line v-for="(edge, index) in props.edges" :key="index" :x1="props.nodes.find(n => n.id === edge[0])!.x * 100"
                        :y1="props.nodes.find(n => n.id === edge[0])!.y * 80" :x2="props.nodes.find(n => n.id === edge[1])!.x * 100"
                        :y2="props.nodes.find(n => n.id === edge[1])!.y * 80" class="stroke-gray-400 dark:stroke-gray-600"
                        stroke-width="2" />

                    <!-- nodes -->
                    <g v-for="node in props.nodes" :key="node.id" @click="$emit('update:selectedNode', node.id)"
                        class="cursor-pointer transition kaba-node">
                        <circle :cx="node.x * 100" :cy="node.y * 80" r="30" :class="[
                            'transition-colors',
                            selectedNode === node.id
                                ? 'fill-primary dark:fill-primary-600 stroke-primary-500'
                                : 'fill-white dark:fill-surface-800 stroke-surface-400 dark:stroke-surface-500 hover:fill-surface-100 dark:hover:fill-primary-900'
                        ]" stroke-width="3" />
                        <text :x="node.x * 100" :y="node.y * 80 + 5" text-anchor="middle"
                            class="select-none text-sm font-medium fill-primary-700 dark:fill-primary-200">
                            {{ node.label }}
                        </text>
                    </g>
                </svg>
            </div>
        </template>
    </Card>
</template>
