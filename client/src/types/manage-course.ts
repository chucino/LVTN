import type { CourseLevel, CourseType } from '@/types/course';

export type ManageCourseStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'HIDDEN';
export type ManageCourseSort = 'updated_desc' | 'newest' | 'title_asc';
export type ManageCourseTab = 'info' | 'content' | 'status';

export interface ManageCoursePermissions {
  canEdit: boolean;
  canSubmit: boolean;
  canWithdraw: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  canHide: boolean;
}

export interface ManageCourseInstructor {
  id: string;
  fullName: string;
  avatar: string | null;
}

export interface ManageCourseCategory {
  id: string;
  name: string;
}

export interface ManageCourseItem {
  id: string;
  title: string;
  thumbnail: string | null;
  type: CourseType;
  level: CourseLevel;
  price: number;
  discountPrice: number | null;
  avgRating: number;
  totalChapters: number;
  totalLessons: number;
  totalDuration: number;
  instructor: ManageCourseInstructor;
  category: ManageCourseCategory;
  status: ManageCourseStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
  permissions: ManageCoursePermissions;
}

export interface ManageReadiness {
  ready: boolean;
  issues: string[];
  warnings: string[];
}

export interface ManageQuizQuestion {
  id: string;
  content: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export interface ManageLesson {
  id: string;
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  note: string | null;
  summary: string | null;
  hasQuiz: boolean;
  quizQuestions: ManageQuizQuestion[];
}

export interface ManageChapter {
  id: string;
  title: string;
  order: number;
  lessons: ManageLesson[];
}

export interface ManageCourseDetail extends ManageCourseItem {
  description: string;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  readiness: ManageReadiness;
  chapters: ManageChapter[];
}

export interface ManageCourseList {
  items: ManageCourseItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ManageInstructorOption {
  id: string;
  fullName: string;
  email: string;
}

export interface ManageCourseQuery {
  keyword?: string;
  status?: ManageCourseStatus;
  type?: CourseType;
  categoryId?: string;
  instructorId?: string;
  sort?: ManageCourseSort;
  page?: number;
  limit?: number;
}

export interface ManageCoursePayload {
  title: string;
  description: string;
  type: CourseType;
  level: CourseLevel;
  categoryId: string;
  targetAudience: string;
  learningOutcomes: string[];
  requirements: string;
  price: number;
  discountPrice?: number | null;
  thumbnail?: string | null;
  instructorId?: string;
}

export interface ManageChapterPayload {
  title: string;
}

export interface ManageLessonPayload {
  title: string;
  videoUrl: string;
  duration: number;
  note?: string | null;
  summary?: string | null;
}

export interface ManageQuizQuestionPayload {
  content: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

export const MANAGE_COURSE_STATUS = {
  DRAFT: { label: 'Nháp', className: 'status-draft' },
  PENDING: { label: 'Chờ duyệt', className: 'status-pending' },
  APPROVED: { label: 'Đã duyệt', className: 'status-approved' },
  HIDDEN: { label: 'Đã ẩn', className: 'status-hidden' },
} as const;

export const MANAGE_COURSE_TABS: Array<{
  value: ManageCourseTab;
  label: string;
}> = [
  { value: 'info', label: 'Thông tin' },
  { value: 'content', label: 'Nội dung' },
  { value: 'status', label: 'Trạng thái và duyệt' },
];
