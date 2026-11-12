<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Award,
  Bell,
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
import { coursesApi } from '@/services/courses.api';
import { questionsApi } from '@/services/questions.api';
import type { CourseCard } from '@/types/course';
import type { NotificationItem } from '@/types/learning';

const authStore = useAuthStore();
const router = useRouter();
const route = useRoute();
const accountDetailsRef = ref<HTMLDetailsElement | null>(null);
const desktopSearchRef = ref<HTMLElement | null>(null);
const mobileSearchRef = ref<HTMLElement | null>(null);
const isStudent = computed(() => authStore.user?.role === 'STUDENT');
const canAccessDashboard = computed(
  () => authStore.user?.role === 'INSTRUCTOR' || authStore.user?.role === 'ADMIN',
);
const avatarLoadError = ref(false);
const mobileMenuOpen = ref(false);
const searchValue = ref('');
const suggestions = ref<CourseCard[]>([]);
const loadingSuggestions = ref(false);
const showSuggestions = ref(false);
const highlightedIndex = ref(-1);

const notifications = ref<NotificationItem[]>([]);
const unreadNotificationsCount = ref(0);
const notificationDetailsRef = ref<HTMLDetailsElement | null>(null);

async function loadNotifications() {
  if (!authStore.isAuthenticated) {
    notifications.value = [];
    unreadNotificationsCount.value = 0;
    return;
  }
  try {
    const res = await questionsApi.listMyNotifications();
    notifications.value = res.items;
    unreadNotificationsCount.value = res.unreadCount;
  } catch {
    // ignore background notification fetch error
  }
}

async function handleMarkAllRead() {
  try {
    await questionsApi.markAllNotificationsRead();
    unreadNotificationsCount.value = 0;
    notifications.value = notifications.value.map((n) => ({
      ...n,
      isRead: true,
    }));
  } catch {
    // ignore
  }
}

let suggestionTimer: ReturnType<typeof setTimeout> | undefined;
let suggestionController: AbortController | null = null;

const isCourseRoute = computed(
  () => route.name === 'Courses' || route.name === 'CourseDetail',
);
const isCoursesListingPage = computed(() => route.name === 'Courses');
const trimmedKeyword = computed(() => searchValue.value.trim());

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
  () => authStore.isAuthenticated,
  (isAuth) => {
    if (isAuth) {
      void loadNotifications();
    } else {
      notifications.value = [];
      unreadNotificationsCount.value = 0;
    }
  },
  { immediate: true },
);

watch(
  () => route.fullPath,
  () => {
    if (accountDetailsRef.value) {
      accountDetailsRef.value.open = false;
    }
    if (notificationDetailsRef.value) {
      notificationDetailsRef.value.open = false;
    }
    mobileMenuOpen.value = false;
    closeSuggestions();
  },
);

watch(searchValue, (val) => {
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionController?.abort();

  const kw = val.trim();
  highlightedIndex.value = -1;

  if (!kw || isCoursesListingPage.value) {
    suggestions.value = [];
    loadingSuggestions.value = false;
    return;
  }

  loadingSuggestions.value = true;
  suggestionTimer = setTimeout(async () => {
    const controller = new AbortController();
    suggestionController = controller;
    try {
      const res = await coursesApi.getCourses(
        { keyword: kw, limit: 8, sort: 'newest' },
        controller.signal,
      );
      if (!controller.signal.aborted) {
        suggestions.value = res.items;
      }
    } catch {
      if (!controller.signal.aborted) {
        suggestions.value = [];
      }
    } finally {
      if (!controller.signal.aborted) {
        loadingSuggestions.value = false;
      }
    }
  }, 220);
});

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

function openSuggestions() {
  if (trimmedKeyword.value) {
    showSuggestions.value = true;
  }
}

function closeSuggestions() {
  showSuggestions.value = false;
  highlightedIndex.value = -1;
}

function onSearchInput() {
  showSuggestions.value = Boolean(trimmedKeyword.value);
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Node | null;
  if (!target) return;
  const inDesktop = desktopSearchRef.value?.contains(target) ?? false;
  const inMobile = mobileSearchRef.value?.contains(target) ?? false;
  if (!inDesktop && !inMobile) {
    closeSuggestions();
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentClick);
  if (suggestionTimer) clearTimeout(suggestionTimer);
  suggestionController?.abort();
});

