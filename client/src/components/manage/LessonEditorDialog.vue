<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import {
  CheckCircle2,
  Clock3,
  FileText,
  Film,
  Loader2,
  Lock,
  Trash2,
  Upload,
  Video,
  VideoOff,
  X,
} from 'lucide-vue-next';
import { getManageErrorMessage, secondsToParts } from '@/lib/manage-course-format';
import {
  isLocalVideoUrl,
  loadYouTubeIframeApi,
  parseYouTubeEmbedInput,
  type YouTubePlayerInstance,
} from '@/lib/video-embed';
import { uploadsService } from '@/services/uploads.api';
import type { ManageLesson, ManageLessonPayload } from '@/types/manage-course';

const MAX_VIDEO_SIZE_BYTES = 1024 * 1024 * 1024; // 1GB
const MAX_DOCUMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const ALLOWED_VIDEO_MIMES = new Set(['video/mp4', 'video/webm']);
const ALLOWED_DOC_EXTENSIONS = new Set(['.pdf', '.docx', '.txt', '.md']);

type VideoSourceMode = 'none' | 'youtube' | 'upload';

const props = defineProps<{
  open: boolean;
  lesson: ManageLesson | null;
  isPro: boolean;
  readOnly?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{
  save: [payload: ManageLessonPayload, videoFile: File | null];
  cancel: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const videoFileInputRef = ref<HTMLInputElement | null>(null);
const docFileInputRef = ref<HTMLInputElement | null>(null);
const youtubeContainerRef = ref<HTMLElement | null>(null);
const errors = reactive<Record<string, string>>({});

const sourceMode = ref<VideoSourceMode>('youtube');
const selectedVideoFile = ref<File | null>(null);
const localVideoPreviewUrl = ref<string>('');
const extractingDuration = ref(false);
const extractedDuration = ref(0);

const uploadingDocument = ref(false);
const docUploadSuccessMessage = ref<string | null>(null);

let ytPlayer: YouTubePlayerInstance | null = null;
let activeYtRequestId = 0;

const form = reactive({
  title: '',
  youtubeEmbedInput: '',
  existingUploadedUrl: '',
  content: '',
  fileUrl: '',
  fileName: '',
  note: '',
  summary: '',
});

const parsedYouTube = computed(() =>
  parseYouTubeEmbedInput(form.youtubeEmbedInput),
);

const activeUploadedPreviewUrl = computed(() => {
  if (localVideoPreviewUrl.value) return localVideoPreviewUrl.value;
  return form.existingUploadedUrl.trim();
});

const hasActiveVideoInput = computed(() => {
  if (sourceMode.value === 'none') return false;
  if (sourceMode.value === 'youtube') {
    return form.youtubeEmbedInput.trim().length > 0;
  }
  return Boolean(selectedVideoFile.value || form.existingUploadedUrl.trim());
});

const formattedDuration = computed(() => {
  if (!hasActiveVideoInput.value) return '00:00 (Không sử dụng video)';
  if (extractedDuration.value <= 0) return 'Chưa có thông số (00:00)';
  const { minutes, seconds } = secondsToParts(extractedDuration.value);
  const mm = String(minutes).padStart(2, '0'); // taste-skill-ignore
  const ss = String(seconds).padStart(2, '0'); // taste-skill-ignore
  return `${mm}:${ss} (${extractedDuration.value} giây)`;
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  return dotIndex >= 0 ? filename.slice(dotIndex).toLowerCase() : '';
}

function destroyYouTubePlayer() {
  activeYtRequestId += 1;
  if (ytPlayer) {
    try {
      ytPlayer.destroy();
    } catch {
      // Ignore cleanup errors from detached iframe
    }
    ytPlayer = null;
  }
  if (youtubeContainerRef.value) {
    youtubeContainerRef.value.innerHTML = '';
  }
}

function revokeLocalVideoPreview() {
  if (localVideoPreviewUrl.value) {
    URL.revokeObjectURL(localVideoPreviewUrl.value);
    localVideoPreviewUrl.value = '';
  }
}

function resetVideoSelection() {
  revokeLocalVideoPreview();
  selectedVideoFile.value = null;
  if (videoFileInputRef.value) {
    videoFileInputRef.value.value = '';
  }
}

async function mountYouTubePreview(videoId: string, fallbackDuration = 0) {
  destroyYouTubePlayer();
  const requestId = ++activeYtRequestId;
  extractingDuration.value = true;
  delete errors.videoUrl;
  delete errors.duration;

  await nextTick();
  const host = youtubeContainerRef.value;
  if (!host || !props.open) {
    extractingDuration.value = false;
    return;
  }

  const mountTarget = document.createElement('div');
  host.innerHTML = '';
  host.appendChild(mountTarget);

  try {
    const YT = await loadYouTubeIframeApi();
    if (requestId !== activeYtRequestId || !props.open) return;

    ytPlayer = new YT.Player(mountTarget, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          if (requestId !== activeYtRequestId) return;
          const rawSeconds = Math.round(event.target.getDuration() || 0);
          if (rawSeconds > 0) {
            extractedDuration.value = Math.min(36000, rawSeconds);
          } else if (fallbackDuration > 0) {
            extractedDuration.value = fallbackDuration;
          }
          extractingDuration.value = false;
        },
        onError: () => {
          if (requestId !== activeYtRequestId) return;
          extractingDuration.value = false;
          errors.videoUrl =
            'Không thể tải thông tin video YouTube này (video bị chặn nhúng hoặc không tồn tại).';
        },
      },
    });
  } catch {
    if (requestId !== activeYtRequestId) return;
    extractingDuration.value = false;
    if (fallbackDuration > 0) {
      extractedDuration.value = fallbackDuration;
    } else {
      errors.videoUrl =
        'Không thể kết nối YouTube IFrame API để trích xuất thời lượng.';
    }
  }
}

