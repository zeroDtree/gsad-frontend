import { createI18n } from 'vue-i18n'

import en from '@/locales/en.json'
import zhCN from '@/locales/zh-CN.json'

export const LOCALE_STORAGE_KEY = 'gsad-locale'

export type AppLocale = 'zh-CN' | 'en'

const SUPPORTED_LOCALES: AppLocale[] = ['zh-CN', 'en']

function readStoredLocale(): AppLocale | null {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    return null
  }
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
  return stored && SUPPORTED_LOCALES.includes(stored as AppLocale) ? (stored as AppLocale) : null
}

function detectBrowserLocale(): AppLocale {
  if (typeof navigator === 'undefined') return 'zh-CN'
  const lang = navigator.language.toLowerCase()
  if (lang.startsWith('en')) return 'en'
  return 'zh-CN'
}

export function resolveInitialLocale(): AppLocale {
  return readStoredLocale() ?? detectBrowserLocale()
}

export const i18n = createI18n({
  legacy: false,
  locale: resolveInitialLocale(),
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    en,
  },
})
