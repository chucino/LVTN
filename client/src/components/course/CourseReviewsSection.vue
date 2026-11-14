<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import axios from 'axios';
import {
  AlertCircle,
  CheckCircle2,
  Flag,
  MessageSquarePlus,
  Pencil,
  Send,
  Star,
  X,
} from 'lucide-vue-next';
import { reviewsApi } from '@/services/reviews.api';
import { useAuthStore } from '@/stores/auth.store';
import type {
  CourseReviewItem,
  CourseReviewSummary,
  MyCourseReviewState,
} from '@/types/review';

const props = defineProps<{
  courseId: string;
}>();

const emit = defineEmits<{
  (e: 'rating-updated', avgRating: number): void;
}>();

const authStore = useAuthStore();

const loading = ref(true);
const error = ref<string | null>(null);
const selectedStarFilter = ref<number | undefined>(undefined);

const summary = ref<CourseReviewSummary>({
  avgRating: 0,
  totalReviews: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
});
const reviews = ref<CourseReviewItem[]>([]);
const myState = ref<MyCourseReviewState | null>(null);

// Trạng thái form đánh giá của học viên
const isEditingMyReview = ref(false);
const draftRating = ref(5);
const hoverRating = ref(0);
const draftComment = ref('');
const submittingReview = ref(false);
const reviewFormError = ref<string | null>(null);
const reviewFormSuccess = ref<string | null>(null);

// Trạng thái hộp thoại báo cáo vi phạm
const reportingReview = ref<CourseReviewItem | null>(null);
const reportReason = ref('');
const submittingReport = ref(false);
const reportFeedback = ref<string | null>(null);
const reportError = ref<string | null>(null);

const STAR_LABELS: Record<number, string> = {
  1: '1 sao · Chưa hài lòng',
  2: '2 sao · Cần cải thiện',
  3: '3 sao · Bình thường',
  4: '4 sao · Hài lòng',
  5: '5 sao · Rất tuyệt vời',
};

const activeStarDisplay = computed(
  () => hoverRating.value || draftRating.value || 5,
);

const showReviewEditorForm = computed(() => {
  if (!myState.value?.canReview) return false;
  if (!myState.value.myReview) return true;
  if (myState.value.myReview.visibilityStatus === 'HIDDEN') return false;
  return isEditingMyReview.value;
});

/** Nhóm 1: Đánh giá có kèm nhận xét chữ (ưu tiên hiển thị lên đầu) */
const reviewsWithComment = computed(() =>
  reviews.value.filter((item) => item.hasComment && item.comment.trim().length > 0),
);

/** Nhóm 2: Đánh giá chỉ chấm sao, không có chữ (đưa xuống dưới cùng, hiển thị thẻ gọn) */
const reviewsRatingOnly = computed(() =>
  reviews.value.filter((item) => !item.hasComment || item.comment.trim().length === 0),
);

function getStarPercentage(star: 1 | 2 | 3 | 4 | 5): number {
  const total = summary.value.totalReviews;
  if (total <= 0) return 0;
  const count = summary.value.distribution[star] ?? 0;
  return Math.round((count / total) * 100);
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((p) => p[0] ?? '')
    .join('')
    .toUpperCase();
}

function formatReviewTime(iso: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return 'Vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function formatBanDeadline(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function extractApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.message;
    if (Array.isArray(msg) && msg.length > 0) return String(msg[0]);
    if (typeof msg === 'string' && msg.trim()) return msg;
  }
  return fallback;
}

function isReportedByMe(reviewId: string): boolean {
  return Boolean(myState.value?.reportedReviewIds.includes(reviewId));
}

function canReportReview(item: CourseReviewItem): boolean {
  if (!authStore.isAuthenticated || !authStore.user) return false;
  if (!item.hasComment || !item.comment.trim()) return false;
  return item.author.id !== authStore.user.id;
}

