import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/services/auth.api';
import { setAuthTokenHandlers } from '@/services/http';
import type {
  User,
  Role,
  LoginPayload,
  RegisterPayload,
  VerifyOtpPayload,
  ResendOtpPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
} from '@/types/auth';

export const useAuthStore = defineStore('auth', () => {
  // State: Access token lưu trong bộ nhớ (state), không lưu localStorage
  const accessToken = ref<string | null>(null);
  const user = ref<User | null>(null);
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);
  const pendingEmail = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'ADMIN');
  const isInstructor = computed(
    () => user.value?.role === 'INSTRUCTOR' || user.value?.role === 'ADMIN',
  );

  // Đăng ký handlers cho HTTP interceptor
  setAuthTokenHandlers(
    () => accessToken.value,
    async () => {
      try {
        const res = await authApi.refresh();
        accessToken.value = res.data.accessToken;
        return res.data.accessToken;
      } catch {
        accessToken.value = null;
        user.value = null;
        return null;
      }
    },
    () => {
      accessToken.value = null;
      user.value = null;
    },
  );

  // Actions
  async function login(payload: LoginPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.login(payload);
      accessToken.value = res.data.accessToken;
      user.value = res.data.user;
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Đăng nhập không thành công';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.register(payload);
      pendingEmail.value = payload.email;
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Đăng ký không thành công';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function verifyRegisterOtp(payload: VerifyOtpPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.verifyRegisterOtp(payload);
      accessToken.value = res.data.accessToken;
      user.value = res.data.user;
      pendingEmail.value = null;
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Xác thực OTP thất bại';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resendOtp(payload: ResendOtpPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.resendOtp(payload);
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Gửi lại OTP thất bại';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.forgotPassword(payload);
      pendingEmail.value = payload.email;
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Gửi yêu cầu thất bại';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.resetPassword(payload);
      pendingEmail.value = null;
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Đặt lại mật khẩu thất bại';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchMe() {
    loading.value = true;
    try {
      const res = await authApi.getMe();
      user.value = res.data;
      return res.data;
    } catch (err) {
      user.value = null;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function refreshSession() {
    try {
      const res = await authApi.refresh();
      accessToken.value = res.data.accessToken;
      await fetchMe();
      return true;
    } catch {
      accessToken.value = null;
      user.value = null;
      return false;
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Bỏ qua lỗi mạng khi logout
    } finally {
      accessToken.value = null;
      user.value = null;
    }
  }

  async function assignRole(userId: string, role: Role) {
    loading.value = true;
    error.value = null;
    try {
      const res = await authApi.assignRole(userId, role);
      // Nếu tự cập nhật chính mình thì cập nhật lại user
      if (user.value && user.value.id === userId) {
        user.value.role = role;
      }
      return res.data;
    } catch (err: any) {
      error.value =
        err.response?.data?.message || err.message || 'Phân quyền không thành công';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    accessToken,
    user,
    loading,
    error,
    pendingEmail,
    isAuthenticated,
    isAdmin,
    isInstructor,
    login,
    register,
    verifyRegisterOtp,
    resendOtp,
    forgotPassword,
    resetPassword,
    fetchMe,
    refreshSession,
    logout,
    assignRole,
  };
});
