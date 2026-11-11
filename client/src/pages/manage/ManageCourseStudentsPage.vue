<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CircleCheckBig,
  ExternalLink,
  GraduationCap,
  RotateCcw,
  Search,
  Users,
} from 'lucide-vue-next';
import { enrollmentsApi } from '@/services/enrollments.api';
import type {
  ManageCourseStudentsQuery,
  ManageCourseStudentsResponse,
  ManageCourseStudentsSort,
  ManageCourseStudentsStatusFilter,
} from '@/types/learning';

const route = useRoute();
const router = useRouter();

const courseId = computed(() => route.params.id as string);
const loading = ref(true);
const error = ref<string | null>(null);
const data = ref<ManageCourseStudentsResponse | null>(null);

const keyword = ref((route.query.search as string) || '');
const statusFilter = ref<ManageCourseStudentsStatusFilter>(
  (route.query.status as ManageCourseStudentsStatusFilter) || 'ALL',
);
const sortOption = ref<ManageCourseStudentsSort>(
  (route.query.sort as ManageCourseStudentsSort) || 'NEWEST',
);
const currentPage = ref(Number(route.query.page) || 1);

let searchTimeout: ReturnType<typeof setTimeout> | undefined;

function formatDate(isoString: string | null): string {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

async function fetchStudents() {
  if (!courseId.value) return;
  loading.value = true;
  error.value = null;

  try {
    const params: ManageCourseStudentsQuery = {
      page: currentPage.value,
      limit: 10,
      search: keyword.value.trim() || undefined,
      status: statusFilter.value,
      sort: sortOption.value,
    };
    data.value = await enrollmentsApi.getCourseStudents(courseId.value, params);
  } catch (err: any) {
    error.value =
      err.response?.data?.message ||
      'Không thể tải danh sách học viên. Vui lòng thử lại sau.';
  } finally {
    loading.value = false;
  }
}

function syncUrlAndFetch() {
  void router.replace({
    query: {
      ...route.query,
      search: keyword.value.trim() || undefined,
      status: statusFilter.value !== 'ALL' ? statusFilter.value : undefined,
      sort: sortOption.value !== 'NEWEST' ? sortOption.value : undefined,
      page: currentPage.value > 1 ? String(currentPage.value) : undefined,
    },
  });
  void fetchStudents();
}

function onSearchInput() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage.value = 1;
    syncUrlAndFetch();
  }, 350);
}

function setStatus(tab: ManageCourseStudentsStatusFilter) {
  if (statusFilter.value === tab) return;
  statusFilter.value = tab;
  currentPage.value = 1;
  syncUrlAndFetch();
}

function onSortChange() {
  currentPage.value = 1;
  syncUrlAndFetch();
}

function changePage(page: number) {
  if (page < 1 || (data.value && page > data.value.totalPages)) return;
  currentPage.value = page;
  syncUrlAndFetch();
}

function resetFilters() {
  keyword.value = '';
  statusFilter.value = 'ALL';
  sortOption.value = 'NEWEST';
  currentPage.value = 1;
  syncUrlAndFetch();
}

onMounted(() => {
  void fetchStudents();
});

watch(
  () => route.params.id,
  () => {
    void fetchStudents();
  },
);
</script>