async function loadReviews(): Promise<void> {
  if (!props.courseId) return;
  loading.value = true;
  error.value = null;

  try {
    const [listData, stateData] = await Promise.all([
      reviewsApi.listCourseReviews(props.courseId, selectedStarFilter.value),
      authStore.isAuthenticated
        ? reviewsApi.getMyCourseReviewState(props.courseId).catch(() => null)
        : Promise.resolve(null),
    ]);

    summary.value = listData.summary;
    reviews.value = listData.items;
    myState.value = stateData;

    if (stateData?.myReview) {
      draftRating.value = stateData.myReview.rating;
      draftComment.value = stateData.myReview.comment;
    } else {
      draftRating.value = 5;
      draftComment.value = '';
    }
  } catch (err) {
    error.value = extractApiError(
      err,
      'Không thể tải danh sách đánh giá của khóa học.',
    );
  } finally {
    loading.value = false;
  }
}

function selectStarFilter(star?: number): void {
  selectedStarFilter.value =
    selectedStarFilter.value === star ? undefined : star;
  void loadReviews();
}

function startEditingMyReview(): void {
  if (!myState.value?.myReview) return;
  draftRating.value = myState.value.myReview.rating;
  draftComment.value = myState.value.myReview.comment;
  reviewFormError.value = null;
  reviewFormSuccess.value = null;
  isEditingMyReview.value = true;
}

function cancelEditingMyReview(): void {
  isEditingMyReview.value = false;
  reviewFormError.value = null;
}

async function handleSubmitMyReview(): Promise<void> {
  if (submittingReview.value) return;
  submittingReview.value = true;
  reviewFormError.value = null;
  reviewFormSuccess.value = null;

  try {
    const commentPayload = myState.value?.isCommentBanned
      ? ''
      : draftComment.value.trim();

    const result = await reviewsApi.upsertMyCourseReview(props.courseId, {
      rating: draftRating.value,
      comment: commentPayload,
    });

    reviewFormSuccess.value = result.message;
    isEditingMyReview.value = false;
    summary.value = result.summary;
    emit('rating-updated', result.summary.avgRating);
    await loadReviews();
  } catch (err) {
    reviewFormError.value = extractApiError(
      err,
      'Không thể lưu đánh giá khóa học. Vui lòng thử lại.',
    );
  } finally {
    submittingReview.value = false;
  }
}

function openReportDialog(item: CourseReviewItem): void {
  reportingReview.value = item;
  reportReason.value = '';
  reportError.value = null;
  reportFeedback.value = null;
}

function closeReportDialog(): void {
  reportingReview.value = null;
  reportReason.value = '';
  reportError.value = null;
}

async function handleSubmitReport(): Promise<void> {
  if (!reportingReview.value || submittingReport.value) return;
  const trimmed = reportReason.value.trim();
  if (trimmed.length < 3) {
    reportError.value = 'Vui lòng nhập lý do báo cáo ít nhất 3 ký tự.';
    return;
  }

  submittingReport.value = true;
  reportError.value = null;

  try {
    const res = await reviewsApi.reportCourseReview(
      props.courseId,
      reportingReview.value.id,
      trimmed,
    );
    if (
      myState.value &&
      !myState.value.reportedReviewIds.includes(reportingReview.value.id)
    ) {
      myState.value.reportedReviewIds.push(reportingReview.value.id);
    }
    reportFeedback.value = res.message;
    closeReportDialog();
  } catch (err) {
    reportError.value = extractApiError(
      err,
      'Không thể gửi báo cáo vi phạm. Vui lòng thử lại.',
    );
  } finally {
    submittingReport.value = false;
  }
}

watch(
  () => props.courseId,
  (id) => {
    if (id) {
      selectedStarFilter.value = undefined;
      void loadReviews();
    }
  },
  { immediate: true },
);
</script>

