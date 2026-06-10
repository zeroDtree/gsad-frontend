import { isAxiosError } from 'axios'
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

import { getApiMessage } from '@/api/errors'
import { createApplication as apiCreate, getMyApplications } from '@/api/applications'
import type { ApplicationItem, AuditStatus, CreateApplicationPayload } from '@/types/application'

const DEFAULT_PAGE_SIZE = 20

let fetchSeq = 0

/** Generate a v4-like UUID for Idempotency-Key. Uses crypto.randomUUID when available. */
function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export const useApplicationsStore = defineStore('applications', () => {
  const items = ref<ApplicationItem[]>([])
  const loading = ref(false)
  const errorMessage = ref<string | null>(null)
  const filterStatus = ref<AuditStatus | 'all'>('all')
  const highlightId = ref<string | null>(null)
  const page = ref(1)
  const page_size = ref(DEFAULT_PAGE_SIZE)
  const total = ref(0)

  /** Poll interval for "my applications" page — 60 s per doc §5.3 */
  const pollIntervalMs = 60_000

  const totalPages = () => Math.max(1, Math.ceil(total.value / page_size.value))

  async function fetchMine(options?: { silent?: boolean; resetPage?: boolean }) {
    const silent = options?.silent ?? false
    if (options?.resetPage) page.value = 1
    if (!silent) loading.value = true
    errorMessage.value = null
    const seq = ++fetchSeq
    try {
      const result = await getMyApplications({
        status: filterStatus.value,
        page: page.value,
        page_size: page_size.value,
      })
      if (seq !== fetchSeq) return
      items.value = result.items
      total.value = result.total
      page.value = result.page
      page_size.value = result.page_size
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

  function setPage(next: number) {
    const clamped = Math.min(Math.max(1, next), totalPages())
    if (clamped === page.value) return
    page.value = clamped
    void fetchMine()
  }

  /**
   * Submit a new application.
   * Generates a fresh Idempotency-Key per submission.
   * Returns the created ApplicationItem id on success.
   */
  async function createApplication(payload: CreateApplicationPayload): Promise<string> {
    const idempotencyKey = generateIdempotencyKey()
    const created = await apiCreate(payload, idempotencyKey)
    filterStatus.value = 'all'
    page.value = 1
    await fetchMine({ silent: true })
    return created.id
  }

  function setHighlight(id: string | null) {
    highlightId.value = id
  }

  watch(filterStatus, () => {
    void fetchMine({ resetPage: true })
  })

  return {
    items,
    loading,
    errorMessage,
    filterStatus,
    highlightId,
    page,
    page_size,
    total,
    pollIntervalMs,
    totalPages,
    fetchMine,
    setPage,
    createApplication,
    setHighlight,
  }
})
