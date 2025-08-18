<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/auth'
import FormCard from './form.vue'
import TreeCard from './tree.vue'
import SlidesCard from './slides.vue';
import type { UserDTO } from '@/api/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 用户相关
const routeUserId = computed(() => route.params.userId as string | undefined)
const selfUser = computed(() => authStore.user)
const viewingUser = ref<UserDTO | null>(null)
const isSelf = computed(
    () => !routeUserId.value || (selfUser.value && String(selfUser.value.id) === String(routeUserId.value))
)
const user = computed(() => (isSelf.value ? selfUser.value : viewingUser.value))

// 卡巴拉生命之树
const kaballahNodes = [
    { id: 1, label: 'Keter', x: 2, y: 1, desc: 'Represents infinity, potential, and spiritual enlightenment.' },
    { id: 2, label: 'Chokhmah', x: 1, y: 2, desc: 'Intuition, creativity, and primal inspiration.' },
    { id: 3, label: 'Binah', x: 3, y: 2, desc: 'Reason, structure, and insight.' },
    { id: 4, label: 'Chesed', x: 1, y: 3, desc: 'Love, compassion, and expansion.' },
    { id: 5, label: 'Gevurah', x: 3, y: 3, desc: 'Discipline, courage, and restraint.' },
    { id: 6, label: 'Tiferet', x: 2, y: 4, desc: 'Balance, harmony, and the spiritual heart.' },
    { id: 7, label: 'Netzach', x: 1, y: 5, desc: 'Perseverance, passion, and emotional strength.' },
    { id: 8, label: 'Hod', x: 3, y: 5, desc: 'Logic, communication, and expression.' },
    { id: 9, label: 'Yesod', x: 2, y: 6, desc: 'Subconscious, connection, and energy transmission.' },
    { id: 10, label: 'Malkuth', x: 2, y: 7, desc: 'Reality, action, and manifestation.' },
]

const kaballahEdges = [
    [1, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6], [4, 7], [5, 8], [6, 9], [7, 9], [8, 9], [9, 10],
]

const selectedNode = ref<number | null>(null)
const selectedDescription = computed(() => {
    const node = kaballahNodes.find(n => n.id === selectedNode.value)
    return node ? node.desc : null
})

const goLogin = () => router.push('/login')
</script>

<template>
    <div class="p-6 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8">
        <FormCard :user="user" :isSelf="isSelf" :selectedNode="selectedNode" @login="goLogin" />
        <TreeCard :nodes="kaballahNodes" :edges="kaballahEdges" v-model:selectedNode="selectedNode"
            :selectedDescription="selectedDescription" />
    </div>

    <div>
        <SlidesCard />
    </div>
</template>
