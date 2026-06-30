<script setup lang="ts">
import { Copy, Eye, EyeOff, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AuditStatusBadge from '@/components/application/AuditStatusBadge.vue'
import { formatLocalDateTime, formatRelativeFromUtc } from '@/lib/dayjs'
import { useApplicationsStore } from '@/stores/applications'
import { useUiStore } from '@/stores/ui'
import type { ApplicationItem } from '@/types/application'

const props = defineProps<{
  application: ApplicationItem | null
}>()

const emit = defineEmits<{
  close: []
  updated: [ApplicationItem]
}>()

const { t } = useI18n()
const appStore = useApplicationsStore()
const ui = useUiStore()

const isOpen = computed(() => props.application !== null)
const passwordVisible = ref(false)
const revoking = ref(false)

const showAccessInfo = computed(() => {
  const app = props.application
  if (!app || app.audit_status !== 'ACTIVE') return false
  return !!(app.server_ip || app.ssh_username || app.initial_password)
})

const revokeLabel = computed(() => {
  const status = props.application?.audit_status
  if (status === 'APPROVED') return t('application.cancelApplication')
  if (status === 'ACTIVE' || status === 'FAILED_REVOKE') return t('application.revokeAccess')
  return ''
})

const canRevoke = computed(() => {
  const status = props.application?.audit_status
  return status === 'APPROVED' || status === 'ACTIVE' || status === 'FAILED_REVOKE'
})

const revokeHint = computed(() => {
  const status = props.application?.audit_status
  if (status === 'APPROVED') return t('application.cancelHint')
  if (status === 'ACTIVE' || status === 'FAILED_REVOKE') return t('application.revokeHint')
  return null
})

watch(
  () => props.application?.id,
  () => {
    passwordVisible.value = false
    revoking.value = false
  },
)

async function copyValue(labelKey: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    ui.pushToast({ type: 'success', message: t('application.copied', { label: t(labelKey) }) })
  } catch {
    ui.pushToast({ type: 'error', message: t('application.copyFailed') })
  }
}

