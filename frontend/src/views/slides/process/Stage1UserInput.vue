<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Card from 'primevue/card';
import Message from 'primevue/message';
import Dropdown from 'primevue/dropdown';
import FileUpload from 'primevue/fileupload';
import ProcessSteps from '@/components/ProcessSteps.vue';
import { useSlidesStore } from '@/store/slide';
import { t } from '@/i18n';
import { useToast } from 'primevue';

const emit = defineEmits<{
    (e: 'complete', slideId: number): void;
}>();

const props = defineProps<{
    id: number;
}>();

const router = useRouter()
const title = ref('')
const content = ref('')
const file = ref<any>(null)
const fileUpload = ref<any>(null)
const loading = ref(false)
const error = ref('')
const visibility = ref('public')

const toast = useToast();
const slidesStore = useSlidesStore();

// Visibility options for the dropdown
const visibilityOptions = ref([
    { label: t('dashboard.tag.public'), value: 'public' },
    { label: t('dashboard.tag.private'), value: 'private' }
]);

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

const collectForm = () => {
    const formData = new FormData();    
    formData.append('title', title.value);

    if (content.value.trim()) {
        formData.append('content', content.value);
    }

    if (file.value) {
        formData.append('file', file.value);
    }
    formData.append('visibility', visibility.value);
    console.log(formData);
    
    return formData;
}

const gotoOutline = async () => {
    if (!title.value.trim()) {
    error.value = t('process.input.error.title-required')
        return
    }

    // Either content or file must be provided
    if (!content.value.trim() && !file.value) {
    error.value = t('process.input.error.content-required')
        return
    }

    loading.value = true
    error.value = ''

    try {
        const formData = collectForm();

        if (props.id) {
            await slidesStore.saveSlide(props.id, formData);
            emit('complete', props.id);
        } else {
            const res = await slidesStore.createSlide(formData);
            emit('complete', res.data.id);
        }

    } catch (err: any) {
        console.error('Create slide error:', err)
        if (err.response && err.response.status === 401) {
            // Token is invalid or expired
            error.value = t('process.input.error.auth')

            // Add slight delay before redirecting to allow user to see error message
            setTimeout(() => {
                router.push('/login')
            }, 2000)
        } else if (err.response) {
            // Server responded with error status
            error.value = t('process.input.error.create-failed')
        } else if (err.request) {
            // Request was made but no response received
            error.value = t('process.input.error.network')
        } else {
            // Other error
            error.value = t('process.input.error.create-failed')
        }
    } finally {
        loading.value = false
    }
}

const saveSlide = async () => {
    
    try {
        const formData = collectForm();
        const res = await slidesStore.saveSlide(props.id, formData);

        if (!res.data.success) {
            toast.add({
                severity: 'error',
                summary: t('process.input.save-failed'),
                life: 5000
            });
        } else {
            toast.add({
                severity: 'success',
                summary: t('process.input.success'),
                detail: t('process.input.success.save'),
                life: 5000
            });

        }

    } catch (error) {
        toast.add({
            severity: 'error',
            summary: t('process.input.error'),
            detail: error,
            life: 3000
        });
    }
}

// Add example outline to help users
const addExample = () => {
    content.value = `Introduction to Slidev AI:
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

const initForm = async () => {
    if (!props.id) {
        return;
    }    
    try {
        const slide = await slidesStore.getSlideById(props.id);        

        if (slide) {
            title.value = slide.title || '';
            content.value = slide.content || '';
            visibility.value = slide.visibility || 'public';
            file.value = null;

            toast.add({
                severity: 'success',
                summary: t('process.input.success'),
                detail: t('process.input.success.load'),
                life: 5000
            })
        }
    } catch (error) {
        console.error('Failed to init form:', error);
        toast.add({
            severity: 'error',
            summary: t('process.input.error'),
            detail: t('process.input.error.load') + error,
            life: 5000
        });
    }
}

onMounted(() => {
    initForm();
});
</script>

<template>
    <div class="create-slide p-4">
        <ProcessSteps :currentStep="1" />

        <div class="header mb-4">
            <p class="text-600">{{ t('process.input.header') }}</p>
        </div>

        <Card>
            <template #content>
                <form>
                    <div class="p-field mb-4">
                        <label for="title" class="block mb-2">{{ t('process.input.slide-title') }}</label>
                        <InputText id="title" v-model="title" type="text" :placeholder="t('process.input.slide-title.placeholder')" class="w-full"
                            :disabled="loading" />
                    </div>

                    <div class="p-field mb-4">
                        <div class="flex align-items-center justify-content-between mb-2 gap-2">
                            <label for="outline" class="block m-0">{{ t('process.input.slide-content') }}</label>
                            <Button type="button" :label="t('process.input.add-example')" text size="small" @click="addExample"
                                :disabled="loading" class="flex-shrink-0" />
                        </div>
                        <Textarea
                            id="content"
                            v-model="content"
                            :placeholder="t('process.input.slide-content.placeholder')"
                            :autoResize="false"
                            rows="10"
                            class="w-full"
                            :disabled="loading" 
                        />
                        <small class="block mt-2 text-600">
                            {{ t('process.input.slide-content.help') }}
                        </small>
                    </div>

                    <div class="p-field mb-4">
                        <label class="block mb-2">{{ t('process.input.upload.label') }}</label>
                        <FileUpload ref="fileUpload" mode="basic" name="file" :auto="false"
                            accept=".pdf,.doc,.docx,.md,.markdown,.txt" :maxFileSize="5000000" @select="onFileSelect"
                            :disabled="loading" :class="{ 'opacity-50 pointer-events-none': loading }" class="w-full" />
                        <div v-if="file"
                            class="mt-2 p-2 bg-primary-100 border-round flex align-items-center justify-content-between">
                            <span class="font-medium">{{ t('process.input.upload.selected') }}</span>
                            <span class="mr-2">{{ file.name }}</span>
                            <Button icon="pi pi-times" rounded text severity="danger" @click="removeFile"
                                :disabled="loading" size="small" />
                        </div>
                        <small class="block mt-2 text-600">
                            {{ t('process.input.upload.help') }}
                        </small>
                    </div>

                    <div class="p-field mb-4">
                        <label for="visibility" class="block mb-2">{{ t('process.input.visibility') }}</label>
                        <Dropdown id="visibility" v-model="visibility" :options="visibilityOptions" optionLabel="label"
                            optionValue="value" class="w-full" :disabled="loading" :placeholder="t('process.input.visibility.placeholder')" />
                        <small class="block mt-2 text-600">{{ t('process.input.visibility.help') }}</small>
                    </div>

                    <div v-if="error" class="mb-4">
                        <Message severity="error">{{ error }}</Message>
                    </div>

                </form>
            </template>

            <template #footer>
                <div class="flex justify-between items-center">
                    <Button type="button" @click="$router.push('/dashboard')" :label="t('process.input.cancel')" severity="secondary"
                        :disabled="loading" />
                    <div class="flex space-x-2">
                        <Button :label="t('process.input.save-draft')" icon="pi pi-save" severity="info" :disabled="loading" @click="saveSlide" />
                        <Button type="submit" :label="loading ? t('process.input.saving') : t('process.input.continue')"
                            :disabled="loading" icon="pi pi-arrow-right" @click="gotoOutline" />
                    </div>
                </div>
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