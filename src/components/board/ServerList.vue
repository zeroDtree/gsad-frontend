<script setup lang="ts">
import { Cpu } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import { formatResourceLevel } from '@/api/public'
import { SERVER_STATUS_DOT_CLASS, SERVER_STATUS_LABEL_KEY } from '@/constants/serverPresence'
import { formatMemMb, formatUtil, memUseRatio } from '@/lib/boardFormat'
import { formatLocalDateTime, formatRelativeFromUtc, isReportStale } from '@/lib/dayjs'
import type { PublicServerItem } from '@/types/public'

defineProps<{
  servers: PublicServerItem[]
  embedded?: boolean
}>()

const { t } = useI18n()
const COL_COUNT = 8
</script>

<template>
  <div
    class="overflow-x-auto"
    :class="embedded ? '' : 'rounded-xl border border-slate-200 bg-white'"
  >
    <table class="w-full min-w-[720px] border-collapse text-left text-sm">
      <thead>
        <tr class="border-b border-slate-200 bg-zinc-50/90 text-xs font-medium text-slate-500">
          <th class="w-12 px-3 py-2.5">{{ t('board.colStatus') }}</th>
          <th class="min-w-[10rem] px-3 py-2.5">{{ t('board.colServerId') }}</th>
          <th class="px-3 py-2.5">{{ t('board.colResourceLevel') }}</th>
          <th class="whitespace-nowrap px-3 py-2.5">{{ t('board.colGpuCount') }}</th>
          <th class="whitespace-nowrap px-3 py-2.5">{{ t('board.colAvgUtil') }}</th>
          <th class="whitespace-nowrap px-3 py-2.5">{{ t('board.colAvgMem') }}</th>
          <th class="min-w-[8rem] px-3 py-2.5">{{ t('board.colTime') }}</th>
          <th class="w-28 px-3 py-2.5 text-right">{{ t('board.colActions') }}</th>
        </tr>
      </thead>
      <tbody
        v-for="server in servers"
        :key="server.id"
        class="group border-b border-slate-200 last:border-b-0"
      >
        <tr class="bg-white transition hover:bg-zinc-50/60">
          <td class="px-3 py-3 align-middle">
            <div
              class="relative mx-auto flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-zinc-50"
            >
              <Cpu class="size-3.5 text-slate-500" />
              <span
                class="absolute -right-0.5 -top-0.5 size-2.5 rounded-full ring-2 ring-white"
                :class="[
                  SERVER_STATUS_DOT_CLASS[server.status],
                  server.status === 'ONLINE' ? 'motion-safe:animate-pulse' : '',
                ]"
                :title="t(SERVER_STATUS_LABEL_KEY[server.status])"
                aria-hidden="true"
              />
            </div>
          </td>
          <td class="px-3 py-3 align-middle">
            <div class="flex min-w-0 flex-col gap-1">
              <span
                class="truncate font-mono text-sm font-semibold text-slate-900"
                :title="server.id"
              >
                {{ server.id }}
              </span>
              <span
                v-if="isReportStale(server.lastReportedAt)"
                class="w-fit rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900"
              >
                {{ t('board.dataStale') }}
              </span>
            </div>
          </td>
          <td class="px-3 py-3 align-middle">
            <span
              class="inline-flex max-w-[10rem] items-center rounded border border-slate-200 bg-zinc-50 px-1.5 py-0.5 text-xs font-medium text-slate-700"
              :title="formatResourceLevel(server.resourceLevel)"
            >
              <span class="truncate">{{ formatResourceLevel(server.resourceLevel) }}</span>
            </span>
          </td>
          <td class="whitespace-nowrap px-3 py-3 align-middle font-mono text-slate-900">
            {{ server.summary?.gpuCount ?? '—' }}
          </td>
          <td class="whitespace-nowrap px-3 py-3 align-middle font-mono text-slate-900">
            {{ formatUtil(server.summary?.avgUtil) }}
          </td>
          <td class="whitespace-nowrap px-3 py-3 align-middle font-mono text-slate-900">
            {{ formatMemMb(server.summary?.avgMemUsedMb) }}
          </td>
          <td class="px-3 py-3 align-middle text-xs text-slate-600">
            <div class="space-y-1">
              <p class="leading-snug">
                <span class="text-slate-400">{{ t('board.collectedAt') }} </span>
                <template v-if="server.collectedAt">
                  {{ formatRelativeFromUtc(server.collectedAt) }}
                </template>
                <span v-else class="text-slate-400">—</span>
              </p>
              <p class="leading-snug">
                <span class="text-slate-400">{{ t('board.reportedAt') }} </span>
                <template v-if="server.lastReportedAt">
                  {{ formatRelativeFromUtc(server.lastReportedAt) }}
                </template>
                <span v-else class="text-slate-400">—</span>
              </p>
            </div>
          </td>
          <td class="px-3 py-3 align-middle text-right">
            <RouterLink
              :to="{ path: '/applications/new', query: { serverId: server.id } }"
              class="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 transition hover:bg-zinc-50"
            >
              {{ t('board.applyThisServer') }}
            </RouterLink>
          </td>
        </tr>
        <tr class="bg-zinc-50/40">
          <td :colspan="COL_COUNT" class="px-3 pb-3 pt-0">
            <div
              v-if="server.gpus.length"
              class="overflow-x-auto rounded-lg border border-slate-100 bg-white"
            >
              <table class="w-full min-w-[280px] border-collapse text-left text-[11px]">
                <thead>
                  <tr class="border-b border-slate-100 bg-zinc-50/90 text-slate-500">
                    <th class="px-2 py-1.5 font-medium">{{ t('board.gpuIndex') }}</th>
                    <th class="px-2 py-1.5 font-medium">{{ t('board.gpuModel') }}</th>
                    <th class="px-2 py-1.5 font-medium">{{ t('board.gpuUtil') }}</th>
                    <th class="px-2 py-1.5 font-medium">{{ t('board.gpuMem') }}</th>
                    <th class="px-2 py-1.5 font-medium">{{ t('board.gpuMemRatio') }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="g in server.gpus"
                    :key="g.index"
                    class="border-b border-slate-50 last:border-0"
                  >
                    <td class="px-2 py-1.5 font-mono text-slate-700">{{ g.index }}</td>
                    <td class="max-w-[9rem] truncate px-2 py-1.5 text-slate-800" :title="g.name">
                      {{ g.name }}
                    </td>
                    <td class="px-2 py-1.5 font-mono text-slate-800">
                      {{ formatUtil(g.avgUtil) }}
                    </td>
                    <td class="whitespace-nowrap px-2 py-1.5 font-mono text-slate-700">
                      {{ formatMemMb(g.memUsedMb) }} / {{ formatMemMb(g.memTotalMb) }}
                    </td>
                    <td class="px-2 py-1.5 font-mono text-slate-600">{{ memUseRatio(g) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <dl class="mt-3 grid gap-2 text-xs sm:grid-cols-2">
              <div class="rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                <dt class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {{ t('board.collectedAtAgent') }}
                </dt>
                <dd class="mt-1 text-sm text-slate-800">
                  <template v-if="server.collectedAt">
                    <span class="font-mono">{{ formatLocalDateTime(server.collectedAt) }}</span>
                    <span class="ml-2 text-slate-400"
                      >（{{ formatRelativeFromUtc(server.collectedAt) }}）</span
                    >
                  </template>
                  <span v-else class="text-slate-400">—</span>
                </dd>
              </div>
              <div class="rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                <dt class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  {{ t('board.lastReportedServer') }}
                </dt>
                <dd class="mt-1 text-sm text-slate-800">
                  <template v-if="server.lastReportedAt">
                    <span class="font-mono">{{ formatLocalDateTime(server.lastReportedAt) }}</span>
                    <span class="ml-2 text-slate-400"
                      >（{{ formatRelativeFromUtc(server.lastReportedAt) }}）</span
                    >
                  </template>
                  <span v-else class="text-slate-400">—</span>
                </dd>
              </div>
            </dl>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
