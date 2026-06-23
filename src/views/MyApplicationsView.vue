<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import ApplicationDetailDrawer from '@/components/application/ApplicationDetailDrawer.vue'
import AuditStatusBadge from '@/components/application/AuditStatusBadge.vue'
import ListPagination from '@/components/ui/ListPagination.vue'
import RefreshButton from '@/components/ui/RefreshButton.vue'
import { AUDIT_STATUS_MAP } from '@/constants/auditStatus'
import { formatRelativeFromUtc } from '@/lib/dayjs'
import { useApplicationsStore } from '@/stores/applications'
import type { ApplicationItem, AuditStatus } from '@/types/application'

const route = useRoute()
const store = useApplicationsStore()
const { items, loading, errorMessage, filterStatus, highlightId, page, total, page_size } =
  storeToRefs(store)

const selectedAppId = ref<string | null>(null)

const selectedApp = computed(() => {
  if (!selectedAppId.value) return null
  return items.value.find((i) => i.id === selectedAppId.value) ?? null
})

const STATUS_OPTIONS: Array<{ value: AuditStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部状态' },
  ...Object.entries(AUDIT_STATUS_MAP).map(([k, v]) => ({
    value: k as AuditStatus,
    label: v.label,
  })),
]

function openDrawer(app: ApplicationItem) {
  selectedAppId.value = app.id
}

function closeDrawer() {
  selectedAppId.value = null
}

function onApplicationUpdated(app: ApplicationItem) {
  if (selectedAppId.value === app.id) {
    selectedAppId.value = app.id
  }
}

function onRefresh() {
  void store.fetchMine()
}

function onPageChange(next: number) {
  store.setPage(next)
}

// Highlight newly created record for 3 s
function applyHighlight() {
  const id = (route.query.highlight as string) || null
  if (id) {
    store.setHighlight(id)
    setTimeout(() => store.setHighlight(null), 3000)
  }
}

// Polling
const { pause, resume } = useIntervalFn(
  () => void store.fetchMine({ silent: true }),
  () => store.pollIntervalMs,
  { immediate: false },
)

onMounted(() => {
  void store.fetchMine()
  resume()
  applyHighlight()
})

onUnmounted(() => pause())

watch(() => route.query.highlight, applyHighlight)

watch(items, () => {
  if (!selectedAppId.value) return
  if (!items.value.some((i) => i.id === selectedAppId.value)) {
    selectedAppId.value = null
  }
})
</script>

<template>
  <div>
    <div class="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
      <header class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            申请管理
          </p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">我的申请</h1>
          <p class="mt-2 text-sm text-slate-500">
            查看授权与资源状态，每 {{ Math.round(store.pollIntervalMs / 1000) }} 秒自动刷新。
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Status filter -->
          <select
            v-model="filterStatus"
            class="h-9 min-w-[9rem] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
          >
            <option v-for="opt in STATUS_OPTIONS" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <RefreshButton variant="toolbar" :loading="loading" @click="onRefresh" />
        </div>
      </header>

      <!-- Error -->
      <div
        v-if="errorMessage"
        class="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <span class="flex-1">{{ errorMessage }}</span>
        <RefreshButton variant="text" label="重试" :loading="loading" @click="onRefresh" />
      </div>

      <!-- Skeleton -->
      <div v-if="loading && items.length === 0" class="space-y-2">
        <div
          v-for="i in 4"
          :key="i"
          class="h-14 animate-pulse rounded-xl border border-slate-100 bg-zinc-100/80"
        />
      </div>

      <!-- Empty state -->
      <div
        v-else-if="!loading && items.length === 0"
        class="rounded-xl border border-dashed border-slate-200 bg-zinc-50/60 px-6 py-14 text-center"
      >
        <p class="text-sm text-slate-500">
          {{ filterStatus !== 'all' ? '当前筛选条件下暂无申请' : '暂无申请记录' }}
        </p>
        <button
          v-if="filterStatus !== 'all'"
          type="button"
          class="mt-3 text-sm font-medium text-slate-900 underline-offset-2 hover:underline"
          @click="filterStatus = 'all'"
        >
          重置筛选
        </button>
      </div>

      <!-- Table -->
      <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-slate-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              <th class="whitespace-nowrap px-4 py-3 text-left">申请 ID</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">服务器 ID</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">状态</th>
              <th class="hidden whitespace-nowrap px-4 py-3 text-left xl:table-cell">更新时间</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="app in items"
              :key="app.id"
              class="cursor-pointer transition-colors hover:bg-zinc-50/70"
              :class="
                highlightId === app.id ? 'bg-emerald-50/70 ring-1 ring-inset ring-emerald-200' : ''
              "
              @click="openDrawer(app)"
            >
              <td class="px-4 py-3 font-mono text-xs text-slate-600">#{{ app.id }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex max-w-[14rem] truncate font-mono text-xs font-medium text-slate-800"
                  :title="app.server_id"
                >
                  {{ app.server_id || '—' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <AuditStatusBadge :status="app.audit_status" />
              </td>
              <td class="hidden px-4 py-3 text-xs text-slate-400 xl:table-cell">
                {{ formatRelativeFromUtc(app.updated_at) }}
              </td>
            </tr>
          </tbody>
        </table>

        <ListPagination
          :page="page"
          :total="total"
          :page-size="page_size"
          :loading="loading"
          @update:page="onPageChange"
        />
      </div>
    </div>

    <ApplicationDetailDrawer
      :application="selectedApp"
      @close="closeDrawer"
      @updated="onApplicationUpdated"
    />
  </div>
</template>
