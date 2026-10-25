<script setup lang="ts">
import { Github, Linkedin, Youtube } from 'lucide-vue-next';
</script>

<template>
  <footer class="border-t border-slate-800 bg-slate-950">
    <div class="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
      <div class="md:col-span-2">
        <router-link to="/" class="inline-flex items-center gap-2.5">
          <img src="/logo.jpg" alt="" class="h-9 w-9 rounded-xl bg-white object-contain p-1" />
          <span class="text-lg font-black text-white">Next<span class="text-cyan-300">Code</span></span>
        </router-link>
        <p class="mt-4 max-w-sm text-sm leading-6 text-slate-400">
          Học hôm nay, kiến tạo ngày mai. Cùng bạn xây dựng kỹ năng lập trình cho hành trình tiếp theo.
        </p>
        <div class="mt-5 flex gap-3 text-slate-500">
          <span aria-label="Kênh YouTube sẽ được cập nhật"><Youtube class="h-5 w-5" /></span>
          <span aria-label="Kênh GitHub sẽ được cập nhật"><Github class="h-5 w-5" /></span>
          <span aria-label="Kênh LinkedIn sẽ được cập nhật"><Linkedin class="h-5 w-5" /></span>
        </div>
      </div>

      <div>
        <h2 class="text-sm font-bold text-white">Khám phá</h2>
        <ul class="mt-4 space-y-3 text-sm text-slate-400">
          <li><router-link to="/" class="transition hover:text-white">Trang chủ</router-link></li>
          <li><a href="/#courses" class="transition hover:text-white">Khóa học</a></li>
          <li><a href="/#about" class="transition hover:text-white">Giới thiệu</a></li>
        </ul>
      </div>

      <div>
        <h2 class="text-sm font-bold text-white">Liên hệ</h2>
        <p class="mt-4 text-sm leading-6 text-slate-400">
          Thông tin liên hệ và các kênh hỗ trợ chính thức sẽ được cập nhật.
        </p>
      </div>
    </div>
    <div class="border-t border-slate-800">
      <div class="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <span>© {{ new Date().getFullYear() }} NextCode Education. Bảo lưu mọi quyền.</span>
        <span>Học hôm nay, kiến tạo ngày mai</span>
      </div>
    </div>
  </footer>
</template>
