<script setup lang="ts">
import { X } from 'lucide-vue-next'

import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

function tone(type: string) {
  if (type === 'success') return 'border-emerald-200 bg-emerald-50 text-emerald-900'
  if (type === 'warning') return 'border-amber-200 bg-amber-50 text-amber-950'
  return 'border-rose-200 bg-rose-50 text-rose-950'
}
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-sm flex-col gap-2"
    aria-live="polite"
  >
    <TransitionGroup name="toast">
      <div
        v-for="t in ui.toasts"
        :key="t.id"
        class="pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm shadow-sm transition"
        :class="tone(t.type)"
      >
        <p class="min-w-0 flex-1 leading-snug">{{ t.message }}</p>
        <button
          type="button"
          class="rounded p-0.5 text-current opacity-60 hover:opacity-100"
          :aria-label="'关闭'"
          @click="ui.dismiss(t.id)"
        >
          <X class="size-4 shrink-0" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
.toast-move {
  transition: transform 0.22s ease;
}
</style>
