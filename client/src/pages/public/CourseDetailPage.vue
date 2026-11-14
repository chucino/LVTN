<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import axios from 'axios';
import {
  Award,
  CheckCircle2,
  CircleHelp,
  Pencil,
  PlayCircle,
} from 'lucide-vue-next';
import CourseCover from '@/components/course/CourseCover.vue';
import CourseReviewsSection from '@/components/course/CourseReviewsSection.vue';
import {
  formatCourseDuration,
  formatCoursePrice,
  getCourseErrorMessage,
} from '@/lib/course-format';
import { coursesApi } from '@/services/courses.api';
import { enrollmentsApi } from '@/services/enrollments.api';
import { useAuthStore } from '@/stores/auth.store';
import type { CourseDetail } from '@/types/course';
import type { EnrollmentStatusResponse } from '@/types/learning';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const course = ref<CourseDetail | null>(null);
const enrollmentStatus = ref<EnrollmentStatusResponse | null>(null);
const loading = ref(true);
const enrolling = ref(false);
const error = ref<string | null>(null);
const notFound = ref(false);
const actionNotice = ref('');
const actionError = ref('');
let activeController: AbortController | null = null;
let requestVersion = 0;

const currentPrice = computed(() => {
  if (!course.value) return '';
  return course.value.type === 'FREE'
    ? 'Miễn phí'
    : formatCoursePrice(course.value.discountPrice ?? course.value.price);
});

const isEnrolled = computed(() => Boolean(enrollmentStatus.value?.enrolled));
const isStudent = computed(
  () => !authStore.isAuthenticated || authStore.user?.role === 'STUDENT',
);
const canManageThisCourse = computed(() => {
  if (!authStore.user || !course.value) return false;
  if (authStore.user.role === 'ADMIN') return true;
  return (
    authStore.user.role === 'INSTRUCTOR' &&
    course.value.instructor.id === authStore.user.id
  );
});

