<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AuthCard from '@/components/auth/AuthCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const router = useRouter()
const ui = useUiStore()

const email = ref('')
const password = ref('')
const confirm = ref('')
const submitting = ref(false)

async function onSubmit() {
  if (password.value !== confirm.value) {
    ui.pushToast({ type: 'warning', message: '两次输入的密码不一致' })
    return
  }
  submitting.value = true
  try {
    await auth.registerWithPassword(email.value, password.value)
    ui.pushToast({ type: 'success', message: '注册成功，已自动登录' })
    await router.replace('/board')
  } catch {
    // Errors are already handled by the http interceptor toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center px-4 py-12">
    <AuthCard title="注册" subtitle="使用组织邮箱完成注册，成功后自动登录">
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600" for="reg-email"
            >邮箱</label
          >
          <input
            id="reg-email"
            v-model="email"
            type="email"
            autocomplete="email"
            required
            class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600" for="reg-password"
            >密码</label
          >
          <input
            id="reg-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            required
            minlength="8"
            class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            placeholder="至少 8 位"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600" for="reg-confirm"
            >确认密码</label
          >
          <input
            id="reg-confirm"
            v-model="confirm"
            type="password"
            autocomplete="new-password"
            required
            class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
          />
        </div>
        <button
          type="submit"
          class="mt-2 flex h-10 w-full items-center justify-center rounded-md bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? '提交中…' : '注册并登录' }}
        </button>
      </form>
    </AuthCard>

    <p class="mt-8 text-center text-sm text-slate-500">
      已有账号？
      <RouterLink to="/login" class="font-medium text-slate-900 underline-offset-2 hover:underline">
        登录
      </RouterLink>
    </p>
  </div>
</template>
