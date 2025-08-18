<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const slides = ref([])
const loading = ref(true)
const error = ref('')

const sortedSlides = computed(() => {
    return [...slides.value].sort(
        (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
})

const fetchSlides = async () => {
    loading.value = true
    error.value = ''
    try {
        const response = await axios.get(`${API_BASE_URL}/slides/public`)
        slides.value = response.data[0]

        console.log(response.data[0]);
        
    } catch (err) {
        error.value = 'Failed to fetch slides'
    } finally {
        loading.value = false
    }
}

const gotoPreview = (slide: any) => {
    window.open(`${API_BASE_URL}/presentation/${slide.id}`, '_blank')
}

const getCoverImageUrl = (coverFilename: string) =>
    `${API_BASE_URL.replace('/api', '')}/uploads/screenshots/${coverFilename}`

const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString()

onMounted(fetchSlides)
</script>

<template>
    <div class="dashboard p-6">
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
                <h2 class="text-xl font-semibold mb-2">No public slides found</h2>
                <p class="mb-4 text-gray-500">Check back later for public presentations.</p>
            </div>

            <!-- Slide Cards -->
            <div class="flex flex-col gap-4">
                <div v-for="slide in sortedSlides" :key="slide.id"
                    class="flex item rounded-xl shadow-sm hover:shadow-lg bg-white dark:bg-gray-800 p-4 cursor-pointer"
                    @click="gotoPreview(slide)">
                    <!-- Thumbnail -->
                    <div
                        class="flex-shrink-0 w-[300px] h-30 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <img v-if="slide.coverFilename" :src="getCoverImageUrl(slide.coverFilename)" :alt="slide.title"
                            class="w-full h-full object-cover" />
                        <i v-else class="pi pi-image text-4xl text-gray-400"></i>
                    </div>

                    <!-- Right Info -->
                    <div class="flex flex-col flex-1 ml-5">
                        <!-- Title -->
                        <span class="font-semibold text-lg text-gray-900 dark:text-gray-100 truncate mb-2">{{
                            slide.title }}</span>

                        <!-- Author & Dates -->
                        <div class="text-sm text-gray-500 mb-1">
                            Author: {{ slide.user?.username || 'Anonymous' }}
                        </div>
                        <div class="text-sm text-gray-500 mb-1">
                            Created: {{ formatDate(slide.createdAt) }}
                        </div>
                        <div class="text-sm text-gray-500 mb-1">
                            Updated: {{ formatDate(slide.updatedAt) }}
                        </div>
                    </div>
                </div>
            </div>
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
</style>
