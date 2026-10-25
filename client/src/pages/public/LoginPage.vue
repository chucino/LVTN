<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { LogIn, Mail, Lock, Eye, EyeOff, ShieldAlert } from 'lucide-vue-next';

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

const fillAdminCredentials = () => {
  email.value = 'admin@nextcode.vn';
  password.value = 'Admin@123456';
};
</script>

<template>
  <AuthLayout>
    <div class="mb-6">
      <h2 class="text-xl font-bold text-white tracking-tight">Chào mừng trở lại</h2>
      <p class="text-slate-400 text-sm mt-0.5">Vui lòng nhập thông tin để truy cập hệ thống học tập</p>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1"
    >
      <ShieldAlert class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email Field -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">Email</label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Mail class="w-4 h-4" />
          </div>
          <input
            v-model="email"
            type="email"
            required
            placeholder="name@example.com"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <!-- Password Field -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-xs font-semibold text-slate-300 uppercase tracking-wider">Mật khẩu</label>
          <router-link
            to="/forgot-password"
            class="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Quên mật khẩu?
          </router-link>
        </div>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Lock class="w-4 h-4" />
          </div>
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            required
            placeholder="Nhập mật khẩu..."
            class="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          <button
            type="button"
            @click="showPassword = !showPassword"
            class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
          >
            <EyeOff v-if="showPassword" class="w-4 h-4" />
            <Eye v-else class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="authStore.loading"
        class="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <LogIn v-else class="w-4 h-4" />
        <span>{{ authStore.loading ? 'Đang xác thực...' : 'Đăng nhập' }}</span>
      </button>
    </form>

    <!-- Quick test credentials helper -->
    <div class="mt-6 pt-5 border-t border-slate-800/80">
      <div class="flex items-center justify-between text-xs text-slate-400 mb-2">
        <span>Tài khoản kiểm thử nhanh:</span>
        <button
          type="button"
          @click="fillAdminCredentials"
          class="text-indigo-400 hover:text-indigo-300 underline font-medium"
        >
          Điền tài khoản Admin
        </button>
      </div>
      <div class="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] text-slate-400 font-mono">
        admin@nextcode.vn / Admin@123456
      </div>
    </div>

    <!-- Switch to Register -->
    <div class="mt-5 text-center text-xs text-slate-400">
      Chưa có tài khoản học viên?
      <router-link to="/register" class="text-indigo-400 hover:text-indigo-300 font-semibold ml-1">
        Đăng ký ngay
      </router-link>
    </div>
  </AuthLayout>
</template>
