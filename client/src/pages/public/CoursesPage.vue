<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, type LocationQuery, type LocationQueryRaw } from 'vue-router';
import CourseCard from '@/components/course/CourseCard.vue';
import CourseCardSkeleton from '@/components/course/CourseCardSkeleton.vue';
import { getCourseErrorMessage } from '@/lib/course-format';
import { coursesApi } from '@/services/courses.api';
import {
  COURSE_LEVELS,
  COURSE_SORT_OPTIONS,
  type Category,
  type CourseLevel,
  type CourseQuery,
  type CourseSort,
  type CourseType,
  type PaginatedCourses,
} from '@/types/course';

const route = useRoute();
const router = useRouter();

const filters = reactive({
  type: '' as '' | CourseType,
  categoryId: '',
  level: '' as '' | CourseLevel,
  minPrice: '',
  maxPrice: '',
  minRating: '',
  sort: 'newest' as CourseSort,
  page: 1,
  limit: 12,
});
const keywordInput = ref('');
const mobileFiltersOpen = ref(false);
const categories = ref<Category[]>([]);
const categoriesError = ref<string | null>(null);
const results = ref<PaginatedCourses | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const filterError = ref<string | null>(null);
let activeController: AbortController | null = null;
let requestVersion = 0;
let keywordTimer: ReturnType<typeof setTimeout> | undefined;

const pageNumbers = computed(() => {
  const totalPages = results.value?.totalPages ?? 0;
  const start = Math.max(1, Math.min(filters.page - 2, totalPages - 4));
  return Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => start + index,
  );
});

function firstString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseInteger(value: string | undefined, min: number, max: number): number | undefined {
  if (!value || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max
    ? number
    : undefined;
}

function parsePrice(value: string | undefined): number | undefined {
  if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
}

function normalizeQuery(query: LocationQuery): LocationQueryRaw {
  const normalized: LocationQueryRaw = {};
  const keyword = firstString(query.keyword)?.trim();
  const type = firstString(query.type);
  const categoryId = firstString(query.categoryId);
  const level = firstString(query.level);
  const minPrice = parsePrice(firstString(query.minPrice));
  const maxPrice = parsePrice(firstString(query.maxPrice));
  const minRating = firstString(query.minRating);
  const sort = firstString(query.sort);
  const page = parseInteger(firstString(query.page), 1, Number.MAX_SAFE_INTEGER);
  const limit = parseInteger(firstString(query.limit), 1, 50);

  if (keyword) normalized.keyword = keyword;
  if (type === 'FREE' || type === 'PRO') normalized.type = type;
  if (categoryId && /^[a-f\d]{24}$/i.test(categoryId)) {
    normalized.categoryId = categoryId;
  }
  if (COURSE_LEVELS.includes(level as CourseLevel)) normalized.level = level;
  if (minPrice !== undefined) normalized.minPrice = String(minPrice);
  if (maxPrice !== undefined) normalized.maxPrice = String(maxPrice);
  if (minRating !== undefined && /^(?:\d(?:\.\d{1,2})?|5(?:\.0{1,2})?)$/.test(minRating)) {
    const rating = Number(minRating);
    if (rating >= 0 && rating <= 5) normalized.minRating = String(rating);
  }
  if (COURSE_SORT_OPTIONS.some((option) => option.value === sort)) {
    normalized.sort = sort;
  }
  if (page !== undefined && page !== 1) normalized.page = String(page);
  if (limit !== undefined && limit !== 12) normalized.limit = String(limit);
  return normalized;
}

function queriesMatch(current: LocationQuery, normalized: LocationQueryRaw): boolean {
  const currentKeys = Object.keys(current).sort();
  const normalizedKeys = Object.keys(normalized).sort();
  return (
    currentKeys.length === normalizedKeys.length &&
    currentKeys.every(
      (key, index) =>
        key === normalizedKeys[index] &&
        typeof current[key] === 'string' &&
        current[key] === normalized[key],
    )
  );
}

function queryToFilters(query: LocationQuery): void {
  const normalized = normalizeQuery(query);
  filters.type = normalized.type === 'FREE' || normalized.type === 'PRO'
    ? normalized.type
    : '';
  filters.categoryId = firstString(normalized.categoryId) ?? '';
  filters.level = COURSE_LEVELS.includes(firstString(normalized.level) as CourseLevel)
    ? (firstString(normalized.level) as CourseLevel)
    : '';
  filters.minPrice = firstString(normalized.minPrice) ?? '';
  filters.maxPrice = firstString(normalized.maxPrice) ?? '';
  filters.minRating = firstString(normalized.minRating) ?? '';
  filters.sort = COURSE_SORT_OPTIONS.some(
    (option) => option.value === normalized.sort,
  )
    ? (normalized.sort as CourseSort)
    : 'newest';
  filters.page = parseInteger(firstString(normalized.page), 1, Number.MAX_SAFE_INTEGER) ?? 1;
  filters.limit = parseInteger(firstString(normalized.limit), 1, 50) ?? 12;
  keywordInput.value = firstString(normalized.keyword) ?? '';
}

function buildQuery(): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  const keyword = keywordInput.value.trim();
  if (keyword) query.keyword = keyword;
  if (filters.type) query.type = filters.type;
  if (filters.categoryId) query.categoryId = filters.categoryId;
  if (filters.level) query.level = filters.level;
  if (filters.minPrice) query.minPrice = filters.minPrice;
  if (filters.maxPrice) query.maxPrice = filters.maxPrice;
  if (filters.minRating) query.minRating = filters.minRating;
  if (filters.sort !== 'newest') query.sort = filters.sort;
  if (filters.page > 1) query.page = String(filters.page);
  if (filters.limit !== 12) query.limit = String(filters.limit);
  return query;
}

