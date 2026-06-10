<script setup lang="ts">
import {
  AlertCircle,
  AlertTriangle,
  CalendarOff,
  CheckCircle,
  Clock,
  XCircle,
  Zap,
} from 'lucide-vue-next'
import { computed } from 'vue'

import { AUDIT_STATUS_MAP, STATUS_COLOR_CLASS } from '@/constants/auditStatus'
import type { AuditStatus } from '@/types/application'

const props = defineProps<{
  status: AuditStatus
  /** Render without icon when true */
  noIcon?: boolean
}>()

const meta = computed(() => AUDIT_STATUS_MAP[props.status])
const colorClass = computed(() => STATUS_COLOR_CLASS[meta.value.color])

const iconMap = {
  Clock,
  CheckCircle,
  Zap,
  XCircle,
  CalendarOff,
  AlertCircle,
  AlertTriangle,
}

const IconComponent = computed(() => iconMap[meta.value.icon as keyof typeof iconMap] ?? Clock)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset"
    :class="colorClass"
  >
    <component :is="IconComponent" v-if="!noIcon" class="size-3 shrink-0" />
    {{ meta.label }}
  </span>
</template>
