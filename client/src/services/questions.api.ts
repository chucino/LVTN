import { http } from './http';
import type { ApiResponse } from '@/types/auth';
import type {
  CommentReactionType,
  LessonCommentItem,
  LessonCommentsResponse,
  ManageReportsResponse,
  NotificationItem,
  ReportActionType,
  ReportStatus,
} from '@/types/learning';

export const questionsApi = {
  async listLessonComments(
    courseId: string,
    lessonId: string,
    signal?: AbortSignal,
  ): Promise<LessonCommentsResponse> {
    const response = await http.get<ApiResponse<LessonCommentsResponse>>(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/comments`,
      { signal },
    );
    return response.data.data;
  },

  async createLessonComment(
    courseId: string,
    lessonId: string,
    payload: {
      content: string;
      parentId?: string;
      replyToUserId?: string;
    },
  ): Promise<LessonCommentItem> {
    const response = await http.post<ApiResponse<LessonCommentItem>>(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/comments`,
      payload,
    );
    return response.data.data;
  },

  async toggleCommentReaction(
    courseId: string,
    lessonId: string,
    commentId: string,
    type: CommentReactionType = 'LIKE',
  ): Promise<LessonCommentItem> {
    const response = await http.post<ApiResponse<LessonCommentItem>>(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/comments/${encodeURIComponent(commentId)}/reactions`,
      { type },
    );
    return response.data.data;
  },

  async reportComment(
    courseId: string,
    lessonId: string,
    commentId: string,
    reason: string,
  ): Promise<{
    message: string;
    isReportedByMe: boolean;
    reportsCount: number;
  }> {
    const response = await http.post<
      ApiResponse<{
        message: string;
        isReportedByMe: boolean;
        reportsCount: number;
      }>
    >(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/comments/${encodeURIComponent(commentId)}/report`,
      { reason },
    );
    return response.data.data;
  },

  async deleteComment(
    courseId: string,
    lessonId: string,
    commentId: string,
  ): Promise<{ deletedId: string; deletedCount: number }> {
    const response = await http.delete<
      ApiResponse<{ deletedId: string; deletedCount: number }>
    >(
      `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/comments/${encodeURIComponent(commentId)}`,
    );
    return response.data.data;
  },

  async listManageReports(params?: {
    courseId?: string;
    status?: string;
  }): Promise<ManageReportsResponse> {
    const response = await http.get<ApiResponse<ManageReportsResponse>>(
      '/manage/reports',
      { params },
    );
    return response.data.data;
  },

  async resolveReport(
    reportId: string,
    payload: {
      action: ReportActionType;
      note?: string;
      severeViolation?: boolean;
    },
  ): Promise<{ message: string; status: ReportStatus }> {
    const response = await http.patch<
      ApiResponse<{ message: string; status: ReportStatus }>
    >(`/manage/reports/${encodeURIComponent(reportId)}/resolve`, payload);
    return response.data.data;
  },

  async listMyNotifications(): Promise<{
    unreadCount: number;
    items: NotificationItem[];
  }> {
    const response = await http.get<
      ApiResponse<{ unreadCount: number; items: NotificationItem[] }>
    >('/notifications');
    return response.data.data;
  },

  async markAllNotificationsRead(): Promise<{ updatedCount: number }> {
    const response = await http.patch<ApiResponse<{ updatedCount: number }>>(
      '/notifications/read-all',
    );
    return response.data.data;
  },
};
