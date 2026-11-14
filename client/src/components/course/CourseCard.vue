<script setup lang="ts">
import CourseCover from '@/components/course/CourseCover.vue';
import type { CourseCard as Course } from '@/types/course';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';
import { BookOpen, Clock3, Crown, Star } from 'lucide-vue-next';

defineProps<{
  course: Course;
}>();
</script>

<template>
  <article
    data-ui
    class="course-card group flex flex-col justify-between overflow-hidden border border-surface-3 bg-surface transition-transform duration-200 hover:-translate-y-1 hover:border-brand"
  >
    <div>
      <router-link
        :to="{ name: 'CourseDetail', params: { id: course.id } }"
        data-ui class="block border-b border-surface-3"
        :aria-label="`Xem khóa học ${course.title}`"
      >
        <CourseCover
          :src="course.thumbnail"
          :title="course.title"
          :category="course.category?.name"
          :is-pro="course.type === 'PRO'"
        />
      </router-link>

      <div class="p-5">
        <div class="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span
            v-if="course.type === 'PRO'"
            class="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 font-bold text-amber-600"
          >
            <Crown class="h-3.5 w-3.5 fill-[#facc15] text-[#f59e0b]" />
            <span>PRO</span>
          </span>
          <span
            v-else
            class="inline-flex items-center rounded-full bg-teal-tint px-2.5 py-1 text-teal"
          >
            Miễn phí
          </span>
          <span v-if="course.avgRating > 0" class="ml-auto inline-flex items-center gap-1 tabular-nums text-amber-500">
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

    <div data-ui class="flex items-center justify-between gap-3 border-t border-surface-3 bg-surface-2 px-5 py-3.5 text-sm">
      <span class="inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-muted">
        <span class="inline-flex items-center gap-1"><BookOpen class="h-4 w-4" /> {{ course.totalLessons }} bài</span>
        <span class="inline-flex items-center gap-1"><Clock3 class="h-4 w-4" /> {{ formatCourseDuration(course.totalDuration) }}</span>
      </span>
      <strong v-if="course.type === 'FREE'" class="text-base font-extrabold text-teal">
        Miễn phí
      </strong>
      <div v-else class="flex items-baseline gap-2">
        <span
          v-if="course.discountPrice !== null && course.discountPrice < course.price"
          class="text-xs font-medium tabular-nums text-muted line-through"
        >
          {{ formatCoursePrice(course.price) }}
        </span>
        <strong class="text-base font-extrabold tabular-nums text-[#f05123]">
          {{ formatCoursePrice(course.discountPrice ?? course.price) }}
        </strong>
      </div>
    </div>
  </article>
</template>
