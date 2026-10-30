<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { AlertTriangle, X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    requiresReason?: boolean;
    busy?: boolean;
  }>(),
  {
    description: '',
    confirmLabel: 'Xác nhận',
    requiresReason: false,
    busy: false,
  },
);

const emit = defineEmits<{
  confirm: [reason: string];
  cancel: [];
}>();

const dialog = ref<HTMLDialogElement | null>(null);
const reason = ref('');
const canConfirm = computed(
  () => !props.requiresReason || reason.value.trim().length >= 10,
);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      reason.value = '';
      await nextTick();
      if (dialog.value && !dialog.value.open) dialog.value.showModal();
    } else if (dialog.value?.open) {
      dialog.value.close();
    }
  },
);

function submit() {
  if (!canConfirm.value || props.busy) return;
  emit('confirm', reason.value.trim());
}

function cancel() {
  if (!props.busy) emit('cancel');
}
</script>

<template>
  <dialog
    ref="dialog"
    class="manage-dialog m-auto w-[min(94vw,30rem)] rounded-2xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl shadow-black/60 backdrop:bg-black/70"
    aria-labelledby="manage-dialog-title"
    @cancel.prevent="cancel"
    @click.self="cancel"
  >
    <form class="p-5 sm:p-6" @submit.prevent="submit">
      <div class="flex items-start gap-3">
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10 text-amber-300">
          <AlertTriangle class="h-5 w-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h2 id="manage-dialog-title" class="text-lg font-bold text-white">{{ title }}</h2>
          <p v-if="description" class="mt-1 whitespace-pre-line text-sm leading-6 text-slate-400">
            {{ description }}
          </p>
        </div>
        <button type="button" class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white" aria-label="Đóng" :disabled="busy" @click="cancel">
          <X class="h-4 w-4" />
        </button>
      </div>

      <label v-if="requiresReason" class="mt-5 block text-sm font-medium text-slate-200">
        Lý do từ chối
        <textarea
          v-model="reason"
          rows="4"
          minlength="10"
          maxlength="500"
          required
          class="manage-input mt-2"
          placeholder="Nhập lý do từ 10 đến 500 ký tự"
        />
        <span class="mt-1 block text-xs text-slate-500">{{ reason.trim().length }}/500 ký tự</span>
      </label>

      <div class="mt-6 flex flex-col-reverse justify-end gap-2 sm:flex-row">
        <button type="button" class="manage-button-secondary" :disabled="busy" @click="cancel">Hủy</button>
        <button type="submit" class="manage-button-primary" :disabled="busy || !canConfirm">
          {{ busy ? 'Đang xử lý…' : confirmLabel }}
        </button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.manage-dialog::backdrop {
  background: rgb(2 6 23 / 0.72);
  backdrop-filter: blur(4px);
}
</style>
