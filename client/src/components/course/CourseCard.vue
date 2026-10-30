<script setup lang="ts">
import { BookOpen, Clock3, Star } from 'lucide-vue-next';
import CourseCover from '@/components/course/CourseCover.vue';
import type { CourseCard as Course } from '@/types/course';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';

defineProps<{
  course: Course;
}>();
</script>

<template>
  <article
    class="course-card group overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/75 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-950/40"
  >
    <div class="relative">
      <router-link
        :to="{ name: 'CourseDetail', params: { id: course.id } }"
        class="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-300"
        :aria-label="`Xem chi tiết khóa học ${course.title}`"
      >
        <CourseCover :src="course.thumbnail" :title="course.title" />
      </router-link>
      <span
        class="absolute left-3 top-3 rounded-full border px-3 py-1 text-xs font-bold"
        :class="
          course.type === 'FREE'
            ? 'border-emerald-300/20 bg-emerald-400/15 text-emerald-300'
            : 'border-amber-300/20 bg-amber-400/15 text-amber-200'
        "
      >
        {{ course.type === 'FREE' ? 'Free' : 'Pro' }}
      </span>
    </div>

    <div class="p-5">
      <div class="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{{ course.level }}</span>
        <span class="inline-flex items-center gap-1 text-amber-300">
          <Star class="h-3.5 w-3.5 fill-current" />
          {{ course.avgRating.toFixed(1) }}
        </span>
      </div>
      <h3 class="min-h-14 line-clamp-2 text-base font-bold leading-6 text-white">
        <router-link
          :to="{ name: 'CourseDetail', params: { id: course.id } }"
          class="rounded-sm transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          {{ course.title }}
        </router-link>
      </h3>
      <p class="mt-2 truncate text-sm text-slate-400">
        Giảng viên {{ course.instructor.fullName }}
      </p>

      <div class="mt-4 flex items-center gap-4 border-b border-slate-800 pb-4 text-xs text-slate-400">
        <span class="inline-flex items-center gap-1.5">
          <Clock3 class="h-3.5 w-3.5" />
          {{ formatCourseDuration(course.totalDuration) }}
        </span>
        <span class="inline-flex items-center gap-1.5">
          <BookOpen class="h-3.5 w-3.5" />
          {{ course.totalLessons }} bài học
        </span>
      </div>

      <div class="mt-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <strong v-if="course.type === 'FREE'" class="text-sm text-white">Miễn phí</strong>
          <template v-else>
            <strong class="block text-sm text-white">
              {{ formatCoursePrice(course.discountPrice ?? course.price) }}
            </strong>
            <span
              v-if="course.discountPrice !== null"
              class="text-xs text-slate-500 line-through"
            >
              {{ formatCoursePrice(course.price) }}
            </span>
          </template>
        </div>
        <router-link
          :to="{ name: 'CourseDetail', params: { id: course.id } }"
          class="shrink-0 rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          Xem chi tiết
        </router-link>
      </div>
    </div>
  </article>
</template>
