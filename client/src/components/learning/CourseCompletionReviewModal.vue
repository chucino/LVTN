<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import axios from 'axios';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-vue-next';
import { reviewsApi } from '@/services/reviews.api';

const props = defineProps<{
  open: boolean;
  courseId: string;
  courseTitle: string;
  certificateCode?: string | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'view-certificate'): void;
  (e: 'submitted'): void;
}>();

const rating = ref(5);
const hoverRating = ref(0);
const comment = ref('');
const submitting = ref(false);
const submittedSuccess = ref(false);
const errorMessage = ref<string | null>(null);
const isCommentBanned = ref(false);
const commentBannedUntil = ref<string | null>(null);

const STAR_LABELS: Record<number, string> = {
  1: '1 sao · Chưa hài lòng',
  2: '2 sao · Cần cải thiện',
  3: '3 sao · Bình thường',
  4: '4 sao · Hài lòng',
  5: '5 sao · Rất tuyệt vời',
};

const activeStarDisplay = computed(() => hoverRating.value || rating.value || 5);

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

async function syncMyReviewEligibility(): Promise<void> {
  if (!props.open || !props.courseId) return;
  try {
    const state = await reviewsApi.getMyCourseReviewState(props.courseId);
    isCommentBanned.value = state.isCommentBanned;
    commentBannedUntil.value = state.commentBannedUntil;
    if (state.myReview) {
      rating.value = state.myReview.rating;
      comment.value = state.myReview.comment;
    }
  } catch {
    // ignore background check error
  }
}

async function handleSubmit(): Promise<void> {
  if (submitting.value || !props.courseId) return;
  submitting.value = true;
  errorMessage.value = null;

  try {
    await reviewsApi.upsertMyCourseReview(props.courseId, {
      rating: rating.value,
      comment: isCommentBanned.value ? '' : comment.value.trim(),
    });
    submittedSuccess.value = true;
    emit('submitted');
    setTimeout(() => {
      emit('close');
    }, 1100);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const msg = err.response?.data?.message;
      errorMessage.value = Array.isArray(msg)
        ? String(msg[0])
        : typeof msg === 'string'
          ? msg
          : 'Không thể gửi đánh giá lúc này. Bạn có thể đánh giá lại ở trang khóa học.';
    } else {
      errorMessage.value =
        'Không thể gửi đánh giá lúc này. Bạn có thể đánh giá lại ở trang khóa học.';
    }
  } finally {
    submitting.value = false;
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      submittedSuccess.value = false;
      errorMessage.value = null;
      void syncMyReviewEligibility();
    }
  },
);
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    @click.self="emit('close')"
  >
    <div
      data-ui
      class="w-full max-w-lg rounded-2xl border border-surface-3 bg-surface p-6 text-ink"
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-review-modal-title"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex items-center gap-3">
          <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-tint text-teal">
            <Sparkles class="h-5 w-5" />
          </span>
          <div>
            <h2
              id="completion-review-modal-title"
              class="text-lg font-extrabold text-ink"
            >
              Chúc mừng bạn đã hoàn thành 100% khóa học!
            </h2>
            <p class="mt-0.5 text-xs text-muted">
              {{ courseTitle }}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Đóng hộp thoại"
          @click="emit('close')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div
        v-if="submittedSuccess"
        class="mt-5 flex items-center gap-2.5 rounded-xl bg-teal-tint p-4 text-sm font-semibold text-teal"
        role="status"
      >
        <CheckCircle2 class="h-5 w-5 shrink-0" />
        <span>Cảm ơn bạn đã gửi đánh giá cho khóa học!</span>
      </div>

      <template v-else>
        <p class="mt-4 text-xs leading-5 text-muted">
          Hãy dành vài giây chấm sao và chia sẻ cảm nhận của bạn để giúp các học viên tiếp theo có thêm thông tin tham khảo nhé (không bắt buộc).
        </p>

        <div
          v-if="errorMessage"
          class="mt-3 flex items-center gap-2 rounded-xl bg-rose-500/15 p-3 text-xs font-medium text-rose-200"
          role="alert"
        >
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <div class="mt-4">
          <p class="text-xs font-semibold text-muted">
            Mức độ hài lòng của bạn:
          </p>
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
                @click="rating = star"
              >
                <Star
                  class="h-8 w-8"
                  :class="
                    star <= activeStarDisplay
                      ? 'fill-[#f59e0b] text-[#f59e0b]'
                      : 'text-muted/35'
                  "
                />
              </button>
            </div>
            <span class="text-xs font-bold text-ink">
              {{ STAR_LABELS[activeStarDisplay] }}
            </span>
          </div>
        </div>

        <div
          v-if="isCommentBanned"
          class="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/15 p-3 text-xs leading-5 text-amber-200"
        >
          <AlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <span>
            Tài khoản của bạn tạm thời bị khóa tính năng bình luận đến
            <strong>{{ formatBanDeadline(commentBannedUntil) }}</strong>
            do vi phạm tiêu chuẩn cộng đồng. Bạn vẫn có thể gửi đánh giá bằng số sao.
          </span>
        </div>

        <div v-else class="mt-4">
          <label
            for="modal-review-comment"
            class="block text-xs font-semibold text-muted"
          >
            Nhận xét về khóa học (Không bắt buộc):
          </label>
          <textarea
            id="modal-review-comment"
            v-model="comment"
            rows="3"
            maxlength="2000"
            placeholder="Nhập cảm nhận của bạn hoặc để trống nếu chỉ muốn chấm sao..."
            class="mt-1.5 w-full rounded-xl border border-surface-3 bg-ground px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/60 focus:border-brand focus:outline-none"
          />
        </div>

        <div class="mt-6 flex flex-wrap items-center justify-between gap-2.5">
          <button
            v-if="certificateCode"
            type="button"
            class="inline-flex items-center gap-1.5 text-xs font-bold text-teal hover:underline"
            @click="
              emit('view-certificate');
              emit('close');
            "
          >
            <Award class="h-4 w-4" />
            <span>Xem chứng chỉ ngay</span>
          </button>
          <span v-else />

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="manage-button-secondary text-xs"
              @click="emit('close')"
            >
              Để sau
            </button>
            <button
              type="button"
              :disabled="submitting"
              class="manage-button-primary inline-flex items-center gap-1.5 text-xs"
              @click="handleSubmit"
            >
              <Send class="h-3.5 w-3.5" />
              <span>{{ submitting ? 'Đang gửi...' : 'Gửi đánh giá' }}</span>
            </button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

