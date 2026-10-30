<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import { X } from 'lucide-vue-next';

const props = defineProps<{
  open: boolean;
  title: string;
  initialValue?: string;
  busy?: boolean;
}>();
const emit = defineEmits<{
  save: [value: string];
  cancel: [];
}>();
const dialog = ref<HTMLDialogElement | null>(null);
const value = ref('');
const error = ref('');

watch(
  () => props.open,
  async (open) => {
    if (open) {
      value.value = props.initialValue ?? '';
      error.value = '';
      await nextTick();
      if (dialog.value && !dialog.value.open) dialog.value.showModal();
    } else if (dialog.value?.open) {
      dialog.value.close();
    }
  },
);

function save() {
  const trimmed = value.value.trim();
  if (trimmed.length < 3 || trimmed.length > 150) {
    error.value = 'Tên chương phải từ 3 đến 150 ký tự.';
    return;
  }
  emit('save', trimmed);
}
</script>

<template>
  <dialog ref="dialog" class="manage-dialog m-auto w-[min(94vw,28rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70" @cancel.prevent="emit('cancel')">
    <form class="p-5 sm:p-6" @submit.prevent="save">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-bold text-white">{{ title }}</h2>
        <button type="button" class="rounded-lg p-2 text-slate-400 hover:bg-slate-800" aria-label="Đóng" :disabled="busy" @click="emit('cancel')"><X class="h-4 w-4" /></button>
      </div>
      <label class="manage-field mt-5">
        Tên chương
        <input v-model="value" class="manage-input" type="text" minlength="3" maxlength="150" autofocus />
        <span v-if="error" class="manage-field-error">{{ error }}</span>
      </label>
      <div class="mt-6 flex justify-end gap-2">
        <button type="button" class="manage-button-secondary" :disabled="busy" @click="emit('cancel')">Hủy</button>
        <button type="submit" class="manage-button-primary" :disabled="busy">{{ busy ? 'Đang lưu…' : 'Lưu chương' }}</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.manage-dialog::backdrop { background: rgb(2 6 23 / 0.72); backdrop-filter: blur(4px); }
</style>
