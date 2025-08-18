<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Tooltip from 'primevue/tooltip'
import { UPLOADS_BASE_URL } from '@/utils/api'
import { apiGetUser } from '@/api/user'
import { useAuthStore } from '@/store/auth'
import type { UserDTO } from '@/api/auth'

const props = defineProps<{
    user: UserDTO | null
    isSelf: boolean
    selectedNode: number | null
}>()

const emit = defineEmits<{
    (e: 'login'): void
}>();

const authStore = useAuthStore()

const email = ref('')
const website = ref('')
const avatarFile = ref<File | null>(null)
const loading = ref(false)

const originalEmail = ref('')
const originalAvatar = ref<string | null>(null)

watch(
    () => props.user,
    val => {
        if (val) {
            email.value = val.email
            originalEmail.value = val.email
            originalAvatar.value = val.avatar || null
        }
    },
    { immediate: true }
)

const onAvatarClick = () => {
    document.getElementById('avatarInput')?.click()
}

const onAvatarSelect = (e: Event) => {
    const target = e.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) avatarFile.value = file
}

const hasChanges = computed(() => {
    return (
        (email.value !== originalEmail.value && props.isSelf) ||
        (avatarFile.value !== null && props.isSelf) ||
        props.selectedNode !== null
    )
})

const submit = async () => {
    if (!props.isSelf) return
    loading.value = true
    await authStore.updateProfile({
        email: email.value !== props.user?.email ? email.value : undefined,
        avatar: avatarFile.value || undefined,
    })
    await authStore.refreshMe()
    loading.value = false
    avatarFile.value = null
}

const getImageUrl = (file: any) => {
    return URL.createObjectURL(file);
}

const goLogin = () => {
    emit('login')
}
</script>

<template>
    <Card>
        <template #title>
            <div class="text-xl font-semibold">My Profile</div>
        </template>

        <template #content>
            <div v-if="user" class="flex flex-col items-center gap-6">
                <!-- Avatar -->
                <div class="relative group cursor-pointer" v-tooltip.top="'Change Avatar'" @click="onAvatarClick">
                    <Avatar v-if="user.avatar && !avatarFile" :image="`${UPLOADS_BASE_URL}/avatars/${user.avatar}`"
                        shape="circle" size="large" class="p-avatar-lg shadow-md" />
                    <Avatar v-else-if="avatarFile" :image="getImageUrl(avatarFile)" shape="circle" size="large"
                        class="p-avatar-lg shadow-md" />
                    <Avatar v-else :label="user.username.charAt(0).toUpperCase()" shape="circle" size="large"
                        class="p-avatar-lg shadow-md" />
                    <input id="avatarInput" type="file" accept="image/*" class="hidden" @change="onAvatarSelect" />
                </div>

                <!-- User Info -->
                <div class="w-full space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Username</label>
                        <div class="text-lg font-semibold">{{ user.username }}</div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Email</label>
                        <InputText v-model="email" :disabled="!isSelf" placeholder="Enter new email" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-500 mb-1">Website</label>
                        <InputText v-model="website" :disabled="!isSelf" placeholder="Your beloved blog or website"
                            class="w-full" />
                    </div>
                </div>

                <Button label="Save Changes" :disabled="!hasChanges" :loading="loading" icon="pi pi-save"
                    class="mt-4 w-full" @click="submit" />
            </div>

            <div v-else class="flex flex-col items-center gap-4 py-6 text-center">
                <div class="text-gray-600">You are not logged in.</div>
                <Button label="Login" icon="pi pi-sign-in" @click="goLogin" />
            </div>
        </template>
    </Card>
</template>

<style scoped>
.p-avatar-lg {
    width: 120px;
    height: 120px;
    font-size: 3rem;
}
</style>
