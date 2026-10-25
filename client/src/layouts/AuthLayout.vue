<script setup lang="ts">
import { Sparkles } from 'lucide-vue-next';
</script>

<template>
  <div class="min-h-screen w-full flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden font-sans">
    <!-- Decorative blurred gradient circles -->
    <div class="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Main Card Container -->
    <div class="w-full max-w-lg z-10">
      <!-- Brand Logo & Header -->
      <div class="text-center mb-6">
        <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
          <Sparkles class="w-3.5 h-3.5" />
          <span>Nền tảng học lập trình trực tuyến</span>
        </div>
        <div class="flex items-center justify-center gap-2 text-2xl font-black tracking-tight text-white">
          <img src="/logo.jpg" alt="" class="w-10 h-10 rounded-xl bg-white object-contain p-1 shadow-lg shadow-indigo-500/30" />
          <span class="bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">NextCode</span>
        </div>
        <p class="text-slate-400 text-sm mt-1">Học hôm nay, kiến tạo ngày mai</p>
      </div>

      <!-- Glassmorphic Card -->
      <div class="backdrop-blur-xl bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative">
        <slot />
      </div>

      <!-- Footer text -->
      <div class="text-center mt-6 text-xs text-slate-500">
        &copy; 2026 NextCode Education. Đồ án Luận văn tốt nghiệp.
      </div>
    </div>
  </div>
</template>
