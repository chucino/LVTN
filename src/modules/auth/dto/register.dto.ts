import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên của người dùng' })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email đăng ký' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'Matkhau@123', description: 'Mật khẩu tối thiểu 6 ký tự' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Matkhau@123', description: 'Xác nhận lại mật khẩu' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu không được để trống' })
  confirmPassword: string;

  @ApiPropertyOptional({ example: '2001-05-15', description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải đúng định dạng ngày YYYY-MM-DD' })
  dateOfBirth?: string;

  @ApiPropertyOptional({ example: 'Sinh viên', description: 'Nghề nghiệp hiện tại' })
  @IsOptional()
  @IsString({ message: 'Nghề nghiệp phải là chuỗi ký tự' })
  occupation?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', description: 'Đường dẫn ảnh đại diện' })
  @IsOptional()
  @IsString({ message: 'Avatar phải là chuỗi đường dẫn' })
  avatar?: string;

  @ApiPropertyOptional({
    example: ['6708df1234567890abcdef12', '6708df1234567890abcdef34'],
    description: 'Danh sách ID các lĩnh vực muốn học (tham chiếu Category)',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Lĩnh vực muốn học phải là một danh sách' })
  @IsString({ each: true, message: 'Từng ID lĩnh vực phải là chuỗi ký tự' })
  interestedCategories?: string[];

  // Giữ lại targetFields để tương thích ngược nếu client gửi
  @ApiPropertyOptional({
    description: 'Bí danh cũ của interestedCategories (tương thích ngược)',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  targetFields?: string[];
}
