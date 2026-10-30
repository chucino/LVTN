<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  BookOpen,
  CirclePlus,
  Search,
  SlidersHorizontal,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';
import { useManageCourseList, isManageCourseStatus } from '@/composables/useManageCourseList';
import { useManageCatalog } from '@/composables/useManageCatalog';
import CourseStatusBadge from '@/components/manage/CourseStatusBadge.vue';
import ManageCourseActions from '@/components/manage/ManageCourseActions.vue';
import ManageCourseThumbnail from '@/components/manage/ManageCourseThumbnail.vue';
import ManageActionDialog from '@/components/manage/ManageActionDialog.vue';
import type {
  ManageCourseItem,
  ManageCourseQuery,
  ManageCourseSort,
  ManageCourseStatus,
} from '@/types/manage-course';
import type { CourseType } from '@/types/course';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const catalog = useManageCatalog();
const { items, total, totalPages, loading, busyCourseId, error, load, act } =
  useManageCourseList();

const keyword = ref('');
const pendingAction = ref<{
  course: ManageCourseItem;
  action: 'submit' | 'withdraw' | 'approve' | 'reject' | 'hide' | 'delete';
} | null>(null);
const successMessage = ref('');
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');
const selectedStatus = computed(() =>
  isManageCourseStatus(route.query.status) ? route.query.status : undefined,
);
const currentPage = computed(() => {
  const parsed = Number(route.query.page);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
});
const currentSort = computed<ManageCourseSort>(() => {
  const sort = route.query.sort;
  return sort === 'newest' || sort === 'title_asc' ? sort : 'updated_desc';
});
const tabItems: Array<{ label: string; value?: ManageCourseStatus }> = [
  { label: 'Tất cả' },
  { label: 'Nháp', value: 'DRAFT' },
  { label: 'Chờ duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Đã ẩn', value: 'HIDDEN' },
];

const actionDetails = computed(() => {
  if (!pendingAction.value) return { title: '', description: '', confirmLabel: 'Xác nhận' };
  const { course, action } = pendingAction.value;
  const labels = {
    submit: ['Gửi khóa đi duyệt?', 'Khóa sẽ chuyển sang trạng thái Chờ duyệt.', 'Gửi duyệt'],
    withdraw: ['Thu hồi khóa học?', 'Khóa sẽ trở về Nháp để bạn tiếp tục chỉnh sửa.', 'Thu hồi'],
    approve: [
      course.status === 'HIDDEN' ? 'Hiện lại khóa học?' : 'Duyệt khóa học?',
      course.status === 'HIDDEN'
        ? 'Khóa sẽ hiển thị trở lại trên trang khóa học công khai.'
        : 'Khóa được duyệt sẽ hiển thị trên trang khóa học công khai.',
      course.status === 'HIDDEN' ? 'Hiện lại' : 'Duyệt khóa',
    ],
    reject: ['Từ chối khóa học?', 'Khóa sẽ trở về trạng thái Nháp và giảng viên có thể xem lý do.', 'Từ chối khóa'],
    hide: ['Ẩn khóa học?', 'Khóa sẽ không còn xuất hiện trong danh sách khóa học công khai.', 'Ẩn khóa'],
    delete: ['Xóa khóa học?', 'Thao tác này sẽ xóa khóa học và không thể hoàn tác.', 'Xóa khóa'],
  } as const;
  const [title, description, confirmLabel] = labels[action];
  return { title, description, confirmLabel };
});

function routeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function routeQueryValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function makeQuery(): ManageCourseQuery {
  const query: ManageCourseQuery = {
    page: currentPage.value,
    limit: 12,
    sort: currentSort.value,
  };
  const q = route.query;
  const keywordValue = routeQueryValue(q.keyword);
  const categoryId = routeQueryValue(q.categoryId);
  const instructorId = routeQueryValue(q.instructorId);
  const type = q.type === 'FREE' || q.type === 'PRO' ? q.type : undefined;
  if (keywordValue) query.keyword = keywordValue;
  if (selectedStatus.value) query.status = selectedStatus.value;
  if (categoryId) query.categoryId = categoryId;
  if (type) query.type = type as CourseType;
  if (isAdmin.value && instructorId) query.instructorId = instructorId;
  return query;
}

