<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CirclePlus,
  Clock3,
  Film,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Video,
  X,
} from 'lucide-vue-next';
import { formatCourseDuration } from '@/lib/course-format';
import { getManageErrorMessage } from '@/lib/manage-course-format';
import { parseYouTubeEmbedInput } from '@/lib/video-embed';
import { uploadsService } from '@/services/uploads.api';
import type {
  ManageCourseDetail,
  ManageChapterPayload,
  ManageLesson,
  ManageLessonPayload,
  ManageQuizQuestion,
  ManageQuizQuestionPayload,
} from '@/types/manage-course';
import ManageActionDialog from '@/components/manage/ManageActionDialog.vue';
import ChapterEditorDialog from '@/components/manage/ChapterEditorDialog.vue';
import LessonEditorDialog from '@/components/manage/LessonEditorDialog.vue';
import QuizQuestionDialog from '@/components/manage/QuizQuestionDialog.vue';

interface ContentActions {
  addChapter(payload: ManageChapterPayload): Promise<ManageCourseDetail>;
  updateChapter(chapterId: string, payload: ManageChapterPayload): Promise<ManageCourseDetail>;
  deleteChapter(chapterId: string): Promise<ManageCourseDetail>;
  reorderChapters(chapterIds: string[]): Promise<ManageCourseDetail>;
  addLesson(chapterId: string, payload: ManageLessonPayload): Promise<ManageCourseDetail>;
  updateLesson(chapterId: string, lessonId: string, payload: Partial<ManageLessonPayload>): Promise<ManageCourseDetail>;
  deleteLesson(chapterId: string, lessonId: string): Promise<ManageCourseDetail>;
  reorderLessons(chapterId: string, lessonIds: string[]): Promise<ManageCourseDetail>;
  addQuestion(chapterId: string, lessonId: string, payload: ManageQuizQuestionPayload): Promise<ManageCourseDetail>;
  updateQuestion(chapterId: string, lessonId: string, questionId: string, payload: Partial<ManageQuizQuestionPayload>): Promise<ManageCourseDetail>;
  deleteQuestion(chapterId: string, lessonId: string, questionId: string): Promise<ManageCourseDetail>;
}

interface VideoUploadTask {
  id: string;
  chapterId: string;
  lessonId: string | null;
  lessonTitle: string;
  fileName: string;
  fileSize: number;
  progress: number;
  status: 'uploading' | 'saving' | 'done' | 'error' | 'cancelled';
  errorMessage: string | null;
  controller: AbortController;
}

const props = defineProps<{
  course: ManageCourseDetail;
  readOnly: boolean;
  busyKey: string | null;
  error: string | null;
  actions: ContentActions;
}>();

const chapterDialogOpen = ref(false);
const editingChapter = ref<{ id: string; title: string } | null>(null);
const lessonDialogOpen = ref(false);
const lessonTarget = ref<{ chapterId: string; lesson: ManageLesson | null } | null>(null);
const quizDialogOpen = ref(false);
const quizTarget = ref<{
  chapterId: string;
  lesson: ManageLesson;
  question: ManageQuizQuestion | null;
} | null>(null);
const deleting = ref<
  | { kind: 'chapter'; id: string; title: string }
  | { kind: 'lesson'; chapterId: string; id: string; title: string }
  | { kind: 'question'; chapterId: string; lessonId: string; id: string }
  | null
>(null);

const uploadTasks = reactive<VideoUploadTask[]>([]);

