<script setup lang="ts">
import { computed, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  CheckCircle2,
  Lock,
  LockOpen,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  UserPlus,
  Users,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { usersApi } from '@/services/users.api';
import type { Role, User, UserStatus } from '@/types/auth';
import type { ManageUserQuery, ManageUserSort, ManageUserStats } from '@/types/user';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const items = ref<User[]>([]);
const total = ref(0);
const totalPages = ref(0);
const stats = ref<ManageUserStats>({
  total: 0,
  students: 0,
  instructors: 0,
  admins: 0,
  locked: 0,
});
const loading = ref(false);
const busyUserId = ref<string | null>(null);
const error = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const keyword = ref(typeof route.query.keyword === 'string' ? route.query.keyword : '');

const createDialogOpen = ref(false);
const creatingUser = ref(false);
const createError = ref<string | null>(null);
const createForm = reactive({
  fullName: '',
  email: '',
  password: '',
  role: 'INSTRUCTOR' as Role,
  occupation: '',
  dateOfBirth: '',
});

const currentPage = computed(() => {
  const parsed = Number(route.query.page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
});

const selectedRole = computed<Role | undefined>(() => {
  const r = route.query.role;
  return r === 'STUDENT' || r === 'INSTRUCTOR' || r === 'ACCOUNTANT' || r === 'ADMIN'
    ? r
    : undefined;
});

const selectedStatus = computed<UserStatus | undefined>(() => {
  const s = route.query.status;
  return s === 'ACTIVE' || s === 'PENDING' || s === 'LOCKED' ? s : undefined;
});

const currentSort = computed<ManageUserSort>(() => {
  const s = route.query.sort;
  return s === 'oldest' || s === 'name_asc' ? s : 'newest';
});

const roleTabs: Array<{ label: string; value?: Role }> = [
  { label: 'Tất cả vai trò' },
  { label: 'Học viên', value: 'STUDENT' },
  { label: 'Giảng viên', value: 'INSTRUCTOR' },
  { label: 'Kế toán', value: 'ACCOUNTANT' },
  { label: 'Quản trị viên', value: 'ADMIN' },
];

function buildQuery(): ManageUserQuery {
  const query: ManageUserQuery = {
    page: currentPage.value,
    limit: 12,
    sort: currentSort.value,
  };
  if (typeof route.query.keyword === 'string' && route.query.keyword.trim()) {
    query.keyword = route.query.keyword.trim();
  }
  if (selectedRole.value) query.role = selectedRole.value;
  if (selectedStatus.value) query.status = selectedStatus.value;
  return query;
}

async function fetchUsers() {
  loading.value = true;
  error.value = null;
  try {
    const res = await usersApi.listManageUsers(buildQuery());
    items.value = res.items;
    total.value = res.total;
    totalPages.value = res.totalPages;
    stats.value = res.stats;
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể tải danh sách người dùng.';
  } finally {
    loading.value = false;
  }
}

watch(
  () => route.fullPath,
  () => {
    keyword.value = typeof route.query.keyword === 'string' ? route.query.keyword : '';
    void fetchUsers();
  },
  { immediate: true },
);

let keywordTimer: ReturnType<typeof setTimeout> | undefined;
watch(keyword, (value) => {
  if (keywordTimer) clearTimeout(keywordTimer);
  keywordTimer = setTimeout(() => {
    void router.replace({
      query: {
        ...route.query,
        keyword: value.trim() || undefined,
        page: undefined,
      },
    });
  }, 300);
});

onUnmounted(() => {
  if (keywordTimer) clearTimeout(keywordTimer);
});

function changeQuery(next: Record<string, string | undefined>) {
  void router.push({ query: { ...route.query, ...next } });
}

function getInitials(fullName: string): string {
  return (fullName || 'NC')
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function formatDate(raw?: string | null): string {
  if (!raw) return '—';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

function roleBadgeClass(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-tint text-brand-soft';
    case 'INSTRUCTOR':
      return 'bg-surface-2 text-ink';
    case 'ACCOUNTANT':
      return 'bg-surface-2 text-amber-200';
    default:
      return 'bg-ground text-muted';
  }
}

function statusBadgeClass(status: UserStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-surface-2 text-emerald-300';
    case 'LOCKED':
      return 'bg-brand-surface text-rose-200';
    default:
      return 'bg-surface-2 text-amber-200';
  }
}

function statusLabel(status: UserStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Hoạt động';
    case 'LOCKED':
      return 'Đã khóa';
    default:
      return 'Chờ OTP';
  }
}

async function handleRoleChange(targetUser: User, nextRole: Role) {
  if (targetUser.role === nextRole) return;
  busyUserId.value = targetUser.id;
  error.value = null;
  successMessage.value = null;
  try {
    const res = await usersApi.updateManageUserRole(targetUser.id, nextRole);
    successMessage.value = res.message;
    await fetchUsers();
  } catch (err: any) {
    error.value =
      err?.response?.data?.message || err?.message || 'Cập nhật vai trò thất bại.';
  } finally {
    busyUserId.value = null;
  }
}

async function handleToggleLock(targetUser: User) {
  const nextStatus: 'ACTIVE' | 'LOCKED' =
    targetUser.status === 'LOCKED' ? 'ACTIVE' : 'LOCKED';
  const confirmText =
    nextStatus === 'LOCKED'
      ? `Khóa tài khoản "${targetUser.fullName}" (${targetUser.email})? Người dùng này sẽ bị đăng xuất khỏi hệ thống.`
      : `Mở khóa tài khoản "${targetUser.fullName}" (${targetUser.email})?`;

  if (!window.confirm(confirmText)) return;

  busyUserId.value = targetUser.id;
  error.value = null;
  successMessage.value = null;
  try {
    const res = await usersApi.updateManageUserStatus(targetUser.id, nextStatus);
    successMessage.value = res.message;
    await fetchUsers();
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      err?.message ||
      'Cập nhật trạng thái tài khoản thất bại.';
  } finally {
    busyUserId.value = null;
  }
}

function openCreateDialog() {
  createError.value = null;
  createForm.fullName = '';
  createForm.email = '';
  createForm.password = '';
  createForm.role = 'INSTRUCTOR';
  createForm.occupation = '';
  createForm.dateOfBirth = '';
  createDialogOpen.value = true;
}

async function submitCreateUser() {
  createError.value = null;
  if (createForm.fullName.trim().length < 2) {
    createError.value = 'Họ và tên phải có từ 2 ký tự trở lên.';
    return;
  }
  if (createForm.password.length < 8) {
    createError.value = 'Mật khẩu phải có ít nhất 8 ký tự.';
    return;
  }

  creatingUser.value = true;
  try {
    const res = await usersApi.createManageUser({
      fullName: createForm.fullName.trim(),
      email: createForm.email.trim(),
      password: createForm.password,
      role: createForm.role,
      occupation: createForm.occupation.trim() || undefined,
      dateOfBirth: createForm.dateOfBirth || undefined,
    });
    createDialogOpen.value = false;
    successMessage.value = res.message;
    await fetchUsers();
  } catch (err: any) {
    createError.value =
      err?.response?.data?.message || err?.message || 'Không thể tạo tài khoản.';
  } finally {
    creatingUser.value = false;
  }
}
</script>

<template>
  <section data-ui class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-medium text-muted">
          Admin Control Center
        </p>
        <h1 class="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
          Quản lý người dùng & Phân quyền
        </h1>
        <p class="mt-1 text-sm text-muted">
          Quản lý toàn bộ tài khoản Học viên, Giảng viên, Kế toán và Quản trị viên trong hệ thống.
        </p>
      </div>
      <button
        type="button"
        class="manage-button-primary"
        @click="openCreateDialog"
      >
        <UserPlus class="h-4 w-4" />
        Tạo tài khoản mới
      </button>
    </div>

    <!-- Stats Summary Cards -->
    <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
      <div class="bg-surface p-4">
        <span class="text-xs font-medium text-muted">Tổng tài khoản</span>
        <p class="mt-1 font-display text-2xl font-normal tabular-nums text-ink">{{ stats.total }}</p>
      </div>
      <div class="bg-surface p-4">
        <span class="text-xs font-medium text-muted">Học viên (STUDENT)</span>
        <p class="mt-1 font-display text-2xl font-normal tabular-nums text-ink">{{ stats.students }}</p>
      </div>
      <div class="bg-surface p-4">
        <span class="text-xs font-medium text-muted">Giảng viên (INSTRUCTOR)</span>
        <p class="mt-1 font-display text-2xl font-normal tabular-nums text-ink">{{ stats.instructors }}</p>
      </div>
      <div class="bg-surface p-4">
        <span class="text-xs font-medium text-muted">Quản trị (ADMIN)</span>
        <p class="mt-1 font-display text-2xl font-normal tabular-nums text-ink">{{ stats.admins }}</p>
      </div>
      <div class="col-span-2 bg-surface p-4 sm:col-span-1">
        <span class="text-xs font-medium text-muted">Đã khóa (LOCKED)</span>
        <p class="mt-1 font-display text-2xl font-normal tabular-nums text-brand-soft">{{ stats.locked }}</p>
      </div>
    </div>

    <!-- Alerts -->
    <div v-if="successMessage" class="manage-alert-success" role="status">
      <CheckCircle2 class="h-4 w-4 shrink-0" />
      <span>{{ successMessage }}</span>
      <button
        type="button"
        class="ml-auto underline"
        @click="successMessage = null"
      >
        Đóng
      </button>
    </div>

    <div v-if="error" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error }}</span>
      <button type="button" class="ml-auto underline" @click="fetchUsers">
        Thử lại
      </button>
    </div>

    <!-- Filter Panel -->
    <div class="bg-surface">
      <div
        class="flex gap-1 overflow-x-auto bg-ground p-1"
        role="tablist"
        aria-label="Lọc theo vai trò"
      >
        <button
          v-for="tab in roleTabs"
          :key="tab.label"
          type="button"
          class="whitespace-nowrap px-3.5 py-2 text-xs font-medium transition-colors"
          :class="
            selectedRole === tab.value && (tab.value !== undefined || !route.query.role)
              ? 'bg-surface-2 text-ink'
              : 'text-muted hover:bg-surface hover:text-ink'
          "
          @click="changeQuery({ role: tab.value, page: undefined })"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-4">
        <label class="relative sm:col-span-2">
          <span class="sr-only">Tìm theo họ tên hoặc email</span>
          <Search
            class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          />
          <input
            v-model="keyword"
            type="search"
            maxlength="100"
            class="manage-input pl-10"
            placeholder="Tìm theo họ tên hoặc email…"
          />
        </label>

        <label>
          <span class="sr-only">Lọc theo trạng thái</span>
          <select
            class="manage-input"
            :value="route.query.status || ''"
            @change="
              changeQuery({
                status: ($event.target as HTMLSelectElement).value || undefined,
                page: undefined,
              })
            "
          >
            <option value="">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
            <option value="LOCKED">Đã khóa (LOCKED)</option>
            <option value="PENDING">Chờ xác thực OTP (PENDING)</option>
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm text-muted">
          <SlidersHorizontal class="h-4 w-4 shrink-0" />
          <span class="sr-only">Sắp xếp người dùng</span>
          <select
            class="manage-input"
            :value="currentSort"
            @change="
              changeQuery({
                sort: ($event.target as HTMLSelectElement).value,
                page: undefined,
              })
            "
          >
            <option value="newest">Mới tham gia</option>
            <option value="oldest">Cũ nhất</option>
            <option value="name_asc">Tên A–Z</option>
          </select>
        </label>
      </div>

      <div
        class="flex items-center justify-between bg-ground px-4 py-2.5 text-xs tabular-nums text-muted sm:px-5"
      >
        <span>{{ total }} người dùng</span>
        <span>Trang {{ currentPage }}{{ totalPages ? ` / ${totalPages}` : '' }}</span>
      </div>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="loading" class="space-y-2 bg-surface p-5" aria-busy="true">
      <div
        v-for="n in 5"
        :key="n"
        class="h-16 bg-surface-2"
      />
    </div>

    <!-- Empty State -->
    <div
      v-else-if="!error && items.length === 0"
      class="bg-surface px-5 py-14 text-center"
    >
      <Users class="mx-auto h-7 w-7 text-muted" />
      <h2 class="mt-3 text-base font-semibold text-ink">Không tìm thấy người dùng</h2>
      <p class="mt-1.5 text-sm text-muted">
        Thử thay đổi bộ lọc hoặc tạo tài khoản mới.
      </p>
    </div>

    <!-- Users Table & Mobile List -->
    <div v-else-if="!loading && !error" class="bg-surface">
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[940px] text-left text-sm">
          <thead class="bg-surface-2 text-xs font-medium text-muted">
            <tr>
              <th class="px-5 py-3.5 font-medium">Người dùng</th>
              <th class="px-4 py-3.5 font-medium">Nghề nghiệp / Ngày sinh</th>
              <th class="px-4 py-3.5 font-medium">Trạng thái</th>
              <th class="px-4 py-3.5 font-medium">Vai trò (Phân quyền)</th>
              <th class="px-4 py-3.5 font-medium">Ngày tạo</th>
              <th class="px-4 py-3.5 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="u in items"
              :key="u.id"
              class="odd:bg-ground even:bg-surface transition-colors hover:bg-surface-2"
            >
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="u.avatar"
                    :src="u.avatar"
                    alt=""
                    class="h-9 w-9 shrink-0 object-cover"
                  />
                  <span
                    v-else
                    class="flex h-9 w-9 shrink-0 items-center justify-center bg-surface-2 text-xs font-semibold text-ink"
                  >
                    {{ getInitials(u.fullName) }}
                  </span>
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <p class="truncate font-medium text-ink">
                        {{ u.fullName }}
                      </p>
                      <span
                        v-if="u.id === authStore.user?.id"
                        class="bg-brand px-2 py-0.5 text-[10px] font-semibold text-white"
                      >
                        Bạn
                      </span>
                    </div>
                    <p class="truncate text-xs text-muted">{{ u.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-xs text-ink">
                <span class="block">{{ u.occupation || 'Chưa cập nhật' }}</span>
                <span class="tabular-nums text-muted">NS: {{ formatDate(u.dateOfBirth) }}</span>
              </td>
              <td class="px-4 py-4">
                <span
                  class="inline-flex px-2.5 py-0.5 text-xs font-medium"
                  :class="statusBadgeClass(u.status)"
                >
                  {{ statusLabel(u.status) }}
                </span>
              </td>
              <td class="px-4 py-4">
                <select
                  :value="u.role"
                  :disabled="busyUserId === u.id || u.id === authStore.user?.id"
                  class="px-3 py-1.5 text-xs font-medium outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark]"
                  :class="roleBadgeClass(u.role)"
                  @change="
                    handleRoleChange(
                      u,
                      ($event.target as HTMLSelectElement).value as Role,
                    )
                  "
                >
                  <option value="STUDENT">STUDENT (Học viên)</option>
                  <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
                  <option value="ACCOUNTANT">ACCOUNTANT (Kế toán)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-xs tabular-nums text-muted">
                {{ formatDate(u.createdAt) }}
              </td>
              <td class="px-4 py-4 text-right">
                <button
                  v-if="u.id !== authStore.user?.id"
                  type="button"
                  :disabled="busyUserId === u.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                  :class="
                    u.status === 'LOCKED'
                      ? 'bg-surface-2 text-emerald-300 hover:bg-ground'
                      : 'bg-brand-surface text-rose-200 hover:bg-[#fbd0d0]'
                  "
                  @click="handleToggleLock(u)"
                >
                  <LockOpen v-if="u.status === 'LOCKED'" class="h-3.5 w-3.5" />
                  <Lock v-else class="h-3.5 w-3.5" />
                  {{ u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa' }}
                </button>
                <span v-else class="inline-flex items-center gap-1 text-xs text-muted">
                  <ShieldCheck class="h-4 w-4 text-brand-soft" />
                  Tài khoản hiện tại
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="space-y-2 p-3 lg:hidden">
        <article
          v-for="u in items"
          :key="u.id"
          class="space-y-3 bg-ground p-4"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex min-w-0 items-center gap-3">
              <img
                v-if="u.avatar"
                :src="u.avatar"
                alt=""
                class="h-9 w-9 shrink-0 object-cover"
              />
              <span
                v-else
                class="flex h-9 w-9 shrink-0 items-center justify-center bg-surface-2 text-xs font-semibold text-ink"
              >
                {{ getInitials(u.fullName) }}
              </span>
              <div class="min-w-0">
                <p class="truncate font-medium text-ink">{{ u.fullName }}</p>
                <p class="truncate text-xs text-muted">{{ u.email }}</p>
              </div>
            </div>
            <span
              class="shrink-0 px-2.5 py-0.5 text-xs font-medium"
              :class="statusBadgeClass(u.status)"
            >
              {{ statusLabel(u.status) }}
            </span>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
            <select
              :value="u.role"
              :disabled="busyUserId === u.id || u.id === authStore.user?.id"
              class="px-3 py-1.5 text-xs font-medium outline-none [color-scheme:dark]"
              :class="roleBadgeClass(u.role)"
              @change="
                handleRoleChange(
                  u,
                  ($event.target as HTMLSelectElement).value as Role,
                )
              "
            >
              <option value="STUDENT">STUDENT (Học viên)</option>
              <option value="INSTRUCTOR">INSTRUCTOR (Giảng viên)</option>
              <option value="ACCOUNTANT">ACCOUNTANT (Kế toán)</option>
              <option value="ADMIN">ADMIN (Quản trị viên)</option>
            </select>

            <button
              v-if="u.id !== authStore.user?.id"
              type="button"
              :disabled="busyUserId === u.id"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
              :class="
                u.status === 'LOCKED'
                  ? 'bg-surface-2 text-emerald-300'
                  : 'bg-brand-surface text-rose-200'
              "
              @click="handleToggleLock(u)"
            >
              <LockOpen v-if="u.status === 'LOCKED'" class="h-3.5 w-3.5" />
              <Lock v-else class="h-3.5 w-3.5" />
              {{ u.status === 'LOCKED' ? 'Mở khóa' : 'Khóa' }}
            </button>
          </div>
        </article>
      </div>
    </div>

    <!-- Pagination -->
    <div
      v-if="!loading && totalPages > 1"
      class="flex items-center justify-center gap-3"
    >
      <button
        type="button"
        class="manage-button-secondary"
        :disabled="currentPage <= 1"
        @click="changeQuery({ page: String(currentPage - 1) })"
      >
        Trước
      </button>
      <span class="text-sm tabular-nums text-muted">{{ currentPage }} / {{ totalPages }}</span>
      <button
        type="button"
        class="manage-button-secondary"
        :disabled="currentPage >= totalPages"
        @click="changeQuery({ page: String(currentPage + 1) })"
      >
        Tiếp
      </button>
    </div>

    <!-- Create User Modal Dialog -->
    <div
      v-if="createDialogOpen"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-user-title"
    >
      <div class="w-full max-w-lg bg-surface p-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 id="create-user-title" class="text-lg font-semibold text-ink">
              Tạo tài khoản mới
            </h2>
            <p class="mt-0.5 text-xs text-muted">
              Tài khoản do Admin tạo sẽ được kích hoạt (ACTIVE) ngay lập tức.
            </p>
          </div>
          <button
            type="button"
            class="p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Đóng hộp thoại"
            @click="createDialogOpen = false"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <form class="mt-5 space-y-4" @submit.prevent="submitCreateUser">
          <div
            v-if="createError"
            class="manage-alert-error"
          >
            <AlertCircle class="h-4 w-4 shrink-0" />
            <span>{{ createError }}</span>
          </div>

          <label class="manage-field">
            <span>Họ và tên <span class="text-brand-soft">*</span></span>
            <input
              v-model="createForm.fullName"
              type="text"
              required
              minlength="2"
              maxlength="100"
              placeholder="Ví dụ: Nguyễn Minh An"
              class="manage-input"
            />
          </label>

          <label class="manage-field">
            <span>Email đăng nhập <span class="text-brand-soft">*</span></span>
            <input
              v-model="createForm.email"
              type="email"
              required
              placeholder="instructor@nextcode.vn"
              class="manage-input"
            />
          </label>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="manage-field">
              <span>Mật khẩu khởi tạo <span class="text-brand-soft">*</span></span>
              <input
                v-model="createForm.password"
                type="password"
                required
                minlength="8"
                maxlength="64"
                placeholder="Ít nhất 8 ký tự"
                class="manage-input"
              />
            </label>

            <label class="manage-field">
              <span>Vai trò (RBAC) <span class="text-brand-soft">*</span></span>
              <select v-model="createForm.role" class="manage-input">
                <option value="INSTRUCTOR">Giảng viên (INSTRUCTOR)</option>
                <option value="STUDENT">Học viên (STUDENT)</option>
                <option value="ACCOUNTANT">Kế toán (ACCOUNTANT)</option>
                <option value="ADMIN">Quản trị viên (ADMIN)</option>
              </select>
            </label>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <label class="manage-field">
              <span>Nghề nghiệp / Chuyên môn</span>
              <input
                v-model="createForm.occupation"
                type="text"
                maxlength="150"
                placeholder="Giảng viên Backend"
                class="manage-input"
              />
            </label>

            <label class="manage-field">
              <span>Ngày sinh</span>
              <input
                v-model="createForm.dateOfBirth"
                type="date"
                class="manage-input [color-scheme:dark]"
              />
            </label>
          </div>

          <div class="flex justify-end gap-3 pt-4">
            <button
              type="button"
              class="manage-button-secondary"
              :disabled="creatingUser"
              @click="createDialogOpen = false"
            >
              Hủy
            </button>
            <button
              type="submit"
              class="manage-button-primary"
              :disabled="creatingUser"
            >
              {{ creatingUser ? 'Đang tạo...' : 'Tạo tài khoản' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </section>
</template>
