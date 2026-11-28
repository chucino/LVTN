<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Crown,
  Download,
  PlayCircle,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Tag,
  XCircle,
} from 'lucide-vue-next';
import CourseCover from '@/components/course/CourseCover.vue';
import {
  formatCourseDuration,
  formatCoursePrice,
  getCourseErrorMessage,
} from '@/lib/course-format';
import { coursesApi } from '@/services/courses.api';
import { enrollmentsApi } from '@/services/enrollments.api';
import { ordersApi } from '@/services/orders.api';
import type { CourseDetail } from '@/types/course';
import type {
  AvailableCouponItem,
  CouponPreviewResponse,
  OrderDetail,
} from '@/types/order';

const route = useRoute();
const router = useRouter();

const courseId = computed(() => String(route.params.courseId || ''));
const course = ref<CourseDetail | null>(null);
const preview = ref<CouponPreviewResponse | null>(null);
const activeOrder = ref<OrderDetail | null>(null);

const loading = ref(true);
const loadError = ref<string | null>(null);

const couponInput = ref('');
const applyingCoupon = ref(false);
const couponMessage = ref<string | null>(null);
const couponError = ref<string | null>(null);

const creatingOrder = ref(false);
const syncingPayment = ref(false);
const cancellingOrder = ref(false);
const actionError = ref<string | null>(null);
const actionSuccess = ref<string | null>(null);

const copiedField = ref<string | null>(null);
const qrFallbackActive = ref(false);
const remainingSeconds = ref(0);

let pollInterval: ReturnType<typeof setInterval> | null = null;
let countdownInterval: ReturnType<typeof setInterval> | null = null;

const availableCoupons = computed<AvailableCouponItem[]>(
  () => preview.value?.availableCoupons ?? [],
);

const qrDisplayUrl = computed(() => {
  if (!activeOrder.value) return '';
  if (!qrFallbackActive.value && activeOrder.value.qrImageUrl) {
    return activeOrder.value.qrImageUrl;
  }
  if (activeOrder.value.qrCode) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=12&data=${encodeURIComponent(activeOrder.value.qrCode)}`;
  }
  return activeOrder.value.qrImageUrl || '';
});

const formattedCountdown = computed(() => {
  const sec = Math.max(0, remainingSeconds.value);
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`; // taste-skill-ignore
});