const deleteDialogInfo = computed(() => {
  if (!deleting.value) return { title: '', description: '' };
  if (deleting.value.kind === 'chapter') {
    return {
      title: 'Xóa chương này?',
      description: `Chương "${deleting.value.title}" cùng toàn bộ bài giảng, video và câu trắc nghiệm bên trong sẽ bị xóa.`,
    };
  }
  if (deleting.value.kind === 'lesson') {
    return {
      title: 'Xóa bài giảng này?',
      description: `Bài "${deleting.value.title}", file video trên server (nếu có) và tất cả câu hỏi trắc nghiệm của bài sẽ bị xóa.`,
    };
  }
  return {
    title: 'Xóa câu hỏi trắc nghiệm?',
    description: 'Câu hỏi này sẽ bị xóa khỏi bài giảng.',
  };
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function isYouTubeLesson(lesson: ManageLesson): boolean {
  return parseYouTubeEmbedInput(lesson.videoUrl) !== null;
}

function removeUploadTask(taskId: string) {
  const index = uploadTasks.findIndex((item) => item.id === taskId);
  if (index >= 0) {
    uploadTasks.splice(index, 1);
  }
}

function cancelUploadTask(task: VideoUploadTask) {
  if (task.status === 'uploading') {
    task.controller.abort();
    task.status = 'cancelled';
    task.errorMessage = 'Đã hủy tải video lên.';
  } else {
    removeUploadTask(task.id);
  }
}

async function startBackgroundVideoUpload(
  chapterId: string,
  lessonId: string | null,
  payload: ManageLessonPayload,
  videoFile: File,
) {
  const task: VideoUploadTask = reactive({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    chapterId,
    lessonId,
    lessonTitle: payload.title,
    fileName: videoFile.name,
    fileSize: videoFile.size,
    progress: 0,
    status: 'uploading',
    errorMessage: null,
    controller: new AbortController(),
  });
  uploadTasks.unshift(task);

  try {
    const uploaded = await uploadsService.uploadLessonVideo(
      videoFile,
      (percent) => {
        task.progress = percent;
      },
      task.controller.signal,
    );

    task.progress = 100;
    task.status = 'saving';

    const finalPayload: ManageLessonPayload = {
      ...payload,
      videoUrl: uploaded.url,
    };

    if (lessonId) {
      await props.actions.updateLesson(chapterId, lessonId, finalPayload);
    } else {
      await props.actions.addLesson(chapterId, finalPayload);
    }

    task.status = 'done';
    setTimeout(() => {
      removeUploadTask(task.id);
    }, 5000);
  } catch (cause) {
    if ((task.status as string) === 'cancelled' || task.controller.signal.aborted) {
      task.status = 'cancelled';
      task.errorMessage = 'Đã hủy tải video lên.';
      return;
    }
    task.status = 'error';
    task.errorMessage = getManageErrorMessage(
      cause,
      'Không thể tải video hoặc lưu bài giảng.',
    );
  }
}

function openChapterDialog(chapter?: { id: string; title: string }) {
  editingChapter.value = chapter ?? null;
  chapterDialogOpen.value = true;
}

async function saveChapter(title: string) {
  try {
    if (editingChapter.value) {
      await props.actions.updateChapter(editingChapter.value.id, { title });
    } else {
      await props.actions.addChapter({ title });
    }
    chapterDialogOpen.value = false;
  } catch {
    // The parent displays the API error.
  }
}

async function moveChapter(index: number, offset: number) {
  const chapters = [...props.course.chapters];
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= chapters.length) return;
  [chapters[index], chapters[targetIndex]] = [chapters[targetIndex], chapters[index]];
  try {
    await props.actions.reorderChapters(chapters.map((chapter) => chapter.id));
  } catch {
    // The parent displays the API error.
  }
}

function openLessonDialog(chapterId: string, lesson: ManageLesson | null = null) {
  lessonTarget.value = { chapterId, lesson };
  lessonDialogOpen.value = true;
}

async function saveLesson(
  payload: ManageLessonPayload,
  videoFile: File | null = null,
) {
  const target = lessonTarget.value;
  if (!target) return;

  if (videoFile) {
    lessonDialogOpen.value = false;
    void startBackgroundVideoUpload(
      target.chapterId,
      target.lesson?.id ?? null,
      payload,
      videoFile,
    );
    return;
  }

  try {
    if (target.lesson) {
      await props.actions.updateLesson(target.chapterId, target.lesson.id, payload);
    } else {
      await props.actions.addLesson(target.chapterId, payload);
    }
    lessonDialogOpen.value = false;
  } catch {
    // The parent displays the API error.
  }
}

async function moveLesson(chapterId: string, index: number, offset: number) {
  const chapter = props.course.chapters.find((item) => item.id === chapterId);
  if (!chapter) return;
  const lessons = [...chapter.lessons];
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= lessons.length) return;
  [lessons[index], lessons[targetIndex]] = [lessons[targetIndex], lessons[index]];
  try {
    await props.actions.reorderLessons(chapterId, lessons.map((lesson) => lesson.id));
  } catch {
    // The parent displays the API error.
  }
}

