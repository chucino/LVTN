<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  CircleHelp,
  Eye,
  FileText,
  Lock,
  MessageCircle,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  PlayCircle,
  Sparkles,
} from 'lucide-vue-next';
import CertificateCardView from '@/components/certificate/CertificateCardView.vue';
import LessonDiscussionDrawer from '@/components/learning/LessonDiscussionDrawer.vue';
import LessonQuizPanel from '@/components/learning/LessonQuizPanel.vue';
import LessonVideoPlayer from '@/components/learning/LessonVideoPlayer.vue';
import { formatCourseDuration, getCourseErrorMessage } from '@/lib/course-format';
import { enrollmentsApi } from '@/services/enrollments.api';
import type {
  CourseLearningOverview,
  CurriculumLessonItem,
  LessonLearningDetail,
  SubmitQuizResponse,
} from '@/types/learning';

const route = useRoute();
const router = useRouter();

const overview = ref<CourseLearningOverview | null>(null);
const currentLesson = ref<LessonLearningDetail | null>(null);
const loadingOverview = ref(true);
const loadingLesson = ref(false);
const error = ref<string | null>(null);
const lessonError = ref<string | null>(null);

const sidebarCollapsed = ref(false);
const showCertificateView = ref(false);
const submittingQuiz = ref(false);
const lastQuizResult = ref<SubmitQuizResponse | null>(null);
const completionToast = ref<string | null>(null);
const discussionOpen = ref(false);
const lessonCommentsCount = ref(0);

const courseId = computed(() => {
  const raw = route.params.courseId;
  return Array.isArray(raw) ? (raw[0] ?? '') : String(raw ?? '');
});

async function loadOverviewAndInitialLesson(): Promise<void> {
  if (!courseId.value) return;
  loadingOverview.value = true;
  error.value = null;

  try {
    const data = await enrollmentsApi.getCourseLearning(courseId.value);
    overview.value = data;
    document.title = `Học: ${data.courseTitle} - NextCode`;

    const queryLessonId =
      typeof route.query.lessonId === 'string' ? route.query.lessonId : null;
    const firstUnlocked =
      data.chapters
        .flatMap((c) => c.lessons)
        .find((l) => l.status !== 'LOCKED')?.id ?? null;

    const targetLessonId =
      queryLessonId || data.lastLessonId || firstUnlocked;

    if (targetLessonId) {
      await selectLesson(targetLessonId, false);
    }
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    loadingOverview.value = false;
  }
}

async function refreshOverviewSilently(): Promise<void> {
  if (!courseId.value) return;
  try {
    overview.value = await enrollmentsApi.getCourseLearning(courseId.value);
  } catch {
    // keep current overview
  }
}

async function selectLesson(
  lessonId: string,
  updateQuery = true,
): Promise<void> {
  if (!courseId.value) return;
  loadingLesson.value = true;
  lessonError.value = null;
  lastQuizResult.value = null;
  completionToast.value = null;
  showCertificateView.value = false;

  try {
    const detail = await enrollmentsApi.getLessonForLearning(
      courseId.value,
      lessonId,
    );
    currentLesson.value = detail;
    if (overview.value) {
      overview.value.lastLessonId = detail.id;
    }
    if (updateQuery && route.query.lessonId !== lessonId) {
      await router.replace({
        query: { ...route.query, lessonId },
      });
    }
  } catch (err) {
    lessonError.value = getCourseErrorMessage(err);
  } finally {
    loadingLesson.value = false;
  }
}

