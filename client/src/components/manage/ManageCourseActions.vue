<script setup lang="ts">
import { Check, EyeOff, Pencil, Send, RotateCcw, Trash2, X } from 'lucide-vue-next';
import type { ManageCourseItem } from '@/types/manage-course';

defineProps<{ course: ManageCourseItem }>();
const emit = defineEmits<{
  action: [action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete'];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-1.5" :aria-label="`Thao tác khóa ${course.title}`">
    <router-link
      v-if="course.permissions.canEdit"
      :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
      class="manage-icon-button"
      title="Chỉnh sửa"
      :aria-label="`Chỉnh sửa ${course.title}`"
    >
      <Pencil class="h-4 w-4" />
    </router-link>
    <button v-if="course.permissions.canSubmit" type="button" class="manage-icon-button" title="Gửi duyệt" :aria-label="`Gửi duyệt ${course.title}`" @click="emit('action', 'submit')">
      <Send class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canWithdraw" type="button" class="manage-icon-button" title="Thu hồi" :aria-label="`Thu hồi ${course.title}`" @click="emit('action', 'withdraw')">
      <RotateCcw class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canApprove" type="button" class="manage-icon-button text-emerald-300 hover:border-emerald-400/40" :title="course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt'" :aria-label="`${course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt'} ${course.title}`" @click="emit('action', 'approve')">
      <Check class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canReject" type="button" class="manage-icon-button text-rose-300 hover:border-rose-400/40" title="Từ chối" :aria-label="`Từ chối ${course.title}`" @click="emit('action', 'reject')">
      <X class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canHide" type="button" class="manage-icon-button" title="Ẩn khóa" :aria-label="`Ẩn ${course.title}`" @click="emit('action', 'hide')">
      <EyeOff class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canDelete" type="button" class="manage-icon-button text-rose-300 hover:border-rose-400/40" title="Xóa khóa" :aria-label="`Xóa ${course.title}`" @click="emit('action', 'delete')">
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</template>

<style scoped>
.manage-icon-button {
  display: inline-flex;
  min-height: 2.25rem;
  min-width: 2.25rem;
  align-items: center;
  justify-content: center;
  border: 1px solid rgb(71 85 105 / 0.7);
  border-radius: 0.625rem;
  color: #cbd5e1;
  transition: background-color 150ms, border-color 150ms, color 150ms;
}
.manage-icon-button:hover {
  border-color: rgb(129 140 248 / 0.55);
  background: rgb(30 41 59 / 0.8);
  color: white;
}
.manage-icon-button:focus-visible {
  outline: 2px solid #67e8f9;
  outline-offset: 2px;
}
</style>
