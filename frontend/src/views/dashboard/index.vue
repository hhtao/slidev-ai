<script setup lang="ts">
import { ref, onMounted } from 'vue'
import MySlide from './MySlide.vue'
import UserPanel from './UserPanel.vue'
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'

const userRole = ref('user')

onMounted(async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/me`)
        userRole.value = response.data.role
    } catch (error) {
        console.error('Failed to fetch user info:', error)
    }
})
</script>

<template>
    <div>
        <UserPanel v-if="userRole === 'admin'" />
        <MySlide v-else />
    </div>
</template>