<script setup lang="ts">
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { Lock, KeyRound, CheckCircle, ShieldAlert } from 'lucide-vue-next';

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
    successMessage.value = 'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...';
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
    <div class="mb-5">
      <h2 class="text-xl font-bold text-white tracking-tight">Thiết lập mật khẩu mới</h2>
      <p class="text-slate-400 text-sm mt-0.5">
        Nhập mã OTP đã nhận qua email và mật khẩu mới của bạn
      </p>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 animate-in fade-in"
    >
      <ShieldAlert class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ errorMessage }}</span>
    </div>

    <!-- Success Alert -->
    <div
      v-if="successMessage"
      class="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-start gap-2.5 animate-in fade-in"
    >
      <CheckCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ successMessage }}</span>
    </div>

    <form @submit.prevent="handleResetPassword" class="space-y-3.5">
      <!-- Email (readonly / editable) -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Email
        </label>
        <input
          v-model="email"
          type="email"
          required
          placeholder="nguyenvana@gmail.com"
          class="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-all"
        />
      </div>

      <!-- OTP -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Mã OTP (6 chữ số)
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <KeyRound class="w-4 h-4" />
          </div>
          <input
            v-model="otp"
            type="text"
            maxlength="6"
            required
            placeholder="123456"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-mono tracking-widest text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <!-- New Password -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Mật khẩu mới
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock class="w-4 h-4" />
          </div>
          <input
            v-model="newPassword"
            type="password"
            required
            placeholder="Tối thiểu 6 ký tự"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <!-- Confirm New Password -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Xác nhận mật khẩu mới
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock class="w-4 h-4" />
          </div>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Nhập lại mật khẩu mới"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="authStore.loading"
        class="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <CheckCircle v-else class="w-4 h-4" />
        <span>{{ authStore.loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu mới' }}</span>
      </button>
    </form>
  </AuthLayout>
</template>
