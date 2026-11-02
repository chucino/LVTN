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

