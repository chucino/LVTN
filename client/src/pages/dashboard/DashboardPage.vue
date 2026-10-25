<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/services/auth.api';
import type { Role } from '@/types/auth';
import {
  Code2,
  LogOut,
  UserCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Copy,
  RefreshCw,
  Sparkles,
  KeyRound,
  GraduationCap,
  Briefcase,
  Calendar,
  Check,
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// Copy ID state
const isCopied = ref(false);
const copyUserId = () => {
  if (authStore.user?.id) {
    navigator.clipboard.writeText(authStore.user.id);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
};

// RBAC Testing states
const adminTestResult = ref<any>(null);
const adminTestLoading = ref(false);
const instructorTestResult = ref<any>(null);
const instructorTestLoading = ref(false);

const handleTestAdmin = async () => {
  adminTestLoading.value = true;
  adminTestResult.value = null;
  try {
    const res = await authApi.testAdminRole();
    adminTestResult.value = { success: true, data: res.data };
  } catch (err: any) {
    adminTestResult.value = {
      success: false,
      message: err.response?.data?.message || err.message,
      statusCode: err.response?.status || 500,
    };
  } finally {
    adminTestLoading.value = false;
  }
};

const handleTestInstructor = async () => {
  instructorTestLoading.value = true;
  instructorTestResult.value = null;
  try {
    const res = await authApi.testInstructorRole();
    instructorTestResult.value = { success: true, data: res.data };
  } catch (err: any) {
    instructorTestResult.value = {
      success: false,
      message: err.response?.data?.message || err.message,
      statusCode: err.response?.status || 500,
    };
  } finally {
    instructorTestLoading.value = false;
  }
};

// Admin Assign Role Form
const targetUserId = ref('');
const selectedNewRole = ref<Role>('INSTRUCTOR');
const assignRoleLoading = ref(false);
const assignRoleSuccess = ref<string | null>(null);
const assignRoleError = ref<string | null>(null);

const handleAssignRole = async () => {
  if (!targetUserId.value.trim()) {
    assignRoleError.value = 'Vui lòng nhập ID người dùng cần phân quyền';
    return;
  }

  assignRoleLoading.value = true;
  assignRoleSuccess.value = null;
  assignRoleError.value = null;

  try {
    const res = await authStore.assignRole(
      targetUserId.value.trim(),
      selectedNewRole.value,
    );
    assignRoleSuccess.value =
      res.message ||
      `Đã phân quyền thành công cho tài khoản sang vai trò ${selectedNewRole.value}`;
  } catch (err: any) {
    assignRoleError.value =
      err.response?.data?.message || err.message || 'Phân quyền không thành công';
  } finally {
    assignRoleLoading.value = false;
  }
};

// Refresh token session test
const refreshSessionLoading = ref(false);
const refreshSessionMessage = ref<string | null>(null);

const handleRefreshSession = async () => {
  refreshSessionLoading.value = true;
  refreshSessionMessage.value = null;
  try {
    const success = await authStore.refreshSession();
    if (success) {
      refreshSessionMessage.value = 'Đã làm mới token và session thành công qua Cookie HttpOnly!';
      setTimeout(() => {
        refreshSessionMessage.value = null;
      }, 3000);
    }
  } catch (err: any) {
    refreshSessionMessage.value = 'Làm mới token thất bại: ' + err.message;
  } finally {
    refreshSessionLoading.value = false;
  }
};

const handleLogout = async () => {
  await authStore.logout();
  router.push('/login');
};

const formatDate = (dateString?: string | null) => {
  if (!dateString) return 'Chưa cập nhật';
  try {
    return new Date(dateString).toLocaleDateString('vi-VN');
  } catch {
    return dateString;
  }
};
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 font-sans relative overflow-x-hidden">
    <!-- Background glow accents -->
    <div class="absolute -top-40 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
    <div class="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-cyan-600/15 rounded-full blur-3xl pointer-events-none"></div>

    <!-- Navigation Header -->
    <header class="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Code2 class="w-5 h-5" />
          </div>
          <div>
            <span class="font-extrabold text-base tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">NextCode</span>
            <span class="text-[10px] ml-2 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">Auth Portal</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span class="text-slate-300">{{ authStore.user?.email }}</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {{ authStore.user?.role }}
            </span>
          </div>

          <button
            @click="handleLogout"
            class="px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/30 text-xs font-medium flex items-center gap-1.5 transition-all"
          >
            <LogOut class="w-3.5 h-3.5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
      <!-- Welcome Banner -->
      <div class="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900/80 to-slate-900/60 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Sparkles class="w-3.5 h-3.5" />
              <span>Hệ thống phân quyền & xác thực NextCode</span>
            </div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Xin chào, {{ authStore.user?.fullName }}!
            </h1>
            <p class="text-slate-400 text-sm mt-1">
              Bạn đang đăng nhập với vai trò <strong class="text-indigo-400 font-bold">{{ authStore.user?.role }}</strong>.
              Dưới đây là bảng điều khiển kiểm thử và thực thi toàn bộ các API của nhánh Auth.
            </p>
          </div>

          <button
            @click="handleRefreshSession"
            :disabled="refreshSessionLoading"
            class="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-2 transition-all"
          >
            <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': refreshSessionLoading }" />
            <span>Làm mới Token (Cookie)</span>
          </button>
        </div>

        <div v-if="refreshSessionMessage" class="mt-3 text-xs text-emerald-400 flex items-center gap-1.5">
          <CheckCircle class="w-4 h-4" />
          <span>{{ refreshSessionMessage }}</span>
        </div>
      </div>

      <!-- Grid 2 Columns: User Info & RBAC Testing -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Card 1: User Profile Details -->
        <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5">
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div class="flex items-center gap-2.5">
              <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <UserCheck class="w-5 h-5" />
              </div>
              <h2 class="text-lg font-bold text-white tracking-tight">Thông tin người dùng (User Profile)</h2>
            </div>
            <span class="px-2.5 py-0.5 rounded-full text-xs font-bold"
              :class="authStore.user?.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'"
            >
              {{ authStore.user?.status }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 block mb-1">Mã ID (ObjectId)</span>
              <div class="flex items-center justify-between gap-1 font-mono text-slate-300 text-[11px]">
                <span class="truncate">{{ authStore.user?.id }}</span>
                <button @click="copyUserId" class="text-indigo-400 hover:text-indigo-300 p-1 flex-shrink-0" title="Sao chép ID">
                  <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 block mb-1">Họ và tên</span>
              <span class="text-white font-medium text-sm">{{ authStore.user?.fullName }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 block mb-1">Email</span>
              <span class="text-white font-medium">{{ authStore.user?.email }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 block mb-1">Vai trò hiện tại (RBAC)</span>
              <span class="inline-flex px-2 py-0.5 rounded font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20">
                {{ authStore.user?.role }}
              </span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 flex items-center gap-1 mb-1">
                <Calendar class="w-3 h-3" />
                <span>Ngày sinh</span>
              </span>
              <span class="text-slate-300">{{ formatDate(authStore.user?.dateOfBirth) }}</span>
            </div>

            <div class="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80">
              <span class="text-slate-500 flex items-center gap-1 mb-1">
                <Briefcase class="w-3 h-3" />
                <span>Nghề nghiệp</span>
              </span>
              <span class="text-slate-300">{{ authStore.user?.occupation || 'Chưa cập nhật' }}</span>
            </div>
          </div>

          <div v-if="authStore.user?.interestedCategories && authStore.user.interestedCategories.length" class="pt-2">
            <span class="text-slate-400 text-xs block mb-1.5 font-semibold">Lĩnh vực học quan tâm:</span>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="cat in authStore.user.interestedCategories"
                :key="cat"
                class="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs border border-slate-700"
              >
                {{ cat }}
              </span>
            </div>
          </div>
        </div>

        <!-- Card 2: RBAC Guards Testing -->
        <div class="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-5">
          <div class="flex items-center gap-2.5 border-b border-slate-800/80 pb-4">
            <div class="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Shield class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-lg font-bold text-white tracking-tight">Kiểm tra phân quyền (RBAC Test)</h2>
              <p class="text-slate-400 text-xs">Kiểm tra trực tiếp Guards server với Token hiện tại</p>
            </div>
          </div>

          <!-- Test Button 1: Admin Test -->
          <div class="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-semibold text-white block">1. Endpoint /auth/admin-test</span>
                <span class="text-xs text-slate-400">Yêu cầu quyền: <strong class="text-indigo-400">ADMIN</strong></span>
              </div>
              <button
                @click="handleTestAdmin"
                :disabled="adminTestLoading"
                class="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <span v-if="adminTestLoading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Thực thi API</span>
              </button>
            </div>

            <div v-if="adminTestResult" class="p-3 rounded-xl text-xs font-mono"
              :class="adminTestResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'"
            >
              <div class="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle v-if="adminTestResult.success" class="w-4 h-4 text-emerald-400" />
                <ShieldAlert v-else class="w-4 h-4 text-red-400" />
                <span>{{ adminTestResult.success ? '200 OK - Đủ quyền ADMIN' : `${adminTestResult.statusCode} Forbidden - Bị từ chối` }}</span>
              </div>
              <div>{{ adminTestResult.success ? adminTestResult.data.message : adminTestResult.message }}</div>
            </div>
          </div>

          <!-- Test Button 2: Instructor Test -->
          <div class="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-semibold text-white block">2. Endpoint /auth/instructor-test</span>
                <span class="text-xs text-slate-400">Yêu cầu quyền: <strong class="text-cyan-400">INSTRUCTOR</strong> hoặc <strong class="text-indigo-400">ADMIN</strong></span>
              </div>
              <button
                @click="handleTestInstructor"
                :disabled="instructorTestLoading"
                class="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <span v-if="instructorTestLoading" class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                <span>Thực thi API</span>
              </button>
            </div>

            <div v-if="instructorTestResult" class="p-3 rounded-xl text-xs font-mono"
              :class="instructorTestResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border border-red-500/20 text-red-300'"
            >
              <div class="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle v-if="instructorTestResult.success" class="w-4 h-4 text-emerald-400" />
                <ShieldAlert v-else class="w-4 h-4 text-red-400" />
                <span>{{ instructorTestResult.success ? '200 OK - Đủ quyền truy cập' : `${instructorTestResult.statusCode} Forbidden - Bị từ chối` }}</span>
              </div>
              <div>{{ instructorTestResult.success ? instructorTestResult.data.message : instructorTestResult.message }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 3: Admin Role Assignment Panel -->
      <div class="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-6">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <KeyRound class="w-5 h-5" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-white tracking-tight">Admin Phân quyền tài khoản (Assign Role)</h2>
              <p class="text-slate-400 text-xs mt-0.5">API: <code class="font-mono text-indigo-400">PATCH /api/v1/auth/users/:id/role</code></p>
            </div>
          </div>

          <span
            v-if="authStore.isAdmin"
            class="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5"
          >
            <ShieldCheck class="w-4 h-4" />
            <span>Bạn có quyền ADMIN</span>
          </span>
          <span
            v-else
            class="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center gap-1.5"
          >
            <ShieldAlert class="w-4 h-4" />
            <span>Chỉ ADMIN có thể thực hiện</span>
          </span>
        </div>

        <!-- Success Alert -->
        <div v-if="assignRoleSuccess" class="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle class="w-5 h-5 flex-shrink-0" />
          <span>{{ assignRoleSuccess }}</span>
        </div>

        <!-- Error Alert -->
        <div v-if="assignRoleError" class="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm flex items-center gap-2">
          <ShieldAlert class="w-5 h-5 flex-shrink-0" />
          <span>{{ assignRoleError }}</span>
        </div>

        <form @submit.prevent="handleAssignRole" class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <!-- Target User ID -->
          <div class="md:col-span-2">
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mã ID người dùng cần phân quyền (User ObjectId)
            </label>
            <input
              v-model="targetUserId"
              type="text"
              required
              placeholder="Ví dụ: 6acb43eec401cd8ca514fcfd"
              class="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <!-- New Role Selector -->
          <div>
            <label class="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Chọn vai trò mới
            </label>
            <select
              v-model="selectedNewRole"
              class="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all [color-scheme:dark]"
            >
              <option value="STUDENT">STUDENT (Học viên)</option>
              <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
              <option value="ACCOUNTANT">ACCOUNTANT (Kế toán)</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
            </select>
          </div>

          <!-- Submit Button -->
          <div class="md:col-span-3">
            <button
              type="submit"
              :disabled="assignRoleLoading || !authStore.isAdmin"
              class="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="assignRoleLoading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              <GraduationCap v-else class="w-4 h-4" />
              <span>Cập nhật phân quyền tài khoản</span>
            </button>
            <p v-if="!authStore.isAdmin" class="text-xs text-amber-400 mt-2">
              Lưu ý: Bạn cần đăng nhập bằng tài khoản Quản trị viên (ví dụ: <code class="font-mono">admin@nextcode.vn</code>) để thực hiện chức năng này.
            </p>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>
