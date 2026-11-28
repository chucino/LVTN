<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CreditCard,
  PieChart,
  PlayCircle,
  Users,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { manageCourseService } from '@/services/manage-courses.api';
import { ordersApi } from '@/services/orders.api';
import { usersApi } from '@/services/users.api';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';
import CourseStatusBadge from '@/components/manage/CourseStatusBadge.vue';
import ManageCourseThumbnail from '@/components/manage/ManageCourseThumbnail.vue';
import type { ManageCourseItem } from '@/types/manage-course';
import type { ManageOrdersStats } from '@/types/order';
import type { ManageUserStats } from '@/types/user';

const DONUT_RADIUS = 42;
const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');

const loading = ref(false);
const error = ref<string | null>(null);

const recentCourses = ref<ManageCourseItem[]>([]);
const courseCounts = ref({
  total: 0,
  draft: 0,
  pending: 0,
  approved: 0,
  hidden: 0,
});

const userStats = ref<ManageUserStats>({
  total: 0,
  students: 0,
  instructors: 0,
  admins: 0,
  locked: 0,
});

const orderStats = ref<ManageOrdersStats>({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
});

const courseChartSegments = computed(() => {
  const total = courseCounts.value.total;
  const rawItems = [
    {
      key: 'approved',
      label: 'Đã duyệt xuất bản',
      count: courseCounts.value.approved,
      color: '#059669',
      dotClass: 'bg-[#059669]',
      barClass: 'bg-[#059669]',
    },
    {
      key: 'draft',
      label: 'Đang biên soạn (Nháp)',
      count: courseCounts.value.draft,
      color: '#2563eb',
      dotClass: 'bg-[#2563eb]',
      barClass: 'bg-[#2563eb]',
    },
    {
      key: 'pending',
      label: 'Chờ phê duyệt',
      count: courseCounts.value.pending,
      color: '#d97706',
      dotClass: 'bg-[#d97706]',
      barClass: 'bg-[#d97706]',
    },
    {
      key: 'hidden',
      label: 'Đã ẩn',
      count: courseCounts.value.hidden,
      color: '#64748b',
      dotClass: 'bg-[#64748b]',
      barClass: 'bg-[#64748b]',
    },
  ];

  let accLength = 0;
  return rawItems.map((item) => {
    const ratio = total > 0 ? item.count / total : 0;
    const percent = Math.round(ratio * 100);
    const segmentLength = ratio * DONUT_CIRCUMFERENCE;
    const dashArray = `${segmentLength} ${DONUT_CIRCUMFERENCE}`;
    const dashOffset = -accLength;
    accLength += segmentLength;
    return {
      ...item,
      percent,
      dashArray,
      dashOffset,
    };
  });
});

const userChartBars = computed(() => {
  const total = userStats.value.total;
  const items = [
    {
      key: 'students',
      label: 'Học viên (STUDENT)',
      count: userStats.value.students,
      barClass: 'bg-[#2563eb]',
    },
    {
      key: 'instructors',
      label: 'Giảng viên (INSTRUCTOR)',
      count: userStats.value.instructors,
      barClass: 'bg-[#0f766e]',
    },
    {
      key: 'admins',
      label: 'Quản trị (ADMIN)',
      count: userStats.value.admins,
      barClass: 'bg-[#4f46e5]',
    },
    {
      key: 'locked',
      label: 'Đã khóa (LOCKED)',
      count: userStats.value.locked,
      barClass: 'bg-[#e11d48]',
    },
  ];

  return items.map((item) => {
    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
    const widthPercent = total > 0 ? Math.max(item.count > 0 ? 6 : 0, percent) : 0;
    return {
      ...item,
      percent,
      widthPercent,
    };
  });
});

const orderCompletionRate = computed(() => {
  const total = orderStats.value.totalOrders;
  if (total <= 0) return 0;
  return Math.round((orderStats.value.completedOrders / total) * 100);
});

