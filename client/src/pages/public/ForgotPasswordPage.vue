<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { KeyRound, Mail, ArrowLeft, ShieldAlert } from 'lucide-vue-next';

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
        class="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors mb-4"
      >
        <ArrowLeft class="w-3.5 h-3.5" />
        <span>Quay lại đăng nhập</span>
      </router-link>
      <h2 class="text-xl font-bold text-white tracking-tight">Quên mật khẩu?</h2>
      <p class="text-slate-400 text-sm mt-0.5">
        Đừng lo lắng! Nhập email của bạn để nhận mã OTP thiết lập mật khẩu mới.
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

    <form @submit.prevent="handleForgotPassword" class="space-y-4">
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Email tài khoản
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Mail class="w-4 h-4" />
          </div>
          <input
            v-model="email"
            type="email"
            required
            placeholder="nguyenvana@gmail.com"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <KeyRound v-else class="w-4 h-4" />
        <span>{{ authStore.loading ? 'Đang gửi mã...' : 'Nhận mã OTP qua email' }}</span>
      </button>
    </form>
  </AuthLayout>
</template>
