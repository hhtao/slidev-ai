<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'

import Button from 'primevue/button'
import DataView from 'primevue/dataview'
import Message from 'primevue/message'
import Dropdown from 'primevue/dropdown'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import Tag from 'primevue/tag'
import Tooltip from 'primevue/tooltip'

import { useConfirm } from "primevue/useconfirm"
import { useToast } from 'primevue/usetoast'
import { API_BASE_URL } from '@/utils/api'
import axios from 'axios'

const router = useRouter()
const slides = ref([])
const loading = ref(true)
const error = ref('')
const visibility = ref('all')
const confirm = useConfirm()
const toast = useToast()

const visibilityOptions = [
    { label: 'All', value: 'all' },
    { label: 'Public', value: 'public' },
    { label: 'Private', value: 'private' }
]

const sortedSlides = computed(() => {
    let filteredSlides = slides.value
    if (visibility.value !== 'all') {
        filteredSlides = slides.value.filter((slide: any) => slide.visibility === visibility.value)
    }
    return [...filteredSlides].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

const fetchSlides = async () => {
    loading.value = true
    error.value = ''
    try {
        const response = await axios.get(`${API_BASE_URL}/slides/self`)
        slides.value = response.data
        console.log(slides.value);

    } catch (err) {
        error.value = 'Failed to fetch slides'
    } finally {
        loading.value = false
    }
}

const createNewSlide = () => router.push('/slides/process?stage=input')
const viewSlide = (id: string) => window.open(`${API_BASE_URL}/slides/preview/${id}`, '_blank')
const editSlide = (id: string) => router.push(`/slides/process?stage=input&id=${id}`)

const deleteSlide = async (id: string, title: string) => {
    confirm.require({
        message: `Are you sure you want to delete "${title}"?`,
        header: 'Delete Confirmation',
        icon: 'pi pi-exclamation-triangle',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                await axios.delete(`${API_BASE_URL}/slides/${id}`)
                slides.value = slides.value.filter((slide: any) => slide.id !== id)
                toast.add({ severity: 'success', summary: 'Deleted', detail: 'Slide deleted successfully', life: 2500 })
            } catch {
                toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete slide', life: 3000 })
            }
        }
    })
}

const gotoPreview = (slide: any) => {
    window.open(`${API_BASE_URL}/presentation/${slide.id}`, '_blank')
}

const getStatusTag = (status: string) => {    
    return status === 'completed'
        ? { severity: 'success', value: 'Completed' }
        : { severity: 'warn', value: 'Processing' }
}

const getCoverImageUrl = (coverFilename: string) =>
    `${API_BASE_URL.replace('/api', '')}/uploads/screenshots/${coverFilename}`

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString()

onMounted(fetchSlides)
watch(visibility, () => { })
</script>

<template>
    <ConfirmDialog />
    <Toast />

    <div class="dashboard p-6">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
            <Button icon="pi pi-plus" label="New Slide" class="p-button-rounded" @click="createNewSlide" />
            <Dropdown v-model="visibility" :options="visibilityOptions" optionLabel="label" optionValue="value"
                class="w-40" :disabled="loading" placeholder="Filter" />
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl mb-3"></i>
            Loading slides...
        </div>

        <!-- Error -->
        <div v-else-if="error">
            <Message severity="error">{{ error }}</Message>
        </div>

        <!-- Content -->
        <div v-else>
            <!-- Empty State -->
            <div v-if="sortedSlides.length === 0" class="text-center p-10 rounded-lg bg-gray-50 dark:bg-gray-800">
                <h2 class="text-xl font-semibold mb-2">
                    {{ visibility === 'all' ? 'Welcome to Slidev AI' : 'No slides found' }}
                </h2>
                <p class="mb-4 text-gray-500">
                    {{
                        visibility === 'all'
                            ? 'Create your first presentation now.'
                            : visibility === 'public'
                                ? 'You have no public slides yet.'
                                : 'You have no private slides yet.'
                    }}
                </p>
                <Button label="Create Slide" icon="pi pi-plus" class="p-button-rounded p-button-success"
                    @click="createNewSlide" />
            </div>

            <!-- Slide Cards (Horizontal) -->
            <DataView :value="sortedSlides">
                <template #list="slotProps">
                    <div class="flex flex-col gap-4">
                        <div v-for="slide in slotProps.items" :key="slide.id"
                            class="flex item rounded-xl shadow-sm hover:shadow-lg bg-white dark:bg-gray-800 p-4 cursor-pointer"
                            @click="gotoPreview(slide)"    
                        >
                            <!-- Thumbnail -->
                            <div
                                class="flex-shrink-0 w-[300px] h-30 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                <img v-if="slide.coverFilename" :src="getCoverImageUrl(slide.coverFilename)"
                                    :alt="slide.title" class="w-full h-full object-cover" />
                                <i v-else class="pi pi-image text-4xl text-gray-400"></i>
                            </div>

                            <!-- Right Info -->
                            <div class="flex flex-col flex-1 ml-5">
                                <!-- Title -->
                                <div class="flex items-center gap-2 mb-2">
                                    <span class="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate">
                                        {{ slide.title }}
                                    </span>
                                </div>

                                <!-- Visibility & Status -->
                                <div class="flex items-center gap-2 mb-2">
                                    <Tag :value="slide.visibility === 'public' ? 'Public' : 'Private'"
                                        :severity="slide.visibility === 'public' ? 'success' : 'secondary'"
                                        v-tooltip.top="slide.visibility" />
                                    <Tag :value="getStatusTag(slide.processingStatus).value"
                                        :severity="getStatusTag(slide.processingStatus).severity" />
                                </div>

                                <!-- Dates -->
                                <p class="text-sm text-gray-500">
                                    Created: {{ formatDate(slide.createdAt) }}
                                </p>
                                <p class="text-sm text-gray-500 mb-3">
                                    Updated: {{ formatDate(slide.updatedAt) }}
                                </p>

                                <!-- Actions -->
                                <div class="flex gap-2 mt-auto">
        
                                    <div class="action-btn" data-label="Edit">
                                        <Button icon="pi pi-pencil" severity="info" text size="small"
                                            @click.stop="editSlide(slide.id)" />
                                    </div>
                                    <div class="action-btn" data-label="Delete">
                                        <Button icon="pi pi-trash" severity="danger" text size="small"
                                            @click.stop="deleteSlide(slide.id, slide.title)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </DataView>
        </div>
    </div>
</template>


<style scoped>
.dashboard {
    max-width: 1200px;
    margin: auto;
}

.item {
    background-color: #fff;
}

.my-app-dark .item {
    background-color: #282828;
}


.action-btn {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: left;
    overflow: hidden;
    border-radius: 0.5rem;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* 非线性 easing */
    width: 36px;
    /* 初始只有图标大小 */
}

.action-btn button {
    width: 100%;
    justify-content: space-between;
    transition: none;
    /* 防止 primevue 自带 transition 干扰 */
}

.action-btn::after {
    content: attr(data-label);
    position: absolute;
    right: 12px;
    white-space: nowrap;
    opacity: 0;
    transform: translateX(10px);
    transition: all 0.3s ease-in-out;
    font-size: 0.75rem;
    color: var(--p-text-color, #374151);
}

.action-btn:hover {
    width: 80px;
    /* 悬停时扩展宽度 */
}

.action-btn:hover:after {
    opacity: 1;
    transform: translateX(0);
}
</style>