function stopTimers(): void {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function updateRemainingSeconds(): void {
  if (!activeOrder.value || activeOrder.value.status !== 'PENDING') {
    remainingSeconds.value = 0;
    return;
  }
  const expiresMs = new Date(activeOrder.value.expiresAt).getTime();
  const diffSec = Math.max(0, Math.floor((expiresMs - Date.now()) / 1000));
  remainingSeconds.value = diffSec;
  if (diffSec <= 0 && activeOrder.value.status === 'PENDING') {
    void handleSyncPayment(true);
  }
}

function startOrderMonitoring(): void {
  stopTimers();
  if (!activeOrder.value || activeOrder.value.status !== 'PENDING') return;

  updateRemainingSeconds();
  countdownInterval = setInterval(() => {
    updateRemainingSeconds();
  }, 1000);

  pollInterval = setInterval(() => {
    if (
      activeOrder.value &&
      activeOrder.value.status === 'PENDING' &&
      !syncingPayment.value
    ) {
      void handleSyncPayment(true);
    }
  }, 4000);
}

async function loadInitialData(): Promise<void> {
  if (!courseId.value) return;
  loading.value = true;
  loadError.value = null;
  actionError.value = null;
  actionSuccess.value = null;
  stopTimers();

  try {
    const [courseData, enrollmentData] = await Promise.all([
      coursesApi.getCourseById(courseId.value),
      enrollmentsApi.getEnrollmentStatus(courseId.value).catch(() => null),
    ]);

    course.value = courseData;
    document.title = `Thanh toán: ${courseData.title} - NextCode`;

    if (enrollmentData?.enrolled) {
      await router.replace({
        name: 'CourseLearning',
        params: { courseId: courseId.value },
      });
      return;
    }

    if (courseData.type !== 'PRO') {
      await router.replace({
        name: 'CourseDetail',
        params: { id: courseId.value },
      });
      return;
    }

    const queryOrderId =
      typeof route.query.orderId === 'string' ? route.query.orderId : '';

    if (queryOrderId) {
      try {
        const existingOrder = await ordersApi.getOrderById(queryOrderId);
        if (existingOrder.courseId === courseId.value) {
          activeOrder.value = existingOrder;
          couponInput.value = existingOrder.couponCode ?? '';
          if (route.query.payment === 'cancel' && existingOrder.status === 'PENDING') {
            await ordersApi.cancelOrder(
              existingOrder.id,
              'Người dùng hủy trên cổng thanh toán payOS',
            );
            activeOrder.value = null;
            actionError.value =
              'Bạn đã hủy phiên thanh toán trên payOS. Bạn có thể tạo lại mã QR mới bên dưới.';
          } else if (existingOrder.status === 'COMPLETED') {
            actionSuccess.value =
              'Thanh toán khóa học thành công! Quyền học khóa Pro của bạn đã được mở.';
          }
        }
      } catch {
        // Fallback sang màn hình preview nếu không tìm thấy orderId cũ
      }
    }

    const previewData = await ordersApi.previewCheckout(
      courseId.value,
      couponInput.value || undefined,
    );
    preview.value = previewData;

    if (activeOrder.value && activeOrder.value.status === 'PENDING') {
      startOrderMonitoring();
    }
  } catch (err) {
    loadError.value = getCourseErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function handleApplyCoupon(codeToApply?: string): Promise<void> {
  if (!courseId.value) return;
  const targetCode =
    codeToApply !== undefined ? codeToApply.trim() : couponInput.value.trim();
  couponInput.value = targetCode;
  applyingCoupon.value = true;
  couponError.value = null;
  couponMessage.value = null;

  try {
    const res = await ordersApi.previewCheckout(
      courseId.value,
      targetCode || undefined,
    );
    preview.value = res;
    couponMessage.value = targetCode ? res.message : null;
  } catch (err) {
    couponError.value = getCourseErrorMessage(err);
  } finally {
    applyingCoupon.value = false;
  }
}

async function handleCreateOrder(): Promise<void> {
  if (!courseId.value || creatingOrder.value) return;
  creatingOrder.value = true;
  actionError.value = null;
  actionSuccess.value = null;
  qrFallbackActive.value = false;

  try {
    const order = await ordersApi.createOrder(
      courseId.value,
      preview.value?.couponCode ?? undefined,
    );
    activeOrder.value = order;
    await router.replace({
      query: { ...route.query, orderId: order.id, payment: undefined },
    });

    if (order.status === 'COMPLETED') {
      actionSuccess.value =
        'Đơn hàng đã được thanh toán hoàn tất. Bạn có thể vào học ngay!';
    } else {
      startOrderMonitoring();
    }
  } catch (err) {
    actionError.value = getCourseErrorMessage(err);
  } finally {
    creatingOrder.value = false;
  }
}

async function handleSyncPayment(silent = false): Promise<void> {
  if (!activeOrder.value) return;
  if (!silent) {
    syncingPayment.value = true;
    actionError.value = null;
  }

  try {
    const updated = await ordersApi.syncOrderPayment(activeOrder.value.id);
    activeOrder.value = updated;

    if (updated.status === 'COMPLETED') {
      stopTimers();
      actionSuccess.value =
        'Hệ thống đã nhận được thanh toán và mở khóa học Pro cho bạn!';
    } else if (!silent && updated.status === 'PENDING') {
      actionSuccess.value =
        'Hệ thống đang chờ ngân hàng xác nhận giao dịch. Sau khi chuyển khoản, trạng thái sẽ tự động cập nhật sau 2–5 giây.';
    } else if (updated.status === 'EXPIRED' || updated.status === 'CANCELLED') {
      stopTimers();
    }
  } catch (err) {
    if (!silent) {
      actionError.value = getCourseErrorMessage(err);
    }
  } finally {
    if (!silent) {
      syncingPayment.value = false;
    }
  }
}

async function handleCancelAndChangeCoupon(): Promise<void> {
  if (!activeOrder.value || cancellingOrder.value) return;
  cancellingOrder.value = true;
  actionError.value = null;
  actionSuccess.value = null;

  try {
    if (activeOrder.value.status === 'PENDING') {
      await ordersApi.cancelOrder(
        activeOrder.value.id,
        'Đổi mã giảm giá hoặc tạo lại đơn hàng',
      );
    }
    stopTimers();
    activeOrder.value = null;
    await router.replace({
      query: { ...route.query, orderId: undefined, payment: undefined },
    });
  } catch (err) {
    actionError.value = getCourseErrorMessage(err);
  } finally {
    cancellingOrder.value = false;
  }
}

async function copyText(fieldKey: string, value?: string | number | null): Promise<void> {
  if (value === null || value === undefined) return;
  try {
    await navigator.clipboard.writeText(String(value));
    copiedField.value = fieldKey;
    setTimeout(() => {
      if (copiedField.value === fieldKey) {
        copiedField.value = null;
      }
    }, 2000);
  } catch {
    copiedField.value = null;
  }
}

function goToLearning(): void {
  if (!courseId.value) return;
  void router.push({
    name: 'CourseLearning',
    params: { courseId: courseId.value },
  });
}

watch(
  () => route.params.courseId,
  () => {
    void loadInitialData();
  },
);

onMounted(() => {
  void loadInitialData();
});

onBeforeUnmount(() => {
  stopTimers();
});
</script>

<template>
  <div data-ui class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <!-- Thanh điều hướng quay lại -->
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <router-link
        :to="
          courseId
            ? { name: 'CourseDetail', params: { id: courseId } }
            : { name: 'Courses' }
        "
        class="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft class="h-4 w-4" />
        <span>Quay lại trang chi tiết khóa học</span>
      </router-link>

      <router-link
        :to="{ name: 'Profile', query: { tab: 'orders' } }"
        class="inline-flex items-center gap-2 text-xs font-semibold text-brand-soft hover:underline"
      >
        <CreditCard class="h-4 w-4" />
        <span>Xem lịch sử đơn hàng của tôi</span>
      </router-link>
    </div>

    <!-- Đang tải -->
    <div v-if="loading" class="grid gap-6 lg:grid-cols-12" aria-busy="true">
      <div class="h-96 bg-surface lg:col-span-7" />
      <div class="h-96 bg-surface lg:col-span-5" />
    </div>

    <!-- Lỗi tải -->
    <section v-else-if="loadError" class="bg-surface p-8 sm:p-10" role="alert">
      <div class="flex items-start gap-3 text-brand-soft">
        <AlertCircle class="mt-0.5 h-6 w-6 shrink-0" />
        <div>
          <h1 class="text-xl font-bold text-ink">
            Chưa thể khởi tạo trang thanh toán
          </h1>
          <p class="mt-2 text-sm leading-6 text-muted">{{ loadError }}</p>
          <div class="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              class="manage-button-primary"
              @click="loadInitialData"
            >
              Thử lại
            </button>
            <router-link :to="{ name: 'Courses' }" class="manage-button-secondary">
              Danh sách khóa học
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Nội dung chính -->
    <template v-else-if="course && preview">
      <!-- Header -->
      <header class="mb-8 bg-surface p-6 sm:p-8">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div class="inline-flex items-center gap-2 bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400">
              <Crown class="h-3.5 w-3.5 text-amber-400" />
              <span>ĐĂNG KÝ KHÓA HỌC PRO</span>
            </div>
            <h1 class="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
              {{
                activeOrder?.status === 'COMPLETED'
                  ? 'Thanh toán hoàn tất'
                  : activeOrder?.status === 'PENDING'
                    ? 'Quét mã VietQR để thanh toán'
                    : 'Xác nhận đơn hàng & Ưu đãi'
              }}
            </h1>
          </div>

          <div
            v-if="activeOrder"
            class="bg-ground px-4 py-3 text-right"
          >
            <p class="text-xs text-muted">Mã đơn hàng</p>
            <p class="mt-0.5 text-base font-extrabold tabular-nums text-brand-soft">
              {{ activeOrder.orderCode }}
            </p>
          </div>
        </div>
      </header>

      <!-- Thông báo trạng thái -->
      <div
        v-if="actionSuccess"
        class="manage-alert-success mb-6"
        role="status"
      >
        <CheckCircle2 class="h-5 w-5 shrink-0" />
        <span>{{ actionSuccess }}</span>
      </div>

      <div
        v-if="actionError"
        class="manage-alert-error mb-6"
        role="alert"
      >
        <AlertCircle class="h-5 w-5 shrink-0" />
        <span>{{ actionError }}</span>
      </div>

      <!-- TRƯỜNG HỢP 1: ĐƠN HÀNG ĐÃ HOÀN TẤT -->
      <section
        v-if="activeOrder && activeOrder.status === 'COMPLETED'"
        class="bg-surface p-6 sm:p-10"
      >
        <div class="grid items-center gap-8 lg:grid-cols-12">
          <div class="space-y-4 lg:col-span-7">
            <div class="inline-flex items-center gap-2 bg-teal-tint px-3.5 py-1.5 text-xs font-bold text-teal">
              <ShieldCheck class="h-4 w-4" />
              <span>ĐÃ KÍCH HOẠT QUYỀN HỌC TẬP</span>
            </div>
            <h2 class="text-2xl font-extrabold text-ink sm:text-3xl">
              Chúc mừng! Bạn đã sở hữu khóa học “{{ course.title }}”
            </h2>
            <p class="text-sm leading-6 text-muted">
              Hệ thống đã ghi nhận giao dịch thanh toán và mở khóa bài học đầu tiên trong lộ trình. Bạn có thể bắt đầu học ngay bây giờ và nhận chứng chỉ khi hoàn thành khóa học.
            </p>

            <div class="grid gap-3 bg-ground p-5 sm:grid-cols-2">
              <div>
                <p class="text-xs text-muted">Mã đơn hàng</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-ink">
                  {{ activeOrder.orderCode }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted">Số tiền đã thanh toán</p>
                <p class="mt-1 text-sm font-bold tabular-nums text-[#f05123]">
                  {{ formatCoursePrice(activeOrder.finalAmount) }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted">Phương thức xác nhận</p>
                <p class="mt-1 text-sm font-semibold text-ink">
                  {{
                    activeOrder.paymentMethod === 'PAYOS_VIETQR'
                      ? 'Chuyển khoản VietQR (payOS)'
                      : activeOrder.paymentMethod === 'SIMULATION'
                        ? 'Giả lập thanh toán (Demo)'
                        : 'Xác nhận thủ công'
                  }}
                </p>
              </div>
              <div>
                <p class="text-xs text-muted">Mã tham chiếu giao dịch</p>
                <p class="mt-1 text-sm font-semibold tabular-nums text-ink">
                  {{ activeOrder.transactionReference || 'Chưa có' }}
                </p>
              </div>
            </div>

            <div class="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                class="manage-button-primary !min-h-12 px-6 text-base"
                @click="goToLearning"
              >
                <PlayCircle class="h-5 w-5" />
                <span>Bắt đầu vào học ngay</span>
              </button>
              <router-link
                :to="{ name: 'Profile', query: { tab: 'orders' } }"
                class="manage-button-secondary !min-h-12 px-5"
              >
                Xem lịch sử đơn hàng
              </router-link>
            </div>
          </div>

          <div class="bg-ground p-5 lg:col-span-5">
            <CourseCover
              :src="course.thumbnail"
              :title="course.title"
              :category="course.category.name"
              :is-pro="true"
            />
            <p class="mt-4 text-base font-bold text-ink">{{ course.title }}</p>
            <p class="mt-1 text-xs text-muted">
              Giảng viên: {{ course.instructor.fullName }} · {{ course.totalChapters }} chương · {{ course.totalLessons }} bài học
            </p>
          </div>
        </div>
      </section>

      <!-- TRƯỜNG HỢP 2: ĐANG HIỂN THỊ MÃ QR CHỜ THANH TOÁN -->
      <div
        v-else-if="activeOrder && activeOrder.status === 'PENDING'"
        class="grid items-start gap-8 lg:grid-cols-12"
      >
        <!-- Cột trái: Mã VietQR & Thông tin chuyển khoản -->
        <section class="space-y-6 bg-surface p-6 sm:p-8 lg:col-span-7">
          <div class="flex flex-wrap items-center justify-between gap-3 bg-ground p-4">
            <div class="flex items-center gap-2.5 text-sm font-semibold text-ink">
              <QrCode class="h-5 w-5 text-brand-soft" />
              <span>Quét mã bằng mọi ứng dụng Ngân hàng hoặc Ví MoMo</span>
            </div>
            <div class="inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 text-xs font-bold tabular-nums text-amber-400">
              <Clock class="h-3.5 w-3.5" />
              <span>Còn lại: {{ formattedCountdown }}</span>
            </div>
          </div>

          <div class="grid items-center gap-6 md:grid-cols-12">
            <!-- Khung ảnh QR -->
            <div class="flex flex-col items-center bg-white p-4 text-center md:col-span-6">
              <img
                v-if="qrDisplayUrl"
                :src="qrDisplayUrl"
                :alt="`Mã VietQR thanh toán đơn ${activeOrder.orderCode}`"
                class="h-64 w-64 object-contain"
                @error="qrFallbackActive = true"
              />
              <div
                v-else
                class="flex h-64 w-64 items-center justify-center bg-slate-100 text-xs text-slate-600"
              >
                Đang tải mã VietQR...
              </div>
              <p class="mt-2 text-xs font-semibold text-slate-700">
                Chuẩn VietQR Napas 247 · Tự động điền số tiền & nội dung
              </p>
              <div class="mt-3 flex flex-wrap justify-center gap-2">
                <a
                  v-if="qrDisplayUrl"
                  :href="qrDisplayUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  class="inline-flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                >
                  <Download class="h-3.5 w-3.5" />
                  <span>Tải ảnh QR</span>
                </a>
              </div>
            </div>

            <!-- Thông tin chuyển khoản dạng chữ có nút sao chép -->
            <div class="space-y-3 md:col-span-6">
              <div class="bg-ground p-3.5">
                <p class="text-xs text-muted">Ngân hàng thụ hưởng</p>
                <p class="mt-1 text-sm font-bold text-ink">
                  {{ activeOrder.bankName || 'MB Bank (VietQR Pro)' }}
                </p>
              </div>

              <div class="flex items-center justify-between gap-2 bg-ground p-3.5">
                <div class="min-w-0">
                  <p class="text-xs text-muted">Số tài khoản nhận (VA định danh)</p>
                  <p class="mt-1 truncate text-sm font-extrabold tabular-nums text-ink">
                    {{ activeOrder.accountNumber }}
                  </p>
                </div>
                <button
                  type="button"
                  class="manage-button-secondary shrink-0 !px-2.5 !py-1.5 text-xs"
                  @click="copyText('accountNumber', activeOrder.accountNumber)"
                >
                  <Check v-if="copiedField === 'accountNumber'" class="h-3.5 w-3.5 text-teal" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  <span>{{ copiedField === 'accountNumber' ? 'Đã chép' : 'Sao chép' }}</span>
                </button>
              </div>

              <div class="bg-ground p-3.5">
                <p class="text-xs text-muted">Chủ tài khoản</p>
                <p class="mt-1 text-sm font-bold uppercase text-ink">
                  {{ activeOrder.accountName }}
                </p>
              </div>

              <div class="flex items-center justify-between gap-2 bg-ground p-3.5">
                <div>
                  <p class="text-xs text-muted">Số tiền chuyển khoản</p>
                  <p class="mt-1 text-base font-extrabold tabular-nums text-[#f05123]">
                    {{ formatCoursePrice(activeOrder.finalAmount) }}
                  </p>
                </div>
                <button
                  type="button"
                  class="manage-button-secondary shrink-0 !px-2.5 !py-1.5 text-xs"
                  @click="copyText('amount', activeOrder.finalAmount)"
                >
                  <Check v-if="copiedField === 'amount'" class="h-3.5 w-3.5 text-teal" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  <span>{{ copiedField === 'amount' ? 'Đã chép' : 'Sao chép' }}</span>
                </button>
              </div>

              <div class="flex items-center justify-between gap-2 bg-ground p-3.5">
                <div class="min-w-0">
                  <p class="text-xs text-muted">Nội dung chuyển khoản</p>
                  <p class="mt-1 truncate text-sm font-extrabold tabular-nums text-brand-soft">
                    {{ activeOrder.transferDescription || activeOrder.orderCode }}
                  </p>
                </div>
                <button
                  type="button"
                  class="manage-button-secondary shrink-0 !px-2.5 !py-1.5 text-xs"
                  @click="
                    copyText(
                      'description',
                      activeOrder.transferDescription || activeOrder.orderCode,
                    )
                  "
                >
                  <Check v-if="copiedField === 'description'" class="h-3.5 w-3.5 text-teal" />
                  <Copy v-else class="h-3.5 w-3.5" />
                  <span>{{ copiedField === 'description' ? 'Đã chép' : 'Sao chép' }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Thanh hành động kiểm tra -->
          <div class="space-y-3 bg-ground p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                :disabled="syncingPayment"
                class="manage-button-primary flex-1 !min-h-11 justify-center"
                @click="handleSyncPayment(false)"
              >
                <RefreshCw
                  class="h-4 w-4"
                  :class="{ 'animate-spin': syncingPayment }"
                />
                <span>
                  {{
                    syncingPayment
                      ? 'Đang đối soát với payOS...'
                      : 'Tôi đã chuyển khoản · Kiểm tra ngay'
                  }}
                </span>
              </button>
            </div>

            <div class="flex items-center justify-between pt-1 text-xs text-muted">
              <span>Hệ thống tự động kiểm tra trạng thái đơn hàng mỗi 4 giây.</span>
              <button
                type="button"
                :disabled="cancellingOrder"
                class="font-semibold text-brand-soft hover:underline"
                @click="handleCancelAndChangeCoupon"
              >
                Đổi mã giảm giá / Hủy đơn
              </button>
            </div>
          </div>
        </section>

        <!-- Cột phải: Tóm tắt đơn hàng -->
        <aside class="space-y-6 bg-surface p-6 sm:p-8 lg:col-span-5">
          <h2 class="text-lg font-bold text-ink">Tóm tắt đơn hàng</h2>
          <div class="bg-ground p-4">
            <CourseCover
              :src="course.thumbnail"
              :title="course.title"
              :category="course.category.name"
              :is-pro="true"
            />
            <h3 class="mt-4 text-base font-bold text-ink">{{ course.title }}</h3>
            <p class="mt-1 text-xs text-muted">
              Giảng viên: {{ course.instructor.fullName }} · {{ course.totalChapters }} chương · {{ course.totalLessons }} bài học
            </p>
          </div>

          <dl class="space-y-3 text-sm">
            <div class="flex items-center justify-between text-muted">
              <dt>Giá gốc khóa học</dt>
              <dd class="tabular-nums">{{ formatCoursePrice(activeOrder.originalPrice) }}</dd>
            </div>
            <div
              v-if="activeOrder.discountPrice !== null && activeOrder.discountPrice < activeOrder.originalPrice"
              class="flex items-center justify-between text-muted"
            >
              <dt>Giá ưu đãi niêm yết</dt>
              <dd class="tabular-nums">{{ formatCoursePrice(activeOrder.discountPrice) }}</dd>
            </div>
            <div
              v-if="activeOrder.couponCode"
              class="flex items-center justify-between text-teal"
            >
              <dt>Mã giảm giá ({{ activeOrder.couponCode }})</dt>
              <dd class="font-semibold tabular-nums">
                -{{ formatCoursePrice(activeOrder.discountAmount) }}
              </dd>
            </div>
            <div class="flex items-center justify-between bg-ground p-4">
              <dt class="text-base font-bold text-ink">Tổng thanh toán</dt>
              <dd class="text-2xl font-extrabold tabular-nums text-[#f05123]">
                {{ formatCoursePrice(activeOrder.finalAmount) }}
              </dd>
            </div>
          </dl>
        </aside>
      </div>

      <!-- TRƯỜNG HỢP 3: MÀN HÌNH XÁC NHẬN ĐƠN & CHỌN MÃ GIẢM GIÁ (TRƯỚC KHI TẠO QR) -->
      <div v-else class="grid items-start gap-8 lg:grid-cols-12">
        <!-- Cột trái: Thông tin khóa học & Mã giảm giá -->
        <section class="space-y-6 bg-surface p-6 sm:p-8 lg:col-span-7">
          <div>
            <h2 class="text-lg font-bold text-ink">Thông tin khóa học đăng ký</h2>
            <div class="mt-4 grid gap-5 bg-ground p-5 sm:grid-cols-12">
              <div class="sm:col-span-5">
                <CourseCover
                  :src="course.thumbnail"
                  :title="course.title"
                  :category="course.category.name"
                  :is-pro="true"
                />
              </div>
              <div class="flex flex-col justify-between sm:col-span-7">
                <div>
                  <h3 class="text-base font-bold text-ink">{{ course.title }}</h3>
                  <p class="mt-1 text-xs text-muted">
                    Giảng viên: {{ course.instructor.fullName }}
                  </p>
                  <p class="mt-2 text-xs tabular-nums text-muted">
                    {{ course.totalChapters }} chương · {{ course.totalLessons }} bài giảng · Thời lượng {{ formatCourseDuration(course.totalDuration) }}
                  </p>
                </div>
                <div class="mt-4 flex items-baseline gap-2.5">
                  <span class="text-xl font-extrabold tabular-nums text-[#f05123]">
                    {{ formatCoursePrice(preview.baseAmount) }}
                  </span>
                  <span
                    v-if="preview.courseDiscountPrice !== null && preview.courseDiscountPrice < preview.originalPrice"
                    class="text-xs tabular-nums text-muted line-through"
                  >
                    {{ formatCoursePrice(preview.originalPrice) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Khối nhập & chọn mã giảm giá -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-base font-bold text-ink">Mã giảm giá & Ưu đãi</h2>
              <button
                v-if="preview.couponCode"
                type="button"
                class="inline-flex items-center gap-1 text-xs font-semibold text-brand-soft hover:underline"
                @click="handleApplyCoupon('')"
              >
                <XCircle class="h-3.5 w-3.5" />
                <span>Bỏ dùng mã {{ preview.couponCode }}</span>
              </button>
            </div>

            <form
              class="flex flex-col gap-3 sm:flex-row"
              @submit.prevent="handleApplyCoupon()"
            >
              <input
                v-model="couponInput"
                type="text"
                maxlength="32"
                placeholder="Nhập mã giảm giá (ví dụ: NEXTCODE10, TEST2K...)"
                class="manage-input flex-1 uppercase"
              />
              <button
                type="submit"
                :disabled="applyingCoupon"
                class="manage-button-secondary shrink-0 !min-h-11 px-5"
              >
                <Tag class="h-4 w-4" />
                <span>{{ applyingCoupon ? 'Đang kiểm tra...' : 'Áp dụng mã' }}</span>
              </button>
            </form>

            <p v-if="couponMessage" class="text-xs font-semibold text-teal" role="status">
              {{ couponMessage }}
            </p>
            <p v-if="couponError" class="text-xs font-semibold text-brand-soft" role="alert">
              {{ couponError }}
            </p>

            <!-- Danh sách mã giảm giá có thể chọn nhanh -->
            <div v-if="availableCoupons.length > 0" class="space-y-2.5 pt-1">
              <p class="text-xs font-medium text-muted">
                Mã giảm giá có sẵn (bấm để áp dụng nhanh):
              </p>
              <div class="grid gap-2.5 sm:grid-cols-2">
                <button
                  v-for="item in availableCoupons"
                  :key="item.code"
                  type="button"
                  class="flex flex-col items-start justify-between gap-1.5 p-3.5 text-left transition-colors"
                  :class="
                    preview.couponCode === item.code
                      ? 'bg-tint text-ink'
                      : 'bg-ground text-ink hover:bg-surface-2'
                  "
                  @click="handleApplyCoupon(item.code)"
                >
                  <div class="flex w-full items-center justify-between gap-2">
                    <span class="bg-surface px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-brand-soft">
                      {{ item.code }}
                    </span>
                    <span
                      v-if="preview.couponCode === item.code"
                      class="text-xs font-bold text-teal"
                    >
                      Đang áp dụng
                    </span>
                  </div>
                  <p class="text-xs leading-5 text-muted">{{ item.title }}</p>
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Cột phải: Tổng tiền & Nút Tạo mã VietQR -->
        <aside class="space-y-6 bg-surface p-6 sm:p-8 lg:col-span-5">
          <h2 class="text-lg font-bold text-ink">Chi tiết thanh toán</h2>

          <dl class="space-y-3.5 text-sm">
            <div class="flex items-center justify-between text-muted">
              <dt>Giá gốc khóa học</dt>
              <dd class="tabular-nums">{{ formatCoursePrice(preview.originalPrice) }}</dd>
            </div>
            <div
              v-if="preview.courseDiscountPrice !== null && preview.courseDiscountPrice < preview.originalPrice"
              class="flex items-center justify-between text-muted"
            >
              <dt>Giá ưu đãi khóa học</dt>
              <dd class="tabular-nums">{{ formatCoursePrice(preview.courseDiscountPrice) }}</dd>
            </div>
            <div
              v-if="preview.couponCode"
              class="flex items-center justify-between text-teal"
            >
              <dt>Mã giảm giá ({{ preview.couponCode }})</dt>
              <dd class="font-semibold tabular-nums">
                -{{ formatCoursePrice(preview.discountAmount) }}
              </dd>
            </div>

            <div class="flex items-center justify-between bg-ground p-4">
              <dt class="text-base font-bold text-ink">Tổng tiền phải trả</dt>
              <dd class="text-2xl font-extrabold tabular-nums text-[#f05123]">
                {{ formatCoursePrice(preview.finalAmount) }}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            :disabled="creatingOrder"
            class="manage-button-primary w-full !min-h-12 justify-center text-base"
            @click="handleCreateOrder"
          >
            <QrCode class="h-5 w-5" />
            <span>
              {{
                creatingOrder
                  ? 'Đang khởi tạo mã VietQR payOS...'
                  : 'Tiếp tục thanh toán · Tạo mã QR'
              }}
            </span>
          </button>
        </aside>
      </div>
    </template>
  </div>
</template>
