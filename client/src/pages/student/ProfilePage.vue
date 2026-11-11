<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  Award,
  BookOpen,
  Briefcase,
  Calendar,
  Camera,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Lock,
  Mail,
  PlayCircle,
  Save,
  Trash2,
  UserRound,
} from 'lucide-vue-next';
import CertificateCardView from '@/components/certificate/CertificateCardView.vue';
import CourseCover from '@/components/course/CourseCover.vue';
import { formatCourseDuration } from '@/lib/course-format';
import { certificatesApi } from '@/services/certificates.api';
import { coursesApi } from '@/services/courses.api';
import { enrollmentsApi } from '@/services/enrollments.api';
import { uploadsApi } from '@/services/uploads.api';
import { usersApi } from '@/services/users.api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  CertificateItem,
  EnrollmentStatus,
  MyEnrolledCourseItem,
} from '@/types/learning';
import type { ProfileTab } from '@/types/user';

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_CATEGORIES = [
  'Lập trình Web Frontend',
  'Lập trình Backend & API',
  'Khoa học dữ liệu & AI',
  'Lập trình Di động',
  'DevOps & Cloud',
  'Cơ sở dữ liệu & Giải thuật',
];

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const isStudent = computed(() => authStore.user?.role === 'STUDENT');
const avatarLoadError = ref(false);

const activeTab = computed<ProfileTab>(() => {
  const tab = route.query.tab;
  if (tab === 'security') return 'security';
  if (isStudent.value && (tab === 'courses' || tab === 'certificates')) {
    return tab;
  }
  return 'info';
});

const categoryOptions = ref<string[]>([...DEFAULT_CATEGORIES]);
const profileLoading = ref(false);
const savingProfile = ref(false);
const profileSuccess = ref<string | null>(null);
const profileError = ref<string | null>(null);

const avatarInputRef = ref<HTMLInputElement | null>(null);
const selectedAvatarFile = ref<File | null>(null);
const localAvatarPreview = ref<string>('');

const profileForm = reactive({
  fullName: '',
  dateOfBirth: '',
  occupation: '',
  avatar: '' as string | null,
  interestedCategories: [] as string[],
});

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const savingPassword = ref(false);
const passwordSuccess = ref<string | null>(null);
const passwordError = ref<string | null>(null);

// Enrolled courses & certificates state
const myCourses = ref<MyEnrolledCourseItem[]>([]);
const coursesLoading = ref(false);
const courseStatusFilter = ref<'ALL' | EnrollmentStatus>('ALL');
const myCertificates = ref<CertificateItem[]>([]);
const certificatesLoading = ref(false);
const selectedCertificate = ref<CertificateItem | null>(null);

const filteredMyCourses = computed(() => {
  if (courseStatusFilter.value === 'ALL') return myCourses.value;
  return myCourses.value.filter((item) => item.status === courseStatusFilter.value);
});

const roleLabel = computed(() => {
  switch (authStore.user?.role) {
    case 'ADMIN':
      return 'Quản trị viên';
    case 'INSTRUCTOR':
      return 'Giảng viên';
    case 'ACCOUNTANT':
      return 'Kế toán';
    default:
      return 'Học viên';
  }
});

const initials = computed(() =>
  (profileForm.fullName || authStore.user?.fullName || 'NC')
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
);

const currentAvatarUrl = computed(() => {
  if (localAvatarPreview.value) return localAvatarPreview.value;
  return profileForm.avatar || '';
});

watch(currentAvatarUrl, () => {
  avatarLoadError.value = false;
});