function switchSourceMode(nextMode: VideoSourceMode) {
  if (props.isPro && nextMode === 'youtube') return;
  if (sourceMode.value === nextMode) return;
  delete errors.videoUrl;
  delete errors.duration;
  sourceMode.value = nextMode;

  if (nextMode === 'none') {
    destroyYouTubePlayer();
    resetVideoSelection();
    form.youtubeEmbedInput = '';
    form.existingUploadedUrl = '';
    extractedDuration.value = 0;
    extractingDuration.value = false;
    return;
  }

  if (nextMode === 'youtube') {
    resetVideoSelection();
    const parsed = parsedYouTube.value;
    if (parsed) {
      void mountYouTubePreview(parsed.videoId);
    } else {
      extractedDuration.value = 0;
      extractingDuration.value = false;
    }
  } else {
    destroyYouTubePlayer();
    if (form.existingUploadedUrl) {
      extractingDuration.value = true;
    } else {
      extractedDuration.value = 0;
      extractingDuration.value = false;
    }
  }
}

watch(
  () => [props.open, props.lesson, props.isPro] as const,
  async ([open, lesson, isPro]) => {
    destroyYouTubePlayer();
    resetVideoSelection();
    extractingDuration.value = false;
    uploadingDocument.value = false;
    docUploadSuccessMessage.value = null;
    Object.keys(errors).forEach((key) => delete errors[key]);

    if (open) {
      form.title = lesson?.title ?? '';
      form.content = lesson?.content ?? '';
      form.fileUrl = lesson?.fileUrl ?? '';
      form.fileName = lesson?.fileName ?? '';
      form.note = lesson?.note ?? '';
      form.summary = lesson?.summary ?? '';
      extractedDuration.value = lesson?.duration ?? 0;

      const existingVideo = lesson?.videoUrl?.trim() ?? '';
      const ytParsed = parseYouTubeEmbedInput(existingVideo);

      if (lesson && !existingVideo) {
        sourceMode.value = 'none';
        form.youtubeEmbedInput = '';
        form.existingUploadedUrl = '';
        extractedDuration.value = 0;
      } else if (isPro) {
        sourceMode.value = 'upload';
        form.youtubeEmbedInput = '';
        form.existingUploadedUrl = ytParsed ? '' : existingVideo;
      } else if (existingVideo && !ytParsed && isLocalVideoUrl(existingVideo)) {
        sourceMode.value = 'upload';
        form.youtubeEmbedInput = '';
        form.existingUploadedUrl = existingVideo;
      } else {
        sourceMode.value = 'youtube';
        form.youtubeEmbedInput = ytParsed ? ytParsed.canonicalIframe : existingVideo;
        form.existingUploadedUrl = '';
      }

      await nextTick();
      if (dialog.value && !dialog.value.open) dialog.value.showModal();

      if (sourceMode.value === 'youtube' && parsedYouTube.value) {
        await mountYouTubePreview(
          parsedYouTube.value.videoId,
          lesson?.duration ?? 0,
        );
      }
    } else if (dialog.value?.open) {
      dialog.value.close();
    }
  },
  { deep: true },
);