const orderChartColumns = computed(() => {
  const total = orderStats.value.totalOrders;
  const maxCount = Math.max(
    1,
    orderStats.value.completedOrders,
    orderStats.value.pendingOrders,
    orderStats.value.cancelledOrders,
  );
  const items = [
    {
      key: 'completed',
      label: 'Hoàn tất',
      count: orderStats.value.completedOrders,
      barClass: 'bg-[#059669]',
      textClass: 'text-[#047857]',
    },
    {
      key: 'pending',
      label: 'Chờ thanh toán',
      count: orderStats.value.pendingOrders,
      barClass: 'bg-[#d97706]',
      textClass: 'text-[#b45309]',
    },
    {
      key: 'cancelled',
      label: 'Đã hủy / Hết hạn',
      count: orderStats.value.cancelledOrders,
      barClass: 'bg-[#94a3b8]',
      textClass: 'text-muted',
    },
  ];

  return items.map((item) => {
    const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
    const heightPercent =
      item.count > 0 ? Math.max(16, Math.round((item.count / maxCount) * 100)) : 6;
    return {
      ...item,
      percent,
      heightPercent,
    };
  });
});

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

async function loadDashboardData(silent: boolean | Event = false) {
  const isSilent = silent === true;
  if (!isSilent) {
    loading.value = true;
    error.value = null;
  }
  try {
    const [allRes, draftRes, pendingRes, approvedRes, hiddenRes] = await Promise.all([
      manageCourseService.list({ page: 1, limit: 5, sort: 'updated_desc' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'DRAFT' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'PENDING' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'APPROVED' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'HIDDEN' }).catch(() => ({
        total: 0,
      })),
    ]);

    recentCourses.value = allRes.items;
    courseCounts.value = {
      total: allRes.total,
      draft: draftRes.total,
      pending: pendingRes.total,
      approved: approvedRes.total,
      hidden: hiddenRes.total,
    };

    if (isAdmin.value) {
      const [usersRes, ordersRes] = await Promise.all([
        usersApi.listManageUsers({ page: 1, limit: 1 }),
        ordersApi
          .getManageOrders({ page: 1, limit: 1 })
          .catch(() => ({ stats: orderStats.value })),
      ]);
      userStats.value = usersRes.stats;
      orderStats.value = ordersRes.stats;
    }
  } catch (err: any) {
    if (!isSilent) {
      error.value =
        err?.response?.data?.message ||
        err?.message ||
        'Không thể tải dữ liệu tổng quan quản trị.';
    }
  } finally {
    if (!isSilent) {
      loading.value = false;
    }
  }
}

let dashboardSyncChannel: BroadcastChannel | null = null;
let lastDashboardRefreshAt = 0;

function handleDashboardFocus() {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
    return;
  }
  const now = Date.now();
  if (now - lastDashboardRefreshAt < 2500) return;
  lastDashboardRefreshAt = now;
  void loadDashboardData(true);
}