async function handleVideoProgress(payload: {
  lastPositionSec: number;
  watchedFully: boolean;
}): Promise<void> {
  if (!courseId.value || !currentLesson.value) return;
  if (overview.value?.isPreviewMode) return;
  const targetLessonId = currentLesson.value.id;
  const wasWatchedFully = currentLesson.value.watchedFully;

  try {
    const updated = await enrollmentsApi.updateLessonProgress(
      courseId.value,
      targetLessonId,
      payload,
    );

    if (currentLesson.value && currentLesson.value.id === targetLessonId) {
      currentLesson.value.lastPositionSec = updated.lastPositionSec;
      currentLesson.value.watchedFully = updated.watchedFully;
      currentLesson.value.quizPassed = updated.quizPassed;
      currentLesson.value.status = updated.status;
      currentLesson.value.quizUnlocked = updated.quizUnlocked;
      if (updated.unlockedNextLessonId) {
        currentLesson.value.nextLessonUnlocked = true;
      }
    }

    // Khi video vừa chạy hết 100% lần đầu tiên: tải lại chi tiết bài để nhận câu hỏi trắc nghiệm và cập nhật mục lục
    if (payload.watchedFully && !wasWatchedFully) {
      await Promise.all([
        refreshOverviewSilently(),
        enrollmentsApi
          .getLessonForLearning(courseId.value, targetLessonId)
          .then((fresh) => {
            if (currentLesson.value?.id === targetLessonId) {
              currentLesson.value = fresh;
            }
          }),
      ]);

      if (updated.certificate) {
        completionToast.value = `Chúc mừng bạn đã hoàn thành 100% khóa học và nhận chứng chỉ ${updated.certificate.certificateCode}!`;
      } else if (updated.unlockedNextLessonId) {
        completionToast.value =
          'Bạn đã hoàn thành bài học này. Bài học tiếp theo đã được mở khóa!';
      } else if (updated.quizUnlocked) {
        completionToast.value =
          'Bạn đã xem hết video. Hãy hoàn thành câu hỏi trắc nghiệm bên dưới để mở bài tiếp theo.';
      }
    }
  } catch (err) {
    lessonError.value = getCourseErrorMessage(err);
  }
}

async function handleQuizSubmit(
  answers: Array<{ questionId: string; selectedOption: number }>,
): Promise<void> {
  if (!courseId.value || !currentLesson.value) return;
  submittingQuiz.value = true;
  lessonError.value = null;

  try {
    const result = await enrollmentsApi.submitLessonQuiz(
      courseId.value,
      currentLesson.value.id,
      answers,
    );
    lastQuizResult.value = result;

    if (overview.value?.isPreviewMode) {
      completionToast.value = result.passed
        ? `Chế độ xem thử: Đạt ${result.scorePercent}% (${result.correctCount}/${result.totalQuestions} câu đúng). Kết quả làm thử không lưu vào thống kê học viên.`
        : `Chế độ xem thử: Đạt ${result.scorePercent}% (${result.correctCount}/${result.totalQuestions} câu đúng — yêu cầu ${result.requiredPassPercent}%). Bạn có thể chọn lại đáp án để kiểm tra tiếp.`;
      return;
    }

    if (result.passed) {
      await Promise.all([
        refreshOverviewSilently(),
        enrollmentsApi
          .getLessonForLearning(courseId.value, currentLesson.value.id)
          .then((fresh) => {
            currentLesson.value = fresh;
          }),
      ]);

      if (result.certificate) {
        completionToast.value = `Chúc mừng bạn đã hoàn thành toàn bộ khóa học! Chứng chỉ ${result.certificate.certificateCode} đã sẵn sàng.`;
      } else if (result.unlockedNextLessonId) {
        completionToast.value =
          'Bạn đã vượt qua bài kiểm tra trắc nghiệm! Bài học tiếp theo đã mở khóa.';
      }
    }
  } catch (err) {
    lessonError.value = getCourseErrorMessage(err);
  } finally {
    submittingQuiz.value = false;
  }
}

function handleCurriculumClick(lesson: CurriculumLessonItem): void {
  if (lesson.status === 'LOCKED') return;
  void selectLesson(lesson.id);
}

watch(
  () => route.params.courseId,
  () => {
    void loadOverviewAndInitialLesson();
  },
);

onMounted(() => {
  void loadOverviewAndInitialLesson();
});
</script>

