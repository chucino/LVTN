<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const mobileNavOpen = ref(false);
const avatarFailed = ref(false);
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');

watch(
  () => authStore.user?.avatar,
  () => {
    avatarFailed.value = false;
  },
);

const initials = computed(() =>
  (authStore.user?.fullName ?? 'NextCode')
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
);

const links = computed(() => [
  {
    label: 'Tổng quan',
    to: { name: 'Dashboard' },
    icon: LayoutDashboard,
    active: route.name === 'Dashboard',
  },
  {
    label: isAdmin.value ? 'Tất cả khóa học' : 'Khóa học được phân công',
    to: { name: 'ManageCourses' },
    icon: BookOpen,
    active:
      (route.name === 'ManageCourses' && route.query.status !== 'PENDING') ||
      route.name === 'ManageCourseCreate' ||
      route.name === 'ManageCourseEdit' ||
      route.name === 'ManageCourseStudents',
  },
  ...(isAdmin.value
    ? [
        {
          label: 'Khóa học chờ duyệt',
          to: { name: 'ManageCourses', query: { status: 'PENDING' } },
          icon: ClipboardList,
          active: route.name === 'ManageCourses' && route.query.status === 'PENDING',
        },
        {
          label: 'Quản lý người dùng',
          to: { name: 'ManageUsers' },
          icon: Users,
          active: route.name === 'ManageUsers',
        },
      ]
    : []),
]);

async function logout() {
  mobileNavOpen.value = false;
  await authStore.logout();
  await router.push('/');
}
</script>

<template>
  <div data-ui class="manage-shell min-h-[100svh] text-ink">
    <header data-ui class="no-radius sticky top-0 z-30 border-b border-surface-3 bg-surface">
      <div class="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="bg-surface-2 p-2 text-ink lg:hidden"
            :aria-label="mobileNavOpen ? 'Đóng menu' : 'Mở menu'"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <X v-if="mobileNavOpen" class="h-4 w-4" />
            <Menu v-else class="h-4 w-4" />
          </button>
          <router-link to="/" class="flex items-center gap-2.5" aria-label="NextCode - Trang chủ">
            <img src="/logo.jpg" alt="" class="h-8 w-8 rounded-lg bg-white object-contain p-0.5" />
            <span class="text-lg font-bold tracking-tight text-ink">NextCode</span>
          </router-link>
          <span class="hidden rounded-full bg-tint px-3 py-1 text-xs font-semibold text-brand-soft sm:inline">
            {{ isAdmin ? 'Hệ thống Quản trị' : 'Không gian Giảng viên' }}
          </span>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <router-link
            :to="{ name: 'Profile' }"
            class="flex items-center gap-2.5 px-2.5 py-1.5 transition-colors hover:bg-surface-2"
            title="Mở hồ sơ cá nhân"
          >
            <div class="hidden text-right sm:block">
              <p class="max-w-48 truncate text-sm font-medium text-ink">{{ authStore.user?.fullName }}</p>
              <p class="text-xs text-muted">{{ isAdmin ? 'Quản trị viên (ADMIN)' : 'Giảng viên (INSTRUCTOR)' }}</p>
            </div>
            <img
              v-if="authStore.user?.avatar && !avatarFailed"
              :src="authStore.user.avatar"
              alt=""
              class="h-8 w-8 object-cover"
              @error="avatarFailed = true"
            />
            <span
              v-else
              class="flex h-8 w-8 items-center justify-center bg-surface-2 text-xs font-semibold text-ink"
              aria-hidden="true"
            >
              {{ initials }}
            </span>
          </router-link>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            @click="router.push('/')"
          >
            <ArrowLeft class="h-3.5 w-3.5" />
            Trang chủ
          </button>
        </div>
      </div>
    </header>

    <div class="relative z-10 mx-auto flex max-w-[1600px]">
      <aside
        data-ui class="fixed inset-y-14 left-0 z-20 no-radius flex w-60 flex-col justify-between border-r border-surface-3 bg-surface p-4 transition-transform lg:sticky lg:top-14 lg:h-[calc(100svh-3.5rem)] lg:translate-x-0"
        :class="mobileNavOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <nav class="space-y-1" aria-label="Điều hướng quản lý">
          <router-link
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors"
            :class="link.active ? 'bg-tint text-brand-soft' : 'text-muted hover:bg-surface-2 hover:text-ink'"
            @click="mobileNavOpen = false"
          >
            <component :is="link.icon" class="h-4 w-4 shrink-0" />
            {{ link.label }}
          </router-link>
        </nav>

        <div data-ui class="border-t border-surface-3 pt-3">
          <button
            type="button"
            class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-ground hover:text-ink"
            @click="logout"
          >
            <LogOut class="h-4 w-4 shrink-0" />
            Đăng xuất
          </button>
        </div>
      </aside>

      <button
        v-if="mobileNavOpen"
        type="button"
        class="fixed inset-14 z-10 bg-black/60 lg:hidden"
        aria-label="Đóng menu"
        @click="mobileNavOpen = false"
      />

      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <router-view />
      </main>
    </div>
  </div>
</template>
