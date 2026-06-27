<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import RefreshButton from '@/components/ui/RefreshButton.vue'
import { SERVER_STATUS_LABEL_KEY } from '@/constants/serverPresence'
import type { ServerStatus } from '@/types/public'

const { t } = useI18n()

const resourceLevel = defineModel<string | 'all'>('resourceLevel', { required: true })
const status = defineModel<ServerStatus | 'all'>('status', { required: true })

defineProps<{
  loading: boolean
  resourceLevels: string[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const statusOptions = computed(() => [
  { value: 'all' as const, label: t('common.allStatus') },
  { value: 'ONLINE' as const, label: t(SERVER_STATUS_LABEL_KEY.ONLINE) },
  { value: 'OFFLINE' as const, label: t(SERVER_STATUS_LABEL_KEY.OFFLINE) },
  { value: 'MAINTENANCE' as const, label: t(SERVER_STATUS_LABEL_KEY.MAINTENANCE) },
])
</script>

<template>
  <div
    class="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
  >
    <div class="flex flex-wrap items-center gap-2">
      <label class="sr-only" for="filter-level">{{ t('board.resourceLevel') }}</label>
      <select
        id="filter-level"
        v-model="resourceLevel"
        :title="resourceLevel === 'all' ? t('board.resourceLevel') : String(resourceLevel)"
        class="h-9 min-w-[8.5rem] max-w-[14rem] truncate rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
      >
        <option value="all">{{ t('common.allLevels') }}</option>
        <option v-for="lv in resourceLevels" :key="lv" :value="lv">{{ lv }}</option>
      </select>

      <label class="sr-only" for="filter-status">{{ t('board.onlineStatus') }}</label>
      <select
        id="filter-status"
        v-model="status"
        class="h-9 min-w-[8.5rem] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
      >
        <option v-for="opt in statusOptions" :key="String(opt.value)" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <RefreshButton variant="toolbar" :loading="loading" @click="emit('refresh')" />
  </div>
</template>