function toDateInputValue(rawDate?: string | null): string {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function formatJoinDate(rawDate?: string | null): string {
  if (!rawDate) return 'Thành viên NextCode';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return 'Thành viên NextCode';
  return `Tham gia từ ${parsed.toLocaleDateString('vi-VN')}`;
}

function formatShortDate(rawDate?: string | null): string {
  if (!rawDate) return '';
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toLocaleDateString('vi-VN');
}

function revokeAvatarPreview() {
  if (localAvatarPreview.value) {
    URL.revokeObjectURL(localAvatarPreview.value);
    localAvatarPreview.value = '';
  }
}

function resetAvatarFile() {
  revokeAvatarPreview();
  selectedAvatarFile.value = null;
  if (avatarInputRef.value) {
    avatarInputRef.value.value = '';
  }
}

function hydrateFormFromUser() {
  const current = authStore.user;
  if (!current) return;
  resetAvatarFile();
  profileForm.fullName = current.fullName || '';
  profileForm.dateOfBirth = toDateInputValue(current.dateOfBirth);
  profileForm.occupation = current.occupation || '';
  profileForm.avatar = current.avatar ?? null;
  profileForm.interestedCategories = Array.isArray(current.interestedCategories)
    ? [...current.interestedCategories]
    : [];
}

async function loadStudentLearningData(): Promise<void> {
  if (authStore.user?.role !== 'STUDENT') return;
  coursesLoading.value = true;
  certificatesLoading.value = true;
  try {
    const [coursesData, certsData] = await Promise.all([
      enrollmentsApi.getMyCourses().catch(() => []),
      certificatesApi.getMyCertificates().catch(() => []),
    ]);
    myCourses.value = coursesData;
    myCertificates.value = certsData;
    if (certsData.length > 0 && !selectedCertificate.value) {
      selectedCertificate.value = certsData[0] ?? null;
    }
  } finally {
    coursesLoading.value = false;
    certificatesLoading.value = false;
  }
}

watch(
  () => authStore.user,
  () => {
    hydrateFormFromUser();
  },
  { immediate: true },
);

watch(
  () => activeTab.value,
  (tab) => {
    if (tab === 'courses' || tab === 'certificates') {
      void loadStudentLearningData();
    }
  },
);

onMounted(async () => {
  profileLoading.value = true;
  try {
    const [freshUser, categories] = await Promise.all([
      usersApi.getProfile(),
      coursesApi.getCategories().catch(() => []),
    ]);
    authStore.syncUser(freshUser);
    hydrateFormFromUser();
    if (categories.length > 0) {
      const merged = new Set<string>([
        ...categories.map((c) => c.name),
        ...DEFAULT_CATEGORIES,
      ]);
      categoryOptions.value = Array.from(merged);
    }
    await loadStudentLearningData();
  } catch {
    // Fallback to existing authStore.user
  } finally {
    profileLoading.value = false;
  }
});

onBeforeUnmount(() => {
  revokeAvatarPreview();
});

function selectTab(tab: ProfileTab) {
  profileSuccess.value = null;
  profileError.value = null;
  passwordSuccess.value = null;
  passwordError.value = null;
  void router.replace({
    query: { ...route.query, tab: tab === 'info' ? undefined : tab },
  });
}

function triggerAvatarPicker() {
  if (savingProfile.value) return;
  avatarInputRef.value?.click();
}

function handleAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  profileError.value = null;
  if (!ALLOWED_AVATAR_MIMES.has(file.type)) {
    profileError.value = 'Ảnh đại diện chỉ hỗ trợ định dạng JPG, PNG hoặc WEBP.';
    input.value = '';
    return;
  }
  if (file.size <= 0 || file.size > MAX_AVATAR_BYTES) {
    profileError.value = 'Dung lượng ảnh đại diện không được vượt quá 5MB.';
    input.value = '';
    return;
  }

  revokeAvatarPreview();
  selectedAvatarFile.value = file;
  localAvatarPreview.value = URL.createObjectURL(file);
}

function removeAvatar() {
  if (savingProfile.value) return;
  profileError.value = null;
  if (selectedAvatarFile.value) {
    resetAvatarFile();
    return;
  }
  profileForm.avatar = null;
}

function toggleCategory(categoryName: string) {
  const idx = profileForm.interestedCategories.indexOf(categoryName);
  if (idx >= 0) {
    profileForm.interestedCategories.splice(idx, 1);
  } else if (profileForm.interestedCategories.length < 10) {
    profileForm.interestedCategories.push(categoryName);
  }
}

