<script setup lang="ts">
import { Copy, Eye, EyeOff, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

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
  if (status === 'APPROVED') return '取消申请'
  if (status === 'ACTIVE' || status === 'FAILED_REVOKE') return '撤销访问'
  return ''
})

const canRevoke = computed(() => {
  const status = props.application?.audit_status
  return status === 'APPROVED' || status === 'ACTIVE' || status === 'FAILED_REVOKE'
})

const revokeHint = computed(() => {
  const status = props.application?.audit_status
  if (status === 'APPROVED') {
    return '仅停止开通流程，服务器上尚未创建账号。'
  }
  if (status === 'ACTIVE' || status === 'FAILED_REVOKE') {
    return '撤销将删除该服务器上您的 Linux 账号及其全部数据，且不可恢复。'
  }
  return null
})

watch(
  () => props.application?.id,
  () => {
    passwordVisible.value = false
    revoking.value = false
  },
)

async function copyValue(label: string, value: string) {
  try {
    await navigator.clipboard.writeText(value)
    ui.pushToast({ type: 'success', message: `已复制${label}` })
  } catch {
    ui.pushToast({ type: 'error', message: '复制失败' })
  }
}

async function onRevoke() {
  const app = props.application
  if (!app || !canRevoke.value || revoking.value) return

  const message =
    app.audit_status === 'APPROVED'
      ? '确定取消该申请？开通流程将停止，服务器上尚未创建账号。'
      : '确定撤销访问？将删除该服务器上您的 Linux 账号及其全部数据，且不可恢复。'
  if (!window.confirm(message)) return

  revoking.value = true
  try {
    const updated = await appStore.revokeApplication(app.id)
    ui.pushToast({
      type: 'success',
      message: updated.audit_status === 'CANCELLED' ? '申请已取消' : '撤销已提交',
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
                  申请详情
                </p>
                <p class="mt-0.5 font-mono text-sm font-semibold text-slate-800">
                  #{{ application.id }}
                </p>
              </div>
              <button
                type="button"
                class="rounded-md p-1.5 text-slate-400 transition hover:bg-zinc-100 hover:text-slate-700"
                aria-label="关闭"
                @click="emit('close')"
              >
                <X class="size-4" />
              </button>
            </div>

            <div class="flex-1 space-y-5 px-6 py-5">
              <div>
                <p class="mb-1.5 text-xs font-medium text-slate-500">状态</p>
                <AuditStatusBadge :status="application.audit_status" />
                <p
                  v-if="application.audit_status === 'REVOKING'"
                  class="mt-1.5 text-xs text-blue-600"
                >
                  正在等待服务器回收账号…
                </p>
              </div>

              <div
                v-if="showAccessInfo"
                class="rounded-lg border border-emerald-200 bg-emerald-50/60 p-4"
              >
                <p class="text-xs font-semibold text-emerald-900">连接信息</p>
                <p class="mt-1 text-[11px] leading-relaxed text-emerald-800/80">
                  请妥善保管初始密码，首次登录后建议尽快修改。
                </p>
                <dl class="mt-3 space-y-3">
                  <div v-if="application.server_ip">
                    <dt class="text-xs font-medium text-emerald-900/70">服务器 IP</dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ application.server_ip }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        aria-label="复制服务器 IP"
                        @click="copyValue('服务器 IP', application.server_ip!)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                  <div v-if="application.ssh_username">
                    <dt class="text-xs font-medium text-emerald-900/70">用户名</dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ application.ssh_username }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        aria-label="复制用户名"
                        @click="copyValue('用户名', application.ssh_username!)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                  <div v-if="application.initial_password">
                    <dt class="text-xs font-medium text-emerald-900/70">初始密码</dt>
                    <dd class="mt-1 flex items-center gap-2">
                      <span class="min-w-0 flex-1 break-all font-mono text-sm text-emerald-950">
                        {{ passwordVisible ? application.initial_password : '••••••••••••' }}
                      </span>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
                        @click="passwordVisible = !passwordVisible"
                      >
                        <EyeOff v-if="passwordVisible" class="size-3.5" />
                        <Eye v-else class="size-3.5" />
                      </button>
                      <button
                        type="button"
                        class="shrink-0 rounded p-1 text-emerald-700 transition hover:bg-emerald-100"
                        aria-label="复制初始密码"
                        @click="copyValue('初始密码', application.initial_password!)"
                      >
                        <Copy class="size-3.5" />
                      </button>
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">服务器 ID</p>
                <p class="break-all font-mono text-sm font-medium text-slate-900">
                  {{ application.server_id || '—' }}
                </p>
              </div>

              <div
                v-if="
                  application.comment &&
                  application.audit_status !== 'FAILED_GRANT' &&
                  application.audit_status !== 'FAILED_REVOKE'
                "
              >
                <p class="mb-1.5 text-xs font-medium text-slate-500">备注</p>
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
                <p class="mb-1.5 text-xs font-medium text-slate-500">失败原因</p>
                <p
                  v-if="application.comment"
                  class="rounded-lg border border-red-100 bg-red-50 p-3 text-sm leading-relaxed text-red-800"
                >
                  {{ application.comment }}
                </p>
                <p v-else class="text-sm text-slate-500">暂无详细说明，请稍后重试或联系运维。</p>
              </div>

              <div class="border-t border-slate-100 pt-4">
                <p class="mb-1 text-xs font-medium text-slate-500">最后更新</p>
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
                {{ revoking ? '处理中…' : revokeLabel }}
              </button>
              <p v-else class="text-center text-sm text-slate-500">回收中…</p>
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
