<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'

import { SERVER_STATUS_LABEL } from '@/constants/serverPresence'
import type { ServerStatus } from '@/types/public'

const resourceLevel = defineModel<string | 'all'>('resourceLevel', { required: true })
const status = defineModel<ServerStatus | 'all'>('status', { required: true })

defineProps<{
  loading: boolean
  resourceLevels: string[]
}>()

const emit = defineEmits<{
  refresh: []
}>()

const statusOptions: Array<{ value: ServerStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'ONLINE', label: SERVER_STATUS_LABEL.ONLINE },
  { value: 'OFFLINE', label: SERVER_STATUS_LABEL.OFFLINE },
  { value: 'MAINTENANCE', label: SERVER_STATUS_LABEL.MAINTENANCE },
]
</script>

<template>
  <div
    class="flex flex-col gap-3 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
  >
    <div class="flex flex-wrap items-center gap-2">
      <label class="sr-only" for="filter-level">资源等级</label>
      <select
        id="filter-level"
        v-model="resourceLevel"
        :title="resourceLevel === 'all' ? '资源等级' : String(resourceLevel)"
        class="h-9 min-w-[8.5rem] max-w-[14rem] truncate rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
      >
        <option value="all">全部等级</option>
        <option v-for="lv in resourceLevels" :key="lv" :value="lv">{{ lv }}</option>
      </select>

      <label class="sr-only" for="filter-status">在线状态</label>
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

    <button
      type="button"
      class="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50"
      :disabled="loading"
      @click="emit('refresh')"
    >
      <RefreshCw class="size-4" :class="loading ? 'animate-spin' : ''" />
      刷新
    </button>
  </div>
</template>
