<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { AlertCircle, ArrowLeft, BookOpen, CheckCircle2 } from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { useManageCourseEditor } from '@/composables/useManageCourseEditor';
import { useManageCatalog } from '@/composables/useManageCatalog';
import CourseInfoForm from '@/components/manage/CourseInfoForm.vue';
import CourseContentEditor from '@/components/manage/CourseContentEditor.vue';
import CourseStatusPanel from '@/components/manage/CourseStatusPanel.vue';
import { MANAGE_COURSE_TABS, type ManageCoursePayload, type ManageCourseTab } from '@/types/manage-course';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const editor = useManageCourseEditor();
const catalog = useManageCatalog();
const editorCourse = editor.course;
const editorLoading = editor.loading;
const editorError = editor.error;
const editorBusyKey = editor.busyKey;
const editorIsSaving = editor.isSaving;
const catalogCategories = catalog.categories;
const catalogInstructors = catalog.instructors;
const catalogLoading = catalog.loadingCatalog;
const catalogError = catalog.catalogError;

const dirty = ref(false);
const successMessage = ref('');
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');
const isCreating = computed(() => route.name === 'ManageCourseCreate');
const courseId = computed(() => typeof route.params.id === 'string' ? route.params.id : '');
const activeTab = computed<ManageCourseTab>(() => {
  const tab = route.query.tab;
  return tab === 'content' || tab === 'status' ? tab : 'info';
});
const pageTitle = computed(() => {
  if (isCreating.value) return 'Tạo khóa học';
  return editor.course.value?.title ?? 'Chỉnh sửa khóa học';
});
const isReadOnly = computed(
  () => Boolean(editor.course.value && !editor.course.value.permissions.canEdit),
);

function confirmDiscard(): boolean {
  return window.confirm('Bạn có thay đổi chưa lưu. Rời khỏi trang này và bỏ các thay đổi đó?');
}

onBeforeRouteLeave(() => {
  if (dirty.value && !confirmDiscard()) return false;
});

onBeforeRouteUpdate((to, from) => {
  if (dirty.value && to.fullPath !== from.fullPath) {
    if (!confirmDiscard()) return false;
    dirty.value = false;
  }
});

function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = '';
}

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload);
  void catalog.loadCatalog(isAdmin.value).catch(() => undefined);
});
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload));

watch(
  [isCreating, courseId],
  async ([creating, id]) => {
    successMessage.value = '';
    dirty.value = false;
    if (creating || !id) {
      editor.course.value = null;
      return;
    }
    try {
      await editor.load(id);
    } catch {
      // The composable exposes the error to the page.
    }
  },
  { immediate: true },
);

function setTab(tab: ManageCourseTab) {
  if (isCreating.value && tab !== 'info') return;
  void router.replace({
    query: { ...route.query, tab: tab === 'info' ? undefined : tab },
  });
}

async function saveInfo(payload: ManageCoursePayload) {
  successMessage.value = '';
  try {
    if (isCreating.value) {
      const created = await editor.create(payload);
      dirty.value = false;
      successMessage.value = 'Đã tạo khóa học ở trạng thái Nháp.';
      await router.replace({
        name: 'ManageCourseEdit',
        params: { id: created.id },
        query: { tab: 'content' },
      });
    } else {
      const updated = await editor.update(payload);
      dirty.value = false;
      successMessage.value = 'Đã lưu thông tin khóa học.';
      editor.course.value = updated;
    }
  } catch {
    // Error message from the API is shown below.
  }
}

async function handleStatusAction(
  action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete',
  reason?: string,
) {
  if (action === 'delete') {
    try {
      await editor.deleteCourse();
      await router.push({ name: 'ManageCourses' });
    } catch {
      // Error message from the API is shown below.
    }
    return;
  }
  try {
    if (action === 'reject') await editor.reject(reason ?? '');
    else await editor.transition(action);
    successMessage.value = 'Đã cập nhật trạng thái khóa học.';
  } catch {
    // Error message from the API is shown below.
  }
}
</script>

<template>
  <section class="mx-auto max-w-5xl space-y-6">
    <div class="flex flex-wrap items-center gap-3">
      <router-link :to="{ name: 'ManageCourses' }" class="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:bg-slate-900 hover:text-white" aria-label="Quay lại danh sách khóa học">
        <ArrowLeft class="h-4 w-4" />
      </router-link>
      <div class="min-w-0 flex-1">
        <p class="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">{{ isCreating ? 'Course studio / New' : 'Course studio / Edit' }}</p>
        <h1 class="mt-1 truncate text-2xl font-black text-white sm:text-3xl">{{ pageTitle }}</h1>
      </div>
      <span v-if="editorCourse" class="hidden items-center gap-1.5 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-300 sm:inline-flex">
        <BookOpen class="h-3.5 w-3.5 text-cyan-300" />
        {{ editorCourse.totalChapters }} chương · {{ editorCourse.totalLessons }} bài
      </span>
    </div>

    <div v-if="editorError || catalogError" class="manage-alert-error" role="alert">
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span>{{ editorError || catalogError }}</span>
      <button v-if="!isCreating && courseId" type="button" class="ml-auto underline" @click="editor.load(courseId)">Thử lại</button>
    </div>
    <div v-if="successMessage" class="manage-alert-success" role="status">
      <CheckCircle2 class="h-4 w-4 shrink-0" /> {{ successMessage }}
    </div>

    <div v-if="editorLoading" class="manage-panel space-y-4 p-5" aria-busy="true" aria-label="Đang tải khóa học">
      <div class="h-10 animate-pulse rounded-lg bg-slate-800" />
      <div class="h-32 animate-pulse rounded-lg bg-slate-800" />
      <div class="h-24 animate-pulse rounded-lg bg-slate-800" />
    </div>

    <template v-else-if="isCreating || editorCourse">
      <div v-if="editorCourse" class="manage-panel flex gap-1 overflow-x-auto p-1.5" role="tablist" aria-label="Các phần quản lý khóa học">
        <button
          v-for="tab in MANAGE_COURSE_TABS"
          :key="tab.value"
          type="button"
          class="whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition"
          :class="activeTab === tab.value ? 'bg-indigo-500/20 text-cyan-200' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
          :aria-selected="activeTab === tab.value"
          role="tab"
          @click="setTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <CourseInfoForm
        v-if="activeTab === 'info'"
        :course="editorCourse"
        :categories="catalogCategories"
        :instructors="catalogInstructors"
        :is-admin="isAdmin"
        :busy="editorIsSaving"
        :read-only="isReadOnly"
        :catalog-loading="catalogLoading"
        @dirty="dirty = $event"
        @save="saveInfo"
      />

      <CourseContentEditor
        v-else-if="activeTab === 'content' && editorCourse"
        :course="editorCourse"
        :read-only="isReadOnly"
        :busy-key="editorBusyKey"
        :error="editorError"
        :actions="editor.contentActions"
      />

      <CourseStatusPanel
        v-else-if="activeTab === 'status' && editorCourse"
        :course="editorCourse"
        :busy="editorIsSaving"
        @action="handleStatusAction"
      />
    </template>
    <div v-else-if="editorError" class="manage-panel p-6 text-center text-sm text-slate-400">
      Không thể mở khóa học. Hãy kiểm tra quyền truy cập hoặc tải lại trang.
    </div>
  </section>
</template>
