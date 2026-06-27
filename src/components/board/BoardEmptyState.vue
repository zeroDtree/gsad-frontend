<script setup lang="ts">
import { AlertCircle, ServerCrash } from 'lucide-vue-next'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import RefreshButton from '@/components/ui/RefreshButton.vue'

const props = defineProps<{
  loading: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  refresh: []
}>()

const { t } = useI18n()
const isError = computed(() => Boolean(props.errorMessage?.trim()))
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed px-8 py-16 text-center"
    :class="isError ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-zinc-50/50'"
  >
    <div
      class="flex size-12 items-center justify-center rounded-full border bg-white"
      :class="isError ? 'border-rose-200 text-rose-500' : 'border-slate-200 text-slate-400'"
    >
      <AlertCircle v-if="isError" class="size-6" />
      <ServerCrash v-else class="size-6" />
    </div>
    <p class="mt-4 text-sm font-medium" :class="isError ? 'text-rose-950' : 'text-slate-800'">
      {{ isError ? t('board.loadFailedTitle') : t('board.emptyTitle') }}
    </p>
    <p
      class="mt-1 max-w-sm text-xs leading-relaxed"
      :class="isError ? 'text-rose-900/90' : 'text-slate-500'"
    >
      {{ isError ? errorMessage : t('board.emptyHint') }}
    </p>
    <div class="mt-6">
      <RefreshButton
        variant="empty"
        :tone="isError ? 'error' : 'default'"
        :loading="loading"
        @click="emit('refresh')"
      />
    </div>
  </div>
</template>
