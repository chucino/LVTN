<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  Flag,
  Gavel,
  RefreshCw,
  Trash2,
  UserCog,
  X,
} from 'lucide-vue-next';
import { getCourseErrorMessage } from '@/lib/course-format';
import { questionsApi } from '@/services/questions.api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  ManageReportsResponse,
  ReportActionType,
  ReportQueueItem,
} from '@/types/learning';

type StatusTab = 'ALL' | 'PENDING' | 'RESOLVED' | 'DISMISSED';

/** Từ ngưỡng này Giảng viên được khuyến nghị chuyển báo cáo lên Admin */
const HIGH_VIOLATION_THRESHOLD = 5;

const authStore = useAuthStore();
const router = useRouter();

const isAdmin = computed(() => authStore.user?.role === 'ADMIN');

const loading = ref(true);
const error = ref<string | null>(null);
const actionMessage = ref<string | null>(null);

const selectedCourseId = ref('');
const selectedStatus = ref<StatusTab>('PENDING');

const data = ref<ManageReportsResponse>({
  items: [],
  summary: { total: 0, pending: 0, resolved: 0, dismissed: 0 },
  courses: [],
});

// Hộp thoại xác nhận xử lý kèm ghi chú gửi thông báo
const activeModal = ref<{
  report: ReportQueueItem;
  action: ReportActionType;
  title: string;
  description: string;
} | null>(null);
const moderationNote = ref('');
const severeViolation = ref(false);
const submittingAction = ref(false);

/** Xem trước mức phạt theo cùng bảng quy tắc với Backend */
const penaltyPreview = computed(() => {
  if (!activeModal.value || activeModal.value.action !== 'APPLY_PENALTY') {
    return null;
  }
  const nextCount = activeModal.value.report.targetAuthorViolationCount + 1;
  if (severeViolation.value) {
    return { count: nextCount, text: 'Đình chỉ tài khoản ngay (vi phạm đặc biệt nghiêm trọng)' };
  }
  if (nextCount >= 20) return { count: nextCount, text: 'Đình chỉ tài khoản (từ 20 lần vi phạm)' };
  if (nextCount >= 16) return { count: nextCount, text: 'Cấm bình luận 30 ngày và cảnh cáo chính thức' };
  if (nextCount >= 11) return { count: nextCount, text: 'Cấm bình luận 7 ngày và cảnh cáo chính thức' };
  if (nextCount >= 6) return { count: nextCount, text: 'Cấm bình luận 24 giờ' };
  return { count: nextCount, text: 'Nhắc nhở và xóa bình luận vi phạm' };
});

function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function getTargetTypeLabel(type: string): string {
  if (type === 'ANSWER') return 'Câu trả lời';
  if (type === 'REVIEW') return 'Đánh giá';
  return 'Câu hỏi gốc';
}

function getActionTakenLabel(action: ReportActionType | null): string {
  if (action === 'DELETE_AND_REMIND') return 'Đã xóa bình luận và nhắc nhở';
  if (action === 'APPLY_PENALTY') return 'Đã xử lý vi phạm và áp dụng hình phạt';
  if (action === 'DISMISS') return 'Đã bỏ qua báo cáo';
  if (action === 'ESCALATE') return 'Đã chuyển lên Admin';
  return 'Chưa xử lý';
}

function isActionable(item: ReportQueueItem): boolean {
  if (isAdmin.value) {
    return item.status === 'ESCALATED' || item.status === 'PENDING';
  }
  return item.status === 'PENDING';
}

