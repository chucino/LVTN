import { computed, ref } from 'vue';
import { manageCourseService } from '@/services/manage-courses.api';
import { getManageErrorMessage } from '@/lib/manage-course-format';
import type {
  ManageCourseDetail,
  ManageCoursePayload,
  ManageChapterPayload,
  ManageLessonPayload,
  ManageQuizQuestionPayload,
} from '@/types/manage-course';

export function useManageCourseEditor() {
  const course = ref<ManageCourseDetail | null>(null);
  const loading = ref(false);
  const busyKey = ref<string | null>(null);
  const error = ref<string | null>(null);
  const isSaving = computed(() => busyKey.value !== null);

  async function load(courseId: string) {
    loading.value = true;
    error.value = null;
    try {
      course.value = await manageCourseService.get(courseId);
      return course.value;
    } catch (cause) {
      error.value = getManageErrorMessage(cause, 'Không thể tải thông tin khóa học.');
      throw cause;
    } finally {
      loading.value = false;
    }
  }

  async function perform<T>(
    key: string,
    request: () => Promise<T>,
    onSuccess?: (value: T) => void,
  ): Promise<T> {
    if (busyKey.value) throw new Error('Đang xử lý một thao tác khác.');
    busyKey.value = key;
    error.value = null;
    try {
      const value = await request();
      onSuccess?.(value);
      return value;
    } catch (cause) {
      error.value = getManageErrorMessage(cause);
      throw cause;
    } finally {
      busyKey.value = null;
    }
  }

  function updateDetail(request: () => Promise<ManageCourseDetail>, key = 'save') {
    return perform(key, request, (updated) => {
      course.value = updated;
    });
  }

  async function create(payload: ManageCoursePayload) {
    return perform('create', () => manageCourseService.create(payload));
  }

  async function update(payload: Partial<ManageCoursePayload>) {
    const current = course.value;
    if (!current) throw new Error('Chưa tải thông tin khóa học.');
    return updateDetail(() => manageCourseService.update(current.id, payload));
  }

  async function transition(action: 'submit' | 'withdraw' | 'approve' | 'hide') {
    const current = course.value;
    if (!current) throw new Error('Chưa tải thông tin khóa học.');
    return updateDetail(
      () => manageCourseService.transition(current.id, action),
      action,
    );
  }

  async function reject(reason: string) {
    const current = course.value;
    if (!current) throw new Error('Chưa tải thông tin khóa học.');
    return updateDetail(() => manageCourseService.reject(current.id, reason), 'reject');
  }

  async function deleteCourse() {
    const current = course.value;
    if (!current) throw new Error('Chưa tải thông tin khóa học.');
    return perform('delete', () => manageCourseService.delete(current.id));
  }

  const contentActions = {
    addChapter: (payload: ManageChapterPayload) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.addChapter(current.id, payload),
        'chapter',
      );
    },
    updateChapter: (chapterId: string, payload: ManageChapterPayload) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.updateChapter(current.id, chapterId, payload),
        `chapter:${chapterId}`,
      );
    },
    deleteChapter: (chapterId: string) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.deleteChapter(current.id, chapterId),
        `chapter:${chapterId}`,
      );
    },
    reorderChapters: (chapterIds: string[]) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.reorderChapters(current.id, chapterIds),
        'chapter-reorder',
      );
    },
    addLesson: (chapterId: string, payload: ManageLessonPayload) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.addLesson(current.id, chapterId, payload),
        `lesson:${chapterId}`,
      );
    },
    updateLesson: (chapterId: string, lessonId: string, payload: Partial<ManageLessonPayload>) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.updateLesson(current.id, chapterId, lessonId, payload),
        `lesson:${lessonId}`,
      );
    },
    deleteLesson: (chapterId: string, lessonId: string) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.deleteLesson(current.id, chapterId, lessonId),
        `lesson:${lessonId}`,
      );
    },
    reorderLessons: (chapterId: string, lessonIds: string[]) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.reorderLessons(current.id, chapterId, lessonIds),
        `lesson-reorder:${chapterId}`,
      );
    },
    addQuestion: (
      chapterId: string,
      lessonId: string,
      payload: ManageQuizQuestionPayload,
    ) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.addQuestion(current.id, chapterId, lessonId, payload),
        `question:${lessonId}`,
      );
    },
    updateQuestion: (
      chapterId: string,
      lessonId: string,
      questionId: string,
      payload: Partial<ManageQuizQuestionPayload>,
    ) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.updateQuestion(current.id, chapterId, lessonId, questionId, payload),
        `question:${questionId}`,
      );
    },
    deleteQuestion: (chapterId: string, lessonId: string, questionId: string) => {
      const current = course.value;
      if (!current) throw new Error('Chưa tải thông tin khóa học.');
      return updateDetail(
        () => manageCourseService.deleteQuestion(current.id, chapterId, lessonId, questionId),
        `question:${questionId}`,
      );
    },
  };

  return {
    course,
    loading,
    busyKey,
    isSaving,
    error,
    load,
    create,
    update,
    transition,
    reject,
    deleteCourse,
    contentActions,
  };
}
