<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// PrimeVue components
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Card from 'primevue/card'
import Message from 'primevue/message'
import FileUpload from 'primevue/fileupload'
import { API_BASE_URL } from '@/utils/api'

const router = useRouter()
const title = ref('')
const outline = ref('')
const file = ref<any>(null)
const fileUpload = ref<any>(null)
const loading = ref(false)
const error = ref('')

// Get token from localStorage
const token = localStorage.getItem('token')

// Redirect to login if no token
if (!token) {
    router.push('/login')
}

const onFileSelect = (event: any) => {
    // Get the first selected file
    if (event.files && event.files.length > 0) {
        file.value = event.files[0]
        error.value = ''
    }
}

const onFileRemove = () => {
    file.value = null
    error.value = ''
}

const removeFile = () => {
    if (fileUpload.value) {
        fileUpload.value.clear()
    }
    onFileRemove()
}

const createSlide = async () => {
    if (!title.value.trim()) {
        error.value = 'Please enter a slide title'
        return
    }

    // Either outline or file must be provided
    if (!outline.value.trim() && !file.value) {
        error.value = 'Please provide either a slide outline or upload a file'
        return
    }

    loading.value = true
    error.value = ''

    try {
        const formData = new FormData()
        formData.append('title', title.value)
        
        if (outline.value.trim()) {
            formData.append('outline', outline.value)
        }
        
        if (file.value) {
            formData.append('file', file.value)
        }

        const response = await axios.post(`${API_BASE_URL}/slides`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
            }
        })

        // Redirect to processing page after successful creation
        router.push(`/slides/${response.data.id}/process`)
    } catch (err: any) {
        console.error('Create slide error:', err)
        if (err.response && err.response.status === 401) {
            // Token is invalid or expired
            error.value = 'Authentication failed. Please log in again.'
            localStorage.removeItem('token')
            // Add slight delay before redirecting to allow user to see error message
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } else if (err.response) {
            // Server responded with error status
            error.value = `Failed to create slide: ${err.response.data.message || err.response.statusText}`
        } else if (err.request) {
            // Request was made but no response received
            error.value = 'Network error. Please check your connection and try again.'
        } else {
            // Other error
            error.value = 'Failed to create slide. Please try again.'
        }
    } finally {
        loading.value = false
    }
}

const cancel = () => {
    router.push('/dashboard')
}

// Add example outline to help users
const addExample = () => {
    outline.value = `Introduction to Slidev AI:
- What is Slidev AI
- Key features
- Benefits of using AI for presentations

How it works:
- Step 1: Enter your topic
- Step 2: Provide an outline
- Step 3: Generate beautiful slides

Getting started:
- Sign up for an account
- Create your first presentation
- Share with your team
`
}
</script>

<template>
    <div class="create-slide p-4">
        <div class="header mb-4">
            <h1>Create New Slide</h1>
        </div>

        <Card>
            <template #content>
                <form @submit.prevent="createSlide">
                    <div class="p-field mb-4">
                        <label for="title" class="block mb-2">Slide Title</label>
                        <InputText 
                            id="title" 
                            v-model="title" 
                            type="text" 
                            placeholder="Enter slide title"
                            class="w-full"
                            :disabled="loading"
                        />
                    </div>

                    <div class="p-field mb-4">
                        <div class="flex justify-content-between align-items-center mb-2">
                            <label for="outline" class="block">Slide Outline</label>
                            <Button 
                                type="button" 
                                label="Add Example" 
                                text 
                                size="small" 
                                @click="addExample"
                                :disabled="loading"
                            />
                        </div>
                        <Textarea 
                            id="outline" 
                            v-model="outline"
                            placeholder="Enter your slide outline&#10;&#10;Example:&#10;Introduction&#10;- Main point 1&#10;- Main point 2&#10;Conclusion"
                            :autoResize="true" 
                            rows="10" 
                            class="w-full"
                            :disabled="loading"
                        />
                        <small class="block mt-2 text-600">
                            Enter your slide outline. Use lines ending with ':' for section headers, and lines starting with '-' for bullet points.
                        </small>
                    </div>

                    <div class="p-field mb-4">
                        <label class="block mb-2">Upload File (Optional)</label>
                        <FileUpload 
                            ref="fileUpload"
                            mode="basic" 
                            name="file" 
                            :auto="false"
                            accept=".pdf,.doc,.docx,.md,.markdown,.txt"
                            :maxFileSize="5000000"
                            @select="onFileSelect"
                            :disabled="loading"
                            :class="{ 'opacity-50 pointer-events-none': loading }"
                            class="w-full"
                        />
                        <div v-if="file" class="mt-2 p-2 bg-primary-100 border-round flex align-items-center justify-content-between">
                            <span class="font-medium">Selected file:</span> 
                            <span class="mr-2">{{ file.name }}</span>
                            <Button 
                                icon="pi pi-times" 
                                rounded 
                                text 
                                severity="danger" 
                                @click="removeFile"
                                :disabled="loading"
                                size="small"
                            />
                        </div>
                        <small class="block mt-2 text-600">
                            Upload a PDF, Word document, or Markdown file as source material (optional, max 5MB)
                        </small>
                    </div>

                    <div v-if="error" class="mb-4">
                        <Message severity="error">{{ error }}</Message>
                    </div>

                    <div class="flex justify-content-end gap-2">
                        <Button 
                            type="button" 
                            @click="cancel" 
                            label="Cancel" 
                            severity="secondary" 
                            :disabled="loading"
                        />
                        <Button 
                            type="submit" 
                            :label="loading ? 'Creating...' : 'Create Slide'" 
                            :disabled="loading"
                            icon="pi pi-check"
                        />
                    </div>
                </form>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.create-slide {
    max-width: 800px;
    margin: 0 auto;
}
</style>