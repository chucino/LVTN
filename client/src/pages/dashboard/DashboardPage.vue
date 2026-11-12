<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CirclePlus,
  PlayCircle,
  Users,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';
import { manageCourseService } from '@/services/manage-courses.api';
import { usersApi } from '@/services/users.api';
import { formatCourseDuration, formatCoursePrice } from '@/lib/course-format';
import CourseStatusBadge from '@/components/manage/CourseStatusBadge.vue';
import ManageCourseThumbnail from '@/components/manage/ManageCourseThumbnail.vue';
import type { ManageCourseItem } from '@/types/manage-course';
import type { ManageUserStats } from '@/types/user';

const authStore = useAuthStore();
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');

const loading = ref(false);
const error = ref<string | null>(null);

const recentCourses = ref<ManageCourseItem[]>([]);
const courseCounts = ref({
  total: 0,
  draft: 0,
  pending: 0,
  approved: 0,
});

const userStats = ref<ManageUserStats>({
  total: 0,
  students: 0,
  instructors: 0,
  admins: 0,
  locked: 0,
});

function formatUpdatedAt(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

async function loadDashboardData() {
  loading.value = true;
  error.value = null;
  try {
    const [allRes, draftRes, pendingRes, approvedRes] = await Promise.all([
      manageCourseService.list({ page: 1, limit: 5, sort: 'updated_desc' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'DRAFT' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'PENDING' }),
      manageCourseService.list({ page: 1, limit: 1, status: 'APPROVED' }),
    ]);

    recentCourses.value = allRes.items;
    courseCounts.value = {
      total: allRes.total,
      draft: draftRes.total,
      pending: pendingRes.total,
      approved: approvedRes.total,
    };

    if (isAdmin.value) {
      const usersRes = await usersApi.listManageUsers({ page: 1, limit: 1 });
      userStats.value = usersRes.stats;
    }
  } catch (err: any) {
    error.value =
      err?.response?.data?.message ||
      err?.message ||
      'Không thể tải dữ liệu tổng quan quản trị.';
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDashboardData();
});
</script>

<template>
  <section data-ui class="space-y-8">
    <!-- Top Workspace Header -->
    <div class="bg-surface p-6 sm:p-8">
      <div class="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div>
          <p class="text-xs font-medium text-muted">
            {{ isAdmin ? 'Hệ thống Quản trị NextCode' : 'Không gian Giảng viên NextCode' }}
          </p>
          <h1 class="mt-1 font-display text-2xl font-normal tracking-tight text-ink sm:text-3xl">
            Xin chào, {{ authStore.user?.fullName }}
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-6 text-muted">
            {{
              isAdmin
                ? 'Quản lý toàn bộ khóa học nền, phân công giảng viên, phê duyệt nội dung xuất bản và quản trị tài khoản người dùng trên hệ thống.'
                : 'Theo dõi các khóa học bạn được phân công, biên soạn chương, bài giảng video và câu hỏi trắc nghiệm để gửi quản trị viên kiểm duyệt.'
            }}
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <router-link
            v-if="isAdmin"
            :to="{ name: 'ManageCourseCreate' }"
            class="manage-button-primary"
          >
            <CirclePlus class="h-4 w-4" />
            Tạo khóa học mới
          </router-link>
          <router-link
            :to="{ name: 'ManageCourses' }"
            class="manage-button-secondary"
          >
            <BookOpen class="h-4 w-4" />
            {{ isAdmin ? 'Quản lý khóa học' : 'Khóa học được phân công' }}
          </router-link>
          <router-link
            v-if="isAdmin"
            :to="{ name: 'ManageUsers' }"
            class="manage-button-secondary"
          >
            <Users class="h-4 w-4" />
            Quản lý người dùng
          </router-link>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="manage-alert-error" role="alert">
      <AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
      <span>{{ error }}</span>
      <button type="button" class="ml-auto underline" @click="loadDashboardData">
        Thử lại
      </button>
    </div>

    <!-- Course Overview KPIs -->
    <div>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">
          {{ isAdmin ? 'Thống kê khóa học toàn hệ thống' : 'Thống kê khóa học được phân công' }}
        </h2>
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Xem tất cả khóa học
          <ArrowRight class="h-3.5 w-3.5" />
        </router-link>
      </div>

      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">
            {{ isAdmin ? 'Tổng số khóa học' : 'Khóa được phân công' }}
          </span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-ink">
            {{ courseCounts.total }}
          </p>
          <p class="mt-1 text-xs text-muted">Tất cả trạng thái</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'DRAFT' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Đang biên soạn (Nháp)</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-ink">
            {{ courseCounts.draft }}
          </p>
          <p class="mt-1 text-xs text-muted">Cần hoàn thiện nội dung</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'PENDING' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Chờ phê duyệt</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-amber-300">
            {{ courseCounts.pending }}
          </p>
          <p class="mt-1 text-xs text-muted">
            {{ isAdmin ? 'Đang chờ Admin kiểm duyệt' : 'Đang chờ Admin phản hồi' }}
          </p>
        </router-link>

        <router-link
          :to="{ name: 'ManageCourses', query: { status: 'APPROVED' } }"
          class="bg-surface p-5 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Đã duyệt xuất bản</span>
          <p class="mt-2 font-display text-3xl font-normal tabular-nums text-emerald-300">
            {{ courseCounts.approved }}
          </p>
          <p class="mt-1 text-xs text-muted">Đang hiển thị công khai</p>
        </router-link>
      </div>
    </div>

    <!-- Admin-only User Overview KPIs -->
    <div v-if="isAdmin">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-ink">Thống kê người dùng & phân quyền</h2>
        <router-link
          :to="{ name: 'ManageUsers' }"
          class="inline-flex items-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Quản lý người dùng
          <ArrowRight class="h-3.5 w-3.5" />
        </router-link>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <router-link
          :to="{ name: 'ManageUsers' }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Tổng tài khoản</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.total }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'STUDENT' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Học viên (STUDENT)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.students }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'INSTRUCTOR' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Giảng viên (INSTRUCTOR)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.instructors }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { role: 'ADMIN' } }"
          class="bg-surface p-4 transition-colors hover:bg-surface-2"
        >
          <span class="text-xs font-medium text-muted">Quản trị (ADMIN)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-ink">{{ userStats.admins }}</p>
        </router-link>

        <router-link
          :to="{ name: 'ManageUsers', query: { status: 'LOCKED' } }"
          class="col-span-2 bg-surface p-4 transition-colors hover:bg-surface-2 sm:col-span-1"
        >
          <span class="text-xs font-medium text-muted">Đã khóa (LOCKED)</span>
          <p class="mt-2 font-display text-2xl font-normal tabular-nums text-brand-soft">{{ userStats.locked }}</p>
        </router-link>
      </div>
    </div>

    <!-- Recent Courses List -->
    <div class="bg-surface">
      <div class="flex items-center justify-between px-5 py-4">
        <h2 class="text-sm font-semibold text-ink">
          {{ isAdmin ? 'Khóa học cập nhật gần đây' : 'Khóa học được phân công gần đây' }}
        </h2>
        <router-link
          :to="{ name: 'ManageCourses' }"
          class="text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          Mở danh sách đầy đủ
        </router-link>
      </div>

      <div v-if="loading" class="space-y-2 p-5" aria-busy="true">
        <div v-for="n in 3" :key="n" class="h-16 bg-surface-2" />
      </div>

      <div
        v-else-if="recentCourses.length === 0"
        class="bg-ground px-5 py-12 text-center text-sm text-muted"
      >
        {{
          isAdmin
            ? 'Chưa có khóa học nào trong hệ thống. Hãy tạo khóa học nền đầu tiên.'
            : 'Bạn chưa được phân công khóa học nào.'
        }}
      </div>

      <div v-else class="space-y-1 p-2">
        <div
          v-for="course in recentCourses"
          :key="course.id"
          class="flex flex-col justify-between gap-4 bg-ground px-4 py-3.5 transition-colors hover:bg-surface-2 sm:flex-row sm:items-center"
        >
          <div class="flex min-w-0 items-center gap-3.5">
            <ManageCourseThumbnail :src="course.thumbnail" :title="course.title" />
            <div class="min-w-0">
              <router-link
                :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
                class="line-clamp-1 font-medium text-ink hover:text-brand-soft"
              >
                {{ course.title }}
              </router-link>
              <p class="mt-1 truncate text-xs tabular-nums text-muted">
                {{ course.category.name }} ·
                {{ course.type === 'FREE' ? 'Miễn phí' : formatCoursePrice(course.discountPrice ?? course.price) }}
                · {{ course.totalChapters }} chương · {{ course.totalLessons }} bài ({{ formatCourseDuration(course.totalDuration) }})
                <template v-if="isAdmin"> · GV: {{ course.instructor.fullName }}</template>
              </p>
            </div>
          </div>

          <div class="flex shrink-0 flex-wrap items-center justify-between gap-2.5 sm:justify-end">
            <CourseStatusBadge :status="course.status" />
            <span class="text-xs tabular-nums text-muted">{{ formatUpdatedAt(course.updatedAt) }}</span>
            <router-link
              v-if="course.totalLessons > 0"
              :to="{ name: 'CourseLearning', params: { courseId: course.id } }"
              class="manage-button-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs"
              title="Xem khóa học"
            >
              <PlayCircle class="h-3.5 w-3.5 text-brand-soft" />
              <span>Xem khóa học</span>
            </router-link>
            <router-link
              :to="{ name: 'ManageCourseEdit', params: { id: course.id } }"
              class="manage-button-secondary px-3 py-1.5 text-xs"
            >
              {{ isAdmin ? 'Quản lý' : 'Biên soạn' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