<template>
  <div data-ui class="space-y-6">
    <!-- Header & Breadcrumb -->
    <div>
      <router-link
        :to="{ name: 'ManageCourses' }"
        class="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-ink transition-colors"
      >
        <ArrowLeft class="h-3.5 w-3.5" />
        Quay lại danh sách khóa học
      </router-link>

      <div class="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span
              v-if="data?.course.type"
              class="px-2 py-0.5 text-[11px] font-semibold"
              :class="data.course.type === 'FREE' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-brand/10 text-brand-soft'"
            >
              {{ data.course.type }}
            </span>
            <span
              v-if="data?.course.status"
              class="px-2 py-0.5 text-[11px] font-medium bg-surface-2 text-muted"
            >
              {{ data.course.status === 'APPROVED' ? 'Đã duyệt' : data.course.status }}
            </span>
          </div>
          <h1 class="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
            {{ data?.course.title ?? 'Quản lý học viên khóa học' }}
          </h1>
          <p class="mt-1 text-xs text-muted">
            Theo dõi danh sách học viên đăng ký, tiến độ học bài và chứng chỉ đã cấp.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 self-start bg-surface-2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface-3 transition-colors"
          @click="fetchStudents"
        >
          <RotateCcw class="h-3.5 w-3.5 text-muted" />
          Làm mới
        </button>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error }}</span>
      <button type="button" class="ml-auto underline" @click="fetchStudents">Thử lại</button>
    </div>

    <!-- Summary Metrics Cards -->
    <div v-if="data" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div data-ui class="bg-surface p-4">
        <div class="flex items-center justify-between text-muted">
          <span class="text-xs font-medium">Tổng học viên</span>
          <Users class="h-4 w-4" />
        </div>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-ink">
          {{ data.summary.totalStudents }}
        </p>
        <p class="mt-1 text-[11px] text-muted">Đã ghi danh khóa học</p>
      </div>

      <div data-ui class="bg-surface p-4">
        <div class="flex items-center justify-between text-brand-soft">
          <span class="text-xs font-medium text-muted">Đang học</span>
          <BookOpen class="h-4 w-4" />
        </div>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-ink">
          {{ data.summary.learningStudents }}
        </p>
        <p class="mt-1 text-[11px] text-muted">Tiến độ dưới 100%</p>
      </div>

      <div data-ui class="bg-surface p-4">
        <div class="flex items-center justify-between text-emerald-300">
          <span class="text-xs font-medium text-muted">Đã hoàn thành</span>
          <CircleCheckBig class="h-4 w-4" />
        </div>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-emerald-300">
          {{ data.summary.completedStudents }}
        </p>
        <p class="mt-1 text-[11px] text-muted">Đạt 100% & cấp chứng chỉ</p>
      </div>

      <div data-ui class="bg-surface p-4">
        <div class="flex items-center justify-between text-amber-300">
          <span class="text-xs font-medium text-muted">Tiến độ trung bình</span>
          <Award class="h-4 w-4" />
        </div>
        <p class="mt-2 text-2xl font-semibold tabular-nums text-ink">
          {{ data.summary.avgProgress }}%
        </p>
        <p class="mt-1 text-[11px] text-muted">Mức độ hoàn tất chung</p>
      </div>
    </div>

    <!-- Filter & Search Toolbar -->
    <div data-ui class="bg-surface p-3 sm:p-4 space-y-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <!-- Status Tabs -->
        <div class="flex gap-1 overflow-x-auto bg-ground p-1" role="tablist">
          <button
            type="button"
            class="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors"
            :class="statusFilter === 'ALL' ? 'bg-surface-2 text-ink font-semibold' : 'text-muted hover:text-ink'"
            @click="setStatus('ALL')"
          >
            Tất cả ({{ data?.summary.totalStudents ?? 0 }})
          </button>
          <button
            type="button"
            class="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors"
            :class="statusFilter === 'LEARNING' ? 'bg-surface-2 text-ink font-semibold' : 'text-muted hover:text-ink'"
            @click="setStatus('LEARNING')"
          >
            Đang học ({{ data?.summary.learningStudents ?? 0 }})
          </button>
          <button
            type="button"
            class="whitespace-nowrap px-3 py-1.5 text-xs font-medium transition-colors"
            :class="statusFilter === 'COMPLETED' ? 'bg-surface-2 text-ink font-semibold' : 'text-muted hover:text-ink'"
            @click="setStatus('COMPLETED')"
          >
            Đã hoàn thành ({{ data?.summary.completedStudents ?? 0 }})
          </button>
        </div>

        <!-- Sort Select -->
        <div class="flex items-center gap-2">
          <label for="student-sort" class="text-xs text-muted whitespace-nowrap">Sắp xếp:</label>
          <select
            id="student-sort"
            v-model="sortOption"
            class="bg-ground px-2.5 py-1.5 text-xs text-ink focus:outline-none"
            @change="onSortChange"
          >
            <option value="NEWEST">Mới đăng ký nhất</option>
            <option value="OLDEST">Đăng ký sớm nhất</option>
            <option value="PROGRESS_DESC">Tiến độ cao nhất</option>
            <option value="PROGRESS_ASC">Tiến độ thấp nhất</option>
          </select>
        </div>
      </div>

      <!-- Search Input -->
      <div class="relative">
        <Search class="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          v-model="keyword"
          type="search"
          maxlength="100"
          placeholder="Tìm theo họ tên hoặc email học viên..."
          class="manage-input pl-10 text-sm"
          @input="onSearchInput"
        />
      </div>
    </div>

    <!-- Student Table / Content -->
    <div data-ui class="bg-surface">
      <!-- Loading State -->
      <div v-if="loading" class="p-8 space-y-4">
        <div v-for="i in 5" :key="i" class="h-10 bg-ground"></div>
      </div>

      <!-- Empty State -->
      <div v-else-if="data && data.items.length === 0" class="py-14 px-4 text-center">
        <GraduationCap class="mx-auto h-8 w-8 text-muted" />
        <h3 class="mt-3 text-sm font-semibold text-ink">
          {{ keyword ? 'Không tìm thấy học viên phù hợp' : 'Chưa có học viên nào' }}
        </h3>
        <p class="mt-1 text-xs text-muted">
          {{
            keyword
              ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
              : 'Khóa học chưa có học viên nào đăng ký tham gia.'
          }}
        </p>
        <button
          v-if="keyword || statusFilter !== 'ALL'"
          type="button"
          class="mt-4 inline-flex items-center gap-1.5 bg-surface-2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-3 transition-colors"
          @click="resetFilters"
        >
          Xóa bộ lọc tìm kiếm
        </button>
      </div>

      <!-- Table View (Desktop & Tablet) -->
      <div v-else-if="data && data.items.length > 0" class="hidden overflow-x-auto md:block">
        <table class="w-full text-left text-xs">
          <thead class="bg-surface-2 font-medium text-muted">
            <tr>
              <th class="px-4 py-3 font-medium">Học viên</th>
              <th class="px-4 py-3 font-medium">Ngày đăng ký</th>
              <th class="px-4 py-3 font-medium">Tiến độ học tập</th>
              <th class="px-4 py-3 font-medium">Trạng thái</th>
              <th class="px-4 py-3 font-medium">Chứng chỉ</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in data.items"
              :key="item.enrollmentId"
              class="odd:bg-ground even:bg-surface hover:bg-surface-2 transition-colors"
            >
              <!-- Student Info -->
              <td class="px-4 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div
                    class="h-8 w-8 shrink-0 flex items-center justify-center bg-surface-3 text-[11px] font-semibold text-ink overflow-hidden"
                  >
                    <img
                      v-if="item.student.avatar"
                      :src="item.student.avatar"
                      :alt="item.student.fullName"
                      class="h-full w-full object-cover"
                    />
                    <span v-else>{{ getInitials(item.student.fullName) }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="font-medium text-ink truncate">{{ item.student.fullName }}</p>
                    <p class="text-[11px] text-muted truncate">{{ item.student.email }}</p>
                  </div>
                </div>
              </td>

              <!-- Enrolled At -->
              <td class="px-4 py-3.5 tabular-nums text-muted whitespace-nowrap">
                {{ formatDate(item.enrolledAt) }}
              </td>

              <!-- Progress Bar & % -->
              <td class="px-4 py-3.5 tabular-nums">
                <div class="w-36 space-y-1">
                  <div class="flex justify-between text-[11px]">
                    <span class="text-muted">Đã học</span>
                    <span class="font-semibold text-ink">{{ item.progressPercent }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-surface-3 overflow-hidden">
                    <div
                      class="h-full transition-[width] duration-300"
                      :class="item.progressPercent === 100 ? 'bg-emerald-400' : 'bg-brand'"
                      :style="{ width: `${item.progressPercent}%` }"
                    ></div>
                  </div>
                </div>
              </td>

              <!-- Status Badge -->
              <td class="px-4 py-3.5 whitespace-nowrap">
                <span
                  v-if="item.status === 'COMPLETED'"
                  class="inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-300"
                >
                  <CircleCheckBig class="h-3 w-3" />
                  Đã hoàn thành
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink"
                >
                  <BookOpen class="h-3 w-3 text-muted" />
                  Đang học
                </span>
              </td>

              <!-- Certificate Code -->
              <td class="px-4 py-3.5 tabular-nums whitespace-nowrap">
                <div v-if="item.certificateCode" class="flex items-center gap-1.5">
                  <span class="text-[11px] font-semibold text-emerald-300">
                    {{ item.certificateCode }}
                  </span>
                  <router-link
                    :to="{ name: 'CertificateVerifyCode', params: { code: item.certificateCode } }"
                    target="_blank"
                    class="text-muted hover:text-ink transition-colors"
                    title="Tra cứu chứng chỉ công khai"
                  >
                    <ExternalLink class="h-3.5 w-3.5" />
                  </router-link>
                </div>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List View -->
      <div v-if="data && data.items.length > 0" class="space-y-2 p-3 md:hidden">
        <article
          v-for="item in data.items"
          :key="item.enrollmentId"
          class="bg-ground p-3.5 space-y-2.5"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="h-7 w-7 shrink-0 flex items-center justify-center bg-surface-3 text-[11px] font-semibold text-ink overflow-hidden"
              >
                <img
                  v-if="item.student.avatar"
                  :src="item.student.avatar"
                  :alt="item.student.fullName"
                  class="h-full w-full object-cover"
                />
                <span v-else>{{ getInitials(item.student.fullName) }}</span>
              </div>
              <div class="min-w-0">
                <p class="font-medium text-ink truncate text-xs">{{ item.student.fullName }}</p>
                <p class="text-[11px] text-muted truncate">{{ item.student.email }}</p>
              </div>
            </div>

            <span
              v-if="item.status === 'COMPLETED'"
              class="shrink-0 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
            >
              Hoàn thành
            </span>
            <span
              v-else
              class="shrink-0 bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium text-muted"
            >
              Đang học
            </span>
          </div>

          <!-- Progress -->
          <div class="space-y-1">
            <div class="flex justify-between text-[11px] tabular-nums">
              <span class="text-muted">Tiến độ: {{ item.progressPercent }}%</span>
              <span class="text-muted">Đăng ký: {{ formatDate(item.enrolledAt) }}</span>
            </div>
            <div class="h-1.5 w-full bg-surface-3 overflow-hidden">
              <div
                class="h-full transition-[width] duration-300"
                :class="item.progressPercent === 100 ? 'bg-emerald-400' : 'bg-brand'"
                :style="{ width: `${item.progressPercent}%` }"
              ></div>
            </div>
          </div>

          <div v-if="item.certificateCode" class="flex items-center justify-between text-[11px]">
            <span class="text-muted">Mã chứng chỉ:</span>
            <router-link
              :to="{ name: 'CertificateVerifyCode', params: { code: item.certificateCode } }"
              target="_blank"
              class="font-semibold text-emerald-300 inline-flex items-center gap-1"
            >
              {{ item.certificateCode }}
              <ExternalLink class="h-3 w-3" />
            </router-link>
          </div>
        </article>
      </div>

      <!-- Pagination -->
      <div
        v-if="data && data.totalPages > 1"
        class="flex items-center justify-between bg-surface-2 px-4 py-3 text-xs text-muted"
      >
        <p class="tabular-nums">
          Trang {{ data.page }} / {{ data.totalPages }} (Tổng số {{ data.total }} học viên)
        </p>
        <div class="flex items-center gap-1.5">
          <button
            type="button"
            class="bg-surface px-2.5 py-1 text-ink disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-3 transition-colors"
            :disabled="data.page <= 1"
            @click="changePage(data.page - 1)"
          >
            Trước
          </button>
          <button
            type="button"
            class="bg-surface px-2.5 py-1 text-ink disabled:opacity-40 disabled:pointer-events-none hover:bg-surface-3 transition-colors"
            :disabled="data.page >= data.totalPages"
            @click="changePage(data.page + 1)"
          >
            Sau
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
