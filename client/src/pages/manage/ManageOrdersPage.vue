<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  RefreshCw,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-vue-next';
import { formatCoursePrice, getCourseErrorMessage } from '@/lib/course-format';
import { ordersApi } from '@/services/orders.api';
import type {
  ManageOrdersStats,
  OrderDetail,
  OrderStatus,
} from '@/types/order';

const orders = ref<OrderDetail[]>([]);
const stats = ref<ManageOrdersStats>({
  totalOrders: 0,
  completedOrders: 0,
  pendingOrders: 0,
  cancelledOrders: 0,
  totalRevenue: 0,
});
const loading = ref(true);
const error = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);
const actionError = ref<string | null>(null);

const keyword = ref('');
const statusFilter = ref<'ALL' | OrderStatus>('ALL');
const page = ref(1);
const totalPages = ref(1);
const total = ref(0);
const processingOrderId = ref<string | null>(null);

function formatDateTime(iso?: string | null): string {
  if (!iso) return 'Chưa có';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Chưa có';
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadgeLabel(status: OrderStatus): string {
  switch (status) {
    case 'COMPLETED':
      return 'Hoàn tất';
    case 'PENDING':
      return 'Chờ thanh toán';
    case 'EXPIRED':
      return 'Quá hạn';
    case 'CANCELLED':
    default:
      return 'Đã hủy';
  }
}

async function fetchOrders(targetPage = page.value): Promise<void> {
  loading.value = true;
  error.value = null;
  page.value = targetPage;

  try {
    const res = await ordersApi.getManageOrders({
      keyword: keyword.value.trim() || undefined,
      status: statusFilter.value === 'ALL' ? undefined : statusFilter.value,
      page: targetPage,
      limit: 12,
    });
    orders.value = res.items;
    stats.value = res.stats;
    total.value = res.total;
    totalPages.value = res.totalPages;
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function handleSearch(): void {
  void fetchOrders(1);
}

function selectStatus(nextStatus: 'ALL' | OrderStatus): void {
  statusFilter.value = nextStatus;
  void fetchOrders(1);
}

async function handleSyncOrder(order: OrderDetail): Promise<void> {
  if (processingOrderId.value) return;
  processingOrderId.value = order.id;
  actionError.value = null;
  actionSuccess.value = null;

  try {
    const updated = await ordersApi.syncOrderPayment(order.id);
    if (updated.status === 'COMPLETED') {
      actionSuccess.value = `Đơn ${order.orderCode} đã được đồng bộ hoàn tất từ payOS và mở quyền học.`;
    } else {
      actionSuccess.value = `Đã đồng bộ đơn ${order.orderCode} từ payOS (trạng thái hiện tại: ${statusBadgeLabel(updated.status)}).`;
    }
    await fetchOrders(page.value);
  } catch (err) {
    actionError.value = getCourseErrorMessage(err);
  } finally {
    processingOrderId.value = null;
  }
}

async function handleManualConfirm(order: OrderDetail): Promise<void> {
  if (processingOrderId.value) return;
  processingOrderId.value = order.id;
  actionError.value = null;
  actionSuccess.value = null;

  try {
    await ordersApi.confirmOrderManually(order.id);
    actionSuccess.value = `Đã xác nhận thanh toán thủ công cho đơn ${order.orderCode} và cấp quyền học khóa Pro.`;
    await fetchOrders(page.value);
  } catch (err) {
    actionError.value = getCourseErrorMessage(err);
  } finally {
    processingOrderId.value = null;
  }
}

onMounted(() => {
  void fetchOrders(1);
});
</script>

<template>
  <div data-ui class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-surface p-6">
      <div>
        <h1 class="text-2xl font-bold text-ink">
          Quản lý đơn hàng & Đối soát thanh toán
        </h1>
        <p class="mt-1 text-sm text-muted">
          Theo dõi giao dịch khóa học Pro qua cổng VietQR payOS, đối soát tự động hoặc xác nhận thủ công.
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="manage-button-secondary"
        @click="fetchOrders(page)"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        <span>Làm mới dữ liệu</span>
      </button>
    </div>

    <!-- Thống kê tổng quan -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="bg-surface p-5">
        <p class="text-xs font-medium text-muted">Tổng doanh thu thực nhận</p>
        <p class="mt-2 text-2xl font-extrabold tabular-nums text-[#f05123]">
          {{ formatCoursePrice(stats.totalRevenue) }}
        </p>
      </div>
      <div class="bg-surface p-5">
        <p class="text-xs font-medium text-muted">Tổng số đơn hàng</p>
        <p class="mt-2 text-2xl font-extrabold tabular-nums text-ink">
          {{ stats.totalOrders }}
        </p>
      </div>
      <div class="bg-surface p-5">
        <p class="text-xs font-medium text-muted">Đơn đã hoàn tất</p>
        <p class="mt-2 text-2xl font-extrabold tabular-nums text-teal">
          {{ stats.completedOrders }}
        </p>
      </div>
      <div class="bg-surface p-5">
        <p class="text-xs font-medium text-muted">Đang chờ thanh toán</p>
        <p class="mt-2 text-2xl font-extrabold tabular-nums text-amber-400">
          {{ stats.pendingOrders }}
        </p>
      </div>
    </div>

    <!-- Thông báo -->
    <div v-if="actionSuccess" class="manage-alert-success" role="status">
      <CheckCircle2 class="h-5 w-5 shrink-0" />
      <span>{{ actionSuccess }}</span>
    </div>
    <div v-if="actionError || error" class="manage-alert-error" role="alert">
      <AlertCircle class="h-5 w-5 shrink-0" />
      <span>{{ actionError || error }}</span>
    </div>

    <!-- Thanh lọc & tìm kiếm -->
    <div class="flex flex-col justify-between gap-4 bg-surface p-5 lg:flex-row lg:items-center">
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="px-3.5 py-2 text-xs font-semibold transition-colors"
          :class="
            statusFilter === 'ALL'
              ? 'bg-brand text-white'
              : 'bg-ground text-ink hover:bg-surface-2'
          "
          @click="selectStatus('ALL')"
        >
          Tất cả ({{ stats.totalOrders }})
        </button>
        <button
          type="button"
          class="px-3.5 py-2 text-xs font-semibold transition-colors"
          :class="
            statusFilter === 'PENDING'
              ? 'bg-brand text-white'
              : 'bg-ground text-ink hover:bg-surface-2'
          "
          @click="selectStatus('PENDING')"
        >
          Chờ thanh toán ({{ stats.pendingOrders }})
        </button>
        <button
          type="button"
          class="px-3.5 py-2 text-xs font-semibold transition-colors"
          :class="
            statusFilter === 'COMPLETED'
              ? 'bg-brand text-white'
              : 'bg-ground text-ink hover:bg-surface-2'
          "
          @click="selectStatus('COMPLETED')"
        >
          Hoàn tất ({{ stats.completedOrders }})
        </button>
        <button
          type="button"
          class="px-3.5 py-2 text-xs font-semibold transition-colors"
          :class="
            statusFilter === 'CANCELLED'
              ? 'bg-brand text-white'
              : 'bg-ground text-ink hover:bg-surface-2'
          "
          @click="selectStatus('CANCELLED')"
        >
          Đã hủy
        </button>
      </div>

      <form class="flex gap-2 sm:w-96" @submit.prevent="handleSearch">
        <input
          v-model="keyword"
          type="text"
          placeholder="Tìm mã đơn, tên/email học viên, khóa học..."
          class="manage-input flex-1 text-xs"
        />
        <button type="submit" class="manage-button-secondary shrink-0 text-xs">
          <Search class="h-4 w-4" />
          <span>Tìm kiếm</span>
        </button>
      </form>
    </div>

    <!-- Bảng đơn hàng -->
    <div class="overflow-x-auto bg-surface">
      <div v-if="loading" class="p-8 text-center text-sm text-muted">
        Đang tải danh sách đơn hàng...
      </div>

      <div
        v-else-if="orders.length === 0"
        class="flex flex-col items-center justify-center p-14 text-center"
      >
        <CreditCard class="h-8 w-8 text-muted" />
        <p class="mt-3 text-base font-semibold text-ink">
          Chưa có đơn hàng nào phù hợp
        </p>
        <p class="mt-1 text-xs text-muted">
          Các đơn đăng ký khóa học Pro của học viên sẽ xuất hiện tại đây.
        </p>
      </div>

      <table v-else class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="bg-ground text-xs font-semibold text-muted">
            <th class="px-4 py-3.5">Mã đơn</th>
            <th class="px-4 py-3.5">Học viên</th>
            <th class="px-4 py-3.5">Khóa học Pro</th>
            <th class="px-4 py-3.5">Số tiền</th>
            <th class="px-4 py-3.5">Phương thức</th>
            <th class="px-4 py-3.5">Trạng thái</th>
            <th class="px-4 py-3.5">Thời gian</th>
            <th class="px-4 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in orders"
            :key="item.id"
            class="transition-colors even:bg-ground/50 hover:bg-surface-2"
          >
            <td class="px-4 py-4 align-top">
              <p class="font-bold tabular-nums text-brand-soft">
                {{ item.orderCode }}
              </p>
              <p class="mt-0.5 text-xs tabular-nums text-muted">
                payOS: {{ item.payosOrderCode }}
              </p>
            </td>

            <td class="px-4 py-4 align-top">
              <p class="font-semibold text-ink">{{ item.studentName }}</p>
              <p class="mt-0.5 text-xs text-muted">{{ item.studentEmail }}</p>
            </td>

            <td class="max-w-xs px-4 py-4 align-top">
              <p class="line-clamp-2 font-medium text-ink">
                {{ item.courseTitle }}
              </p>
              <p
                v-if="item.couponCode"
                class="mt-1 text-xs font-semibold text-teal"
              >
                Mã ưu đãi: {{ item.couponCode }} (-{{ formatCoursePrice(item.discountAmount) }})
              </p>
            </td>

            <td class="px-4 py-4 align-top">
              <p class="font-extrabold tabular-nums text-[#f05123]">
                {{ formatCoursePrice(item.finalAmount) }}
              </p>
            </td>

            <td class="px-4 py-4 align-top text-xs text-muted">
              <span v-if="item.paymentMethod === 'PAYOS_VIETQR'">VietQR payOS</span>
              <span v-else-if="item.paymentMethod === 'SIMULATION'">Mô phỏng (Demo)</span>
              <span v-else>Duyệt thủ công</span>
              <p
                v-if="item.transactionReference"
                class="mt-0.5 truncate max-w-[140px] tabular-nums text-ink"
                :title="item.transactionReference"
              >
                Ref: {{ item.transactionReference }}
              </p>
            </td>

            <td class="px-4 py-4 align-top">
              <span
                class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold"
                :class="
                  item.status === 'COMPLETED'
                    ? 'bg-teal-tint text-teal'
                    : item.status === 'PENDING'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-ground text-muted'
                "
              >
                <CheckCircle2 v-if="item.status === 'COMPLETED'" class="h-3.5 w-3.5" />
                <Clock v-else-if="item.status === 'PENDING'" class="h-3.5 w-3.5" />
                <XCircle v-else class="h-3.5 w-3.5" />
                <span>{{ statusBadgeLabel(item.status) }}</span>
              </span>
            </td>

            <td class="px-4 py-4 align-top text-xs tabular-nums text-muted">
              <p>Tạo: {{ formatDateTime(item.createdAt) }}</p>
              <p v-if="item.paidAt" class="mt-0.5 text-teal">
                TT: {{ formatDateTime(item.paidAt) }}
              </p>
            </td>

            <td class="px-4 py-4 text-right align-top">
              <div
                v-if="item.status === 'PENDING' || item.status === 'EXPIRED'"
                class="flex flex-wrap justify-end gap-2"
              >
                <button
                  type="button"
                  :disabled="processingOrderId === item.id"
                  class="manage-button-secondary !px-2.5 !py-1.5 text-xs"
                  title="Kiểm tra trạng thái thực tế trên cổng payOS"
                  @click="handleSyncOrder(item)"
                >
                  <RefreshCw class="h-3.5 w-3.5" />
                  <span>Đồng bộ</span>
                </button>
                <button
                  type="button"
                  :disabled="processingOrderId === item.id"
                  class="manage-button-primary !px-2.5 !py-1.5 text-xs"
                  title="Xác nhận đã nhận tiền và mở khóa học Pro"
                  @click="handleManualConfirm(item)"
                >
                  <ShieldCheck class="h-3.5 w-3.5" />
                  <span>Xác nhận</span>
                </button>
              </div>
              <span v-else class="text-xs text-muted">Đã xử lý</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
