<script setup lang="ts">
import { ShieldX } from 'lucide-vue-next';
</script>

<template>
  <main class="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
    <section class="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl shadow-black/30">
      <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-500/10 text-rose-300">
        <ShieldX class="h-7 w-7" />
      </div>
      <h1 class="text-2xl font-bold text-white">Bạn không có quyền truy cập</h1>
      <p class="mt-2 text-sm leading-6 text-slate-400">
        Khu vực quản lý khóa học chỉ dành cho giảng viên và quản trị viên.
      </p>
      <router-link
        to="/"
        class="mt-6 inline-flex rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white"
      >
        Về trang chủ
      </router-link>
    </section>
  </main>
</template>
