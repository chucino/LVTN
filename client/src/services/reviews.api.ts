import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  CourseReviewsListResponse,
  CourseReviewSummary,
  MyCourseReviewState,
  MyReviewDetail,
} from '@/types/review';

export const reviewsApi = {
  async listCourseReviews(
    courseId: string,
    rating?: number,
    signal?: AbortSignal,
  ): Promise<CourseReviewsListResponse> {
    const response = await http.get<ApiResponse<CourseReviewsListResponse>>(
      `/courses/${encodeURIComponent(courseId)}/reviews`,
      {
        params: rating ? { rating } : {},
        signal,
      },
    );
    return response.data.data;
  },

  async getMyCourseReviewState(
    courseId: string,
    signal?: AbortSignal,
  ): Promise<MyCourseReviewState> {
    const response = await http.get<ApiResponse<MyCourseReviewState>>(
      `/courses/${encodeURIComponent(courseId)}/reviews/me`,
      { signal },
    );
    return response.data.data;
  },

  async upsertMyCourseReview(
    courseId: string,
    payload: { rating: number; comment?: string },
  ): Promise<{
    message: string;
    myReview: MyReviewDetail;
    summary: CourseReviewSummary;
  }> {
    const response = await http.put<
      ApiResponse<{
        message: string;
        myReview: MyReviewDetail;
        summary: CourseReviewSummary;
      }>
    >(`/courses/${encodeURIComponent(courseId)}/reviews/me`, payload);
    return response.data.data;
  },

  async reportCourseReview(
    courseId: string,
    reviewId: string,
    reason: string,
  ): Promise<{ message: string; isReportedByMe: boolean }> {
    const response = await http.post<
      ApiResponse<{ message: string; isReportedByMe: boolean }>
    >(
      `/courses/${encodeURIComponent(courseId)}/reviews/${encodeURIComponent(reviewId)}/report`,
      { reason },
    );
    return response.data.data;
  },
};

