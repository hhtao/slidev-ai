<script setup lang="ts">
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import Avatar from 'primevue/avatar'
import {UPLOADS_BASE_URL} from '@/utils/api'
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const email = ref('')
const avatarFile = ref<File | null>(null)
const loading = ref(false)

watch(user, (val) => {
  if (val) email.value = val.email
}, { immediate: true })

const onSelect = (e: any) => {
  const file = e.files?.[0]
  if (file) avatarFile.value = file
}

const submit = async () => {
  loading.value = true
  await authStore.updateProfile({ email: email.value !== user.value?.email ? email.value : undefined, avatar: avatarFile.value || undefined })
  await authStore.refreshMe()
  loading.value = false
  avatarFile.value = null
}

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
        <div v-if="user" class="space-y-6">
          <div class="flex items-center gap-4">
            <Avatar v-if="user.avatar" :image="`${UPLOADS_BASE_URL}/avatars/${user.avatar}`" shape="circle" size="xlarge" />
            <Avatar v-else :label="user.username.charAt(0).toUpperCase()" shape="circle" size="xlarge" />
          </div>
          <div class="grid grid-cols-3 gap-2 items-center">
            <div class="font-medium text-color-secondary">用户名</div>
            <div class="col-span-2">{{ user.username }}</div>
          </div>
            <div class="grid grid-cols-3 gap-2 items-center">
              <div class="font-medium text-color-secondary">邮箱</div>
              <div class="col-span-2 flex items-center gap-2">
                <InputText v-model="email" placeholder="新的邮箱" class="w-full" />
              </div>
            </div>
          <div>
            <FileUpload mode="basic" name="avatar" accept="image/*" customUpload chooseLabel="选择头像" @select="onSelect" auto />
            <div v-if="avatarFile" class="mt-2 text-sm text-color-secondary">已选择: {{ avatarFile.name }}</div>
          </div>
          <div>
            <Button label="保存修改" :loading="loading" icon="pi pi-save" @click="submit" />
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
