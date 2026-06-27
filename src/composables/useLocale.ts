import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { LOCALE_STORAGE_KEY, type AppLocale } from '@/i18n'
import { syncDayjsLocale } from '@/lib/dayjs'

const SUPPORTED_LOCALES: AppLocale[] = ['zh-CN', 'en']

export function useLocale() {
  const { locale, t } = useI18n()

  const currentLocale = computed({
    get: () => locale.value as AppLocale,
    set: (next: AppLocale) => setLocale(next),
  })

  function applyDocumentLocale(next: AppLocale) {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = next
      document.title = t('meta.title')
    }
  }

  function setLocale(next: AppLocale) {
    if (!SUPPORTED_LOCALES.includes(next)) return
    locale.value = next
    if (typeof localStorage !== 'undefined' && typeof localStorage.setItem === 'function') {
      localStorage.setItem(LOCALE_STORAGE_KEY, next)
    }
    syncDayjsLocale(next)
    applyDocumentLocale(next)
  }

  return {
    currentLocale,
    setLocale,
    applyDocumentLocale,
    supportedLocales: SUPPORTED_LOCALES,
  }
}
