<script setup lang="ts">
import { BookOpen, Clock3, Star } from 'lucide-vue-next';
import type { Course } from '@/types/course';

defineProps<{
  course: Course;
}>();

const formatPrice = (price: number) =>
  new Intl.NumberFormat('vi-VN').format(price) + 'đ';
</script>

<template>
  <article
    class="course-card group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-950/40"
  >
    <div class="relative aspect-[16/9] overflow-hidden bg-slate-800">
      <img
        :src="course.image"
        :alt="course.imageAlt"
        loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
      <span
        class="absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-bold"
        :class="
          course.plan === 'Free'
            ? 'border-emerald-300/20 bg-emerald-400/15 text-emerald-300'
            : 'border-amber-300/20 bg-amber-400/15 text-amber-200'
        "
      >
        {{ course.plan }}
      </span>
      <span
        v-if="course.featured"
        class="absolute right-3 top-3 rounded-full bg-indigo-500/90 px-3 py-1 text-xs font-semibold text-white"
      >
        Nổi bật
      </span>
    </div>

    <div class="p-5">
      <div class="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{{ course.level }}</span>
        <span class="inline-flex items-center gap-1 text-amber-300">
          <Star class="h-3.5 w-3.5 fill-current" />
          {{ course.rating.toFixed(1) }}
        </span>
      </div>
      <h3 class="min-h-14 text-base font-bold leading-6 text-white">
        {{ course.title }}
      </h3>
      <p class="mt-2 text-sm text-slate-400">Giảng viên {{ course.instructor }}</p>

      <div class="mt-4 flex items-center gap-4 border-b border-slate-800 pb-4 text-xs text-slate-400">
        <span class="inline-flex items-center gap-1.5">
          <Clock3 class="h-3.5 w-3.5" />
          {{ course.duration }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <BookOpen class="h-3.5 w-3.5" />
          {{ course.lessons }} bài học
        </span>
      </div>

      <div class="mt-4 flex items-center justify-between gap-3">
        <strong class="text-sm text-white">
          {{ course.plan === 'Free' ? 'Miễn phí' : formatPrice(course.price) }}
        </strong>
        <button
          type="button"
          disabled
          title="Trang chi tiết khóa học sẽ được bổ sung sau"
          class="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 opacity-75"
        >
          Xem chi tiết
        </button>
      </div>
    </div>
  </article>
</template>
