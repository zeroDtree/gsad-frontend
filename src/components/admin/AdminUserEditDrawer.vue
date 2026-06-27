<script setup lang="ts">
import { Trash2, X } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

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

const { t } = useI18n()
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
    return t('admin.userDeleteWarningWithRevoke', { count: activeAccessCount.value })
  }
  return t('admin.userDeleteWarningNoRevoke', { count: activeAccessCount.value })
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
    ui.pushToast({ type: 'success', message: t('admin.userUpdated') })
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
    resetPasswordError.value = t('validation.passwordMinLength', { min: MIN_PASSWORD_LEN })
    return
  }
  if (pwd.length > MAX_PASSWORD_LEN) {
    resetPasswordError.value = t('validation.passwordMaxLength', { max: MAX_PASSWORD_LEN })
    return
  }
  if (pwd !== resetConfirmPassword.value) {
    resetPasswordError.value = t('validation.passwordMismatch')
    return
  }

  resettingPassword.value = true
  try {
    await resetAdminUserPassword(user.id, { newPassword: pwd })
    ui.pushToast({ type: 'success', message: t('admin.passwordReset') })
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
      ui.pushToast({ type: 'success', message: t('admin.userDeleted') })
      emit('deleted')
      emit('close')
      return
    }
    ui.pushToast({
      type: 'warning',
      message: t('admin.revokePendingRetry', { count: result.pendingRevokes }),
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
                  {{ t('admin.userDetail') }}
                </p>
                <p class="mt-0.5 text-sm font-semibold text-slate-800">{{ user.email }}</p>
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

            <form class="flex-1 space-y-4 px-6 py-5" @submit.prevent="onSave">
              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">{{ t('admin.colEmail') }}</p>
                <p class="text-sm text-slate-800">{{ user.email }}</p>
              </div>
              <div>
                <p class="mb-1 text-xs font-medium text-slate-500">
                  {{ t('admin.colLinuxUsername') }}
                </p>
                <p class="font-mono text-sm text-slate-800">{{ user.linuxUsername }}</p>
              </div>
              <div v-if="user.studentId">
                <p class="mb-1 text-xs font-medium text-slate-500">{{ t('admin.studentId') }}</p>
                <p class="text-sm text-slate-800">{{ user.studentId }}</p>
              </div>

              <div>
                <label class="mb-1 block text-xs font-medium text-slate-500" for="u-display-name">
                  {{ t('admin.name') }}
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
                  {{ t('admin.cohort') }}
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
                  {{ t('admin.tags') }}
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
                  {{ t('admin.notes') }}
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
                  {{ t('common.status') }}
                </label>
                <select
                  v-if="!isAdminAccount"
                  id="u-status"
                  v-model="status"
                  class="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none ring-slate-300 focus:ring-2"
                >
                  <option value="ACTIVE">{{ t('admin.statusActive') }}</option>
                  <option value="INACTIVE">{{ t('admin.statusInactive') }}</option>
                </select>
                <p v-else class="text-sm text-slate-800">{{ t('admin.statusActive') }}</p>
                <p v-if="isAdminAccount" class="mt-1 text-xs text-slate-500">
                  {{ t('admin.adminCannotDisable') }}
                </p>
              </div>

              <div class="flex gap-2 border-t border-slate-100 pt-4">
                <button
                  type="submit"
                  class="h-10 flex-1 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
                  :disabled="saving"
                >
                  {{ saving ? t('admin.saving') : t('common.save') }}
                </button>
              </div>
            </form>

            <div v-if="!isAdminAccount" class="border-t border-slate-100 px-6 py-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                {{ t('admin.resetLoginPassword') }}
              </p>
              <div class="space-y-3">
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-500" for="u-reset-pwd">
                    {{ t('auth.newPassword') }}
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
                      :aria-label="
                        resetPasswordVisible ? t('common.hidePassword') : t('common.showPassword')
                      "
                      @click="resetPasswordVisible = !resetPasswordVisible"
                    >
                      {{ resetPasswordVisible ? t('common.hide') : t('common.show') }}
                    </button>
                  </div>
                </div>
                <div>
                  <label class="mb-1 block text-xs font-medium text-slate-500" for="u-reset-confirm">
                    {{ t('auth.confirmPassword') }}
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
                      :aria-label="
                        resetConfirmVisible ? t('common.hidePassword') : t('common.showPassword')
                      "
                      @click="resetConfirmVisible = !resetConfirmVisible"
                    >
                      {{ resetConfirmVisible ? t('common.hide') : t('common.show') }}
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
                  {{ resettingPassword ? t('admin.resettingPassword') : t('admin.resetPassword') }}
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
                  {{ t('admin.deleteAccount') }}
                </button>
              </div>
              <div v-else class="space-y-3 rounded-lg border border-red-200 bg-red-50/60 p-4">
                <p class="text-sm font-medium text-red-900">{{ t('admin.confirmDeleteAccount') }}</p>
                <p class="text-xs leading-relaxed text-red-800/90">
                  {{ t('admin.deleteWarning') }}
                </p>
                <label class="flex cursor-pointer items-start gap-2 text-sm text-red-900">
                  <input
                    v-model="revokeSsh"
                    type="checkbox"
                    class="mt-0.5 size-4 rounded border-red-300"
                  />
                  <span>{{ t('admin.revokeSshOnDelete') }}</span>
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
                    {{ t('common.cancel') }}
                  </button>
                  <button
                    type="button"
                    class="h-9 flex-1 rounded-md bg-red-700 px-3 text-sm font-medium text-white transition hover:bg-red-800 disabled:opacity-60"
                    :disabled="deleting"
                    @click="onDelete"
                  >
                    {{ deleting ? t('common.processing') : t('admin.confirmDelete') }}
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
