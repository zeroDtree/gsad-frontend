<script setup lang="ts">
import { AlertCircle, RefreshCw, ServerCrash } from 'lucide-vue-next'
import { computed } from 'vue'

const props = defineProps<{
  loading: boolean
  errorMessage?: string | null
}>()

const emit = defineEmits<{
  refresh: []
}>()

const isError = computed(() => Boolean(props.errorMessage?.trim()))
</script>

<template>
  <div
    class="flex flex-col items-center justify-center rounded-xl border border-dashed px-8 py-16 text-center"
    :class="
      isError
        ? 'border-rose-200 bg-rose-50/40'
        : 'border-slate-200 bg-zinc-50/50'
    "
  >
    <div
      class="flex size-12 items-center justify-center rounded-full border bg-white"
      :class="isError ? 'border-rose-200 text-rose-500' : 'border-slate-200 text-slate-400'"
    >
      <AlertCircle v-if="isError" class="size-6" />
      <ServerCrash v-else class="size-6" />
    </div>
    <p
      class="mt-4 text-sm font-medium"
      :class="isError ? 'text-rose-950' : 'text-slate-800'"
    >
      {{ isError ? '无法加载看板' : '暂无可展示服务器' }}
    </p>
    <p
      class="mt-1 max-w-sm text-xs leading-relaxed"
      :class="isError ? 'text-rose-900/90' : 'text-slate-500'"
    >
      {{
        isError
          ? errorMessage
          : '请确认后端已上报节点，或稍后重试刷新列表。'
      }}
    </p>
    <button
      type="button"
      class="mt-6 inline-flex items-center gap-2 rounded-md border bg-white px-3 py-1.5 text-xs font-medium transition disabled:opacity-50"
      :class="
        isError
          ? 'border-rose-200 text-rose-900 hover:bg-rose-100'
          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-zinc-50'
      "
      :disabled="loading"
      @click="emit('refresh')"
    >
      <RefreshCw class="size-3.5" :class="loading ? 'animate-spin' : ''" />
      刷新
    </button>
  </div>
</template>
