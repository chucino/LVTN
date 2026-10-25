<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import {
  UserPlus,
  Mail,
  Lock,
  User as UserIcon,
  Calendar,
  Briefcase,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const fullName = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const dateOfBirth = ref('');
const occupation = ref('');
const avatar = ref('');
const selectedCategories = ref<string[]>([]);
const errorMessage = ref<string | null>(null);

const availableCategories = [
  'Lập trình Web (Vue / React / Node.js)',
  'Lập trình Di động (Flutter / React Native)',
  'Trí tuệ nhân tạo (AI / Machine Learning)',
  'Khoa học dữ liệu (Data Science / Python)',
  'Tin học văn phòng & Cơ bản',
];

const toggleCategory = (cat: string) => {
  const index = selectedCategories.value.indexOf(cat);
  if (index > -1) {
    selectedCategories.value.splice(index, 1);
  } else {
    selectedCategories.value.push(cat);
  }
};

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)';
    return;
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu và xác nhận mật khẩu không trùng khớp';
    return;
  }

  if (password.value.length < 6) {
    errorMessage.value = 'Mật khẩu phải có tối thiểu 6 ký tự';
    return;
  }

  errorMessage.value = null;
  try {
    await authStore.register({
      fullName: fullName.value.trim(),
      email: email.value.trim().toLowerCase(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      dateOfBirth: dateOfBirth.value || undefined,
      occupation: occupation.value.trim() || undefined,
      avatar: avatar.value.trim() || undefined,
      interestedCategories: selectedCategories.value,
    });

    router.push({
      path: '/verify-otp',
      query: { email: email.value.trim().toLowerCase() },
    });
  } catch (err: any) {
    errorMessage.value =
      err.response?.data?.message || err.message || 'Đăng ký không thành công';
  }
};
</script>

<template>
  <AuthLayout>
    <div class="mb-5">
      <h2 class="text-xl font-bold text-white tracking-tight">Tạo tài khoản học viên mới</h2>
      <p class="text-slate-400 text-sm mt-0.5">Nhập thông tin để nhận mã OTP xác thực qua email</p>
    </div>

    <!-- Error Alert -->
    <div
      v-if="errorMessage"
      class="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5 animate-in fade-in"
    >
      <ShieldAlert class="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span>{{ errorMessage }}</span>
    </div>

    <form @submit.prevent="handleRegister" class="space-y-3.5">
      <!-- Full Name -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Họ và tên <span class="text-red-400">*</span>
        </label>
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <UserIcon class="w-4 h-4" />
          </div>
          <input
            v-model="fullName"
            type="text"
            required
            placeholder="Nguyễn Văn A"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <!-- Email -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
          Email nhận mã OTP <span class="text-red-400">*</span>
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

      <!-- Passwords Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Mật khẩu <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock class="w-4 h-4" />
            </div>
            <input
              v-model="password"
              type="password"
              required
              placeholder="Tối thiểu 6 ký tự"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Xác nhận mật khẩu <span class="text-red-400">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Lock class="w-4 h-4" />
            </div>
            <input
              v-model="confirmPassword"
              type="password"
              required
              placeholder="Nhập lại mật khẩu"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- DOB & Occupation Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Ngày sinh</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Calendar class="w-4 h-4" />
            </div>
            <input
              v-model="dateOfBirth"
              type="date"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">Nghề nghiệp</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Briefcase class="w-4 h-4" />
            </div>
            <input
              v-model="occupation"
              type="text"
              placeholder="Sinh viên, Kỹ sư..."
              class="w-full pl-10 pr-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>
      </div>

      <!-- Interested Categories -->
      <div>
        <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
          Lĩnh vực bạn quan tâm (tùy chọn)
        </label>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="cat in availableCategories"
            :key="cat"
            type="button"
            @click="toggleCategory(cat)"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border',
              selectedCategories.includes(cat)
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 shadow-sm shadow-indigo-500/20'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300',
            ]"
          >
            <CheckCircle2 v-if="selectedCategories.includes(cat)" class="w-3.5 h-3.5 text-indigo-400" />
            <span>{{ cat }}</span>
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        :disabled="authStore.loading"
        class="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span v-if="authStore.loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <UserPlus v-else class="w-4 h-4" />
        <span>{{ authStore.loading ? 'Đang gửi mã OTP...' : 'Tiếp tục đăng ký' }}</span>
      </button>
    </form>

    <!-- Switch to Login -->
    <div class="mt-5 text-center text-xs text-slate-400">
      Đã có tài khoản?
      <router-link to="/login" class="text-indigo-400 hover:text-indigo-300 font-semibold ml-1">
        Đăng nhập
      </router-link>
    </div>
  </AuthLayout>
</template>
