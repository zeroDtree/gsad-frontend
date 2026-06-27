<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    page: number
    total: number
    pageSize?: number
    loading?: boolean
  }>(),
  {
    pageSize: 20,
    loading: false,
  },
)

const emit = defineEmits<{
  'update:page': [page: number]
}>()

const { t } = useI18n()

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const canGoPrev = computed(() => props.page > 1)
const canGoNext = computed(() => props.page < totalPages.value)

function onPrev() {
  if (canGoPrev.value && !props.loading) {
    emit('update:page', props.page - 1)
  }
}

function onNext() {
  if (canGoNext.value && !props.loading) {
    emit('update:page', props.page + 1)
  }
}
</script>

<template>
  <div
    class="flex flex-col gap-3 border-t border-slate-100 bg-zinc-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
  >
    <p class="text-sm text-slate-500">
      {{ t('common.paginationTotal', { total }) }}
      <span v-if="totalPages > 1" class="text-slate-400">
        {{ t('common.paginationPage', { page, totalPages }) }}
      </span>
    </p>
    <div v-if="totalPages > 1" class="flex items-center gap-2">
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canGoPrev || loading"
        @click="onPrev"
      >
        {{ t('common.previousPage') }}
      </button>
      <button
        type="button"
        class="inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
        :disabled="!canGoNext || loading"
        @click="onNext"
      >
        {{ t('common.nextPage') }}
      </button>
    </div>
  </div>
</template>
