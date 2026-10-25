import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../../common/constants/roles.enum.js';
import { UserStatus } from '../../common/constants/user-status.enum.js';

describe('AuthService (Unit Tests)', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockMailService: any;
  let mockJwtService: any;
  let mockConfigService: any;
  let mockOtpModel: any;
  let mockRefreshTokenModel: any;

  beforeEach(() => {
    mockUsersService = {
      create: vi.fn(),
      findByEmail: vi.fn(),
      findById: vi.fn(),
      markActive: vi.fn(),
      updatePassword: vi.fn(),
      updateRole: vi.fn(),
      update: vi.fn(),
    };

    mockMailService = {
      sendRegisterOtp: vi.fn().mockResolvedValue(true),
      sendForgotPasswordOtp: vi.fn().mockResolvedValue(true),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock_jwt_access_token'),
      verifyAsync: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn((key: string, defaultVal?: any) => {
        const configMap: Record<string, any> = {
          JWT_ACCESS_SECRET: 'test_access_secret',
          JWT_ACCESS_TTL: '15m',
          OTP_TTL_MINUTES: 5,
          OTP_MAX_ATTEMPTS: 5,
          OTP_RESEND_COOLDOWN_SECONDS: 60,
        };
        return configMap[key] ?? defaultVal;
      }),
    };

    mockOtpModel = {
      findOne: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    };

    mockRefreshTokenModel = {
      create: vi.fn(),
      find: vi.fn(),
      updateMany: vi.fn(),
    };

    authService = new AuthService(
      mockUsersService,
      mockMailService,
      mockJwtService,
      mockConfigService,
      mockOtpModel as any,
      mockRefreshTokenModel as any,
    );
  });

  it('nên throw BadRequestException nếu password và confirmPassword không khớp khi đăng ký', async () => {
    await expect(
      authService.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPassword',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên throw ConflictException nếu email đã tồn tại và đã được kích hoạt (status ACTIVE)', async () => {
    mockUsersService.findByEmail.mockResolvedValue({
      id: 'user_123',
      email: 'test@example.com',
      status: UserStatus.ACTIVE,
    });

    await expect(
      authService.register({
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('nên tạo người dùng pending, tạo OTP và gửi email khi đăng ký hợp lệ', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockResolvedValue({
      _id: 'user_123',
      id: 'user_123',
      email: 'test@example.com',
    });

    const result = await authService.register({
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
    });

    expect(result.message).toContain('Mã xác thực OTP đã được gửi');
    expect(mockUsersService.create).toHaveBeenCalled();
    expect(mockOtpModel.create).toHaveBeenCalled();
    expect(mockMailService.sendRegisterOtp).toHaveBeenCalled();
  });

  it('nên throw BadRequestException nếu Admin tự hạ quyền ADMIN của chính mình', async () => {
    await expect(
      authService.assignRole('admin_123', 'admin_123', Role.STUDENT),
    ).rejects.toThrow(BadRequestException);
  });

  it('nên throw NotFoundException nếu không tìm thấy user cần phân quyền', async () => {
    mockUsersService.findById.mockResolvedValue(null);

    await expect(
      authService.assignRole('admin_123', 'user_not_found', Role.INSTRUCTOR),
    ).rejects.toThrow(NotFoundException);
  });

  it('nên phân quyền thành công và thu hồi refresh token của user được phân quyền', async () => {
    mockUsersService.findById.mockResolvedValue({
      _id: 'user_target',
      id: 'user_target',
      email: 'target@example.com',
      role: Role.STUDENT,
    });

    mockUsersService.updateRole.mockResolvedValue({
      _id: 'user_target',
      id: 'user_target',
      fullName: 'Target User',
      email: 'target@example.com',
      role: Role.INSTRUCTOR,
      status: UserStatus.ACTIVE,
      avatar: null,
      dateOfBirth: null,
      occupation: 'Giảng viên',
      interestedCategories: [],
    });

    const result = await authService.assignRole(
      'admin_123',
      'user_target',
      Role.INSTRUCTOR,
    );

    expect(result.message).toContain('Phân quyền thành công');
    expect(result.user.role).toBe(Role.INSTRUCTOR);
    expect(mockRefreshTokenModel.updateMany).toHaveBeenCalledWith(
      { userId: 'user_target' },
      { isRevoked: true },
    );
  });
});
