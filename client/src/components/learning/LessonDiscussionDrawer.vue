<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import {
  AlertCircle,
  Bold,
  ChevronDown,
  ChevronUp,
  Code,
  EyeOff,
  FileCode2,
  Flag,
  Italic,
  Lock,
  MessageCircle,
  MoreHorizontal,
  Quote,
  ThumbsUp,
  Trash2,
  X,
} from 'lucide-vue-next';
import { getCourseErrorMessage } from '@/lib/course-format';
import { questionsApi } from '@/services/questions.api';
import { useAuthStore } from '@/stores/auth.store';
import type { CommentAuthor, LessonCommentItem } from '@/types/learning';

const props = defineProps<{
  open: boolean;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update:totalComments', total: number): void;
}>();

const authStore = useAuthStore();

const REPLIES_PAGE_SIZE = 5;

const REPORT_REASONS = [
  'Bình luận spam hoặc quảng cáo trái phép',
  'Ngôn từ không chuẩn mực, xúc phạm người khác',
  'Nội dung sai lệch hoặc không liên quan bài học',
  'Chia sẻ thông tin nhạy cảm / vi phạm bản quyền',
];

const loading = ref(false);
const error = ref<string | null>(null);
const actionNotice = ref<string | null>(null);

const comments = ref<LessonCommentItem[]>([]);
const totalComments = ref(0);
const myCommentBannedUntil = ref<string | null>(null);

const isCommentBanned = computed(() => {
  if (!myCommentBannedUntil.value) return false;
  return new Date(myCommentBannedUntil.value).getTime() > Date.now();
});

const commentBanMessage = computed(() => {
  if (!myCommentBannedUntil.value) return '';
  const deadline = new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(myCommentBannedUntil.value));
  return `Tài khoản của bạn tạm thời bị khóa tính năng bình luận đến ${deadline} do vi phạm tiêu chuẩn cộng đồng`;
});

// Ô nhập bình luận mới ở đầu Drawer
const rootComposerExpanded = ref(false);
const rootContent = ref('');
const submittingRoot = ref(false);
const rootTextareaRef = ref<HTMLTextAreaElement | null>(null);

// Ô nhập phản hồi dưới bình luận
const activeReplyTarget = ref<{
  rootCommentId: string;
  targetCommentId: string;
  replyToUserId: string;
  replyToFullName: string;
} | null>(null);
const replyContent = ref('');
const submittingReply = ref(false);
const replyTextareaRef = ref<HTMLTextAreaElement | null>(null);

// Quản lý hiển thị luồng câu trả lời theo từng bước 5 câu trả lời
const visibleRepliesCount = reactive<Record<string, number>>({});

// Quản lý menu "..." và hộp thoại báo cáo vi phạm
const openMenuCommentId = ref<string | null>(null);
const reportingComment = ref<LessonCommentItem | null>(null);
const selectedReportReason = ref(REPORT_REASONS[0] ?? '');
const customReportReason = ref('');
const submittingReport = ref(false);
const deletingCommentId = ref<string | null>(null);

// Quản lý lỗi ảnh đại diện
const brokenAvatars = reactive<Record<string, boolean>>({});

const currentUserInitials = computed(() =>
  getInitials(authStore.user?.fullName || 'Học viên'),
);

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'HV';
  if (parts.length === 1) return (parts[0]?.slice(0, 2) ?? 'HV').toUpperCase();
  const first = parts[0]?.[0] ?? 'H';
  const last = parts[parts.length - 1]?.[0] ?? 'V';
  return `${first}${last}`.toUpperCase();
}

function getAuthorBadge(
  author: CommentAuthor,
): { label: string; className: string } | null {
  if (author.role === 'ADMIN') {
    return {
      label: 'QUẢN TRỊ VIÊN',
      className: 'bg-tint text-brand-soft',
    };
  }
  if (author.isCourseAuthor) {
    return {
      label: 'TÁC GIẢ',
      className: 'bg-teal-tint text-teal',
    };
  }
  if (author.role === 'INSTRUCTOR') {
    return {
      label: 'GIẢNG VIÊN',
      className: 'bg-tint text-brand-soft',
    };
  }
  return null;
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 45) return 'vừa xong';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} ngày trước`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} tháng trước`;
  const diffYear = Math.floor(diffMonth / 12);
  return `${diffYear} năm trước`;
}

function recomputeTotalComments(): void {
  const count =
    comments.value.length +
    comments.value.reduce((sum, item) => sum + item.replies.length, 0);
  totalComments.value = count;
  emit('update:totalComments', count);
}

