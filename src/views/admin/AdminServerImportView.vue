<script setup lang="ts">
import { ref } from 'vue'

import { importServersCsv } from '@/api/admin'
import type { ServerImportResponse } from '@/types/apiEnvelope'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const selectedFile = ref<File | null>(null)
const submitting = ref(false)
const result = ref<ServerImportResponse | null>(null)

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  result.value = null
}

async function onSubmit() {
  if (!selectedFile.value || submitting.value) return
  submitting.value = true
  result.value = null
  try {
    result.value = await importServersCsv(selectedFile.value)
    const { created, skipped, errors } = result.value
    if (errors.length === 0) {
      ui.pushToast({
        type: 'success',
        message: `导入完成：新建 ${created}，跳过 ${skipped}`,
      })
    } else {
      ui.pushToast({
        type: 'warning',
        message: `导入完成：新建 ${created}，跳过 ${skipped}，${errors.length} 行错误`,
      })
    }
  } catch {
    // http interceptor shows error toast
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-8">
    <header class="mb-8">
      <h1 class="text-xl font-semibold tracking-tight text-slate-900">服务器导入</h1>
      <p class="mt-1 text-sm text-slate-600">
        上传 CSV 注册 GPU 服务器。必填列：<code class="font-mono text-xs">server_id</code>。可选：
        <code class="font-mono text-xs">ssh_host</code>、
        <code class="font-mono text-xs">resource_level</code>。
        <code class="font-mono text-xs">agent_psk</code> 列会被忽略（可与 PSK 批量脚本输出共用同一文件）。
      </p>
    </header>

    <form
      class="space-y-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      @submit.prevent="onSubmit"
    >
      <div>
        <label class="mb-1.5 block text-xs font-medium text-slate-600" for="server-csv"
          >CSV 文件</label
        >
        <input
          id="server-csv"
          type="file"
          accept=".csv,text/csv"
          class="block w-full text-sm text-slate-700 file:mr-3 file:rounded-md file:border file:border-slate-200 file:bg-zinc-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-zinc-100"
          @change="onFileChange"
        />
      </div>

      <div class="rounded-md border border-slate-100 bg-zinc-50/80 px-3 py-2.5 text-xs text-slate-600">
        <p class="font-medium text-slate-700">示例</p>
        <pre class="mt-1 overflow-x-auto font-mono text-[11px] leading-relaxed">server_id,ssh_host
gpu-node-01,10.0.0.11
gpu-node-02,</pre>
      </div>

      <button
        type="submit"
        class="inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="!selectedFile || submitting"
      >
        {{ submitting ? '导入中…' : '开始导入' }}
      </button>
    </form>

    <section v-if="result" class="mt-8 space-y-4">
      <div class="flex flex-wrap gap-4 text-sm">
        <p>
          <span class="text-slate-500">新建</span>
          <span class="ml-1 font-semibold text-slate-900">{{ result.created }}</span>
        </p>
        <p>
          <span class="text-slate-500">跳过</span>
          <span class="ml-1 font-semibold text-slate-900">{{ result.skipped }}</span>
        </p>
        <p>
          <span class="text-slate-500">错误</span>
          <span class="ml-1 font-semibold text-slate-900">{{ result.errors.length }}</span>
        </p>
      </div>

      <div
        v-if="result.errors.length > 0"
        class="overflow-x-auto rounded-xl border border-slate-200 bg-white"
      >
        <table class="w-full min-w-[20rem] border-collapse text-left text-sm">
          <thead>
            <tr class="border-b border-slate-200 bg-zinc-50/90 text-xs font-medium text-slate-500">
              <th class="px-3 py-2.5">行</th>
              <th class="px-3 py-2.5">原因</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="err in result.errors"
              :key="`${err.row}-${err.reason}`"
              class="border-b border-slate-100 last:border-b-0"
            >
              <td class="whitespace-nowrap px-3 py-2 font-mono text-slate-700">{{ err.row }}</td>
              <td class="px-3 py-2 text-slate-800">{{ err.reason }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
