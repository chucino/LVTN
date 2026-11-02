<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import AuthLayout from '@/layouts/AuthLayout.vue';
import { ShieldAlert, CheckCircle2 } from 'lucide-vue-next';

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
    <div class="mb-6">
      <h2 class="text-2xl font-normal text-ink">Đăng ký tài khoản học viên</h2>
      <p class="mt-1 text-base text-muted">
        Nhập thông tin cá nhân để nhận mã xác thực OTP qua email.
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

    <form class="space-y-4" @submit.prevent="handleRegister">
      <div>
        <label for="reg-fullname" class="mb-1.5 block text-sm font-medium text-ink">
          Họ và tên đầy đủ <span class="text-brand-soft">*</span>
        </label>
        <input
          id="reg-fullname"
          v-model="fullName"
          type="text"
          required
          placeholder="Nguyễn Minh An"
          class="manage-input"
        />
      </div>

      <div>
        <label for="reg-email" class="mb-1.5 block text-sm font-medium text-ink">
          Email nhận mã OTP <span class="text-brand-soft">*</span>
        </label>
        <input
          id="reg-email"
          v-model="email"
          type="email"
          required
          placeholder="minhan@nextcode.vn"
          class="manage-input"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="reg-password" class="mb-1.5 block text-sm font-medium text-ink">
            Mật khẩu <span class="text-brand-soft">*</span>
          </label>
          <input
            id="reg-password"
            v-model="password"
            type="password"
            required
            aria-describedby="reg-password-hint"
            placeholder="Tối thiểu 6 ký tự"
            class="manage-input"
          />
          <span id="reg-password-hint" class="mt-1 block text-xs text-muted">Tối thiểu 6 ký tự.</span>
        </div>
        <div>
          <label for="reg-confirm" class="mb-1.5 block text-sm font-medium text-ink">
            Xác nhận mật khẩu <span class="text-brand-soft">*</span>
          </label>
          <input
            id="reg-confirm"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Nhập lại mật khẩu"
            class="manage-input"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label for="reg-dob" class="mb-1.5 block text-sm font-medium text-ink">Ngày sinh</label>
          <input
            id="reg-dob"
            v-model="dateOfBirth"
            type="date"
            class="manage-input [color-scheme:dark]"
          />
        </div>
        <div>
          <label for="reg-job" class="mb-1.5 block text-sm font-medium text-ink">Nghề nghiệp</label>
          <input
            id="reg-job"
            v-model="occupation"
            type="text"
            placeholder="Sinh viên CNTT, Kỹ sư phần mềm..."
            class="manage-input"
          />
        </div>
      </div>

      <div>
        <span class="mb-2 block text-sm font-medium text-ink">
          Lĩnh vực quan tâm (tùy chọn)
        </span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cat in availableCategories"
            :key="cat"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
            :class="
              selectedCategories.includes(cat)
                ? 'bg-brand text-white'
                : 'bg-surface-2 text-muted hover:text-ink'
            "
            @click="toggleCategory(cat)"
          >
            <CheckCircle2 v-if="selectedCategories.includes(cat)" class="h-3.5 w-3.5" />
            <span>{{ cat }}</span>
          </button>
        </div>
      </div>

      <button
        type="submit"
        :disabled="authStore.loading"
        class="manage-button-primary mt-4 flex w-full items-center justify-center gap-2"
      >
        <span>{{ authStore.loading ? 'Đang gửi mã OTP...' : 'Tiếp tục nhận mã OTP' }}</span>
      </button>
    </form>

    <div class="mt-6 text-sm text-muted">
      Đã có tài khoản?
      <router-link to="/login" class="ml-1 font-medium text-ink underline underline-offset-4 hover:text-brand-soft">
        Đăng nhập
      </router-link>
    </div>
  </AuthLayout>
</template>