async function fetchReports(): Promise<void> {
  loading.value = true;
  error.value = null;

  try {
    data.value = await questionsApi.listManageReports({
      courseId: selectedCourseId.value || undefined,
      status: selectedStatus.value,
    });
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function setStatusTab(tab: StatusTab): void {
  selectedStatus.value = tab;
  void fetchReports();
}

function openActionModal(
  report: ReportQueueItem,
  action: ReportActionType,
): void {
  moderationNote.value = '';
  severeViolation.value = false;

  if (action === 'DELETE_AND_REMIND') {
    activeModal.value = {
      report,
      action,
      title: 'Xóa bình luận và nhắc nhở',
      description:
        'Bình luận được xóa mềm (không xóa khỏi cơ sở dữ liệu) và tài khoản vi phạm được cộng thêm 1 lần vi phạm. Mọi báo cáo trùng cùng bình luận này sẽ được đóng cùng lúc.',
    };
  } else if (action === 'APPLY_PENALTY') {
    activeModal.value = {
      report,
      action,
      title: 'Xử lý vi phạm và áp dụng hình phạt',
      description:
        'Hệ thống xóa mềm bình luận, ghi nhận vi phạm và tự động áp dụng mức phạt tương ứng với tổng số lần vi phạm tích lũy của tài khoản.',
    };
  } else if (action === 'ESCALATE') {
    activeModal.value = {
      report,
      action,
      title: 'Chuyển báo cáo lên Admin',
      description:
        'Báo cáo sẽ rời khỏi danh sách chờ của bạn và chuyển sang danh sách chờ xử lý của Admin. Việc chuyển cấp không cộng thêm lần vi phạm.',
    };
  } else {
    activeModal.value = {
      report,
      action: 'DISMISS',
      title: 'Bỏ qua báo cáo vi phạm',
      description:
        'Giữ nguyên bình luận và không cộng lần vi phạm. Mọi báo cáo trùng cùng bình luận này sẽ được đóng cùng lúc.',
    };
  }
}

function closeActionModal(): void {
  activeModal.value = null;
  moderationNote.value = '';
  severeViolation.value = false;
}

async function confirmResolveAction(): Promise<void> {
  if (!activeModal.value || submittingAction.value) return;
  submittingAction.value = true;
  error.value = null;

  try {
    const res = await questionsApi.resolveReport(activeModal.value.report.id, {
      action: activeModal.value.action,
      note: moderationNote.value.trim() || undefined,
      severeViolation:
        activeModal.value.action === 'APPLY_PENALTY'
          ? severeViolation.value
          : undefined,
    });
    actionMessage.value = res.message;
    closeActionModal();
    await fetchReports();
    setTimeout(() => {
      actionMessage.value = null;
    }, 5000);
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    submittingAction.value = false;
  }
}

function goToManageUsers(authorName: string): void {
  void router.push({
    name: 'ManageUsers',
    query: { search: authorName },
  });
}

onMounted(() => {
  void fetchReports();
});
</script>

<template>
  <div data-ui class="space-y-6 text-ink">
    <!-- Tiêu đề trang & Mô tả phân quyền 2 tuyến -->
    <div class="flex flex-wrap items-start justify-between gap-4 bg-surface p-6">
      <div>
        <div class="flex items-center gap-2 text-xs font-semibold text-brand-soft">
          <Flag class="h-4 w-4" />
          <span>Kiểm duyệt Hỏi đáp và Cộng đồng</span>
        </div>
        <h1 class="mt-1 text-2xl font-extrabold text-ink">
          Báo cáo vi phạm bình luận
        </h1>
        <p class="mt-1.5 max-w-3xl text-sm text-muted">
          <template v-if="isAdmin">
            Tuyến 2: Admin xử lý các báo cáo được Giảng viên chuyển lên và báo cáo nhắm vào Giảng viên. Mức phạt được áp dụng tự động theo số lần vi phạm tích lũy của tài khoản.
          </template>
          <template v-else>
            Tuyến 1: Giảng viên xử lý báo cáo nhắm vào học viên thuộc khóa học mình phụ trách. Trường hợp tái phạm nhiều lần hoặc nghiêm trọng, hãy chuyển báo cáo lên Admin.
          </template>
        </p>
      </div>

      <button
        type="button"
        class="manage-button-secondary text-xs"
        :disabled="loading"
        @click="fetchReports"
      >
        <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        <span>Làm mới danh sách</span>
      </button>
    </div>

    <!-- Thẻ thống kê: 3 mục thống nhất cho Giảng viên và Admin -->
    <div class="grid gap-4 sm:grid-cols-3">
      <button
        type="button"
        class="bg-surface p-5 text-left transition-colors hover:bg-surface-2"
        @click="setStatusTab('PENDING')"
      >
        <p class="text-xs font-semibold text-muted">Đang chờ xử lý</p>
        <p class="mt-2 text-2xl font-extrabold text-brand tabular-nums">
          {{ data.summary.pending }}
        </p>
      </button>

      <button
        type="button"
        class="bg-surface p-5 text-left transition-colors hover:bg-surface-2"
        @click="setStatusTab('RESOLVED')"
      >
        <p class="text-xs font-semibold text-muted">Đã xử lý</p>
        <p class="mt-2 text-2xl font-extrabold text-teal tabular-nums">
          {{ data.summary.resolved }}
        </p>
      </button>

      <button
        type="button"
        class="bg-surface p-5 text-left transition-colors hover:bg-surface-2"
        @click="setStatusTab('DISMISSED')"
      >
        <p class="text-xs font-semibold text-muted">Đã bỏ qua</p>
        <p class="mt-2 text-2xl font-extrabold text-ink tabular-nums">
          {{ data.summary.dismissed }}
        </p>
      </button>
    </div>

    <!-- Thông báo lỗi / kết quả xử lý -->
    <div v-if="error" class="manage-alert-error" role="alert">
      <AlertCircle class="h-5 w-5 shrink-0" />
      <span>{{ error }}</span>
    </div>

    <div
      v-if="actionMessage"
      class="flex items-center gap-2 bg-teal-tint p-4 text-sm font-semibold text-teal"
      role="status"
    >
      <CheckCircle2 class="h-5 w-5 shrink-0" />
      <span>{{ actionMessage }}</span>
    </div>

    <!-- Bộ lọc theo trạng thái và khóa học -->
    <div class="flex flex-wrap items-center justify-between gap-4 bg-surface p-4">
      <div class="flex flex-wrap items-center gap-2">
        <button
          v-for="tab in [
            { key: 'PENDING', label: 'Đang chờ xử lý', count: data.summary.pending },
            { key: 'RESOLVED', label: 'Đã xử lý', count: data.summary.resolved },
            { key: 'DISMISSED', label: 'Đã bỏ qua', count: data.summary.dismissed },
            { key: 'ALL', label: 'Tất cả', count: data.summary.total },
          ] as Array<{ key: StatusTab; label: string; count: number }>"
          :key="tab.key"
          type="button"
          class="rounded-lg px-3.5 py-2 text-xs font-bold transition-colors"
          :class="
            selectedStatus === tab.key
              ? 'bg-brand text-white'
              : 'bg-surface-2 text-muted hover:text-ink'
          "
          @click="setStatusTab(tab.key)"
        >
          {{ tab.label }} ({{ tab.count }})
        </button>
      </div>

      <div class="flex items-center gap-2">
        <label for="report-course-filter" class="text-xs font-semibold text-muted">
          Khóa học:
        </label>
        <select
          id="report-course-filter"
          v-model="selectedCourseId"
          class="manage-select min-w-56 text-xs"
          @change="fetchReports"
        >
          <option value="">Tất cả khóa học</option>
          <option
            v-for="course in data.courses"
            :key="course.id"
            :value="course.id"
          >
            {{ course.title }}
          </option>
        </select>
      </div>
    </div>

    <!-- Trạng thái đang tải -->
    <div v-if="loading" class="space-y-4" aria-busy="true">
      <div v-for="i in 3" :key="i" class="h-40 bg-surface p-6" />
    </div>

    <!-- Trạng thái trống -->
    <div
      v-else-if="data.items.length === 0"
      class="bg-surface p-12 text-center"
    >
      <CheckCircle2 class="mx-auto h-10 w-10 text-teal" />
      <h2 class="mt-3 text-base font-bold text-ink">
        Không có báo cáo nào trong danh sách này
      </h2>
      <p class="mt-1 text-xs text-muted">
        Môi trường thảo luận bài học đang hoạt động lành mạnh.
      </p>
    </div>

    <!-- Danh sách báo cáo vi phạm -->
    <div v-else class="space-y-4">
      <article
        v-for="item in data.items"
        :key="item.id"
        class="bg-surface p-6"
      >
        <!-- Cảnh báo số lần vi phạm cao (dành cho Giảng viên) -->
        <div
          v-if="!isAdmin && isActionable(item) && item.targetAuthorViolationCount >= HIGH_VIOLATION_THRESHOLD"
          class="mb-4 flex items-start gap-2.5 rounded-xl bg-[#fef3c7] p-3.5 text-xs font-semibold leading-5 text-[#92400e]"
          role="alert"
        >
          <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tài khoản đã vi phạm {{ item.targetAuthorViolationCount }} lần. Nên chuyển báo cáo lên Admin để xem xét.
          </span>
        </div>

        <!-- Hàng thông tin khóa học, bài học & trạng thái báo cáo -->
        <div
          data-ui class="flex flex-wrap items-center justify-between gap-3 border-b border-surface-3 pb-3"
        >
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="inline-flex items-center gap-1.5 font-bold text-ink">
              <BookOpen class="h-3.5 w-3.5 text-brand" />
              {{ item.courseTitle }}
            </span>
            <span class="text-muted">·</span>
            <span class="font-medium text-muted">{{ item.lessonTitle }}</span>
            <span class="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-semibold text-ink">
              {{ getTargetTypeLabel(item.targetType) }}
            </span>
            <span
              v-if="item.duplicateReportCount > 1"
              class="rounded-full bg-tint px-2.5 py-0.5 text-[11px] font-semibold text-brand-soft"
            >
              {{ item.duplicateReportCount }} người cùng báo cáo
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span
              class="rounded-full px-2.5 py-0.5 font-bold"
              :class="
                item.status === 'PENDING' || item.status === 'ESCALATED'
                  ? 'bg-tint text-brand-soft'
                  : item.status === 'RESOLVED'
                    ? 'bg-teal-tint text-teal'
                    : 'bg-surface-2 text-muted'
              "
            >
              {{
                item.status === 'PENDING'
                  ? 'Đang chờ xử lý'
                  : item.status === 'ESCALATED'
                    ? isAdmin
                      ? 'Đang chờ Admin xử lý'
                      : 'Đã chuyển Admin'
                    : item.status === 'RESOLVED'
                      ? 'Đã xử lý'
                      : 'Đã bỏ qua'
              }}
            </span>

            <span class="text-muted tabular-nums">
              {{ formatDateTime(item.createdAt) }}
            </span>
          </div>
        </div>

        <!-- Nội dung bình luận bị báo cáo & Lý do báo cáo -->
        <div class="mt-4 grid gap-4 lg:grid-cols-12">
          <div class="space-y-2 lg:col-span-7">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span class="text-muted">Người đăng bình luận: </span>
                <strong class="font-bold text-ink">
                  {{ item.targetAuthor.fullName }}
                </strong>
                <span class="ml-1.5 rounded bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                  {{ item.targetAuthor.role }}
                </span>
                <span class="ml-1.5 text-muted">
                  · {{ item.targetAuthorViolationCount }} lần vi phạm
                </span>
              </div>

              <span
                class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                :class="
                  item.commentVisibilityStatus === 'HIDDEN'
                    ? 'bg-[#fee2e2] text-[#b91c1c]'
                    : 'bg-teal-tint text-teal'
                "
              >
                <EyeOff v-if="item.commentVisibilityStatus === 'HIDDEN'" class="h-3 w-3" />
                <Eye v-else class="h-3 w-3" />
                {{
                  item.commentVisibilityStatus === 'HIDDEN'
                    ? 'Đã xóa mềm'
                    : 'Đang hiển thị'
                }}
              </span>
            </div>

            <div class="rounded-xl bg-ground p-4 text-sm leading-6 text-ink">
              {{ item.commentContent }}
            </div>

            <!-- Thông tin hỗ trợ cho Admin: trạng thái tài khoản, cấm bình luận, lịch sử vi phạm -->
            <div
              v-if="isAdmin"
              class="space-y-1.5 rounded-xl bg-surface-2 p-3.5 text-xs leading-5"
            >
              <p class="font-bold text-ink">
                Hồ sơ vi phạm: {{ item.targetAuthorViolationCount }} lần tích lũy
                <span
                  v-if="item.targetAuthorStatus === 'LOCKED'"
                  class="ml-1.5 rounded-full bg-[#fee2e2] px-2 py-0.5 text-[11px] font-bold text-[#b91c1c]"
                >
                  Tài khoản đã bị đình chỉ
                </span>
              </p>
              <p v-if="item.targetAuthorCommentBannedUntil" class="text-muted">
                Đang bị cấm bình luận đến {{ formatDateTime(item.targetAuthorCommentBannedUntil) }}
              </p>
              <ul
                v-if="item.targetAuthorViolationHistory.length > 0"
                class="space-y-1 text-muted"
              >
                <li
                  v-for="(h, idx) in item.targetAuthorViolationHistory"
                  :key="idx"
                >
                  {{ formatDateTime(h.resolvedAt) }}: {{ h.penaltySummary }} (lý do: {{ h.reason }})
                </li>
              </ul>
              <p v-else class="text-muted">Chưa có lịch sử vi phạm trước đó.</p>
            </div>
          </div>

          <div class="space-y-2 lg:col-span-5">
            <div class="text-xs">
              <span class="text-muted">Người báo cáo: </span>
              <strong class="font-bold text-ink">
                {{ item.reporter.fullName }}
              </strong>
            </div>

            <div class="rounded-xl bg-surface-2 p-4 text-xs leading-5">
              <p class="font-bold text-ink">Lý do báo cáo:</p>
              <p class="mt-1 text-muted">{{ item.reason }}</p>

              <template v-if="item.actionTaken">
                <p class="mt-3 font-bold text-ink">
                  Kết quả: {{ getActionTakenLabel(item.actionTaken) }}
                </p>
                <p v-if="item.moderationNote" class="mt-0.5 text-muted">
                  Ghi chú: {{ item.moderationNote }}
                </p>
                <p v-if="item.resolvedBy" class="mt-0.5 text-muted">
                  Người xử lý: {{ item.resolvedBy.fullName }} ({{ formatDateTime(item.resolvedAt) }})
                </p>
              </template>
            </div>
          </div>
        </div>

        <!-- Nút hành động theo phân quyền 2 tuyến -->
        <div
          v-if="isActionable(item)"
          data-ui class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-surface-3 pt-4"
        >
          <div class="flex flex-wrap items-center gap-2">
            <button
              type="button"
              class="manage-button-secondary text-xs"
              @click="openActionModal(item, 'DISMISS')"
            >
              <span>Bỏ qua báo cáo</span>
            </button>

            <button
              type="button"
              class="manage-button-primary text-xs"
              @click="openActionModal(item, 'DELETE_AND_REMIND')"
            >
              <Trash2 class="h-3.5 w-3.5" />
              <span>Xóa bình luận và nhắc nhở</span>
            </button>

            <!-- Chỉ Giảng viên: chuyển lên Admin -->
            <button
              v-if="!isAdmin"
              type="button"
              class="manage-button-secondary text-xs"
              @click="openActionModal(item, 'ESCALATE')"
            >
              <ArrowUpRight class="h-3.5 w-3.5" />
              <span>Chuyển lên Admin</span>
            </button>

            <!-- Chỉ Admin: xử lý vi phạm và áp dụng hình phạt -->
            <button
              v-if="isAdmin"
              type="button"
              class="inline-flex items-center gap-1.5 rounded-lg bg-[#d97706] px-3.5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              @click="openActionModal(item, 'APPLY_PENALTY')"
            >
              <Gavel class="h-3.5 w-3.5" />
              <span>Xử lý vi phạm và áp dụng hình phạt</span>
            </button>
          </div>

          <button
            v-if="isAdmin"
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-brand-soft transition-colors hover:underline"
            @click="goToManageUsers(item.targetAuthor.fullName)"
          >
            <UserCog class="h-4 w-4" />
            <span>Mở Quản lý người dùng</span>
          </button>
        </div>
      </article>
    </div>

    <!-- Hộp thoại xác nhận xử lý báo cáo -->
    <div
      v-if="activeModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      @click.self="closeActionModal"
    >
      <div
        data-ui
        class="w-full max-w-lg rounded-2xl border border-surface-3 bg-surface p-6 text-ink"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-ink">
            {{ activeModal.title }}
          </h3>
          <button
            type="button"
            class="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink"
            @click="closeActionModal"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <p class="mt-2 text-xs leading-5 text-muted">
          {{ activeModal.description }}
        </p>

        <div class="mt-4 rounded-xl bg-ground p-3.5 text-xs">
          <p class="font-semibold text-ink">
            Tác giả bình luận: {{ activeModal.report.targetAuthor.fullName }}
          </p>
          <p class="mt-1 line-clamp-3 text-muted">
            "{{ activeModal.report.commentContent }}"
          </p>
        </div>

        <!-- Xem trước mức phạt tự động (chỉ khi Admin áp dụng hình phạt) -->
        <div
          v-if="penaltyPreview"
          class="mt-4 space-y-2.5 rounded-xl bg-surface-2 p-3.5 text-xs leading-5"
        >
          <p class="font-bold text-ink">
            Sau lần xử lý này tài khoản có {{ penaltyPreview.count }} lần vi phạm
          </p>
          <p class="text-muted">Mức phạt dự kiến: {{ penaltyPreview.text }}</p>

          <label class="flex cursor-pointer items-center gap-2 font-semibold text-ink">
            <input
              v-model="severeViolation"
              type="checkbox"
              class="h-4 w-4 accent-brand"
            />
            <span>Vi phạm đặc biệt nghiêm trọng, đình chỉ tài khoản ngay</span>
          </label>
        </div>

        <div class="mt-4">
          <label class="block text-xs font-semibold text-ink">
            Ghi chú xử lý, nội dung gửi tới người liên quan (tùy chọn)
          </label>
          <textarea
            v-model="moderationNote"
            rows="3"
            maxlength="500"
            placeholder="Nhập lý do, lời nhắc nhở hoặc ghi chú chuyển Admin..."
            data-ui
            class="mt-1.5 w-full rounded-xl border border-surface-3 bg-ground px-3.5 py-2.5 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
          />
        </div>

        <div class="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            class="manage-button-secondary text-xs"
            @click="closeActionModal"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="submittingAction"
            class="manage-button-primary text-xs"
            @click="confirmResolveAction"
          >
            {{ submittingAction ? 'Đang xử lý...' : 'Xác nhận thực hiện' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
