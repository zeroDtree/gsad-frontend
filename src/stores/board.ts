import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { getApiMessage } from '@/api/errors'
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
    const set = new Set(items.value.map((i) => i.resourceLevel).filter(Boolean))
    return Array.from(set).sort()
  })

  const filteredItems = computed(() =>
    items.value.filter((s) => {
      if (filterResourceLevel.value !== 'all' && s.resourceLevel !== filterResourceLevel.value) {
        return false
      }
      if (filterStatus.value !== 'all' && s.status !== filterStatus.value) {
        return false
      }
      return true
    }),
  )

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
      const msg = isAxiosError(e)
        ? getApiMessage(e.response?.data, e.message || '加载失败')
        : '加载失败'
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
    fetchBoard,
  }
})
