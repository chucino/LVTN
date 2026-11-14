import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CommentVisibilityStatus } from '../../questions/schemas/lesson-comment.schema.js';

export class UpsertCourseReviewDto {
  @ApiProperty({
    example: 5,
    description: 'Số sao đánh giá từ 1 đến 5',
  })
  @Type(() => Number)
  @IsInt({ message: 'Số sao đánh giá phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Số sao đánh giá tối thiểu là 1' })
  @Max(5, { message: 'Số sao đánh giá tối đa là 5' })
  rating!: number;

  @ApiPropertyOptional({
    example: 'Khóa học giải thích rất chi tiết và dễ hiểu!',
    description: 'Nhận xét đánh giá về khóa học (không bắt buộc, tối đa 2000 ký tự)',
  })
  @IsOptional()
  @IsString({ message: 'Nội dung nhận xét phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Nhận xét không được vượt quá 2000 ký tự' })
  comment?: string;
}

export class ListCourseReviewsQueryDto {
  @ApiPropertyOptional({
    example: 5,
    description: 'Lọc theo số sao cụ thể (1 đến 5)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Bộ lọc số sao phải là số nguyên từ 1 đến 5' })
  @Min(1, { message: 'Bộ lọc số sao tối thiểu là 1' })
  @Max(5, { message: 'Bộ lọc số sao tối đa là 5' })
  rating?: number;
}

export class ReportCourseReviewDto {
  @ApiProperty({
    example: 'Nội dung nhận xét chứa từ ngữ xúc phạm hoặc spam quảng cáo',
    description: 'Lý do báo cáo đánh giá vi phạm (3 - 500 ký tự)',
  })
  @IsString({ message: 'Lý do báo cáo phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Vui lòng nhập lý do báo cáo vi phạm' })
  @MinLength(3, { message: 'Lý do báo cáo phải có ít nhất 3 ký tự' })
  @MaxLength(500, { message: 'Lý do báo cáo không vượt quá 500 ký tự' })
  reason!: string;
}

export class CourseReviewAuthorDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe001' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Học Viên' })
  fullName!: string;

  @ApiProperty({ example: null, nullable: true })
  avatar!: string | null;
}

export class CourseReviewItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe801' })
  id!: string;

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe100' })
  courseId!: string;

  @ApiProperty({ type: CourseReviewAuthorDto })
  author!: CourseReviewAuthorDto;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiProperty({ example: 'Khóa học rất thực tế và dễ áp dụng.' })
  comment!: string;

  @ApiProperty({ example: true })
  hasComment!: boolean;

  @ApiProperty({ example: '2026-11-15T01:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-15T01:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ example: false })
  isEdited!: boolean;
}

export class CourseReviewSummaryDto {
  @ApiProperty({ example: 4.8 })
  avgRating!: number;

  @ApiProperty({ example: 12 })
  totalReviews!: number;

  @ApiProperty({
    example: { 1: 0, 2: 0, 3: 1, 4: 2, 5: 9 },
  })
  distribution!: Record<1 | 2 | 3 | 4 | 5, number>;
}

export class CourseReviewsListResponseDto {
  @ApiProperty({ type: CourseReviewSummaryDto })
  summary!: CourseReviewSummaryDto;

  @ApiProperty({ type: [CourseReviewItemDto] })
  items!: CourseReviewItemDto[];
}

export class MyReviewDetailDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe801' })
  id!: string;

  @ApiProperty({ example: 5 })
  rating!: number;

  @ApiProperty({ example: 'Khóa học rất bổ ích!' })
  comment!: string;

  @ApiProperty({ example: true })
  hasComment!: boolean;

  @ApiProperty({ enum: CommentVisibilityStatus })
  visibilityStatus!: CommentVisibilityStatus;

  @ApiProperty({ example: null, nullable: true })
  moderationNote!: string | null;

  @ApiProperty({ example: '2026-11-15T01:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-11-15T01:00:00.000Z' })
  updatedAt!: string;
}

export class MyCourseReviewStateDto {
  @ApiProperty({
    example: true,
    description:
      'True khi học viên đã hoàn thành 100% khóa học hoặc đã từng gửi đánh giá cho khóa học này',
  })
  canReview!: boolean;

  @ApiProperty({ example: true })
  isCourseCompleted!: boolean;

  @ApiProperty({ example: false })
  isCommentBanned!: boolean;

  @ApiProperty({ example: null, nullable: true })
  commentBannedUntil!: string | null;

  @ApiProperty({ type: MyReviewDetailDto, nullable: true })
  myReview!: MyReviewDetailDto | null;

  @ApiProperty({ type: [String], example: [] })
  reportedReviewIds!: string[];
}

