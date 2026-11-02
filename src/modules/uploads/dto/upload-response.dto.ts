import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const IMAGE_UPLOAD_FOLDERS = ['courses', 'avatars'] as const;
export type ImageUploadFolder = (typeof IMAGE_UPLOAD_FOLDERS)[number];

export class UploadImageQueryDto {
  @ApiPropertyOptional({
    enum: IMAGE_UPLOAD_FOLDERS,
    default: 'courses',
    description: 'Thư mục con trong public/images/',
  })
  @IsOptional()
  @IsIn(IMAGE_UPLOAD_FOLDERS)
  folder: ImageUploadFolder = 'courses';
}

export class UploadResponseDto {
  @ApiProperty({
    example: '/public/images/courses/1730300000000-550e8400-e29b-41d4-a716-446655440000.webp',
    description: 'Đường dẫn tĩnh tới file đã lưu trên server',
  })
  url!: string;

  @ApiProperty({
    example: '1730300000000-550e8400-e29b-41d4-a716-446655440000.webp',
  })
  filename!: string;

  @ApiProperty({ example: 184320, description: 'Kích thước file (bytes)' })
  size!: number;

  @ApiProperty({ example: 'image/webp' })
  mimeType!: string;
}

