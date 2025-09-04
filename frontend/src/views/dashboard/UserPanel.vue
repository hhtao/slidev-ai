<template>
    <div class="user-panel p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">用户管理</h1>
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl mb-3"></i>
            加载中...
        </div>

        <div v-else>
            <div class="card">
                <DataTable :value="users" :paginator="true" :rows="15" :totalRecords="totalUsers" :lazy="true"
                    @page="onPage" responsiveLayout="scroll">
                    <Column field="id" header="ID" :sortable="true"></Column>
                    <Column field="username" header="用户名">
                        <template #body="slotProps">
                            <div class="h-[32px] flex items-center gap-2">
                                <Avatar v-if="slotProps.data.avatar"
                                    :image="`${UPLOADS_BASE_URL}/avatars/${slotProps.data.avatar}`" shape="circle"
                                    class="cursor-pointer" title="我的信息"
                                    @click="router.push(`/profile/${slotProps.data.id}`)" />
                                <Avatar v-else :label="slotProps.data.username.charAt(0).toUpperCase()" shape="circle"
                                    class="cursor-pointer" title="我的信息"
                                    @click="router.push(`/profile/${slotProps.data.id}`)" />
                                <span>{{ slotProps.data.username }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="email" header="邮箱"></Column>
                    <Column field="role" header="角色">
                        <template #body="slotProps">
                            <Tag :value="slotProps.data.role"
                                :severity="slotProps.data.role === 'admin' ? 'danger' : 'info'" />
                        </template>
                    </Column>
                    <Column field="createdAt" header="创建时间">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.createdAt) }}
                        </template>
                    </Column>
                    <Column field="updatedAt" header="更新时间">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.updatedAt) }}
                        </template>
                    </Column>
                    <Column header="操作">
                        <template #body="slotProps">
                            <Button icon="pi pi-trash" severity="danger" text @click="deleteUser(slotProps.data.id)" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import axios from 'axios'
import { API_BASE_URL, UPLOADS_BASE_URL } from '@/utils/api'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'
import { Password } from 'primevue'

const users = ref([])
const loading = ref(true)
const totalUsers = ref(0)
const currentPage = ref(0)
const toast = useToast()

const router = useRouter();

const roleOptions = [
    { label: '普通用户', value: 'user' },
    { label: '管理员', value: 'admin' }
]

const fetchUsers = async (page = 0) => {
    loading.value = true
    try {
        const response = await axios.get(`${API_BASE_URL}/users`, {
            params: {
                page: page + 1,
                limit: 15
            },
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })

        users.value = response.data.users
        totalUsers.value = response.data.total
    } catch (error) {
        console.error('Failed to fetch users:', error)
        toast.add({ severity: 'error', summary: '错误', detail: '获取用户列表失败', life: 3000 })
    } finally {
        loading.value = false
    }
}

const onPage = (event: any) => {
    currentPage.value = event.page
    fetchUsers(event.page)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
}


const deleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？')) {
        return
    }

    try {
        await axios.delete(`${API_BASE_URL}/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        })
        toast.add({ severity: 'success', summary: '成功', detail: '用户删除成功', life: 3000 })
        fetchUsers(currentPage.value)
    } catch (error: any) {
        const message = error.response?.data?.message || '删除用户失败'
        toast.add({ severity: 'error', summary: '错误', detail: message, life: 3000 })
    }
}

onMounted(() => {
    fetchUsers()
})
</script>

<style scoped>
.user-panel {
    max-width: 1200px;
    margin: auto;
}
</style>