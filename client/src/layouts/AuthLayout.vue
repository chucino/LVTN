<script setup lang="ts">
import { ArrowLeft, CheckCircle2 } from 'lucide-vue-next';
import HeroCodeWindow from '@/components/illustrations/HeroCodeWindow.vue';

const benefits = [
  'Lưu tiến độ từng bài giảng',
  'Làm trắc nghiệm sau mỗi bài',
  'Học trên mọi thiết bị',
];
</script>

<template>
  <div class="min-h-svh text-ink">
    <div class="mx-auto grid min-h-svh max-w-[1440px] lg:grid-cols-2">
      <div class="flex flex-col px-[var(--margin)] py-8 sm:px-10">
        <div class="flex items-center justify-between">
          <router-link to="/" class="inline-flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Logo NextCode" width="36" height="36" class="h-9 w-9 rounded-lg bg-white object-contain p-1" />
            <span class="text-xl font-bold text-ink">NextCode</span>
          </router-link>
          <router-link
            to="/"
            class="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft class="h-4 w-4" />
            Trang chủ
          </router-link>
        </div>

        <div class="flex flex-1 items-center py-10">
          <div class="mx-auto w-full max-w-md bg-surface p-6 sm:p-8">
            <slot />
          </div>
        </div>
      </div>

      <aside class="hidden bg-navy px-12 py-16 text-white lg:flex lg:flex-col lg:justify-center no-radius" aria-label="Giới thiệu">
        <h2 class="max-w-md text-3xl font-bold leading-tight text-white">
          Học lập trình theo lộ trình rõ ràng, từng bài một.
        </h2>
        <ul class="mt-6 space-y-3 text-sm text-white/80">
          <li v-for="item in benefits" :key="item" class="flex items-center gap-2.5">
            <CheckCircle2 class="h-5 w-5 shrink-0 text-[#4fd1a5]" />
            {{ item }}
          </li>
        </ul>
        <div class="mt-14">
          <HeroCodeWindow />
        </div>
      </aside>
    </div>
  </div>
</template>
