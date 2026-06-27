import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { i18n } from '@/i18n'
import { syncDayjsLocale } from '@/lib/dayjs'
import { router } from '@/router'
import './style.css'

const app = createApp(App)

app.use(createPinia())
app.use(i18n)
app.use(router)

const locale = i18n.global.locale.value
syncDayjsLocale(locale)
if (typeof document !== 'undefined') {
  document.documentElement.lang = locale
  document.title = i18n.global.t('meta.title')
}

app.mount('#app')
