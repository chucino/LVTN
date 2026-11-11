import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EnrollmentStatus } from '../../../common/constants/learning.enum.js';

export enum ManageCourseStudentsStatusFilter {
  ALL = 'ALL',
  LEARNING = 'LEARNING',
  COMPLETED = 'COMPLETED',
}

export enum ManageCourseStudentsSort {
  NEWEST = 'NEWEST',
  OLDEST = 'OLDEST',
  PROGRESS_DESC = 'PROGRESS_DESC',
  PROGRESS_ASC = 'PROGRESS_ASC',
}

export class ManageCourseStudentsQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm theo họ tên hoặc email học viên',
    example: 'nguyen',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ManageCourseStudentsStatusFilter,
    default: ManageCourseStudentsStatusFilter.ALL,
    description: 'Lọc theo trạng thái học tập',
  })
  @IsOptional()
  @IsEnum(ManageCourseStudentsStatusFilter)
  status?: ManageCourseStudentsStatusFilter = ManageCourseStudentsStatusFilter.ALL;

  @ApiPropertyOptional({
    enum: ManageCourseStudentsSort,
    default: ManageCourseStudentsSort.NEWEST,
    description: 'Sắp xếp danh sách',
  })
  @IsOptional()
  @IsEnum(ManageCourseStudentsSort)
  sort?: ManageCourseStudentsSort = ManageCourseStudentsSort.NEWEST;
}

export class ManageStudentProfileDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe123' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Văn Học Viên' })
  fullName!: string;

  @ApiProperty({ example: 'student@example.com' })
  email!: string;

  @ApiProperty({ example: null, nullable: true })
  avatar!: string | null;
}

export class ManageCourseStudentItemDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe199' })
  enrollmentId!: string;

  @ApiProperty({ type: ManageStudentProfileDto })
  student!: ManageStudentProfileDto;

  @ApiProperty({ format: 'date-time' })
  enrolledAt!: string;

  @ApiProperty({ example: 65 })
  progressPercent!: number;

  @ApiProperty({ enum: EnrollmentStatus, example: EnrollmentStatus.LEARNING })
  status!: EnrollmentStatus;

  @ApiProperty({ format: 'date-time', nullable: true, example: null })
  completedAt!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'NC-2026-A1B2C3D4',
    description: 'Mã chứng chỉ nếu học viên đã hoàn thành và được cấp',
  })
  certificateCode!: string | null;
}

export class ManageCourseStudentSummaryDto {
  @ApiProperty({ example: 45, description: 'Tổng số học viên đã đăng ký' })
  totalStudents!: number;

  @ApiProperty({ example: 35, description: 'Số học viên đang học' })
  learningStudents!: number;

  @ApiProperty({ example: 10, description: 'Số học viên đã hoàn thành khóa' })
  completedStudents!: number;

  @ApiProperty({ example: 52.4, description: 'Tiến độ trung bình của lớp (%)' })
  avgProgress!: number;
}

export class ManageCourseStudentsCourseInfoDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  id!: string;

  @ApiProperty({ example: 'Lập trình NestJS chuyên sâu' })
  title!: string;

  @ApiProperty({ example: 'PRO' })
  type!: string;

  @ApiProperty({ example: 'APPROVED' })
  status!: string;
}

export class ManageCourseStudentsResponseDto {
  @ApiProperty({ type: ManageCourseStudentsCourseInfoDto })
  course!: ManageCourseStudentsCourseInfoDto;

  @ApiProperty({ type: ManageCourseStudentSummaryDto })
  summary!: ManageCourseStudentSummaryDto;

  @ApiProperty({ type: [ManageCourseStudentItemDto] })
  items!: ManageCourseStudentItemDto[];

  @ApiProperty({ example: 45 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 10 })
  limit!: number;

  @ApiProperty({ example: 5 })
  totalPages!: number;
}

