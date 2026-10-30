import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { COURSE_LEVELS } from '../../../common/constants/course-level.constant.js';
import {
  CourseStatus,
  CourseType,
} from '../../../common/constants/course.enum.js';

const PLACEHOLDER_VIDEO = 'PLACEHOLDER_VIDEO';

export enum ManageCourseSort {
  UPDATED_DESC = 'updated_desc',
  NEWEST = 'newest',
  TITLE_ASC = 'title_asc',
}

export class ManageCourseQueryDto {
  @ApiPropertyOptional({ example: 'NestJS', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  keyword?: string;

  @ApiPropertyOptional({ enum: CourseStatus })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiPropertyOptional({ example: '6650c1f6f2f4f6e4c8bfe124' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ example: '6650c1f6f2f4f6e4c8bfe123', description: 'Chỉ áp dụng cho Admin' })
  @IsOptional()
  @IsMongoId()
  instructorId?: string;

  @ApiPropertyOptional({ enum: ManageCourseSort, default: ManageCourseSort.UPDATED_DESC })
  @IsOptional()
  @IsEnum(ManageCourseSort)
  sort = ManageCourseSort.UPDATED_DESC;

  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}

export class CreateManageCourseDto {
  @ApiProperty({ example: 'REST API với NestJS', minLength: 5, maxLength: 150 })
  @IsString()
  @Length(5, 150)
  title!: string;

  @ApiProperty({ example: 'Xây dựng API bằng NestJS và TypeScript.', minLength: 20, maxLength: 5000 })
  @IsString()
  @Length(20, 5000)
  description!: string;

  @ApiProperty({ enum: CourseType, example: CourseType.PRO })
  @IsEnum(CourseType)
  type!: CourseType;

  @ApiProperty({ enum: COURSE_LEVELS, example: COURSE_LEVELS[1] })
  @IsIn(COURSE_LEVELS)
  level!: (typeof COURSE_LEVELS)[number];

  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe124' })
  @IsMongoId()
  categoryId!: string;

  @ApiProperty({ example: 'Người đã có kiến thức TypeScript cơ bản.', minLength: 10, maxLength: 1000 })
  @IsString()
  @Length(10, 1000)
  targetAudience!: string;

  @ApiProperty({ type: [String], example: ['Tạo REST API có xác thực'], minItems: 1, maxItems: 10 })
  @IsArray()
  @IsString({ each: true })
  @Length(3, 200, { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  learningOutcomes!: string[];

  @ApiProperty({ example: 'Đã cài Node.js và hiểu TypeScript.', minLength: 5, maxLength: 1000 })
  @IsString()
  @Length(5, 1000)
  requirements!: string;

  @ApiProperty({ example: 699000, minimum: 0, maximum: 100_000_000 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  price!: number;

  @ApiPropertyOptional({ example: null, nullable: true, minimum: 0, maximum: 100_000_000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100_000_000)
  discountPrice?: number | null;

  @ApiPropertyOptional({ example: 'https://example.com/course.png', nullable: true, maxLength: 500 })
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(500)
  thumbnail?: string | null;

  @ApiPropertyOptional({
    example: '6650c1f6f2f4f6e4c8bfe123',
    description: 'Bắt buộc khi tạo khóa với vai trò Admin; giảng viên hiện tại được lấy từ JWT.',
  })
  @IsOptional()
  @IsMongoId()
  instructorId?: string;
}

export class UpdateManageCourseDto extends PartialType(
  OmitType(CreateManageCourseDto, ['instructorId'] as const),
  { skipNullProperties: false },
) {}

export class RejectManageCourseDto {
  @ApiProperty({ example: 'Nội dung khóa học cần bổ sung thêm bài thực hành.', minLength: 10, maxLength: 500 })
  @IsString()
  @Length(10, 500)
  reason!: string;
}

export class CreateChapterDto {
  @ApiProperty({ example: 'Cấu trúc ứng dụng NestJS', minLength: 3, maxLength: 150 })
  @IsString()
  @Length(3, 150)
  title!: string;
}

export class UpdateChapterDto extends PartialType(CreateChapterDto, {
  skipNullProperties: false,
}) {}

export class ReorderChaptersDto {
  @ApiProperty({
    type: [String],
    example: ['6650c1f6f2f4f6e4c8bfe131', '6650c1f6f2f4f6e4c8bfe132'],
    description: 'Phải chứa đúng và đủ ID chương hiện có, không trùng lặp.',
  })
  @IsArray()
  @IsMongoId({ each: true })
  chapterIds!: string[];
}

export class CreateLessonDto {
  @ApiProperty({ example: '1.1 Tạo module đầu tiên', minLength: 3, maxLength: 150 })
  @IsString()
  @Length(3, 150)
  title!: string;

  @ApiProperty({
    example: 'https://example.com/lesson.mp4',
    description: `URL HTTPS hoặc giá trị giữ chỗ chính xác "${PLACEHOLDER_VIDEO}".`,
    maxLength: 500,
  })
  @ValidateIf((object: CreateLessonDto) => object.videoUrl !== PLACEHOLDER_VIDEO)
  @IsString()
  @MaxLength(500)
  @IsUrl({ protocols: ['https'], require_protocol: true })
  videoUrl!: string;

  @ApiProperty({ example: 420, minimum: 1, maximum: 36000, description: 'Thời lượng tính bằng giây.' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36000)
  duration!: number;

  @ApiPropertyOptional({ example: 'Ghi chú bài học', nullable: true, maxLength: 10000 })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  note?: string | null;

  @ApiPropertyOptional({ example: 'Tóm tắt nội dung bài học', nullable: true, maxLength: 3000 })
  @IsOptional()
  @IsString()
  @MaxLength(3000)
  summary?: string | null;
}

export class UpdateLessonDto extends PartialType(CreateLessonDto, {
  skipNullProperties: false,
}) {}

export class ReorderLessonsDto {
  @ApiProperty({
    type: [String],
    example: ['6650c1f6f2f4f6e4c8bfe133', '6650c1f6f2f4f6e4c8bfe134'],
    description: 'Phải chứa đúng và đủ ID bài giảng hiện có, không trùng lặp.',
  })
  @IsArray()
  @IsMongoId({ each: true })
  lessonIds!: string[];
}

export class CreateQuizQuestionDto {
  @ApiProperty({ example: 'NestJS module dùng để làm gì?', minLength: 5, maxLength: 500 })
  @IsString()
  @Length(5, 500)
  content!: string;

  @ApiProperty({ type: [String], example: ['Đóng gói chức năng', 'Hiển thị giao diện'], minItems: 2, maxItems: 6 })
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsString({ each: true })
  @Length(1, 200, { each: true })
  options!: string[];

  @ApiProperty({
    example: 0,
    minimum: 0,
    maximum: 5,
    description: 'Chỉ số đáp án đúng bắt đầu từ 0 (0-based), phải nhỏ hơn số options.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(5)
  correctOption!: number;

  @ApiProperty({ example: 'Module gom controller, provider và dependency.', minLength: 5, maxLength: 1000 })
  @IsString()
  @Length(5, 1000)
  explanation!: string;
}

export class UpdateQuizQuestionDto extends PartialType(
  CreateQuizQuestionDto,
  { skipNullProperties: false },
) {}

export class ManageCourseIdParamsDto {
  @IsMongoId()
  id!: string;
}

export class CourseParamsDto {
  @IsMongoId()
  courseId!: string;
}

export class ChapterParamsDto extends CourseParamsDto {
  @IsMongoId()
  chapterId!: string;
}

export class LessonParamsDto extends ChapterParamsDto {
  @IsMongoId()
  lessonId!: string;
}

export class QuizQuestionParamsDto extends LessonParamsDto {
  @IsMongoId()
  questionId!: string;
}
