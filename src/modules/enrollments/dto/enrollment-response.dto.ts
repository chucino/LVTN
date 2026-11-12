import { ApiProperty } from '@nestjs/swagger';
import { CourseType } from '../../../common/constants/course.enum.js';
import {
  EnrollmentStatus,
  LessonStatus,
} from '../../../common/constants/learning.enum.js';
import { CertificateResponseDto } from '../../certificates/dto/certificate-response.dto.js';

export class EnrollmentStatusResponseDto {
  @ApiProperty({ example: true })
  enrolled!: boolean;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe501', nullable: true })
  enrollmentId!: string | null;

  @ApiProperty({
    enum: EnrollmentStatus,
    example: EnrollmentStatus.LEARNING,
    nullable: true,
  })
  status!: EnrollmentStatus | null;

  @ApiProperty({ example: 33 })
  progressPercent!: number;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126', nullable: true })
  lastLessonId!: string | null;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z', nullable: true })
  enrolledAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  completedAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  certificateCode!: string | null;
}

export class MyEnrolledCourseItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe501' })
  enrollmentId!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  courseId!: string;

  @ApiProperty({ example: 'HTML và CSS cơ bản' })
  title!: string;

  @ApiProperty({ example: null, nullable: true })
  thumbnail!: string | null;

  @ApiProperty({ enum: CourseType, example: CourseType.FREE })
  type!: CourseType;

  @ApiProperty({ example: 'Người mới bắt đầu' })
  level!: string;

  @ApiProperty({ example: 12 })
  totalLessons!: number;

  @ApiProperty({ example: 5400 })
  totalDuration!: number;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  instructorName!: string;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.LEARNING })
  status!: EnrollmentStatus;

  @ApiProperty({ example: 25 })
  progressPercent!: number;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126', nullable: true })
  lastLessonId!: string | null;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  enrolledAt!: string;

  @ApiProperty({ example: null, nullable: true })
  completedAt!: string | null;

  @ApiProperty({ example: null, nullable: true })
  certificateCode!: string | null;
}

export class CurriculumLessonItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126' })
  id!: string;

  @ApiProperty({ example: '1.1 Cấu trúc một trang web' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 420 })
  duration!: number;

  @ApiProperty({ example: true })
  hasQuiz!: boolean;

  @ApiProperty({ example: 2 })
  quizCount!: number;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.UNLOCKED })
  status!: LessonStatus;

  @ApiProperty({ example: 120 })
  lastPositionSec!: number;

  @ApiProperty({ example: 120, required: false })
  watchedSeconds?: number;

  @ApiProperty({ example: false })
  watchedFully!: boolean;

  @ApiProperty({ example: false })
  quizPassed!: boolean;
}

export class CurriculumChapterItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe127' })
  id!: string;

  @ApiProperty({ example: 'Chương 1: Làm quen Web' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ type: [CurriculumLessonItemDto] })
  lessons!: CurriculumLessonItemDto[];
}

export class CourseLearningOverviewDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe501' })
  enrollmentId!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  courseId!: string;

  @ApiProperty({ example: 'HTML và CSS cơ bản' })
  courseTitle!: string;

  @ApiProperty({ enum: CourseType, example: CourseType.FREE })
  courseType!: CourseType;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.LEARNING })
  status!: EnrollmentStatus;

  @ApiProperty({ example: 33 })
  progressPercent!: number;

  @ApiProperty({ example: 1 })
  completedLessons!: number;

  @ApiProperty({ example: 3 })
  totalLessons!: number;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126', nullable: true })
  lastLessonId!: string | null;

  @ApiProperty({ example: '2026-11-02T08:00:00.000Z' })
  enrolledAt!: string;

  @ApiProperty({ example: null, nullable: true })
  completedAt!: string | null;

  @ApiProperty({ type: CertificateResponseDto, nullable: true })
  certificate!: CertificateResponseDto | null;

  @ApiProperty({ type: [CurriculumChapterItemDto] })
  chapters!: CurriculumChapterItemDto[];

  @ApiProperty({
    example: false,
    required: false,
    description:
      'True khi Giảng viên hoặc Admin đang xem khóa học ở chế độ Xem như học viên (không lưu tiến độ vào DB)',
  })
  isPreviewMode?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description:
      'True khi người dùng hiện tại là Admin hoặc Giảng viên được phân công phụ trách khóa học này',
  })
  canManageCourse?: boolean;
}

