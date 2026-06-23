<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useUiStore } from '@/stores/ui'
import { useApplicationsStore } from '@/stores/applications'
import { useBoardStore } from '@/stores/board'

const router = useRouter()
const route = useRoute()
const ui = useUiStore()
const appStore = useApplicationsStore()
const boardStore = useBoardStore()

const serverId = ref('')
const sshPassword = ref('')
const sshPasswordVisible = ref(false)
const submitting = ref(false)

const MIN_SSH_PASSWORD_LEN = 8
const MAX_SSH_PASSWORD_LEN = 128

const errors = ref({
  serverId: '',
  sshPassword: '',
})

const sortedServers = computed(() => [...boardStore.items].sort((a, b) => a.id.localeCompare(b.id)))

const serversLoading = computed(
  () => boardStore.loading && boardStore.items.length === 0 && !boardStore.errorMessage,
)

function applyServerIdFromRoute() {
  const q = route.query.serverId
  const id = Array.isArray(q) ? q[0] : q
  if (typeof id !== 'string' || !id) return
  if (sortedServers.value.some((s) => s.id === id)) {
    serverId.value = id
  }
}

onMounted(async () => {
  await boardStore.fetchBoard()
  applyServerIdFromRoute()
})

watch([() => route.query.serverId, sortedServers], applyServerIdFromRoute)

function validate(): boolean {
  let ok = true
  errors.value = { serverId: '', sshPassword: '' }

  if (!serverId.value) {
    errors.value.serverId = '请选择目标服务器'
    ok = false
  }

  const pwd = sshPassword.value.trim()
  if (pwd) {
    if (pwd.length < MIN_SSH_PASSWORD_LEN) {
      errors.value.sshPassword = `密码至少 ${MIN_SSH_PASSWORD_LEN} 位`
      ok = false
    } else if (pwd.length > MAX_SSH_PASSWORD_LEN) {
      errors.value.sshPassword = `密码不得超过 ${MAX_SSH_PASSWORD_LEN} 位`
      ok = false
    }
  }

  return ok
}

async function onSubmit() {
  if (submitting.value) return
  if (!validate()) return

  submitting.value = true
  try {
    const sshPasswordTrimmed = sshPassword.value.trim()
    const newId = await appStore.createApplication({
      server_id: serverId.value,
      ...(sshPasswordTrimmed ? { ssh_password: sshPasswordTrimmed } : {}),
    })

    ui.pushToast({ type: 'success', message: '申请已提交' })
    appStore.setHighlight(newId)
    await router.replace({ path: '/applications/mine', query: { highlight: newId } })
  } catch {
    // Errors are already handled by the http interceptor toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-6 py-8 lg:px-10 lg:py-10">
    <header class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        申请 GPU 资源
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">新建申请</h1>
      <p class="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
        选择目标服务器后提交，系统将发起访问授权。访问生效后可在「我的申请」中随时撤销。
      </p>
    </header>

    <form
      class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="f-server-id">
          目标服务器 <span class="text-red-500">*</span>
        </label>
        <div v-if="serversLoading" class="h-10 animate-pulse rounded-md bg-zinc-100" />
        <select
          v-else
          id="f-server-id"
          v-model="serverId"
          class="h-10 w-full rounded-md border px-3 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
          :class="errors.serverId ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
          :disabled="sortedServers.length === 0"
        >
          <option value="" disabled>
            {{ sortedServers.length === 0 ? '暂无可选节点（请确认看板有上报数据）' : '请选择…' }}
          </option>
          <option v-for="s in sortedServers" :key="s.id" :value="s.id">
            {{ s.id }} · {{ s.resourceLevel }} · {{ s.status }}
          </option>
        </select>
        <p v-if="boardStore.errorMessage" class="mt-1 text-xs text-amber-700">
          节点列表加载失败：{{ boardStore.errorMessage }}。仍可填写其他项后重试刷新页面。
        </p>
        <p v-else-if="errors.serverId" class="mt-1 text-xs text-red-600">
          {{ errors.serverId }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="f-ssh-password">
          SSH 登录密码（可选）
        </label>
        <div class="relative">
          <input
            id="f-ssh-password"
            v-model="sshPassword"
            :type="sshPasswordVisible ? 'text' : 'password'"
            autocomplete="new-password"
            class="h-10 w-full rounded-md border px-3 pr-10 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            :class="errors.sshPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
            placeholder="留空则由系统自动生成"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600"
            :aria-label="sshPasswordVisible ? '隐藏密码' : '显示密码'"
            @click="sshPasswordVisible = !sshPasswordVisible"
          >
            <EyeOff v-if="sshPasswordVisible" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.sshPassword" class="mt-1 text-xs text-red-600">{{ errors.sshPassword }}</p>
        <p v-else class="mt-1 text-xs text-slate-400">
          填写后将用于本次授权账号的 SSH 登录；不填则由系统在授权完成后生成初始密码。
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          class="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-zinc-50"
          @click="router.back()"
        >
          取消
        </button>
        <button
          type="submit"
          class="h-10 min-w-[6rem] rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting || sortedServers.length === 0"
        >
          {{ submitting ? '提交中…' : '提交申请' }}
        </button>
      </div>
    </form>
  </div>
</template>
