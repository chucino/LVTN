<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';
import { partsToSeconds, secondsToParts } from '@/lib/manage-course-format';
import type { ManageLesson, ManageLessonPayload } from '@/types/manage-course';

const props = defineProps<{
  open: boolean;
  lesson: ManageLesson | null;
  isPro: boolean;
  readOnly?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{
  save: [payload: ManageLessonPayload];
  cancel: [];
}>();
const dialog = ref<HTMLDialogElement | null>(null);
const errors = reactive<Record<string, string>>({});
const form = reactive({
  title: '',
  videoUrl: '',
  minutes: 0,
  seconds: 0,
  note: '',
  summary: '',
});
const duration = computed(() => partsToSeconds(form.minutes, form.seconds));

watch(
  () => [props.open, props.lesson] as const,
  async ([open, lesson]) => {
    if (open) {
      const time = secondsToParts(lesson?.duration ?? 0);
      form.title = lesson?.title ?? '';
      form.videoUrl = lesson?.videoUrl ?? '';
      form.minutes = time.minutes;
      form.seconds = time.seconds;
      form.note = lesson?.note ?? '';
      form.summary = lesson?.summary ?? '';
      Object.keys(errors).forEach((key) => delete errors[key]);
      await nextTick();
      if (dialog.value && !dialog.value.open) dialog.value.showModal();
    } else if (dialog.value?.open) dialog.value.close();
  },
  { deep: true },
);

function validate(): boolean {
  Object.keys(errors).forEach((key) => delete errors[key]);
  if (form.title.trim().length < 3 || form.title.trim().length > 150) errors.title = 'Tên bài phải từ 3 đến 150 ký tự.';
  if (
    !Number.isInteger(form.minutes) ||
    !Number.isInteger(form.seconds) ||
    form.minutes < 0 ||
    form.seconds < 0 ||
    form.seconds > 59 ||
    duration.value < 1 ||
    duration.value > 36000
  ) {
    errors.duration = 'Thời lượng phải là số nguyên từ 1 đến 36000 giây; giây nằm trong khoảng 0–59.';
  }
  try {
    const url = new URL(form.videoUrl);
    if (url.protocol !== 'https:' || form.videoUrl.length > 500) errors.videoUrl = 'Liên kết video phải là HTTPS, tối đa 500 ký tự.';
  } catch {
    if (form.videoUrl !== 'PLACEHOLDER_VIDEO') errors.videoUrl = 'Nhập URL HTTPS hợp lệ hoặc giá trị PLACEHOLDER_VIDEO.';
  }
  if (form.note.length > 10000) errors.note = 'Ghi chép tối đa 10000 ký tự.';
  if (form.summary.length > 3000) errors.summary = 'Tóm tắt tối đa 3000 ký tự.';
  return Object.keys(errors).length === 0;
}

function submit() {
  if (props.busy || !validate()) return;
  emit('save', {
    title: form.title.trim(),
    videoUrl: form.videoUrl.trim(),
    duration: duration.value,
    ...(props.isPro ? { note: form.note || null, summary: form.summary || null } : {}),
  });
}
</script>

<template>
  <dialog ref="dialog" class="manage-dialog m-auto w-[min(96vw,42rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70" @cancel.prevent="emit('cancel')">
    <form class="max-h-[90vh] overflow-y-auto p-5 sm:p-6" novalidate @submit.prevent="submit">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-white">{{ lesson ? 'Chỉnh sửa bài giảng' : 'Thêm bài giảng' }}</h2>
          <p class="mt-1 text-xs text-slate-400">Không phát video tại khu vực quản lý.</p>
        </div>
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-800" aria-label="Đóng" :disabled="busy" @click="emit('cancel')"><X class="h-4 w-4" /></button>
      </div>

      <div class="mt-5 space-y-4">
        <label class="manage-field">
          Tên bài giảng
          <input v-model="form.title" class="manage-input" type="text" minlength="3" maxlength="150" />
          <span v-if="errors.title" class="manage-field-error">{{ errors.title }}</span>
        </label>
        <label class="manage-field">
          Liên kết video
          <input v-model="form.videoUrl" class="manage-input" type="url" maxlength="500" placeholder="Dán liên kết YouTube không công khai, Vimeo hoặc MP4" />
          <span v-if="errors.videoUrl" class="manage-field-error">{{ errors.videoUrl }}</span>
        </label>
        <fieldset>
          <legend class="mb-2 text-sm font-medium text-slate-200">Thời lượng</legend>
          <div class="flex max-w-sm items-center gap-2">
            <label class="manage-field flex-1">Phút<input v-model.number="form.minutes" class="manage-input" type="number" min="0" max="600" step="1" /></label>
            <span class="pt-6 text-slate-500">:</span>
            <label class="manage-field flex-1">Giây<input v-model.number="form.seconds" class="manage-input" type="number" min="0" max="59" step="1" /></label>
          </div>
          <span class="text-xs text-slate-500">{{ duration }} giây</span>
          <span v-if="errors.duration" class="manage-field-error">{{ errors.duration }}</span>
        </fieldset>
        <template v-if="isPro">
          <label class="manage-field">Ghi chép <textarea v-model="form.note" class="manage-input min-h-24" maxlength="10000" /></label>
          <span v-if="errors.note" class="manage-field-error">{{ errors.note }}</span>
          <label class="manage-field">Tóm tắt <textarea v-model="form.summary" class="manage-input min-h-24" maxlength="3000" /></label>
          <span v-if="errors.summary" class="manage-field-error">{{ errors.summary }}</span>
        </template>
      </div>

      <div class="mt-6 flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
        <button type="button" class="manage-button-secondary" :disabled="busy" @click="emit('cancel')">Hủy</button>
        <button type="submit" class="manage-button-primary" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu bài giảng' }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.manage-dialog::backdrop { background: rgb(2 6 23 / 0.72); backdrop-filter: blur(4px); }
</style>
