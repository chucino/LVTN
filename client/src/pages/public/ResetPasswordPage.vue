<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { CheckCircle, ShieldAlert } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref((route.query.email as string) || authStore.pendingEmail || '');
const otp = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const handleResetPassword = async () => {
  if (!email.value || !otp.value || !newPassword.value || !confirmPassword.value) {
    errorMessage.value = 'Vui lòng điền đầy đủ các thông tin';
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu mới và xác nhận mật khẩu không khớp';
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Mật khẩu phải có tối thiểu 6 ký tự';
    return;
  }

  errorMessage.value = null;
  successMessage.value = null;

  try {
    await authStore.resetPassword({
      email: email.value.trim().toLowerCase(),
      otp: otp.value.trim(),
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    successMessage.value = 'Đặt lại mật khẩu thành công. Đang chuyển về trang đăng nhập...';
    setTimeout(() => {
      router.push('/login');
    }, 1500);
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Đặt lại mật khẩu không thành công';
  }
};
</script>

<template>
  <AuthLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-normal text-ink">Thiết lập mật khẩu mới</h2>
      <p class="mt-1 text-base text-muted">
        Nhập mã OTP đã nhận qua email và mật khẩu mới cho tài khoản của bạn.
      </p>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="mb-4 flex items-start gap-2.5 bg-brand-surface p-4 text-sm text-ink"
    >
      <ShieldAlert class="mt-0.5 h-5 w-5 shrink-0 text-brand-soft" />
      <span>{{ errorMessage }}</span>
    </div>

    <div
      v-if="successMessage"
      role="status"
      class="mb-4 flex items-start gap-2.5 bg-surface-2 p-4 text-sm text-ink"
    >
      <CheckCircle class="mt-0.5 h-5 w-5 shrink-0 text-ink" />
      <span>{{ successMessage }}</span>
    </div>

    <form class="space-y-4" @submit.prevent="handleResetPassword">
      <div>
        <label for="reset-email" class="mb-1.5 block text-sm font-medium text-ink">
          Email tài khoản
        </label>
        <input
          id="reset-email"
          v-model="email"
          type="email"
          required
          placeholder="hocvien@nextcode.vn"
          class="manage-input"
        />
      </div>

      <div>
        <label for="reset-otp" class="mb-1.5 block text-sm font-medium text-ink">
          Mã OTP (6 chữ số)
        </label>
        <input
          id="reset-otp"
          v-model="otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          required
          placeholder="123456"
          class="manage-input tracking-widest tabular-nums"
        />
      </div>

      <div>
        <label for="reset-password" class="mb-1.5 block text-sm font-medium text-ink">
          Mật khẩu mới
        </label>
        <input
          id="reset-password"
          v-model="newPassword"
          type="password"
          required
          aria-describedby="reset-pw-hint"
          placeholder="Tối thiểu 6 ký tự"
          class="manage-input"
        />
        <span id="reset-pw-hint" class="mt-1 block text-xs text-muted">Tối thiểu 6 ký tự.</span>
      </div>

      <div>
        <label for="reset-confirm" class="mb-1.5 block text-sm font-medium text-ink">
          Xác nhận mật khẩu mới
        </label>
        <input
          id="reset-confirm"
          v-model="confirmPassword"
          type="password"
          required
          placeholder="Nhập lại mật khẩu mới"
          class="manage-input"
        />
      </div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="manage-button-primary mt-4 flex w-full items-center justify-center gap-2"
      >
        <span>{{ authStore.loading ? 'Đang cập nhật...' : 'Lưu mật khẩu mới' }}</span>
      </button>
    </form>
  </AuthLayout>
</template>
