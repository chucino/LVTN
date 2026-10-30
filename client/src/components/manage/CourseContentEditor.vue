<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  CirclePlus,
  Clock3,
  HelpCircle,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-vue-next';
import { formatCourseDuration } from '@/lib/course-format';
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

const deleteDialogInfo = computed(() => {
  if (!deleting.value) return { title: '', description: '' };
  if (deleting.value.kind === 'chapter') {
    return {
      title: 'Xóa chương này?',
      description: `Chương "${deleting.value.title}" cùng toàn bộ bài giảng và câu trắc nghiệm bên trong sẽ bị xóa.`,
    };
  }
  if (deleting.value.kind === 'lesson') {
    return {
      title: 'Xóa bài giảng này?',
      description: `Bài "${deleting.value.title}" và tất cả câu hỏi trắc nghiệm của bài sẽ bị xóa.`,
    };
  }
  return {
    title: 'Xóa câu hỏi trắc nghiệm?',
    description: 'Câu hỏi này sẽ bị xóa khỏi bài giảng.',
  };
});

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

async function saveLesson(payload: ManageLessonPayload) {
  const target = lessonTarget.value;
  if (!target) return;
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
  <section class="space-y-5">
    <div class="manage-panel flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
      <div>
        <h2 class="font-bold text-white">Nội dung khóa học</h2>
        <p class="mt-1 text-sm text-slate-400">
          {{ course.totalChapters }} chương · {{ course.totalLessons }} bài · {{ formatCourseDuration(course.totalDuration) }}
        </p>
      </div>
      <button v-if="!readOnly" type="button" class="manage-button-primary inline-flex items-center gap-2" :disabled="busyKey !== null" @click="openChapterDialog()">
        <CirclePlus class="h-4 w-4" /> Thêm chương
      </button>
    </div>

    <div v-if="error" class="manage-alert-error" role="alert">{{ error }}</div>
    <div v-if="readOnly" class="manage-alert-warning">
      Chế độ xem trước: khóa học này hiện không cho phép chỉnh sửa nội dung.
    </div>

    <div v-if="course.chapters.length" class="space-y-3">
      <details v-for="(chapter, chapterIndex) in course.chapters" :key="chapter.id" class="manage-panel group overflow-hidden" :open="chapterIndex === 0">
        <summary class="flex cursor-pointer list-none flex-wrap items-center gap-3 p-4 sm:p-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300">
          <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/15 text-sm font-bold text-cyan-200">{{ chapter.order }}</span>
          <span class="min-w-0 flex-1">
            <span class="block truncate font-bold text-white">{{ chapter.title }}</span>
            <span class="mt-1 block text-xs text-slate-500">{{ chapter.lessons.length }} bài giảng</span>
          </span>
          <div v-if="!readOnly" class="flex items-center gap-1" @click.stop>
            <button type="button" class="manage-icon-button" :disabled="chapterIndex === 0 || busyKey !== null" :aria-label="`Đưa chương ${chapter.order} lên`" @click="moveChapter(chapterIndex, -1)"><ArrowUp class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button" :disabled="chapterIndex === course.chapters.length - 1 || busyKey !== null" :aria-label="`Đưa chương ${chapter.order} xuống`" @click="moveChapter(chapterIndex, 1)"><ArrowDown class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button" :disabled="busyKey !== null" :aria-label="`Đổi tên ${chapter.title}`" @click="openChapterDialog({ id: chapter.id, title: chapter.title })"><Pencil class="h-4 w-4" /></button>
            <button type="button" class="manage-icon-button text-rose-300" :disabled="busyKey !== null" :aria-label="`Xóa ${chapter.title}`" @click="deleting = { kind: 'chapter', id: chapter.id, title: chapter.title }"><Trash2 class="h-4 w-4" /></button>
          </div>
        </summary>

        <div class="space-y-3 border-t border-slate-800 bg-slate-950/30 p-3 sm:p-5">
          <div v-if="chapter.lessons.length === 0" class="rounded-xl border border-dashed border-slate-700 p-5 text-center text-sm text-slate-500">
            Chương này chưa có bài giảng.
          </div>
          <article v-for="(lesson, lessonIndex) in chapter.lessons" :key="lesson.id" class="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start">
              <div class="flex min-w-0 flex-1 items-start gap-3">
                <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-xs font-bold text-slate-300">{{ lesson.order }}</span>
                <div class="min-w-0">
                  <h3 class="break-words font-semibold text-slate-100">{{ lesson.title }}</h3>
                  <p class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span class="inline-flex items-center gap-1"><Clock3 class="h-3.5 w-3.5" /> {{ formatCourseDuration(lesson.duration) }}</span>
                    <span v-if="lesson.hasQuiz" class="inline-flex items-center gap-1 text-cyan-200"><CheckCircle2 class="h-3.5 w-3.5" /> Có trắc nghiệm</span>
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

            <div class="mt-4 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <h4 class="text-xs font-bold uppercase tracking-wide text-slate-400">Câu hỏi trắc nghiệm ({{ lesson.quizQuestions.length }})</h4>
                <button v-if="!readOnly" type="button" class="inline-flex items-center gap-1 text-xs font-semibold text-cyan-200 hover:text-white disabled:opacity-40" :disabled="busyKey !== null || lesson.quizQuestions.length >= 10" @click="openQuizDialog(chapter.id, lesson)">
                  <Plus class="h-3.5 w-3.5" /> Thêm câu hỏi
                </button>
              </div>
              <p v-if="lesson.quizQuestions.length === 0" class="mt-2 text-xs text-slate-600">Bài này chưa có câu hỏi.</p>
              <ol v-else class="mt-3 space-y-2">
                <li v-for="(question, questionIndex) in lesson.quizQuestions" :key="question.id" class="flex flex-wrap items-center gap-2 rounded-lg bg-slate-900/80 px-3 py-2">
                  <span class="text-xs font-bold text-cyan-300">{{ questionIndex + 1 }}.</span>
                  <span class="min-w-0 flex-1 break-words text-sm text-slate-300">{{ question.content }}</span>
                  <span class="text-xs text-slate-500">Đáp án {{ question.correctOption + 1 }}</span>
                  <template v-if="!readOnly">
                    <button type="button" class="manage-icon-button h-8 min-h-8 w-8 min-w-8" :disabled="busyKey !== null" :aria-label="`Sửa câu hỏi ${questionIndex + 1}`" @click="openQuizDialog(chapter.id, lesson, question)"><Pencil class="h-3.5 w-3.5" /></button>
                    <button type="button" class="manage-icon-button h-8 min-h-8 w-8 min-w-8 text-rose-300" :disabled="busyKey !== null" :aria-label="`Xóa câu hỏi ${questionIndex + 1}`" @click="deleting = { kind: 'question', chapterId: chapter.id, lessonId: lesson.id, id: question.id }"><Trash2 class="h-3.5 w-3.5" /></button>
                  </template>
                </li>
              </ol>
            </div>
          </article>

          <button v-if="!readOnly" type="button" class="manage-button-secondary inline-flex w-full items-center justify-center gap-2" :disabled="busyKey !== null || chapter.lessons.length >= 50" @click="openLessonDialog(chapter.id)">
            <CirclePlus class="h-4 w-4" /> Thêm bài giảng
          </button>
        </div>
      </details>
    </div>
    <div v-else class="manage-panel px-5 py-12 text-center">
      <BookOpen class="mx-auto h-8 w-8 text-slate-600" />
      <p class="mt-3 text-sm text-slate-400">Chưa có chương. Thêm chương đầu tiên để bắt đầu xây dựng nội dung.</p>
      <button v-if="!readOnly" type="button" class="manage-button-primary mt-4" :disabled="busyKey !== null" @click="openChapterDialog()">Thêm chương đầu tiên</button>
    </div>

    <ChapterEditorDialog :open="chapterDialogOpen" :title="editingChapter ? 'Đổi tên chương' : 'Thêm chương'" :initial-value="editingChapter?.title" :busy="busyKey !== null" @cancel="chapterDialogOpen = false" @save="saveChapter" />
    <LessonEditorDialog :open="lessonDialogOpen" :lesson="lessonTarget?.lesson ?? null" :is-pro="course.type === 'PRO'" :read-only="readOnly" :busy="busyKey !== null" @cancel="lessonDialogOpen = false" @save="saveLesson" />
    <QuizQuestionDialog :open="quizDialogOpen" :question="quizTarget?.question ?? null" :question-count="quizTarget?.lesson.quizQuestions.length ?? 0" :read-only="readOnly" :busy="busyKey !== null" @cancel="quizDialogOpen = false" @save="saveQuestion" />
    <ManageActionDialog :open="deleting !== null" :title="deleteDialogInfo.title" :description="deleteDialogInfo.description" confirm-label="Xóa" :busy="busyKey !== null" @cancel="deleting = null" @confirm="confirmDelete" />
  </section>
</template>
