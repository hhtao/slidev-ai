<template>
    <div class="invitation-manager p-6">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold">{{ t('invitation.manager.title') }}</h1>
            <Button :label="t('invitation.manager.create')" icon="pi pi-plus" @click="showCreateDialog" />
        </div>

        <div v-if="loading" class="flex flex-col items-center justify-center py-12 text-gray-500">
            <i class="pi pi-spin pi-spinner text-2xl mb-3"></i>
            {{ t('invitation.manager.loading') }}
        </div>

        <div v-else>
            <div class="card">
                <DataTable :value="invitations" :paginator="true" :rows="20" :totalRecords="totalInvitations"
                    :lazy="true" @page="onPage" responsiveLayout="scroll">
                    <Column field="id" :header="t('invitation.manager.id')"></Column>
                    <Column field="code" :header="t('invitation.manager.code')"></Column>
                    <Column field="createdAt" :header="t('invitation.manager.createdAt')">
                        <template #body="slotProps">
                            {{ formatDate(slotProps.data.createdAt) }}
                        </template>
                    </Column>
                    <Column :header="t('invitation.manager.actions')">
                        <template #body="slotProps">
                            <Button icon="pi pi-copy" text @click="copyCode(slotProps.data.code)"
                                :title="t('invitation.manager.copy')" />
                            <Button icon="pi pi-trash" severity="danger" text @click="deleteInvitation(slotProps.data.id)"
                                :title="t('invitation.manager.delete')" />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- 创建邀请码对话框 -->
        <Dialog v-model:visible="createDialogVisible" :style="{ width: '500px' }" :header="t('invitation.manager.create')"
            :modal="true" class="p-fluid rounded-2xl shadow-lg">
            <div class="space-y-5">
                <div class="flex flex-col gap-2">
                    <label for="invitationCode">{{ t('invitation.manager.code-label') }}</label>
                    <InputText id="invitationCode" v-model="newInvitationCode" class="w-full"
                        :placeholder="t('invitation.manager.code-placeholder')" />
                    <small>{{ t('invitation.manager.code-help') }}</small>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-3">
                    <Button :label="t('invitation.manager.cancel')" icon="pi pi-times" text @click="hideCreateDialog"
                        class="px-4 py-2" />
                    <Button :label="t('invitation.manager.create')" icon="pi pi-check" @click="createInvitation"
                        class="px-4 py-2" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import { useToast } from 'primevue/usetoast'
import { t } from '@/i18n/index'
import { apiGetInvitations, apiCreateInvitation, apiDeleteInvitation, InvitationDTO } from '@/api/invitation'

const invitations = ref<InvitationDTO[]>([]);
const loading = ref(true)
const totalInvitations = ref(0)
const currentPage = ref(0)
const toast = useToast()

// 创建邀请码对话框相关
const createDialogVisible = ref(false)
const newInvitationCode = ref('')

const fetchInvitations = async (page = 0) => {
    loading.value = true
    try {
        const response = await apiGetInvitations(page + 1, 20)
        if (response.success) {
            invitations.value = response.data.invitations
            totalInvitations.value = response.data.total
        } else {
            toast.add({
                severity: 'error',
                summary: t('invitation.manager.error'),
                detail: response.error || t('invitation.manager.fetch-error'),
                life: 3000
            })
        }
    } catch (error) {
        console.error('Failed to fetch invitations:', error)
        toast.add({
            severity: 'error',
            summary: t('invitation.manager.error'),
            detail: t('invitation.manager.fetch-error'),
            life: 3000
        })
    } finally {
        loading.value = false
    }
}

const onPage = (event: any) => {
    currentPage.value = event.page
    fetchInvitations(event.page)
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
}

// 创建邀请码相关函数
const showCreateDialog = () => {
    newInvitationCode.value = ''
    createDialogVisible.value = true
}

const hideCreateDialog = () => {
    createDialogVisible.value = false
}

const createInvitation = async () => {
    try {
        const response = await apiCreateInvitation(newInvitationCode.value || undefined)
        if (response.success) {
            toast.add({
                severity: 'success',
                summary: t('invitation.manager.success'),
                detail: t('invitation.manager.create-success'),
                life: 3000
            })
            hideCreateDialog()
            fetchInvitations(currentPage.value)
        } else {
            toast.add({
                severity: 'error',
                summary: t('invitation.manager.error'),
                detail: response.error || t('invitation.manager.create-error'),
                life: 3000
            })
        }
    } catch (error: any) {
        const message = error.response?.data?.message || t('invitation.manager.create-error')
        toast.add({
            severity: 'error',
            summary: t('invitation.manager.error'),
            detail: message,
            life: 3000
        })
    }
}

const deleteInvitation = async (invitationId: number) => {
    if (!confirm(t('invitation.manager.delete-confirm'))) {
        return
    }

    try {
        const response = await apiDeleteInvitation(invitationId)
        if (response.success) {
            toast.add({
                severity: 'success',
                summary: t('invitation.manager.success'),
                detail: t('invitation.manager.delete-success'),
                life: 3000
            })
            fetchInvitations(currentPage.value)
        } else {
            toast.add({
                severity: 'error',
                summary: t('invitation.manager.error'),
                detail: response.error || t('invitation.manager.delete-error'),
                life: 3000
            })
        }
    } catch (error: any) {
        const message = error.response?.data?.message || t('invitation.manager.delete-error')
        toast.add({
            severity: 'error',
            summary: t('invitation.manager.error'),
            detail: message,
            life: 3000
        })
    }
}

const copyCode = async (code: string) => {
    try {
        await navigator.clipboard.writeText(code)
        toast.add({
            severity: 'success',
            summary: t('invitation.manager.success'),
            detail: t('invitation.manager.copy-success'),
            life: 3000
        })
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: t('invitation.manager.error'),
            detail: t('invitation.manager.copy-error'),
            life: 3000
        })
    }
}

onMounted(() => {
    fetchInvitations()
})
</script>

<style scoped>
.invitation-manager {
    max-width: 1200px;
    margin: auto;
}
</style>