watch(
  () => form.youtubeEmbedInput,
  (nextInput) => {
    if (!props.open || sourceMode.value !== 'youtube') return;
    delete errors.videoUrl;
    delete errors.duration;
    const parsed = parseYouTubeEmbedInput(nextInput);
    if (!parsed) {
      destroyYouTubePlayer();
      extractedDuration.value = 0;
      extractingDuration.value = false;
      return;
    }
    void mountYouTubePreview(parsed.videoId);
  },
);

onBeforeUnmount(() => {
  destroyYouTubePlayer();
  revokeLocalVideoPreview();
});

function triggerVideoPicker() {
  if (props.readOnly || props.busy) return;
  videoFileInputRef.value?.click();
}

function handleVideoFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  delete errors.videoUrl;
  delete errors.duration;

  if (!ALLOWED_VIDEO_MIMES.has(file.type)) {
    errors.videoUrl = 'Chỉ chấp nhận file video định dạng MP4 hoặc WEBM.';
    input.value = '';
    return;
  }

  if (file.size <= 0 || file.size > MAX_VIDEO_SIZE_BYTES) {
    errors.videoUrl = 'Dung lượng video không được vượt quá 1GB.';
    input.value = '';
    return;
  }

  revokeLocalVideoPreview();
  selectedVideoFile.value = file;
  extractedDuration.value = 0;
  extractingDuration.value = true;
  localVideoPreviewUrl.value = URL.createObjectURL(file);
}

function clearSelectedVideo() {
  if (props.readOnly || props.busy) return;
  delete errors.videoUrl;
  delete errors.duration;
  resetVideoSelection();
  if (form.existingUploadedUrl) {
    extractingDuration.value = true;
  } else {
    extractedDuration.value = 0;
    extractingDuration.value = false;
  }
}

function removeExistingVideo() {
  if (props.readOnly || props.busy) return;
  delete errors.videoUrl;
  delete errors.duration;
  resetVideoSelection();
  form.existingUploadedUrl = '';
  form.youtubeEmbedInput = '';
  extractedDuration.value = 0;
  extractingDuration.value = false;
}

function handleLocalVideoMetadata(event: Event) {
  const videoEl = event.target as HTMLVideoElement;
  const rawDuration = videoEl.duration;
  extractingDuration.value = false;
  if (Number.isFinite(rawDuration) && rawDuration > 0) {
    extractedDuration.value = Math.min(36000, Math.max(1, Math.round(rawDuration)));
    delete errors.duration;
  } else {
    extractedDuration.value = 0;
    errors.duration = 'Không thể trích xuất thời lượng từ file video này.';
  }
}

function handleLocalVideoError() {
  extractingDuration.value = false;
  if (selectedVideoFile.value) {
    extractedDuration.value = 0;
    errors.videoUrl = 'Trình duyệt không thể đọc file video đã chọn.';
  }
}

function triggerDocPicker() {
  if (props.readOnly || props.busy || uploadingDocument.value) return;
  docFileInputRef.value?.click();
}

async function handleDocFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  delete errors.fileUrl;
  docUploadSuccessMessage.value = null;

  const ext = getFileExtension(file.name);
  if (!ALLOWED_DOC_EXTENSIONS.has(ext)) {
    errors.fileUrl =
      'Chỉ hỗ trợ tải lên file tài liệu định dạng .pdf, .docx, .txt hoặc .md.';
    input.value = '';
    return;
  }

  if (file.size <= 0 || file.size > MAX_DOCUMENT_SIZE_BYTES) {
    errors.fileUrl = 'Dung lượng file tài liệu không được vượt quá 25MB.';
    input.value = '';
    return;
  }

  uploadingDocument.value = true;
  try {
    const uploaded = await uploadsService.uploadLessonDocument(file);
    form.fileUrl = uploaded.url;
    form.fileName = uploaded.originalName || file.name;
    docUploadSuccessMessage.value =
      'Đã đính kèm file tài liệu lên bài giảng thành công.';
  } catch (cause) {
    errors.fileUrl = getManageErrorMessage(
      cause,
      'Không thể tải file tài liệu lên server.',
    );
  } finally {
    uploadingDocument.value = false;
    input.value = '';
  }
}

