<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const goLogin = () => router.push('/login')
</script>

<template>
  <div class="p-4 max-w-3xl mx-auto">
    <Card>
      <template #title>
        <div class="flex items-center gap-3">
          <span>我的信息</span>
        </div>
      </template>
      <template #content>
        <div v-if="user" class="space-y-3">
          <div class="grid grid-cols-3 gap-2">
            <div class="font-medium text-color-secondary">用户名</div>
            <div class="col-span-2">{{ user.username }}</div>
          </div>
          <div class="grid grid-cols-3 gap-2">
            <div class="font-medium text-color-secondary">邮箱</div>
            <div class="col-span-2">{{ user.email }}</div>
          </div>
        </div>
        <div v-else class="flex flex-col items-start gap-3">
          <div>尚未登录，请先登录。</div>
          <Button label="去登录" icon="pi pi-sign-in" @click="goLogin" />
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
</style>
