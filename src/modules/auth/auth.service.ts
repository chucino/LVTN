import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as argon2 from 'argon2';
import crypto from 'node:crypto';

import { UsersService } from '../users/users.service.js';
import { MailService } from '../mail/mail.service.js';
import { Otp, OtpDocument, OtpPurpose } from './schemas/otp.schema.js';
import {
  RefreshToken,
  RefreshTokenDocument,
} from './schemas/refresh-token.schema.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyOtpDto } from './dto/verify-otp.dto.js';
import { ResendOtpDto } from './dto/resend-otp.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(Otp.name) private readonly otpModel: Model<OtpDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
  ) {}

  /**
   * Tạo mã OTP ngẫu nhiên 6 chữ số bằng crypto.randomInt an toàn
   */
  private generateOtp(): string {
    return crypto.randomInt(100000, 1000000).toString();
  }

  /**
   * Băm chuỗi (mật khẩu, refresh token, OTP) bằng argon2
   */
  private async hashValue(val: string): Promise<string> {
    return argon2.hash(val);
  }

  /**
   * Đối chiếu chuỗi với bản băm
   */
  private async verifyHash(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /**
   * Sinh Access Token JWT ngắn hạn (15 phút)
   */
  async generateAccessToken(payload: {
    sub: string;
    email: string;
    role: string;
  }): Promise<string> {
    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const expiresIn = this.configService.get<string>('JWT_ACCESS_TTL', '15m');
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as any,
    });
  }

  /**
   * Sinh Refresh Token ngẫu nhiên (UUID hoặc 64 hex bytes) và lưu bản băm vào DB
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = await this.hashValue(rawToken);

    const ttlDays = 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ttlDays);

    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    return rawToken;
  }

  /**
   * 1. ĐĂNG KÝ TÀI KHOẢN (Gửi OTP qua email)
   */
  async register(registerDto: RegisterDto) {
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new BadRequestException('Mật khẩu và xác nhận mật khẩu không khớp');
    }

    const email = registerDto.email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser && existingUser.status === UserStatus.ACTIVE) {
      throw new ConflictException('Email này đã được sử dụng trên hệ thống');
    }

    if (existingUser && existingUser.status === UserStatus.LOCKED) {
      throw new UnauthorizedException('Tài khoản liên kết với email này đã bị khóa');
    }

    const passwordHash = await this.hashValue(registerDto.password);
    const interestedCategories =
      registerDto.interestedCategories ?? registerDto.targetFields ?? [];

    // Nếu đã có bản ghi chưa kích hoạt (status = PENDING), cập nhật lại
    if (existingUser && existingUser.status === UserStatus.PENDING) {
      await this.usersService.update(existingUser.id, {
        fullName: registerDto.fullName,
        passwordHash,
        dateOfBirth: registerDto.dateOfBirth
          ? new Date(registerDto.dateOfBirth)
          : undefined,
        occupation: registerDto.occupation,
        avatar: registerDto.avatar,
        interestedCategories: interestedCategories.map((id) =>
          typeof id === 'string' && Types.ObjectId.isValid(id)
            ? new Types.ObjectId(id)
            : (id as any),
        ),
      });
    } else {
      // Tạo người dùng mới với trạng thái PENDING
      await this.usersService.create({
        fullName: registerDto.fullName,
        email,
        passwordHash,
        dateOfBirth: registerDto.dateOfBirth,
        occupation: registerDto.occupation,
        avatar: registerDto.avatar,
        interestedCategories,
        status: UserStatus.PENDING,
      });
    }

    // Sinh mã OTP và lưu vào DB (dùng codeHash & failedAttempts theo So_Do_Lop.md)
    const otp = this.generateOtp();
    const codeHash = await this.hashValue(otp);
    const ttlMinutes = this.configService.get<number>('OTP_TTL_MINUTES', 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    // Hủy các OTP trước đó của email với cùng purpose
    await this.otpModel.deleteMany({
      email,
      purpose: OtpPurpose.REGISTER,
    });

    await this.otpModel.create({
      email,
      codeHash,
      purpose: OtpPurpose.REGISTER,
      expiresAt,
      failedAttempts: 0,
      lastSentAt: new Date(),
      isUsed: false,
    });

    // Gửi email OTP
    await this.mailService.sendRegisterOtp(email, otp);

    return {
      message: 'Mã xác thực OTP đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
      email,
    };
  }

  /**
   * 2. XÁC THỰC OTP ĐĂNG KÝ (Kích hoạt tài khoản và cấp Token)
   */
  async verifyRegisterOtp(verifyOtpDto: VerifyOtpDto) {
    const email = verifyOtpDto.email.toLowerCase();
    const otpRecord = await this.otpModel.findOne({
      email,
      purpose: OtpPurpose.REGISTER,
      isUsed: false,
    });

    if (!otpRecord) {
      throw new BadRequestException('Mã OTP không tồn tại hoặc đã được sử dụng');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu gửi lại mã');
    }

    const maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
    if (otpRecord.failedAttempts >= maxAttempts) {
      throw new BadRequestException(
        'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới',
      );
    }

    const isMatch = await this.verifyHash(otpRecord.codeHash, verifyOtpDto.otp);
    if (!isMatch) {
      otpRecord.failedAttempts += 1;
      await otpRecord.save();
      const remainingAttempts = maxAttempts - otpRecord.failedAttempts;
      throw new BadRequestException(
        `Mã OTP không chính xác. Bạn còn ${remainingAttempts} lần thử`,
      );
    }

    // Đánh dấu OTP đã dùng
    otpRecord.isUsed = true;
    await otpRecord.save();

    // Kích hoạt tài khoản người dùng sang status = ACTIVE
    const user = await this.usersService.markActive(email);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin tài khoản người dùng');
    }

    // Cấp access token & refresh token
    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        interestedCategories: user.interestedCategories,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 3. GỬI LẠI MÃ OTP (Kiểm tra cooldown 60s)
   */
  async resendOtp(resendOtpDto: ResendOtpDto) {
    const email = resendOtpDto.email.toLowerCase();
    const cooldownSeconds = this.configService.get<number>(
      'OTP_RESEND_COOLDOWN_SECONDS',
      60,
    );

    const latestOtp = await this.otpModel
      .findOne({ email, purpose: resendOtpDto.purpose })
      .sort({ createdAt: -1 });

    if (latestOtp) {
      const timeSinceLastSent =
        (Date.now() - new Date(latestOtp.lastSentAt).getTime()) / 1000;
      if (timeSinceLastSent < cooldownSeconds) {
        const waitMore = Math.ceil(cooldownSeconds - timeSinceLastSent);
        throw new BadRequestException(
          `Vui lòng đợi thêm ${waitMore} giây trước khi yêu cầu gửi lại OTP`,
        );
      }
    }

    const otp = this.generateOtp();
    const codeHash = await this.hashValue(otp);
    const ttlMinutes = this.configService.get<number>('OTP_TTL_MINUTES', 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.otpModel.deleteMany({
      email,
      purpose: resendOtpDto.purpose,
    });

    await this.otpModel.create({
      email,
      codeHash,
      purpose: resendOtpDto.purpose,
      expiresAt,
      failedAttempts: 0,
      lastSentAt: new Date(),
      isUsed: false,
    });

    if (resendOtpDto.purpose === OtpPurpose.REGISTER) {
      await this.mailService.sendRegisterOtp(email, otp);
    } else {
      await this.mailService.sendForgotPasswordOtp(email, otp);
    }

    return {
      message: 'Mã OTP mới đã được gửi thành công đến email của bạn',
      email,
    };
  }

  /**
   * 4. ĐĂNG NHẬP (Cấp Access Token & Refresh Token)
   */
  async login(loginDto: LoginDto) {
    const email = loginDto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    if (user.status === UserStatus.PENDING) {
      throw new UnauthorizedException(
        'Tài khoản chưa được xác thực email. Vui lòng xác thực mã OTP để tiếp tục',
      );
    }

    if (user.status === UserStatus.LOCKED) {
      throw new UnauthorizedException(
        'Tài khoản này đã bị khóa. Vui lòng liên hệ quản trị viên',
      );
    }

    const isPasswordValid = await this.verifyHash(
      user.passwordHash,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const accessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        occupation: user.occupation,
        interestedCategories: user.interestedCategories,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * 5. LÀM MỚI TOKEN (Xoay vòng Refresh Token & Phát hiện tái sử dụng trái phép)
   */
  async refresh(rawRefreshToken: string) {
    if (!rawRefreshToken) {
      throw new UnauthorizedException('Không tìm thấy refresh token trong cookie');
    }

    // Tìm tất cả token chưa hết hạn để đối chiếu hash
    const activeTokens = await this.refreshTokenModel.find({
      expiresAt: { $gt: new Date() },
    });

    let matchedTokenRecord: RefreshTokenDocument | null = null;
    for (const record of activeTokens) {
      if (await this.verifyHash(record.tokenHash, rawRefreshToken)) {
        matchedTokenRecord = record;
        break;
      }
    }

    if (!matchedTokenRecord) {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }

    // Cơ chế an toàn (Reuse detection): Nếu token này đã bị thu hồi trước đó nhưng lại bị gửi lên tiếp
    // chứng tỏ token có thể đã bị rò rỉ -> Thu hồi toàn bộ session của user này!
    if (matchedTokenRecord.isRevoked) {
      await this.refreshTokenModel.updateMany(
        { userId: matchedTokenRecord.userId },
        { isRevoked: true },
      );
      this.logger.warn(
        `Phát hiện nghi vấn rò rỉ token cho userId: ${matchedTokenRecord.userId}. Đã thu hồi toàn bộ token của người dùng.`,
      );
      throw new UnauthorizedException(
        'Phát hiện hành vi token không an toàn. Tất cả phiên đăng nhập đã bị vô hiệu hóa',
      );
    }

    // Thu hồi token cũ (Xoay vòng token)
    matchedTokenRecord.isRevoked = true;
    await matchedTokenRecord.save();

    // Lấy thông tin người dùng
    const user = await this.usersService.findById(
      matchedTokenRecord.userId.toString(),
    );
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Tài khoản người dùng không còn khả dụng hoặc đã bị khóa');
    }

    // Cấp bộ token mới
    const newAccessToken = await this.generateAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * 6. ĐĂNG XUẤT (Thu hồi Refresh Token)
   */
  async logout(rawRefreshToken?: string) {
    if (!rawRefreshToken) {
      return { message: 'Đăng xuất thành công' };
    }

    const tokens = await this.refreshTokenModel.find({ isRevoked: false });
    for (const record of tokens) {
      if (await this.verifyHash(record.tokenHash, rawRefreshToken)) {
        record.isRevoked = true;
        await record.save();
        break;
      }
    }

    return { message: 'Đăng xuất thành công' };
  }

  /**
   * 7. QUÊN MẬT KHẨU (Gửi OTP, chống rò rỉ sự tồn tại của email)
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const email = forgotPasswordDto.email.toLowerCase();
    const user = await this.usersService.findByEmail(email);

    // Luôn trả về cùng một thông báo dù email có tồn tại hay không (chống dò email)
    const successResponse = {
      message:
        'Nếu email tồn tại trên hệ thống, mã xác thực OTP đã được gửi đến hộp thư của bạn.',
    };

    if (!user || user.status !== UserStatus.ACTIVE) {
      return successResponse;
    }

    const otp = this.generateOtp();
    const codeHash = await this.hashValue(otp);
    const ttlMinutes = this.configService.get<number>('OTP_TTL_MINUTES', 5);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.otpModel.deleteMany({
      email,
      purpose: OtpPurpose.RESET_PASSWORD,
    });

    await this.otpModel.create({
      email,
      codeHash,
      purpose: OtpPurpose.RESET_PASSWORD,
      expiresAt,
      failedAttempts: 0,
      lastSentAt: new Date(),
      isUsed: false,
    });

    try {
      await this.mailService.sendForgotPasswordOtp(email, otp);
    } catch (err) {
      this.logger.error('Lỗi khi gửi mail quên mật khẩu:', err);
    }

    return successResponse;
  }

  /**
   * 8. ĐẶT LẠI MẬT KHẨU (Xác thực OTP và cập nhật mật khẩu mới)
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    if (resetPasswordDto.newPassword !== resetPasswordDto.confirmPassword) {
      throw new BadRequestException('Mật khẩu mới và xác nhận mật khẩu không khớp');
    }

    const email = resetPasswordDto.email.toLowerCase();
    const otpRecord = await this.otpModel.findOne({
      email,
      purpose: OtpPurpose.RESET_PASSWORD,
      isUsed: false,
    });

    if (!otpRecord) {
      throw new BadRequestException('Mã OTP không hợp lệ hoặc đã được sử dụng');
    }

    if (new Date() > otpRecord.expiresAt) {
      throw new BadRequestException('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    const maxAttempts = this.configService.get<number>('OTP_MAX_ATTEMPTS', 5);
    if (otpRecord.failedAttempts >= maxAttempts) {
      throw new BadRequestException(
        'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng yêu cầu mã mới',
      );
    }

    const isMatch = await this.verifyHash(otpRecord.codeHash, resetPasswordDto.otp);
    if (!isMatch) {
      otpRecord.failedAttempts += 1;
      await otpRecord.save();
      const remaining = maxAttempts - otpRecord.failedAttempts;
      throw new BadRequestException(
        `Mã OTP không chính xác. Bạn còn ${remaining} lần thử`,
      );
    }

    otpRecord.isUsed = true;
    await otpRecord.save();

    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    const newPasswordHash = await this.hashValue(resetPasswordDto.newPassword);
    await this.usersService.updatePassword(user.id, newPasswordHash);

    // Thu hồi toàn bộ refresh token hiện có của user sau khi đổi mật khẩu
    await this.refreshTokenModel.updateMany(
      { userId: user._id },
      { isRevoked: true },
    );

    return {
      message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.',
    };
  }

  /**
   * 9. LẤY THÔNG TIN NGƯỜI DÙNG ĐANG ĐĂNG NHẬP
   */
  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      dateOfBirth: user.dateOfBirth,
      occupation: user.occupation,
      interestedCategories: user.interestedCategories,
      createdAt: (user as any).createdAt,
    };
  }

  /**
   * 10. ADMIN PHÂN QUYỀN CHO TÀI KHOẢN (Assign Role)
   */
  async assignRole(currentAdminId: string, targetUserId: string, newRole: Role) {
    if (currentAdminId === targetUserId && newRole !== Role.ADMIN) {
      throw new BadRequestException(
        'Quản trị viên không thể tự hạ quyền ADMIN của chính mình nhằm đảm bảo an toàn hệ thống.',
      );
    }

    const targetUser = await this.usersService.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy tài khoản người dùng cần phân quyền');
    }

    const updatedUser = await this.usersService.updateRole(targetUserId, newRole);
    if (!updatedUser) {
      throw new BadRequestException('Không thể cập nhật vai trò cho người dùng');
    }

    // Thu hồi toàn bộ refresh token hiện có của tài khoản được phân quyền
    // để buộc cập nhật payload JWT mới khi đăng nhập/làm mới token
    await this.refreshTokenModel.updateMany(
      { userId: updatedUser._id },
      { isRevoked: true },
    );

    return {
      message: `Phân quyền thành công cho tài khoản sang vai trò ${newRole}`,
      user: {
        id: updatedUser.id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        status: updatedUser.status,
        avatar: updatedUser.avatar,
        dateOfBirth: updatedUser.dateOfBirth,
        occupation: updatedUser.occupation,
        interestedCategories: updatedUser.interestedCategories,
      },
    };
  }
}
