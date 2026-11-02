import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Role } from '../../../common/constants/roles.enum.js';
import { UserStatus } from '../../../common/constants/user-status.enum.js';

export enum ManageUserSort {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  NAME_ASC = 'name_asc',
}

export class ManageUserQueryDto {
  @ApiPropertyOptional({ example: 'nguyen', maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  keyword?: string;

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ enum: UserStatus })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiPropertyOptional({ enum: ManageUserSort, default: ManageUserSort.NEWEST })
  @IsOptional()
  @IsEnum(ManageUserSort)
  sort = ManageUserSort.NEWEST;

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

export class CreateManageUserDto {
  @ApiProperty({ example: 'Trần Minh Khoa', minLength: 2, maxLength: 100 })
  @IsString()
  @Length(2, 100)
  fullName!: string;

  @ApiProperty({ example: 'khoa.instructor@nextcode.vn' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @ApiProperty({ example: 'Instructor@123', minLength: 8, maxLength: 64 })
  @IsString()
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @MaxLength(64)
  password!: string;

  @ApiProperty({ enum: Role, example: Role.INSTRUCTOR })
  @IsEnum(Role)
  role!: Role;

  @ApiPropertyOptional({ example: 'Giảng viên Backend', maxLength: 150 })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  occupation?: string;

  @ApiPropertyOptional({ example: '1995-05-20' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}

export class UpdateManageUserRoleDto {
  @ApiProperty({ enum: Role, example: Role.INSTRUCTOR })
  @IsEnum(Role, { message: 'Vai trò không hợp lệ' })
  role!: Role;
}

export class UpdateManageUserStatusDto {
  @ApiProperty({
    enum: [UserStatus.ACTIVE, UserStatus.LOCKED],
    example: UserStatus.LOCKED,
  })
  @IsIn([UserStatus.ACTIVE, UserStatus.LOCKED], {
    message: 'Trạng thái chỉ nhận ACTIVE hoặc LOCKED',
  })
  status!: UserStatus.ACTIVE | UserStatus.LOCKED;
}

export class ManageUserIdParamsDto {
  @ApiProperty({ example: '6650c1f6f2f4f6e4c8bfe123' })
  @IsMongoId({ message: 'ID người dùng không hợp lệ' })
  id!: string;
}

