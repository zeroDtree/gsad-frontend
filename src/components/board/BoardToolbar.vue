<script setup lang="ts">
import { SERVER_STATUS_LABEL } from '@/constants/serverPresence'
import RefreshButton from '@/components/ui/RefreshButton.vue'
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

    <RefreshButton variant="toolbar" :loading="loading" @click="emit('refresh')" />
  </div>
</template>
