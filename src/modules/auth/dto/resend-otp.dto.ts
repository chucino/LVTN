import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { OtpPurpose } from '../schemas/otp.schema.js';

export class ResendOtpDto {
  @ApiProperty({ example: 'nguyenvana@gmail.com', description: 'Email cần gửi lại OTP' })
  @IsEmail({}, { message: 'Định dạng email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: OtpPurpose.REGISTER,
    enum: OtpPurpose,
    description: 'Mục đích OTP: REGISTER hoặc RESET_PASSWORD',
  })
  @IsEnum(OtpPurpose, { message: 'Mục đích OTP phải là REGISTER hoặc RESET_PASSWORD' })
  purpose: OtpPurpose;
}
