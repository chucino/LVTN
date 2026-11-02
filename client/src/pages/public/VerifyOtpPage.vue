<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { RotateCw, ShieldAlert, CheckCircle } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref((route.query.email as string) || authStore.pendingEmail || '');
const otp = ref('');
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const expireSeconds = ref(300);
let expireTimer: any = null;

const resendCooldown = ref(60);
let cooldownTimer: any = null;

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const mm = m < 10 ? `0${m}` : `${m}`;
  const ss = s < 10 ? `0${s}` : `${s}`;
  return `${mm}:${ss}`;
};

const isOtpValid = computed(() => otp.value.trim().length === 6);

onMounted(() => {
  if (!email.value) {
    router.replace('/register');
    return;
  }

  expireTimer = setInterval(() => {
    if (expireSeconds.value > 0) {
      expireSeconds.value--;
    } else {
      clearInterval(expireTimer);
    }
  }, 1000);

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
    successMessage.value = 'Xác thực tài khoản thành công. Đang chuyển hướng...';
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
    <div class="mb-6">
      <h2 class="text-2xl font-normal text-ink">Xác thực mã OTP</h2>
      <p class="mt-1 text-base text-muted">
        Mã xác nhận gồm 6 chữ số đã được gửi tới <strong class="font-medium text-ink">{{ email }}</strong>.
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

    <form class="space-y-5" @submit.prevent="handleVerify">
      <div>
        <label for="otp-input" class="mb-2 block text-sm font-medium text-ink">
          Nhập mã xác thực 6 chữ số
        </label>
        <input
          id="otp-input"
          v-model="otp"
          type="text"
          inputmode="numeric"
          maxlength="6"
          required
          autofocus
          aria-describedby="otp-timer-note"
          placeholder="123456"
          class="manage-input py-3.5 text-center text-2xl tracking-[0.35em] tabular-nums"
        />
        <div id="otp-timer-note" class="mt-2 flex items-center justify-between text-xs text-muted">
          <span>Thời hạn hiệu lực mã:</span>
          <span :class="expireSeconds < 60 ? 'text-brand-soft font-medium' : 'text-ink tabular-nums'">
            {{ formatTime(expireSeconds) }}
          </span>
        </div>
      </div>

      <button
        type="submit"
        :disabled="authStore.loading || !isOtpValid"
        class="manage-button-primary flex w-full items-center justify-center gap-2"
      >
        <span>{{ authStore.loading ? 'Đang xác thực...' : 'Kích hoạt tài khoản' }}</span>
      </button>

      <div class="pt-2">
        <button
          type="button"
          :disabled="resendCooldown > 0 || authStore.loading"
          class="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ink disabled:opacity-50"
          @click="handleResendOtp"
        >
          <RotateCw class="h-3.5 w-3.5" :class="{ 'animate-spin': authStore.loading }" />
          <span v-if="resendCooldown > 0">Gửi lại mã sau ({{ resendCooldown }}s)</span>
          <span v-else class="text-ink underline underline-offset-4">Gửi lại mã OTP</span>
        </button>
      </div>
    </form>
  </AuthLayout>
</template>
