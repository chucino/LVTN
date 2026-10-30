<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  LogOut,
  Menu,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const mobileNavOpen = ref(false);
const isAdmin = computed(() => authStore.user?.role === 'ADMIN');
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
    label: isAdmin.value ? 'Tất cả khóa học' : 'Khóa học của tôi',
    to: { name: 'ManageCourses' },
    icon: BookOpen,
    active: route.name === 'ManageCourses' && route.query.status !== 'PENDING',
  },
  ...(isAdmin.value
    ? [
        {
          label: 'Chờ duyệt',
          to: { name: 'ManageCourses', query: { status: 'PENDING' } },
          icon: ClipboardList,
          active: route.query.status === 'PENDING',
        },
      ]
    : []),
]);

async function logout() {
  await authStore.logout();
  await router.push('/');
}
</script>

<template>
  <div class="manage-shell min-h-screen bg-slate-950 text-slate-100">
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-40 top-20 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
      <div class="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
    </div>

    <header class="relative z-30 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="rounded-lg border border-slate-700 p-2 text-slate-200 lg:hidden"
            :aria-label="mobileNavOpen ? 'Đóng menu' : 'Mở menu'"
            @click="mobileNavOpen = !mobileNavOpen"
          >
            <X v-if="mobileNavOpen" class="h-5 w-5" />
            <Menu v-else class="h-5 w-5" />
          </button>
          <router-link to="/" class="flex items-center gap-2.5" aria-label="NextCode - Trang chủ">
            <img src="/logo.jpg" alt="" class="h-9 w-9 rounded-xl bg-white object-contain p-1" />
            <span class="text-lg font-black text-white">Next<span class="text-cyan-300">Code</span></span>
          </router-link>
          <span class="hidden border-l border-slate-700 pl-3 text-sm text-slate-400 sm:inline">
            Khu vực quản lý
          </span>
        </div>

        <div class="flex items-center gap-2 sm:gap-4">
          <div class="hidden text-right sm:block">
            <p class="max-w-48 truncate text-sm font-semibold text-white">{{ authStore.user?.fullName }}</p>
            <p class="text-xs text-slate-400">{{ isAdmin ? 'Quản trị viên' : 'Giảng viên' }}</p>
          </div>
          <img
            v-if="authStore.user?.avatar"
            :src="authStore.user.avatar"
            alt=""
            class="h-9 w-9 rounded-full object-cover"
          />
          <span
            v-else
            class="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold text-white"
            aria-hidden="true"
          >
            {{ initials }}
          </span>
          <button type="button" class="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white sm:inline-flex" @click="router.push('/')">
            <ArrowLeft class="h-4 w-4" />
            Trang chủ
          </button>
          <button
            type="button"
            class="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-300"
            aria-label="Đăng xuất"
            title="Đăng xuất"
            @click="logout"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>

    <div class="relative z-10 mx-auto flex max-w-[1600px]">
      <aside
        class="fixed inset-y-16 left-0 z-20 w-72 border-r border-slate-800 bg-slate-950/95 p-4 transition-transform lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:bg-transparent"
        :class="mobileNavOpen ? 'translate-x-0' : '-translate-x-full'"
      >
        <div class="mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/80 to-slate-900/80 p-4">
          <div class="mb-2 flex items-center gap-2 text-cyan-200">
            <CheckCircle2 class="h-4 w-4" />
            <span class="text-xs font-bold uppercase tracking-wider">NextCode Studio</span>
          </div>
          <p class="text-xs leading-5 text-slate-400">Quản lý nội dung và quy trình duyệt khóa học.</p>
        </div>

        <nav class="space-y-1" aria-label="Điều hướng quản lý">
          <router-link
            v-for="link in links"
            :key="link.label"
            :to="link.to"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
            :class="link.active ? 'bg-indigo-500/15 text-cyan-200 ring-1 ring-indigo-400/20' : 'text-slate-400 hover:bg-slate-900 hover:text-white'"
            @click="mobileNavOpen = false"
          >
            <component :is="link.icon" class="h-4 w-4" />
            {{ link.label }}
          </router-link>
        </nav>

        <router-link
          to="/"
          class="mt-8 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-slate-900 hover:text-white"
          @click="mobileNavOpen = false"
        >
          <ArrowLeft class="h-4 w-4" />
          Về trang chủ
        </router-link>
      </aside>

      <button
        v-if="mobileNavOpen"
        type="button"
        class="fixed inset-16 z-10 bg-black/50 lg:hidden"
        aria-label="Đóng menu"
        @click="mobileNavOpen = false"
      />

      <main class="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <router-view />
      </main>
    </div>
  </div>
</template>
