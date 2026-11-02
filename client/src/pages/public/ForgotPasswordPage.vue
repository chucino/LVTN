<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { ArrowLeft, ShieldAlert } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const errorMessage = ref<string | null>(null);

const handleForgotPassword = async () => {
  if (!email.value) {
    errorMessage.value = 'Vui lòng nhập địa chỉ email của bạn';
    return;
  }

  errorMessage.value = null;
  try {
    await authStore.forgotPassword({
      email: email.value.trim().toLowerCase(),
    });
    router.push({
      path: '/reset-password',
      query: { email: email.value.trim().toLowerCase() },
    });
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Không thể xử lý yêu cầu';
  }
};
</script>

<template>
  <AuthLayout>
    <div class="mb-6">
      <router-link
        to="/login"
        class="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft class="h-4 w-4" />
        <span>Quay lại đăng nhập</span>
      </router-link>
      <h2 class="text-2xl font-normal text-ink">Khôi phục mật khẩu</h2>
      <p class="mt-1 text-base text-muted">
        Nhập địa chỉ email của bạn để nhận mã OTP thiết lập lại mật khẩu.
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

    <form class="space-y-4" @submit.prevent="handleForgotPassword">
      <div>
        <label for="forgot-email" class="mb-1.5 block text-sm font-medium text-ink">
          Email tài khoản
        </label>
        <input
          id="forgot-email"
          v-model="email"
          type="email"
          required
          placeholder="hocvien@nextcode.vn"
          class="manage-input"
        />
      </div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="manage-button-primary mt-2 flex w-full items-center justify-center gap-2"
      >
        <span>{{ authStore.loading ? 'Đang gửi mã...' : 'Gửi mã OTP qua email' }}</span>
      </button>
    </form>
  </AuthLayout>
</template>
