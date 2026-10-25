<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  Bell,
  BookOpen,
  ChevronDown,
  Code2,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const mobileMenuOpen = ref(false);

const initials = computed(() =>
  (authStore.user?.fullName ?? 'NextCode')
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join('')
    .toUpperCase(),
);

async function logout() {
  await authStore.logout();
  mobileMenuOpen.value = false;
  await router.push('/');
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-xl">
    <div class="mx-auto flex min-h-[76px] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
      <router-link to="/" class="flex shrink-0 items-center gap-2.5" aria-label="NextCode - Trang chủ">
        <span
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white shadow-lg shadow-indigo-900/40"
        >
          <Code2 class="h-6 w-6" />
        </span>
        <span class="text-xl font-black tracking-tight text-white">Next<span class="text-cyan-300">Code</span></span>
      </router-link>

      <nav class="hidden items-center gap-7 text-sm font-medium text-slate-300 lg:flex">
        <router-link to="/" class="transition hover:text-white">Trang chủ</router-link>
        <a href="/#courses" class="transition hover:text-white">Khóa học</a>
        <a href="/#about" class="transition hover:text-white">Giới thiệu</a>
      </nav>

      <label class="ml-auto hidden w-full max-w-xs items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2.5 text-slate-500 xl:flex">
        <Search class="h-4 w-4 shrink-0" />
        <input
          aria-label="Tìm kiếm khóa học"
          type="search"
          placeholder="Tìm khóa học..."
          class="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
        />
        <kbd class="rounded border border-slate-700 px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
      </label>

      <div v-if="!authStore.isAuthenticated" class="hidden shrink-0 items-center gap-3 lg:flex">
        <router-link
          to="/login"
          class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white"
        >
          Đăng nhập
        </router-link>
        <router-link
          to="/register"
          class="rounded-lg bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-950/50 transition hover:brightness-110"
        >
          Đăng ký
        </router-link>
      </div>

      <div v-else class="hidden shrink-0 items-center gap-3 lg:flex">
        <button
          type="button"
          disabled
          title="Khu vực khóa học của bạn sẽ được bổ sung sau"
          class="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 opacity-75"
        >
          <BookOpen class="h-4 w-4" />
          Khóa học của tôi
        </button>
        <button
          type="button"
          disabled
          aria-label="Thông báo"
          title="Thông báo sẽ được bổ sung sau"
          class="rounded-lg p-2 text-slate-300 opacity-75"
        >
          <Bell class="h-5 w-5" />
        </button>
        <details class="relative">
          <summary
            aria-label="Mở menu tài khoản"
            class="flex cursor-pointer list-none items-center gap-2 rounded-full border border-slate-700 bg-slate-900 p-1 pr-2 text-sm text-white"
          >
            <img
              v-if="authStore.user?.avatar"
              :src="authStore.user.avatar"
              alt=""
              class="h-8 w-8 rounded-full object-cover"
            />
            <span
              v-else
              class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-xs font-bold"
            >
              {{ initials }}
            </span>
            <ChevronDown class="h-4 w-4 text-slate-400" />
          </summary>
          <div class="absolute right-0 mt-3 w-60 rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl shadow-black/50">
            <div class="border-b border-slate-800 px-3 py-2">
              <p class="truncate text-sm font-semibold text-white">{{ authStore.user?.fullName }}</p>
              <p class="truncate text-xs text-slate-400">{{ authStore.user?.email }}</p>
            </div>
            <button type="button" disabled class="account-menu-item">
              <UserRound class="h-4 w-4" /> Hồ sơ
            </button>
            <button type="button" disabled class="account-menu-item">Chứng chỉ</button>
            <button type="button" disabled class="account-menu-item">Cài đặt</button>
            <button type="button" class="account-menu-item text-rose-300 hover:bg-rose-500/10" @click="logout">
              <LogOut class="h-4 w-4" /> Đăng xuất
            </button>
          </div>
        </details>
      </div>

      <button
        type="button"
        class="ml-auto flex items-center gap-2 rounded-lg border border-slate-800 p-2 text-slate-200 lg:hidden"
        :aria-label="mobileMenuOpen ? 'Đóng menu' : 'Mở menu'"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <img
          v-if="authStore.isAuthenticated && authStore.user?.avatar"
          :src="authStore.user.avatar"
          alt=""
          class="h-7 w-7 rounded-full object-cover"
        />
        <span
          v-else-if="authStore.isAuthenticated"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 text-[10px] font-bold"
        >
          {{ initials }}
        </span>
        <X v-if="mobileMenuOpen" class="h-5 w-5" />
        <Menu v-else class="h-5 w-5" />
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="border-t border-slate-800 bg-slate-950 px-4 pb-5 pt-4 lg:hidden">
      <label class="mb-4 flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 text-slate-500">
        <Search class="h-4 w-4" />
        <input
          aria-label="Tìm kiếm khóa học"
          type="search"
          placeholder="Tìm khóa học..."
          class="min-w-0 flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-500"
        />
      </label>
      <nav class="flex flex-col gap-1 text-sm font-medium text-slate-300">
        <router-link to="/" class="mobile-nav-link" @click="mobileMenuOpen = false">Trang chủ</router-link>
        <a href="/#courses" class="mobile-nav-link" @click="mobileMenuOpen = false">Khóa học</a>
        <a href="/#about" class="mobile-nav-link" @click="mobileMenuOpen = false">Giới thiệu</a>
      </nav>
      <div v-if="!authStore.isAuthenticated" class="mt-4 flex gap-3">
        <router-link to="/login" class="mobile-auth-button" @click="mobileMenuOpen = false">Đăng nhập</router-link>
        <router-link
          to="/register"
          class="mobile-auth-button border-indigo-500/50 bg-indigo-500/15 text-indigo-200"
          @click="mobileMenuOpen = false"
        >
          Đăng ký
        </router-link>
      </div>
      <div v-else class="mt-4 space-y-1 border-t border-slate-800 pt-3">
        <p class="px-3 py-2 text-xs text-slate-400">{{ authStore.user?.fullName }}</p>
        <button type="button" disabled class="mobile-nav-link w-full text-left opacity-60">Khóa học của tôi</button>
        <button
          type="button"
          disabled
          aria-label="Thông báo"
          class="mobile-nav-link flex w-full items-center gap-2 text-left opacity-60"
        >
          <Bell class="h-4 w-4" /> Thông báo
        </button>
        <button type="button" disabled class="mobile-nav-link w-full text-left opacity-60">Hồ sơ</button>
        <button type="button" disabled class="mobile-nav-link w-full text-left opacity-60">Chứng chỉ</button>
        <button type="button" disabled class="mobile-nav-link w-full text-left opacity-60">Cài đặt</button>
        <button type="button" class="mobile-nav-link w-full text-left text-rose-300" @click="logout">
          Đăng xuất
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.account-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.875rem;
  color: #cbd5e1;
}

.account-menu-item:disabled {
  opacity: 0.55;
}

.mobile-nav-link {
  border-radius: 0.5rem;
  padding: 0.625rem 0.75rem;
}

.mobile-nav-link:hover,
.mobile-auth-button:hover {
  background: rgb(30 41 59 / 0.65);
  color: white;
}

.mobile-auth-button {
  flex: 1;
  border: 1px solid rgb(71 85 105 / 0.7);
  border-radius: 0.625rem;
  padding: 0.625rem;
  text-align: center;
  font-size: 0.875rem;
  font-weight: 600;
}
</style>
