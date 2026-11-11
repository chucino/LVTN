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
  if (filters.limit !== 12) query.limit = String(limitValue());
  return query;
}

function limitValue(): number {
  return filters.limit;
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
  <div data-ui class="min-h-[70svh]">
    <section data-ui class="bg-surface border-b border-surface-3 py-10 no-radius sm:py-14">
      <div class="mx-auto max-w-[1440px] px-[var(--margin)]">
        <span data-ui class="inline-flex items-center border border-surface-3 bg-ground px-2.5 py-1 text-xs font-semibold text-brand-soft">
          Danh mục &amp; Tìm kiếm
        </span>
        <h1 class="mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
          Tất cả khóa học
        </h1>
        <p class="mt-2 max-w-2xl text-base text-muted">
          Tìm khóa học theo chủ đề, trình độ và hình thức học để chọn lộ trình phù hợp với bạn.
        </p>

        <form
          data-ui class="mt-6 flex max-w-2xl items-center gap-3 rounded-xl border border-surface-3 bg-ground px-4 py-2.5 transition-colors focus-within:border-brand focus-within:bg-surface"
          role="search"
          @submit.prevent="applyFilters"
        >
          <span class="sr-only">Tìm kiếm khóa học</span>
          <svg class="h-5 w-5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <circle cx="11" cy="11" r="7" stroke-width="1.8" />
            <path d="m20 20-4-4" stroke-width="1.8" stroke-linecap="round" />
          </svg>
          <input
            v-model="keywordInput"
            type="search"
            placeholder="Tìm theo tên khóa học, ngôn ngữ lập trình..."
            class="min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted"
          />
          <button
            v-if="keywordInput"
            type="button"
            class="px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-ink"
            aria-label="Xóa từ khóa tìm kiếm"
            @click="keywordInput = ''; void applyFilters()"
          >
            Xóa
          </button>
          <button
            type="submit"
            class="shrink-0 bg-brand px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Tìm kiếm
          </button>
        </form>
      </div>
    </section>

    <div class="mx-auto max-w-[1440px] px-[var(--margin)] py-12 sm:py-16">
      <div class="mb-6 flex items-center justify-between gap-4 lg:hidden">
        <p class="text-sm text-muted">
          {{ results?.total ?? 0 }} khóa học
        </p>
        <button
          type="button"
          data-ui class="border border-surface-3 bg-surface px-4 py-2.5 text-sm font-medium text-ink"
          :aria-expanded="mobileFiltersOpen"
          aria-controls="course-filters"
          @click="mobileFiltersOpen = !mobileFiltersOpen"
        >
          {{ mobileFiltersOpen ? 'Ẩn bộ lọc' : 'Bộ lọc tìm kiếm' }}
        </button>
      </div>

      <div class="grid items-start gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside
          id="course-filters"
          data-ui class="h-fit border border-surface-3 bg-surface p-6 lg:sticky lg:top-24 lg:max-h-[calc(100svh-7rem)] lg:overflow-y-auto"
          :class="mobileFiltersOpen ? 'block' : 'hidden lg:block'"
          aria-label="Bộ lọc khóa học"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-normal text-ink">Bộ lọc</h2>
            <button
              type="button"
              class="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink"
              @click="clearFilters"
            >
              Đặt lại
            </button>
          </div>

          <fieldset class="mt-6">
            <legend class="text-sm font-medium text-ink">Hình thức</legend>
            <div class="mt-3 grid grid-cols-3 gap-2">
              <button
                v-for="option in [{ label: 'Tất cả', value: '' }, { label: 'Free', value: 'FREE' }, { label: 'Pro', value: 'PRO' }]"
                :key="option.value || 'all'"
                type="button"
                class="px-2 py-2 text-sm font-medium transition-colors"
                :class="filters.type === option.value ? 'bg-brand text-white' : 'bg-surface-2 text-muted hover:text-ink'"
                :aria-pressed="filters.type === option.value"
                @click="selectType(option.value as '' | CourseType)"
              >
                {{ option.label }}
              </button>
            </div>
          </fieldset>

          <label class="mt-6 block text-sm font-medium text-ink">
            Danh mục
            <select
              v-model="filters.categoryId"
              class="mt-2 w-full bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả danh mục</option>
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
            <span v-if="categoriesError" class="mt-2 block text-xs font-normal text-brand-soft" role="status">
              {{ categoriesError }}
            </span>
          </label>

          <label class="mt-5 block text-sm font-medium text-ink">
            Trình độ
            <select
              v-model="filters.level"
              class="mt-2 w-full bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả trình độ</option>
              <option v-for="level in COURSE_LEVELS" :key="level" :value="level">{{ level }}</option>
            </select>
          </label>

          <fieldset class="mt-5">
            <legend class="text-sm font-medium text-ink">Khoảng học phí (VNĐ)</legend>
            <div class="mt-2 grid grid-cols-2 gap-2">
              <label class="sr-only" for="min-price">Giá thấp nhất</label>
              <input
                id="min-price"
                v-model="filters.minPrice"
                type="number"
                min="0"
                placeholder="Từ"
                class="min-w-0 bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none"
                @change="applyFilters"
              />
              <label class="sr-only" for="max-price">Giá cao nhất</label>
              <input
                id="max-price"
                v-model="filters.maxPrice"
                type="number"
                min="0"
                placeholder="Đến"
                class="min-w-0 bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted outline-none"
                @change="applyFilters"
              />
            </div>
          </fieldset>

          <label class="mt-5 block text-sm font-medium text-ink">
            Đánh giá tối thiểu
            <select
              v-model="filters.minRating"
              class="mt-2 w-full bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none"
              @change="applyFilters"
            >
              <option value="">Tất cả đánh giá</option>
              <option value="4">4 sao trở lên</option>
              <option value="4.5">4.5 sao trở lên</option>
              <option value="5">5 sao</option>
            </select>
          </label>

          <label class="mt-5 block text-sm font-medium text-ink">
            Sắp xếp
            <select
              v-model="filters.sort"
              class="mt-2 w-full bg-surface-2 px-3 py-2.5 text-sm text-ink outline-none"
              @change="applyFilters"
            >
              <option v-for="option in COURSE_SORT_OPTIONS" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
        </aside>

        <section aria-label="Kết quả khóa học" aria-live="polite">
          <div class="mb-6 hidden items-center lg:flex">
            <p class="text-base text-muted">
              <template v-if="results">
                Tìm thấy <span class="font-medium text-ink">{{ results.total }}</span> giáo trình
              </template>
            </p>
          </div>

          <div v-if="filterError" role="alert" class="mb-6 bg-brand-surface p-4 text-sm text-ink">
            {{ filterError }}
          </div>
          <div v-else-if="error" role="alert" class="mb-6 bg-brand-surface p-6 text-base text-ink">
            <p>{{ error }}</p>
            <button type="button" class="mt-3 font-medium underline underline-offset-4" @click="loadResults(route.query)">
              Thử tải lại
            </button>
          </div>
          <div
            v-else-if="loading"
            class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3"
            aria-label="Đang tải khóa học"
            aria-busy="true"
          >
            <CourseCardSkeleton v-for="index in 6" :key="index" />
          </div>
          <div
            v-else-if="results?.items.length === 0"
            data-ui class="border border-surface-3 bg-surface px-8 py-16"
          >
            <h2 class="text-2xl font-normal text-ink">Chưa tìm thấy giáo trình phù hợp</h2>
            <p class="mt-2 text-base text-muted">Hãy thử đổi từ khóa hoặc đặt lại bộ lọc tìm kiếm.</p>
            <button type="button" class="mt-6 bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-hover" @click="clearFilters">
              Đặt lại bộ lọc
            </button>
          </div>
          <template v-else-if="results">
            <div class="mb-4 text-sm text-muted lg:hidden">
              Tìm thấy <span class="font-medium text-ink">{{ results.total }}</span> giáo trình
            </div>
            <div class="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <CourseCard v-for="course in results.items" :key="course.id" :course="course" />
            </div>
            <nav
              v-if="results.totalPages > 1"
              class="mt-10 flex flex-wrap items-center justify-center gap-2"
              aria-label="Phân trang"
            >
              <button
                type="button"
                class="bg-surface px-4 py-2.5 text-sm text-ink disabled:opacity-40"
                :disabled="filters.page <= 1"
                @click="setPage(filters.page - 1)"
              >
                Trước
              </button>
              <button
                v-for="page in pageNumbers"
                :key="page"
                type="button"
                class="h-10 min-w-10 px-3 text-sm font-medium transition-colors"
                :class="page === filters.page ? 'bg-brand text-white' : 'bg-surface text-muted hover:text-ink'"
                :aria-current="page === filters.page ? 'page' : undefined"
                @click="setPage(page)"
              >
                {{ page }}
              </button>
              <button
                type="button"
                class="bg-surface px-4 py-2.5 text-sm text-ink disabled:opacity-40"
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
