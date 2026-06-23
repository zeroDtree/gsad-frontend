<script setup lang="ts">
import { RefreshCw, Upload, X } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import { bulkDeleteUsers, bulkDisableUsers, bulkEnableUsers, listAdminUsers } from '@/api/admin'
import AdminUserEditDrawer from '@/components/admin/AdminUserEditDrawer.vue'
import { useUiStore } from '@/stores/ui'
import type {
  AdminUserVO,
  BulkDeleteUsersResponse,
  BulkDisableUsersResponse,
  BulkEnableUsersResponse,
  BulkUserActionRequest,
  UserStatus,
} from '@/types/apiEnvelope'

const PAGE_SIZE = 20
const ui = useUiStore()

type SelectionMode = 'none' | 'partial' | 'page' | 'allFiltered'

type BulkResultModal =
  | { type: 'disable'; data: BulkDisableUsersResponse }
  | { type: 'enable'; data: BulkEnableUsersResponse }
  | { type: 'delete'; data: BulkDeleteUsersResponse }

const items = ref<AdminUserVO[]>([])
const loading = ref(false)
const errorMessage = ref('')
const total = ref(0)
const page = ref(1)

const filterStatus = ref<'all' | UserStatus>('all')
const filterCohort = ref('')

const selectedUserId = ref<number | null>(null)
const selectionMode = ref<SelectionMode>('none')
const selectedIds = ref<Set<number>>(new Set())

const bulkLoading = ref(false)
const showDeleteConfirm = ref(false)
const revokeSsh = ref(false)
const bulkResultModal = ref<BulkResultModal | null>(null)

const selectedUser = computed(() => {
  if (selectedUserId.value == null) return null
  return items.value.find((u) => u.id === selectedUserId.value) ?? null
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))
const canGoPrev = computed(() => page.value > 1)
const canGoNext = computed(() => page.value < totalPages.value)

const pageIds = computed(() =>
  items.value.map((u) => u.id).filter((id): id is number => id != null),
)

const selectionCount = computed(() =>
  selectionMode.value === 'allFiltered' ? total.value : selectedIds.value.size,
)

const hasSelection = computed(() => selectionCount.value > 0)

const selectionStatusText = computed(() => {
  if (selectionMode.value === 'allFiltered') {
    return `已选 ${selectionCount.value} 人（当前筛选）`
  }
  return `已选 ${selectionCount.value} 人`
})

const selectedActiveAccessCount = computed(() => {
  if (selectionMode.value === 'allFiltered') return null
  return items.value
    .filter((u) => u.id != null && selectedIds.value.has(u.id))
    .reduce((sum, u) => sum + (u.activeAccessCount ?? 0), 0)
})

const deleteWarning = computed(() => {
  const count = selectedActiveAccessCount.value
  if (count == null || count <= 0) return null
  if (revokeSsh.value) {
    return `所选用户共有 ${count} 个活跃/撤销中的 GPU 访问，勾选后将发起服务器账号回收。`
  }
  return `所选用户共有 ${count} 个活跃 GPU 访问；不勾选时服务器 SSH 账号将保留。`
})

const STATUS_OPTIONS: Array<{ value: 'all' | UserStatus; label: string }> = [
  { value: 'all', label: '全部状态' },
  { value: 'ACTIVE', label: '启用' },
  { value: 'INACTIVE', label: '禁用' },
]

function statusLabel(status?: UserStatus) {
  if (status === 'ACTIVE') return '启用'
  if (status === 'INACTIVE') return '禁用'
  return status ?? '—'
}

function statusClass(status?: UserStatus) {
  if (status === 'ACTIVE') return 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  if (status === 'INACTIVE') return 'bg-zinc-100 text-slate-600 ring-slate-200'
  return 'bg-zinc-100 text-slate-600 ring-slate-200'
}

function clearSelection() {
  selectionMode.value = 'none'
  selectedIds.value = new Set()
  showDeleteConfirm.value = false
}

function syncSelectionMode() {
  if (selectionMode.value === 'allFiltered') return
  if (selectedIds.value.size === 0) {
    selectionMode.value = 'none'
  } else if (pageIds.value.length > 0 && pageIds.value.every((id) => selectedIds.value.has(id))) {
    selectionMode.value = 'page'
  } else {
    selectionMode.value = 'partial'
  }
}

function isRowSelected(user: AdminUserVO) {
  if (selectionMode.value === 'allFiltered') return true
  return user.id != null && selectedIds.value.has(user.id)
}

