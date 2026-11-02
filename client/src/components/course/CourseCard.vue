<script setup lang="ts">
import CourseCover from '@/components/course/CourseCover.vue';
import type { CourseCard as Course } from '@/types/course';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';
import { BookOpen, Clock3, Star } from 'lucide-vue-next';

defineProps<{
  course: Course;
}>();
</script>

<template>
  <article class="course-card group flex flex-col justify-between overflow-hidden bg-surface transition-transform duration-200 hover:-translate-y-1">
    <div>
      <router-link
        :to="{ name: 'CourseDetail', params: { id: course.id } }"
        class="block"
        :aria-label="`Xem khóa học ${course.title}`"
      >
        <CourseCover :src="course.thumbnail" :title="course.title" :category="course.category?.name" />
      </router-link>

      <div class="p-5">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            class="rounded-full px-2.5 py-1"
            :class="course.type === 'FREE' ? 'bg-teal-tint text-teal' : 'bg-tint text-brand-soft'"
          >
            {{ course.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
          </span>
          <span class="rounded-full bg-surface-2 px-2.5 py-1 text-muted">{{ course.level }}</span>
          <span v-if="course.avgRating > 0" class="ml-auto inline-flex items-center gap-1 tabular-nums text-amber-300">
            <Star class="h-3.5 w-3.5 fill-current" />
            {{ course.avgRating.toFixed(1) }}
          </span>
        </div>

        <h3 class="line-clamp-2 text-lg font-bold leading-snug text-ink">
          <router-link
            :to="{ name: 'CourseDetail', params: { id: course.id } }"
            class="transition-colors hover:text-brand-soft"
          >
            {{ course.title }}
          </router-link>
        </h3>

        <p class="mt-2 truncate text-sm text-muted">
          Giảng viên: {{ course.instructor.fullName }}
        </p>
      </div>
    </div>

    <div class="flex items-center justify-between gap-3 bg-surface-2 px-5 py-3.5 text-sm">
      <span class="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
        <span class="inline-flex items-center gap-1"><BookOpen class="h-4 w-4" /> {{ course.totalLessons }} bài</span>
        <span class="inline-flex items-center gap-1"><Clock3 class="h-4 w-4" /> {{ formatCourseDuration(course.totalDuration) }}</span>
      </span>
      <strong v-if="course.type === 'FREE'" class="font-bold text-teal">Miễn phí</strong>
      <strong v-else class="font-bold tabular-nums text-ink">
        {{ formatCoursePrice(course.discountPrice ?? course.price) }}
      </strong>
    </div>
  </article>
</template>