function removeAttachedDocument() {
  if (props.readOnly || props.busy) return;
  form.fileUrl = '';
  form.fileName = '';
  docUploadSuccessMessage.value = null;
  delete errors.fileUrl;
}

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
  const title = form.title.trim();
  if (title.length < 3 || title.length > 150) {
    errors.title = 'Tên bài phải từ 3 đến 150 ký tự.';
  }

  if (sourceMode.value === 'youtube' && form.youtubeEmbedInput.trim().length > 0) {
    if (!parsedYouTube.value) {
      errors.videoUrl =
        'Mã nhúng YouTube không hợp lệ. Vui lòng dán thẻ <iframe src="https://www.youtube.com/embed/..."> hoặc để trống nếu bài không có video.';
    }
  }

  if (hasActiveVideoInput.value) {
    if (extractingDuration.value) {
      errors.duration =
        'Hệ thống đang trích xuất thời lượng video, vui lòng đợi trong giây lát.';
    } else if (
      !Number.isInteger(extractedDuration.value) ||
      extractedDuration.value < 1 ||
      extractedDuration.value > 36000
    ) {
      errors.duration =
        'Chưa trích xuất được thời lượng hợp lệ (1 – 36000 giây) từ video.';
    }
  }

  if (form.content.length > 50000) {
    errors.content = 'Nội dung bài đọc tối đa 50.000 ký tự.';
  }
  if (form.note.length > 10000) errors.note = 'Ghi chép tối đa 10000 ký tự.';
  if (form.summary.length > 3000) errors.summary = 'Tóm tắt tối đa 3000 ký tự.';
  return Object.keys(errors).length === 0;
}

function submit() {
  if (
    props.busy ||
    extractingDuration.value ||
    uploadingDocument.value ||
    !validate()
  ) {
    return;
  }

  let videoUrl = '';
  let fileToUpload: File | null = null;
  let duration = 0;

  if (sourceMode.value === 'youtube' && parsedYouTube.value) {
    videoUrl = parsedYouTube.value.canonicalIframe;
    duration = extractedDuration.value;
  } else if (sourceMode.value === 'upload' && hasActiveVideoInput.value) {
    videoUrl = form.existingUploadedUrl.trim() || 'PLACEHOLDER_VIDEO';
    fileToUpload = selectedVideoFile.value;
    duration = extractedDuration.value;
  }

  emit(
    'save',
    {
      title: form.title.trim(),
      videoUrl,
      duration,
      content: form.content.trim() ? form.content.trim() : null,
      fileUrl: form.fileUrl.trim() ? form.fileUrl.trim() : null,
      fileName: form.fileName.trim() ? form.fileName.trim() : null,
      ...(props.isPro
        ? { note: form.note || null, summary: form.summary || null }
        : {}),
    },
    fileToUpload,
  );
}
</script>

