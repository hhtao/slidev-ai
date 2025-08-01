<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// PrimeVue components
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataView from 'primevue/dataview'
import Message from 'primevue/message'
import { API_BASE_URL } from '@/utils/api'

const router = useRouter()
const slides = ref([])
const loading = ref(true)
const error = ref('')

// Get token from localStorage
const token = localStorage.getItem('token')

// Redirect to login if no token
if (!token) {
    router.push('/login')
}

const fetchSlides = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/slides`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        slides.value = response.data
    } catch (err) {
        error.value = 'Failed to fetch slides'
        console.error(err)
    } finally {
        loading.value = false
    }
}

const createNewSlide = () => {
    router.push('/create')
}

const viewSlide = (hash: string) => {
    window.open(`${API_BASE_URL}/slides/preview/${hash}`, '_blank')
}

const editSlide = (hash: string) => {
    // For now, we'll just open the preview
    // In a full implementation, this would open an editor
    window.open(`${API_BASE_URL}/slides/preview/${hash}`, '_blank')
}

// Format date for display
const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
    fetchSlides()
})
</script>

<template>
    <div class="dashboard p-4 mt-4">
        <div class="header flex justify-content-between align-items-center mb-4" v-if="slides.length > 0">
            <Button @click="createNewSlide" label="Create New Slide" icon="pi pi-plus" />
        </div>

        <div v-if="loading" class="text-center p-4">
            <i class="pi pi-spin pi-spinner mr-2"></i>
            Loading slides...
        </div>

        <div v-else-if="error">
            <Message severity="error">{{ error }}</Message>
        </div>

        <div v-else>
            <div v-if="slides.length === 0" class="text-center p-8">
                <div class="no-slides-message">
                    <h2>Welcome to Slidev AI</h2>
                    <p class="my-4">Get started by creating your first presentation</p>
                    <Button @click="createNewSlide" label="Create Your First Slide" icon="pi pi-plus" class="mt-2"
                        size="large" />
                </div>
            </div>

            <div v-else>
                <DataView :value="slides">
                    <template #list="slotProps">
                        <div class="grid grid-nogutter">
                            <div v-for="(slide, index) in slotProps.items" :key="slide.id"
                                class="col-12 md:col-6 lg:col-4 p-2">
                                <Card class="h-full">
                                    <template #title>
                                        <h3>{{ slide.title }}</h3>
                                    </template>
                                    <template #content>
                                        <p class="mb-3">Created: {{ formatDate(slide.createdAt) }}</p>
                                        <div class="flex gap-2">
                                            <Button @click="viewSlide(slide.previewHash)" label="View" icon="pi pi-eye"
                                                size="small" severity="success" />
                                            <Button @click="editSlide(slide.previewHash)" label="Edit"
                                                icon="pi pi-pencil" size="small" severity="warning" />
                                        </div>
                                    </template>
                                </Card>
                            </div>
                        </div>
                    </template>
                </DataView>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard {
    max-width: 1200px;
    margin: 0 auto;
}

.no-slides-message {
    max-width: 500px;
    margin: 0 auto;
    padding: 2rem;
    border-radius: 8px;
    background-color: #f8f9fa;
}
</style>