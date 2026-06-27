import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

const PAGE_SIZE = 20

import { getLocalizedError } from '@/api/errors'
import { t } from '@/i18n/t'
import { getServers } from '@/api/public'
import type { PublicServerItem, ServerStatus } from '@/types/public'

function readPollIntervalMs(): number {
  const n = Number(import.meta.env.VITE_BOARD_POLL_MS)
  if (Number.isFinite(n) && n >= 10_000 && n <= 300_000) return n
  return 45_000
}

let fetchSeq = 0

export const useBoardStore = defineStore('board', () => {
  const items = ref<PublicServerItem[]>([])
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const lastFetchedAt = ref<string | null>(null)
  const filterResourceLevel = ref<string | 'all'>('all')
  const filterStatus = ref<ServerStatus | 'all'>('all')

  const pollIntervalMs = readPollIntervalMs()

  const resourceLevels = computed(() => {
    const set = new Set(
      items.value.map((i) => i.resourceLevel).filter((lv): lv is string => Boolean(lv?.trim())),
    )
    return Array.from(set).sort()
  })

  const page = ref(1)

  const filteredItems = computed(() =>
    items.value.filter((s) => {
      if (
        filterResourceLevel.value !== 'all' &&
        (s.resourceLevel ?? '') !== filterResourceLevel.value
      ) {
        return false
      }
      if (filterStatus.value !== 'all' && s.status !== filterStatus.value) {
        return false
      }
      return true
    }),
  )

  const filteredTotal = computed(() => filteredItems.value.length)

  const totalPages = computed(() => Math.max(1, Math.ceil(filteredTotal.value / PAGE_SIZE)))

  const paginatedItems = computed(() => {
    const start = (page.value - 1) * PAGE_SIZE
    return filteredItems.value.slice(start, start + PAGE_SIZE)
  })

  function setPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages.value)
    if (clamped === page.value) return
    page.value = clamped
  }

  watch([filterResourceLevel, filterStatus], () => {
    page.value = 1
  })

  watch(filteredTotal, (total) => {
    const maxPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
    if (page.value > maxPage) page.value = maxPage
  })

  async function fetchBoard(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false
    if (!silent) loading.value = true
    errorMessage.value = null
    const seq = ++fetchSeq
    try {
      const servers = await getServers()
      if (seq !== fetchSeq) return
      items.value = servers
      lastFetchedAt.value = new Date().toISOString()
    } catch (e) {
      if (seq !== fetchSeq) return
      const msg = isAxiosError(e) ? getLocalizedError(e.response?.data) : t('common.loadFailed')
      errorMessage.value = msg
    } finally {
      if (!silent) loading.value = false
    }
  }

  return {
    items,
    loading,
    errorMessage,
    lastFetchedAt,
    filterResourceLevel,
    filterStatus,
    pollIntervalMs,
    resourceLevels,
    filteredItems,
    filteredTotal,
    page,
    pageSize: PAGE_SIZE,
    paginatedItems,
    setPage,
    fetchBoard,
  }
})