function syncKeyword() {
  keyword.value = routeString(route.query.keyword);
}

async function fetchList() {
  await load(makeQuery());
}

watch(
  () => route.fullPath,
  () => {
    syncKeyword();
    void fetchList();
  },
  { immediate: true },
);

let keywordTimer: ReturnType<typeof setTimeout> | undefined;
watch(keyword, (value) => {
  if (keywordTimer) clearTimeout(keywordTimer);
  keywordTimer = setTimeout(() => {
    const next = { ...route.query, keyword: value.trim() || undefined, page: undefined };
    void router.replace({ query: next });
  }, 300);
});
onUnmounted(() => {
  if (keywordTimer) clearTimeout(keywordTimer);
});

onMounted(async () => {
  await catalog.loadCatalog(isAdmin.value).catch(() => undefined);
});

function changeQuery(values: Record<string, string | undefined>) {
  void router.push({ query: { ...route.query, ...values } });
}

function selectStatus(status?: ManageCourseStatus) {
  changeQuery({ status, page: undefined });
}

function selectType(value: string) {
  changeQuery({ type: value || undefined, page: undefined });
}

function setCategory(value: string) {
  changeQuery({ categoryId: value || undefined, page: undefined });
}

function setInstructor(value: string) {
  changeQuery({ instructorId: value || undefined, page: undefined });
}

function setSort(value: string) {
  changeQuery({ sort: value, page: undefined });
}

function openAction(course: ManageCourseItem, action: NonNullable<typeof pendingAction.value>['action']) {
  pendingAction.value = { course, action };
}

async function confirmAction(reason: string) {
  const request = pendingAction.value;
  if (!request) return;
  try {
    await act(request.course.id, request.action, reason);
    successMessage.value =
      request.action === 'delete'
        ? 'Đã xóa khóa học.'
        : request.action === 'reject'
          ? 'Đã từ chối khóa học và lưu lý do.'
          : 'Đã cập nhật trạng thái khóa học.';
    pendingAction.value = null;
    await fetchList();
  } catch {
    // Error message is exposed by the list composable below.
  }
}

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

const hasFilters = computed(
  () =>
    Boolean(route.query.keyword) ||
    Boolean(route.query.status) ||
    Boolean(route.query.type) ||
    Boolean(route.query.categoryId) ||
    Boolean(route.query.instructorId),
);
</script>

