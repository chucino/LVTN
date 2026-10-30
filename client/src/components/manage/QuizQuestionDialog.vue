<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { Plus, Trash2, X } from 'lucide-vue-next';
import type { ManageQuizQuestion, ManageQuizQuestionPayload } from '@/types/manage-course';

const props = defineProps<{
  open: boolean;
  question: ManageQuizQuestion | null;
  questionCount: number;
  readOnly?: boolean;
  busy?: boolean;
}>();
const emit = defineEmits<{
  save: [payload: ManageQuizQuestionPayload];
  cancel: [];
}>();
const dialog = ref<HTMLDialogElement | null>(null);
const form = reactive({ content: '', options: ['', ''], correctOption: 0, explanation: '' });
const error = ref('');
const isAtLimit = computed(() => props.questionCount >= 10 && !props.question);

watch(
  () => [props.open, props.question] as const,
  async ([open, question]) => {
    if (open) {
      form.content = question?.content ?? '';
      form.options = question ? [...question.options] : ['', ''];
      form.correctOption = question?.correctOption ?? 0;
      form.explanation = question?.explanation ?? '';
      error.value = '';
      await nextTick();
      if (dialog.value && !dialog.value.open) dialog.value.showModal();
    } else if (dialog.value?.open) dialog.value.close();
  },
  { deep: true },
);

function addOption() {
  if (form.options.length < 6) form.options.push('');
}

function removeOption(index: number) {
  if (form.options.length <= 2) return;
  form.options.splice(index, 1);
  if (form.correctOption === index) form.correctOption = 0;
  else if (form.correctOption > index) form.correctOption -= 1;
}

function submit() {
  const options = form.options.map((option) => option.trim());
  if (form.content.trim().length < 5 || form.content.trim().length > 500) {
    error.value = 'Nội dung câu hỏi phải từ 5 đến 500 ký tự.';
  } else if (options.length < 2 || options.length > 6 || options.some((option) => option.length < 1 || option.length > 200)) {
    error.value = 'Cần từ 2 đến 6 phương án, mỗi phương án từ 1 đến 200 ký tự.';
  } else if (new Set(options).size !== options.length) {
    error.value = 'Các phương án trả lời không được trùng nhau.';
  } else if (!Number.isInteger(form.correctOption) || form.correctOption < 0 || form.correctOption >= options.length) {
    error.value = 'Hãy chọn một đáp án đúng hợp lệ.';
  } else if (form.explanation.trim().length < 5 || form.explanation.trim().length > 1000) {
    error.value = 'Giải thích phải từ 5 đến 1000 ký tự.';
  } else if (isAtLimit.value) {
    error.value = 'Mỗi bài giảng chỉ được có tối đa 10 câu hỏi.';
  } else {
    error.value = '';
  }
  if (error.value || props.busy) return;
  emit('save', {
    content: form.content.trim(),
    options,
    correctOption: form.correctOption,
    explanation: form.explanation.trim(),
  });
}
</script>

<template>
  <dialog ref="dialog" class="manage-dialog m-auto w-[min(96vw,42rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70" @cancel.prevent="emit('cancel')">
    <form class="max-h-[90vh] overflow-y-auto p-5 sm:p-6" novalidate @submit.prevent="submit">
      <div class="flex items-center justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold text-white">{{ question ? 'Sửa câu trắc nghiệm' : 'Thêm câu trắc nghiệm' }}</h2>
          <p class="mt-1 text-xs text-slate-400">Chọn đáp án đúng; chỉ số gửi API bắt đầu từ 0.</p>
        </div>
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-800" aria-label="Đóng" :disabled="busy" @click="emit('cancel')"><X class="h-4 w-4" /></button>
      </div>

      <label class="manage-field mt-5">
        Nội dung câu hỏi
        <textarea v-model="form.content" class="manage-input min-h-24" minlength="5" maxlength="500" />
      </label>

      <fieldset class="mt-5 space-y-2">
        <legend class="mb-2 text-sm font-semibold text-slate-200">Phương án — chọn đáp án đúng</legend>
        <div v-for="(_, index) in form.options" :key="index" class="flex items-center gap-2">
          <input v-model.number="form.correctOption" type="radio" :value="index" :name="`correct-option-${question?.id ?? 'new'}`" :aria-label="`Chọn phương án ${index + 1} là đáp án đúng`" class="h-4 w-4 accent-cyan-400" />
          <label class="sr-only" :for="`quiz-option-${index}`">Phương án {{ index + 1 }}</label>
          <input :id="`quiz-option-${index}`" v-model="form.options[index]" class="manage-input" type="text" maxlength="200" :placeholder="`Phương án ${index + 1}`" />
          <button type="button" class="manage-icon-button text-rose-300" :disabled="form.options.length <= 2" :aria-label="`Xóa phương án ${index + 1}`" @click="removeOption(index)"><Trash2 class="h-4 w-4" /></button>
        </div>
        <button type="button" class="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-200 disabled:opacity-40" :disabled="form.options.length >= 6" @click="addOption"><Plus class="h-4 w-4" /> Thêm phương án</button>
      </fieldset>

      <label class="manage-field mt-5">
        Giải thích đáp án
        <textarea v-model="form.explanation" class="manage-input min-h-24" minlength="5" maxlength="1000" />
      </label>
      <p v-if="error" class="manage-field-error mt-3" role="alert">{{ error }}</p>
      <div class="mt-6 flex flex-col-reverse gap-2 border-t border-slate-800 pt-4 sm:flex-row sm:justify-end">
        <button type="button" class="manage-button-secondary" :disabled="busy" @click="emit('cancel')">Hủy</button>
        <button type="submit" class="manage-button-primary" :disabled="busy || readOnly">{{ busy ? 'Đang lưu…' : 'Lưu câu hỏi' }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.manage-dialog::backdrop { background: rgb(2 6 23 / 0.72); backdrop-filter: blur(4px); }
</style>
