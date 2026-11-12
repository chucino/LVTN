import type { CourseType } from './course';

export type EnrollmentStatus = 'LEARNING' | 'COMPLETED';
export type LessonStatus = 'LOCKED' | 'UNLOCKED' | 'COMPLETED';
export type CertificateStatus = 'VALID' | 'REVOKED';

export interface CertificateItem {
  id: string;
  certificateCode: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  studentName: string;
  issuedAt: string;
  qrCode: string;
  fileUrl: string | null;
  status: CertificateStatus;
}

export interface CertificateVerifyResult {
  certificateCode: string;
  status: CertificateStatus;
  isValid: boolean;
  issuedAt: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
}

export interface EnrollmentStatusResponse {
  enrolled: boolean;
  enrollmentId: string | null;
  status: EnrollmentStatus | null;
  progressPercent: number;
  lastLessonId: string | null;
  enrolledAt: string | null;
  completedAt: string | null;
  certificateCode: string | null;
}

export interface MyEnrolledCourseItem {
  enrollmentId: string;
  courseId: string;
  title: string;
  thumbnail: string | null;
  type: CourseType;
  level: string;
  totalLessons: number;
  totalDuration: number;
  instructorName: string;
  status: EnrollmentStatus;
  progressPercent: number;
  lastLessonId: string | null;
  enrolledAt: string;
  completedAt: string | null;
  certificateCode: string | null;
}

export interface CurriculumLessonItem {
  id: string;
  title: string;
  order: number;
  duration: number;
  hasQuiz: boolean;
  quizCount: number;
  status: LessonStatus;
  lastPositionSec: number;
  watchedFully: boolean;
  quizPassed: boolean;
}

export interface CurriculumChapterItem {
  id: string;
  title: string;
  order: number;
  lessons: CurriculumLessonItem[];
}

export interface CourseLearningOverview {
  enrollmentId: string;
  courseId: string;
  courseTitle: string;
  courseType: CourseType;
  status: EnrollmentStatus;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  lastLessonId: string | null;
  enrolledAt: string;
  completedAt: string | null;
  certificate: CertificateItem | null;
  chapters: CurriculumChapterItem[];
}

export interface LearnerQuizQuestion {
  id: string;
  content: string;
  options: string[];
  correctOption: number | null;
  explanation: string | null;
}

export interface LessonLearningDetail {
  id: string;
  chapterId: string;
  chapterTitle: string;
  title: string;
  order: number;
  videoUrl: string;
  duration: number;
  note: string | null;
  summary: string | null;
  hasQuiz: boolean;
  quizCount: number;
  requiredPassPercent: number;
  status: LessonStatus;
  lastPositionSec: number;
  watchedFully: boolean;
  quizPassed: boolean;
  quizUnlocked: boolean;
  quizLockedReason: string | null;
  quizQuestions: LearnerQuizQuestion[];
  previousLessonId: string | null;
  nextLessonId: string | null;
  nextLessonUnlocked: boolean;
}

export interface LessonProgressUpdateResponse {
  lessonId: string;
  status: LessonStatus;
  lastPositionSec: number;
  watchedFully: boolean;
  quizPassed: boolean;
  quizUnlocked: boolean;
  unlockedNextLessonId: string | null;
  courseProgressPercent: number;
  enrollmentStatus: EnrollmentStatus;
  certificate: CertificateItem | null;
}

export interface QuizQuestionResultItem {
  questionId: string;
  selectedOption: number;
  isCorrect: boolean;
  explanation: string | null;
}

export interface SubmitQuizResponse {
  lessonId: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
  requiredPassPercent: number;
  passed: boolean;
  canRetry: boolean;
  lessonStatus: LessonStatus;
  unlockedNextLessonId: string | null;
  courseProgressPercent: number;
  enrollmentStatus: EnrollmentStatus;
  certificate: CertificateItem | null;
  results: QuizQuestionResultItem[];
}

