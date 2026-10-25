import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email tài khoản' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP nhận qua email' })
  @IsString({ message: 'OTP phải là chuỗi' })
  @Length(6, 6, { message: 'Mã OTP phải có đúng 6 chữ số' })
  otp: string;

  @ApiProperty({ example: 'MatkhauMoi@123', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;

  @ApiProperty({ example: 'MatkhauMoi@123', description: 'Xác nhận lại mật khẩu mới' })
  @IsString({ message: 'Xác nhận mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Xác nhận mật khẩu mới không được để trống' })
  confirmPassword: string;
}
