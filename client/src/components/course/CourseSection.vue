<script setup lang="ts">
import CourseCard from '@/components/course/CourseCard.vue';
import CourseCardSkeleton from '@/components/course/CourseCardSkeleton.vue';
import type { CourseCard as CourseCardType, CourseType } from '@/types/course';

defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  courses: CourseCardType[];
  loading: boolean;
  error: string | null;
  type?: CourseType;
}>();

const emit = defineEmits<{
  retry: [];
}>();
</script>

<template>
  <section class="scroll-mt-24">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">
            {{ eyebrow }}
          </p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
            {{ title }}
          </h2>
        </div>
        <div class="flex flex-wrap items-end justify-between gap-4 sm:justify-end">
          <p class="max-w-lg text-sm leading-6 text-slate-400">{{ description }}</p>
          <router-link
            :to="type ? { name: 'Courses', query: { type } } : { name: 'Courses' }"
            class="shrink-0 text-sm font-semibold text-cyan-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            Xem tất cả
            <span aria-hidden="true">→</span>
          </router-link>
        </div>
      </div>

      <div
        v-if="loading"
        class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        aria-label="Đang tải khóa học"
        aria-busy="true"
      >
        <CourseCardSkeleton v-for="index in 3" :key="index" />
      </div>

      <div
        v-else-if="error"
        role="alert"
        class="mt-8 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6 text-center"
      >
        <p class="text-sm text-rose-200">{{ error }}</p>
        <button
          type="button"
          class="mt-4 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:border-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-300"
          @click="emit('retry')"
        >
          Thử tải lại
        </button>
      </div>

      <div
        v-else-if="courses.length === 0"
        class="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-10 text-center text-sm text-slate-400"
      >
        Hiện chưa có khóa học trong mục này.
      </div>

      <div v-else class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in courses" :key="course.id" :course="course" />
      </div>
    </div>
  </section>
</template>
