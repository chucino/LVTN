<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Award,
  BookOpen,
  ChevronDown,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from 'lucide-vue-next';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const accountDetailsRef = ref<HTMLDetailsElement | null>(null);
const isStudent = computed(() => authStore.user?.role === 'STUDENT');
const canAccessDashboard = computed(
  () => authStore.user?.role === 'INSTRUCTOR' || authStore.user?.role === 'ADMIN',
);
const avatarLoadError = ref(false);
const mobileMenuOpen = ref(false);
const searchValue = ref('');
const isCourseRoute = computed(
  () => route.name === 'Courses' || route.name === 'CourseDetail',
);

watch(
  () => authStore.user?.avatar,
  () => {
    avatarLoadError.value = false;
  },
);

watch(
  () => route.query.keyword,
  (keyword) => {
    searchValue.value = typeof keyword === 'string' ? keyword : '';
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    if (accountDetailsRef.value) {
      accountDetailsRef.value.open = false;
    }
    mobileMenuOpen.value = false;
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

function closeDropdown() {
  if (accountDetailsRef.value) {
    accountDetailsRef.value.open = false;
  }
}

async function logout() {
  closeDropdown();
  await authStore.logout();
  mobileMenuOpen.value = false;
  await router.push('/');
}

async function submitSearch() {
  const keyword = searchValue.value.trim();
  const query =
    route.name === 'Courses'
      ? { ...route.query, keyword: keyword || undefined, page: undefined }
      : { keyword: keyword || undefined };

  await router.push({ name: 'Courses', query });
  mobileMenuOpen.value = false;
}
</script>

<template>
  <header data-ui class="no-radius sticky top-0 z-40 border-b border-surface-3 bg-surface">
    <div class="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-6 px-[var(--margin)]">
      <router-link to="/" class="flex shrink-0 items-center gap-3" aria-label="NextCode - Trang chủ">
        <img
          src="/logo.jpg"
          alt="Logo NextCode"
          width="36"
          height="36"
          class="h-9 w-9 rounded-lg bg-white object-contain p-1"
        />
        <span class="text-xl font-bold tracking-tight text-ink">NextCode</span>
      </router-link>

      <nav
        class="hidden shrink-0 items-center gap-5 text-sm font-medium text-muted lg:flex xl:gap-6"
        aria-label="Điều hướng chính"
      >
        <router-link to="/" class="whitespace-nowrap transition-colors hover:text-ink">
          Trang chủ
        </router-link>
        <router-link
          :to="{ name: 'Courses' }"
          class="whitespace-nowrap transition-colors hover:text-ink"
          :class="isCourseRoute ? 'text-ink font-semibold' : ''"
          :aria-current="isCourseRoute ? 'page' : undefined"
        >
          Giáo trình & Khóa học
        </router-link>
        <router-link
          :to="{ name: 'CertificateVerify' }"
          class="whitespace-nowrap transition-colors hover:text-ink"
        >
          Tra cứu chứng chỉ
        </router-link>
        <a href="/#lo-trinh" class="whitespace-nowrap transition-colors hover:text-ink">Cách học</a>
        <a href="/#hoi-dap" class="whitespace-nowrap transition-colors hover:text-ink">Hỏi đáp</a>
      </nav>

      <form
        class="ml-auto hidden w-full max-w-[220px] items-center gap-2 rounded-full bg-surface-2 px-3.5 py-2 text-muted xl:flex xl:max-w-[260px]"
        role="search"
        @submit.prevent="submitSearch"
      >
        <button type="submit" class="text-muted transition-colors hover:text-ink" aria-label="Tìm kiếm">
          <Search class="h-4 w-4 shrink-0" />
        </button>
        <input
          v-model="searchValue"
          aria-label="Tìm kiếm khóa học"
          type="search"
          placeholder="Tìm theo chủ đề..."
          class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </form>

      <div v-if="!authStore.isAuthenticated" class="ml-auto hidden shrink-0 items-center gap-3 lg:flex xl:ml-0">
        <router-link
          to="/login"
          class="whitespace-nowrap px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Đăng nhập
        </router-link>
        <router-link
          to="/register"
          class="whitespace-nowrap bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          Đăng ký học
        </router-link>
      </div>

      <div v-else class="ml-auto hidden shrink-0 items-center gap-3 lg:flex xl:ml-0">
        <details ref="accountDetailsRef" class="relative" data-ui>
          <summary
            aria-label="Mở menu tài khoản"
            class="flex cursor-pointer list-none items-center gap-2.5 bg-surface px-2.5 py-1.5 text-sm text-ink transition-colors hover:bg-surface-2"
          >
            <img
              v-if="authStore.user?.avatar && !avatarLoadError"
              :src="authStore.user.avatar"
              alt=""
              width="32"
              height="32"
              class="h-8 w-8 rounded-full object-cover"
              @error="avatarLoadError = true"
            />
            <span
              v-else
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-medium text-white"
            >
              {{ initials }}
            </span>
            <span class="max-w-36 truncate">{{ authStore.user?.fullName }}</span>
            <ChevronDown class="h-4 w-4 text-muted" />
          </summary>

          <div class="absolute right-0 mt-2 w-64 bg-surface p-2" data-ui>
            <div class="bg-surface-2 px-3 py-2.5">
              <p class="truncate text-sm font-medium text-ink">{{ authStore.user?.fullName }}</p>
              <p class="truncate text-xs text-muted">{{ authStore.user?.email }}</p>
            </div>

            <div class="mt-1 space-y-0.5">
              <router-link
                :to="{ name: 'Profile' }"
                class="account-menu-item hover:bg-surface-2 hover:text-ink"
                @click="closeDropdown"
              >
                <UserRound class="h-4 w-4 text-ink" /> Hồ sơ cá nhân
              </router-link>
              <router-link
                v-if="isStudent"
                :to="{ name: 'Profile', query: { tab: 'courses' } }"
                class="account-menu-item hover:bg-surface-2 hover:text-ink"
                @click="closeDropdown"
              >
                <BookOpen class="h-4 w-4 text-ink" /> Khóa học của tôi
              </router-link>
              <router-link
                v-if="isStudent"
                :to="{ name: 'Profile', query: { tab: 'certificates' } }"
                class="account-menu-item hover:bg-surface-2 hover:text-ink"
                @click="closeDropdown"
              >
                <Award class="h-4 w-4 text-teal" /> Chứng chỉ của tôi
              </router-link>
              <router-link
                :to="{ name: 'Profile', query: { tab: 'security' } }"
                class="account-menu-item hover:bg-surface-2 hover:text-ink"
                @click="closeDropdown"
              >
                <KeyRound class="h-4 w-4 text-muted" /> Đổi mật khẩu & Bảo mật
              </router-link>

              <router-link
                v-if="canAccessDashboard"
                :to="{ name: 'Dashboard' }"
                class="account-menu-item bg-surface-2 text-ink hover:bg-brand hover:text-white"
                @click="closeDropdown"
              >
                <LayoutDashboard class="h-4 w-4" />
                Trang quản trị
              </router-link>

              <button
                type="button"
                class="account-menu-item text-brand-soft hover:bg-brand-surface"
                @click="logout"
              >
                <LogOut class="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          </div>
        </details>
      </div>

      <button
        type="button"
        class="ml-auto flex items-center gap-2 bg-surface p-2.5 text-ink lg:hidden"
        :aria-label="mobileMenuOpen ? 'Đóng menu' : 'Mở menu'"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <X v-if="mobileMenuOpen" class="h-5 w-5" />
        <Menu v-else class="h-5 w-5" />
      </button>
    </div>

    <div v-if="mobileMenuOpen" class="bg-surface px-[var(--margin)] pb-6 pt-4 lg:hidden">
      <form
        class="mb-4 flex items-center gap-2 bg-surface-2 px-3.5 py-2.5 text-muted"
        role="search"
        @submit.prevent="submitSearch"
      >
        <button type="submit" aria-label="Tìm kiếm">
          <Search class="h-4 w-4" />
        </button>
        <input
          v-model="searchValue"
          aria-label="Tìm kiếm khóa học"
          type="search"
          placeholder="Tìm theo chủ đề..."
          class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </form>
      <nav class="flex flex-col gap-1 text-base text-ink" aria-label="Điều hướng di động">
        <router-link to="/" class="mobile-nav-link" @click="mobileMenuOpen = false">Trang chủ</router-link>
        <router-link
          :to="{ name: 'Courses' }"
          class="mobile-nav-link"
          @click="mobileMenuOpen = false"
        >
          Giáo trình & Khóa học
        </router-link>
        <router-link
          :to="{ name: 'CertificateVerify' }"
          class="mobile-nav-link"
          @click="mobileMenuOpen = false"
        >
          Tra cứu chứng chỉ
        </router-link>
        <a href="/#lo-trinh" class="mobile-nav-link" @click="mobileMenuOpen = false">Cách học</a>
        <a href="/#hoi-dap" class="mobile-nav-link" @click="mobileMenuOpen = false">Hỏi đáp</a>
      </nav>

      <div v-if="!authStore.isAuthenticated" class="mt-4 grid grid-cols-2 gap-2">
        <router-link to="/login" class="bg-surface-2 py-2.5 text-center text-sm font-medium text-ink" @click="mobileMenuOpen = false">
          Đăng nhập
        </router-link>
        <router-link
          to="/register"
          class="bg-brand py-2.5 text-center text-sm font-medium text-white"
          @click="mobileMenuOpen = false"
        >
          Đăng ký học
        </router-link>
      </div>

      <div v-else class="mt-4 space-y-1 bg-surface-2 p-3">
        <p class="px-3 py-1.5 text-sm font-medium text-ink">{{ authStore.user?.fullName }}</p>
        <router-link
          :to="{ name: 'Profile' }"
          class="mobile-nav-link flex items-center gap-2 text-ink"
          @click="mobileMenuOpen = false"
        >
          <UserRound class="h-4 w-4" /> Hồ sơ cá nhân
        </router-link>
        <router-link
          v-if="isStudent"
          :to="{ name: 'Profile', query: { tab: 'courses' } }"
          class="mobile-nav-link flex items-center gap-2 text-ink"
          @click="mobileMenuOpen = false"
        >
          <BookOpen class="h-4 w-4" /> Khóa học của tôi
        </router-link>
        <router-link
          v-if="isStudent"
          :to="{ name: 'Profile', query: { tab: 'certificates' } }"
          class="mobile-nav-link flex items-center gap-2 text-ink"
          @click="mobileMenuOpen = false"
        >
          <Award class="h-4 w-4" /> Chứng chỉ của tôi
        </router-link>
        <router-link
          :to="{ name: 'Profile', query: { tab: 'security' } }"
          class="mobile-nav-link flex items-center gap-2 text-ink"
          @click="mobileMenuOpen = false"
        >
          <KeyRound class="h-4 w-4" /> Đổi mật khẩu & Bảo mật
        </router-link>
        <router-link
          v-if="canAccessDashboard"
          :to="{ name: 'Dashboard' }"
          class="mobile-nav-link flex items-center gap-2 bg-brand text-white"
          @click="mobileMenuOpen = false"
        >
          <LayoutDashboard class="h-4 w-4" />
          Trang quản trị
        </router-link>
        <button type="button" class="mobile-nav-link w-full text-left text-brand-soft" @click="logout">
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
  padding: 0.625rem 0.75rem;
  text-align: left;
  font-size: 0.9375rem;
  color: var(--ink);
  transition: background-color 150ms, color 150ms;
}

.mobile-nav-link {
  padding: 0.625rem 0.75rem;
  transition: background-color 150ms, color 150ms;
}

.mobile-nav-link:hover {
  background: var(--surface-3);
}
</style>
