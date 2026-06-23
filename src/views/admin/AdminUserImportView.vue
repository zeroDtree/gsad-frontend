<script setup lang="ts">
import { ref } from 'vue'

import { importUsersCsv } from '@/api/admin'
import { useUiStore } from '@/stores/ui'
import type { UserImportResponse } from '@/types/apiEnvelope'

const ui = useUiStore()

const csvFile = ref<File | null>(null)
const submitting = ref(false)
const result = ref<UserImportResponse | null>(null)
const fileError = ref('')

const CSV_HEADER = 'email,linux_username,display_name,student_id,cohort,initial_password,roles'

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  csvFile.value = file
  fileError.value = ''
  result.value = null
}

function validate(): boolean {
  fileError.value = ''
  if (!csvFile.value) {
    fileError.value = '请选择 CSV 文件'
    return false
  }
  return true
}

async function onSubmit() {
  if (submitting.value) return
  if (!validate() || !csvFile.value) return

  submitting.value = true
  try {
    result.value = await importUsersCsv(csvFile.value)
    ui.pushToast({ type: 'success', message: '导入完成' })
  } catch {
    // Errors are already handled by the http interceptor toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-3xl px-6 py-8 lg:px-10 lg:py-10">
    <header class="mb-8">
      <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">管理</p>
      <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">用户导入</h1>
      <p class="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
        上传 CSV 批量创建 GSAD 账号。必填列：email、linux_username、initial_password（至少 8
        位）。请自行通过安全渠道分发初始密码。
      </p>
    </header>

    <form
      class="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div>
        <p class="mb-1.5 text-sm font-medium text-slate-700">CSV 表头</p>
        <pre
          class="overflow-x-auto rounded-md border border-slate-100 bg-zinc-50 px-3 py-2 text-xs text-slate-600"
          >{{ CSV_HEADER }}</pre
        >
      </div>

      <div>
        <label class="mb-1.5 block text-sm font-medium text-slate-700" for="f-csv-file">
          CSV 文件 <span class="text-red-500">*</span>
        </label>
        <input
          id="f-csv-file"
          type="file"
          accept=".csv,text/csv"
          class="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-800"
          @change="onFileChange"
        />
        <p v-if="fileError" class="mt-1 text-xs text-red-600">{{ fileError }}</p>
      </div>

      <div class="flex items-center justify-end border-t border-slate-100 pt-4">
        <button
          type="submit"
          class="h-10 min-w-[6rem] rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          :disabled="submitting"
        >
          {{ submitting ? '导入中…' : '开始导入' }}
        </button>
      </div>
    </form>

    <section v-if="result" class="mt-8 space-y-6">
      <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 class="text-sm font-semibold text-slate-900">导入结果</h2>
        <dl class="mt-4 grid grid-cols-3 gap-4 text-center">
          <div class="rounded-lg bg-emerald-50 px-3 py-2">
            <dt class="text-xs text-emerald-700">新建</dt>
            <dd class="text-lg font-semibold text-emerald-900">{{ result.created }}</dd>
          </div>
          <div class="rounded-lg bg-amber-50 px-3 py-2">
            <dt class="text-xs text-amber-700">跳过</dt>
            <dd class="text-lg font-semibold text-amber-900">{{ result.skipped }}</dd>
          </div>
          <div class="rounded-lg bg-red-50 px-3 py-2">
            <dt class="text-xs text-red-700">错误</dt>
            <dd class="text-lg font-semibold text-red-900">{{ result.errors.length }}</dd>
          </div>
        </dl>
      </div>

      <div
        v-if="result.errors.length > 0"
        class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 class="text-sm font-semibold text-slate-900">错误明细</h2>
        <div class="mt-3 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-slate-100 text-xs text-slate-500">
                <th class="pb-2 pr-4 font-medium">行号</th>
                <th class="pb-2 font-medium">原因</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(err, idx) in result.errors"
                :key="`${err.row}-${idx}`"
                class="border-b border-slate-50"
              >
                <td class="py-2 pr-4 text-slate-700">{{ err.row }}</td>
                <td class="py-2 text-slate-600">{{ err.reason }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  </div>
</template>
