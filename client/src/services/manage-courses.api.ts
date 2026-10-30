import { http } from '@/services/http';
import type { ApiResponse } from '@/types/auth';
import type {
  ManageChapterPayload,
  ManageCourseDetail,
  ManageCourseList,
  ManageCoursePayload,
  ManageCourseQuery,
  ManageInstructorOption,
  ManageLessonPayload,
  ManageQuizQuestionPayload,
} from '@/types/manage-course';

function coursePath(courseId: string): string {
  return `/manage/courses/${encodeURIComponent(courseId)}`;
}

async function getData<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const response = await request;
  return response.data.data;
}

export const manageCourseService = {
  list(params: ManageCourseQuery): Promise<ManageCourseList> {
    return getData(http.get<ApiResponse<ManageCourseList>>('/manage/courses', { params }));
  },

  get(courseId: string): Promise<ManageCourseDetail> {
    return getData(
      http.get<ApiResponse<ManageCourseDetail>>(coursePath(courseId)),
    );
  },

  create(payload: ManageCoursePayload): Promise<ManageCourseDetail> {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>('/manage/courses', payload),
    );
  },

  update(
    courseId: string,
    payload: Partial<ManageCoursePayload>,
  ): Promise<ManageCourseDetail> {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(coursePath(courseId), payload),
    );
  },

  delete(courseId: string): Promise<{ message: string }> {
    return getData(
      http.delete<ApiResponse<{ message: string }>>(coursePath(courseId)),
    );
  },

  transition(
    courseId: string,
    action: 'submit' | 'withdraw' | 'approve' | 'hide',
  ): Promise<ManageCourseDetail> {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/${action}`,
      ),
    );
  },

  reject(courseId: string, reason: string): Promise<ManageCourseDetail> {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/reject`,
        { reason },
      ),
    );
  },

  instructors(): Promise<ManageInstructorOption[]> {
    return getData(
      http.get<ApiResponse<ManageInstructorOption[]>>('/manage/instructors'),
    );
  },

  addChapter(courseId: string, payload: ManageChapterPayload) {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters`,
        payload,
      ),
    );
  },

  updateChapter(courseId: string, chapterId: string, payload: ManageChapterPayload) {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}`,
        payload,
      ),
    );
  },

  deleteChapter(courseId: string, chapterId: string) {
    return getData(
      http.delete<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}`,
      ),
    );
  },

  reorderChapters(courseId: string, chapterIds: string[]) {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/reorder`,
        { chapterIds },
      ),
    );
  },

  addLesson(courseId: string, chapterId: string, payload: ManageLessonPayload) {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons`,
        payload,
      ),
    );
  },

  updateLesson(
    courseId: string,
    chapterId: string,
    lessonId: string,
    payload: Partial<ManageLessonPayload>,
  ) {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/${encodeURIComponent(lessonId)}`,
        payload,
      ),
    );
  },

  deleteLesson(courseId: string, chapterId: string, lessonId: string) {
    return getData(
      http.delete<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/${encodeURIComponent(lessonId)}`,
      ),
    );
  },

  reorderLessons(courseId: string, chapterId: string, lessonIds: string[]) {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/reorder`,
        { lessonIds },
      ),
    );
  },

  addQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    payload: ManageQuizQuestionPayload,
  ) {
    return getData(
      http.post<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/${encodeURIComponent(lessonId)}/quiz-questions`,
        payload,
      ),
    );
  },

  updateQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    questionId: string,
    payload: Partial<ManageQuizQuestionPayload>,
  ) {
    return getData(
      http.patch<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/${encodeURIComponent(lessonId)}/quiz-questions/${encodeURIComponent(questionId)}`,
        payload,
      ),
    );
  },

  deleteQuestion(
    courseId: string,
    chapterId: string,
    lessonId: string,
    questionId: string,
  ) {
    return getData(
      http.delete<ApiResponse<ManageCourseDetail>>(
        `${coursePath(courseId)}/chapters/${encodeURIComponent(chapterId)}/lessons/${encodeURIComponent(lessonId)}/quiz-questions/${encodeURIComponent(questionId)}`,
      ),
    );
  },
};
