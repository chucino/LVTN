<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md';
  }>(),
  { size: 'md' },
);

const languages = [
  { label: 'HTML', short: 'H5', bg: '#e44d26', fg: '#ffffff' },
  { label: 'CSS', short: 'C3', bg: '#1572b6', fg: '#ffffff' },
  { label: 'JavaScript', short: 'JS', bg: '#f7df1e', fg: '#1a1a1a' },
  { label: 'TypeScript', short: 'TS', bg: '#3178c6', fg: '#ffffff' },
  { label: 'Vue', short: 'V', bg: '#42b883', fg: '#0b2a1f' },
  { label: 'Node.js', short: 'N', bg: '#3c873a', fg: '#ffffff' },
  { label: 'Python', short: 'Py', bg: '#3776ab', fg: '#ffd43b' },
  { label: 'SQL', short: 'DB', bg: '#0f766e', fg: '#ffffff' },
];
</script>

<template>
  <ul class="flex flex-wrap items-center gap-3" aria-label="Công nghệ trong các khóa học">
    <li
      v-for="item in languages"
      :key="item.label"
      class="flex items-center gap-2 rounded-xl bg-surface px-3 py-2"
      :class="size === 'sm' ? 'text-xs' : 'text-sm'"
    >
      <span
        class="flex items-center justify-center rounded-lg text-[11px] font-bold"
        :class="size === 'sm' ? 'h-6 w-6' : 'h-8 w-8'"
        :style="{ background: item.bg, color: item.fg }"
        aria-hidden="true"
      >
        {{ item.short }}
      </span>
      <span class="font-medium text-ink">{{ item.label }}</span>
    </li>
  </ul>
</template>

