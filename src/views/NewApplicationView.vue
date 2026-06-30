<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useUiStore } from '@/stores/ui'
import { formatResourceLevel } from '@/api/public'
import { useApplicationsStore } from '@/stores/applications'
import { useBoardStore } from '@/stores/board'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const ui = useUiStore()
const appStore = useApplicationsStore()
const boardStore = useBoardStore()

const serverId = ref('')
const sshPassword = ref('')
const installMiniconda = ref(false)
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
    errors.value.serverId = t('validation.selectServer')
    ok = false
  }

  const pwd = sshPassword.value.trim()
  if (pwd) {
    if (pwd.length < MIN_SSH_PASSWORD_LEN) {
      errors.value.sshPassword = t('validation.passwordMinLength', { min: MIN_SSH_PASSWORD_LEN })
      ok = false
    } else if (pwd.length > MAX_SSH_PASSWORD_LEN) {
      errors.value.sshPassword = t('validation.passwordMaxLength', { max: MAX_SSH_PASSWORD_LEN })
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
      ...(installMiniconda.value ? { install_miniconda: true } : {}),
    })

    ui.pushToast({ type: 'success', message: t('application.submitted') })
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
        {{ t('application.eyebrow') }}
      </p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
        {{ t('application.newTitle') }}
      </h1>
      <p class="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
        {{ t('application.newDescription') }}
      </p>
    </header>

    <form
      class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="f-server-id">
          {{ t('application.targetServer') }} <span class="text-red-500">*</span>
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
            {{
              sortedServers.length === 0
                ? t('application.noServersAvailable')
                : t('application.selectPlaceholder')
            }}
          </option>
          <option v-for="s in sortedServers" :key="s.id" :value="s.id">
            {{ s.id }} · {{ formatResourceLevel(s.resourceLevel) }} · {{ s.status }}
          </option>
        </select>
        <p v-if="boardStore.errorMessage" class="mt-1 text-xs text-amber-700">
          {{ t('board.serverListLoadFailed', { message: boardStore.errorMessage }) }}
        </p>
        <p v-else-if="errors.serverId" class="mt-1 text-xs text-red-600">
          {{ errors.serverId }}
        </p>
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="f-ssh-password">
          {{ t('application.sshPasswordOptional') }}
        </label>
        <div class="relative">
          <input
            id="f-ssh-password"
            v-model="sshPassword"
            :type="sshPasswordVisible ? 'text' : 'password'"
            autocomplete="new-password"
            class="h-10 w-full rounded-md border px-3 pr-10 text-sm text-slate-900 outline-none ring-slate-300 transition focus:ring-2"
            :class="errors.sshPassword ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white'"
            :placeholder="t('application.sshPasswordPlaceholder')"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition hover:text-slate-600"
            :aria-label="sshPasswordVisible ? t('common.hidePassword') : t('common.showPassword')"
            @click="sshPasswordVisible = !sshPasswordVisible"
          >
            <EyeOff v-if="sshPasswordVisible" class="size-4" />
            <Eye v-else class="size-4" />
          </button>
        </div>
        <p v-if="errors.sshPassword" class="mt-1 text-xs text-red-600">{{ errors.sshPassword }}</p>
        <p v-else class="mt-1 text-xs text-slate-400">
          {{ t('application.sshPasswordHint') }}
        </p>
      </div>

      <div class="flex items-start gap-3">
        <input
          id="f-install-miniconda"
          v-model="installMiniconda"
          type="checkbox"
          class="mt-1 size-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
        />
        <div>
          <label class="text-sm font-medium text-slate-700" for="f-install-miniconda">
            {{ t('application.installMiniconda') }}
          </label>
          <p class="mt-1 text-xs text-slate-400">
            {{ t('application.installMinicondaHint') }}
          </p>
        </div>
      </div>

      <div class="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
        <button
          type="button"
          class="h-10 rounded-md border border-slate-200 px-4 text-sm font-medium text-slate-700 transition hover:bg-zinc-50"
          @click="router.back()"
        >
          {{ t('common.cancel') }}
        </button>
        <button
          type="submit"
          class="h-10 min-w-[6rem] rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting || sortedServers.length === 0"
        >
          {{ submitting ? t('application.submitting') : t('application.submit') }}
        </button>
      </div>
    </form>
  </div>
</template>