async function handleSaveProfile() {
  profileSuccess.value = null;
  profileError.value = null;

  const trimmedName = profileForm.fullName.trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    profileError.value = 'Họ và tên phải có từ 2 đến 100 ký tự.';
    return;
  }

  savingProfile.value = true;
  try {
    let nextAvatar = profileForm.avatar;
    if (selectedAvatarFile.value) {
      const uploaded = await uploadsApi.uploadImage(
        selectedAvatarFile.value,
        'avatars',
      );
      nextAvatar = uploaded.url;
    }

    const result = await usersApi.updateProfile({
      fullName: trimmedName,
      dateOfBirth: profileForm.dateOfBirth || null,
      occupation: profileForm.occupation.trim() || null,
      avatar: nextAvatar,
      interestedCategories: [...profileForm.interestedCategories],
    });

    authStore.syncUser(result.user);
    hydrateFormFromUser();
    profileSuccess.value = result.message || 'Đã lưu thông tin hồ sơ cá nhân.';
  } catch (err: any) {
    profileError.value =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể cập nhật hồ sơ cá nhân.';
  } finally {
    savingProfile.value = false;
  }
}

async function handleChangePassword() {
  passwordSuccess.value = null;
  passwordError.value = null;

  if (!passwordForm.currentPassword) {
    passwordError.value = 'Vui lòng nhập mật khẩu hiện tại.';
    return;
  }
  if (passwordForm.newPassword.length < 8) {
    passwordError.value = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    return;
  }
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Mật khẩu mới và xác nhận mật khẩu không khớp.';
    return;
  }

  savingPassword.value = true;
  try {
    const result = await usersApi.changePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });
    passwordForm.currentPassword = '';
    passwordForm.newPassword = '';
    passwordForm.confirmPassword = '';
    passwordSuccess.value =
      result.message || 'Đổi mật khẩu thành công.';
  } catch (err: any) {
    passwordError.value =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.';
  } finally {
    savingPassword.value = false;
  }
}
</script>

