import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export const LOCAL_AVATAR_PATTERN =
  /^\/public\/images\/avatars\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp)$/;

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', minLength: 2, maxLength: 100 })
  @IsOptional()
  @ValidateIf((object: UpdateProfileDto) => object.fullName !== undefined)
  @IsString()
  @Length(2, 100)
  fullName?: string;

  @ApiPropertyOptional({
    example: '2001-08-15',
    nullable: true,
    description: 'Ngày sinh định dạng YYYY-MM-DD hoặc ISO',
  })
  @IsOptional()
  @ValidateIf(
    (object: UpdateProfileDto) =>
      object.dateOfBirth !== undefined &&
      object.dateOfBirth !== null &&
      object.dateOfBirth !== '',
  )
  @IsDateString({}, { message: 'Ngày sinh không đúng định dạng hợp lệ' })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({
    example: 'Sinh viên Công nghệ thông tin',
    nullable: true,
    maxLength: 150,
  })
  @IsOptional()
  @ValidateIf(
    (object: UpdateProfileDto) =>
      object.occupation !== undefined && object.occupation !== null,
  )
  @IsString()
  @MaxLength(150)
  occupation?: string | null;

  @ApiPropertyOptional({
    example: '/public/images/avatars/1730300000000-550e8400.webp',
    nullable: true,
    maxLength: 500,
    description: 'Đường dẫn ảnh đã tải lên (/public/images/avatars/...) hoặc URL HTTPS',
  })
  @IsOptional()
  @ValidateIf(
    (object: UpdateProfileDto) =>
      object.avatar !== undefined && object.avatar !== null,
  )
  @IsString()
  @MaxLength(500)
  @ValidateIf(
    (object: UpdateProfileDto) =>
      typeof object.avatar === 'string' &&
      !LOCAL_AVATAR_PATTERN.test(object.avatar),
  )
  @IsUrl(
    { protocols: ['https'], require_protocol: true },
    {
      message:
        'Ảnh đại diện phải là đường dẫn đã tải lên (/public/images/avatars/...) hoặc URL HTTPS hợp lệ',
    },
  )
  avatar?: string | null;

  @ApiPropertyOptional({
    type: [String],
    example: ['Lập trình Web', 'Backend & DevOps'],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  @ArrayMaxSize(20)
  interestedCategories?: string[];
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass@123', description: 'Mật khẩu hiện tại' })
  @IsString()
  @MinLength(1, { message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword!: string;

  @ApiProperty({
    example: 'NewPass@123456',
    minLength: 8,
    maxLength: 64,
    description: 'Mật khẩu mới (tối thiểu 8 ký tự)',
  })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
  @MaxLength(64, { message: 'Mật khẩu mới không được vượt quá 64 ký tự' })
  newPassword!: string;

  @ApiProperty({
    example: 'NewPass@123456',
    minLength: 8,
    maxLength: 64,
    description: 'Xác nhận mật khẩu mới',
  })
  @IsString()
  @MinLength(8, { message: 'Xác nhận mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(64)
  confirmPassword!: string;
}

