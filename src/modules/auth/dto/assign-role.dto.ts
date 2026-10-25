import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../../common/constants/roles.enum.js';

export class AssignRoleDto {
  @ApiProperty({
    enum: Role,
    example: Role.INSTRUCTOR,
    description: 'Vai trò mới của người dùng (STUDENT, INSTRUCTOR, ACCOUNTANT, ADMIN)',
  })
  @IsEnum(Role, {
    message: 'Vai trò phải là một trong các giá trị: STUDENT, INSTRUCTOR, ACCOUNTANT, ADMIN',
  })
  @IsNotEmpty({ message: 'Vai trò không được để trống' })
  role: Role;
}
