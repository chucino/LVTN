import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  CourseLearningOverview,
  EnrollmentStatus,
  EnrollmentStatusResponse,
  LessonLearningDetail,
  LessonProgressUpdateResponse,
  ManageCourseStudentsQuery,
  ManageCourseStudentsResponse,
  MyEnrolledCourseItem,
  SubmitQuizResponse,
} from '@/types/learning';

export const enrollmentsApi = {
  async enrollCourse(courseId: string): Promise<CourseLearningOverview> {
    const response = await http.post<ApiResponse<CourseLearningOverview>>(
      `/courses/${encodeURIComponent(courseId)}/enroll`,
    );
    return response.data.data;
  },

  async getEnrollmentStatus(
    courseId: string,
    signal?: AbortSignal,
  ): Promise<EnrollmentStatusResponse> {
    const response = await http.get<ApiResponse<EnrollmentStatusResponse>>(
      `/courses/${encodeURIComponent(courseId)}/enrollment-status`,
      { signal },
    );
    return response.data.data;
  },

  async getMyCourses(
    status?: EnrollmentStatus,
    signal?: AbortSignal,
  ): Promise<MyEnrolledCourseItem[]> {
    const response = await http.get<ApiResponse<MyEnrolledCourseItem[]>>(
      '/enrollments/my-courses',
      {
        params: status ? { status } : {},
        signal,
      },
    );
    return response.data.data;
  },

  async getCourseLearning(
    courseId: string,
    signal?: AbortSignal,
  ): Promise<CourseLearningOverview> {
    const response = await http.get<ApiResponse<CourseLearningOverview>>(
      `/enrollments/courses/${encodeURIComponent(courseId)}/learning`,
      { signal },
    );
    return response.data.data;
  },

  async getLessonForLearning(
    courseId: string,
    lessonId: string,
    signal?: AbortSignal,
  ): Promise<LessonLearningDetail> {
    const response = await http.get<ApiResponse<LessonLearningDetail>>(
      `/enrollments/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}`,
      { signal },
    );
    return response.data.data;
  },

  async updateLessonProgress(
    courseId: string,
    lessonId: string,
    payload: { lastPositionSec: number; watchedFully?: boolean },
  ): Promise<LessonProgressUpdateResponse> {
    const response = await http.patch<
      ApiResponse<LessonProgressUpdateResponse>
    >(
      `/enrollments/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/progress`,
      payload,
    );
    return response.data.data;
  },

  async submitLessonQuiz(
    courseId: string,
    lessonId: string,
    answers: Array<{ questionId: string; selectedOption: number }>,
  ): Promise<SubmitQuizResponse> {
    const response = await http.post<ApiResponse<SubmitQuizResponse>>(
      `/enrollments/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/quiz-submit`,
      { answers },
    );
    return response.data.data;
  },

  async getCourseStudents(
    courseId: string,
    params?: ManageCourseStudentsQuery,
    signal?: AbortSignal,
  ): Promise<ManageCourseStudentsResponse> {
    const response = await http.get<ApiResponse<ManageCourseStudentsResponse>>(
      `/manage/courses/${encodeURIComponent(courseId)}/students`,
      {
        params,
        signal,
      },
    );
    return response.data.data;
  },
};

