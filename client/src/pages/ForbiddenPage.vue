<script setup lang="ts">
import { ShieldX } from 'lucide-vue-next';
</script>

<template>
  <main class="flex min-h-svh items-center justify-center bg-ground px-[var(--margin)] text-ink">
    <section class="w-full max-w-lg bg-surface p-8 sm:p-10">
      <div class="mb-5 flex h-12 w-12 items-center justify-center bg-brand-surface text-brand-soft">
        <ShieldX class="h-6 w-6" />
      </div>
      <h1 class="text-3xl font-normal text-ink">Bạn không có quyền truy cập</h1>
      <p class="mt-3 text-base leading-relaxed text-muted">
        Khu vực quản trị chỉ dành cho giảng viên được phân công và quản trị viên hệ thống.
      </p>
      <router-link
        to="/"
        class="mt-6 inline-flex bg-brand px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-hover"
      >
        Về trang chủ NextCode
      </router-link>
    </section>
  </main>
</template>
