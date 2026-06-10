import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'error' | 'warning' | 'success'

export interface ToastItem {
  id: number
  type: ToastType
  message: string
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<ToastItem[]>([])
  let seq = 0

  function pushToast(payload: { type: ToastType; message: string; durationMs?: number }) {
    const id = ++seq
    const item: ToastItem = { id, type: payload.type, message: payload.message }
    toasts.value = [...toasts.value, item]
    const duration = payload.durationMs ?? 4200
    window.setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return { toasts, pushToast, dismiss }
})
