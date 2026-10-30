<script setup lang="ts">
import { Code2 } from 'lucide-vue-next';

defineProps<{
  src: string | null;
  title: string;
  compact?: boolean;
}>();
</script>

<template>
  <div class="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950">
    <img
      v-if="src"
      :src="src"
      :alt="`Ảnh khóa học ${title}`"
      loading="lazy"
      class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
    />
    <div
      v-else
      aria-hidden="true"
      class="absolute inset-0 flex items-center justify-center bg-[radial-gradient(ellipse_at_20%_20%,rgba(99,102,241,0.28),transparent_48%),radial-gradient(ellipse_at_80%_80%,rgba(6,182,212,0.22),transparent_48%)]"
    >
      <div class="flex flex-col items-center gap-2 text-cyan-100/90">
        <Code2 :class="compact ? 'h-7 w-7' : 'h-10 w-10'" />
        <span class="max-w-[80%] truncate text-sm font-bold tracking-wide">
          {{ title }}
        </span>
      </div>
    </div>
  </div>
</template>