onMounted(() => {
  lastDashboardRefreshAt = Date.now();
  void loadDashboardData(false);
  window.addEventListener('focus', handleDashboardFocus);
  document.addEventListener('visibilitychange', handleDashboardFocus);

  if (typeof BroadcastChannel !== 'undefined') {
    try {
      dashboardSyncChannel = new BroadcastChannel('nextcode-manage-course-sync');
      dashboardSyncChannel.onmessage = () => {
        lastDashboardRefreshAt = Date.now();
        void loadDashboardData(true);
      };
    } catch {
      dashboardSyncChannel = null;
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', handleDashboardFocus);
  document.removeEventListener('visibilitychange', handleDashboardFocus);
  if (dashboardSyncChannel) {
    dashboardSyncChannel.close();
    dashboardSyncChannel = null;
  }
});
</script>

<template>
  <section data-ui class="space-y-8">
    <!-- Top Workspace Header (Đã lược bỏ các nút lối tắt và dòng mô tả thừa) -->
    <div class="bg-surface p-6 sm:p-8">
      <p class="text-xs font-medium text-muted">
        {{ isAdmin ? 'Hệ thống Quản trị NextCode' : 'Không gian Giảng viên NextCode' }}
      </p>
      <h1 class="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
        Xin chào, {{ authStore.user?.fullName }}
      </h1>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error }}</span>
      <button type="button" class="ml-auto underline" @click="loadDashboardData">
        Thử lại
      </button>
    </div>

    <!-- Course Overview KPIs -->
    <div>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">
          {{ isAdmin ? 'Thống kê khóa học toàn hệ thống' : 'Thống kê khóa học được phân công' }}
        </h2>
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Xem tất cả khóa học
          <ArrowRight class="h-3.5 w-3.5" />
        </router-link>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">
            {{ isAdmin ? 'Tổng số khóa học' : 'Khóa được phân công' }}
          </span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-ink">
            {{ courseCounts.total }}
          </p>
          <p class="mt-1 text-xs text-muted">Tất cả trạng thái</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'DRAFT' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Đang biên soạn (Nháp)</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-ink">
            {{ courseCounts.draft }}
          </p>
          <p class="mt-1 text-xs text-muted">Cần hoàn thiện nội dung</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'PENDING' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Chờ phê duyệt</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-amber-300">
            {{ courseCounts.pending }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ isAdmin ? 'Đang chờ Admin kiểm duyệt' : 'Đang chờ Admin phản hồi' }}
          </p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'APPROVED' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Đã duyệt xuất bản</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-emerald-300">
            {{ courseCounts.approved }}
          </p>
          <p class="mt-1 text-xs text-muted">Đang hiển thị công khai</p>
        </router-link>
      </div>
    </div>

    <!-- Admin-only User Overview KPIs -->
    <div v-if="isAdmin">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">Thống kê người dùng & phân quyền</h2>
        <router-link
          :to="{ name: 'ManageUsers' }"
          class="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Quản lý người dùng
          <ArrowRight class="h-3.5 w-3.5" />
        </router-link>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <router-link
          :to="{ name: 'ManageUsers' }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Tổng tài khoản</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.total }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'STUDENT' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Học viên (STUDENT)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.students }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'INSTRUCTOR' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Giảng viên (INSTRUCTOR)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.instructors }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'ADMIN' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Quản trị (ADMIN)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.admins }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { status: 'LOCKED' } }"
          class="col-span-2 bg-surface p-4 transition-colors hover:bg-surface-2 sm:col-span-1"
        >
          <span class="text-xs font-medium text-muted">Đã khóa (LOCKED)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-brand-soft">{{ userStats.locked }}</p>
        </router-link>
      </div>
    </div>

    <!-- Khu vực Biểu đồ trực quan (Admin: 3 biểu đồ toàn diện | Giảng viên: 2 biểu đồ khóa học) -->
    <div>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">
          {{ isAdmin ? 'Biểu đồ phân tích hệ thống' : 'Biểu đồ trạng thái khóa học được phân công' }}
        </h2>
      </div>

      <!-- Admin: Bộ 3 biểu đồ -->
      <div v-if="isAdmin" class="grid gap-4 lg:grid-cols-3">
        <!-- Biểu đồ 1: Phân bổ trạng thái khóa học (Donut SVG) -->
        <div class="flex flex-col justify-between bg-surface p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink">Tỷ lệ trạng thái khóa học</span>
            <PieChart class="h-4 w-4 text-brand-soft" />
          </div>

          <div class="my-5 flex items-center gap-5">
            <div class="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  :r="DONUT_RADIUS"
                  fill="none"
                  stroke="#eef2f8"
                  stroke-width="12"
                />
                <circle
                  v-for="seg in courseChartSegments"
                  :key="seg.key"
                  cx="50"
                  cy="50"
                  :r="DONUT_RADIUS"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="12"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                  stroke-linecap="butt"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold tabular-nums text-ink">
                  {{ courseCounts.total }}
                </span>
                <span class="text-[10px] font-medium text-muted">Khóa học</span>
              </div>
            </div>

            <div class="min-w-0 flex-1 space-y-2">
              <div
                v-for="seg in courseChartSegments"
                :key="seg.key"
                class="flex items-center justify-between gap-2 text-xs"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="seg.dotClass" />
                  <span class="truncate text-muted">{{ seg.label }}</span>
                </div>
                <span class="shrink-0 font-bold tabular-nums text-ink">
                  {{ seg.count }} ({{ seg.percent }}%)
                </span>
              </div>
            </div>
          </div>

          <div class="border-t border-surface-3 pt-3 text-xs text-muted">
            Tỷ lệ đã xuất bản công khai:
            <strong class="tabular-nums text-ink">
              {{ courseChartSegments[0]?.percent ?? 0 }}%
            </strong>
          </div>
        </div>

        <!-- Biểu đồ 2: Cơ cấu tài khoản người dùng (Horizontal Bars) -->
        <div class="flex flex-col justify-between bg-surface p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink">Cơ cấu tài khoản theo vai trò</span>
            <Users class="h-4 w-4 text-brand-soft" />
          </div>

          <div class="my-5 space-y-3.5">
            <div v-for="bar in userChartBars" :key="bar.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-muted">{{ bar.label }}</span>
                <span class="font-bold tabular-nums text-ink">
                  {{ bar.count }} ({{ bar.percent }}%)
                </span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="bar.barClass"
                  :style="{ width: `${bar.widthPercent}%` }"
                />
              </div>
            </div>
          </div>

          <div class="border-t border-surface-3 pt-3 text-xs text-muted">
            Tổng số tài khoản trên hệ thống:
            <strong class="tabular-nums text-ink">{{ userStats.total }}</strong>
          </div>
        </div>

        <!-- Biểu đồ 3: Tình trạng đơn hàng & Doanh thu khóa học Pro (Column Chart) -->
        <div class="flex flex-col justify-between bg-surface p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink">Đơn hàng & Doanh thu khóa Pro</span>
            <CreditCard class="h-4 w-4 text-brand-soft" />
          </div>

          <div class="mt-3 flex items-baseline justify-between bg-ground px-3.5 py-2.5">
            <span class="text-xs font-medium text-muted">Doanh thu thực nhận</span>
            <span class="text-base font-extrabold tabular-nums text-[#f05123]">
              {{ formatCoursePrice(orderStats.totalRevenue) }}
            </span>
          </div>

          <div class="my-4 grid h-28 grid-cols-3 items-end gap-3 px-2 pt-4">
            <div
              v-for="col in orderChartColumns"
              :key="col.key"
              class="flex h-full flex-col items-center justify-end"
            >
              <span class="mb-1 text-xs font-extrabold tabular-nums" :class="col.textClass">
                {{ col.count }}
              </span>
              <div class="flex h-16 w-full items-end justify-center bg-surface-2 p-1">
                <div
                  class="w-full transition-all duration-300"
                  :class="col.barClass"
                  :style="{ height: `${col.heightPercent}%` }"
                />
              </div>
              <span class="mt-1.5 truncate text-[11px] font-medium text-muted">
                {{ col.label }}
              </span>
            </div>
          </div>

          <div class="border-t border-surface-3 pt-3 text-xs text-muted">
            Tổng {{ orderStats.totalOrders }} đơn · Tỷ lệ hoàn tất:
            <strong class="tabular-nums text-teal">{{ orderCompletionRate }}%</strong>
          </div>
        </div>
      </div>

      <!-- Giảng viên: Bộ 2 biểu đồ khóa học được phân công -->
      <div v-else class="grid gap-4 lg:grid-cols-2">
        <div class="flex flex-col justify-between bg-surface p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink">Phân bổ trạng thái khóa học</span>
            <PieChart class="h-4 w-4 text-brand-soft" />
          </div>

          <div class="my-5 flex items-center gap-6">
            <div class="relative h-28 w-28 shrink-0">
              <svg viewBox="0 0 100 100" class="h-full w-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  :r="DONUT_RADIUS"
                  fill="none"
                  stroke="#eef2f8"
                  stroke-width="12"
                />
                <circle
                  v-for="seg in courseChartSegments"
                  :key="seg.key"
                  cx="50"
                  cy="50"
                  :r="DONUT_RADIUS"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="12"
                  :stroke-dasharray="seg.dashArray"
                  :stroke-dashoffset="seg.dashOffset"
                  stroke-linecap="butt"
                />
              </svg>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span class="text-xl font-extrabold tabular-nums text-ink">
                  {{ courseCounts.total }}
                </span>
                <span class="text-[10px] font-medium text-muted">Khóa học</span>
              </div>
            </div>

            <div class="min-w-0 flex-1 space-y-2">
              <div
                v-for="seg in courseChartSegments"
                :key="seg.key"
                class="flex items-center justify-between gap-2 text-xs"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <span class="h-2.5 w-2.5 shrink-0 rounded-full" :class="seg.dotClass" />
                  <span class="truncate text-muted">{{ seg.label }}</span>
                </div>
                <span class="shrink-0 font-bold tabular-nums text-ink">
                  {{ seg.count }} ({{ seg.percent }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-between bg-surface p-5">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-ink">Tiến độ biên soạn & xuất bản</span>
            <BarChart3 class="h-4 w-4 text-brand-soft" />
          </div>

          <div class="my-5 space-y-3.5">
            <div v-for="seg in courseChartSegments" :key="seg.key" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-muted">{{ seg.label }}</span>
                <span class="font-bold tabular-nums text-ink">
                  {{ seg.count }} khóa ({{ seg.percent }}%)
                </span>
              </div>
              <div class="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  class="h-full rounded-full transition-all duration-300"
                  :class="seg.barClass"
                  :style="{ width: `${Math.max(seg.count > 0 ? 6 : 0, seg.percent)}%` }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Courses List -->
    <div class="bg-surface">
      <div class="flex items-center justify-between px-5 py-4">
        <h2 class="text-sm font-semibold text-ink">
          {{ isAdmin ? 'Khóa học cập nhật gần đây' : 'Khóa học được phân công gần đây' }}
        </h2>
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Mở danh sách đầy đủ
        </router-link>
      </div>

      <div v-if="loading" class="space-y-2 p-5" aria-busy="true">
        <div v-for="n in 3" :key="n" class="h-16 bg-surface-2" />
      </div>

      <div
        v-else-if="recentCourses.length === 0"
        class="bg-ground px-5 py-12 text-center text-sm text-muted"
      >
        {{
          isAdmin
            ? 'Chưa có khóa học nào trong hệ thống. Hãy tạo khóa học nền đầu tiên.'
            : 'Bạn chưa được phân công khóa học nào.'
        }}
      </div>

      <div v-else class="space-y-1 p-2">
        <div
          v-for="course in recentCourses"
          :key="course.id"
          class="flex flex-col justify-between gap-4 bg-ground px-4 py-3.5 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 items-center gap-3.5">
            <ManageCourseThumbnail :src="course.thumbnail" :title="course.title" />
            <div class="min-w-0">
              <router-link
                :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
                class="line-clamp-1 font-medium text-ink hover:text-brand-soft"
              >
                {{ course.title }}
              </router-link>
              <p class="mt-1 truncate text-xs tabular-nums text-muted">
                {{ course.category.name }} ·
                {{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }}
                · {{ course.totalChapters }} chương · {{ course.totalLessons }} bài ({{ formatCourseDuration(course.totalDuration) }})
                <template v-if="isAdmin"> · GV: {{ course.instructor.fullName }}</template>
              </p>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 sm:justify-end">
            <CourseStatusBadge :status="course.status" />
            <span class="text-xs tabular-nums text-muted">{{ formatUpdatedAt(course.updatedAt) }}</span>
            <router-link
              v-if="course.totalLessons > 0"
              :to="{ name: 'CourseLearning', params: { courseId: course.id } }"
              class="manage-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              title="Xem khóa học"
            >
              <PlayCircle class="h-3.5 w-3.5 text-brand-soft" />
              <span>Xem khóa học</span>
            </router-link>
            <router-link
              :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
              class="manage-button-secondary px-3 py-1.5 text-xs"
            >
              {{ isAdmin ? 'Quản lý' : 'Biên soạn' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
