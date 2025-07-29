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

const router = useRouter()
const title = ref('')
const outline = ref('')
const loading = ref(false)
const error = ref('')

// Get token from localStorage
const token = localStorage.getItem('token')

// Redirect to login if no token
if (!token) {
  router.push('/login')
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'

const createSlide = async () => {
  if (!title.value.trim() || !outline.value.trim()) {
    error.value = 'Please fill in all fields'
    return
  }
  
  loading.value = true
  error.value = ''
  
  try {
    const response = await axios.post(`${API_BASE_URL}/slides`, {
      title: title.value,
      outline: outline.value
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    
    // Redirect to dashboard after successful creation
    router.push('/dashboard')
  } catch (err) {
    error.value = 'Failed to create slide. Please try again.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

const cancel = () => {
  router.push('/dashboard')
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
            />
          </div>
          
          <div class="p-field mb-4">
            <label for="outline" class="block mb-2">Slide Outline</label>
            <Textarea
              id="outline" 
              v-model="outline" 
              placeholder="Enter your slide outline&#10;&#10;Example:&#10;Introduction&#10;- Main point 1&#10;- Main point 2&#10;Conclusion"
              :autoResize="true"
              rows="10"
              class="w-full"
            />
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