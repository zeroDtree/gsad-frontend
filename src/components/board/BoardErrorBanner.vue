<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'

import RefreshButton from '@/components/ui/RefreshButton.vue'

defineProps<{
  message: string
  loading?: boolean
}>()

const emit = defineEmits<{
  retry: []
}>()
</script>

<template>
  <Transition name="banner">
    <div
      v-if="message"
      class="mb-6 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950"
      role="alert"
    >
      <AlertCircle class="mt-0.5 size-4 shrink-0 text-rose-600" />
      <div class="min-w-0 flex-1">
        <p class="font-medium">无法加载看板</p>
        <p class="mt-0.5 text-rose-900/90">{{ message }}</p>
      </div>
      <RefreshButton variant="banner" label="重试" :loading="loading" @click="emit('retry')" />
    </div>
  </Transition>
</template>

<style scoped>
.banner-enter-active,
.banner-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}
.banner-enter-from,
.banner-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