async function onRevoke() {
  const app = props.application
  if (!app || !canRevoke.value || revoking.value) return

  const message =
    app.audit_status === 'APPROVED'
      ? t('application.confirmCancel')
      : t('application.confirmRevoke')
  if (!window.confirm(message)) return

  revoking.value = true
  try {
    const updated = await appStore.revokeApplication(app.id)
    ui.pushToast({
      type: 'success',
      message:
        updated.audit_status === 'CANCELLED'
          ? t('application.cancelled')
          : t('application.revokeSubmitted'),
    })
    emit('updated', updated)
  } catch {
    // http interceptor shows error toast
  } finally {
    revoking.value = false
  }
}

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="isOpen && application"
        class="fixed inset-0 z-50 flex justify-end"
        aria-modal="true"
        role="dialog"
        @click="handleBackdrop"
      >
        <div class="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

        <Transition name="drawer-slide">
          <div
            v-if="isOpen"
            class="relative z-10 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white shadow-xl ring-1 ring-slate-200"
          >
            <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {{ t('application.detailTitle') }}
                </p>
                <p class="mt-0.5 font-mono text-sm font-semibold text-slate-800">
                  #{{ application.id }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-md p-1.5 text-slate-400 transition hover:bg-zinc-100 hover:text-slate-700"
                :aria-label="t('common.close')"
                @click="emit('close')"
              >
                <X class="size-4" />
              </button>
            </div>

            <div class="flex-1 space-y-5 px-6 py-5">
              <div>
                <p class="mb-1.5 text-xs font-medium text-slate-500">{{ t('common.status') }}</p>
                <AuditStatusBadge :status="application.audit_status" />
                <p
                  v-if="application.audit_status === 'REVOKING'"
                  class="mt-1.5 text-xs text-blue-600"
                >
                  {{ t('application.revokingHint') }}
                </p>
              </div>

              <div
                v-if="showAccessInfo"
                class="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4"
              >
                <p class="text-xs font-semibold text-emerald-900">
                  {{ t('application.connectionInfo') }}
                </p>
                <p class="mt-1 text-[11px] leading-relaxed text-emerald-800/80">
                  {{ t('application.connectionHint') }}
                </p>
                <dl class="mt-3 space-y-3">
                  <div v-if="application.server_ip">
                    <dt class="text-xs font-medium text-emerald-900/70">
                      {{ t('application.serverIp') }}
                    </dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ application.server_ip }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        :aria-label="t('application.copyServerIp')"
                        @click="copyValue('application.serverIp', application.server_ip!)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                  <div v-if="application.ssh_username">
                    <dt class="text-xs font-medium text-emerald-900/70">
                      {{ t('application.username') }}
                    </dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ application.ssh_username }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        :aria-label="t('application.copyUsername')"
                        @click="copyValue('application.username', application.ssh_username!)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                  <div v-if="application.initial_password">
                    <dt class="text-xs font-medium text-emerald-900/70">
                      {{ t('application.initialPassword') }}
                    </dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ passwordVisible ? application.initial_password : '••••••••••••' }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        :aria-label="
                          passwordVisible ? t('common.hidePassword') : t('common.showPassword')
                        "
                        @click="passwordVisible = !passwordVisible"
                      >
                        <EyeOff v-if="passwordVisible" class="size-3.5" />
                        <Eye v-else class="size-3.5" />
                      </button>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        :aria-label="t('application.copyInitialPassword')"
                        @click="
                          copyValue('application.initialPassword', application.initial_password!)
                        "
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">
                  {{ t('application.colServerId') }}
                </p>
                <p class="break-all font-mono text-sm font-medium text-slate-900">
                  {{ application.server_id || '—' }}
                </p>
              </div>

              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">
                  {{ t('application.installMiniconda') }}
                </p>
                <p class="text-sm text-slate-700">
                  {{
                    application.install_miniconda
                      ? t('application.installMinicondaYes')
                      : t('application.installMinicondaNo')
                  }}
                </p>
              </div>

              <div
                v-if="
                  application.comment &&
                  application.audit_status !== 'FAILED_GRANT' &&
                  application.audit_status !== 'FAILED_REVOKE'
                "
              >
                <p class="mb-1.5 text-xs font-medium text-slate-500">
                  {{ t('application.comment') }}
                </p>
                <p
                  class="rounded-lg border border-slate-100 bg-zinc-50 p-3 text-sm leading-relaxed text-slate-700"
                >
                  {{ application.comment }}
                </p>
              </div>

              <div
                v-if="
                  application.audit_status === 'FAILED_GRANT' ||
                  application.audit_status === 'FAILED_REVOKE'
                "
              >
                <p class="mb-1.5 text-xs font-medium text-slate-500">
                  {{ t('application.failureReason') }}
                </p>
                <p
                  v-if="application.comment"
                  class="rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-relaxed text-red-800"
                >
                  {{ application.comment }}
                </p>
                <p v-else class="text-sm text-slate-500">{{ t('application.noFailureDetail') }}</p>
              </div>

              <div class="border-t border-slate-100 pt-4">
                <p class="mb-1 text-xs font-medium text-slate-500">
                  {{ t('application.lastUpdated') }}
                </p>
                <p class="text-xs text-slate-500">
                  {{ formatLocalDateTime(application.updated_at) }}
                  <span class="ml-1 text-slate-400"
                    >（{{ formatRelativeFromUtc(application.updated_at) }}）</span
                  >
                </p>
              </div>
            </div>

            <div
              v-if="canRevoke || application.audit_status === 'REVOKING'"
              class="border-t border-slate-100 px-6 py-4"
            >
              <p
                v-if="canRevoke && revokeHint"
                class="mb-2 text-xs leading-relaxed"
                :class="
                  application.audit_status === 'APPROVED' ? 'text-slate-500' : 'text-red-700/90'
                "
              >
                {{ revokeHint }}
              </p>
              <button
                v-if="canRevoke"
                type="button"
                class="h-10 w-full rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-800 transition hover:bg-red-100 disabled:opacity-60"
                :disabled="revoking"
                @click="onRevoke"
              >
                {{ revoking ? t('common.processing') : revokeLabel }}
              </button>
              <p v-else class="text-center text-sm text-slate-500">
                {{ t('application.revoking') }}
              </p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-fade-enter-active,
.drawer-fade-leave-active {
  transition: opacity 0.2s ease;
}
.drawer-fade-enter-from,
.drawer-fade-leave-to {
  opacity: 0;
}
.drawer-slide-enter-active,
.drawer-slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.drawer-slide-enter-from,
.drawer-slide-leave-to {
  transform: translateX(100%);
}
</style>
