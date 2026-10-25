import { http } from './http';
import type {
  ApiResponse,
  LoginPayload,
  LoginResponse,
  RegisterPayload,
  RegisterResponse,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  MessageResponse,
  RefreshResponse,
  User,
  Role,
} from '@/types/auth';

export const authApi = {
  // 1. Đăng ký tài khoản
  async register(payload: RegisterPayload): Promise<ApiResponse<RegisterResponse>> {
    const res = await http.post<ApiResponse<RegisterResponse>>('/auth/register', payload);
    return res.data;
  },

  // 2. Xác thực OTP đăng ký
  async verifyRegisterOtp(payload: VerifyOtpPayload): Promise<ApiResponse<LoginResponse>> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/verify-register-otp', payload);
    return res.data;
  },

  // 3. Gửi lại OTP
  async resendOtp(payload: ResendOtpPayload): Promise<ApiResponse<MessageResponse>> {
    const res = await http.post<ApiResponse<MessageResponse>>('/auth/resend-otp', payload);
    return res.data;
  },

  // 4. Đăng nhập
  async login(payload: LoginPayload): Promise<ApiResponse<LoginResponse>> {
    const res = await http.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    return res.data;
  },

  // 5. Làm mới Access Token qua Cookie
  async refresh(): Promise<ApiResponse<RefreshResponse>> {
    const res = await http.post<ApiResponse<RefreshResponse>>('/auth/refresh');
    return res.data;
  },

  // 6. Đăng xuất
  async logout(): Promise<ApiResponse<MessageResponse>> {
    const res = await http.post<ApiResponse<MessageResponse>>('/auth/logout');
    return res.data;
  },

  // 7. Quên mật khẩu
  async forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResponse<MessageResponse>> {
    const res = await http.post<ApiResponse<MessageResponse>>('/auth/forgot-password', payload);
    return res.data;
  },

  // 8. Đặt lại mật khẩu với OTP
  async resetPassword(payload: ResetPasswordPayload): Promise<ApiResponse<MessageResponse>> {
    const res = await http.post<ApiResponse<MessageResponse>>('/auth/reset-password', payload);
    return res.data;
  },

  // 9. Lấy thông tin cá nhân hiện tại
  async getMe(): Promise<ApiResponse<User>> {
    const res = await http.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },

  // 10. Phân quyền tài khoản (Admin)
  async assignRole(userId: string, role: Role): Promise<ApiResponse<MessageResponse>> {
    const res = await http.patch<ApiResponse<MessageResponse>>(`/auth/users/${userId}/role`, {
      role,
    });
    return res.data;
  },

  // 11. Kiểm tra quyền Admin
  async testAdminRole(): Promise<ApiResponse<any>> {
    const res = await http.get<ApiResponse<any>>('/auth/admin-test');
    return res.data;
  },

  // 12. Kiểm tra quyền Giảng viên & Admin
  async testInstructorRole(): Promise<ApiResponse<any>> {
    const res = await http.get<ApiResponse<any>>('/auth/instructor-test');
    return res.data;
  },
};
