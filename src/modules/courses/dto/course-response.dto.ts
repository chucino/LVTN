import { ApiProperty } from '@nestjs/swagger';
import { COURSE_LEVELS } from '../../../common/constants/course-level.constant.js';
import { CourseType } from '../../../common/constants/course.enum.js';

export class InstructorCourseResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe123' })
  id!: string;

  @ApiProperty({ example: 'Nguyễn Minh An' })
  fullName!: string;

  @ApiProperty({ example: null, nullable: true })
  avatar!: string | null;
}

export class CategoryCourseResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe124' })
  id!: string;

  @ApiProperty({ example: 'Lập trình Web' })
  name!: string;
}

export class CourseCardResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe125' })
  id!: string;

  @ApiProperty({ example: 'HTML và CSS cơ bản' })
  title!: string;

  @ApiProperty({ example: null, nullable: true })
  thumbnail!: string | null;

  @ApiProperty({ enum: CourseType, example: CourseType.FREE })
  type!: CourseType;

  @ApiProperty({ enum: COURSE_LEVELS, example: COURSE_LEVELS[0] })
  level!: (typeof COURSE_LEVELS)[number];

  @ApiProperty({ example: 0 })
  price!: number;

  @ApiProperty({ example: null, nullable: true })
  discountPrice!: number | null;

  @ApiProperty({ example: 4.7 })
  avgRating!: number;

  @ApiProperty({ example: 4 })
  totalChapters!: number;

  @ApiProperty({ example: 12 })
  totalLessons!: number;

  @ApiProperty({ example: 5400 })
  totalDuration!: number;

  @ApiProperty({ type: InstructorCourseResponseDto })
  instructor!: InstructorCourseResponseDto;

  @ApiProperty({ type: CategoryCourseResponseDto })
  category!: CategoryCourseResponseDto;
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseCardResponseDto] })
  items!: CourseCardResponseDto[];

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 12 })
  limit!: number;

  @ApiProperty({ example: 1 })
  totalPages!: number;
}

export class LessonPublicResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe126' })
  id!: string;

  @ApiProperty({ example: '1.1 Cấu trúc một trang web' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ example: 420 })
  duration!: number;

  @ApiProperty({ example: false })
  hasQuiz!: boolean;
}

export class ChapterPublicResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe127' })
  id!: string;

  @ApiProperty({ example: 'Làm quen web' })
  title!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiProperty({ type: [LessonPublicResponseDto] })
  lessons!: LessonPublicResponseDto[];
}

export class CourseDetailResponseDto extends CourseCardResponseDto {
  @ApiProperty({ example: 'Khóa học dành cho người mới bắt đầu...' })
  description!: string;

  @ApiProperty({ example: 'Người chưa từng xây dựng giao diện web.' })
  targetAudience!: string;

  @ApiProperty({
    type: [String],
    example: ['Tạo trang HTML có cấu trúc rõ ràng'],
  })
  learningOutcomes!: string[];

  @ApiProperty({ example: 'Máy tính có kết nối internet.' })
  requirements!: string;

  @ApiProperty({ type: [ChapterPublicResponseDto] })
  chapters!: ChapterPublicResponseDto[];
}

export class CategoryResponseDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe124' })
  id!: string;

  @ApiProperty({ example: 'Lập trình Web' })
  name!: string;
}