async function fetchComments(): Promise<void> {
  if (!props.courseId || !props.lessonId) return;
  loading.value = true;
  error.value = null;

  try {
    const res = await questionsApi.listLessonComments(
      props.courseId,
      props.lessonId,
    );
    comments.value = res.items;
    totalComments.value = res.totalComments;
    myCommentBannedUntil.value = res.myCommentBannedUntil;
    emit('update:totalComments', res.totalComments);
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

function openRootComposer(): void {
  if (isCommentBanned.value) return;
  rootComposerExpanded.value = true;
  setTimeout(() => {
    rootTextareaRef.value?.focus();
  }, 20);
}

function cancelRootComposer(): void {
  rootContent.value = '';
  rootComposerExpanded.value = false;
}

function insertFormatToTextarea(
  target: 'root' | 'reply',
  syntax: 'bold' | 'italic' | 'quote' | 'code' | 'codeblock',
): void {
  const isRoot = target === 'root';
  const currentText = isRoot ? rootContent.value : replyContent.value;
  let snippet = '';

  if (syntax === 'bold') snippet = '**văn bản in đậm**';
  else if (syntax === 'italic') snippet = '*văn bản in nghiêng*';
  else if (syntax === 'quote') snippet = '\n> Trích dẫn câu hỏi\n';
  else if (syntax === 'code') snippet = '`code`';
  else if (syntax === 'codeblock') snippet = '\n```\n// Viết code tại đây\n```\n';

  const nextValue = currentText ? `${currentText} ${snippet}` : snippet.trimStart();
  if (isRoot) {
    rootContent.value = nextValue;
    rootTextareaRef.value?.focus();
  } else {
    replyContent.value = nextValue;
    replyTextareaRef.value?.focus();
  }
}

async function submitRootComment(): Promise<void> {
  const trimmed = rootContent.value.trim();
  if (!trimmed || submittingRoot.value) return;

  submittingRoot.value = true;
  error.value = null;

  try {
    const created = await questionsApi.createLessonComment(
      props.courseId,
      props.lessonId,
      { content: trimmed },
    );
    comments.value = [created, ...comments.value];
    rootContent.value = '';
    rootComposerExpanded.value = false;
    recomputeTotalComments();
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    submittingRoot.value = false;
  }
}

function startReply(
  rootComment: LessonCommentItem,
  targetComment: LessonCommentItem,
): void {
  if (isCommentBanned.value) return;
  activeReplyTarget.value = {
    rootCommentId: rootComment.id,
    targetCommentId: targetComment.id,
    replyToUserId: targetComment.author.id,
    replyToFullName: targetComment.author.fullName,
  };
  replyContent.value = '';
  openMenuCommentId.value = null;
  setTimeout(() => {
    replyTextareaRef.value?.focus();
  }, 20);
}

function cancelReply(): void {
  activeReplyTarget.value = null;
  replyContent.value = '';
}

async function submitReply(): Promise<void> {
  if (!activeReplyTarget.value || submittingReply.value) return;
  const trimmed = replyContent.value.trim();
  if (!trimmed) return;

  submittingReply.value = true;
  error.value = null;

  const { rootCommentId, replyToUserId } = activeReplyTarget.value;

  try {
    const created = await questionsApi.createLessonComment(
      props.courseId,
      props.lessonId,
      {
        content: trimmed,
        parentId: rootCommentId,
        replyToUserId,
      },
    );

    const rootItem = comments.value.find((item) => item.id === rootCommentId);
    if (rootItem) {
      rootItem.replies.push(created);
      const currentShown = visibleRepliesCount[rootCommentId] ?? 0;
      if (currentShown === 0) {
        visibleRepliesCount[rootCommentId] = Math.min(
          REPLIES_PAGE_SIZE,
          rootItem.replies.length,
        );
      } else {
        visibleRepliesCount[rootCommentId] = rootItem.replies.length;
      }
    }

    activeReplyTarget.value = null;
    replyContent.value = '';
    recomputeTotalComments();
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    submittingReply.value = false;
  }
}

function expandRepliesBatch(rootComment: LessonCommentItem): void {
  const total = rootComment.replies.length;
  const current = visibleRepliesCount[rootComment.id] ?? 0;
  visibleRepliesCount[rootComment.id] = Math.min(
    total,
    current + REPLIES_PAGE_SIZE,
  );
}

function collapseAllReplies(rootCommentId: string): void {
  visibleRepliesCount[rootCommentId] = 0;
}

function getVisibleReplies(rootComment: LessonCommentItem): LessonCommentItem[] {
  const limit = visibleRepliesCount[rootComment.id] ?? 0;
  if (limit <= 0) return [];
  return rootComment.replies.slice(0, limit);
}

function getRemainingRepliesCount(rootComment: LessonCommentItem): number {
  const limit = visibleRepliesCount[rootComment.id] ?? 0;
  return Math.max(0, rootComment.replies.length - limit);
}

async function handleToggleLike(
  targetComment: LessonCommentItem,
): Promise<void> {
  if (targetComment.visibilityStatus === 'HIDDEN') return;
  try {
    const updated = await questionsApi.toggleCommentReaction(
      props.courseId,
      props.lessonId,
      targetComment.id,
      'LIKE',
    );
    targetComment.myReaction = updated.myReaction;
    targetComment.totalReactions = updated.totalReactions;
    targetComment.reactionSummary = updated.reactionSummary;
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  }
}

function openReportDialog(targetComment: LessonCommentItem): void {
  openMenuCommentId.value = null;
  reportingComment.value = targetComment;
  selectedReportReason.value = REPORT_REASONS[0] ?? '';
  customReportReason.value = '';
}

function closeReportDialog(): void {
  reportingComment.value = null;
  customReportReason.value = '';
}

async function submitReportViolation(): Promise<void> {
  if (!reportingComment.value || submittingReport.value) return;
  const finalReason =
    customReportReason.value.trim() || selectedReportReason.value.trim();
  if (finalReason.length < 3) return;

  submittingReport.value = true;
  error.value = null;

  try {
    const res = await questionsApi.reportComment(
      props.courseId,
      props.lessonId,
      reportingComment.value.id,
      finalReason,
    );
    reportingComment.value.isReportedByMe = res.isReportedByMe;
    reportingComment.value.reportsCount = res.reportsCount;
    actionNotice.value = res.message;
    closeReportDialog();
    setTimeout(() => {
      actionNotice.value = null;
    }, 5000);
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    submittingReport.value = false;
  }
}

async function handleDeleteComment(
  commentId: string,
  parentId: string | null,
): Promise<void> {
  if (deletingCommentId.value) return;
  openMenuCommentId.value = null;
  deletingCommentId.value = commentId;
  error.value = null;

  try {
    await questionsApi.deleteComment(
      props.courseId,
      props.lessonId,
      commentId,
    );

    if (!parentId) {
      comments.value = comments.value.filter((item) => item.id !== commentId);
      delete visibleRepliesCount[commentId];
    } else {
      const parentItem = comments.value.find((item) => item.id === parentId);
      if (parentItem) {
        parentItem.replies = parentItem.replies.filter(
          (reply) => reply.id !== commentId,
        );
        const currentVisible = visibleRepliesCount[parentId] ?? 0;
        if (currentVisible > parentItem.replies.length) {
          visibleRepliesCount[parentId] = parentItem.replies.length;
        }
      }
    }

    recomputeTotalComments();
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    deletingCommentId.value = null;
  }
}

function handleKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape' && props.open) {
    if (reportingComment.value) {
      closeReportDialog();
      return;
    }
    emit('close');
  }
}