export type ManageCourseStudentsStatusFilter = 'ALL' | 'LEARNING' | 'COMPLETED';
export type ManageCourseStudentsSort =
  | 'NEWEST'
  | 'OLDEST'
  | 'PROGRESS_DESC'
  | 'PROGRESS_ASC';

export interface ManageCourseStudentProfile {
  id: string;
  fullName: string;
  email: string;
  avatar: string | null;
}

export interface ManageCourseStudentItem {
  enrollmentId: string;
  student: ManageCourseStudentProfile;
  enrolledAt: string;
  progressPercent: number;
  status: EnrollmentStatus;
  completedAt: string | null;
  certificateCode: string | null;
}

export interface ManageCourseStudentSummary {
  totalStudents: number;
  learningStudents: number;
  completedStudents: number;
  avgProgress: number;
}

export interface ManageCourseStudentsCourseInfo {
  id: string;
  title: string;
  type: string;
  status: string;
}

export interface ManageCourseStudentsResponse {
  course: ManageCourseStudentsCourseInfo;
  summary: ManageCourseStudentSummary;
  items: ManageCourseStudentItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ManageCourseStudentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ManageCourseStudentsStatusFilter;
  sort?: ManageCourseStudentsSort;
}


export type CommentReactionType =
  | 'LIKE'
  | 'LOVE'
  | 'CARE'
  | 'HAHA'
  | 'WOW'
  | 'SAD'
  | 'ANGRY';

export interface CommentAuthor {
  id: string;
  fullName: string;
  avatar: string | null;
  role: string;
}

export interface CommentReplyToUser {
  userId: string;
  fullName: string;
}

export interface CommentReactionSummaryItem {
  type: CommentReactionType;
  count: number;
}

export type CommentVisibilityStatus = 'VISIBLE' | 'HIDDEN';

export interface LessonCommentItem {
  id: string;
  courseId: string;
  lessonId: string;
  parentId: string | null;
  replyToUser: CommentReplyToUser | null;
  author: CommentAuthor;
  content: string;
  visibilityStatus: CommentVisibilityStatus;
  totalReactions: number;
  reactionSummary: CommentReactionSummaryItem[];
  myReaction: CommentReactionType | null;
  isReportedByMe: boolean;
  reportsCount: number;
  canDelete: boolean;
  createdAt: string;
  replies: LessonCommentItem[];
}

export interface LessonCommentsResponse {
  courseId: string;
  lessonId: string;
  totalComments: number;
  totalRootComments: number;
  myCommentBannedUntil: string | null;
  items: LessonCommentItem[];
}

export type ReportTargetType = 'QUESTION' | 'ANSWER' | 'REVIEW';
export type ReportStatus = 'PENDING' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
export type ReportActionType =
  | 'DISMISS'
  | 'DELETE_AND_REMIND'
  | 'ESCALATE'
  | 'APPLY_PENALTY';

export interface ViolationHistoryItem {
  reason: string;
  actionTaken: string;
  penaltySummary: string;
  resolvedAt: string;
}

export interface ReportQueueItem {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  courseId: string;
  courseTitle: string;
  lessonId: string;
  lessonTitle: string;
  reporter: CommentAuthor;
  targetAuthor: CommentAuthor;
  targetAuthorViolationCount: number;
  targetAuthorCommentBannedUntil: string | null;
  targetAuthorStatus: string;
  targetAuthorViolationHistory: ViolationHistoryItem[];
  duplicateReportCount: number;
  commentContent: string;
  commentVisibilityStatus: CommentVisibilityStatus;
  reason: string;
  status: ReportStatus;
  escalatedToAdmin: boolean;
  actionTaken: ReportActionType | null;
  moderationNote: string | null;
  resolvedBy: CommentAuthor | null;
  resolvedAt: string | null;
  createdAt: string;
}

export interface ManageReportsResponse {
  items: ReportQueueItem[];
  summary: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
  courses: Array<{ id: string; title: string }>;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  courseId: string | null;
  lessonId: string | null;
  isRead: boolean;
  createdAt: string;
}
