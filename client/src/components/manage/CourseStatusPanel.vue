<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-vue-next';
import type { ManageCourseDetail } from '@/types/manage-course';
import CourseStatusBadge from '@/components/manage/CourseStatusBadge.vue';
import ManageActionDialog from '@/components/manage/ManageActionDialog.vue';

const props = defineProps<{
  course: ManageCourseDetail;
  busy?: boolean;
}>();
const emit = defineEmits<{
  action: [action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete', reason?: string];
}>();
const pendingAction = ref<'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete' | null>(null);

const actionInfo = computed(() => {
  switch (pendingAction.value) {
    case 'submit': return { title: 'Gửi khóa đi duyệt?', description: 'Khóa sẽ chuyển sang trạng thái Chờ duyệt.', confirm: 'Gửi duyệt' };
    case 'withdraw': return { title: 'Thu hồi khóa học?', description: 'Khóa sẽ trở về Nháp để tiếp tục chỉnh sửa.', confirm: 'Thu hồi' };
    case 'approve': return { title: props.course.status === 'HIDDEN' ? 'Hiện lại khóa học?' : 'Duyệt khóa học?', description: 'Khóa sẽ hiển thị công khai sau khi được duyệt.', confirm: props.course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt' };
    case 'reject': return { title: 'Từ chối khóa học?', description: 'Khóa sẽ trở về Nháp. Nhập lý do để giảng viên biết nội dung cần bổ sung.', confirm: 'Từ chối' };
    case 'hide': return { title: 'Ẩn khóa học?', description: 'Khóa sẽ không còn xuất hiện trên trang khóa học công khai.', confirm: 'Ẩn khóa' };
    case 'delete': return { title: 'Xóa khóa học?', description: 'Thao tác này không thể hoàn tác.', confirm: 'Xóa khóa' };
    default: return { title: '', description: '', confirm: 'Xác nhận' };
  }
});

function confirmAction(reason: string) {
  if (!pendingAction.value) return;
  emit('action', pendingAction.value, reason);
  pendingAction.value = null;
}
</script>

<template>
  <section class="space-y-5">
    <div class="manage-panel flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Trạng thái hiện tại</p>
        <div class="mt-2"><CourseStatusBadge :status="course.status" /></div>
      </div>
      <router-link v-if="course.status === 'APPROVED'" :to="{ name: 'CourseDetail', params: { id: course.id } }" class="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-white">
        Xem trang công khai <ExternalLink class="h-4 w-4" />
      </router-link>
    </div>

    <div v-if="course.rejectReason" class="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-4 sm:p-5">
      <div class="flex items-start gap-3">
        <X class="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
        <div>
          <h2 class="font-bold text-rose-100">Lý do từ chối</h2>
          <p class="mt-2 whitespace-pre-line text-sm leading-6 text-rose-100/80">{{ course.rejectReason }}</p>
        </div>
      </div>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <section class="manage-panel p-5">
        <h2 class="flex items-center gap-2 font-bold text-white"><AlertCircle class="h-4 w-4 text-amber-300" /> Điều kiện gửi duyệt</h2>
        <ul v-if="course.readiness.issues.length" class="mt-4 space-y-3">
          <li v-for="(issue, index) in course.readiness.issues" :key="index" class="flex items-start gap-2 text-sm leading-5 text-rose-200">
            <X class="mt-0.5 h-4 w-4 shrink-0" /> {{ issue }}
          </li>
        </ul>
        <p v-else class="mt-4 flex items-center gap-2 text-sm text-emerald-200">
          <CheckCircle2 class="h-4 w-4" /> Nội dung đã đáp ứng các điều kiện bắt buộc.
        </p>
        <div v-if="course.readiness.warnings.length" class="mt-5 border-t border-slate-800 pt-4">
          <h3 class="flex items-center gap-2 text-sm font-semibold text-amber-200"><AlertTriangle class="h-4 w-4" /> Khuyến nghị</h3>
          <ul class="mt-3 space-y-2">
            <li v-for="(warning, index) in course.readiness.warnings" :key="index" class="text-sm leading-5 text-amber-100/80">{{ warning }}</li>
          </ul>
        </div>
      </section>

      <section class="manage-panel p-5">
        <h2 class="font-bold text-white">Thao tác trạng thái</h2>
        <p class="mt-1 text-sm text-slate-400">Các thao tác khả dụng được quyết định bởi quyền từ máy chủ.</p>
        <div class="mt-5 flex flex-wrap gap-2">
          <button v-if="course.permissions.canSubmit" type="button" class="manage-button-primary inline-flex items-center gap-2" :disabled="busy || !course.readiness.ready" :title="!course.readiness.ready ? course.readiness.issues.join(' '): ''" @click="pendingAction = 'submit'">
            <Send class="h-4 w-4" /> Gửi duyệt
          </button>
          <button v-if="course.permissions.canWithdraw" type="button" class="manage-button-secondary inline-flex items-center gap-2" :disabled="busy" @click="pendingAction = 'withdraw'">
            <RotateCcw class="h-4 w-4" /> Thu hồi
          </button>
          <button v-if="course.permissions.canApprove" type="button" class="manage-button-primary inline-flex items-center gap-2" :disabled="busy || !course.readiness.ready" :title="!course.readiness.ready ? course.readiness.issues.join(' '): ''" @click="pendingAction = 'approve'">
            <CheckCircle2 class="h-4 w-4" /> {{ course.status === 'HIDDEN' ? 'Hiện lại khóa' : 'Duyệt khóa' }}
          </button>
          <button v-if="course.permissions.canReject" type="button" class="manage-button-danger inline-flex items-center gap-2" :disabled="busy" @click="pendingAction = 'reject'">
            <X class="h-4 w-4" /> Từ chối
          </button>
          <button v-if="course.permissions.canHide" type="button" class="manage-button-secondary inline-flex items-center gap-2" :disabled="busy" @click="pendingAction = 'hide'">
            <EyeOff class="h-4 w-4" /> Ẩn khóa
          </button>
          <button v-if="course.permissions.canDelete" type="button" class="manage-button-danger inline-flex items-center gap-2" :disabled="busy" @click="pendingAction = 'delete'">
            <Trash2 class="h-4 w-4" /> Xóa khóa
          </button>
        </div>
        <p v-if="course.permissions.canSubmit && !course.readiness.ready" class="mt-3 text-xs leading-5 text-amber-200">
          Hoàn tất các điều kiện bắt buộc ở bên trái trước khi gửi duyệt.
        </p>
      </section>
    </div>

    <ManageActionDialog
      :open="pendingAction !== null"
      :title="actionInfo.title"
      :description="actionInfo.description"
      :confirm-label="actionInfo.confirm"
      :requires-reason="pendingAction === 'reject'"
      :busy="busy"
      @cancel="pendingAction = null"
      @confirm="confirmAction"
    />
  </section>
</template>
