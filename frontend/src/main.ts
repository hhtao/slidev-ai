import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/index.css'
import App from './App.vue'
import router from './router'

// PrimeVue imports
import PrimeVue from 'primevue/config'
import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const app = createApp(App)

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{gray.50}',
            100: '{gray.100}',
            200: '{gray.200}',
            300: '{gray.300}',
            400: '{gray.400}',
            500: '{gray.800}',
            600: '{gray.950}',
            700: '{gray.950}',
            800: '{gray.950}',
            900: '{gray.950}',
            950: '{gray.950}'
        }
    }
});

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.my-app-dark'
        }
    }
});

app.mount('#app')