import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('SMTP_HOST', 'smtp.gmail.com');
    const port = this.configService.get<number>('SMTP_PORT', 465);
    const secure = this.configService.get<boolean>('SMTP_SECURE', true);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async sendRegisterOtp(email: string, otp: string): Promise<boolean> {
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      '"NextCode Education" <no-reply@nextcode.vn>',
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">NextCode Education</h2>
        <p>Xin chào,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>NextCode</strong>. Dưới đây là mã OTP để hoàn tất quá trình xác thực tài khoản của bạn:</p>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1f2937;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Mã OTP có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này cho bất kỳ ai.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Đây là email tự động từ hệ thống NextCode. Vui lòng không phản hồi thư này.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: '[NextCode] Mã xác thực OTP đăng ký tài khoản',
        html: htmlContent,
      });
      this.logger.log(`Email OTP đăng ký đã được gửi thành công tới: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Lỗi gửi email OTP đăng ký tới ${email}:`, error);
      // Không để lỗi mail làm crash server, ném exception phù hợp
      throw new Error('Không thể gửi email xác thực OTP. Vui lòng kiểm tra lại cấu hình email.');
    }
  }

  async sendForgotPasswordOtp(email: string, otp: string): Promise<boolean> {
    const mailFrom = this.configService.get<string>(
      'MAIL_FROM',
      '"NextCode Education" <no-reply@nextcode.vn>',
    );

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">NextCode Education</h2>
        <p>Xin chào,</p>
        <p>Hệ thống nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết với email này. Dưới đây là mã OTP xác thực:</p>
        <div style="background-color: #fef2f2; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #dc2626;">${otp}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Mã OTP có hiệu lực trong vòng <strong>5 phút</strong>. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">Đây là email tự động từ hệ thống NextCode. Vui lòng không phản hồi thư này.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: mailFrom,
        to: email,
        subject: '[NextCode] Mã xác thực OTP đặt lại mật khẩu',
        html: htmlContent,
      });
      this.logger.log(`Email OTP đặt lại mật khẩu đã được gửi thành công tới: ${email}`);
      return true;
    } catch (error) {
      this.logger.error(`Lỗi gửi email OTP đặt lại mật khẩu tới ${email}:`, error);
      throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.');
    }
  }
}