async function applyFilters(): Promise<void> {
  filters.page = 1;
  mobileFiltersOpen.value = false;
  await router.push({ name: 'Courses', query: buildQuery() });
}

async function selectType(type: '' | CourseType): Promise<void> {
  filters.type = type;
  await applyFilters();
}

async function setPage(page: number): Promise<void> {
  filters.page = page;
  await router.push({ name: 'Courses', query: buildQuery() });
}

async function clearFilters(): Promise<void> {
  keywordInput.value = '';
  filters.type = '';
  filters.categoryId = '';
  filters.level = '';
  filters.minPrice = '';
  filters.maxPrice = '';
  filters.minRating = '';
  filters.sort = 'newest';
  filters.page = 1;
  filters.limit = 12;
  await router.push({ name: 'Courses' });
}

async function loadResults(query: LocationQuery): Promise<void> {
  const minPrice = parsePrice(firstString(query.minPrice));
  const maxPrice = parsePrice(firstString(query.maxPrice));
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
    activeController?.abort();
    requestVersion += 1;
    results.value = null;
    loading.value = false;
    error.value = null;
    filterError.value = 'Giá thấp nhất không được lớn hơn giá cao nhất.';
    return;
  }

  filterError.value = null;
  activeController?.abort();
  const controller = new AbortController();
  activeController = controller;
  const currentVersion = ++requestVersion;
  loading.value = true;
  error.value = null;

  const params: CourseQuery = {
    keyword: firstString(query.keyword),
    type: firstString(query.type) as CourseType | undefined,
    categoryId: firstString(query.categoryId),
    level: firstString(query.level) as CourseLevel | undefined,
    minPrice,
    maxPrice,
    minRating: Number(firstString(query.minRating)) || undefined,
    sort: (firstString(query.sort) as CourseSort | undefined) ?? 'newest',
    page: parseInteger(firstString(query.page), 1, Number.MAX_SAFE_INTEGER) ?? 1,
    limit: parseInteger(firstString(query.limit), 1, 50) ?? 12,
  };

  try {
    results.value = await coursesApi.getCourses(params, controller.signal);
  } catch (requestError) {
    if (currentVersion === requestVersion && !controller.signal.aborted) {
      error.value = getCourseErrorMessage(requestError);
      results.value = null;
    }
  } finally {
    if (currentVersion === requestVersion) loading.value = false;
  }
}

async function loadCategories(): Promise<void> {
  try {
    categories.value = await coursesApi.getCategories();
  } catch (requestError) {
    categoriesError.value = getCourseErrorMessage(requestError);
  }
}