const primaryActionLabel = computed(() => {
  if (!course.value) return 'Đăng ký học ngay';
  if (enrolling.value) return 'Đang đăng ký...';
  if (isEnrolled.value) {
    return enrollmentStatus.value?.status === 'COMPLETED'
      ? 'Xem lại bài học'
      : 'Tiếp tục học ngay';
  }
  return course.value.type === 'FREE'
    ? 'Đăng ký học ngay'
    : 'Đăng ký khóa học Pro';
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
  enrollmentStatus.value = null;
  actionNotice.value = '';
  actionError.value = '';

  try {
    const [courseData, statusData] = await Promise.all([
      coursesApi.getCourseById(id, controller.signal),
      authStore.isAuthenticated
        ? enrollmentsApi
            .getEnrollmentStatus(id, controller.signal)
            .catch(() => null)
        : Promise.resolve(null),
    ]);
    if (currentVersion === requestVersion && courseData) {
      course.value = courseData;
      enrollmentStatus.value = statusData;
      document.title = `${courseData.title} - NextCode`;
    }
  } catch (requestError) {
    if (currentVersion === requestVersion && !controller.signal.aborted) {
      notFound.value =
        axios.isAxiosError(requestError) &&
        requestError.response?.status === 404;
      error.value = getCourseErrorMessage(requestError);
    }
  } finally {
    if (currentVersion === requestVersion) loading.value = false;
  }
}

async function handleCourseAction(): Promise<void> {
  if (!course.value) return;
  actionNotice.value = '';
  actionError.value = '';

  if (!authStore.isAuthenticated) {
    await router.push({
      name: 'Login',
      query: { redirect: route.fullPath },
    });
    return;
  }

  if (authStore.user?.role !== 'STUDENT') {
    actionError.value =
      'Chỉ tài khoản Học viên mới có thể đăng ký học khóa học.';
    return;
  }

  // Nếu đã đăng ký -> chuyển thẳng vào giao diện học tập
  if (isEnrolled.value) {
    await router.push({
      name: 'CourseLearning',
      params: { courseId: course.value.id },
      query: enrollmentStatus.value?.lastLessonId
        ? { lessonId: enrollmentStatus.value.lastLessonId }
        : undefined,
    });
    return;
  }

  if (course.value.type === 'PRO') {
    actionNotice.value =
      'Khóa học Pro yêu cầu tạo đơn hàng và thanh toán. Chức năng thanh toán QR đang được tích hợp.';
    return;
  }

  // Khóa học FREE -> Gọi API đăng ký và chuyển thẳng vào phòng học
  enrolling.value = true;
  try {
    const overview = await enrollmentsApi.enrollCourse(course.value.id);
    await router.push({
      name: 'CourseLearning',
      params: { courseId: course.value.id },
      query: overview.lastLessonId
        ? { lessonId: overview.lastLessonId }
        : undefined,
    });
  } catch (err) {
    actionError.value = getCourseErrorMessage(err);
  } finally {
    enrolling.value = false;
  }
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
  <div class="min-h-[70svh]">
    <div v-if="loading" class="mx-auto max-w-[1440px] px-[var(--margin)] py-12" aria-busy="true">
      <div class="h-4 w-36 rounded bg-surface" />
      <div class="mt-8 grid gap-8 lg:grid-cols-12">
        <div class="space-y-5 lg:col-span-7">
          <div class="aspect-video bg-surface" />
          <div class="h-8 w-3/4 rounded bg-surface" />
          <div class="h-4 w-full rounded bg-surface" />
        </div>
        <div class="h-64 bg-surface lg:col-span-5" />
      </div>
    </div>

    <section
      v-else-if="error"
      class="mx-auto max-w-3xl px-[var(--margin)] py-20"
      role="alert"
    >
      <div class="bg-surface p-8 sm:p-12">
        <h1 class="text-2xl font-bold text-ink sm:text-3xl">
          {{ notFound ? 'Không tìm thấy khóa học' : 'Chưa thể tải khóa học' }}
        </h1>
        <p class="mt-3 text-base leading-relaxed text-muted">{{ error }}</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <button
            v-if="!notFound"
            type="button"
            class="manage-button-primary"
            @click="loadCourse(String(route.params.id))"
          >
            Thử tải lại
          </button>
          <router-link :to="{ name: 'Courses' }" class="manage-button-secondary">
            Quay về danh sách khóa học
          </router-link>
        </div>
      </div>
    </section>

    <template v-else-if="course">
      <!-- Banner -->
      <section class="bg-navy py-10 text-white no-radius sm:py-14">
        <div class="mx-auto max-w-[1440px] px-[var(--margin)]">
          <router-link
            :to="{ name: 'Courses' }"
            class="inline-flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-white"
          >
            <span aria-hidden="true">←</span> Tất cả khóa học
          </router-link>

          <div class="mt-6 max-w-3xl lg:pr-[440px]">
            <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span class="rounded-full px-3 py-1" :class="course.type === 'FREE' ? 'bg-[#4fd1a5] text-[#06382c]' : 'bg-white text-navy'">
                {{ course.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
              </span>
              <span class="rounded-full bg-white/15 px-3 py-1">{{ course.level }}</span>
              <span class="rounded-full bg-white/15 px-3 py-1">{{ course.category.name }}</span>
            </div>
            <h1 class="mt-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              {{ course.title }}
            </h1>
            <p class="mt-4 line-clamp-4 whitespace-pre-line text-base leading-relaxed text-white/80">
              {{ course.description }}
            </p>
            <div class="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/75">
              <span v-if="course.avgRating > 0" class="tabular-nums">Đánh giá {{ course.avgRating.toFixed(1) }} / 5.0</span>
              <span class="tabular-nums">{{ course.totalChapters }} chương · {{ course.totalLessons }} bài học</span>
              <span class="tabular-nums">Thời lượng {{ formatCourseDuration(course.totalDuration) }}</span>
              <span>Giảng viên: {{ course.instructor.fullName }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="mx-auto max-w-[1440px] px-[var(--margin)]">
        <div class="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <!-- Cột nội dung -->
          <div class="order-2 space-y-10 py-10 lg:order-1">
            <section aria-labelledby="outcomes-heading">
              <h2 id="outcomes-heading" class="text-2xl font-bold text-ink">Bạn sẽ học được gì</h2>
              <ul class="mt-5 grid gap-3 sm:grid-cols-2">
                <li
                  v-for="outcome in course.learningOutcomes"
                  :key="outcome"
                  class="flex items-start gap-3 bg-surface p-4 text-sm leading-relaxed text-ink"
                >
                  <CheckCircle2 class="mt-0.5 h-5 w-5 shrink-0 text-teal" />
                  <span>{{ outcome }}</span>
                </li>
              </ul>
            </section>

            <section aria-labelledby="curriculum-heading">
              <h2 id="curriculum-heading" class="text-2xl font-bold text-ink">Nội dung khóa học</h2>
              <p class="mt-1 text-sm tabular-nums text-muted">
                {{ course.totalChapters }} chương · {{ course.totalLessons }} bài giảng · {{ formatCourseDuration(course.totalDuration) }}
              </p>

              <div class="mt-5 space-y-3">
                <details
                  v-for="chapter in course.chapters"
                  :key="chapter.id"
                  open
                  class="group overflow-hidden bg-surface"
                >
                  <summary class="flex cursor-pointer list-none items-center justify-between gap-4 bg-surface-2 px-5 py-4 text-left">
                    <span class="text-base font-bold text-ink">Chương {{ chapter.order }}: {{ chapter.title }}</span>
                    <span class="shrink-0 text-sm tabular-nums text-muted">{{ chapter.lessons.length }} bài</span>
                  </summary>
                  <ul class="p-2 sm:p-3">
                    <li
                      v-for="lesson in chapter.lessons"
                      :key="lesson.id"
                      class="flex items-center justify-between gap-4 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-surface-2"
                    >
                      <span class="flex min-w-0 items-center gap-3 text-ink">
                        <PlayCircle class="h-4 w-4 shrink-0 text-brand-soft" />
                        <span class="truncate">{{ lesson.order }}. {{ lesson.title }}</span>
                        <CircleHelp
                          v-if="lesson.hasQuiz"
                          class="h-4 w-4 shrink-0 text-teal"
                          aria-label="Có câu hỏi ôn tập"
                        />
                      </span>
                      <span class="shrink-0 text-xs tabular-nums text-muted">
                        {{ formatCourseDuration(lesson.duration) }}
                      </span>
                    </li>
                  </ul>
                </details>
              </div>
            </section>

            <section aria-labelledby="audience-heading">
              <h2 id="audience-heading" class="text-2xl font-bold text-ink">Đối tượng và yêu cầu</h2>
              <div class="mt-5 grid gap-4 sm:grid-cols-2">
                <div class="bg-surface p-6">
                  <h3 class="text-base font-bold text-ink">Khóa học phù hợp với ai</h3>
                  <p class="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {{ course.targetAudience }}
                  </p>
                </div>
                <div class="bg-surface p-6">
                  <h3 class="text-base font-bold text-ink">Yêu cầu đầu vào</h3>
                  <p class="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {{ course.requirements }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Phần Đánh giá của các học viên học trước đó ở cuối trang khóa học -->
            <CourseReviewsSection
              :course-id="course.id"
              @rating-updated="course.avgRating = $event"
            />
          </div>

          <!-- Thẻ đăng ký -->
          <aside class="relative z-10 order-1 lg:order-2 lg:sticky lg:top-24 lg:-mt-[300px] lg:py-0">
            <div class="-mt-6 overflow-hidden bg-surface lg:mt-0">
              <CourseCover :src="course.thumbnail" :title="course.title" :category="course.category.name" />
              <div class="p-6">
                <div class="flex items-baseline gap-3">
                  <p class="text-3xl font-extrabold tabular-nums" :class="course.type === 'FREE' ? 'text-teal' : 'text-ink'">{{ currentPrice }}</p>
                  <p
                    v-if="course.type === 'PRO' && course.discountPrice !== null"
                    class="text-sm tabular-nums text-muted line-through"
                  >
                    {{ formatCoursePrice(course.price) }}
                  </p>
                </div>

                <!-- Tiến độ nếu học viên đã đăng ký -->
                <div
                  v-if="isEnrolled && enrollmentStatus"
                  class="mt-4 bg-ground p-4"
                >
                  <div class="flex items-center justify-between text-xs font-semibold text-ink">
                    <span>
                      {{
                        enrollmentStatus.status === 'COMPLETED'
                          ? 'Đã hoàn thành khóa học'
                          : 'Đang theo học'
                      }}
                    </span>
                    <span class="tabular-nums text-brand-soft">
                      {{ enrollmentStatus.progressPercent }}%
                    </span>
                  </div>
                  <div class="mt-2 h-2 overflow-hidden rounded-full bg-surface-3">
                    <div
                      class="h-full rounded-full bg-teal"
                      :style="{ width: `${enrollmentStatus.progressPercent}%` }"
                    />
                  </div>
                  <router-link
                    v-if="enrollmentStatus.certificateCode"
                    :to="{
                      name: 'CertificateVerifyCode',
                      params: { code: enrollmentStatus.certificateCode },
                    }"
                    class="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:underline"
                  >
                    <Award class="h-4 w-4" />
                    <span>Chứng chỉ: {{ enrollmentStatus.certificateCode }}</span>
                  </router-link>
                </div>

                <button
                  v-if="isStudent"
                  type="button"
                  :disabled="enrolling"
                  class="manage-button-primary mt-5 w-full !min-h-12 text-base"
                  @click="handleCourseAction"
                >
                  {{ primaryActionLabel }}
                </button>
                <div v-else class="mt-5 space-y-2.5">
                  <router-link
                    v-if="course.totalLessons > 0"
                    :to="{ name: 'CourseLearning', params: { courseId: course.id } }"
                    class="manage-button-primary flex w-full !min-h-12 items-center justify-center gap-2 text-base"
                  >
                    <PlayCircle class="h-5 w-5" />
                    <span>Xem khóa học</span>
                  </router-link>
                  <router-link
                    v-if="canManageThisCourse"
                    :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
                    class="manage-button-secondary flex w-full !min-h-12 items-center justify-center gap-2 text-base"
                  >
                    <Pencil class="h-4 w-4" />
                    <span>Quản lý khóa học này</span>
                  </router-link>
                </div>

                <p v-if="actionNotice" class="mt-3 text-sm text-brand-soft" role="status">
                  {{ actionNotice }}
                </p>
                <p v-if="actionError" class="mt-3 text-sm text-brand-soft" role="alert">
                  {{ actionError }}
                </p>

                <ul class="mt-5 space-y-2.5 text-sm text-muted">
                  <li class="flex items-center gap-2.5"><PlayCircle class="h-4 w-4 text-brand-soft" /> {{ course.totalLessons }} bài giảng video</li>
                  <li class="flex items-center gap-2.5"><CircleHelp class="h-4 w-4 text-brand-soft" /> Trắc nghiệm theo từng bài</li>
                  <li class="flex items-center gap-2.5"><CheckCircle2 class="h-4 w-4 text-brand-soft" /> Học tuần tự & nhận chứng chỉ khi hoàn thành</li>
                </ul>

                <div class="mt-6 bg-surface-2 p-4">
                  <p class="text-xs text-muted">Giảng viên biên soạn</p>
                  <div class="mt-2.5 flex items-center gap-3">
                    <img
                      v-if="course.instructor.avatar"
                      :src="course.instructor.avatar"
                      :alt="`Ảnh đại diện ${course.instructor.fullName}`"
                      width="40"
                      height="40"
                      class="h-10 w-10 rounded-full object-cover"
                    />
                    <span
                      v-else
                      aria-hidden="true"
                      class="flex h-10 w-10 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white"
                    >
                      {{ instructorInitials(course.instructor.fullName) }}
                    </span>
                    <span class="font-semibold text-ink">{{ course.instructor.fullName }}</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </template>
  </div>
</template>
