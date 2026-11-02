import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { EnrollmentStatus } from '../../../common/constants/learning.enum.js';

export class UpdateLessonProgressDto {
  @ApiProperty({
    example: 180,
    description: 'Vị trí đang xem video tính bằng giây (>= 0)',
  })
  @Type(() => Number)
  @IsInt({ message: 'lastPositionSec phải là số nguyên' })
  @Min(0, { message: 'lastPositionSec không được nhỏ hơn 0' })
  lastPositionSec!: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Đánh dấu đã xem hết video bài giảng hay chưa',
  })
  @IsOptional()
  @IsBoolean({ message: 'watchedFully phải là kiểu boolean' })
  watchedFully?: boolean;
}

export class MyCoursesQueryDto {
  @ApiPropertyOptional({
    enum: EnrollmentStatus,
    description: 'Lọc theo trạng thái học tập: LEARNING hoặc COMPLETED',
  })
  @IsOptional()
  @IsEnum(EnrollmentStatus, {
    message: 'status phải là LEARNING hoặc COMPLETED',
  })
  status?: EnrollmentStatus;
}

