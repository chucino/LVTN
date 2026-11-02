<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { Eye, EyeOff, ShieldAlert } from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref<string | null>(null);

const handleLogin = async () => {
  if (!email.value || !password.value) {
    errorMessage.value = 'Vui lòng nhập đầy đủ email và mật khẩu';
    return;
  }

  errorMessage.value = null;
  try {
    await authStore.login({
      email: email.value.trim(),
      password: password.value,
    });
    const redirectTarget = route.query.redirect;
    const destination =
      typeof redirectTarget === 'string' &&
      redirectTarget.startsWith('/') &&
      !redirectTarget.startsWith('//')
        ? redirectTarget
        : '/';
    router.replace(destination);
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Đăng nhập không thành công';
  }
};
</script>

<template>
  <AuthLayout>
    <div class="mb-6">
      <h2 class="text-2xl font-normal text-ink">Đăng nhập tài khoản</h2>
      <p class="mt-1 text-base text-muted">
        Nhập email và mật khẩu đã đăng ký với hệ thống NextCode.
      </p>
    </div>

    <div
      v-if="errorMessage"
      role="alert"
      class="mb-5 flex items-start gap-2.5 bg-brand-surface p-4 text-sm text-ink"
    >
      <ShieldAlert class="mt-0.5 h-5 w-5 shrink-0 text-brand-soft" />
      <span>{{ errorMessage }}</span>
    </div>

    <form class="space-y-5" @submit.prevent="handleLogin">
      <div>
        <label for="login-email" class="mb-1.5 block text-sm font-medium text-ink">
          Địa chỉ Email
        </label>
        <input
          id="login-email"
          v-model="email"
          type="email"
          required
          autocomplete="email"
          placeholder="hocvien@nextcode.vn"
          class="manage-input"
        />
      </div>

      <div>
        <div class="mb-1.5 flex items-center justify-between">
          <label for="login-password" class="text-sm font-medium text-ink">Mật khẩu</label>
          <router-link
            to="/forgot-password"
            class="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Quên mật khẩu?
          </router-link>
        </div>
        <div class="relative">
          <input
            id="login-password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            autocomplete="current-password"
            placeholder="Nhập mật khẩu của bạn"
            class="manage-input pr-11"
          />
          <button
            type="button"
            :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'"
            class="absolute inset-y-0 right-0 flex items-center pr-3.5 text-muted hover:text-ink"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" class="h-4 w-4" />
            <Eye v-else class="h-4 w-4" />
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="manage-button-primary mt-2 flex w-full items-center justify-center gap-2"
      >
        <span>{{ authStore.loading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống' }}</span>
      </button>
    </form>

    <div class="mt-6 text-sm text-muted">
      Chưa có tài khoản học viên?
      <router-link to="/register" class="ml-1 font-medium text-ink underline underline-offset-4 hover:text-brand-soft">
        Đăng ký tài khoản mới
      </router-link>
    </div>
  </AuthLayout>
</template>