<template>
  <div data-ui class="min-h-svh bg-ground text-ink">
    <!-- Top Learning Bar -->
    <header class="sticky top-0 z-30 bg-navy text-white no-radius">
      <div class="mx-auto flex min-h-16 max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div class="flex min-w-0 items-center gap-3">
          <router-link
            :to="{ name: 'CourseDetail', params: { id: courseId } }"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
          >
            <ArrowLeft class="h-4 w-4" />
            <span>Về trang khóa học</span>
          </router-link>
          <h1 class="truncate text-sm font-bold text-white sm:text-base">
            {{ overview?.courseTitle || 'Đang tải khóa học...' }}
          </h1>
        </div>

        <div v-if="overview" class="flex flex-wrap items-center gap-3">
          <!-- Khi Giảng viên / Admin đang ở chế độ Xem khóa học -->
          <template v-if="overview.isPreviewMode">
            <span class="hidden items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#4fd1a5] sm:inline-flex">
              <Eye class="h-3.5 w-3.5" />
              <span>Chế độ xem khóa học (Không lưu tiến độ)</span>
            </span>
            <router-link
              v-if="overview.canManageCourse"
              :to="{ name: 'ManageCourseEdit', params: { id: courseId } }"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#4fd1a5] px-3 py-1.5 text-xs font-bold text-[#06382c] transition-opacity hover:opacity-90"
            >
              <Pencil class="h-3.5 w-3.5" />
              <span>Chế độ biên soạn</span>
            </router-link>
          </template>

          <!-- Khi Học viên đang học bình thường -->
          <div v-else class="hidden items-center gap-3 sm:flex">
            <div class="text-right text-xs">
              <span class="font-semibold text-white tabular-nums">
                Tiến độ: {{ overview.progressPercent }}%
              </span>
              <span class="ml-1.5 text-white/70 tabular-nums">
                ({{ overview.completedLessons }}/{{ overview.totalLessons }} bài)
              </span>
            </div>
            <div class="h-2 w-28 overflow-hidden rounded-full bg-white/15">
              <div
                class="h-full rounded-full bg-[#4fd1a5]"
                :style="{ width: `${overview.progressPercent}%` }"
              />
            </div>
          </div>

          <button
            v-if="overview.certificate"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-[#4fd1a5] px-3.5 py-1.5 text-xs font-bold text-[#06382c] transition-opacity hover:opacity-90"
            @click="showCertificateView = !showCertificateView"
          >
            <Award class="h-4 w-4" />
            <span>{{ showCertificateView ? 'Quay lại bài giảng' : 'Xem chứng chỉ' }}</span>
          </button>

          <button
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20"
            @click="sidebarCollapsed = !sidebarCollapsed"
          >
            <PanelRightOpen v-if="sidebarCollapsed" class="h-4 w-4" />
            <PanelRightClose v-else class="h-4 w-4" />
            <span class="hidden md:inline">
              {{ sidebarCollapsed ? 'Mở mục lục' : 'Thu gọn mục lục' }}
            </span>
          </button>
        </div>
      </div>
    </header>

    <!-- Trạng thái đang tải -->
    <div v-if="loadingOverview" class="mx-auto max-w-[1600px] p-6" aria-busy="true">
      <div class="grid gap-6 lg:grid-cols-10">
        <div class="space-y-4 lg:col-span-7">
          <div class="aspect-video bg-surface" />
          <div class="h-24 bg-surface" />
        </div>
        <div class="h-96 bg-surface lg:col-span-3" />
      </div>
    </div>

    <!-- Trạng thái lỗi quyền truy cập / chưa đăng ký -->
    <section v-else-if="error" class="mx-auto max-w-2xl px-4 py-16">
      <div class="bg-surface p-8 text-center">
        <AlertCircle class="mx-auto h-10 w-10 text-brand-soft" />
        <h2 class="mt-4 text-xl font-bold text-ink">Không thể mở phòng học</h2>
        <p class="mt-2 text-sm text-muted">{{ error }}</p>
        <div class="mt-6 flex justify-center gap-3">
          <router-link
            :to="{ name: 'CourseDetail', params: { id: courseId } }"
            class="manage-button-primary"
          >
            Quay về thông tin khóa học
          </router-link>
        </div>
      </div>
    </section>

    <!-- Màn hình học tập bố cục 7/3 -->
    <main v-else-if="overview" class="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
      <!-- Khung hiển thị Chứng chỉ khi người học bấm "Xem chứng chỉ" -->
      <section v-if="showCertificateView && overview.certificate" class="mb-8 space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3 bg-surface p-5">
          <div class="flex items-center gap-3">
            <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-tint text-teal">
              <Sparkles class="h-5 w-5" />
            </span>
            <div>
              <h2 class="text-lg font-bold text-ink">Chúc mừng bạn đã hoàn thành khóa học!</h2>
              <p class="text-xs text-muted">
                Dưới đây là chứng chỉ hoàn thành chính thức của bạn tại NextCode.
              </p>
            </div>
          </div>
          <button
            type="button"
            class="manage-button-secondary text-xs"
            @click="showCertificateView = false"
          >
            Quay lại xem video bài giảng
          </button>
        </div>

        <CertificateCardView
          :certificate-code="overview.certificate.certificateCode"
          :student-name="overview.certificate.studentName"
          :course-title="overview.certificate.courseTitle"
          :instructor-name="overview.certificate.instructorName"
          :issued-at="overview.certificate.issuedAt"
        />
      </section>

      <!-- Bố cục 7/3 -->
      <div v-else class="grid items-start gap-6 lg:grid-cols-10">
        <!-- Cột trái (7 phần, hoặc 10 phần khi thu gọn mục lục) -->
        <div
          class="space-y-6"
          :class="sidebarCollapsed ? 'lg:col-span-10' : 'lg:col-span-7'"
        >
          <div
            v-if="lessonError"
            class="manage-alert-error"
            role="alert"
          >
            <AlertCircle class="h-5 w-5 shrink-0" />
            <span>{{ lessonError }}</span>
          </div>

          <div
            v-if="completionToast"
            class="flex flex-wrap items-center justify-between gap-3 bg-teal-tint p-4 text-sm font-medium text-teal"
            role="status"
          >
            <div class="flex items-center gap-2">
              <CheckCircle2 class="h-5 w-5 shrink-0" />
              <span>{{ completionToast }}</span>
            </div>
            <button
              v-if="overview.certificate"
              type="button"
              class="rounded-lg bg-teal px-3 py-1.5 text-xs font-bold text-white"
              @click="showCertificateView = true"
            >
              Mở chứng chỉ ngay
            </button>
          </div>

          <template v-if="currentLesson">
            <!-- Video Player -->
            <LessonVideoPlayer
              :lesson-id="currentLesson.id"
              :title="currentLesson.title"
              :video-url="currentLesson.videoUrl"
              :duration="currentLesson.duration"
              :last-position-sec="currentLesson.lastPositionSec"
              :watched-fully="currentLesson.watchedFully"
              @progress="handleVideoProgress"
            />

            <!-- Thông tin bài học & Điều hướng Bài trước / Bài tiếp theo -->
            <section class="bg-surface p-6">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-brand-soft">
                    {{ currentLesson.chapterTitle }}
                  </p>
                  <h2 class="mt-1 text-xl font-extrabold text-ink sm:text-2xl">
                    Bài {{ currentLesson.order }}: {{ currentLesson.title }}
                  </h2>
                  <div class="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      class="rounded-full px-3 py-1 font-semibold"
                      :class="
                        currentLesson.status === 'COMPLETED'
                          ? 'bg-teal-tint text-teal'
                          : 'bg-tint text-brand-soft'
                      "
                    >
                      {{
                        overview.isPreviewMode
                          ? 'Chế độ xem thử (Đã mở khóa)'
                          : currentLesson.status === 'COMPLETED'
                            ? 'Đã hoàn thành bài học'
                            : 'Đang học'
                      }}
                    </span>
                    <span class="text-muted">
                      ·
                      <template v-if="overview.isPreviewMode">
                        Tài khoản Giảng viên / Quản trị viên được mở khóa toàn bộ bài giảng và làm thử trắc nghiệm không giới hạn
                      </template>
                      <template v-else-if="currentLesson.hasQuiz">
                        Điều kiện hoàn thành: Xem hết 100% video và đạt bài trắc nghiệm ({{ currentLesson.requiredPassPercent }}%)
                      </template>
                      <template v-else>
                        Điều kiện hoàn thành: Xem hết 100% thời lượng video
                      </template>
                    </span>
                  </div>
                </div>

                <div class="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    :disabled="!currentLesson.previousLessonId || loadingLesson"
                    class="manage-button-secondary text-xs disabled:opacity-45"
                    @click="
                      currentLesson.previousLessonId &&
                        selectLesson(currentLesson.previousLessonId)
                    "
                  >
                    <ArrowLeft class="h-4 w-4" />
                    <span>Bài trước</span>
                  </button>

                  <button
                    type="button"
                    :disabled="
                      !currentLesson.nextLessonId ||
                      !currentLesson.nextLessonUnlocked ||
                      loadingLesson
                    "
                    class="manage-button-primary text-xs disabled:opacity-45"
                    :title="
                      !currentLesson.nextLessonUnlocked
                        ? 'Hoàn thành bài học hiện tại để mở khóa bài tiếp theo'
                        : 'Chuyển sang bài học tiếp theo'
                    "
                    @click="
                      currentLesson.nextLessonId &&
                        currentLesson.nextLessonUnlocked &&
                        selectLesson(currentLesson.nextLessonId)
                    "
                  >
                    <span>Bài tiếp theo</span>
                    <Lock
                      v-if="
                        currentLesson.nextLessonId &&
                        !currentLesson.nextLessonUnlocked
                      "
                      class="h-3.5 w-3.5"
                    />
                    <ArrowRight v-else class="h-4 w-4" />
                  </button>
                </div>
              </div>

              <!-- Ghi chép & Tóm tắt bài giảng (nếu có) -->
              <div
                v-if="currentLesson.note || currentLesson.summary"
                class="mt-6 grid gap-4 pt-2 sm:grid-cols-2"
              >
                <div v-if="currentLesson.note" class="bg-ground p-5">
                  <div class="flex items-center gap-2 text-sm font-bold text-ink">
                    <FileText class="h-4 w-4 text-brand-soft" />
                    <h3>Ghi chép bài giảng</h3>
                  </div>
                  <p class="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {{ currentLesson.note }}
                  </p>
                </div>

                <div v-if="currentLesson.summary" class="bg-ground p-5">
                  <div class="flex items-center gap-2 text-sm font-bold text-ink">
                    <BookOpen class="h-4 w-4 text-teal" />
                    <h3>Tóm tắt trọng tâm</h3>
                  </div>
                  <p class="mt-2 whitespace-pre-line text-sm leading-6 text-muted">
                    {{ currentLesson.summary }}
                  </p>
                </div>
              </div>
            </section>

            <!-- Khung Trắc nghiệm sau video -->
            <LessonQuizPanel
              :lesson-id="currentLesson.id"
              :has-quiz="currentLesson.hasQuiz"
              :quiz-count="currentLesson.quizCount"
              :required-pass-percent="currentLesson.requiredPassPercent"
              :watched-fully="currentLesson.watchedFully"
              :quiz-passed="currentLesson.quizPassed"
              :quiz-unlocked="currentLesson.quizUnlocked"
              :quiz-locked-reason="currentLesson.quizLockedReason"
              :questions="currentLesson.quizQuestions"
              :submitting="submittingQuiz"
              :last-submit-result="lastQuizResult"
              @submit="handleQuizSubmit"
            />

            <!-- Nút nổi "Hỏi đáp" neo theo mép phải của cột bài giảng (tự động dịch sang trái khi mở mục lục) -->
            <div class="pointer-events-none sticky bottom-6 z-20 flex justify-end pt-2">
              <button
                type="button"
                data-ui
                class="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-surface-3 bg-surface px-4 py-2.5 text-sm font-bold text-ink transition-transform hover:-translate-y-0.5 hover:bg-surface-2"
                @click="discussionOpen = true"
              >
                <MessageCircle class="h-4 w-4 text-brand" />
                <span>Hỏi đáp</span>
              </button>
            </div>
          </template>
        </div>

        <!-- Cột phải (3 phần): Mục lục chương & bài học tuần tự -->
        <aside
          v-if="!sidebarCollapsed"
          class="bg-surface p-5 lg:sticky lg:top-20 lg:col-span-3"
          aria-label="Nội dung khóa học"
        >
          <div class="flex items-center justify-between pb-2">
            <div>
              <h2 class="text-base font-bold text-ink">Nội dung khóa học</h2>
              <p class="mt-0.5 text-xs tabular-nums text-muted">
                <template v-if="overview.isPreviewMode">
                  Đã mở khóa toàn bộ {{ overview.totalLessons }} bài học
                </template>
                <template v-else>
                  Hoàn thành {{ overview.completedLessons }}/{{ overview.totalLessons }} bài học ({{ overview.progressPercent }}%)
                </template>
              </p>
            </div>
          </div>

          <div class="mt-4 max-h-[72svh] space-y-3 overflow-y-auto pr-1">
            <details
              v-for="chapter in overview.chapters"
              :key="chapter.id"
              open
              class="group overflow-hidden bg-ground"
            >
              <summary class="flex cursor-pointer list-none items-center justify-between gap-2 bg-surface-2 px-4 py-3 text-left">
                <span class="text-sm font-bold text-ink">
                  Chương {{ chapter.order }}: {{ chapter.title }}
                </span>
                <span class="shrink-0 text-xs tabular-nums text-muted">
                  {{ chapter.lessons.length }} bài
                </span>
              </summary>

              <ul class="space-y-1 p-1.5">
                <li v-for="lesson in chapter.lessons" :key="lesson.id">
                  <button
                    type="button"
                    :disabled="lesson.status === 'LOCKED'"
                    class="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-xs transition-colors"
                    :class="[
                      currentLesson?.id === lesson.id
                        ? 'bg-tint font-semibold text-brand-soft'
                        : lesson.status === 'LOCKED'
                          ? 'cursor-not-allowed opacity-55 text-muted'
                          : 'text-ink hover:bg-surface',
                    ]"
                    @click="handleCurriculumClick(lesson)"
                  >
                    <div class="flex min-w-0 items-start gap-2.5">
                      <CheckCircle2
                        v-if="lesson.status === 'COMPLETED'"
                        class="mt-0.5 h-4 w-4 shrink-0 text-teal"
                      />
                      <PlayCircle
                        v-else-if="lesson.status === 'UNLOCKED'"
                        class="mt-0.5 h-4 w-4 shrink-0 text-brand"
                      />
                      <Lock
                        v-else
                        class="mt-0.5 h-4 w-4 shrink-0 text-muted"
                      />

                      <div class="min-w-0">
                        <p class="line-clamp-2 leading-5">
                          {{ lesson.order }}. {{ lesson.title }}
                        </p>
                        <div class="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                          <span class="tabular-nums">{{ formatCourseDuration(lesson.duration) }}</span>
                          <span
                            v-if="lesson.hasQuiz"
                            class="inline-flex items-center gap-1 text-teal"
                          >
                            <CircleHelp class="h-3 w-3" />
                            {{ lesson.quizCount }} câu hỏi
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              </ul>
            </details>
          </div>
        </aside>
      </div>

      <!-- Drawer Hỏi đáp bài học trượt từ bên phải -->
      <LessonDiscussionDrawer
        v-if="currentLesson"
        :open="discussionOpen"
        :course-id="courseId"
        :lesson-id="currentLesson.id"
        :lesson-title="`Bài ${currentLesson.order}: ${currentLesson.title}`"
        @close="discussionOpen = false"
        @update:total-comments="lessonCommentsCount = $event"
      />
    </main>
  </div>
</template>
