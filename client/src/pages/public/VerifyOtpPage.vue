<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { ShieldCheck, RotateCw, ShieldAlert, CheckCircle } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref((route.query.email as string) || authStore.pendingEmail || '');
const otp = ref('');
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Countdown timer cho OTP hết hạn (5 phút = 300s)
const expireSeconds = ref(300);
let expireTimer: any = null;

// Cooldown gửi lại OTP (60s)
const resendCooldown = ref(60);
let cooldownTimer: any = null;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const isOtpValid = computed(() => otp.value.trim().length === 6);

onMounted(() => {
  if (!email.value) {
    router.replace('/register');
    return;
  }

  // Bắt đầu đếm ngược hết hạn
  expireTimer = setInterval(() => {
    if (expireSeconds.value > 0) {
      expireSeconds.value--;
    } else {
      clearInterval(expireTimer);
    }
  }, 1000);

  // Bắt đầu đếm ngược cooldown gửi lại
  cooldownTimer = setInterval(() => {
    if (resendCooldown.value > 0) {
      resendCooldown.value--;
    } else {
      clearInterval(cooldownTimer);
    }
  }, 1000);
});

onUnmounted(() => {
  clearInterval(expireTimer);
  clearInterval(cooldownTimer);
});

const handleVerify = async () => {
  if (!isOtpValid.value) {
    errorMessage.value = 'Mã OTP phải có đúng 6 chữ số';
    return;
  }

  errorMessage.value = null;
  successMessage.value = null;

  try {
    await authStore.verifyRegisterOtp({
      email: email.value.trim().toLowerCase(),
      otp: otp.value.trim(),
    });
    successMessage.value = 'Xác thực tài khoản thành công! Đang chuyển hướng...';
    setTimeout(() => {
      router.replace('/');
    }, 1200);
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Mã OTP không chính xác hoặc đã hết hạn';
  }
};

const handleResendOtp = async () => {
  if (resendCooldown.value > 0) return;

  errorMessage.value = null;
  successMessage.value = null;

  try {
    await authStore.resendOtp({
      email: email.value.trim().toLowerCase(),
      purpose: 'REGISTER',
    });
    successMessage.value = 'Mã OTP mới đã được gửi lại vào email của bạn.';
    resendCooldown.value = 60;
    cooldownTimer = setInterval(() => {
      if (resendCooldown.value > 0) {
        resendCooldown.value--;
      } else {
        clearInterval(cooldownTimer);
      }
    }, 1000);
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Không thể gửi lại mã OTP';
  }
};
</script>

<template>
  <AuthLayout>
    <div class="text-center mb-6">
      <div class="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mx-auto flex items-center justify-center mb-3">
        <ShieldCheck class="w-6 h-6" />
      </div>
      <h2 class="text-xl font-bold text-white tracking-tight">Xác thực mã OTP</h2>
      <p class="text-slate-400 text-sm mt-1">
        Mã xác nhận 6 chữ số đã được gửi đến:
      </p>
      <div class="mt-1 font-semibold text-indigo-400 text-sm">{{ email }}</div>
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

    <form @submit.prevent="handleVerify" class="space-y-4">
      <div>
        <label class="block text-center text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
          Nhập mã 6 chữ số
        </label>
        <input
          v-model="otp"
          type="text"
          maxlength="6"
          required
          autofocus
          placeholder="••••••"
          class="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-3.5 bg-slate-950/70 border border-slate-700/80 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 transition-all"
        />
        <div class="flex items-center justify-between text-xs text-slate-400 mt-2 px-1">
          <span>Thời hạn hiệu lực mã:</span>
          <span :class="expireSeconds < 60 ? 'text-red-400 font-bold' : 'text-slate-300 font-mono'">
            {{ formatTime(expireSeconds) }}
          </span>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="authStore.loading || !isOtpValid"
        class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <ShieldCheck v-else class="w-4 h-4" />
        <span>{{ authStore.loading ? 'Đang xác thực...' : 'Kích hoạt tài khoản' }}</span>
      </button>

      <!-- Resend Button -->
      <div class="text-center pt-2">
        <button
          type="button"
          @click="handleResendOtp"
          :disabled="resendCooldown > 0 || authStore.loading"
          class="text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': authStore.loading }" />
          <span v-if="resendCooldown > 0">Gửi lại mã sau ({{ resendCooldown }}s)</span>
          <span v-else class="text-indigo-400 hover:underline">Gửi lại mã OTP</span>
        </button>
      </div>
    </form>
  </AuthLayout>
</template>
