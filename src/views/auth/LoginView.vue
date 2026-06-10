<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import AuthCard from '@/components/auth/AuthCard.vue'
import { safeInternalRedirect } from '@/lib/redirect'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    await auth.loginWithPassword(email.value, password.value)
    ui.pushToast({ type: 'success', message: '登录成功' })
    const next = safeInternalRedirect(route.query.redirect) ?? '/board'
    await router.replace(next)
  } catch {
    // Errors are already handled by the http interceptor toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center px-4 py-12">
    <AuthCard title="登录" subtitle="使用组织账号访问 GSAD 控制台">
      <form class="space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600" for="login-email"
            >邮箱</label
          >
          <input
            id="login-email"
            v-model="email"
            type="email"
            autocomplete="username"
            required
            class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-xs font-medium text-slate-600" for="login-password"
            >密码</label
          >
          <input
            id="login-password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            class="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
          />
        </div>
        <button
          type="submit"
          class="mt-2 flex h-10 w-full items-center justify-center rounded-md bg-slate-900 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? '登录中…' : '登录' }}
        </button>
      </form>
    </AuthCard>

    <p class="mt-8 text-center text-sm text-slate-500">
      还没有账号？
      <RouterLink
        to="/register"
        class="font-medium text-slate-900 underline-offset-2 hover:underline"
      >
        注册
      </RouterLink>
    </p>
  </div>
</template>
