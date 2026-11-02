import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { AssignRoleDto } from './dto/assign-role.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { Role } from '../../common/constants/roles.enum.js';
import {
  CurrentUser,
  type CurrentUserData,
} from '../../common/decorators/current-user.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';

@ApiTags('Authentication & Authorization')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Xác định cổng client (5173, 5174, 5175...) để cô lập cookie refreshToken theo từng cổng
   * khi mở nhiều cổng trên cùng một trình duyệt Chrome.
   */
  private resolveClientPort(req: Request): string | null {
    const headerPort = req.headers['x-client-port'];
    const rawHeaderPort = Array.isArray(headerPort) ? headerPort[0] : headerPort;
    if (typeof rawHeaderPort === 'string' && /^\d{2,5}$/.test(rawHeaderPort.trim())) {
      return rawHeaderPort.trim();
    }

    const originOrReferer = req.headers.origin || req.headers.referer;
    if (typeof originOrReferer === 'string') {
      try {
        const parsed = new URL(originOrReferer);
        if (/^\d{2,5}$/.test(parsed.port)) {
          return parsed.port;
        }
      } catch {
        // Ignore malformed Origin/Referer
      }
    }

    return null;
  }

  private getRefreshTokenCookieName(req: Request): string {
    const port = this.resolveClientPort(req);
    return port ? `refreshToken_${port}` : 'refreshToken';
  }

  private getRefreshTokenFromCookies(req: Request): string | undefined {
    const cookieName = this.getRefreshTokenCookieName(req);
    return req.cookies?.[cookieName] ?? req.cookies?.refreshToken;
  }

  /**
   * Helper thiết lập cookie httpOnly cho refresh token (cô lập theo cổng client nếu có)
   */
  private setRefreshTokenCookie(
    req: Request,
    res: Response,
    refreshToken: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieName = this.getRefreshTokenCookieName(req);
    res.cookie(cookieName, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 ngày
    });
  }

  /**
   * Helper xóa cookie refresh token của cổng hiện tại
   */
  private clearRefreshTokenCookie(req: Request, res: Response) {
    const cookieName = this.getRefreshTokenCookieName(req);
    res.clearCookie(cookieName, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '1. Đăng ký tài khoản mới (Gửi mã OTP về email)' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, mã OTP đã gửi' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc mật khẩu không khớp' })
  @ApiResponse({ status: 409, description: 'Email đã được đăng ký và kích hoạt' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('verify-register-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '2. Xác thực OTP đăng ký (Kích hoạt tài khoản và nhận Token)' })
  @ApiResponse({ status: 200, description: 'Xác thực OTP thành công, trả về access token và set cookie refresh token' })
  @ApiResponse({ status: 400, description: 'Mã OTP sai hoặc đã hết hạn' })
  async verifyRegisterOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyRegisterOtp(verifyOtpDto);
    this.setRefreshTokenCookie(req, res, result.refreshToken);

    return {
      message: 'Kích hoạt tài khoản thành công',
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '3. Gửi lại mã OTP (Có cooldown 60 giây)' })
  @ApiResponse({ status: 200, description: 'Gửi lại OTP thành công' })
  @ApiResponse({ status: 400, description: 'Chưa hết thời gian chờ cooldown' })
  async resendOtp(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOtp(resendOtpDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '4. Đăng nhập hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về accessToken và cookie refreshToken' })
  @ApiResponse({ status: 401, description: 'Email hoặc mật khẩu không chính xác hoặc chưa xác thực email' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(req, res, result.refreshToken);

    return {
      message: 'Đăng nhập thành công',
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: '5. Làm mới Access Token (Xoay vòng Refresh Token trong Cookie)' })
  @ApiResponse({ status: 200, description: 'Cấp access token mới thành công' })
  @ApiResponse({ status: 401, description: 'Refresh token không hợp lệ hoặc đã hết hạn' })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = this.getRefreshTokenFromCookies(req);
    const result = await this.authService.refresh(rawRefreshToken ?? '');
    this.setRefreshTokenCookie(req, res, result.refreshToken);

    return {
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth()
  @ApiOperation({ summary: '6. Đăng xuất (Thu hồi refresh token và xóa Cookie)' })
  @ApiResponse({ status: 200, description: 'Đăng xuất thành công' })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawRefreshToken = this.getRefreshTokenFromCookies(req);
    await this.authService.logout(rawRefreshToken);
    this.clearRefreshTokenCookie(req, res);

    return {
      message: 'Đăng xuất thành công',
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '7. Quên mật khẩu (Gửi OTP đặt lại mật khẩu qua email)' })
  @ApiResponse({ status: 200, description: 'Thông báo gửi OTP (chống dò email)' })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '8. Đặt lại mật khẩu mới (Xác thực với OTP)' })
  @ApiResponse({ status: 200, description: 'Đặt lại mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mã OTP sai, hết hạn hoặc mật khẩu không khớp' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '9. Lấy thông tin cá nhân của tài khoản hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản hiện tại' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc token không hợp lệ' })
  async getMe(@CurrentUser() currentUser: CurrentUserData) {
    return this.authService.getMe(currentUser.userId);
  }

  @Patch('users/:id/role')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '10. Phân quyền tài khoản (Chỉ ADMIN được quyền thực hiện)' })
  @ApiParam({
    name: 'id',
    description: 'ID người dùng cần phân quyền',
    example: '6708df1234567890abcdef12',
  })
  @ApiResponse({ status: 200, description: 'Phân quyền thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ hoặc Admin tự hạ quyền chính mình' })
  @ApiResponse({ status: 403, description: 'Từ chối truy cập (yêu cầu quyền ADMIN)' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  async assignRole(
    @Param('id') targetUserId: string,
    @Body() assignRoleDto: AssignRoleDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.authService.assignRole(
      currentUser.userId,
      targetUserId,
      assignRoleDto.role,
    );
  }

  @Get('admin-test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '11. Endpoint kiểm tra phân quyền - Chỉ dành cho ADMIN' })
  @ApiResponse({ status: 200, description: 'Truy cập thành công với quyền ADMIN' })
  @ApiResponse({ status: 403, description: 'Từ chối truy cập (thiếu quyền ADMIN)' })
  async testAdminRole(@CurrentUser() currentUser: CurrentUserData) {
    return {
      message: 'Chào mừng Admin! Bạn có toàn quyền quản trị hệ thống.',
      user: currentUser,
    };
  }

  @Get('instructor-test')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles(Role.INSTRUCTOR, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '12. Endpoint kiểm tra phân quyền - Dành cho GIẢNG VIÊN và ADMIN' })
  @ApiResponse({ status: 200, description: 'Truy cập thành công với quyền INSTRUCTOR/ADMIN' })
  @ApiResponse({ status: 403, description: 'Từ chối truy cập (thiếu quyền)' })
  async testInstructorRole(@CurrentUser() currentUser: CurrentUserData) {
    return {
      message: 'Chào mừng Giảng viên! Bạn có thể quản lý khóa học của mình.',
      user: currentUser,
    };
  }
}
