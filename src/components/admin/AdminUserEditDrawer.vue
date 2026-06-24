<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'

import { deleteAdminUser, resetAdminUserPassword, updateAdminUser } from '@/api/admin'
import { useUiStore } from '@/stores/ui'
import type { AdminUserVO, UpdateAdminUserRequest, UserStatus } from '@/types/apiEnvelope'

const props = defineProps<{
  user: AdminUserVO | null
}>()

const emit = defineEmits<{
  close: []
  updated: [AdminUserVO]
  deleted: []
}>()

const ui = useUiStore()

const isOpen = computed(() => props.user !== null)

const displayName = ref('')
const cohort = ref('')
const notes = ref('')
const label = ref('')
const status = ref<UserStatus>('ACTIVE')

const saving = ref(false)
const showDeleteConfirm = ref(false)
const revokeSsh = ref(false)
const deleting = ref(false)

const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 128
const resetNewPassword = ref('')
const resetConfirmPassword = ref('')
const resetPasswordVisible = ref(false)
const resetConfirmVisible = ref(false)
const resettingPassword = ref(false)
const resetPasswordError = ref('')

watch(
  () => props.user,
  (user) => {
    displayName.value = user?.displayName ?? ''
    cohort.value = user?.cohort ?? ''
    notes.value = user?.notes ?? ''
    label.value = user?.label ?? ''
    status.value = user?.status ?? 'ACTIVE'
    showDeleteConfirm.value = false
    revokeSsh.value = false
    saving.value = false
    deleting.value = false
    resetNewPassword.value = ''
    resetConfirmPassword.value = ''
    resetPasswordVisible.value = false
    resetConfirmVisible.value = false
    resettingPassword.value = false
    resetPasswordError.value = ''
  },
  { immediate: true },
)

const activeAccessCount = computed(() => props.user?.activeAccessCount ?? 0)

const isAdminAccount = computed(
  () => props.user?.roles?.some((role) => role.toLowerCase() === 'admin') ?? false,
)

const deleteWarning = computed(() => {
  if (activeAccessCount.value <= 0) return null
  if (revokeSsh.value) {
    return `该用户有 ${activeAccessCount.value} 个活跃/撤销中的 GPU 访问，勾选后将发起服务器账号回收。`
  }
  return `该用户有 ${activeAccessCount.value} 个活跃 GPU 访问；不勾选时服务器 SSH 账号将保留。`
})

function handleBackdrop(e: MouseEvent) {
  if (e.target === e.currentTarget) emit('close')
}

async function onSave() {
  const user = props.user
  if (!user?.id || saving.value) return

  saving.value = true
  try {
    const body: UpdateAdminUserRequest = {
      displayName: displayName.value.trim() || null,
      cohort: cohort.value.trim() || null,
      notes: notes.value.trim() || null,
      label: label.value.trim() || null,
      status: status.value,
    }
    const updated = await updateAdminUser(user.id, body)
    ui.pushToast({ type: 'success', message: '用户已更新' })
    emit('updated', updated)
  } catch {
    // http interceptor shows error toast
  } finally {
    saving.value = false
  }
}

async function onResetPassword() {
  const user = props.user
  if (!user?.id || resettingPassword.value) return

  resetPasswordError.value = ''
  const pwd = resetNewPassword.value
  if (pwd.length < MIN_PASSWORD_LEN) {
    resetPasswordError.value = `密码至少 ${MIN_PASSWORD_LEN} 位`
    return
  }
  if (pwd.length > MAX_PASSWORD_LEN) {
    resetPasswordError.value = `密码不得超过 ${MAX_PASSWORD_LEN} 位`
    return
  }
  if (pwd !== resetConfirmPassword.value) {
    resetPasswordError.value = '两次输入的密码不一致'
    return
  }

  resettingPassword.value = true
  try {
    await resetAdminUserPassword(user.id, { newPassword: pwd })
    ui.pushToast({ type: 'success', message: '登录密码已重置' })
    resetNewPassword.value = ''
    resetConfirmPassword.value = ''
  } catch {
    // http interceptor shows error toast
  } finally {
    resettingPassword.value = false
  }
}

