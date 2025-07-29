<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
  router.push('/dashboard')
})
</script>

<template>
  <div class="home">
    <p>Redirecting to dashboard...</p>
  </div>
</template>