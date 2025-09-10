<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import FileUpload from 'primevue/fileupload'
import Dropdown from 'primevue/dropdown'

import Card from 'primevue/card'
import { useSlidesStore } from '@/store/slide'
import { t } from '@/i18n'

const router = useRouter()
const toast = useToast()
const slidesStore = useSlidesStore()

const title = ref('')
const selectedFile = ref<File | null>(null)
const isSubmitting = ref(false)
const visibility = ref('public');
const visibilityOptions = ref([
    { label: t('dashboard.tag.public'), value: 'public' },
    { label: t('dashboard.tag.private'), value: 'private' }
]);

const onFileSelect = (event: any) => {
    const file = event.files[0]
    if (file) {
        // 检查文件类型
        const validTypes = ['.md', '.slidev']
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

        if (validTypes.includes(fileExtension)) {
            selectedFile.value = file
        } else {
            toast.add({
                severity: 'error',
                summary: t('common.error'),
                detail: t('import-slide.invalid-file-type'),
                life: 3000
            })
            selectedFile.value = null
        }
    }
}

const onSubmit = async () => {
    if (!title.value.trim()) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('import-slide.title-required'),
            life: 3000
        })
        return
    }

    if (!selectedFile.value) {
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: t('import-slide.file-required'),
            life: 3000
        })
        return
    }

    isSubmitting.value = true

    try {
        const formData = new FormData()
        formData.append('title', title.value)
        formData.append('visibility', visibility.value)
        formData.append('file', selectedFile.value)

        const buildingMessage = {
            severity: 'info',
            summary: t('process.markdown.building'),
            detail: t('process.markdown.building.detail'),
            closable: false,
        };

        toast.add(buildingMessage);
        const response = await slidesStore.importSlide(formData);
        
        toast.remove(buildingMessage);

        if (response.data?.id) {
            toast.add({
                severity: 'success',
                summary: t('common.success'),
                detail: t('import-slide.import-success'),
                life: 3000
            })

            // 导入成功后跳转到处理页面
            router.push(`/public`)
        } else {
            throw new Error('Import failed')
        }
    } catch (error: any) {
        console.error('Import error:', error)
        toast.add({
            severity: 'error',
            summary: t('common.error'),
            detail: error.message || t('import-slide.import-failed'),
            life: 5000
        })
    } finally {
        isSubmitting.value = false
    }
}

const onCancel = () => {
    router.push('/dashboard')
}
</script>

<template>
    <div class="import-slide p-6 max-w-1xl mx-auto">
        <Card>
            <template #title>
                <h2>{{ t('import-slide.title') }}</h2>
            </template>

            <template #content>
                <div class="space-y-6">
                    <div class="field">
                        <label for="title" class="block text-sm font-medium mb-2">
                            {{ t('import-slide.slide-title') }}
                        </label>
                        <InputText id="title" v-model="title" class="w-full"
                            :placeholder="t('import-slide.title-placeholder')" />
                    </div>

                    <div class="field">
                        <label class="block text-sm font-medium mb-2">
                            {{ t('import-slide.select-file') }}
                        </label>
                        <FileUpload mode="basic" :chooseLabel="t('import-slide.choose-file')" accept=".md,.slidev"
                            :maxFileSize="10000000" @select="onFileSelect" :auto="true" :showUploadButton="false" />
                        <small class="block mt-1 text-gray-500">
                            {{ t('import-slide.file-hint') }}
                        </small>

                        <div v-if="selectedFile" class="mt-2 p-2 rounded">
                            <span class="text-sm">{{ selectedFile.name }}</span>
                        </div>
                    </div>

                    <div class="field">
                        <label class="block mb-2 font-bold">{{ t("process.input.visibility") }}</label>
                        <Dropdown v-model="visibility" :options="visibilityOptions" optionLabel="label"
                            optionValue="value" class="w-full" />
                    </div>

                    <div class="flex justify-end gap-3 pt-4">
                        <Button :label="t('common.cancel')" severity="secondary" @click="onCancel"
                            :disabled="isSubmitting" />
                        <Button :label="t('common.submit')" @click="onSubmit" :loading="isSubmitting"
                            :disabled="!title.trim() || !selectedFile || isSubmitting" />
                    </div>
                </div>
            </template>
        </Card>
    </div>
</template>

<style scoped>
.import-slide {
    max-width: 800px;
    margin: auto;
}
</style>