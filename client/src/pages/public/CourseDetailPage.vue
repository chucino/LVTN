<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import axios from 'axios';
import {
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Clock3,
  PlayCircle,
  Star,
  UserRound,
} from 'lucide-vue-next';
import CourseCover from '@/components/course/CourseCover.vue';
import { formatCourseDuration, formatCoursePrice, getCourseErrorMessage } from '@/lib/course-format';
import { coursesApi } from '@/services/courses.api';
import { useAuthStore } from '@/stores/auth.store';
import type { CourseDetail } from '@/types/course';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const course = ref<CourseDetail | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const notFound = ref(false);
const actionNotice = ref('');
let activeController: AbortController | null = null;
let requestVersion = 0;

const currentPrice = computed(() => {
  if (!course.value) return '';
  return course.value.type === 'FREE'
    ? 'Miễn phí'
    : formatCoursePrice(course.value.discountPrice ?? course.value.price);
});

function instructorInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase();
}

async function loadCourse(id: string): Promise<void> {
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  const currentVersion = ++requestVersion;
  loading.value = true;
  error.value = null;
  notFound.value = false;
  course.value = null;
  actionNotice.value = '';

  try {
    course.value = await coursesApi.getCourseById(id, controller.signal);
    if (currentVersion === requestVersion && course.value) {
      document.title = `${course.value.title} - NextCode`;
    }
  } catch (requestError) {
    if (currentVersion === requestVersion && !controller.signal.aborted) {
      notFound.value =
        axios.isAxiosError(requestError) && requestError.response?.status === 404;
      error.value = getCourseErrorMessage(requestError);
    }
  } finally {
    if (currentVersion === requestVersion) loading.value = false;
  }
}

function handleCourseAction(): void {
  if (!authStore.isAuthenticated) {
    void router.push({
      name: 'Login',
      query: { redirect: route.fullPath },
    });
    return;
  }
  actionNotice.value =
    course.value?.type === 'FREE'
      ? 'Chức năng đăng ký học sẽ sớm có.'
      : 'Chức năng mua khóa học sẽ sớm có.';
}

watch(
  () => route.params.id,
  (id) => {
    document.title = 'Chi tiết khóa học - NextCode';
    const courseId = Array.isArray(id) ? id[0] : id;
    if (courseId) void loadCourse(courseId);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  activeController?.abort();
});
</script>