function openQuizDialog(chapterId: string, lesson: ManageLesson, question: ManageQuizQuestion | null = null) {
  quizTarget.value = { chapterId, lesson, question };
  quizDialogOpen.value = true;
}

async function saveQuestion(payload: ManageQuizQuestionPayload) {
  const target = quizTarget.value;
  if (!target) return;
  try {
    if (target.question) {
      await props.actions.updateQuestion(
        target.chapterId,
        target.lesson.id,
        target.question.id,
        payload,
      );
    } else {
      await props.actions.addQuestion(target.chapterId, target.lesson.id, payload);
    }
    quizDialogOpen.value = false;
  } catch {
    // The parent displays the API error.
  }
}

async function confirmDelete() {
  const target = deleting.value;
  if (!target) return;
  try {
    if (target.kind === 'chapter') await props.actions.deleteChapter(target.id);
    else if (target.kind === 'lesson') await props.actions.deleteLesson(target.chapterId, target.id);
    else await props.actions.deleteQuestion(target.chapterId, target.lessonId, target.id);
    deleting.value = null;
  } catch {
    // The parent displays the API error.
  }
}
</script>

<template>
  <section data-ui class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-4 bg-surface p-4 sm:p-5">
      <div>
        <h2 class="text-sm font-semibold text-ink">Nội dung khóa học</h2>
        <p class="mt-1 text-xs tabular-nums text-muted">
          {{ course.totalChapters }} chương · {{ course.totalLessons }} bài · {{ formatCourseDuration(course.totalDuration) }}
        </p>
      </div>
      <button v-if="!readOnly" type="button" class="manage-button-primary" :disabled="busyKey !== null" @click="openChapterDialog()">
        <CirclePlus class="h-4 w-4" /> Thêm chương
      </button>
    </div>

    <!-- Hàng đợi tiến trình tải video ngầm (Không khóa giao diện) -->
    <div v-if="uploadTasks.length > 0" class="space-y-2.5" aria-live="polite">
      <div
        v-for="task in uploadTasks"
        :key="task.id"
        class="bg-surface-2 p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2.5">
            <Loader2
              v-if="task.status === 'uploading' || task.status === 'saving'"
              class="h-4 w-4 shrink-0 animate-spin text-brand-soft"
            />
            <CheckCircle2
              v-else-if="task.status === 'done'"
              class="h-4 w-4 shrink-0 text-emerald-400"
            />
            <AlertCircle
              v-else
              class="h-4 w-4 shrink-0 text-rose-400"
            />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-ink">
                {{ task.lessonTitle }}
              </p>
              <p class="truncate text-xs tabular-nums text-muted">
                {{ task.fileName }} ({{ formatFileSize(task.fileSize) }})
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <span
              v-if="task.status === 'uploading'"
              class="text-xs font-semibold tabular-nums text-ink"
            >
              Đang tải video: {{ task.progress }}%
            </span>
            <span
              v-else-if="task.status === 'saving'"
              class="text-xs font-semibold text-ink"
            >
              Đang lưu bài giảng…
            </span>
            <span
              v-else-if="task.status === 'done'"
              class="text-xs font-semibold text-emerald-300"
            >
              Đã tải lên và lưu bài giảng
            </span>
            <span
              v-else
              class="text-xs font-semibold text-rose-300"
            >
              {{ task.errorMessage || 'Tải lên thất bại' }}
            </span>

            <button
              type="button"
              class="inline-flex items-center gap-1 bg-ground px-2.5 py-1 text-xs text-muted hover:text-ink"
              @click="cancelUploadTask(task)"
            >
              <X class="h-3.5 w-3.5" />
              {{ task.status === 'uploading' ? 'Hủy tải' : 'Đóng' }}
            </button>
          </div>
        </div>

        <div
          v-if="task.status === 'uploading' || task.status === 'saving'"
          class="mt-3 h-1.5 w-full overflow-hidden bg-ground"
        >
          <div
            class="h-full bg-brand transition-[width] duration-200"
            :style="{ width: `${task.progress}%` }"
          />
        </div>
      </div>
    </div>

    <div v-if="error" class="manage-alert-error" role="alert">{{ error }}</div>
    <div v-if="readOnly" class="manage-alert-warning">
      Chế độ xem trước: khóa học này hiện không cho phép chỉnh sửa nội dung.
    </div>

    <div v-if="course.chapters.length" class="space-y-3">
      <details v-for="(chapter, chapterIndex) in course.chapters" :key="chapter.id" class="group bg-surface" :open="chapterIndex === 0">
        <summary class="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 sm:p-5">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center bg-surface-2 text-xs font-semibold tabular-nums text-ink">{{ chapter.order }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-semibold text-ink">{{ chapter.title }}</span>
            <span class="mt-0.5 block text-xs tabular-nums text-muted">{{ chapter.lessons.length }} bài giảng</span>
          </span>
          <div v-if="!readOnly" class="flex items-center gap-1" @click.stop>
            <button type="button" class="manage-icon-button" :disabled="chapterIndex === 0 || busyKey !== null" :aria-label="`Đưa chương ${chapter.order} lên`" @click="moveChapter(chapterIndex, -1)"><ArrowUp class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button" :disabled="chapterIndex === course.chapters.length - 1 || busyKey !== null" :aria-label="`Đưa chương ${chapter.order} xuống`" @click="moveChapter(chapterIndex, 1)"><ArrowDown class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button" :disabled="busyKey !== null" :aria-label="`Đổi tên ${chapter.title}`" @click="openChapterDialog({ id: chapter.id, title: chapter.title })"><Pencil class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button text-rose-300" :disabled="busyKey !== null" :aria-label="`Xóa ${chapter.title}`" @click="deleting = { kind: 'chapter', id: chapter.id, title: chapter.title }"><Trash2 class="h-4 w-4" /></button>
          </div>
        </summary>

        <div class="space-y-3 bg-ground p-3 sm:p-5">
          <div v-if="chapter.lessons.length === 0" class="bg-surface p-5 text-center text-sm text-muted">
            Chương này chưa có bài giảng.
          </div>
          <article v-for="(lesson, lessonIndex) in chapter.lessons" :key="lesson.id" class="bg-surface p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div class="flex min-w-0 flex-1 items-start gap-3">
                <span class="flex h-7 w-7 shrink-0 items-center justify-center bg-surface-2 text-xs font-semibold tabular-nums text-muted">{{ lesson.order }}</span>
                <div class="min-w-0">
                  <h3 class="break-words font-medium text-ink">{{ lesson.title }}</h3>
                  <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted">
                    <span class="inline-flex items-center gap-1"><Clock3 class="h-3.5 w-3.5" /> {{ formatCourseDuration(lesson.duration) }}</span>
                    <span v-if="isYouTubeLesson(lesson)" class="inline-flex items-center gap-1 text-ink"><Video class="h-3.5 w-3.5" /> YouTube Embed</span>
                    <span v-else class="inline-flex items-center gap-1 text-emerald-300"><Film class="h-3.5 w-3.5" /> Video Server</span>
                    <span v-if="lesson.hasQuiz" class="inline-flex items-center gap-1 text-ink"><CheckCircle2 class="h-3.5 w-3.5" /> Có trắc nghiệm</span>
                    <span v-else class="inline-flex items-center gap-1"><HelpCircle class="h-3.5 w-3.5" /> Chưa có trắc nghiệm</span>
                  </p>
                </div>
              </div>
              <div v-if="!readOnly" class="flex items-center gap-1">
                <button type="button" class="manage-icon-button" :disabled="lessonIndex === 0 || busyKey !== null" :aria-label="`Đưa bài ${lesson.order} lên`" @click="moveLesson(chapter.id, lessonIndex, -1)"><ArrowUp class="h-4 w-4" /></button>
                <button type="button" class="manage-icon-button" :disabled="lessonIndex === chapter.lessons.length - 1 || busyKey !== null" :aria-label="`Đưa bài ${lesson.order} xuống`" @click="moveLesson(chapter.id, lessonIndex, 1)"><ArrowDown class="h-4 w-4" /></button>
                <button type="button" class="manage-icon-button" :disabled="busyKey !== null" :aria-label="`Sửa ${lesson.title}`" @click="openLessonDialog(chapter.id, lesson)"><Pencil class="h-4 w-4" /></button>
                <button type="button" class="manage-icon-button text-rose-300" :disabled="busyKey !== null" :aria-label="`Xóa ${lesson.title}`" @click="deleting = { kind: 'lesson', chapterId: chapter.id, id: lesson.id, title: lesson.title }"><Trash2 class="h-4 w-4" /></button>
              </div>
            </div>

            <div class="mt-4 bg-ground p-3.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="text-xs font-medium text-muted">Câu hỏi trắc nghiệm ({{ lesson.quizQuestions.length }})</h4>
                <button v-if="!readOnly" type="button" class="inline-flex items-center gap-1 text-xs font-medium text-ink hover:text-brand-soft disabled:opacity-40" :disabled="busyKey !== null || lesson.quizQuestions.length >= 10" @click="openQuizDialog(chapter.id, lesson)">
                  <Plus class="h-3.5 w-3.5" /> Thêm câu hỏi
                </button>
              </div>
              <p v-if="lesson.quizQuestions.length === 0" class="mt-2 text-xs text-muted">Bài này chưa có câu hỏi.</p>
              <ol v-else class="mt-3 space-y-1.5">
                <li v-for="(question, questionIndex) in lesson.quizQuestions" :key="question.id" class="flex flex-wrap items-center gap-2 bg-surface px-3 py-2">
                  <span class="text-xs font-semibold tabular-nums text-muted">{{ questionIndex + 1 }}.</span>
                  <span class="min-w-0 flex-1 break-words text-sm text-ink">{{ question.content }}</span>
                  <span class="text-xs tabular-nums text-muted">Đáp án {{ question.correctOption + 1 }}</span>
                  <template v-if="!readOnly">
                    <button type="button" class="manage-icon-button h-8 min-h-8 w-8 min-w-8" :disabled="busyKey !== null" :aria-label="`Sửa câu hỏi ${questionIndex + 1}`" @click="openQuizDialog(chapter.id, lesson, question)"><Pencil class="h-3.5 w-3.5" /></button>
                    <button type="button" class="manage-icon-button h-8 min-h-8 w-8 min-w-8 text-rose-300" :disabled="busyKey !== null" :aria-label="`Xóa câu hỏi ${questionIndex + 1}`" @click="deleting = { kind: 'question', chapterId: chapter.id, lessonId: lesson.id, id: question.id }"><Trash2 class="h-3.5 w-3.5" /></button>
                  </template>
                </li>
              </ol>
            </div>
          </article>

          <button v-if="!readOnly" type="button" class="manage-button-secondary w-full" :disabled="busyKey !== null || chapter.lessons.length >= 50" @click="openLessonDialog(chapter.id)">
            <CirclePlus class="h-4 w-4" /> Thêm bài giảng
          </button>
        </div>
      </details>
    </div>
    <div v-else class="bg-surface px-5 py-12 text-center">
      <BookOpen class="mx-auto h-7 w-7 text-muted" />
      <p class="mt-3 text-sm text-muted">Chưa có chương. Thêm chương đầu tiên để bắt đầu xây dựng nội dung.</p>
      <button v-if="!readOnly" type="button" class="manage-button-primary mt-4" :disabled="busyKey !== null" @click="openChapterDialog()">Thêm chương đầu tiên</button>
    </div>

    <ChapterEditorDialog :open="chapterDialogOpen" :title="editingChapter ? 'Đổi tên chương' : 'Thêm chương'" :initial-value="editingChapter?.title" :busy="busyKey !== null" @cancel="chapterDialogOpen = false" @save="saveChapter" />
    <LessonEditorDialog :open="lessonDialogOpen" :lesson="lessonTarget?.lesson ?? null" :is-pro="course.type === 'PRO'" :read-only="readOnly" :busy="busyKey !== null" @cancel="lessonDialogOpen = false" @save="saveLesson" />
    <QuizQuestionDialog :open="quizDialogOpen" :question="quizTarget?.question ?? null" :question-count="quizTarget?.lesson.quizQuestions.length ?? 0" :read-only="readOnly" :busy="busyKey !== null" @cancel="quizDialogOpen = false" @save="saveQuestion" />
    <ManageActionDialog :open="deleting !== null" :title="deleteDialogInfo.title" :description="deleteDialogInfo.description" confirm-label="Xóa" :busy="busyKey !== null" @cancel="deleting = null" @confirm="confirmDelete" />
  </section>
</template>
