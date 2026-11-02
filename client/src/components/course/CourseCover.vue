<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  src: string | null;
  title: string;
  compact?: boolean;
  category?: string;
}>();

const imageFailed = ref(false);

watch(
  () => props.src,
  () => {
    imageFailed.value = false;
  },
);

const validSrc = computed(() => {
  if (!props.src || imageFailed.value) return null;
  if (props.src.includes('example.com')) return null;
  return props.src;
});

const themes = [
  { from: '#dbeafe', accent: '#2563eb', ink: '#1e3a8a' },
  { from: '#ccfbf1', accent: '#0f766e', ink: '#134e4a' },
  { from: '#e0f2fe', accent: '#0284c7', ink: '#0c4a6e' },
  { from: '#dcfce7', accent: '#15803d', ink: '#14532d' },
  { from: '#ffedd5', accent: '#c2410c', ink: '#7c2d12' },
  { from: '#e2e8f0', accent: '#334155', ink: '#0f172a' },
];

const theme = computed(() => {
  const seed = props.category || props.title || 'NextCode';
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return themes[hash % themes.length]!;
});
</script>

<template>
  <div class="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-surface-2">
    <img
      v-if="validSrc"
      :src="validSrc"
      :alt="`Ảnh bìa khóa học ${title}`"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      @error="imageFailed = true"
    />
    <div
      v-else
      aria-hidden="true"
      class="absolute inset-0 flex flex-col justify-between p-5"
      :style="{ background: theme.from, color: theme.ink }"
    >
      <div class="flex items-center gap-1.5">
        <span class="h-2.5 w-2.5 rounded-full" :style="{ background: theme.accent }" />
        <span class="h-2.5 w-2.5 rounded-full opacity-50" :style="{ background: theme.accent }" />
        <span class="h-2.5 w-2.5 rounded-full opacity-25" :style="{ background: theme.accent }" />
      </div>
      <svg class="absolute bottom-3 right-4 h-24 w-24 opacity-20" viewBox="0 0 24 24" fill="none" :stroke="theme.accent" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="m8 7-5 5 5 5" />
        <path d="m16 7 5 5-5 5" />
        <path d="m14 4-4 16" />
      </svg>
      <span
        class="relative line-clamp-2 font-bold leading-tight"
        :class="compact ? 'text-sm' : 'text-lg'"
      >
        {{ title }}
      </span>
    </div>
  </div>
</template>