<template>
  <div class="min-h-[70vh]">
    <div v-if="loading" class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-busy="true">
      <div class="h-4 w-36 animate-pulse rounded bg-slate-800" />
      <div class="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <div class="space-y-5">
          <div class="aspect-video animate-pulse rounded-3xl bg-slate-900" />
          <div class="h-8 w-3/4 animate-pulse rounded bg-slate-800" />
          <div class="h-4 w-full animate-pulse rounded bg-slate-800" />
        </div>
        <div class="h-64 animate-pulse rounded-3xl bg-slate-900" />
      </div>
    </div>

    <section
      v-else-if="error"
      class="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6"
      role="alert"
    >
      <div class="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 sm:p-12">
        <h1 class="text-2xl font-black text-white">
          {{ notFound ? 'Không tìm thấy khóa học' : 'Chưa thể tải khóa học' }}
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-400">{{ error }}</p>
        <div class="mt-6 flex flex-wrap justify-center gap-3">
          <button
            v-if="!notFound"
            type="button"
            class="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            @click="loadCourse(String(route.params.id))"
          >
            Thử tải lại
          </button>
          <router-link
            :to="{ name: 'Courses' }"
            class="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            Khám phá khóa học
          </router-link>
        </div>
      </div>
    </section>

    <template v-else-if="course">
      <section class="relative overflow-hidden border-b border-slate-800/80 bg-slate-900/35">
        <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(79,70,229,0.18),transparent_44%),radial-gradient(ellipse_at_90%_50%,rgba(6,182,212,0.1),transparent_40%)]" />
        <div class="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <router-link
            :to="{ name: 'Courses' }"
            class="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            <span aria-hidden="true">←</span> Tất cả khóa học
          </router-link>
          <div class="mt-7 grid items-start gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span
                  class="rounded-full border px-3 py-1 text-xs font-bold"
                  :class="course.type === 'FREE' ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-300' : 'border-amber-300/20 bg-amber-400/10 text-amber-200'"
                >
                  {{ course.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
                </span>
                <span class="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
                  {{ course.level }}
                </span>
                <span class="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-300">
                  {{ course.category.name }}
                </span>
              </div>
              <h1 class="mt-5 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
                {{ course.title }}
              </h1>
              <p class="mt-5 whitespace-pre-line text-base leading-7 text-slate-300">
                {{ course.description }}
              </p>
              <div class="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
                <span class="inline-flex items-center gap-2 text-amber-300">
                  <Star class="h-4 w-4 fill-current" />
                  {{ course.avgRating.toFixed(1) }}
                </span>
                <span class="inline-flex items-center gap-2">
                  <BookOpen class="h-4 w-4 text-cyan-300" />
                  {{ course.totalChapters }} chương · {{ course.totalLessons }} bài học
                </span>
                <span class="inline-flex items-center gap-2">
                  <Clock3 class="h-4 w-4 text-cyan-300" />
                  {{ formatCourseDuration(course.totalDuration) }}
                </span>
              </div>
            </div>

            <aside class="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/85 shadow-2xl shadow-black/30">
              <CourseCover :src="course.thumbnail" :title="course.title" />
              <div class="p-5 sm:p-6">
                <p class="text-2xl font-black text-white">{{ currentPrice }}</p>
                <p
                  v-if="course.type === 'PRO' && course.discountPrice !== null"
                  class="mt-1 text-sm text-slate-500 line-through"
                >
                  {{ formatCoursePrice(course.price) }}
                </p>
                <button
                  type="button"
                  class="mt-5 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/40 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  @click="handleCourseAction"
                >
                  {{ course.type === 'FREE' ? 'Đăng ký học' : 'Mua khóa học' }}
                </button>
                <p v-if="actionNotice" class="mt-3 text-center text-sm text-cyan-200" role="status">
                  {{ actionNotice }}
                </p>
                <div class="mt-5 border-t border-slate-800 pt-5">
                  <p class="text-xs font-bold uppercase tracking-wider text-slate-500">Giảng viên</p>
                  <div class="mt-3 flex items-center gap-3">
                    <img
                      v-if="course.instructor.avatar"
                      :src="course.instructor.avatar"
                      :alt="`Ảnh đại diện ${course.instructor.fullName}`"
                      class="h-11 w-11 rounded-full object-cover"
                    />
                    <span
                      v-else
                      aria-hidden="true"
                      class="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white"
                    >
                      {{ instructorInitials(course.instructor.fullName) }}
                    </span>
                    <span class="font-semibold text-white">{{ course.instructor.fullName }}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <div class="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-14">
        <div class="space-y-10">
          <section aria-labelledby="audience-heading">
            <h2 id="audience-heading" class="text-2xl font-black text-white">Khóa học phù hợp với ai?</h2>
            <p class="mt-4 whitespace-pre-line leading-7 text-slate-300">{{ course.targetAudience }}</p>
          </section>

          <section aria-labelledby="outcomes-heading">
            <h2 id="outcomes-heading" class="text-2xl font-black text-white">Bạn sẽ học được gì?</h2>
            <ul class="mt-5 grid gap-3 sm:grid-cols-2">
              <li
                v-for="outcome in course.learningOutcomes"
                :key="outcome"
                class="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm leading-6 text-slate-300"
              >
                <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                {{ outcome }}
              </li>
            </ul>
          </section>

          <section aria-labelledby="curriculum-heading">
            <div class="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 id="curriculum-heading" class="text-2xl font-black text-white">Nội dung khóa học</h2>
                <p class="mt-2 text-sm text-slate-400">
                  {{ course.totalChapters }} chương · {{ course.totalLessons }} bài học ·
                  {{ formatCourseDuration(course.totalDuration) }}
                </p>
              </div>
            </div>
            <div class="mt-5 space-y-3">
              <details
                v-for="chapter in course.chapters"
                :key="chapter.id"
                class="group overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50"
              >
                <summary class="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-cyan-300 sm:px-5">
                  <span class="font-semibold text-white">{{ chapter.order }}. {{ chapter.title }}</span>
                  <span class="shrink-0 text-xs text-slate-400">{{ chapter.lessons.length }} bài</span>
                </summary>
                <ul class="border-t border-slate-800 px-4 sm:px-5">
                  <li
                    v-for="lesson in chapter.lessons"
                    :key="lesson.id"
                    class="flex items-center justify-between gap-4 border-b border-slate-800/70 py-3 last:border-0"
                  >
                    <span class="flex min-w-0 items-center gap-3 text-sm text-slate-300">
                      <PlayCircle class="h-4 w-4 shrink-0 text-cyan-300" />
                      <span class="truncate">{{ lesson.order }}. {{ lesson.title }}</span>
                      <CircleHelp
                        v-if="lesson.hasQuiz"
                        class="h-4 w-4 shrink-0 text-violet-300"
                        aria-label="Có bài kiểm tra"
                      />
                    </span>
                    <span class="shrink-0 text-xs text-slate-500">
                      {{ formatCourseDuration(lesson.duration) }}
                    </span>
                  </li>
                </ul>
              </details>
            </div>
          </section>

          <section aria-labelledby="requirements-heading">
            <h2 id="requirements-heading" class="text-2xl font-black text-white">Yêu cầu với học viên</h2>
            <p class="mt-4 whitespace-pre-line leading-7 text-slate-300">{{ course.requirements }}</p>
          </section>
        </div>

        <aside class="h-fit rounded-2xl border border-slate-800 bg-slate-900/50 p-5 lg:sticky lg:top-28">
          <h2 class="flex items-center gap-2 font-bold text-white">
            <UserRound class="h-5 w-5 text-cyan-300" />
            Về giảng viên
          </h2>
          <div class="mt-4 flex items-center gap-3">
            <img
              v-if="course.instructor.avatar"
              :src="course.instructor.avatar"
              :alt="`Ảnh đại diện ${course.instructor.fullName}`"
              class="h-12 w-12 rounded-full object-cover"
            />
            <span
              v-else
              aria-hidden="true"
              class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white"
            >
              {{ instructorInitials(course.instructor.fullName) }}
            </span>
            <p class="font-semibold text-white">{{ course.instructor.fullName }}</p>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>