async function onDelete() {
  const user = props.user
  if (!user?.id || deleting.value) return

  deleting.value = true
  try {
    const result = await deleteAdminUser(user.id, revokeSsh.value)
    if (result.deleted) {
      ui.pushToast({ type: 'success', message: '用户已删除' })
      emit('deleted')
      emit('close')
      return
    }
    ui.pushToast({
      type: 'warning',
      message: `已发起撤销（${result.pendingRevokes} 个待完成），请稍后重试删除`,
    })
    showDeleteConfirm.value = false
  } catch {
    // http interceptor shows error toast
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer-fade">
      <div
        v-if="isOpen && user"
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
                  用户详情
                </p>
                <p class="mt-0.5 text-sm font-semibold text-slate-800">{{ user.email }}</p>
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

            <form class="flex-1 space-y-4 px-6 py-5" @submit.prevent="onSave">
              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">邮箱</p>
                <p class="text-sm text-slate-800">{{ user.email }}</p>
              </div>
              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">Linux 用户名</p>
                <p class="font-mono text-sm text-slate-800">{{ user.linuxUsername }}</p>
              </div>
              <div v-if="user.studentId">
                <p class="mb-1 text-xs font-medium text-slate-500">学号</p>
                <p class="text-sm text-slate-800">{{ user.studentId }}</p>
              </div>

              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-display-name">
                  姓名
                </label>
                <input
                  id="u-display-name"
                  v-model="displayName"
                  type="text"
                  class="h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-cohort">
                  届别
                </label>
                <input
                  id="u-cohort"
                  v-model="cohort"
                  type="text"
                  class="h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-label">
                  标签
                </label>
                <input
                  id="u-label"
                  v-model="label"
                  type="text"
                  class="h-9 w-full rounded-md border border-slate-200 px-3 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-notes">
                  备注
                </label>
                <textarea
                  id="u-notes"
                  v-model="notes"
                  rows="3"
                  class="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                />
              </div>
              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-status">
                  状态
                </label>
                <select
                  v-if="!isAdminAccount"
                  id="u-status"
                  v-model="status"
                  class="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                >
                  <option value="ACTIVE">启用</option>
                  <option value="INACTIVE">禁用</option>
                </select>
                <p v-else class="text-sm text-slate-800">启用</p>
                <p v-if="isAdminAccount" class="mt-1 text-xs text-slate-500">
                  管理员账号不可禁用或删除
                </p>
              </div>

              <div class="flex gap-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  class="h-10 flex-1 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                  :disabled="saving"
                >
                  {{ saving ? '保存中…' : '保存' }}
                </button>
              </div>
            </form>

            <div v-if="!isAdminAccount" class="border-t border-slate-100 px-6 py-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                重置登录密码
              </p>
              <div class="space-y-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-500" for="u-reset-pwd">
                    新密码
                  </label>
                  <div class="relative">
                    <input
                      id="u-reset-pwd"
                      v-model="resetNewPassword"
                      :type="resetPasswordVisible ? 'text' : 'password'"
                      autocomplete="new-password"
                      class="h-9 w-full rounded-md border border-slate-200 px-3 pr-10 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                      :aria-label="resetPasswordVisible ? '隐藏密码' : '显示密码'"
                      @click="resetPasswordVisible = !resetPasswordVisible"
                    >
                      {{ resetPasswordVisible ? '隐藏' : '显示' }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-500" for="u-reset-confirm">
                    确认新密码
                  </label>
                  <div class="relative">
                    <input
                      id="u-reset-confirm"
                      v-model="resetConfirmPassword"
                      :type="resetConfirmVisible ? 'text' : 'password'"
                      autocomplete="new-password"
                      class="h-9 w-full rounded-md border border-slate-200 px-3 pr-10 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                    />
                    <button
                      type="button"
                      class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                      :aria-label="resetConfirmVisible ? '隐藏密码' : '显示密码'"
                      @click="resetConfirmVisible = !resetConfirmVisible"
                    >
                      {{ resetConfirmVisible ? '隐藏' : '显示' }}
                    </button>
                  </div>
                </div>
                <p v-if="resetPasswordError" class="text-xs text-red-600">{{ resetPasswordError }}</p>
                <button
                  type="button"
                  class="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:opacity-60"
                  :disabled="resettingPassword || !resetNewPassword || !resetConfirmPassword"
                  @click="onResetPassword"
                >
                  {{ resettingPassword ? '重置中…' : '重置密码' }}
                </button>
              </div>
            </div>

            <div v-if="!isAdminAccount" class="border-t border-slate-100 px-6 py-4">
              <div v-if="!showDeleteConfirm">
                <button
                  type="button"
                  class="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-800 transition hover:bg-red-100"
                  @click="showDeleteConfirm = true"
                >
                  <Trash2 class="size-4" />
                  删除账号
                </button>
              </div>
              <div v-else class="space-y-3 rounded-lg border border-red-200 bg-red-50/60 p-4">
                <p class="text-sm font-medium text-red-900">确认删除 GSAD 账号？</p>
                <p class="text-xs leading-relaxed text-red-800/90">
                  此操作不可恢复。关联的申请记录将一并删除。
                </p>
                <label class="flex cursor-pointer items-start gap-2 text-sm text-red-900">
                  <input
                    v-model="revokeSsh"
                    type="checkbox"
                    class="mt-0.5 size-4 rounded border-red-300"
                  />
                  <span>同时撤销并删除服务器上的 SSH/GPU 账号</span>
                </label>
                <p v-if="deleteWarning" class="text-xs leading-relaxed text-amber-800">
                  {{ deleteWarning }}
                </p>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="h-9 flex-1 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50"
                    :disabled="deleting"
                    @click="showDeleteConfirm = false"
                  >
                    取消
                  </button>
                  <button
                    type="button"
                    class="h-9 flex-1 rounded-md bg-red-700 px-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
                    :disabled="deleting"
                    @click="onDelete"
                  >
                    {{ deleting ? '处理中…' : '确认删除' }}
                  </button>
                </div>
              </div>
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