<template>
  <dialog
    ref="dialog"
    data-ui
    class="manage-dialog m-auto w-[min(96vw,48rem)] bg-surface p-0 text-ink backdrop:bg-black/75"
    @cancel.prevent="emit('cancel')"
  >
    <form
      class="max-h-[90svh] overflow-y-auto p-5 sm:p-6"
      novalidate
      @submit.prevent="submit"
    >
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-ink">
            {{ lesson ? 'Chỉnh sửa bài giảng' : 'Thêm bài giảng' }}
          </h2>
        </div>
        <button
          type="button"
          class="p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
          aria-label="Đóng"
          :disabled="busy"
          @click="emit('cancel')"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div class="mt-5 space-y-5">
        <label class="manage-field">
          <span>Tên bài giảng <span class="text-brand-soft">*</span></span>
          <input
            v-model="form.title"
            class="manage-input"
            type="text"
            minlength="3"
            maxlength="150"
            placeholder="Ví dụ: Bài 1 - Khái niệm cơ bản và tài liệu hướng dẫn"
            :disabled="readOnly || busy"
          />
          <span v-if="errors.title" class="manage-field-error">{{
            errors.title
          }}</span>
        </label>

        <!-- PHẦN 1: VIDEO BÀI GIẢNG (TÙY CHỌN) -->
        <div class="space-y-3 border border-surface-3 p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="block text-sm font-medium text-ink">
              1. Nguồn video bài giảng
            </span>
          </div>

          <div
            class="grid gap-1 bg-ground p-1"
            :class="isPro ? 'grid-cols-2' : 'grid-cols-3'"
          >
            <button
              v-if="!isPro"
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors"
              :class="
                sourceMode === 'youtube'
                  ? 'bg-surface-2 text-ink'
                  : 'text-muted hover:text-ink'
              "
              :disabled="readOnly || busy"
              @click="switchSourceMode('youtube')"
            >
              <Video class="h-4 w-4 shrink-0" />
              <span>Mã nhúng YouTube</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors"
              :class="
                sourceMode === 'upload'
                  ? 'bg-surface-2 text-ink'
                  : 'text-muted hover:text-ink'
              "
              :disabled="readOnly || busy"
              @click="switchSourceMode('upload')"
            >
              <Upload class="h-4 w-4 shrink-0" />
              <span>Tải video từ máy</span>
            </button>
            <button
              type="button"
              class="inline-flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-medium transition-colors"
              :class="
                sourceMode === 'none'
                  ? 'bg-surface-2 text-ink'
                  : 'text-muted hover:text-ink'
              "
              :disabled="readOnly || busy"
              @click="switchSourceMode('none')"
            >
              <VideoOff class="h-4 w-4 shrink-0" />
              <span>Không dùng video</span>
            </button>
          </div>

          <!-- Chế độ 1: Mã nhúng YouTube <iframe> (Chỉ có ở khóa học FREE) -->
          <div v-if="sourceMode === 'youtube' && !isPro" class="space-y-3">
            <label class="manage-field">
              <span>Mã nhúng YouTube (&lt;iframe&gt;)</span>
              <textarea
                v-model="form.youtubeEmbedInput"
                class="manage-input min-h-20 text-xs"
                maxlength="2000"
                :disabled="readOnly || busy"
                placeholder='<iframe width="560" height="315" src="https://www.youtube.com/embed/..." title="YouTube video player" frameborder="0" allowfullscreen></iframe>'
              />
              <span v-if="errors.videoUrl" class="manage-field-error">{{
                errors.videoUrl
              }}</span>
            </label>

            <div
              v-if="parsedYouTube"
              class="overflow-hidden bg-ground"
            >
              <div class="flex items-center justify-between bg-surface-2 px-3 py-2 text-xs text-ink">
                <span class="inline-flex items-center gap-1.5 font-medium">
                  <Film class="h-3.5 w-3.5 text-brand-soft" />
                  Xem trước video YouTube (ID: {{ parsedYouTube.videoId }})
                </span>
              </div>
              <div ref="youtubeContainerRef" class="aspect-video w-full bg-black" />
            </div>
          </div>

          <!-- Chế độ 2: Tải video từ máy lên public/videos -->
          <div v-else-if="sourceMode === 'upload'" class="space-y-3">
            <div class="manage-field">
              <span>Tệp video bài giảng (MP4, WEBM - tối đa 1GB) <span class="text-xs font-normal text-muted">(Tùy chọn)</span></span>
              <input
                ref="videoFileInputRef"
                type="file"
                accept="video/mp4,video/webm"
                class="sr-only"
                :disabled="readOnly || busy"
                @change="handleVideoFileChange"
              />

              <div class="mt-1 space-y-3 bg-ground p-4">
                <div class="flex flex-wrap items-center gap-2">
                  <button
                    v-if="!readOnly"
                    type="button"
                    class="manage-button-secondary text-xs sm:text-sm"
                    :disabled="busy"
                    @click="triggerVideoPicker"
                  >
                    <Upload class="h-4 w-4" />
                    {{
                      activeUploadedPreviewUrl
                        ? 'Chọn video khác từ máy'
                        : 'Chọn video từ máy'
                    }}
                  </button>
                  <button
                    v-if="!readOnly && selectedVideoFile"
                    type="button"
                    class="manage-button-danger text-xs sm:text-sm"
                    :disabled="busy"
                    @click="clearSelectedVideo"
                  >
                    <X class="h-4 w-4" />
                    Hủy video mới chọn
                  </button>
                  <button
                    v-else-if="!readOnly && form.existingUploadedUrl"
                    type="button"
                    class="manage-button-danger text-xs sm:text-sm"
                    :disabled="busy"
                    @click="removeExistingVideo"
                  >
                    <Trash2 class="h-4 w-4" />
                    Gỡ video hiện tại
                  </button>
                </div>

                <p v-if="selectedVideoFile" class="text-xs text-ink">
                  Đã chọn: <strong class="font-semibold">{{ selectedVideoFile.name }}</strong>
                  ({{ formatFileSize(selectedVideoFile.size) }}) - Khi bấm Lưu, video sẽ được tải lên ngầm có thanh tiến trình.
                </p>
                <p v-else-if="form.existingUploadedUrl" class="text-xs text-muted">
                  Video hiện tại: <code class="text-ink">{{ form.existingUploadedUrl }}</code>
                </p>
                <p v-else class="text-xs text-muted">
                  Hỗ trợ định dạng MP4, WEBM (dung lượng tối đa 1GB).
                </p>

                <span v-if="errors.videoUrl" class="manage-field-error">{{
                  errors.videoUrl
                }}</span>

                <div
                  v-if="activeUploadedPreviewUrl"
                  class="overflow-hidden bg-black"
                >
                  <div class="flex items-center justify-between bg-surface-2 px-3 py-2 text-xs text-ink">
                    <span class="inline-flex items-center gap-1.5 font-medium">
                      <Film class="h-3.5 w-3.5 text-brand-soft" />
                      {{
                        selectedVideoFile
                          ? 'Xem trước video mới chọn (chạy trên trình duyệt)'
                          : 'Xem trước video đã lưu'
                      }}
                    </span>
                  </div>
                  <video
                    :key="activeUploadedPreviewUrl"
                    :src="activeUploadedPreviewUrl"
                    controls
                    preload="metadata"
                    class="aspect-video w-full bg-black"
                    @loadedmetadata="handleLocalVideoMetadata"
                    @error="handleLocalVideoError"
                  />
                </div>
              </div>
            </div>
          </div>

          <p v-else class="bg-ground p-3 text-xs text-muted">
            Bài giảng này đang chọn chế độ <strong>Không dùng video</strong>.
          </p>

          <!-- Thời lượng tự động trích xuất (Chỉ hiển thị khi có video) -->
          <div v-if="sourceMode !== 'none'" class="bg-ground p-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="inline-flex items-center gap-1.5 text-xs font-medium text-ink">
                <Clock3 class="h-3.5 w-3.5 text-brand-soft" />
                Thời lượng video
              </span>
              <span class="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-muted">
                <Lock class="h-3 w-3 text-brand-soft" />
                Tự động trích xuất
              </span>
            </div>

            <div class="mt-1.5 flex items-center gap-2">
              <template v-if="extractingDuration">
                <Loader2 class="h-4 w-4 animate-spin text-brand-soft" />
                <span class="text-xs text-ink">
                  Đang trích xuất thời lượng tự động từ video…
                </span>
              </template>
              <template v-else>
                <span
                  class="text-sm font-semibold tabular-nums"
                  :class="hasActiveVideoInput && extractedDuration > 0 ? 'text-ink' : 'text-muted'"
                >
                  {{ formattedDuration }}
                </span>
              </template>
            </div>
            <span v-if="errors.duration" class="manage-field-error mt-1 block">{{
              errors.duration
            }}</span>
          </div>
        </div>

        <!-- PHẦN 2: NỘI DUNG BÀI ĐỌC (TEXT) & TÀI LIỆU ĐÍNH KÈM (TÙY CHỌN) -->
        <div class="space-y-4 border border-surface-3 p-4">
          <div>
            <span class="block text-sm font-medium text-ink">
              2. Nội dung bài đọc (Text) &amp; Tài liệu đính kèm
            </span>
          </div>

          <!-- Tải file tài liệu lên -->
          <div class="bg-ground p-3.5 space-y-2.5">
            <input
              ref="docFileInputRef"
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              class="sr-only"
              :disabled="readOnly || busy || uploadingDocument"
              @change="handleDocFileChange"
            />

            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2">
                <button
                  v-if="!readOnly"
                  type="button"
                  class="manage-button-secondary text-xs"
                  :disabled="busy || uploadingDocument"
                  @click="triggerDocPicker"
                >
                  <Loader2
                    v-if="uploadingDocument"
                    class="h-4 w-4 animate-spin"
                  />
                  <Upload v-else class="h-4 w-4" />
                  <span>
                    {{
                      uploadingDocument
                        ? 'Đang tải tài liệu lên…'
                        : form.fileUrl
                          ? 'Đổi file tài liệu khác'
                          : 'Tải file tài liệu (.pdf, .docx, .txt, .md)'
                    }}
                  </span>
                </button>

                <button
                  v-if="!readOnly && form.fileUrl"
                  type="button"
                  class="manage-button-danger text-xs"
                  :disabled="busy || uploadingDocument"
                  @click="removeAttachedDocument"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                  <span>Gỡ file đính kèm</span>
                </button>
              </div>
              <span class="text-[11px] text-muted">Tối đa 25MB</span>
            </div>

            <div
              v-if="form.fileUrl"
              class="flex flex-wrap items-center justify-between gap-2 bg-surface px-3 py-2 text-xs"
            >
              <span class="inline-flex items-center gap-2 font-medium text-ink">
                <FileText class="h-4 w-4 shrink-0 text-brand-soft" />
                <span>Tài liệu đính kèm: <strong>{{ form.fileName || form.fileUrl }}</strong></span>
              </span>
              <a
                :href="form.fileUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="text-brand-soft underline hover:opacity-80"
              >
                Xem file
              </a>
            </div>

            <div
              v-if="docUploadSuccessMessage"
              class="flex items-center gap-1.5 bg-surface p-2.5 text-xs text-emerald-300"
            >
              <CheckCircle2 class="h-4 w-4 shrink-0" />
              <span>{{ docUploadSuccessMessage }}</span>
            </div>

            <span v-if="errors.fileUrl" class="manage-field-error block">{{
              errors.fileUrl
            }}</span>
          </div>

          <!-- Nhập nội dung bài đọc thủ công -->
          <label class="manage-field">
            <div class="flex items-center justify-between gap-2">
              <span>Nội dung bài giảng dạng chữ </span>
              <span class="text-[11px] tabular-nums text-muted">
                {{ form.content.length }} / 50000 ký tự
              </span>
            </div>
            <textarea
              v-model="form.content"
              class="manage-input min-h-40 text-sm leading-6"
              maxlength="50000"
              :disabled="readOnly || busy"
              placeholder="Nhập nội dung lý thuyết, hướng dẫn thực hành, ví dụ minh họa..."
            />
            <span v-if="errors.content" class="manage-field-error">{{
              errors.content
            }}</span>
          </label>
        </div>

        <template v-if="isPro">
          <label class="manage-field">
            <span>Ghi chép</span>
            <textarea
              v-model="form.note"
              class="manage-input min-h-24"
              maxlength="10000"
              :disabled="readOnly || busy"
            />
          </label>
          <span v-if="errors.note" class="manage-field-error">{{
            errors.note
          }}</span>
          <label class="manage-field">
            <span>Tóm tắt</span>
            <textarea
              v-model="form.summary"
              class="manage-input min-h-24"
              maxlength="3000"
              :disabled="readOnly || busy"
            />
          </label>
          <span v-if="errors.summary" class="manage-field-error">{{
            errors.summary
          }}</span>
        </template>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
        <button
          type="button"
          class="manage-button-secondary"
          :disabled="busy"
          @click="emit('cancel')"
        >
          Hủy
        </button>
        <button
          type="submit"
          class="manage-button-primary"
          :disabled="busy || extractingDuration || uploadingDocument"
        >
          {{
            busy
              ? 'Đang lưu…'
              : extractingDuration
                ? 'Đang lấy thời lượng…'
                : uploadingDocument
                  ? 'Đang tải tài liệu…'
                  : 'Lưu bài giảng'
          }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.manage-dialog::backdrop {
  background: rgb(15 23 42 / 0.55);
}
</style>