export class LearnerQuizQuestionDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe130' })
  id!: string;

  @ApiProperty({ example: 'Thẻ nào dùng để tạo tiêu đề chính của trang HTML?' })
  content!: string;

  @ApiProperty({
    type: [String],
    example: ['<div>', '<h1>', '<p>', '<span>'],
  })
  options!: string[];

  @ApiProperty({
    example: 1,
    nullable: true,
    description: 'Chỉ trả về khi bài trắc nghiệm đã vượt qua (quizPassed = true)',
  })
  correctOption!: number | null;

  @ApiProperty({
    example: 'Thẻ <h1> đại diện cho tiêu đề cấp 1 quan trọng nhất trên trang.',
    nullable: true,
    description: 'Chỉ trả về khi bài trắc nghiệm đã vượt qua (quizPassed = true)',
  })
  explanation!: string | null;
}

export class LessonLearningDetailDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126' })
  id!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe127' })
  chapterId!: string;

  @ApiProperty({ example: 'Chương 1: Làm quen Web' })
  chapterTitle!: string;

  @ApiProperty({ example: '1.1 Cấu trúc một trang web' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 'https://www.youtube.com/embed/dQw4w9WgXcQ' })
  videoUrl!: string;

  @ApiProperty({ example: 420 })
  duration!: number;

  @ApiProperty({ example: null, nullable: true })
  note!: string | null;

  @ApiProperty({ example: null, nullable: true })
  summary!: string | null;

  @ApiProperty({ example: true })
  hasQuiz!: boolean;

  @ApiProperty({ example: 1 })
  quizCount!: number;

  @ApiProperty({ example: 100 })
  requiredPassPercent!: number;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.UNLOCKED })
  status!: LessonStatus;

  @ApiProperty({ example: 120 })
  lastPositionSec!: number;

  @ApiProperty({ example: 120, required: false })
  watchedSeconds?: number;

  @ApiProperty({ example: true })
  watchedFully!: boolean;

  @ApiProperty({ example: false })
  quizPassed!: boolean;

  @ApiProperty({ example: true })
  quizUnlocked!: boolean;

  @ApiProperty({
    example: null,
    nullable: true,
  })
  quizLockedReason!: string | null;

  @ApiProperty({ type: [LearnerQuizQuestionDto] })
  quizQuestions!: LearnerQuizQuestionDto[];

  @ApiProperty({ example: null, nullable: true })
  previousLessonId!: string | null;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe128', nullable: true })
  nextLessonId!: string | null;

  @ApiProperty({ example: false })
  nextLessonUnlocked!: boolean;
}

export class LessonProgressUpdateResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126' })
  lessonId!: string;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.COMPLETED })
  status!: LessonStatus;

  @ApiProperty({ example: 420 })
  lastPositionSec!: number;

  @ApiProperty({ example: 252, required: false })
  watchedSeconds?: number;

  @ApiProperty({ example: true })
  watchedFully!: boolean;

  @ApiProperty({ example: true })
  quizPassed!: boolean;

  @ApiProperty({ example: true })
  quizUnlocked!: boolean;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe128', nullable: true })
  unlockedNextLessonId!: string | null;

  @ApiProperty({ example: 50 })
  courseProgressPercent!: number;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.LEARNING })
  enrollmentStatus!: EnrollmentStatus;

  @ApiProperty({ type: CertificateResponseDto, nullable: true })
  certificate!: CertificateResponseDto | null;
}

export class QuizQuestionResultItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe130' })
  questionId!: string;

  @ApiProperty({ example: 1 })
  selectedOption!: number;

  @ApiProperty({ example: true })
  isCorrect!: boolean;

  @ApiProperty({
    example: 'Thẻ <h1> đại diện cho tiêu đề cấp 1 quan trọng nhất trên trang.',
    nullable: true,
    description: 'Chỉ trả lời đúng mới hiển thị giải thích vì sao đáp án đó đúng',
  })
  explanation!: string | null;
}

export class SubmitQuizResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126' })
  lessonId!: string;

  @ApiProperty({ example: 2 })
  totalQuestions!: number;

  @ApiProperty({ example: 2 })
  correctCount!: number;

  @ApiProperty({ example: 100 })
  scorePercent!: number;

  @ApiProperty({ example: 70 })
  requiredPassPercent!: number;

  @ApiProperty({ example: true })
  passed!: boolean;

  @ApiProperty({ example: false })
  canRetry!: boolean;

  @ApiProperty({ enum: LessonStatus, example: LessonStatus.COMPLETED })
  lessonStatus!: LessonStatus;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe128', nullable: true })
  unlockedNextLessonId!: string | null;

  @ApiProperty({ example: 100 })
  courseProgressPercent!: number;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.COMPLETED })
  enrollmentStatus!: EnrollmentStatus;

  @ApiProperty({ type: CertificateResponseDto, nullable: true })
  certificate!: CertificateResponseDto | null;

  @ApiProperty({ type: [QuizQuestionResultItemDto] })
  results!: QuizQuestionResultItemDto[];
}