<template>
  <section class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">Course studio</p>
        <h1 class="text-2xl font-black tracking-tight text-white sm:text-3xl">
          {{ isAdmin ? 'Tất cả khóa học' : 'Khóa học của tôi' }}
        </h1>
        <p class="mt-2 text-sm text-slate-400">Quản lý nội dung và theo dõi trạng thái duyệt.</p>
      </div>
      <router-link
        :to="{ name: 'ManageCourseCreate' }"
        class="manage-button-primary inline-flex items-center justify-center gap-2"
      >
        <CirclePlus class="h-4 w-4" />
        Tạo khóa học
      </router-link>
    </div>

    <div v-if="successMessage" class="manage-alert-success" role="status">
      {{ successMessage }}
      <button type="button" class="ml-auto text-emerald-200 underline" @click="successMessage = ''">Đóng</button>
    </div>
    <div v-if="error || catalog.catalogError.value" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error || catalog.catalogError.value }}</span>
      <button v-if="error" type="button" class="ml-auto underline" @click="fetchList">Thử lại</button>
    </div>

    <div class="manage-panel overflow-hidden">
      <div class="flex gap-2 overflow-x-auto border-b border-slate-800 px-4 pt-4 sm:px-6" role="tablist" aria-label="Lọc theo trạng thái">
        <button
          v-for="tab in tabItems"
          :key="tab.label"
          type="button"
          class="whitespace-nowrap border-b-2 px-2 pb-3 text-sm font-semibold transition"
          :class="selectedStatus === tab.value && (tab.value !== undefined || !route.query.status) ? 'border-cyan-300 text-cyan-200' : 'border-transparent text-slate-400 hover:text-white'"
          :aria-pressed="selectedStatus === tab.value && (tab.value !== undefined || !route.query.status)"
          @click="selectStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">
        <label class="relative sm:col-span-2 xl:col-span-2">
          <span class="sr-only">Tìm theo tên khóa học</span>
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input v-model="keyword" type="search" maxlength="100" class="manage-input pl-10" placeholder="Tìm tên khóa học…" />
        </label>
        <label>
          <span class="sr-only">Lọc theo loại khóa học</span>
          <select class="manage-input" :value="route.query.type || ''" @change="selectType(($event.target as HTMLSelectElement).value)">
            <option value="">Tất cả loại</option>
            <option value="FREE">Free</option>
            <option value="PRO">Pro</option>
          </select>
        </label>
        <label>
          <span class="sr-only">Lọc theo danh mục</span>
          <select class="manage-input" :value="route.query.categoryId || ''" @change="setCategory(($event.target as HTMLSelectElement).value)">
            <option value="">Tất cả danh mục</option>
            <option v-for="category in catalog.categories.value" :key="category.id" :value="category.id">{{ category.name }}</option>
          </select>
        </label>
        <label v-if="isAdmin">
          <span class="sr-only">Lọc theo giảng viên</span>
          <select class="manage-input" :value="route.query.instructorId || ''" @change="setInstructor(($event.target as HTMLSelectElement).value)">
            <option value="">Tất cả giảng viên</option>
            <option v-for="instructor in catalog.instructors.value" :key="instructor.id" :value="instructor.id">{{ instructor.fullName }}</option>
          </select>
        </label>
        <label class="flex items-center gap-2 text-sm text-slate-400 sm:col-span-2 xl:col-span-1">
          <SlidersHorizontal class="h-4 w-4 shrink-0" />
          <span class="sr-only">Sắp xếp khóa học</span>
          <select class="manage-input" :value="currentSort" @change="setSort(($event.target as HTMLSelectElement).value)">
            <option value="updated_desc">Cập nhật gần đây</option>
            <option value="newest">Mới tạo</option>
            <option value="title_asc">Tên A–Z</option>
          </select>
        </label>
      </div>

      <div class="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-500 sm:px-6">
        <span>{{ total }} khóa học</span>
        <span>Trang {{ currentPage }}{{ totalPages ? ` / ${totalPages}` : '' }}</span>
      </div>
    </div>

    <div v-if="loading" class="manage-panel space-y-3 p-5" aria-label="Đang tải khóa học" aria-busy="true">
      <div v-for="n in 4" :key="n" class="h-16 animate-pulse rounded-xl bg-slate-800/70" />
    </div>

    <div v-else-if="!error && items.length === 0" class="manage-panel px-5 py-14 text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10 text-cyan-200">
        <BookOpen class="h-6 w-6" />
      </div>
      <h2 class="mt-4 text-lg font-bold text-white">{{ hasFilters ? 'Không tìm thấy khóa học' : 'Bạn chưa có khóa học nào' }}</h2>
      <p class="mt-2 text-sm text-slate-400">
        {{ hasFilters ? 'Thử thay đổi bộ lọc hoặc từ khóa.' : 'Bắt đầu bằng cách tạo khóa học đầu tiên của bạn.' }}
      </p>
      <router-link v-if="!hasFilters" :to="{ name: 'ManageCourseCreate' }" class="manage-button-primary mt-5 inline-flex items-center gap-2">
        <CirclePlus class="h-4 w-4" /> Tạo khóa học
      </router-link>
    </div>

    <div v-else-if="!loading && !error" class="manage-panel overflow-hidden">
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="border-b border-slate-800 bg-slate-900/70 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th class="px-5 py-4 font-semibold">Khóa học</th>
              <th class="px-4 py-4 font-semibold">Loại / Giá</th>
              <th class="px-4 py-4 font-semibold">Trạng thái</th>
              <th class="px-4 py-4 font-semibold">Nội dung</th>
              <th v-if="isAdmin" class="px-4 py-4 font-semibold">Giảng viên</th>
              <th class="px-4 py-4 font-semibold">Cập nhật</th>
              <th class="px-4 py-4 font-semibold">Thao tác</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80">
            <tr v-for="course in items" :key="course.id" class="transition hover:bg-slate-900/50">
              <td class="max-w-[360px] px-5 py-4">
                <div class="flex items-center gap-3">
                  <ManageCourseThumbnail :src="course.thumbnail" :title="course.title" />
                  <div class="min-w-0">
                    <router-link :to="{ name: 'ManageCourseEdit', params: { id: course.id } }" class="line-clamp-2 font-semibold text-white hover:text-cyan-200">
                      {{ course.title }}
                    </router-link>
                    <p class="mt-1 truncate text-xs text-slate-500">{{ course.category.name }} · {{ course.level }}</p>
                    <p v-if="course.status === 'DRAFT' && course.rejectReason" class="mt-1 truncate text-xs font-semibold text-rose-300" :title="course.rejectReason">
                      Bị từ chối: {{ course.rejectReason }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <span class="font-semibold" :class="course.type === 'FREE' ? 'text-emerald-300' : 'text-amber-200'">{{ course.type }}</span>
                <p class="mt-1 text-xs text-slate-400">{{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }}</p>
              </td>
              <td class="px-4 py-4"><CourseStatusBadge :status="course.status" /></td>
              <td class="px-4 py-4 text-xs text-slate-400">{{ course.totalChapters }} chương · {{ course.totalLessons }} bài<br />{{ formatCourseDuration(course.totalDuration) }}</td>
              <td v-if="isAdmin" class="max-w-40 truncate px-4 py-4 text-slate-300">{{ course.instructor.fullName }}</td>
              <td class="whitespace-nowrap px-4 py-4 text-xs text-slate-400">{{ formatUpdatedAt(course.updatedAt) }}</td>
              <td class="px-4 py-4">
                <ManageCourseActions :course="course" @action="openAction(course, $event)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-3 p-3 lg:hidden">
        <article v-for="course in items" :key="course.id" class="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <div class="flex gap-3">
            <ManageCourseThumbnail class="!h-16 !w-20 !rounded-xl" :src="course.thumbnail" :title="course.title" />
            <div class="min-w-0 flex-1">
              <router-link :to="{ name: 'ManageCourseEdit', params: { id: course.id } }" class="line-clamp-2 font-bold text-white">{{ course.title }}</router-link>
              <p class="mt-1 truncate text-xs text-slate-400">{{ course.category.name }} · {{ course.type }} · {{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }}</p>
              <CourseStatusBadge class="mt-2" :status="course.status" />
            </div>
          </div>
          <p v-if="course.status === 'DRAFT' && course.rejectReason" class="mt-3 rounded-lg border border-rose-400/20 bg-rose-500/5 p-2 text-xs text-rose-200">
            Bị từ chối: {{ course.rejectReason }}
          </p>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3">
            <p class="text-xs leading-5 text-slate-400">
              {{ course.totalChapters }} chương · {{ course.totalLessons }} bài · {{ formatCourseDuration(course.totalDuration) }}
              <span class="block">Cập nhật {{ formatUpdatedAt(course.updatedAt) }}<template v-if="isAdmin"> · {{ course.instructor.fullName }}</template></span>
            </p>
            <ManageCourseActions :course="course" @action="openAction(course, $event)" />
          </div>
        </article>
      </div>
    </div>

    <div v-if="!loading && totalPages > 1" class="flex items-center justify-center gap-3">
      <button type="button" class="manage-button-secondary" :disabled="currentPage <= 1" @click="changeQuery({ page: String(currentPage - 1) })">Trước</button>
      <span class="text-sm text-slate-400">{{ currentPage }} / {{ totalPages }}</span>
      <button type="button" class="manage-button-secondary" :disabled="currentPage >= totalPages" @click="changeQuery({ page: String(currentPage + 1) })">Tiếp</button>
    </div>

    <ManageActionDialog
      :open="pendingAction !== null"
      :title="actionDetails.title"
      :description="actionDetails.description"
      :confirm-label="actionDetails.confirmLabel"
      :requires-reason="pendingAction?.action === 'reject'"
      :busy="Boolean(busyCourseId)"
      @cancel="pendingAction = null"
      @confirm="confirmAction"
    />
  </section>
</template>