async function logout() {
  closeDropdown();
  await authStore.logout();
  mobileMenuOpen.value = false;
  await router.push('/');
}

async function submitSearch() {
  const keyword = trimmedKeyword.value;
  closeSuggestions();
  const query =
    route.name === 'Courses'
      ? { ...route.query, keyword: keyword || undefined, page: undefined }
      : { keyword: keyword || undefined };

  await router.push({ name: 'Courses', query });
  mobileMenuOpen.value = false;
}

async function selectCourseSuggestion(course: CourseCard) {
  closeSuggestions();
  mobileMenuOpen.value = false;
  await router.push({ name: 'CourseDetail', params: { id: course.id } });
}

function onSearchKeydown(event: KeyboardEvent) {
  if (!showSuggestions.value || !trimmedKeyword.value) {
    if (event.key === 'ArrowDown' && trimmedKeyword.value) {
      showSuggestions.value = true;
    }
    return;
  }

  const maxIndex = suggestions.value.length; // 0 = "Tìm khóa học ...", 1..N = suggestions
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    highlightedIndex.value =
      highlightedIndex.value < maxIndex ? highlightedIndex.value + 1 : 0;
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    highlightedIndex.value =
      highlightedIndex.value > 0 ? highlightedIndex.value - 1 : maxIndex;
  } else if (event.key === 'Enter') {
    if (highlightedIndex.value > 0) {
      const selected = suggestions.value[highlightedIndex.value - 1];
      if (selected) {
        event.preventDefault();
        void selectCourseSuggestion(selected);
      }
    }
  } else if (event.key === 'Escape') {
    closeSuggestions();
  }
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

      <!-- Desktop Search with Autocomplete Dropdown -->
      <div
        v-if="!isCoursesListingPage"
        ref="desktopSearchRef"
        class="relative ml-auto hidden w-full max-w-[230px] xl:block xl:max-w-[270px]"
      >
        <form
          data-ui class="flex w-full items-center gap-2 rounded-full border border-surface-3 bg-surface-2 px-3.5 py-2 text-muted transition-colors focus-within:border-brand focus-within:bg-surface"
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
            autocomplete="off"
            placeholder="Tìm theo chủ đề..."
            class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            @focus="openSuggestions"
            @input="onSearchInput"
            @keydown="onSearchKeydown"
          />
        </form>

        <!-- Suggestions Dropdown -->
        <div
          v-if="showSuggestions && trimmedKeyword"
          data-ui class="absolute right-0 top-[calc(100%+6px)] z-50 w-[360px] border border-surface-3 bg-surface py-1.5"
          role="listbox"
          aria-label="Gợi ý khóa học"
        >
          <button
            type="button"
            data-ui class="flex w-full items-center gap-2.5 border-b border-surface-3 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
            :class="highlightedIndex === 0 ? 'bg-surface-2' : ''"
            @click="submitSearch"
          >
            <BookOpen class="h-4 w-4 shrink-0 text-brand-soft" />
            <span class="truncate">
              Tìm khóa học "<strong class="font-semibold text-brand-soft">{{ trimmedKeyword }}</strong>"
            </span>
          </button>

          <div v-if="loadingSuggestions && suggestions.length === 0" class="px-3.5 py-3 text-xs text-muted">
            Đang tìm khóa học phù hợp...
          </div>

          <template v-else-if="suggestions.length > 0">
            <button
              v-for="(course, idx) in suggestions"
              :key="course.id"
              type="button"
              class="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm text-ink transition-colors hover:bg-surface-2"
              :class="highlightedIndex === idx + 1 ? 'bg-surface-2' : ''"
              @click="selectCourseSuggestion(course)"
            >
              <span class="truncate">{{ course.title }}</span>
              <span
                class="shrink-0 px-2 py-0.5 text-[11px] font-medium"
                :class="course.type === 'FREE' ? 'bg-teal-tint text-teal' : 'bg-tint text-brand-soft'"
              >
                {{ course.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
              </span>
            </button>
          </template>

          <p v-else class="px-3.5 py-2.5 text-xs text-muted">
            Nhấn Enter để tìm tất cả kết quả cho "{{ trimmedKeyword }}"
          </p>
        </div>
      </div>

      <div
        v-if="!authStore.isAuthenticated"
        class="ml-auto hidden shrink-0 items-center gap-3 lg:flex"
        :class="isCoursesListingPage ? '' : 'xl:ml-0'"
      >
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

      <div
        v-else
        class="ml-auto hidden shrink-0 items-center gap-3 lg:flex"
        :class="isCoursesListingPage ? '' : 'xl:ml-0'"
      >
        <!-- Chuông Thông báo (Notification) -->
        <details ref="notificationDetailsRef" class="relative" data-ui>
          <summary
            aria-label="Mở thông báo"
            class="relative flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full bg-surface-2 text-ink transition-colors hover:bg-surface-3/60"
            @click="loadNotifications"
          >
            <Bell class="h-4 w-4" />
            <span
              v-if="unreadNotificationsCount > 0"
              class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white tabular-nums"
            >
              {{ unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount }}
            </span>
          </summary>

          <div
            data-ui class="absolute right-0 mt-2 w-80 border border-surface-3 bg-surface p-3"
          >
            <div
              data-ui class="flex items-center justify-between border-b border-surface-3 pb-2"
            >
              <span class="text-xs font-bold text-ink">Thông báo hệ thống</span>
              <button
                v-if="unreadNotificationsCount > 0"
                type="button"
                class="text-xs font-semibold text-brand-soft hover:underline"
                @click="handleMarkAllRead"
              >
                Đánh dấu đã đọc
              </button>
            </div>

            <div class="mt-2 max-h-72 space-y-2 overflow-y-auto">
              <p
                v-if="notifications.length === 0"
                class="py-6 text-center text-xs text-muted"
              >
                Chưa có thông báo mới.
              </p>

              <div
                v-for="notif in notifications"
                :key="notif.id"
                class="rounded-lg p-2.5 text-xs leading-5"
                :class="notif.isRead ? 'bg-ground text-muted' : 'bg-tint/40 text-ink'"
              >
                <p class="font-bold text-ink">{{ notif.title }}</p>
                <p class="mt-0.5 text-muted">{{ notif.message }}</p>
              </div>
            </div>
          </div>
        </details>

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
      <div
        v-if="!isCoursesListingPage"
        ref="mobileSearchRef"
        class="relative mb-4"
      >
        <form
          data-ui class="flex items-center gap-2 border border-surface-3 bg-surface-2 px-3.5 py-2.5 text-muted focus-within:border-brand focus-within:bg-surface"
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
            autocomplete="off"
            placeholder="Tìm theo chủ đề..."
            class="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            @focus="openSuggestions"
            @input="onSearchInput"
            @keydown="onSearchKeydown"
          />
        </form>

        <!-- Mobile Suggestions Dropdown -->
        <div
          v-if="showSuggestions && trimmedKeyword"
          data-ui class="mt-1 border border-surface-3 bg-surface py-1"
          role="listbox"
          aria-label="Gợi ý khóa học"
        >
          <button
            type="button"
            data-ui class="flex w-full items-center gap-2.5 border-b border-surface-3 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2"
            @click="submitSearch"
          >
            <BookOpen class="h-4 w-4 shrink-0 text-brand-soft" />
            <span class="truncate">
              Tìm khóa học "<strong class="font-semibold text-brand-soft">{{ trimmedKeyword }}</strong>"
            </span>
          </button>
          <button
            v-for="course in suggestions"
            :key="course.id"
            type="button"
            class="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-surface-2"
            @click="selectCourseSuggestion(course)"
          >
            <span class="truncate">{{ course.title }}</span>
            <span
              class="shrink-0 px-2 py-0.5 text-[11px] font-medium"
              :class="course.type === 'FREE' ? 'bg-teal-tint text-teal' : 'bg-tint text-brand-soft'"
            >
              {{ course.type === 'FREE' ? 'Miễn phí' : 'Pro' }}
            </span>
          </button>
        </div>
      </div>

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
