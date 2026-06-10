<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="w-full max-w-[400px] rounded-xl border border-slate-200 bg-white px-8 py-9 shadow-sm">
    <h1 class="text-xl font-semibold tracking-tight text-slate-900">{{ title }}</h1>
    <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
    <div class="mt-8">
      <slot />
    </div>
    <div
      v-if="$slots.footer"
      class="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-600"
    >
      <slot name="footer" />
    </div>
  </div>
</template>