watch(
  () => route.query,
  (query) => {
    const normalized = normalizeQuery(query);
    if (!queriesMatch(query, normalized)) {
      void router.replace({ name: 'Courses', query: normalized });
      return;
    }
    queryToFilters(query);
    void loadResults(query);
  },
  { immediate: true },
);

watch(keywordInput, () => {
  if (keywordTimer) clearTimeout(keywordTimer);
  keywordTimer = setTimeout(() => {
    if (keywordInput.value.trim() !== (firstString(route.query.keyword) ?? '')) {
      void applyFilters();
    }
  }, 400);
});

onMounted(() => {
  void loadCategories();
});

onBeforeUnmount(() => {
  activeController?.abort();
  if (keywordTimer) clearTimeout(keywordTimer);
});
</script>

<template>
  <div class="min-h-[70vh]">
    <section class="relative overflow-hidden border-b border-slate-800/80 bg-slate-900/35">
      <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_0%,rgba(79,70,229,0.18),transparent_44%),radial-gradient(ellipse_at_90%_50%,rgba(6,182,212,0.1),transparent_40%)]" />
      <div class="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
          Khám phá NextCode
        </p>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
          Tìm khóa học phù hợp với bạn
        </h1>
        <p class="mt-3 max-w-2xl leading-7 text-slate-400">
          Tìm kiếm theo chủ đề, trình độ và ngân sách để chọn lộ trình học lập trình tiếp theo.
        </p>
        <label class="mt-6 flex max-w-2xl items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/80 px-4 py-3 focus-within:border-indigo-400">
          <span class="sr-only">Tìm kiếm khóa học</span>
          <svg class="h-5 w-5 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke-width="1.8" />
            <path d="m20 20-4-4" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            v-model="keywordInput"
            type="search"
            placeholder="Ví dụ: JavaScript, Python..."
            class="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>
    </section>

    <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div class="mb-5 flex items-center justify-between gap-4 lg:hidden">
        <p class="text-sm text-slate-400">
          {{ results?.total ?? 0 }} khóa học
        </p>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          :aria-expanded="mobileFiltersOpen"
          aria-controls="course-filters"
          @click="mobileFiltersOpen = !mobileFiltersOpen"
        >
          {{ mobileFiltersOpen ? 'Ẩn bộ lọc' : 'Bộ lọc' }}
        </button>
      </div>

      <div class="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside
          id="course-filters"
          class="h-fit rounded-2xl border border-slate-800 bg-slate-900/60 p-5"
          :class="mobileFiltersOpen ? 'block' : 'hidden lg:block'"
          aria-label="Bộ lọc khóa học"
        >
          <div class="flex items-center justify-between">
            <h2 class="font-bold text-white">Bộ lọc</h2>
            <button
              type="button"
              class="text-xs font-semibold text-cyan-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              @click="clearFilters"
            >
              Xóa tất cả
            </button>
          </div>

          <fieldset class="mt-6">
            <legend class="text-sm font-semibold text-slate-200">Loại khóa học</legend>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                v-for="option in [{ label: 'Tất cả', value: '' }, { label: 'Free', value: 'FREE' }, { label: 'Pro', value: 'PRO' }]"
                :key="option.value || 'all'"
                type="button"
                class="rounded-lg border px-2 py-2 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                :class="filters.type === option.value ? 'border-indigo-400 bg-indigo-500/15 text-white' : 'border-slate-700 text-slate-400 hover:text-white'"
                :aria-pressed="filters.type === option.value"
                @click="selectType(option.value as '' | CourseType)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <label class="mt-6 block text-sm font-semibold text-slate-200">
            Danh mục
            <select
              v-model="filters.categoryId"
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả danh mục</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <span v-if="categoriesError" class="mt-2 block text-xs font-normal text-amber-200" role="status">
              {{ categoriesError }}
            </span>
          </label>

          <label class="mt-5 block text-sm font-semibold text-slate-200">
            Trình độ
            <select
              v-model="filters.level"
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả trình độ</option>
              <option v-for="level in COURSE_LEVELS" :key="level" :value="level">{{ level }}</option>
            </select>
          </label>

          <fieldset class="mt-5">
            <legend class="text-sm font-semibold text-slate-200">Khoảng giá (VNĐ)</legend>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="sr-only" for="min-price">Giá thấp nhất</label>
              <input
                id="min-price"
                v-model="filters.minPrice"
                type="number"
                min="0"
                placeholder="Từ"
                class="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                @change="applyFilters"
              />
              <label class="sr-only" for="max-price">Giá cao nhất</label>
              <input
                id="max-price"
                v-model="filters.maxPrice"
                type="number"
                min="0"
                placeholder="Đến"
                class="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                @change="applyFilters"
              />
            </div>
          </fieldset>

          <label class="mt-5 block text-sm font-semibold text-slate-200">
            Đánh giá tối thiểu
            <select
              v-model="filters.minRating"
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả đánh giá</option>
              <option value="4">4 sao trở lên</option>
              <option value="4.5">4.5 sao trở lên</option>
              <option value="5">5 sao</option>
            </select>
          </label>

          <label class="mt-5 block text-sm font-semibold text-slate-200">
            Sắp xếp
            <select
              v-model="filters.sort"
              class="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-indigo-400 focus:outline-none"
              @change="applyFilters"
            >
              <option v-for="option in COURSE_SORT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </aside>

        <section aria-label="Kết quả khóa học" aria-live="polite">
          <div class="mb-5 hidden items-center justify-between lg:flex">
            <p class="text-sm text-slate-400">
              <template v-if="results">
                Tìm thấy <span class="font-semibold text-white">{{ results.total }}</span> khóa học
              </template>
            </p>
            <button
              type="button"
              class="text-sm font-semibold text-cyan-300 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              @click="clearFilters"
            >
              Xóa bộ lọc
            </button>
          </div>

          <div v-if="filterError" role="alert" class="mb-5 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
            {{ filterError }}
          </div>
          <div v-else-if="error" role="alert" class="mb-5 rounded-xl border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-200">
            <p>{{ error }}</p>
            <button type="button" class="mt-3 font-semibold underline underline-offset-4" @click="loadResults(route.query)">
              Thử tải lại
            </button>
          </div>
          <div
            v-else-if="loading"
            class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Đang tải khóa học"
            aria-busy="true"
          >
            <CourseCardSkeleton v-for="index in 6" :key="index" />
          </div>
          <div
            v-else-if="results?.items.length === 0"
            class="rounded-2xl border border-slate-800 bg-slate-900/50 px-6 py-16 text-center"
          >
            <h2 class="text-lg font-bold text-white">Chưa tìm thấy khóa học phù hợp</h2>
            <p class="mt-2 text-sm text-slate-400">Hãy thử đổi từ khóa hoặc xóa bớt bộ lọc.</p>
            <button type="button" class="mt-5 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-400" @click="clearFilters">
              Xóa bộ lọc
            </button>
          </div>
          <template v-else-if="results">
            <div class="mb-4 text-sm text-slate-400 lg:hidden">
              Tìm thấy <span class="font-semibold text-white">{{ results.total }}</span> khóa học
            </div>
            <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              <CourseCard v-for="course in results.items" :key="course.id" :course="course" />
            </div>
            <nav
              v-if="results.totalPages > 1"
              class="mt-8 flex flex-wrap items-center justify-center gap-2"
              aria-label="Phân trang"
            >
              <button
                type="button"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
                :disabled="filters.page <= 1"
                @click="setPage(filters.page - 1)"
              >
                Trước
              </button>
              <button
                v-for="page in pageNumbers"
                :key="page"
                type="button"
                class="h-10 min-w-10 rounded-lg border px-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                :class="page === filters.page ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-slate-700 text-slate-300 hover:text-white'"
                :aria-current="page === filters.page ? 'page' : undefined"
                @click="setPage(page)"
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-40"
                :disabled="filters.page >= results.totalPages"
                @click="setPage(filters.page + 1)"
              >
                Sau
              </button>
            </nav>
          </template>
        </section>
      </div>
    </div>
  </div>
</template>