function toggleRow(user: AdminUserVO, event: Event) {
  event.stopPropagation()
  if (user.id == null) return

  if (selectionMode.value === 'allFiltered') {
    selectionMode.value = 'partial'
    selectedIds.value = new Set(pageIds.value.filter((id) => id !== user.id))
    return
  }

  const next = new Set(selectedIds.value)
  if (next.has(user.id)) next.delete(user.id)
  else next.add(user.id)
  selectedIds.value = next
  syncSelectionMode()
}

function selectPageAll() {
  if (pageIds.value.length === 0) return
  const next = new Set(selectedIds.value)
  pageIds.value.forEach((id) => next.add(id))
  selectedIds.value = next
  selectionMode.value = 'page'
}

function selectAllFiltered() {
  selectionMode.value = 'allFiltered'
}

function buildBulkRequest(): BulkUserActionRequest {
  if (selectionMode.value === 'allFiltered') {
    return {
      selectAll: true,
      ids: [],
      cohort: filterCohort.value.trim() || undefined,
      status: filterStatus.value === 'all' ? 'all' : filterStatus.value,
    }
  }
  return {
    selectAll: false,
    ids: [...selectedIds.value],
  }
}

function closeBulkResultModal() {
  bulkResultModal.value = null
}

function handleBulkModalBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) closeBulkResultModal()
}

async function fetchUsers() {
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listAdminUsers({
      page: page.value,
      page_size: PAGE_SIZE,
      status: filterStatus.value === 'all' ? undefined : filterStatus.value,
      cohort: filterCohort.value.trim() || undefined,
    })
    items.value = result.items ?? []
    total.value = result.total ?? 0
  } catch {
    errorMessage.value = '加载用户列表失败'
  } finally {
    loading.value = false
  }
}

function openDrawer(user: AdminUserVO) {
  if (user.id != null) selectedUserId.value = user.id
}

function closeDrawer() {
  selectedUserId.value = null
}

function onUserUpdated(updated: AdminUserVO) {
  const idx = items.value.findIndex((u) => u.id === updated.id)
  if (idx >= 0) items.value[idx] = updated
}

function onUserDeleted() {
  selectedUserId.value = null
  void fetchUsers()
}

async function onBulkEnable() {
  if (!hasSelection.value || bulkLoading.value) return
  if (!window.confirm(`确定启用选中的 ${selectionCount.value} 个用户？`)) return

  bulkLoading.value = true
  try {
    const result = await bulkEnableUsers(buildBulkRequest())
    bulkResultModal.value = { type: 'enable', data: result }
    ui.pushToast({ type: 'success', message: `已启用 ${result.enabled ?? 0} 个用户` })
    clearSelection()
    void fetchUsers()
  } catch {
    // http interceptor shows error toast
  } finally {
    bulkLoading.value = false
  }
}

async function onBulkDisable() {
  if (!hasSelection.value || bulkLoading.value) return
  if (!window.confirm(`确定禁用选中的 ${selectionCount.value} 个用户？`)) return

  bulkLoading.value = true
  try {
    const result = await bulkDisableUsers(buildBulkRequest())
    bulkResultModal.value = { type: 'disable', data: result }
    ui.pushToast({ type: 'success', message: `已禁用 ${result.disabled ?? 0} 个用户` })
    clearSelection()
    void fetchUsers()
  } catch {
    // http interceptor shows error toast
  } finally {
    bulkLoading.value = false
  }
}

async function onBulkDelete() {
  if (!hasSelection.value || bulkLoading.value) return

  bulkLoading.value = true
  try {
    const result = await bulkDeleteUsers({
      ...buildBulkRequest(),
      revokeSsh: revokeSsh.value,
    })
    bulkResultModal.value = { type: 'delete', data: result }
    showDeleteConfirm.value = false

    if ((result.pending ?? 0) > 0) {
      ui.pushToast({
        type: 'warning',
        message: `已删除 ${result.deleted ?? 0} 个；${result.pending} 个 SSH 撤销进行中，请稍后重试删除`,
      })
    } else {
      ui.pushToast({ type: 'success', message: `已删除 ${result.deleted ?? 0} 个用户` })
    }

    clearSelection()
    void fetchUsers()
  } catch {
    // http interceptor shows error toast
  } finally {
    bulkLoading.value = false
  }
}

function onPrevPage() {
  if (canGoPrev.value) page.value -= 1
}

function onNextPage() {
  if (canGoNext.value) page.value += 1
}

