<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const MIN_SPIN_MS = 300

const props = withDefaults(
  defineProps<{
    loading?: boolean
    label?: string
    variant?: 'toolbar' | 'text' | 'empty' | 'banner'
    tone?: 'default' | 'error'
    disabled?: boolean
  }>(),
  {
    loading: false,
    variant: 'toolbar',
    tone: 'default',
    disabled: false,
  },
)

const emit = defineEmits<{
  click: []
}>()

const { t } = useI18n()

const spinning = ref(false)
let spinStartedAt = 0
let spinTimer: ReturnType<typeof setTimeout> | undefined

const displayLabel = computed(() => props.label ?? t('common.refresh'))
const isDisabled = computed(() => props.disabled)
const isBusy = computed(() => props.loading || spinning.value)

const buttonClass = computed(() => {
  const busyClass = isBusy.value ? 'pointer-events-none opacity-50' : ''

  if (props.variant === 'toolbar') {
    return `inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-50 ${busyClass}`
  }
  if (props.variant === 'text') {
    return `inline-flex items-center gap-1.5 font-medium underline-offset-2 hover:underline disabled:opacity-50 ${busyClass}`
  }
  if (props.variant === 'banner') {
    return `shrink-0 inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-900 transition hover:bg-rose-100 disabled:opacity-50 ${busyClass}`
  }
  if (props.tone === 'error') {
    return `inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-900 transition hover:bg-rose-100 disabled:opacity-50 ${busyClass}`
  }
  return `inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-zinc-50 disabled:opacity-50 ${busyClass}`
})

const iconSize = computed(() =>
  props.variant === 'empty' || props.variant === 'banner' ? 'size-3.5' : 'size-4',
)

function clearSpinTimer() {
  if (spinTimer !== undefined) {
    clearTimeout(spinTimer)
    spinTimer = undefined
  }
}

watch(
  () => props.loading,
  (loading) => {
    clearSpinTimer()
    if (loading) {
      spinStartedAt = Date.now()
      spinning.value = true
      return
    }
    if (!spinning.value) return
    const remaining = MIN_SPIN_MS - (Date.now() - spinStartedAt)
    if (remaining <= 0) {
      spinning.value = false
    } else {
      spinTimer = setTimeout(() => {
        spinning.value = false
        spinTimer = undefined
      }, remaining)
    }
  },
  { flush: 'post' },
)

onUnmounted(clearSpinTimer)

function onClick() {
  if (isBusy.value || props.disabled) return
  emit('click')
}
</script>

<template>
  <button
    type="button"
    :class="buttonClass"
    :disabled="isDisabled"
    :aria-busy="isBusy"
    @click="onClick"
  >
    <span class="inline-flex" :class="spinning ? 'animate-spin' : ''">
      <RefreshCw :class="iconSize" />
    </span>
    {{ displayLabel }}
  </button>
</template>
