import type { CommentVisibilityStatus } from './learning';

export interface CourseReviewAuthor {
  id: string;
  fullName: string;
  avatar: string | null;
}

export interface CourseReviewItem {
  id: string;
  courseId: string;
  author: CourseReviewAuthor;
  rating: number;
  comment: string;
  hasComment: boolean;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface CourseReviewSummary {
  avgRating: number;
  totalReviews: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CourseReviewsListResponse {
  summary: CourseReviewSummary;
  items: CourseReviewItem[];
}

export interface MyReviewDetail {
  id: string;
  rating: number;
  comment: string;
  hasComment: boolean;
  visibilityStatus: CommentVisibilityStatus;
  moderationNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MyCourseReviewState {
  canReview: boolean;
  isCourseCompleted: boolean;
  isCommentBanned: boolean;
  commentBannedUntil: string | null;
  myReview: MyReviewDetail | null;
  reportedReviewIds: string[];
}

