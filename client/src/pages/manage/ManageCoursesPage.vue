<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  BookOpen,
  CirclePlus,
  Search,
  SlidersHorizontal,
  Users,
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
  <section data-ui class="space-y-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p class="text-xs font-medium text-muted">Course studio</p>
        <h1 class="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
          {{ isAdmin ? 'Tất cả khóa học' : 'Khóa học được phân công' }}
        </h1>
        <p class="mt-1 text-sm text-muted">
          {{
            isAdmin
              ? 'Tạo khóa học nền, phân công giảng viên và kiểm duyệt nội dung.'
              : 'Biên soạn chương, bài giảng và trắc nghiệm cho các khóa học bạn được phân công.'
          }}
        </p>
      </div>
      <router-link
        v-if="isAdmin"
        :to="{ name: 'ManageCourseCreate' }"
        class="manage-button-primary"
      >
        <CirclePlus class="h-4 w-4" />
        Tạo khóa học
      </router-link>
    </div>

    <div v-if="successMessage" class="manage-alert-success" role="status">
      {{ successMessage }}
      <button type="button" class="ml-auto underline" @click="successMessage = ''">Đóng</button>
    </div>
    <div v-if="error || catalog.catalogError.value" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error || catalog.catalogError.value }}</span>
      <button v-if="error" type="button" class="ml-auto underline" @click="fetchList">Thử lại</button>
    </div>

    <div class="bg-surface">
      <div class="flex gap-1 overflow-x-auto bg-ground p-1" role="tablist" aria-label="Lọc theo trạng thái">
        <button
          v-for="tab in tabItems"
          :key="tab.label"
          type="button"
          class="whitespace-nowrap px-3.5 py-2 text-xs font-medium transition-colors"
          :class="selectedStatus === tab.value && (tab.value !== undefined || !route.query.status) ? 'bg-surface-2 text-ink' : 'text-muted hover:bg-surface hover:text-ink'"
          :aria-pressed="selectedStatus === tab.value && (tab.value !== undefined || !route.query.status)"
          @click="selectStatus(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5">
        <label class="relative sm:col-span-2 xl:col-span-2">
          <span class="sr-only">Tìm theo tên khóa học</span>
          <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
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
        <label class="flex items-center gap-2 text-sm text-muted sm:col-span-2 xl:col-span-1">
          <SlidersHorizontal class="h-4 w-4 shrink-0" />
          <span class="sr-only">Sắp xếp khóa học</span>
          <select class="manage-input" :value="currentSort" @change="setSort(($event.target as HTMLSelectElement).value)">
            <option value="updated_desc">Cập nhật gần đây</option>
            <option value="newest">Mới tạo</option>
            <option value="title_asc">Tên A–Z</option>
          </select>
        </label>
      </div>

      <div class="flex items-center justify-between bg-ground px-4 py-2.5 text-xs tabular-nums text-muted sm:px-5">
        <span>{{ total }} khóa học</span>
        <span>Trang {{ currentPage }}{{ totalPages ? ` / ${totalPages}` : '' }}</span>
      </div>
    </div>

    <div v-if="loading" class="space-y-2 bg-surface p-5" aria-label="Đang tải khóa học" aria-busy="true">
      <div v-for="n in 4" :key="n" class="h-16 bg-surface-2" />
    </div>

    <div v-else-if="!error && items.length === 0" class="bg-surface px-5 py-14 text-center">
      <BookOpen class="mx-auto h-7 w-7 text-muted" />
      <h2 class="mt-3 text-base font-semibold text-ink">{{ hasFilters ? 'Không tìm thấy khóa học' : 'Bạn chưa có khóa học nào' }}</h2>
      <p class="mt-1.5 text-sm text-muted">
        {{
          hasFilters
            ? 'Thử thay đổi bộ lọc hoặc từ khóa.'
            : isAdmin
              ? 'Bắt đầu bằng cách tạo khóa học nền đầu tiên và phân công giảng viên.'
              : 'Quản trị viên sẽ tạo khóa học nền và phân công cho bạn biên soạn chương, bài giảng.'
        }}
      </p>
      <router-link v-if="!hasFilters && isAdmin" :to="{ name: 'ManageCourseCreate' }" class="manage-button-primary mt-5">
        <CirclePlus class="h-4 w-4" /> Tạo khóa học
      </router-link>
    </div>

    <div v-else-if="!loading && !error" class="bg-surface">
      <div class="hidden overflow-x-auto lg:block">
        <table class="w-full min-w-[980px] text-left text-sm">
          <thead class="bg-surface-2 text-xs font-medium text-muted">
            <tr>
              <th class="px-5 py-3.5 font-medium">Khóa học</th>
              <th class="px-4 py-3.5 font-medium">Loại / Giá</th>
              <th class="px-4 py-3.5 font-medium">Trạng thái</th>
              <th class="px-4 py-3.5 font-medium">Nội dung</th>
              <th class="px-4 py-3.5 font-medium">Học viên</th>
              <th v-if="isAdmin" class="px-4 py-3.5 font-medium">Giảng viên</th>
              <th class="px-4 py-3.5 font-medium">Cập nhật</th>
              <th class="px-4 py-3.5 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="course in items" :key="course.id" class="odd:bg-ground even:bg-surface transition-colors hover:bg-surface-2">
              <td class="max-w-[360px] px-5 py-4">
                <div class="flex items-center gap-3">
                  <ManageCourseThumbnail :src="course.thumbnail" :title="course.title" />
                  <div class="min-w-0">
                    <router-link :to="{ name: 'ManageCourseEdit', params: { id: course.id } }" class="line-clamp-2 font-medium text-ink hover:text-brand-soft">
                      {{ course.title }}
                    </router-link>
                    <p class="mt-1 truncate text-xs text-muted">{{ course.category.name }} · {{ course.level }}</p>
                    <p v-if="course.status === 'DRAFT' && course.rejectReason" class="mt-1 truncate text-xs font-medium text-rose-300" :title="course.rejectReason">
                      Bị từ chối: {{ course.rejectReason }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 tabular-nums">
                <span class="text-xs font-semibold" :class="course.type === 'FREE' ? 'text-emerald-300' : 'text-brand-soft'">{{ course.type }}</span>
                <p class="mt-1 text-xs text-muted">{{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }}</p>
              </td>
              <td class="px-4 py-4"><CourseStatusBadge :status="course.status" /></td>
              <td class="px-4 py-4 text-xs tabular-nums text-muted">{{ course.totalChapters }} chương · {{ course.totalLessons }} bài<br />{{ formatCourseDuration(course.totalDuration) }}</td>
              <td class="px-4 py-4 tabular-nums">
                <router-link
                  :to="{ name: 'ManageCourseStudents', params: { id: course.id } }"
                  class="inline-flex items-center gap-1.5 text-xs font-medium text-ink hover:text-brand-soft"
                  title="Xem danh sách học viên"
                >
                  <Users class="h-3.5 w-3.5 text-muted" />
                  <span>{{ course.totalStudents ?? 0 }} học viên</span>
                </router-link>
              </td>
              <td v-if="isAdmin" class="max-w-40 truncate px-4 py-4 text-ink">{{ course.instructor.fullName }}</td>
              <td class="whitespace-nowrap px-4 py-4 text-xs tabular-nums text-muted">{{ formatUpdatedAt(course.updatedAt) }}</td>
              <td class="px-4 py-4">
                <ManageCourseActions :course="course" @action="openAction(course, $event)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="space-y-2 p-3 lg:hidden">
        <article v-for="course in items" :key="course.id" class="bg-ground p-4">
          <div class="flex gap-3">
            <ManageCourseThumbnail class="!h-16 !w-20" :src="course.thumbnail" :title="course.title" />
            <div class="min-w-0 flex-1">
              <router-link :to="{ name: 'ManageCourseEdit', params: { id: course.id } }" class="line-clamp-2 font-medium text-ink">{{ course.title }}</router-link>
              <p class="mt-1 truncate text-xs tabular-nums text-muted">
                {{ course.category.name }} · {{ course.type }} · {{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }} ·
                <router-link :to="{ name: 'ManageCourseStudents', params: { id: course.id } }" class="underline hover:text-ink">
                  {{ course.totalStudents ?? 0 }} học viên
                </router-link>
              </p>
              <CourseStatusBadge class="mt-2" :status="course.status" />
            </div>
          </div>
          <p v-if="course.status === 'DRAFT' && course.rejectReason" class="mt-3 bg-surface-2 p-2 text-xs text-rose-200">
            Bị từ chối: {{ course.rejectReason }}
          </p>
          <div class="mt-3 flex flex-wrap items-center justify-between gap-3 pt-2">
            <p class="text-xs leading-5 tabular-nums text-muted">
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
      <span class="text-sm tabular-nums text-muted">{{ currentPage }} / {{ totalPages }}</span>
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
