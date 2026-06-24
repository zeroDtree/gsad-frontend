<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import { changePassword } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const router = useRouter()
const ui = useUiStore()

const MIN_PASSWORD_LEN = 8
const MAX_PASSWORD_LEN = 128

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const currentVisible = ref(false)
const newVisible = ref(false)
const confirmVisible = ref(false)
const submitting = ref(false)

const errors = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

function validate(): boolean {
  errors.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
  let ok = true

  if (!currentPassword.value) {
    errors.value.currentPassword = '请输入当前密码'
    ok = false
  }

  const pwd = newPassword.value
  if (pwd.length < MIN_PASSWORD_LEN) {
    errors.value.newPassword = `新密码至少 ${MIN_PASSWORD_LEN} 位`
    ok = false
  } else if (pwd.length > MAX_PASSWORD_LEN) {
    errors.value.newPassword = `新密码不得超过 ${MAX_PASSWORD_LEN} 位`
    ok = false
  } else if (pwd === currentPassword.value) {
    errors.value.newPassword = '新密码不能与当前密码相同'
    ok = false
  }

  if (confirmPassword.value !== newPassword.value) {
    errors.value.confirmPassword = '两次输入的密码不一致'
    ok = false
  }

  return ok
}

async function onSubmit() {
  if (!validate() || submitting.value) return

  submitting.value = true
  try {
    const session = await changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })
    auth.applySession(session.email, session.roles ?? [])
    ui.pushToast({ type: 'success', message: '密码已更新' })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    await router.replace('/board')
  } catch {
    // http interceptor shows error toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-lg px-6 py-8 lg:px-10 lg:py-10">
    <div class="mb-6">
      <h1 class="text-xl font-semibold tracking-tight text-slate-900">修改登录密码</h1>
      <p class="mt-1 text-sm text-slate-500">更新 GSAD 控制台登录密码</p>
    </div>

    <form
      class="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="cp-current">
          当前密码
        </label>
        <div class="relative">
          <input
            id="cp-current"
            v-model="currentPassword"
            :type="currentVisible ? 'text' : 'password'"
            autocomplete="current-password"
            required
            class="h-10 w-full rounded-md border px-3 pr-10 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            :class="errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            :aria-label="currentVisible ? '隐藏密码' : '显示密码'"
            @click="currentVisible = !currentVisible"
          >
            <EyeOff v-if="currentVisible" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.currentPassword" class="mt-1 text-xs text-red-600">
          {{ errors.currentPassword }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="cp-new"> 新密码 </label>
        <div class="relative">
          <input
            id="cp-new"
            v-model="newPassword"
            :type="newVisible ? 'text' : 'password'"
            autocomplete="new-password"
            required
            class="h-10 w-full rounded-md border px-3 pr-10 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            :class="errors.newPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            :aria-label="newVisible ? '隐藏密码' : '显示密码'"
            @click="newVisible = !newVisible"
          >
            <EyeOff v-if="newVisible" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.newPassword" class="mt-1 text-xs text-red-600">{{ errors.newPassword }}</p>
        <p v-else class="mt-1 text-xs text-slate-500">至少 8 位，最多 128 位</p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="cp-confirm">
          确认新密码
        </label>
        <div class="relative">
          <input
            id="cp-confirm"
            v-model="confirmPassword"
            :type="confirmVisible ? 'text' : 'password'"
            autocomplete="new-password"
            required
            class="h-10 w-full rounded-md border px-3 pr-10 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            :class="errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            :aria-label="confirmVisible ? '隐藏密码' : '显示密码'"
            @click="confirmVisible = !confirmVisible"
          >
            <EyeOff v-if="confirmVisible" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="mt-1 text-xs text-red-600">
          {{ errors.confirmPassword }}
        </p>
      </div>

      <div class="flex gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          class="h-10 flex-1 rounded-md border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-zinc-50"
          @click="router.back()"
        >
          取消
        </button>
        <button
          type="submit"
          class="h-10 flex-1 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? '保存中…' : '保存' }}
        </button>
      </div>
    </form>
  </div>
</template>