<template>
  <section
    aria-labelledby="course-reviews-heading"
    class="space-y-6 pt-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 id="course-reviews-heading" class="text-2xl font-bold text-ink">
          Đánh giá từ học viên
        </h2>
        <p class="mt-1 text-sm text-muted">
          Chia sẻ thực tế từ những học viên đã hoàn thành 100% khóa học này
        </p>
      </div>
    </div>

    <!-- Thông báo gửi báo cáo thành công -->
    <div
      v-if="reportFeedback"
      class="flex items-center justify-between gap-3 bg-teal-tint p-4 text-sm font-medium text-teal"
      role="status"
    >
      <div class="flex items-center gap-2">
        <CheckCircle2 class="h-4 w-4 shrink-0" />
        <span>{{ reportFeedback }}</span>
      </div>
      <button
        type="button"
        class="text-xs underline"
        @click="reportFeedback = null"
      >
        Đóng
      </button>
    </div>

    <!-- Khối Thống kê tổng quan điểm trung bình & Phân bổ 1-5 sao -->
    <div class="grid gap-6 bg-surface p-6 sm:grid-cols-12 sm:items-center">
      <div class="flex flex-col items-center justify-center text-center sm:col-span-4">
        <p class="font-display text-5xl font-extrabold tabular-nums text-ink">
          {{ summary.avgRating > 0 ? summary.avgRating.toFixed(1) : '0.0' }}
        </p>
        <div class="mt-2 flex items-center gap-1" aria-hidden="true">
          <Star
            v-for="s in 5"
            :key="s"
            class="h-5 w-5"
            :class="
              s <= Math.round(summary.avgRating)
                ? 'fill-[#f59e0b] text-[#f59e0b]'
                : 'text-muted/35'
            "
          />
        </div>
        <p class="mt-2 text-xs font-semibold tabular-nums text-muted">
          {{ summary.totalReviews }} lượt đánh giá
        </p>
      </div>

      <div class="space-y-2 sm:col-span-8">
        <button
          v-for="star in ([5, 4, 3, 2, 1] as const)"
          :key="star"
          type="button"
          class="flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-surface-2"
          :class="selectedStarFilter === star ? 'bg-surface-2 font-bold text-ink' : 'text-muted'"
          @click="selectStarFilter(star)"
        >
          <span class="inline-flex w-14 shrink-0 items-center gap-1 font-semibold tabular-nums text-ink">
            <span>{{ star }} sao</span>
          </span>
          <div class="h-2 flex-1 overflow-hidden rounded-full bg-ground">
            <div
              class="h-full rounded-full bg-[#f59e0b] transition-all"
              :style="{ width: `${getStarPercentage(star)}%` }"
            />
          </div>
          <span class="w-16 shrink-0 text-right tabular-nums">
            {{ summary.distribution[star] }} ({{ getStarPercentage(star) }}%)
          </span>
        </button>

        <!-- Bộ lọc nhanh theo số sao -->
        <div class="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            class="rounded-full px-3 py-1 text-xs font-semibold transition-colors"
            :class="
              selectedStarFilter === undefined
                ? 'bg-brand text-white'
                : 'bg-ground text-muted hover:text-ink'
            "
            @click="selectStarFilter(undefined)"
          >
            Tất cả ({{ summary.totalReviews }})
          </button>
          <button
            v-for="star in ([5, 4, 3, 2, 1] as const)"
            :key="`pill-${star}`"
            type="button"
            class="rounded-full px-3 py-1 text-xs font-semibold tabular-nums transition-colors"
            :class="
              selectedStarFilter === star
                ? 'bg-brand text-white'
                : 'bg-ground text-muted hover:text-ink'
            "
            @click="selectStarFilter(star)"
          >
            {{ star }} sao ({{ summary.distribution[star] }})
          </button>
        </div>
      </div>
    </div>

    <!-- Khung "Đánh giá của bạn" ở ngay đầu khu vực Đánh giá (chỉ hiển thị với học viên đã hoàn thành 100% hoặc đã gửi đánh giá trước đó) -->
    <div
      v-if="myState?.canReview"
      data-ui
      class="bg-surface p-6"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <MessageSquarePlus class="h-5 w-5 text-brand" />
          <h3 class="text-base font-bold text-ink">
            {{
              myState.myReview
                ? 'Đánh giá của bạn về khóa học này'
                : 'Bạn đã hoàn thành khóa học! Hãy để lại đánh giá của bạn'
            }}
          </h3>
        </div>

        <button
          v-if="
            myState.myReview &&
            myState.myReview.visibilityStatus !== 'HIDDEN' &&
            !isEditingMyReview
          "
          type="button"
          class="manage-button-secondary inline-flex items-center gap-1.5 text-xs"
          @click="startEditingMyReview"
        >
          <Pencil class="h-3.5 w-3.5" />
          <span>Chỉnh sửa đánh giá</span>
        </button>
      </div>

      <div
        v-if="reviewFormSuccess"
        class="mt-4 flex items-center gap-2 bg-teal-tint p-3.5 text-xs font-semibold text-teal"
        role="status"
      >
        <CheckCircle2 class="h-4 w-4 shrink-0" />
        <span>{{ reviewFormSuccess }}</span>
      </div>

      <div
        v-if="reviewFormError"
        class="mt-4 flex items-center gap-2 bg-rose-500/15 p-3.5 text-xs font-semibold text-rose-200"
        role="alert"
      >
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>{{ reviewFormError }}</span>
      </div>

      <!-- Trường hợp đánh giá của học viên đã bị ẩn do vi phạm -->
      <div
        v-if="myState.myReview && myState.myReview.visibilityStatus === 'HIDDEN'"
        class="mt-4 bg-ground p-4 text-xs leading-5 text-muted"
      >
        Đánh giá của bạn đã bị ẩn do vi phạm tiêu chuẩn cộng đồng và không thể chỉnh sửa lại.
        <span v-if="myState.myReview.moderationNote" class="block mt-1 font-medium text-ink">
          Lý do: {{ myState.myReview.moderationNote }}
        </span>
      </div>

      <!-- Form nhập mới hoặc chỉnh sửa đánh giá -->
      <form
        v-else-if="showReviewEditorForm"
        class="mt-4 space-y-4"
        @submit.prevent="handleSubmitMyReview"
      >
        <div>
          <label class="block text-xs font-semibold text-muted">
            Chọn mức độ hài lòng của bạn (1 đến 5 sao):
          </label>
          <div class="mt-2 flex flex-wrap items-center gap-3">
            <div
              class="inline-flex items-center gap-1"
              @mouseleave="hoverRating = 0"
            >
              <button
                v-for="star in 5"
                :key="star"
                type="button"
                class="rounded p-1 transition-transform hover:scale-110"
                :aria-label="`Chọn ${star} sao`"
                @mouseenter="hoverRating = star"
                @click="draftRating = star"
              >
                <Star
                  class="h-7 w-7"
                  :class="
                    star <= activeStarDisplay
                      ? 'fill-[#f59e0b] text-[#f59e0b]'
                      : 'text-muted/40'
                  "
                />
              </button>
            </div>
            <span class="text-xs font-bold text-ink">
              {{ STAR_LABELS[activeStarDisplay] }}
            </span>
          </div>
        </div>

        <!-- Nếu tài khoản đang bị cấm bình luận (#035) -->
        <div
          v-if="myState.isCommentBanned"
          class="flex items-start gap-2.5 bg-amber-500/15 p-3.5 text-xs leading-5 text-amber-200"
          role="alert"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>
            Tài khoản của bạn tạm thời bị khóa tính năng bình luận đến
            <strong>{{ formatBanDeadline(myState.commentBannedUntil) }}</strong>
            do vi phạm tiêu chuẩn cộng đồng. Bạn vẫn có thể gửi đánh giá bằng số sao.
          </span>
        </div>

        <div v-else>
          <label
            for="course-review-comment-input"
            class="block text-xs font-semibold text-muted"
          >
            Nhận xét về khóa học (Không bắt buộc):
          </label>
          <textarea
            id="course-review-comment-input"
            v-model="draftComment"
            rows="3"
            maxlength="2000"
            placeholder="Chia sẻ cảm nhận của bạn về nội dung bài giảng, giảng viên hoặc kiến thức thu được..."
            class="mt-1.5 w-full rounded-xl border border-surface-3 bg-ground px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
          />
        </div>

        <div class="flex flex-wrap items-center justify-end gap-2.5">
          <button
            v-if="myState.myReview"
            type="button"
            class="manage-button-secondary text-xs"
            @click="cancelEditingMyReview"
          >
            Hủy
          </button>
          <button
            type="submit"
            :disabled="submittingReview"
            class="manage-button-primary inline-flex items-center gap-1.5 text-xs"
          >
            <Send class="h-3.5 w-3.5" />
            <span>
              {{
                submittingReview
                  ? 'Đang lưu...'
                  : myState.myReview
                    ? 'Cập nhật đánh giá'
                    : 'Gửi đánh giá'
              }}
            </span>
          </button>
        </div>
      </form>

      <!-- Hiển thị đánh giá đã gửi của bản thân khi không ở chế độ chỉnh sửa -->
      <div
        v-else-if="myState.myReview"
        class="mt-4 bg-ground p-4"
      >
        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-0.5" aria-label="Số sao bạn đã chấm">
            <Star
              v-for="s in 5"
              :key="s"
              class="h-4 w-4"
              :class="
                s <= myState.myReview.rating
                  ? 'fill-[#f59e0b] text-[#f59e0b]'
                  : 'text-muted/35'
              "
            />
          </div>
          <span class="text-xs font-bold text-ink">
            {{ STAR_LABELS[myState.myReview.rating] }}
          </span>
          <span class="text-xs text-muted">
            · Cập nhật {{ formatReviewTime(myState.myReview.updatedAt) }}
          </span>
        </div>
        <p
          v-if="myState.myReview.hasComment && myState.myReview.comment"
          class="mt-2.5 whitespace-pre-line text-sm leading-6 text-ink"
        >
          {{ myState.myReview.comment }}
        </p>
      </div>
    </div>

    <!-- Danh sách đánh giá của học viên -->
    <div v-if="loading" class="space-y-3" aria-busy="true">
      <div v-for="n in 3" :key="n" class="h-24 bg-surface p-5" />
    </div>

    <div
      v-else-if="error"
      class="bg-surface p-6 text-sm text-brand-soft"
      role="alert"
    >
      {{ error }}
    </div>

    <div
      v-else-if="reviews.length === 0"
      class="bg-surface p-10 text-center"
    >
      <p class="text-sm font-semibold text-ink">
        {{
          selectedStarFilter
            ? `Chưa có đánh giá nào ở mức ${selectedStarFilter} sao.`
            : 'Chưa có đánh giá nào cho khóa học này.'
        }}
      </p>
      <p class="mt-1 text-xs text-muted">
        Học viên hoàn thành 100% khóa học có thể để lại số sao và nhận xét tại đây.
      </p>
    </div>

    <div v-else class="space-y-4">
      <!-- Nhóm 1 (Ưu tiên đầu danh sách): Các đánh giá có kèm nhận xét chữ -->
      <div v-if="reviewsWithComment.length > 0" class="space-y-3">
        <article
          v-for="item in reviewsWithComment"
          :key="item.id"
          class="bg-surface p-5"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="flex items-center gap-3">
              <img
                v-if="item.author.avatar"
                :src="item.author.avatar"
                :alt="item.author.fullName"
                class="h-10 w-10 rounded-full object-cover"
              />
              <span
                v-else
                aria-hidden="true"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
              >
                {{ getInitials(item.author.fullName) }}
              </span>

              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-bold text-ink">
                    {{ item.author.fullName }}
                  </span>
                  <span class="text-xs text-muted tabular-nums">
                    · {{ formatReviewTime(item.createdAt) }}
                  </span>
                  <span
                    v-if="item.isEdited"
                    class="text-[11px] text-muted"
                  >
                    (đã chỉnh sửa)
                  </span>
                </div>

                <div class="mt-1 flex items-center gap-0.5" :aria-label="`${item.rating} trên 5 sao`">
                  <Star
                    v-for="s in 5"
                    :key="s"
                    class="h-3.5 w-3.5"
                    :class="
                      s <= item.rating
                        ? 'fill-[#f59e0b] text-[#f59e0b]'
                        : 'text-muted/35'
                    "
                  />
                </div>
              </div>
            </div>

            <!-- Nút Báo cáo vi phạm (chỉ hiện trên đánh giá có chữ của người khác) -->
            <button
              v-if="canReportReview(item)"
              type="button"
              :disabled="isReportedByMe(item.id)"
              class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
              :class="
                isReportedByMe(item.id)
                  ? 'cursor-default text-muted/60'
                  : 'text-muted hover:bg-surface-2 hover:text-brand-soft'
              "
              @click="openReportDialog(item)"
            >
              <Flag class="h-3.5 w-3.5" />
              <span>
                {{ isReportedByMe(item.id) ? 'Đã báo cáo' : 'Báo cáo vi phạm' }}
              </span>
            </button>
          </div>

          <p class="mt-3 whitespace-pre-line text-sm leading-6 text-ink">
            {{ item.comment }}
          </p>
        </article>
      </div>

      <!-- Nhóm 2 (Đưa xuống phía dưới cùng): Các đánh giá chỉ chấm sao, không có chữ (Thẻ gọn 1 dòng, không khoảng trắng thừa, ẩn nút báo cáo) -->
      <div v-if="reviewsRatingOnly.length > 0" class="space-y-2 pt-1">
        <div
          v-for="item in reviewsRatingOnly"
          :key="item.id"
          class="flex flex-wrap items-center justify-between gap-3 bg-surface px-4 py-3 text-xs"
        >
          <div class="flex flex-wrap items-center gap-2.5">
            <img
              v-if="item.author.avatar"
              :src="item.author.avatar"
              :alt="item.author.fullName"
              class="h-7 w-7 rounded-full object-cover"
            />
            <span
              v-else
              aria-hidden="true"
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-bold text-ink"
            >
              {{ getInitials(item.author.fullName) }}
            </span>

            <span class="font-semibold text-ink">
              {{ item.author.fullName }}
            </span>

            <span class="text-muted">•</span>

            <div class="inline-flex items-center gap-0.5" :aria-label="`${item.rating} trên 5 sao`">
              <Star
                v-for="s in 5"
                :key="s"
                class="h-3.5 w-3.5"
                :class="
                  s <= item.rating
                    ? 'fill-[#f59e0b] text-[#f59e0b]'
                    : 'text-muted/35'
                "
              />
            </div>

            <span class="text-muted">•</span>

            <span class="text-muted tabular-nums">
              {{ formatReviewTime(item.createdAt) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Hộp thoại Báo cáo đánh giá vi phạm -->
    <div
      v-if="reportingReview"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
      @click.self="closeReportDialog"
    >
      <div
        data-ui
        class="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 text-ink"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-base font-bold text-ink">
            Báo cáo nhận xét đánh giá vi phạm
          </h3>
          <button
            type="button"
            class="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink"
            @click="closeReportDialog"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <p class="mt-2 text-xs leading-5 text-muted">
          Báo cáo đánh giá của
          <strong class="text-ink">{{ reportingReview.author.fullName }}</strong>
          sẽ được chuyển tới bộ phận kiểm duyệt khóa học.
        </p>

        <div
          v-if="reportError"
          class="mt-3 flex items-center gap-2 bg-rose-500/15 p-3 text-xs font-medium text-rose-200"
          role="alert"
        >
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ reportError }}</span>
        </div>

        <div class="mt-4">
          <label
            for="review-report-reason"
            class="block text-xs font-semibold text-muted"
          >
            Lý do báo cáo vi phạm:
          </label>
          <textarea
            id="review-report-reason"
            v-model="reportReason"
            rows="3"
            maxlength="500"
            placeholder="Nhập lý do cụ thể (ví dụ: ngôn từ xúc phạm, quảng cáo spam, nội dung sai sự thật)..."
            class="mt-1.5 w-full rounded-xl border border-surface-3 bg-ground px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
          />
        </div>

        <div class="mt-5 flex justify-end gap-2">
          <button
            type="button"
            class="manage-button-secondary text-xs"
            @click="closeReportDialog"
          >
            Hủy
          </button>
          <button
            type="button"
            :disabled="submittingReport"
            class="manage-button-primary text-xs"
            @click="handleSubmitReport"
          >
            {{ submittingReport ? 'Đang gửi...' : 'Gửi báo cáo' }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

