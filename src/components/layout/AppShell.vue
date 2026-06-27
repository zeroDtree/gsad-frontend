<script setup lang="ts">
import { computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import LocaleSwitcher from '@/components/layout/LocaleSwitcher.vue'
import ToastHost from '@/components/layout/ToastHost.vue'

const route = useRoute()
const isAuthPage = computed(() => Boolean(route.meta.authPage))
</script>

<template>
  <div class="flex min-h-svh items-start bg-zinc-50">
    <LocaleSwitcher />
    <AppSidebar v-if="!isAuthPage" />
    <div
      class="relative flex min-h-svh min-w-0 flex-1 flex-col"
      :class="isAuthPage ? 'bg-zinc-50' : 'bg-white'"
    >
      <ToastHost />
      <main class="min-w-0 flex-1">
        <RouterView v-slot="{ Component }">
          <Transition name="route-fade" mode="out-in">
            <component :is="Component" :key="$route.path" />
          </Transition>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.route-fade-enter-active,
.route-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}
.route-fade-enter-from,
.route-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
