<script setup lang="ts">
import { Check, EyeOff, Pencil, RotateCcw, Send, Trash2, Users, X } from 'lucide-vue-next';
import type { ManageCourseItem } from '@/types/manage-course';

defineProps<{ course: ManageCourseItem }>();
const emit = defineEmits<{
  action: [action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete'];
}>();
</script>

<template>
  <div class="flex flex-wrap gap-1.5" :aria-label="`Thao tác khóa ${course.title}`">
    <router-link
      :to="{ name: 'ManageCourseStudents', params: { id: course.id } }"
      class="manage-icon-button"
      title="Danh sách học viên"
      :aria-label="`Danh sách học viên ${course.title}`"
    >
      <Users class="h-4 w-4" />
    </router-link>
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
    <button v-if="course.permissions.canApprove" type="button" class="manage-icon-button text-emerald-300" :title="course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt'" :aria-label="`${course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt'} ${course.title}`" @click="emit('action', 'approve')">
      <Check class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canReject" type="button" class="manage-icon-button text-rose-300" title="Từ chối" :aria-label="`Từ chối ${course.title}`" @click="emit('action', 'reject')">
      <X class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canHide" type="button" class="manage-icon-button" title="Ẩn khóa" :aria-label="`Ẩn ${course.title}`" @click="emit('action', 'hide')">
      <EyeOff class="h-4 w-4" />
    </button>
    <button v-if="course.permissions.canDelete" type="button" class="manage-icon-button text-rose-300" title="Xóa khóa" :aria-label="`Xóa ${course.title}`" @click="emit('action', 'delete')">
      <Trash2 class="h-4 w-4" />
    </button>
  </div>
</template>