<template>
  <div data-ui class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <!-- Profile Header -->
    <section class="bg-surface p-6 sm:p-8">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div class="relative shrink-0">
            <img
              v-if="currentAvatarUrl && !avatarLoadError"
              :src="currentAvatarUrl"
              alt="Ảnh đại diện của bạn"
              class="h-24 w-24 object-cover"
              @error="avatarLoadError = true"
            />
            <div
              v-else
              class="flex h-24 w-24 items-center justify-center bg-surface-2 text-2xl font-bold text-ink"
            >
              {{ initials }}
            </div>
            <span
              v-if="selectedAvatarFile"
              class="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-brand px-2.5 py-0.5 text-[10px] font-semibold text-white"
            >
              Xem trước
            </span>
          </div>

          <div class="space-y-1.5">
            <div class="flex flex-wrap items-center gap-2.5">
              <h1 class="font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
                {{ authStore.user?.fullName || 'Học viên NextCode' }}
              </h1>
              <span
                class="inline-flex items-center gap-1.5 bg-surface-2 px-3 py-1 text-xs font-medium text-ink"
              >
                <GraduationCap class="h-3.5 w-3.5 text-brand-soft" />
                {{ roleLabel }}
              </span>
            </div>

            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted sm:text-sm">
              <span class="inline-flex items-center gap-1.5">
                <Mail class="h-4 w-4 text-muted" />
                {{ authStore.user?.email }}
              </span>
              <span v-if="authStore.user?.occupation" class="inline-flex items-center gap-1.5">
                <Briefcase class="h-4 w-4 text-muted" />
                {{ authStore.user.occupation }}
              </span>
              <span class="inline-flex items-center gap-1.5">
                <Calendar class="h-4 w-4 text-muted" />
                {{ formatJoinDate(authStore.user?.createdAt) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div
        class="mt-8 flex gap-1 overflow-x-auto bg-ground p-1"
        role="tablist"
        aria-label="Các mục trang cá nhân"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'info'"
          class="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'info'
              ? 'bg-surface-2 text-ink'
              : 'text-muted hover:bg-surface hover:text-ink'
          "
          @click="selectTab('info')"
        >
          <UserRound class="h-4 w-4" />
          Thông tin cá nhân
        </button>

        <button
          v-if="isStudent"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'courses'"
          class="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'courses'
              ? 'bg-surface-2 text-ink'
              : 'text-muted hover:bg-surface hover:text-ink'
          "
          @click="selectTab('courses')"
        >
          <BookOpen class="h-4 w-4" />
          <span>Khóa học của tôi</span>
          <span
            v-if="myCourses.length > 0"
            class="rounded-full bg-tint px-2 py-0.5 text-xs font-bold tabular-nums text-brand-soft"
          >
            {{ myCourses.length }}
          </span>
        </button>

        <button
          v-if="isStudent"
          type="button"
          role="tab"
          :aria-selected="activeTab === 'certificates'"
          class="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'certificates'
              ? 'bg-surface-2 text-ink'
              : 'text-muted hover:bg-surface hover:text-ink'
          "
          @click="selectTab('certificates')"
        >
          <Award class="h-4 w-4" />
          <span>Chứng chỉ của tôi</span>
          <span
            v-if="myCertificates.length > 0"
            class="rounded-full bg-teal-tint px-2 py-0.5 text-xs font-bold tabular-nums text-teal"
          >
            {{ myCertificates.length }}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'security'"
          class="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 text-sm font-medium transition-colors"
          :class="
            activeTab === 'security'
              ? 'bg-surface-2 text-ink'
              : 'text-muted hover:bg-surface hover:text-ink'
          "
          @click="selectTab('security')"
        >
          <KeyRound class="h-4 w-4" />
          Đổi mật khẩu & Bảo mật
        </button>
      </div>
    </section>

    <!-- Tab 1: Personal Info & Avatar -->
    <section
      v-if="activeTab === 'info'"
      class="mt-6 grid gap-6 lg:grid-cols-3"
    >
      <!-- Avatar Upload Card -->
      <div class="bg-surface p-6">
        <h2 class="text-base font-semibold text-ink">Ảnh đại diện</h2>
        <p class="mt-1 text-xs leading-5 text-muted">
          Tải ảnh trực tiếp từ máy tính. Bạn có thể xem trước ảnh mới trước khi bấm Lưu hồ sơ.
        </p>

        <input
          ref="avatarInputRef"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="sr-only"
          @change="handleAvatarChange"
        />

        <div class="mt-5 flex flex-col items-center bg-ground p-6 text-center">
          <div class="relative">
            <img
              v-if="currentAvatarUrl && !avatarLoadError"
              :src="currentAvatarUrl"
              alt="Xem trước ảnh đại diện"
              class="h-28 w-28 object-cover"
              @error="avatarLoadError = true"
            />
            <div
              v-else
              class="flex h-28 w-28 items-center justify-center bg-surface-2 text-3xl font-bold text-ink"
            >
              {{ initials }}
            </div>
          </div>

          <p v-if="selectedAvatarFile" class="mt-3 text-xs font-medium text-ink">
            Đã chọn: {{ selectedAvatarFile.name }} (Xem trước — chưa lưu)
          </p>
          <p v-else class="mt-3 text-xs text-muted">
            JPG, PNG hoặc WEBP (Tối đa 5MB)
          </p>

          <div class="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              :disabled="savingProfile"
              class="manage-button-secondary text-xs"
              @click="triggerAvatarPicker"
            >
              <Camera class="h-3.5 w-3.5" />
              Chọn ảnh từ máy
            </button>

            <button
              v-if="currentAvatarUrl"
              type="button"
              :disabled="savingProfile"
              class="manage-button-danger text-xs"
              @click="removeAvatar"
            >
              <Trash2 class="h-3.5 w-3.5" />
              {{ selectedAvatarFile ? 'Hủy ảnh vừa chọn' : 'Gỡ ảnh' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Profile Details Form -->
      <form
        class="space-y-6 bg-surface p-6 lg:col-span-2 sm:p-8"
        @submit.prevent="handleSaveProfile"
      >
        <div>
          <h2 class="text-lg font-semibold text-ink">Cập nhật thông tin cá nhân</h2>
          <p class="mt-1 text-xs text-muted">
            Thông tin họ tên sẽ được sử dụng để in trên Chứng chỉ hoàn thành khóa học.
          </p>
        </div>

        <div
          v-if="profileSuccess"
          class="manage-alert-success"
          role="status"
        >
          <CheckCircle2 class="h-5 w-5 shrink-0" />
          <span>{{ profileSuccess }}</span>
        </div>

        <div
          v-if="profileError"
          class="manage-alert-error"
          role="alert"
        >
          <AlertCircle class="h-5 w-5 shrink-0" />
          <span>{{ profileError }}</span>
        </div>

        <div class="grid gap-5 sm:grid-cols-2">
          <label class="manage-field sm:col-span-2">
            <span>Họ và tên <span class="text-brand-soft">*</span></span>
            <input
              v-model="profileForm.fullName"
              type="text"
              required
              minlength="2"
              maxlength="100"
              placeholder="Nhập họ và tên đầy đủ"
              class="manage-input"
            />
          </label>

          <label class="manage-field">
            <span>Email đăng nhập</span>
            <input
              :value="authStore.user?.email"
              type="email"
              disabled
              class="manage-input cursor-not-allowed opacity-60"
            />
          </label>

          <label class="manage-field">
            <span>Ngày sinh</span>
            <input
              v-model="profileForm.dateOfBirth"
              type="date"
              class="manage-input"
            />
          </label>

          <label class="manage-field sm:col-span-2">
            <span>Nghề nghiệp / Công việc hiện tại</span>
            <input
              v-model="profileForm.occupation"
              type="text"
              maxlength="150"
              placeholder="Ví dụ: Sinh viên CNTT, Lập trình viên Frontend..."
              class="manage-input"
            />
          </label>

          <div class="space-y-2 sm:col-span-2">
            <span class="block text-sm font-medium text-ink">
              Lĩnh vực học tập quan tâm
            </span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="cat in categoryOptions"
                :key="cat"
                type="button"
                class="px-3 py-1.5 text-xs font-medium transition-colors"
                :class="
                  profileForm.interestedCategories.includes(cat)
                    ? 'bg-brand text-white'
                    : 'bg-ground text-muted hover:bg-surface-2 hover:text-ink'
                "
                @click="toggleCategory(cat)"
              >
                {{ cat }}
              </button>
            </div>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="savingProfile"
            class="manage-button-primary"
          >
            <Save class="h-4 w-4" />
            <span>{{ savingProfile ? 'Đang lưu hồ sơ...' : 'Lưu thay đổi' }}</span>
          </button>
        </div>
      </form>
    </section>

    <!-- Tab 2: Enrolled Courses & Learning Progress -->
    <section
      v-else-if="activeTab === 'courses'"
      class="mt-6 space-y-6 bg-surface p-6 sm:p-8"
    >
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-lg font-semibold text-ink">Khóa học đã đăng ký</h2>
          <p class="mt-1 text-xs text-muted">
            Theo dõi lộ trình và tiến độ hoàn thành các khóa học của bạn tại NextCode.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            class="px-3.5 py-2 text-xs font-semibold transition-colors"
            :class="
              courseStatusFilter === 'ALL'
                ? 'bg-brand text-white'
                : 'bg-ground text-ink hover:bg-surface-2'
            "
            @click="courseStatusFilter = 'ALL'"
          >
            Tất cả ({{ myCourses.length }})
          </button>
          <button
            type="button"
            class="px-3.5 py-2 text-xs font-semibold transition-colors"
            :class="
              courseStatusFilter === 'LEARNING'
                ? 'bg-brand text-white'
                : 'bg-ground text-ink hover:bg-surface-2'
            "
            @click="courseStatusFilter = 'LEARNING'"
          >
            Đang học
          </button>
          <button
            type="button"
            class="px-3.5 py-2 text-xs font-semibold transition-colors"
            :class="
              courseStatusFilter === 'COMPLETED'
                ? 'bg-brand text-white'
                : 'bg-ground text-ink hover:bg-surface-2'
            "
            @click="courseStatusFilter = 'COMPLETED'"
          >
            Đã hoàn thành
          </button>
          <router-link
            :to="{ name: 'Courses' }"
            class="manage-button-secondary text-xs"
          >
            <Compass class="h-4 w-4" />
            Khám phá thêm
          </router-link>
        </div>
      </div>

      <div v-if="coursesLoading" class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-64 bg-ground" />
      </div>

      <div
        v-else-if="filteredMyCourses.length === 0"
        class="flex flex-col items-center justify-center bg-ground px-6 py-14 text-center"
      >
        <BookOpen class="h-8 w-8 text-muted" />
        <h3 class="mt-4 text-base font-semibold text-ink">
          {{
            myCourses.length === 0
              ? 'Bạn chưa đăng ký khóa học nào'
              : 'Không có khóa học nào trong bộ lọc này'
          }}
        </h3>
        <p class="mt-2 max-w-md text-xs leading-5 text-muted sm:text-sm">
          Khi bạn đăng ký khóa học Miễn phí hoặc hoàn tất mua khóa học Pro, danh sách khóa học cùng thanh tiến độ học tập sẽ hiển thị tại đây.
        </p>
        <router-link
          :to="{ name: 'Courses' }"
          class="manage-button-primary mt-5"
        >
          <BookOpen class="h-4 w-4" />
          Xem danh sách khóa học
        </router-link>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="item in filteredMyCourses"
          :key="item.enrollmentId"
          class="flex flex-col justify-between overflow-hidden bg-ground"
        >
          <div>
            <CourseCover :src="item.thumbnail" :title="item.title" />
            <div class="p-5">
              <div class="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span
                  class="rounded-full px-2.5 py-0.5"
                  :class="
                    item.type === 'FREE'
                      ? 'bg-teal-tint text-teal'
                      : 'bg-tint text-brand-soft'
                  "
                >
                  {{ item.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
                </span>
                <span
                  class="rounded-full px-2.5 py-0.5"
                  :class="
                    item.status === 'COMPLETED'
                      ? 'bg-teal-tint text-teal'
                      : 'bg-surface-2 text-ink'
                  "
                >
                  {{ item.status === 'COMPLETED' ? 'Đã hoàn thành' : 'Đang học' }}
                </span>
              </div>

              <h3 class="mt-3 line-clamp-2 text-base font-bold text-ink">
                <router-link
                  :to="{ name: 'CourseDetail', params: { id: item.courseId } }"
                  class="hover:text-brand-soft"
                >
                  {{ item.title }}
                </router-link>
              </h3>
              <p class="mt-1 text-xs text-muted">
                Giảng viên: {{ item.instructorName }}
              </p>
              <p class="mt-1 text-xs tabular-nums text-muted">
                {{ item.totalLessons }} bài · {{ formatCourseDuration(item.totalDuration) }} · Đăng ký {{ formatShortDate(item.enrolledAt) }}
              </p>

              <!-- Thanh tiến độ -->
              <div class="mt-4">
                <div class="flex items-center justify-between text-xs font-semibold">
                  <span class="text-muted">Tiến độ hoàn thành</span>
                  <span class="tabular-nums text-ink">{{ item.progressPercent }}%</span>
                </div>
                <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-3">
                  <div
                    class="h-full rounded-full"
                    :class="item.status === 'COMPLETED' ? 'bg-teal' : 'bg-brand'"
                    :style="{ width: `${item.progressPercent}%` }"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center justify-between gap-2 bg-surface-2 px-5 py-3.5">
            <router-link
              :to="{
                name: 'CourseLearning',
                params: { courseId: item.courseId },
                query: item.lastLessonId ? { lessonId: item.lastLessonId } : undefined,
              }"
              class="manage-button-primary flex-1 justify-center text-xs"
            >
              <PlayCircle class="h-4 w-4" />
              <span>{{ item.status === 'COMPLETED' ? 'Xem lại bài giảng' : 'Học tiếp' }}</span>
            </router-link>

            <router-link
              v-if="item.certificateCode"
              :to="{
                name: 'CertificateVerifyCode',
                params: { code: item.certificateCode },
              }"
              class="manage-button-secondary text-xs"
              title="Xem chứng chỉ"
            >
              <Award class="h-4 w-4 text-teal" />
              <span>Chứng chỉ</span>
            </router-link>
          </div>
        </article>
      </div>
    </section>

    <!-- Tab 3: My Certificates -->
    <section
      v-else-if="activeTab === 'certificates'"
      class="mt-6 space-y-6 bg-surface p-6 sm:p-8"
    >
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 class="text-lg font-semibold text-ink">Chứng chỉ của tôi</h2>
          <p class="mt-1 text-xs text-muted">
            Chứng chỉ được cấp tự động khi bạn hoàn thành 100% bài giảng và bài kiểm tra trắc nghiệm của khóa học.
          </p>
        </div>

        <router-link
          :to="{ name: 'CertificateVerify' }"
          class="manage-button-secondary text-xs"
        >
          <Award class="h-4 w-4" />
          Trang tra cứu chứng chỉ công khai
        </router-link>
      </div>

      <div
        v-if="myCertificates.length === 0"
        class="flex flex-col items-center justify-center bg-ground px-6 py-14 text-center"
      >
        <Award class="h-8 w-8 text-muted" />
        <h3 class="mt-4 text-base font-semibold text-ink">
          Bạn chưa có chứng chỉ nào
        </h3>
        <p class="mt-2 max-w-md text-xs leading-5 text-muted sm:text-sm">
          Hãy hoàn thành 100% các bài giảng trong khóa học bạn đã đăng ký để nhận chứng chỉ kèm mã QR xác thực.
        </p>
        <button
          type="button"
          class="manage-button-primary mt-5"
          @click="selectTab('courses')"
        >
          <BookOpen class="h-4 w-4" />
          Đi tới Khóa học của tôi
        </button>
      </div>

      <div v-else class="space-y-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="cert in myCertificates"
            :key="cert.id"
            type="button"
            class="px-4 py-2.5 text-left text-xs transition-colors"
            :class="
              selectedCertificate?.id === cert.id
                ? 'bg-brand font-semibold text-white'
                : 'bg-ground text-ink hover:bg-surface-2'
            "
            @click="selectedCertificate = cert"
          >
            <span class="block">{{ cert.courseTitle }}</span>
            <span class="mt-0.5 block text-[11px] tabular-nums opacity-80">
              {{ cert.certificateCode }}
            </span>
          </button>
        </div>

        <CertificateCardView
          v-if="selectedCertificate"
          :certificate-code="selectedCertificate.certificateCode"
          :student-name="selectedCertificate.studentName"
          :course-title="selectedCertificate.courseTitle"
          :instructor-name="selectedCertificate.instructorName"
          :issued-at="selectedCertificate.issuedAt"
        />
      </div>
    </section>

    <!-- Tab 4: Password & Security -->
    <section
      v-else-if="activeTab === 'security'"
      class="mt-6 max-w-2xl"
    >
      <form
        class="space-y-6 bg-surface p-6 sm:p-8"
        @submit.prevent="handleChangePassword"
      >
        <div>
          <h2 class="text-lg font-semibold text-ink">Đổi mật khẩu tài khoản</h2>
          <p class="mt-1 text-xs text-muted">
            Sử dụng mật khẩu mạnh gồm ít nhất 8 ký tự để bảo vệ tài khoản của bạn.
          </p>
        </div>

        <div
          v-if="passwordSuccess"
          class="manage-alert-success"
          role="status"
        >
          <CheckCircle2 class="h-5 w-5 shrink-0" />
          <span>{{ passwordSuccess }}</span>
        </div>

        <div
          v-if="passwordError"
          class="manage-alert-error"
          role="alert"
        >
          <AlertCircle class="h-5 w-5 shrink-0" />
          <span>{{ passwordError }}</span>
        </div>

        <div class="space-y-4">
          <label class="manage-field">
            <span>Mật khẩu hiện tại <span class="text-brand-soft">*</span></span>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                v-model="passwordForm.currentPassword"
                :type="showCurrentPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="Nhập mật khẩu đang sử dụng"
                class="manage-input pl-10 pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                @click="showCurrentPassword = !showCurrentPassword"
              >
                <EyeOff v-if="showCurrentPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>

          <label class="manage-field">
            <span>Mật khẩu mới <span class="text-brand-soft">*</span></span>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                v-model="passwordForm.newPassword"
                :type="showNewPassword ? 'text' : 'password'"
                required
                minlength="8"
                maxlength="64"
                autocomplete="new-password"
                placeholder="Ít nhất 8 ký tự"
                class="manage-input pl-10 pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                @click="showNewPassword = !showNewPassword"
              >
                <EyeOff v-if="showNewPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>

          <label class="manage-field">
            <span>Xác nhận mật khẩu mới <span class="text-brand-soft">*</span></span>
            <div class="relative">
              <Lock class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                v-model="passwordForm.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                required
                minlength="8"
                maxlength="64"
                autocomplete="new-password"
                placeholder="Nhập lại mật khẩu mới"
                class="manage-input pl-10 pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <EyeOff v-if="showConfirmPassword" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </label>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="savingPassword"
            class="manage-button-primary"
          >
            <KeyRound class="h-4 w-4" />
            <span>{{ savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu' }}</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
