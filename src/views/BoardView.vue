<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { ArrowRight } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

import BoardEmptyState from '@/components/board/BoardEmptyState.vue'
import BoardErrorBanner from '@/components/board/BoardErrorBanner.vue'
import BoardToolbar from '@/components/board/BoardToolbar.vue'
import ServerList from '@/components/board/ServerList.vue'
import { useBoardStore } from '@/stores/board'

const board = useBoardStore()
const {
  items,
  filterResourceLevel,
  filterStatus,
  filteredItems,
  loading,
  errorMessage,
  resourceLevels,
} = storeToRefs(board)

const { pause, resume } = useIntervalFn(
  () => {
    void board.fetchBoard({ silent: true })
  },
  () => board.pollIntervalMs,
  { immediate: false },
)

function onRefresh() {
  void board.fetchBoard()
}

function resetFilters() {
  filterResourceLevel.value = 'all'
  filterStatus.value = 'all'
}

onMounted(() => {
  void board.fetchBoard()
  resume()
})

onUnmounted(() => {
  pause()
})
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
    <header class="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">公开看板</p>
        <h1 class="mt-1 text-2xl font-semibold tracking-tight text-slate-900">GPU 资源负载</h1>
        <p class="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
          按资源等级与在线状态浏览节点，辅助申请前决策。数据每
          {{ Math.round(board.pollIntervalMs / 1000) }} 秒自动刷新。
        </p>
      </div>
      <RouterLink
        to="/applications/new"
        class="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        立即申请
        <ArrowRight class="size-4 opacity-80" />
      </RouterLink>
    </header>

    <BoardToolbar
      v-model:resource-level="filterResourceLevel"
      v-model:status="filterStatus"
      :loading="loading"
      :resource-levels="resourceLevels"
      @refresh="onRefresh"
    />

    <div v-if="errorMessage" class="mt-2">
      <BoardErrorBanner :message="errorMessage" @retry="onRefresh" />
    </div>

    <div class="mt-8">
      <Transition name="fade" mode="out-in">
        <BoardEmptyState
          v-if="!loading && !errorMessage && items.length === 0 && filteredItems.length === 0"
          :loading="loading"
          @refresh="onRefresh"
        />
        <BoardEmptyState
          v-else-if="!loading && errorMessage && items.length === 0"
          :loading="loading"
          :error-message="errorMessage"
          @refresh="onRefresh"
        />
        <ServerList v-else-if="filteredItems.length > 0" :servers="filteredItems" />
        <div v-else-if="loading && items.length === 0" class="space-y-2">
          <div
            v-for="i in 6"
            :key="i"
            class="h-12 animate-pulse rounded-xl border border-slate-100 bg-zinc-100/80"
          />
        </div>
        <div
          v-else-if="!loading && !errorMessage && items.length > 0 && filteredItems.length === 0"
          class="rounded-xl border border-dashed border-slate-200 bg-zinc-50/50 px-6 py-12 text-center text-sm text-slate-600"
        >
          当前筛选条件下暂无节点，请调整筛选或
          <button
            type="button"
            class="font-medium text-slate-900 underline-offset-2 hover:underline"
            @click="resetFilters"
          >
            重置筛选
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
