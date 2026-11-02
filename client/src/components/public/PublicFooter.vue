<script setup lang="ts">
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<template>
  <footer class="mt-8 bg-navy text-white no-radius">
    <div class="mx-auto max-w-[1440px] px-[var(--margin)] py-14">
      <div class="grid gap-10 md:grid-cols-12">
        <div class="md:col-span-5">
          <router-link to="/" class="inline-flex items-center gap-2.5">
            <img src="/logo.jpg" alt="Logo NextCode" width="36" height="36" class="h-9 w-9 rounded-lg bg-white object-contain p-1" />
            <span class="text-xl font-bold">NextCode</span>
          </router-link>
          <p class="mt-4 max-w-sm text-sm leading-6 text-white/70">
            Nền tảng học lập trình trực tuyến với giáo trình chia theo chương, bài giảng video và bài trắc nghiệm sau mỗi bài.
          </p>
        </div>

        <nav class="md:col-span-3" aria-label="Khám phá">
          <h2 class="text-sm font-semibold text-white">Khám phá</h2>
          <ul class="mt-4 space-y-2.5 text-sm text-white/70">
            <li><router-link to="/" class="transition-colors hover:text-white">Trang chủ</router-link></li>
            <li><router-link :to="{ name: 'Courses' }" class="transition-colors hover:text-white">Tất cả khóa học</router-link></li>
            <li><router-link :to="{ name: 'Courses', query: { type: 'FREE' } }" class="transition-colors hover:text-white">Khóa học miễn phí</router-link></li>
            <li><router-link :to="{ name: 'Courses', query: { type: 'PRO' } }" class="transition-colors hover:text-white">Khóa học Pro</router-link></li>
          </ul>
        </nav>

        <nav class="md:col-span-2" aria-label="Tài khoản">
          <h2 class="text-sm font-semibold text-white">Tài khoản</h2>
          <ul class="mt-4 space-y-2.5 text-sm text-white/70">
            <li><router-link to="/login" class="transition-colors hover:text-white">Đăng nhập</router-link></li>
            <li><router-link to="/register" class="transition-colors hover:text-white">Đăng ký</router-link></li>
          </ul>
        </nav>

        <div class="md:col-span-2">
          <h2 class="text-sm font-semibold text-white">Liên hệ</h2>
          <a
            href="mailto:lienhe@nextcode.vn?subject=Lien%20he%20NextCode"
            class="mt-4 inline-block text-sm text-white/70 transition-colors hover:text-white"
          >
            lienhe@nextcode.vn
          </a>
        </div>
      </div>

      <div class="mt-12 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
        <p>© {{ new Date().getFullYear() }} NextCode. Học lập trình có lộ trình.</p>
        <button type="button" class="transition-colors hover:text-white" @click="scrollToTop">Lên đầu trang</button>
      </div>
    </div>
  </footer>
</template>
