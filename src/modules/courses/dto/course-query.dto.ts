import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { COURSE_LEVELS } from '../../../common/constants/course-level.constant.js';
import { CourseType } from '../../../common/constants/course.enum.js';

export enum CourseSort {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  RATING_DESC = 'rating_desc',
}

export class CourseQueryDto {
  @ApiPropertyOptional({ example: 'JavaScript', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  keyword?: string;

  @ApiPropertyOptional({ enum: CourseType })
  @IsOptional()
  @IsEnum(CourseType)
  type?: CourseType;

  @ApiPropertyOptional({ example: '6650c1f6f2f4f6e4c8bfe123' })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({ enum: COURSE_LEVELS })
  @IsOptional()
  @IsIn(COURSE_LEVELS)
  level?: (typeof COURSE_LEVELS)[number];

  @ApiPropertyOptional({ example: 300000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ example: 700000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ example: 4.2, minimum: 0, maximum: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ enum: CourseSort, default: CourseSort.NEWEST })
  @IsOptional()
  @IsEnum(CourseSort)
  sort = CourseSort.NEWEST;

  @ApiPropertyOptional({ example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ example: 12, minimum: 1, maximum: 50, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 12;
}
