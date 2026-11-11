<script setup lang="ts">
import CourseCard from '@/components/course/CourseCard.vue';
import CourseCardSkeleton from '@/components/course/CourseCardSkeleton.vue';
import type { CourseCard as CourseCardType, CourseType } from '@/types/course';

withDefaults(
  defineProps<{
    eyebrow?: string;
    title: string;
    description: string;
    courses: CourseCardType[];
    loading: boolean;
    error: string | null;
    type?: CourseType;
    surface?: 'surface' | 'ground';
  }>(),
  {
    surface: 'ground',
  },
);

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <section
    data-ui class="no-radius scroll-mt-24 border-b border-surface-3 py-16 lg:py-20"
    :class="surface === 'surface' ? 'bg-surface' : 'bg-ground'"
  >
    <div class="mx-auto max-w-[1440px] px-[var(--margin)]">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div class="max-w-2xl">
          <span
            v-if="eyebrow"
            class="mb-3 inline-flex items-center border border-surface-3 px-3 py-1 text-xs font-semibold text-brand-soft"
            :class="surface === 'surface' ? 'bg-ground' : 'bg-surface'"
          >
            {{ eyebrow }}
          </span>
          <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">{{ title }}</h2>
          <p class="mt-2 text-base leading-relaxed text-muted">{{ description }}</p>
        </div>
        <router-link
          :to="type ? { name: 'Courses', query: { type } } : { name: 'Courses' }"
          class="inline-flex items-center gap-2 border border-surface-3 bg-surface px-4 py-2.5 text-sm font-semibold text-brand-soft transition-colors hover:border-brand hover:bg-tint"
        >
          Xem tất cả
          <span aria-hidden="true">→</span>
        </router-link>
      </div>

      <div
        v-if="loading"
        class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Đang tải khóa học"
        aria-busy="true"
      >
        <CourseCardSkeleton v-for="index in 3" :key="index" />
      </div>

      <div v-else-if="error" role="alert" class="mt-8 border border-surface-3 bg-brand-surface p-6 text-ink">
        <p class="text-base">{{ error }}</p>
        <button
          type="button"
          class="manage-button-primary mt-4"
          @click="emit('retry')"
        >
          Thử tải lại
        </button>
      </div>

      <div
        v-else-if="courses.length === 0"
        class="mt-8 border border-surface-3 bg-surface px-8 py-12 text-center text-base text-muted"
      >
        Hiện chưa có khóa học được xuất bản trong mục này.
      </div>

      <div v-else class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>
    </div>
  </section>
</template>