onMounted(() => void fetchUsers())

watch([filterStatus, filterCohort], () => {
  clearSelection()
  page.value = 1
  void fetchUsers()
})

watch(page, () => {
  clearSelection()
  void fetchUsers()
})

watch(items, () => {
  if (selectedUserId.value == null) return
  if (!items.value.some((u) => u.id === selectedUserId.value)) {
    selectedUserId.value = null
  }
})

watch(hasSelection, (selected) => {
  if (!selected) showDeleteConfirm.value = false
})
</script>

<template>
  <div>
    <div class="mx-auto max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
      <header class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">管理</p>
          <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">用户管理</h1>
          <p class="mt-2 text-sm text-slate-500">查看、编辑、禁用或删除 GSAD 账号。</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input
            v-model="filterCohort"
            type="text"
            placeholder="届别筛选"
            class="h-9 min-w-[7rem] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
          />
          <select
            v-model="filterStatus"
            class="h-9 min-w-[9rem] rounded-md border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none ring-slate-300 transition focus:ring-2"
          >
            <option v-for="opt in STATUS_OPTIONS" :key="String(opt.value)" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <button
            type="button"
            class="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
            :disabled="loading"
            @click="fetchUsers"
          >
            <RefreshCw class="size-4" :class="loading ? 'animate-spin' : ''" />
            刷新
          </button>
          <RouterLink
            to="/admin/users/import"
            class="inline-flex h-9 items-center gap-1.5 rounded-md bg-slate-900 px-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            <Upload class="size-4" />
            导入用户
          </RouterLink>
        </div>
      </header>

      <div
        v-if="errorMessage"
        class="mb-4 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      >
        <span class="flex-1">{{ errorMessage }}</span>
        <button
          type="button"
          class="font-medium underline-offset-2 hover:underline"
          @click="fetchUsers"
        >
          重试
        </button>
      </div>

      <div
        v-if="items.length > 0"
        class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-zinc-50 px-4 py-3"
      >
        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:opacity-40"
            :disabled="pageIds.length === 0"
            @click="selectPageAll"
          >
            全选本页
          </button>
          <button
            type="button"
            class="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:opacity-40"
            :disabled="total === 0"
            @click="selectAllFiltered"
          >
            全选全部 ({{ total }})
          </button>
          <button
            type="button"
            class="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:opacity-40"
            :disabled="!hasSelection"
            @click="clearSelection"
          >
            取消全选
          </button>
        </div>
        <span class="text-sm text-slate-600">{{ selectionStatusText }}</span>
      </div>

      <div
        v-if="items.length > 0"
        class="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-zinc-50 px-4 py-3"
      >
        <button
          type="button"
          class="h-8 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-40"
          :disabled="!hasSelection || bulkLoading"
          @click="onBulkEnable"
        >
          {{ bulkLoading ? '处理中…' : '启用选中' }}
        </button>
        <button
          type="button"
          class="h-8 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:opacity-40"
          :disabled="!hasSelection || bulkLoading"
          @click="onBulkDisable"
        >
          {{ bulkLoading ? '处理中…' : '禁用选中' }}
        </button>
        <button
          type="button"
          class="h-8 rounded-md border border-red-200 bg-red-50 px-3 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-40"
          :disabled="!hasSelection || bulkLoading"
          @click="showDeleteConfirm = !showDeleteConfirm"
        >
          删除选中
        </button>
      </div>

      <div
        v-if="showDeleteConfirm && hasSelection"
        class="mb-4 space-y-3 rounded-lg border border-red-200 bg-red-50/60 p-4"
      >
        <p class="text-sm font-medium text-red-900">确认删除选中的 {{ selectionCount }} 个 GSAD 账号？</p>
        <p class="text-xs leading-relaxed text-red-800/90">此操作不可恢复。关联的申请记录将一并删除。</p>
        <label class="flex cursor-pointer items-start gap-2 text-sm text-red-900">
          <input v-model="revokeSsh" type="checkbox" class="mt-0.5 size-4 rounded border-red-300" />
          <span>同时撤销并删除服务器上的 SSH/GPU 账号</span>
        </label>
        <p v-if="deleteWarning" class="text-xs leading-relaxed text-amber-800">{{ deleteWarning }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50"
            :disabled="bulkLoading"
            @click="showDeleteConfirm = false"
          >
            取消
          </button>
          <button
            type="button"
            class="h-9 rounded-md bg-red-700 px-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
            :disabled="bulkLoading"
            @click="onBulkDelete"
          >
            {{ bulkLoading ? '处理中…' : '确认删除' }}
          </button>
        </div>
      </div>

      <div v-if="loading && items.length === 0" class="space-y-2">
        <div
          v-for="i in 4"
          :key="i"
          class="h-14 animate-pulse rounded-xl border border-slate-100 bg-zinc-100/80"
        />
      </div>

      <div
        v-else-if="!loading && items.length === 0"
        class="rounded-xl border border-dashed border-slate-200 bg-zinc-50/60 px-6 py-14 text-center"
      >
        <p class="text-sm text-slate-500">
          {{
            filterStatus !== 'all' || filterCohort.trim()
              ? '当前筛选条件下暂无用户'
              : '暂无用户'
          }}
        </p>
      </div>

      <div v-else class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table class="w-full text-sm">
          <thead>
            <tr
              class="border-b border-slate-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-slate-500"
            >
              <th class="w-10 px-4 py-3" aria-hidden="true"></th>
              <th class="whitespace-nowrap px-4 py-3 text-left">邮箱</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">Linux 用户名</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">姓名</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">届别</th>
              <th class="whitespace-nowrap px-4 py-3 text-left">状态</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr
              v-for="user in items"
              :key="user.id"
              class="cursor-pointer transition-colors hover:bg-zinc-50/70"
              @click="openDrawer(user)"
            >
              <td class="px-4 py-3" @click.stop>
                <input
                  type="checkbox"
                  class="size-4 rounded border-slate-300"
                  :checked="isRowSelected(user)"
                  @change="toggleRow(user, $event)"
                />
              </td>
              <td class="px-4 py-3 text-slate-800">{{ user.email }}</td>
              <td class="px-4 py-3 font-mono text-xs text-slate-600">{{ user.linuxUsername }}</td>
              <td class="px-4 py-3 text-slate-700">{{ user.displayName || '—' }}</td>
              <td class="px-4 py-3 text-slate-600">{{ user.cohort || '—' }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
                  :class="statusClass(user.status)"
                >
                  {{ statusLabel(user.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          class="flex flex-col gap-3 border-t border-slate-100 bg-zinc-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p class="text-sm text-slate-500">
            共 {{ total }} 条
            <span v-if="totalPages > 1" class="text-slate-400"> · 第 {{ page }} / {{ totalPages }} 页 </span>
          </p>
          <div v-if="totalPages > 1" class="flex items-center gap-2">
            <button
              type="button"
              class="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canGoPrev || loading"
              @click="onPrevPage"
            >
              上一页
            </button>
            <button
              type="button"
              class="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              :disabled="!canGoNext || loading"
              @click="onNextPage"
            >
              下一页
            </button>
          </div>
        </div>
      </div>
    </div>

    <AdminUserEditDrawer
      :user="selectedUser"
      @close="closeDrawer"
      @updated="onUserUpdated"
      @deleted="onUserDeleted"
    />

    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="bulkResultModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          aria-modal="true"
          role="dialog"
          @click="handleBulkModalBackdrop"
        >
          <div class="absolute inset-0 bg-black/25 backdrop-blur-[2px]" />

          <Transition name="modal-scale">
            <div
              v-if="bulkResultModal"
              class="relative z-10 w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
            >
              <div class="mb-4 flex items-start justify-between gap-4">
                <h2 class="text-base font-semibold text-slate-900">
                  {{
                    bulkResultModal.type === 'disable'
                      ? '批量禁用结果'
                      : bulkResultModal.type === 'enable'
                        ? '批量启用结果'
                        : '批量删除结果'
                  }}
                </h2>
                <button
                  type="button"
                  class="rounded-md p-1 text-slate-400 transition hover:bg-zinc-100 hover:text-slate-700"
                  aria-label="关闭"
                  @click="closeBulkResultModal"
                >
                  <X class="size-4" />
                </button>
              </div>

              <template v-if="bulkResultModal.type === 'disable'">
                <dl class="grid grid-cols-3 gap-4 text-center">
                  <div class="rounded-lg bg-emerald-50 px-3 py-2">
                    <dt class="text-xs text-emerald-700">已禁用</dt>
                    <dd class="text-lg font-semibold text-emerald-900">
                      {{ bulkResultModal.data.disabled ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-amber-50 px-3 py-2">
                    <dt class="text-xs text-amber-700">跳过</dt>
                    <dd class="text-lg font-semibold text-amber-900">
                      {{ bulkResultModal.data.skipped ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-red-50 px-3 py-2">
                    <dt class="text-xs text-red-700">错误</dt>
                    <dd class="text-lg font-semibold text-red-900">
                      {{ bulkResultModal.data.errors?.length ?? 0 }}
                    </dd>
                  </div>
                </dl>
                <div
                  v-if="(bulkResultModal.data.errors?.length ?? 0) > 0"
                  class="mt-4 max-h-48 overflow-y-auto"
                >
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="border-b border-slate-100 text-xs text-slate-500">
                        <th class="pb-2 pr-4 font-medium">邮箱</th>
                        <th class="pb-2 font-medium">原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(err, idx) in bulkResultModal.data.errors"
                        :key="`${err.userId}-${idx}`"
                        class="border-b border-slate-50"
                      >
                        <td class="py-2 pr-4 text-slate-700">{{ err.email }}</td>
                        <td class="py-2 text-slate-600">{{ err.reason }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <template v-else-if="bulkResultModal.type === 'enable'">
                <dl class="grid grid-cols-3 gap-4 text-center">
                  <div class="rounded-lg bg-emerald-50 px-3 py-2">
                    <dt class="text-xs text-emerald-700">已启用</dt>
                    <dd class="text-lg font-semibold text-emerald-900">
                      {{ bulkResultModal.data.enabled ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-amber-50 px-3 py-2">
                    <dt class="text-xs text-amber-700">跳过</dt>
                    <dd class="text-lg font-semibold text-amber-900">
                      {{ bulkResultModal.data.skipped ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-red-50 px-3 py-2">
                    <dt class="text-xs text-red-700">错误</dt>
                    <dd class="text-lg font-semibold text-red-900">
                      {{ bulkResultModal.data.errors?.length ?? 0 }}
                    </dd>
                  </div>
                </dl>
                <div
                  v-if="(bulkResultModal.data.errors?.length ?? 0) > 0"
                  class="mt-4 max-h-48 overflow-y-auto"
                >
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="border-b border-slate-100 text-xs text-slate-500">
                        <th class="pb-2 pr-4 font-medium">邮箱</th>
                        <th class="pb-2 font-medium">原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(err, idx) in bulkResultModal.data.errors"
                        :key="`${err.userId}-${idx}`"
                        class="border-b border-slate-50"
                      >
                        <td class="py-2 pr-4 text-slate-700">{{ err.email }}</td>
                        <td class="py-2 text-slate-600">{{ err.reason }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <template v-else>
                <dl class="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                  <div class="rounded-lg bg-emerald-50 px-3 py-2">
                    <dt class="text-xs text-emerald-700">已删除</dt>
                    <dd class="text-lg font-semibold text-emerald-900">
                      {{ bulkResultModal.data.deleted ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-blue-50 px-3 py-2">
                    <dt class="text-xs text-blue-700">待撤销</dt>
                    <dd class="text-lg font-semibold text-blue-900">
                      {{ bulkResultModal.data.pending ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-amber-50 px-3 py-2">
                    <dt class="text-xs text-amber-700">跳过</dt>
                    <dd class="text-lg font-semibold text-amber-900">
                      {{ bulkResultModal.data.skipped ?? 0 }}
                    </dd>
                  </div>
                  <div class="rounded-lg bg-red-50 px-3 py-2">
                    <dt class="text-xs text-red-700">错误</dt>
                    <dd class="text-lg font-semibold text-red-900">
                      {{ bulkResultModal.data.errors?.length ?? 0 }}
                    </dd>
                  </div>
                </dl>
                <div
                  v-if="(bulkResultModal.data.errors?.length ?? 0) > 0"
                  class="mt-4 max-h-48 overflow-y-auto"
                >
                  <table class="w-full text-left text-sm">
                    <thead>
                      <tr class="border-b border-slate-100 text-xs text-slate-500">
                        <th class="pb-2 pr-4 font-medium">邮箱</th>
                        <th class="pb-2 font-medium">原因</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="(err, idx) in bulkResultModal.data.errors"
                        :key="`${err.userId}-${idx}`"
                        class="border-b border-slate-50"
                      >
                        <td class="py-2 pr-4 text-slate-700">{{ err.email }}</td>
                        <td class="py-2 text-slate-600">{{ err.reason }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </template>

              <div class="mt-6 flex justify-end">
                <button
                  type="button"
                  class="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
                  @click="closeBulkResultModal"
                >
                  知道了
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
