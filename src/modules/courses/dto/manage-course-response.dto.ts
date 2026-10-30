import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CourseLevel } from '../../../common/constants/course-level.constant.js';
import { CourseStatus, CourseType } from '../../../common/constants/course.enum.js';

export class ManageInstructorDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe123' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  fullName!: string;

  @ApiProperty({ example: null, nullable: true })
  avatar!: string | null;
}

export class ManageCategoryDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe124' })
  id!: string;

  @ApiProperty({ example: 'Lập trình Web' })
  name!: string;
}

export class ManageCoursePermissionsDto {
  @ApiProperty() canEdit!: boolean;
  @ApiProperty() canSubmit!: boolean;
  @ApiProperty() canWithdraw!: boolean;
  @ApiProperty() canDelete!: boolean;
  @ApiProperty() canApprove!: boolean;
  @ApiProperty() canReject!: boolean;
  @ApiProperty() canHide!: boolean;
}

export class ManageCourseItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  id!: string;

  @ApiProperty({ example: 'REST API với NestJS' })
  title!: string;

  @ApiProperty({ example: null, nullable: true })
  thumbnail!: string | null;

  @ApiProperty({ enum: CourseType, example: CourseType.PRO })
  type!: CourseType;

  @ApiProperty({ example: 'Có cơ bản' })
  level!: CourseLevel;

  @ApiProperty({ example: 699000 })
  price!: number;

  @ApiProperty({ example: null, nullable: true })
  discountPrice!: number | null;

  @ApiProperty({ example: 4.8 })
  avgRating!: number;

  @ApiProperty({ example: 4 })
  totalChapters!: number;

  @ApiProperty({ example: 12 })
  totalLessons!: number;

  @ApiProperty({ example: 5400 })
  totalDuration!: number;

  @ApiProperty({ type: ManageInstructorDto })
  instructor!: ManageInstructorDto;

  @ApiProperty({ type: ManageCategoryDto })
  category!: ManageCategoryDto;

  @ApiProperty({ enum: CourseStatus, example: CourseStatus.DRAFT })
  status!: CourseStatus;

  @ApiProperty({ example: null, nullable: true })
  rejectReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;

  @ApiProperty({ type: ManageCoursePermissionsDto })
  permissions!: ManageCoursePermissionsDto;
}

export class ManageReadinessDto {
  @ApiProperty({ example: false })
  ready!: boolean;

  @ApiProperty({ type: [String], example: ['Chương 2 chưa có bài giảng'] })
  issues!: string[];

  @ApiProperty({ type: [String], example: [] })
  warnings!: string[];
}

export class ManageQuizQuestionDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe128' })
  id!: string;

  @ApiProperty({ example: 'NestJS module dùng để làm gì?' })
  content!: string;

  @ApiProperty({ type: [String], example: ['Đóng gói chức năng', 'Hiển thị giao diện'] })
  options!: string[];

  @ApiProperty({
    example: 0,
    minimum: 0,
    description: 'Chỉ số đáp án đúng, bắt đầu từ 0 (0-based).',
  })
  correctOption!: number;

  @ApiProperty({ example: 'Module gom controller, provider và dependency.' })
  explanation!: string;
}

export class ManageLessonDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe129' })
  id!: string;

  @ApiProperty({ example: '1.1 Tạo module đầu tiên' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 'https://example.com/lesson.mp4' })
  videoUrl!: string;

  @ApiProperty({ example: 420 })
  duration!: number;

  @ApiPropertyOptional({ example: null, nullable: true })
  note!: string | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  summary!: string | null;

  @ApiProperty({ example: true })
  hasQuiz!: boolean;

  @ApiProperty({ type: [ManageQuizQuestionDto] })
  quizQuestions!: ManageQuizQuestionDto[];
}

export class ManageChapterDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe130' })
  id!: string;

  @ApiProperty({ example: 'Cấu trúc ứng dụng NestJS' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ type: [ManageLessonDto] })
  lessons!: ManageLessonDto[];
}

export class ManageCourseDetailDto extends ManageCourseItemDto {
  @ApiProperty({ example: 'Xây dựng API bằng NestJS và TypeScript.' })
  description!: string;

  @ApiProperty({ example: 'Người đã có kiến thức TypeScript cơ bản.' })
  targetAudience!: string;

  @ApiProperty({ type: [String], example: ['Tạo REST API có xác thực'] })
  learningOutcomes!: string[];

  @ApiProperty({ example: 'Đã cài Node.js và hiểu TypeScript.' })
  requirements!: string;

  @ApiProperty({ type: ManageReadinessDto })
  readiness!: ManageReadinessDto;

  @ApiProperty({ type: [ManageChapterDto] })
  chapters!: ManageChapterDto[];
}

export class ManageCourseListDto {
  @ApiProperty({ type: [ManageCourseItemDto] })
  items!: ManageCourseItemDto[];

  @ApiProperty({ example: 21 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 12 })
  limit!: number;

  @ApiProperty({ example: 2 })
  totalPages!: number;
}

export class ManageInstructorOptionDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe123' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  fullName!: string;

  @ApiProperty({ example: 'an@example.com' })
  email!: string;
}