watch(
  () => [props.courseId, props.lessonId],
  ([newCourseId, newLessonId]) => {
    if (newCourseId && newLessonId) {
      activeReplyTarget.value = null;
      openMenuCommentId.value = null;
      reportingComment.value = null;
      void fetchComments();
    }
  },
  { immediate: true },
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen && props.courseId && props.lessonId) {
      void fetchComments();
    } else {
      openMenuCommentId.value = null;
    }
  },
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      data-ui
      class="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="Hỏi đáp bài học"
    >
      <!-- Lớp nền mờ phía sau -->
      <div
        class="fixed inset-0 bg-black/45 transition-opacity"
        @click="emit('close')"
      />

      <!-- Khung Drawer trượt từ bên phải -->
      <aside
        data-ui class="relative z-10 flex h-full w-full max-w-[680px] flex-col border-l border-surface-3 bg-surface text-ink"
        @click="openMenuCommentId = null"
      >
        <!-- Thanh tiêu đề trên cùng + Nút đóng -->
        <div
          data-ui class="flex items-center justify-between border-b border-surface-3 px-6 py-4"
        >
          <div class="min-w-0 pr-4">
            <h2 class="truncate text-base font-bold text-ink">
              Hỏi đáp bài học
            </h2>
            <p class="mt-0.5 truncate text-xs text-muted">
              {{ lessonTitle }}
            </p>
          </div>

          <button
            type="button"
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Đóng cửa sổ hỏi đáp"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Vùng cuộn nội dung bình luận -->
        <div class="flex-1 overflow-y-auto px-6 py-5">
          <!-- Thông báo lỗi hoặc xác nhận báo cáo -->
          <div
            v-if="error"
            class="manage-alert-error mb-4"
            role="alert"
          >
            <AlertCircle class="h-4 w-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <div
            v-if="actionNotice"
            class="mb-4 rounded-xl bg-teal-tint px-4 py-3 text-xs font-semibold text-teal"
            role="status"
          >
            {{ actionNotice }}
          </div>

          <!-- Khu vực nhập bình luận mới ở đầu trang -->
          <div class="mb-6">
            <div class="flex items-start gap-3">
              <!-- Avatar học viên hiện tại -->
              <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy text-white">
                <img
                  v-if="authStore.user?.avatar && !brokenAvatars['me']"
                  :src="authStore.user.avatar"
                  :alt="authStore.user.fullName"
                  class="h-full w-full object-cover"
                  @error="brokenAvatars['me'] = true"
                />
                <span
                  v-else
                  class="flex h-full w-full items-center justify-center text-xs font-bold"
                >
                  {{ currentUserInitials }}
                </span>
              </div>

              <!-- Tài khoản đang bị cấm bình luận: khóa ô nhập và hiển thị thông báo -->
              <div
                v-if="isCommentBanned"
                data-ui
                class="flex-1 rounded-2xl border border-surface-3 bg-surface-2 px-4 py-3 text-sm leading-6 text-muted"
                role="alert"
              >
                <div class="flex items-start gap-2.5">
                  <Lock class="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                  <span>{{ commentBanMessage }}</span>
                </div>
              </div>

              <!-- Khi chưa mở rộng: nút pill "Nhập bình luận mới của bạn" -->
              <button
                v-else-if="!rootComposerExpanded"
                type="button"
                class="flex-1 rounded-full bg-surface-2 px-5 py-2.5 text-left text-sm text-muted transition-colors hover:bg-surface-3/60"
                @click="openRootComposer"
              >
                Nhập bình luận mới của bạn
              </button>

              <!-- Khi đã mở rộng: Thanh công cụ định dạng + Textarea + HỦY / BÌNH LUẬN -->
              <div v-else class="flex-1">
                <div
                  data-ui
                  class="overflow-hidden rounded-2xl border border-surface-3 bg-ground"
                >
                  <!-- Thanh công cụ định dạng -->
                  <div
                    data-ui class="flex items-center gap-1 border-b border-surface-3 bg-surface px-3 py-2"
                  >
                    <button
                      type="button"
                      class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="In đậm"
                      @click="insertFormatToTextarea('root', 'bold')"
                    >
                      <Bold class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="In nghiêng"
                      @click="insertFormatToTextarea('root', 'italic')"
                    >
                      <Italic class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="Trích dẫn"
                      @click="insertFormatToTextarea('root', 'quote')"
                    >
                      <Quote class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="Mã lệnh ngắn (Inline code)"
                      @click="insertFormatToTextarea('root', 'code')"
                    >
                      <Code class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      class="rounded p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                      title="Khối mã nguồn (Code block)"
                      @click="insertFormatToTextarea('root', 'codeblock')"
                    >
                      <FileCode2 class="h-4 w-4" />
                    </button>
                  </div>

                  <textarea
                    ref="rootTextareaRef"
                    v-model="rootContent"
                    rows="4"
                    maxlength="2000"
                    placeholder="Nhập bình luận mới của bạn..."
                    class="w-full resize-y bg-transparent px-4 py-3 text-sm leading-6 text-ink placeholder:text-muted focus:outline-none"
                  />
                </div>

                <div class="mt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    class="rounded-full px-4 py-2 text-xs font-bold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                    @click="cancelRootComposer"
                  >
                    HỦY
                  </button>
                  <button
                    type="button"
                    :disabled="!rootContent.trim() || submittingRoot"
                    class="rounded-full bg-brand px-5 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted"
                    @click="submitRootComment"
                  >
                    {{ submittingRoot ? 'ĐANG GỬI...' : 'BÌNH LUẬN' }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Dòng thống kê tổng số bình luận + Lưu ý báo cáo spam -->
          <div
            data-ui class="mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-surface-3 pb-3"
          >
            <h3 class="text-base font-bold text-ink tabular-nums">
              {{ totalComments }} bình luận
            </h3>
            <p class="text-xs text-muted">
              Nếu thấy bình luận spam, các bạn bấm report giúp admin nhé
            </p>
          </div>

          <!-- Trạng thái đang tải -->
          <div v-if="loading" class="space-y-4 py-4" aria-busy="true">
            <div
              v-for="idx in 3"
              :key="idx"
              class="flex items-start gap-3"
            >
              <div class="h-10 w-10 shrink-0 rounded-full bg-surface-2" />
              <div class="flex-1 space-y-2">
                <div class="h-20 rounded-2xl bg-surface-2" />
                <div class="h-4 w-40 rounded bg-surface-2" />
              </div>
            </div>
          </div>

          <!-- Trạng thái chưa có bình luận -->
          <div
            v-else-if="comments.length === 0"
            class="py-12 text-center"
          >
            <MessageCircle class="mx-auto h-10 w-10 text-muted" />
            <p class="mt-3 text-sm font-semibold text-ink">
              Chưa có câu hỏi hay bình luận nào trong bài học này
            </p>
            <p class="mt-1 text-xs text-muted">
              Hãy là người đầu tiên đặt câu hỏi hoặc chia sẻ ghi chú học tập của bạn!
            </p>
          </div>

          <!-- Danh sách bình luận gốc -->
          <div v-else class="space-y-6">
            <article
              v-for="comment in comments"
              :key="comment.id"
              class="space-y-2"
            >
              <!-- Khối bình luận gốc -->
              <div class="flex items-start gap-3">
                <!-- Avatar tác giả -->
                <div class="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-navy text-white">
                  <img
                    v-if="comment.author.avatar && !brokenAvatars[comment.id]"
                    :src="comment.author.avatar"
                    :alt="comment.author.fullName"
                    class="h-full w-full object-cover"
                    @error="brokenAvatars[comment.id] = true"
                  />
                  <span
                    v-else
                    class="flex h-full w-full items-center justify-center text-xs font-bold"
                  >
                    {{ getInitials(comment.author.fullName) }}
                  </span>
                </div>

                <div class="min-w-0 flex-1">
                  <!-- Bong bóng nội dung bình luận (hiển thị trạng thái ẩn mềm nếu visibilityStatus === 'HIDDEN') -->
                  <div
                    v-if="comment.visibilityStatus === 'HIDDEN'"
                    data-ui
                    class="flex items-center gap-2 rounded-2xl border border-surface-3 bg-surface-2/60 px-4 py-3 text-xs italic text-muted"
                  >
                    <EyeOff class="h-4 w-4 shrink-0 text-muted" />
                    <span>Bình luận này đã bị xóa do vi phạm</span>
                  </div>

                  <div v-else class="rounded-2xl bg-surface-2 px-4 py-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-sm font-bold text-ink">
                        {{ comment.author.fullName }}
                      </span>
                      <span
                        v-if="getAuthorBadge(comment.author)"
                        class="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                        :class="getAuthorBadge(comment.author)?.className"
                      >
                        {{ getAuthorBadge(comment.author)?.label }}
                      </span>
                    </div>
                    <p class="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-ink">
                      {{ comment.content }}
                    </p>
                  </div>

                  <!-- Dòng tương tác bên dưới: Thích (1 icon Like duy nhất) · Phản hồi · Thời gian · Huy hiệu Like + Menu ... -->
                  <div
                    v-if="comment.visibilityStatus !== 'HIDDEN'"
                    class="mt-1.5 flex flex-wrap items-center justify-between gap-2 px-1 text-xs"
                  >
                    <div class="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        class="inline-flex items-center gap-1 font-semibold transition-colors hover:underline"
                        :class="
                          comment.myReaction
                            ? 'text-brand font-bold'
                            : 'text-muted hover:text-brand'
                        "
                        @click.stop="handleToggleLike(comment)"
                      >
                        <ThumbsUp class="h-3.5 w-3.5" />
                        <span>{{ comment.myReaction ? 'Đã thích' : 'Thích' }}</span>
                      </button>

                      <span class="text-muted">·</span>

                      <button
                        type="button"
                        class="font-semibold text-brand-soft transition-colors hover:underline"
                        v-if="!isCommentBanned"
                        @click="startReply(comment, comment)"
                      >
                        Phản hồi
                      </button>

                      <span class="text-muted">·</span>

                      <span class="text-muted">
                        {{ formatRelativeTime(comment.createdAt) }}
                      </span>
                    </div>

                    <!-- Góc phải: Huy hiệu 1 icon Like duy nhất + Nút "..." -->
                    <div class="flex items-center gap-2">
                      <div
                        v-if="comment.totalReactions > 0"
                        data-ui
                        class="inline-flex items-center gap-1.5 rounded-full border border-surface-3 bg-surface px-2 py-0.5 text-xs"
                      >
                        <span class="inline-flex h-4 w-4 items-center justify-center rounded-full bg-brand text-white">
                          <ThumbsUp class="h-2.5 w-2.5" />
                        </span>
                        <span class="font-semibold text-ink tabular-nums">
                          {{ comment.totalReactions }}
                        </span>
                      </div>

                      <!-- Menu "..." (Báo cáo vi phạm / Xóa bình luận) -->
                      <div class="relative">
                        <button
                          type="button"
                          class="rounded-full p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                          aria-label="Tùy chọn bình luận"
                          @click.stop="
                            openMenuCommentId =
                              openMenuCommentId === comment.id ? null : comment.id
                          "
                        >
                          <MoreHorizontal class="h-4 w-4" />
                        </button>

                        <div
                          v-if="openMenuCommentId === comment.id"
                          data-ui
                          class="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-surface-3 bg-surface py-1.5"
                          @click.stop
                        >
                          <button
                            v-if="comment.author.id !== authStore.user?.id"
                            type="button"
                            class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2"
                            @click="openReportDialog(comment)"
                          >
                            <Flag class="h-3.5 w-3.5 text-muted" />
                            <span>
                              {{
                                comment.isReportedByMe
                                  ? 'Đã báo cáo vi phạm'
                                  : 'Báo cáo vi phạm'
                              }}
                            </span>
                          </button>

                          <button
                            v-if="comment.canDelete"
                            type="button"
                            :disabled="deletingCommentId === comment.id"
                            class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#dc2626] transition-colors hover:bg-surface-2"
                            @click="handleDeleteComment(comment.id, null)"
                          >
                            <Trash2 class="h-3.5 w-3.5" />
                            <span>Xóa bình luận</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Khung nhập phản hồi ngay bên dưới bình luận gốc -->
                  <div
                    v-if="
                      activeReplyTarget &&
                      activeReplyTarget.rootCommentId === comment.id &&
                      activeReplyTarget.targetCommentId === comment.id
                    "
                    class="mt-3 flex items-start gap-2.5"
                  >
                    <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-navy text-white">
                      <img
                        v-if="authStore.user?.avatar && !brokenAvatars['me']"
                        :src="authStore.user.avatar"
                        :alt="authStore.user.fullName"
                        class="h-full w-full object-cover"
                        @error="brokenAvatars['me'] = true"
                      />
                      <span
                        v-else
                        class="flex h-full w-full items-center justify-center text-[11px] font-bold"
                      >
                        {{ currentUserInitials }}
                      </span>
                    </div>

                    <div class="flex-1">
                      <div
                        data-ui
                        class="overflow-hidden rounded-2xl border border-brand bg-ground"
                      >
                        <div
                          data-ui class="flex items-center justify-between border-b border-surface-3 bg-surface px-3 py-1.5 text-xs"
                        >
                          <span class="text-muted">
                            Đang phản hồi
                            <strong class="font-semibold text-brand-soft">
                              @{{ activeReplyTarget.replyToFullName }}
                            </strong>
                          </span>
                          <div class="flex items-center gap-1">
                            <button
                              type="button"
                              class="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink"
                              title="In đậm"
                              @click="insertFormatToTextarea('reply', 'bold')"
                            >
                              <Bold class="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              class="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink"
                              title="In nghiêng"
                              @click="insertFormatToTextarea('reply', 'italic')"
                            >
                              <Italic class="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              class="rounded p-1 text-muted hover:bg-surface-2 hover:text-ink"
                              title="Mã lệnh"
                              @click="insertFormatToTextarea('reply', 'code')"
                            >
                              <Code class="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <textarea
                          ref="replyTextareaRef"
                          v-model="replyContent"
                          rows="3"
                          maxlength="2000"
                          placeholder="Nhập nội dung phản hồi..."
                          class="w-full resize-y bg-transparent px-3.5 py-2.5 text-sm leading-6 text-ink placeholder:text-muted focus:outline-none"
                        />
                      </div>

                      <div class="mt-2 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="rounded-full px-3.5 py-1.5 text-xs font-bold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                          @click="cancelReply"
                        >
                          HỦY
                        </button>
                        <button
                          type="button"
                          :disabled="!replyContent.trim() || submittingReply"
                          class="rounded-full bg-brand px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted"
                          @click="submitReply"
                        >
                          {{ submittingReply ? 'ĐANG GỬI...' : 'BÌNH LUẬN' }}
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Nút "Xem X câu trả lời" khi đang thu gọn -->
                  <div
                    v-if="
                      comment.replies.length > 0 &&
                      (visibleRepliesCount[comment.id] ?? 0) === 0
                    "
                    class="mt-2"
                  >
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 text-xs font-bold text-ink transition-colors hover:text-brand"
                      @click="expandRepliesBatch(comment)"
                    >
                      <span>Xem {{ comment.replies.length }} câu trả lời</span>
                      <ChevronDown class="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <!-- Danh sách câu trả lời đã mở (tối đa mỗi lần cộng thêm 5 câu trả lời) -->
                  <div
                    v-if="
                      comment.replies.length > 0 &&
                      (visibleRepliesCount[comment.id] ?? 0) > 0
                    "
                    data-ui class="mt-3 space-y-4 border-l-2 border-surface-3 pl-4"
                  >
                    <div
                      v-for="reply in getVisibleReplies(comment)"
                      :key="reply.id"
                      class="flex items-start gap-2.5"
                    >
                      <!-- Avatar người trả lời -->
                      <div class="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-navy text-white">
                        <img
                          v-if="reply.author.avatar && !brokenAvatars[reply.id]"
                          :src="reply.author.avatar"
                          :alt="reply.author.fullName"
                          class="h-full w-full object-cover"
                          @error="brokenAvatars[reply.id] = true"
                        />
                        <span
                          v-else
                          class="flex h-full w-full items-center justify-center text-[11px] font-bold"
                        >
                          {{ getInitials(reply.author.fullName) }}
                        </span>
                      </div>

                      <div class="min-w-0 flex-1">
                        <div
                          v-if="reply.visibilityStatus === 'HIDDEN'"
                          data-ui
                          class="flex items-center gap-2 rounded-2xl border border-surface-3 bg-surface-2/60 px-3.5 py-2.5 text-xs italic text-muted"
                        >
                          <EyeOff class="h-3.5 w-3.5 shrink-0 text-muted" />
                          <span>Bình luận này đã bị xóa do vi phạm</span>
                        </div>

                        <div v-else class="rounded-2xl bg-surface-2 px-3.5 py-2.5">
                          <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-bold text-ink sm:text-sm">
                              {{ reply.author.fullName }}
                            </span>
                            <span
                              v-if="getAuthorBadge(reply.author)"
                              class="rounded-full px-2 py-0.5 text-[10px] font-bold"
                              :class="getAuthorBadge(reply.author)?.className"
                            >
                              {{ getAuthorBadge(reply.author)?.label }}
                            </span>
                          </div>

                          <p class="mt-1 whitespace-pre-line break-words text-sm leading-6 text-ink">
                            <span
                              v-if="reply.replyToUser"
                              class="mr-1 font-semibold text-brand-soft"
                            >
                              @{{ reply.replyToUser.fullName }}
                            </span>
                            <span>{{ reply.content }}</span>
                          </p>
                        </div>

                        <!-- Thanh hành động của câu trả lời -->
                        <div
                          v-if="reply.visibilityStatus !== 'HIDDEN'"
                          class="mt-1 flex flex-wrap items-center justify-between gap-2 px-1 text-xs"
                        >
                          <div class="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              class="inline-flex items-center gap-1 font-semibold transition-colors hover:underline"
                              :class="
                                reply.myReaction
                                  ? 'text-brand font-bold'
                                  : 'text-muted hover:text-brand'
                              "
                              @click.stop="handleToggleLike(reply)"
                            >
                              <ThumbsUp class="h-3 w-3" />
                              <span>{{ reply.myReaction ? 'Đã thích' : 'Thích' }}</span>
                            </button>

                            <span class="text-muted">·</span>

                            <button
                              type="button"
                              class="font-semibold text-brand-soft transition-colors hover:underline"
                              v-if="!isCommentBanned"
                              @click="startReply(comment, reply)"
                            >
                              Phản hồi
                            </button>

                            <span class="text-muted">·</span>

                            <span class="text-muted">
                              {{ formatRelativeTime(reply.createdAt) }}
                            </span>
                          </div>

                          <div class="flex items-center gap-2">
                            <div
                              v-if="reply.totalReactions > 0"
                              data-ui
                              class="inline-flex items-center gap-1 rounded-full border border-surface-3 bg-surface px-2 py-0.5 text-xs"
                            >
                              <span class="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-brand text-white">
                                <ThumbsUp class="h-2 w-2" />
                              </span>
                              <span class="font-semibold text-ink tabular-nums">
                                {{ reply.totalReactions }}
                              </span>
                            </div>

                            <div class="relative">
                              <button
                                type="button"
                                class="rounded-full p-1 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                                aria-label="Tùy chọn phản hồi"
                                @click.stop="
                                  openMenuCommentId =
                                    openMenuCommentId === reply.id ? null : reply.id
                                "
                              >
                                <MoreHorizontal class="h-4 w-4" />
                              </button>

                              <div
                                v-if="openMenuCommentId === reply.id"
                                data-ui
                                class="absolute right-0 top-full z-30 mt-1 w-48 rounded-xl border border-surface-3 bg-surface py-1.5"
                                @click.stop
                              >
                                <button
                                  v-if="reply.author.id !== authStore.user?.id"
                                  type="button"
                                  class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2"
                                  @click="openReportDialog(reply)"
                                >
                                  <Flag class="h-3.5 w-3.5 text-muted" />
                                  <span>
                                    {{
                                      reply.isReportedByMe
                                        ? 'Đã báo cáo vi phạm'
                                        : 'Báo cáo vi phạm'
                                    }}
                                  </span>
                                </button>

                                <button
                                  v-if="reply.canDelete"
                                  type="button"
                                  :disabled="deletingCommentId === reply.id"
                                  class="flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-xs font-medium text-[#dc2626] transition-colors hover:bg-surface-2"
                                  @click="handleDeleteComment(reply.id, comment.id)"
                                >
                                  <Trash2 class="h-3.5 w-3.5" />
                                  <span>Xóa bình luận</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- Ô nhập phản hồi khi người dùng bấm "Phản hồi" vào một câu trả lời con -->
                        <div
                          v-if="
                            activeReplyTarget &&
                            activeReplyTarget.rootCommentId === comment.id &&
                            activeReplyTarget.targetCommentId === reply.id
                          "
                          class="mt-2.5 flex items-start gap-2"
                        >
                          <div class="flex-1">
                            <div
                              data-ui
                              class="overflow-hidden rounded-2xl border border-brand bg-ground"
                            >
                              <div
                                data-ui class="flex items-center justify-between border-b border-surface-3 bg-surface px-3 py-1.5 text-xs"
                              >
                                <span class="text-muted">
                                  Đang phản hồi
                                  <strong class="font-semibold text-brand-soft">
                                    @{{ activeReplyTarget.replyToFullName }}
                                  </strong>
                                </span>
                              </div>
                              <textarea
                                ref="replyTextareaRef"
                                v-model="replyContent"
                                rows="2"
                                maxlength="2000"
                                placeholder="Nhập nội dung phản hồi..."
                                class="w-full resize-y bg-transparent px-3 py-2 text-sm leading-6 text-ink placeholder:text-muted focus:outline-none"
                              />
                            </div>

                            <div class="mt-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                class="rounded-full px-3 py-1 text-xs font-bold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
                                @click="cancelReply"
                              >
                                HỦY
                              </button>
                              <button
                                type="button"
                                :disabled="!replyContent.trim() || submittingReply"
                                class="rounded-full bg-brand px-3.5 py-1 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted"
                                @click="submitReply"
                              >
                                {{ submittingReply ? 'ĐANG GỬI...' : 'BÌNH LUẬN' }}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Thanh điều khiển dưới danh sách câu trả lời -->
                    <div class="flex flex-wrap items-center gap-4 pt-1">
                      <button
                        v-if="getRemainingRepliesCount(comment) > 0"
                        type="button"
                        class="inline-flex items-center gap-1.5 text-xs font-bold text-ink transition-colors hover:text-brand"
                        @click="expandRepliesBatch(comment)"
                      >
                        <span>
                          Xem tiếp {{ getRemainingRepliesCount(comment) }} câu trả lời
                        </span>
                        <ChevronDown class="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        class="inline-flex items-center gap-1 text-xs font-bold text-muted transition-colors hover:text-ink"
                        @click="collapseAllReplies(comment.id)"
                      >
                        <span>Ẩn</span>
                        <ChevronUp class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>

        <!-- Hộp thoại Báo cáo vi phạm bình luận -->
        <div
          v-if="reportingComment"
          class="absolute inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          @click.self="closeReportDialog"
        >
          <div
            data-ui
            class="w-full max-w-md rounded-2xl border border-surface-3 bg-surface p-6 text-ink"
          >
            <div class="flex items-center justify-between">
              <h3 class="text-base font-bold text-ink">
                Báo cáo vi phạm bình luận
              </h3>
              <button
                type="button"
                class="rounded-full p-1 text-muted hover:bg-surface-2 hover:text-ink"
                @click="closeReportDialog"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <p class="mt-1.5 text-xs text-muted">
              Chọn lý do báo cáo bình luận của
              <strong class="font-semibold text-ink">
                {{ reportingComment.author.fullName }}
              </strong>
              để đội ngũ quản trị kiểm duyệt:
            </p>

            <div class="mt-4 space-y-2">
              <label
                v-for="reason in REPORT_REASONS"
                :key="reason"
                data-ui
                class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-surface-3 px-3.5 py-2.5 text-xs font-medium text-ink transition-colors hover:bg-surface-2"
              >
                <input
                  v-model="selectedReportReason"
                  type="radio"
                  :value="reason"
                  class="h-4 w-4 accent-brand"
                />
                <span>{{ reason }}</span>
              </label>
            </div>

            <div class="mt-3">
              <label class="block text-xs font-semibold text-ink">
                Ghi chú bổ sung (không bắt buộc)
              </label>
              <textarea
                v-model="customReportReason"
                rows="2"
                maxlength="500"
                placeholder="Mô tả chi tiết hơn về vi phạm..."
                data-ui
                class="mt-1.5 w-full rounded-xl border border-surface-3 bg-ground px-3 py-2 text-xs text-ink placeholder:text-muted focus:border-brand focus:outline-none"
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
                @click="submitReportViolation"
              >
                {{ submittingReport ? 'Đang gửi...' : 'Gửi báo cáo' }}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  </Teleport>
</template>
