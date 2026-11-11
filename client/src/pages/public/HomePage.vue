<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ArrowRight, BarChart3, CheckCircle2, ListChecks, PlayCircle } from 'lucide-vue-next';
import CourseSection from '@/components/course/CourseSection.vue';
import HeroCodeWindow from '@/components/illustrations/HeroCodeWindow.vue';
import LanguageBadges from '@/components/illustrations/LanguageBadges.vue';
import {
  formatCourseDuration,
  getCourseErrorMessage,
} from '@/lib/course-format';
import { coursesApi } from '@/services/courses.api';
import { useAuthStore } from '@/stores/auth.store';
import type { Category, CourseCard as CourseCardType, CourseType } from '@/types/course';

const authStore = useAuthStore();

interface CourseCollectionState {
  courses: CourseCardType[];
  loading: boolean;
  error: string | null;
}

const featured = reactive<CourseCollectionState>({
  courses: [],
  loading: true,
  error: null,
});
const free = reactive<CourseCollectionState>({
  courses: [],
  loading: true,
  error: null,
});
const pro = reactive<CourseCollectionState>({
  courses: [],
  loading: true,
  error: null,
});
const categories = ref<Category[]>([]);

async function loadCollection(
  state: CourseCollectionState,
  type?: CourseType,
): Promise<void> {
  state.loading = true;
  state.error = null;
  try {
    state.courses = type
      ? (await coursesApi.getCourses({ type, page: 1, limit: 3 })).items
      : await coursesApi.getFeaturedCourses(3);
  } catch (error) {
    state.error = getCourseErrorMessage(error);
  } finally {
    state.loading = false;
  }
}

// Bộ tính nhịp học dựa trên thời lượng khóa học thật từ API
const fallbackCourses: Array<{
  id: string;
  title: string;
  level: string;
  type: CourseType;
  totalLessons: number;
  totalDuration: number;
}> = [
  {
    id: '',
    title: 'Nền tảng JavaScript & Tư duy bất đồng bộ',
    level: 'Cơ bản',
    type: 'FREE',
    totalLessons: 24,
    totalDuration: 32400, // 9 giờ
  },
  {
    id: '',
    title: 'Kiến trúc Backend với NestJS, TypeScript & MongoDB',
    level: 'Trung cấp',
    type: 'PRO',
    totalLessons: 42,
    totalDuration: 64800, // 18 giờ
  },
  {
    id: '',
    title: 'Phát triển Giao diện Web với Vue 3 & Pinia',
    level: 'Nâng cao',
    type: 'PRO',
    totalLessons: 36,
    totalDuration: 50400, // 14 giờ
  },
];

const plannerCourses = computed(() => {
  const map = new Map<string, CourseCardType>();
  for (const c of [...featured.courses, ...free.courses, ...pro.courses]) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  const realList = Array.from(map.values()).slice(0, 5);
  if (realList.length > 0) {
    return realList.map((c) => ({
      id: c.id,
      title: c.title,
      level: c.level,
      type: c.type,
      totalLessons: Math.max(1, c.totalLessons),
      totalDuration: c.totalDuration > 0 ? c.totalDuration : Math.max(1, c.totalLessons) * 900,
    }));
  }
  return fallbackCourses;
});

const selectedCourseIndex = ref(0);
const hoursPerWeek = ref(6);
const hourPresets = [3, 5, 6, 8, 10, 14];

const activePlannerCourse = computed(() => {
  const list = plannerCourses.value;
  return list[selectedCourseIndex.value] ?? list[0] ?? fallbackCourses[0]!;
});

const plannerSummary = computed(() => {
  const course = activePlannerCourse.value;
  // Tính cả thời gian xem video và thời gian tự gõ lại code / làm trắc nghiệm (nhân hệ số 2)
  const videoHours = Math.max(0.5, course.totalDuration / 3600);
  const practiceHours = videoHours * 2;
  const weeks = Math.max(1, Math.ceil(practiceHours / hoursPerWeek.value));
  const lessonsPerWeek = Math.max(1, Math.ceil(course.totalLessons / weeks));
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeks * 7);
  const formattedDate = targetDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return {
    videoDurationLabel: formatCourseDuration(course.totalDuration),
    practiceHours: Math.round(practiceHours),
    weeks,
    lessonsPerWeek,
    formattedDate,
  };
});

const steps = [
  {
    icon: PlayCircle,
    badge: 'Video theo chương',
    title: 'Xem bài giảng video',
    text: 'Mỗi chương chia thành các bài ngắn. Dừng, tua lại và học tiếp bất cứ lúc nào.',
    tags: ['Phát tự động', 'Lưu vị trí xem'],
  },
  {
    icon: ListChecks,
    badge: 'Kiểm tra hiểu bài',
    title: 'Làm trắc nghiệm sau bài',
    text: 'Câu hỏi kèm giải thích đáp án giúp bạn kiểm tra mình đã hiểu bài hay chưa.',
    tags: ['Mở khóa tuần tự', 'Giải thích chi tiết'],
  },
  {
    icon: BarChart3,
    badge: 'Hồ sơ học tập',
    title: 'Theo dõi tiến độ',
    text: 'Hồ sơ cá nhân lưu lại các khóa đã đăng ký, tiến độ từng chương và cấp chứng chỉ khi hoàn tất.',
    tags: ['Thống kê %', 'Chứng chỉ xác thực'],
  },
];

const faqs = [
  {
    q: 'Khóa học Free và khóa học Pro khác nhau như thế nào?',
    a: 'Khóa Free miễn phí hoàn toàn, tập trung vào kiến thức nền tảng với video YouTube nhúng hoặc video tải lên máy chủ. Khóa Pro đi sâu vào dự án thực tế, video lưu trên máy chủ NextCode kèm ghi chép, tóm tắt và câu hỏi kiểm tra từng bài.',
  },
  {
    q: 'Thời lượng bài học và tiến độ được ghi nhận ra sao?',
    a: 'Mỗi bài giảng video được trích xuất thời lượng thực tế tự động khi đăng tải. Bạn có thể tạm dừng, xem lại bất kỳ đoạn nào và tiếp tục học trên mọi thiết bị.',
  },
  {
    q: 'Làm sao để giảng viên xuất bản một khóa học lên NextCode?',
    a: 'Quản trị viên tạo khung khóa học và phân công giảng viên phụ trách. Giảng viên biên soạn chương, tải video, thiết lập câu hỏi trắc nghiệm rồi gửi duyệt trước khi khóa học hiển thị công khai.',
  },
  {
    q: 'Thông tin trên chứng chỉ hoàn thành khóa học lấy từ đâu?',
    a: 'Họ và tên in trên chứng chỉ được lấy từ trang Hồ sơ cá nhân của bạn. Bạn có thể cập nhật họ tên, ngày sinh và ảnh đại diện bất cứ lúc nào.',
  },
];

onMounted(() => {
  void loadCollection(featured);
  void loadCollection(free, 'FREE');
  void loadCollection(pro, 'PRO');
  coursesApi
    .getCategories()
    .then((list) => {
      categories.value = list;
    })
    .catch(() => {
      categories.value = [];
    });
});
</script>

<template>
  <!-- 1. HERO (Nền Trắng - bg-surface) -->
  <section data-ui class="no-radius overflow-hidden border-b border-surface-3 bg-surface">
    <div class="mx-auto grid max-w-[1440px] items-center gap-12 px-[var(--margin)] py-14 lg:grid-cols-2 lg:py-20">
      <div class="enter-rise min-w-0">
        <p class="inline-flex items-center gap-2 border border-surface-3 bg-tint px-3.5 py-1.5 text-sm font-semibold text-brand-soft">
          <span class="h-2 w-2 rounded-full bg-brand" />
          Học lập trình có lộ trình
        </p>
        <h1 class="mt-5 text-3xl font-extrabold leading-[1.15] tracking-tight text-ink sm:text-5xl">
          Học lập trình bài bản cùng NextCode.
        </h1>
        <p class="mt-5 max-w-xl text-lg leading-relaxed text-muted">
          Từ kiến thức nền tảng đến dự án thực tế: bài giảng video chia theo chương, trắc nghiệm sau mỗi bài và theo dõi tiến độ ngay trong hồ sơ của bạn.
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <router-link
            :to="{ name: 'Courses' }"
            class="inline-flex items-center gap-2 bg-brand px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-brand-hover"
          >
            Khám phá khóa học
            <ArrowRight class="h-4 w-4" />
          </router-link>
          <router-link
            :to="{ name: 'Courses', query: { type: 'FREE' } }"
            class="inline-flex items-center gap-2 border border-surface-3 bg-surface-2 px-6 py-3.5 text-base font-semibold text-ink transition-colors hover:bg-surface-3"
          >
            Học thử miễn phí
          </router-link>
        </div>
        <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <li class="inline-flex items-center gap-2"><CheckCircle2 class="h-4 w-4 text-teal" /> Khóa Free không mất phí</li>
          <li class="inline-flex items-center gap-2"><CheckCircle2 class="h-4 w-4 text-teal" /> Trắc nghiệm kèm giải thích</li>
          <li class="inline-flex items-center gap-2"><CheckCircle2 class="h-4 w-4 text-teal" /> Học trên mọi thiết bị</li>
        </ul>
      </div>

      <div class="enter-rise-1 min-w-0 pb-6 sm:px-4">
        <HeroCodeWindow />
      </div>
    </div>
  </section>

  <!-- 2. CÔNG NGHỆ & LĨNH VỰC (Nền Xám nhạt - bg-ground) -->
  <section data-ui class="no-radius border-b border-surface-3 bg-ground py-14 lg:py-16">
    <div class="mx-auto max-w-[1440px] space-y-10 px-[var(--margin)]">
      <div class="border border-surface-3 bg-surface p-6 sm:p-8">
        <p class="mb-4 text-xs font-bold text-muted">Công nghệ trọng tâm bạn sẽ thực hành</p>
        <LanguageBadges />
      </div>

      <div v-if="categories.length">
        <span class="mb-3 inline-flex items-center border border-surface-3 bg-surface px-3 py-1 text-xs font-semibold text-brand-soft">
          Lĩnh vực đào tạo
        </span>
        <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Chọn lĩnh vực bạn quan tâm</h2>
        <p class="mt-1.5 text-sm text-muted">Khám phá lộ trình bài giảng được phân nhóm rõ ràng theo từng mảng chuyên môn.</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <router-link
            v-for="category in categories"
            :key="category.id"
            :to="{ name: 'Courses', query: { categoryId: category.id } }"
            class="inline-flex items-center gap-2 border border-surface-3 bg-surface px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-brand hover:bg-tint hover:text-brand-soft"
          >
            {{ category.name }}
            <ArrowRight class="h-3.5 w-3.5 text-muted" />
          </router-link>
        </div>
      </div>
    </div>
  </section>

  <!-- 3. KHÓA HỌC NỔI BẬT (Nền Trắng - bg-surface) -->
  <CourseSection
    eyebrow="Khóa học tiêu biểu"
    title="Khóa học nổi bật"
    description="Những khóa học được học viên quan tâm và đánh giá cao."
    surface="surface"
    :courses="featured.courses"
    :loading="featured.loading"
    :error="featured.error"
    @retry="loadCollection(featured)"
  />

  <!-- 4. CÁCH HỌC + BỘ TÍNH LỘ TRÌNH (Nền Xám nhạt - bg-ground) -->
  <section id="lo-trinh" data-ui class="no-radius scroll-mt-24 border-b border-surface-3 bg-ground py-16 lg:py-20">
    <div class="mx-auto max-w-[1440px] px-[var(--margin)]">
      <div class="max-w-2xl">
        <span class="mb-3 inline-flex items-center border border-surface-3 bg-surface px-3 py-1 text-xs font-semibold text-brand-soft">
          Phương pháp học tập
        </span>
        <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Cách học trên NextCode</h2>
        <p class="mt-2 text-base text-muted">Ba bước lặp lại ở mỗi bài, giúp bạn nắm vững kiến thức và nhớ lâu hơn.</p>
      </div>

      <div class="mt-8 grid gap-6 md:grid-cols-3">
        <div
          v-for="step in steps"
          :key="step.title"
          class="flex flex-col justify-between border border-surface-3 bg-surface p-6 sm:p-7"
        >
          <div>
            <div class="flex items-center justify-between gap-3">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-tint text-brand-soft">
                <component :is="step.icon" class="h-5 w-5" />
              </span>
              <span class="border border-surface-3 bg-ground px-2.5 py-1 text-xs font-semibold text-muted">
                {{ step.badge }}
              </span>
            </div>
            <h3 class="mt-5 text-lg font-bold text-ink">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-6 text-muted">{{ step.text }}</p>
          </div>

          <div data-ui class="mt-6 flex flex-wrap gap-2 border-t border-surface-3 pt-4">
            <span
              v-for="tag in step.tags"
              :key="tag"
              class="border border-surface-3 bg-ground px-2.5 py-1 text-xs font-medium text-muted"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>

      <!-- Bộ tính lộ trình -->
      <div class="mt-12 grid gap-6 border border-surface-3 bg-surface p-6 sm:p-8 lg:grid-cols-12">
        <div class="lg:col-span-5">
          <span class="mb-2 inline-flex items-center border border-surface-3 bg-ground px-2.5 py-0.5 text-xs font-semibold text-brand-soft">
            Công cụ ước tính tiến độ
          </span>
          <h3 class="text-xl font-bold text-ink">Lên lịch học của bạn</h3>
          <p class="mt-1 text-sm text-muted">Chọn khóa học và số giờ học mỗi tuần để biết ngày dự kiến hoàn thành.</p>

          <div class="mt-5 space-y-2" role="radiogroup" aria-label="Chọn khóa học">
            <button
              v-for="(course, index) in plannerCourses"
              :key="course.id || course.title"
              type="button"
              role="radio"
              :aria-checked="selectedCourseIndex === index"
              class="w-full border px-4 py-3 text-left text-sm transition-colors"
              :class="
                selectedCourseIndex === index
                  ? 'border-brand bg-brand text-white'
                  : 'border-surface-3 bg-ground text-ink hover:border-brand hover:bg-tint'
              "
              @click="selectedCourseIndex = index"
            >
              <span class="block font-semibold">{{ course.title }}</span>
              <span class="mt-0.5 block text-xs tabular-nums" :class="selectedCourseIndex === index ? 'text-white/80' : 'text-muted'">
                {{ course.level }} · {{ course.totalLessons }} bài · {{ formatCourseDuration(course.totalDuration) }}
              </span>
            </button>
          </div>

          <p class="mt-6 text-sm font-semibold text-ink">Số giờ học mỗi tuần</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <button
              v-for="preset in hourPresets"
              :key="preset"
              type="button"
              class="border px-4 py-2 text-sm font-semibold tabular-nums transition-colors"
              :class="
                hoursPerWeek === preset
                  ? 'border-brand bg-brand text-white'
                  : 'border-surface-3 bg-ground text-ink hover:border-brand hover:bg-tint'
              "
              :aria-pressed="hoursPerWeek === preset"
              @click="hoursPerWeek = preset"
            >
              {{ preset }} giờ
            </button>
          </div>
        </div>

        <div class="flex flex-col justify-between bg-navy p-6 text-white lg:col-span-7 sm:p-8">
          <div>
            <p class="text-sm text-white/70">Dự kiến hoàn thành khóa học vào</p>
            <p class="mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl" aria-live="polite">{{ plannerSummary.formattedDate }}</p>
          </div>
          <dl class="mt-8 grid grid-cols-3 gap-4 text-sm">
            <div class="border border-white/15 bg-white/10 p-4">
              <dt class="text-white/70">Thời gian học</dt>
              <dd class="mt-1 text-2xl font-bold tabular-nums">{{ plannerSummary.weeks }} tuần</dd>
            </div>
            <div class="border border-white/15 bg-white/10 p-4">
              <dt class="text-white/70">Nhịp học</dt>
              <dd class="mt-1 text-2xl font-bold tabular-nums">{{ plannerSummary.lessonsPerWeek }} bài/tuần</dd>
            </div>
            <div class="border border-white/15 bg-white/10 p-4">
              <dt class="text-white/70">Tổng giờ học</dt>
              <dd class="mt-1 text-2xl font-bold tabular-nums">{{ plannerSummary.practiceHours }} giờ</dd>
            </div>
          </dl>
          <p class="mt-6 text-xs leading-5 text-white/60">
            Video {{ plannerSummary.videoDurationLabel }}, cộng thời gian gõ lại code và làm trắc nghiệm (ước tính gấp đôi thời lượng video).
          </p>
        </div>
      </div>
    </div>
  </section>

  <!-- 5. KHÓA HỌC MIỄN PHÍ (Nền Trắng - bg-surface) -->
  <CourseSection
    eyebrow="Khóa học cộng đồng"
    title="Khóa học miễn phí"
    description="Bắt đầu ngay không cần thanh toán, phù hợp để làm quen với lập trình."
    type="FREE"
    surface="surface"
    :courses="free.courses"
    :loading="free.loading"
    :error="free.error"
    @retry="loadCollection(free, 'FREE')"
  />

  <!-- 6. KHÓA HỌC PRO (Nền Xám nhạt - bg-ground) -->
  <CourseSection
    eyebrow="Lộ trình chuyên sâu"
    title="Khóa học Pro"
    description="Học sâu với dự án thực tế, video trên máy chủ riêng, ghi chép và tóm tắt từng bài."
    type="PRO"
    surface="ground"
    :courses="pro.courses"
    :loading="pro.loading"
    :error="pro.error"
    @retry="loadCollection(pro, 'PRO')"
  />

  <!-- 7. SO SÁNH FREE / PRO (Nền Trắng - bg-surface) -->
  <section id="bang-gia" data-ui class="no-radius scroll-mt-24 border-b border-surface-3 bg-surface py-16 lg:py-20">
    <div class="mx-auto max-w-[1100px] px-[var(--margin)]">
      <div class="text-center">
        <span class="mb-3 inline-flex items-center border border-surface-3 bg-ground px-3 py-1 text-xs font-semibold text-brand-soft">
          So sánh quyền lợi
        </span>
        <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">So sánh khóa học Free và Pro</h2>
        <p class="mt-2 text-sm text-muted">Lựa chọn hình thức học phù hợp với mục tiêu nâng cao kỹ năng của bạn.</p>
      </div>
      <div class="mt-8 overflow-x-auto border border-surface-3 bg-surface">
        <table class="w-full min-w-[540px] text-left text-base">
          <thead>
            <tr data-ui class="border-b border-surface-3 bg-surface-2 text-sm text-muted">
              <th class="px-5 py-4 font-semibold text-ink">Hạng mục</th>
              <th class="px-5 py-4 font-bold text-teal">Khóa học Free</th>
              <th class="px-5 py-4 font-bold text-brand-soft">Khóa học Pro</th>
            </tr>
          </thead>
          <tbody>
            <tr data-ui class="border-b border-surface-3">
              <td class="px-5 py-4 font-medium text-muted">Chi phí</td>
              <td class="px-5 py-4 font-semibold text-ink">0đ (Miễn phí)</td>
              <td class="px-5 py-4 font-semibold text-ink">Theo từng khóa học</td>
            </tr>
            <tr data-ui class="border-b border-surface-3 bg-ground">
              <td class="px-5 py-4 font-medium text-muted">Nguồn video</td>
              <td class="px-5 py-4 text-ink">YouTube nhúng hoặc máy chủ</td>
              <td class="px-5 py-4 text-ink">Máy chủ riêng tốc độ cao</td>
            </tr>
            <tr data-ui class="border-b border-surface-3">
              <td class="px-5 py-4 font-medium text-muted">Mục lục chương và bài</td>
              <td class="px-5 py-4 text-ink">Đầy đủ, mở khóa tuần tự</td>
              <td class="px-5 py-4 text-ink">Đầy đủ, chuyên sâu theo dự án</td>
            </tr>
            <tr data-ui class="border-b border-surface-3 bg-ground">
              <td class="px-5 py-4 font-medium text-muted">Trắc nghiệm & Chứng chỉ</td>
              <td class="px-5 py-4 text-ink">Theo từng bài, có cấp chứng chỉ</td>
              <td class="px-5 py-4 text-ink">Kèm giải thích chi tiết & chứng chỉ</td>
            </tr>
            <tr>
              <td class="px-5 py-4 font-medium text-muted">Ghi chép và tóm tắt</td>
              <td class="px-5 py-4 text-muted">Không có</td>
              <td class="px-5 py-4 font-medium text-ink">Có đầy đủ theo từng bài giảng</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>

  <!-- 8. HỎI ĐÁP & CTA (Nền Xám nhạt - bg-ground) -->
  <section id="hoi-dap" data-ui class="no-radius scroll-mt-24 bg-ground py-16 lg:py-20">
    <div class="mx-auto max-w-[900px] px-[var(--margin)]">
      <div class="text-center">
        <span class="mb-3 inline-flex items-center border border-surface-3 bg-surface px-3 py-1 text-xs font-semibold text-brand-soft">
          Giải đáp thắc mắc
        </span>
        <h2 class="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Câu hỏi thường gặp</h2>
        <p class="mt-2 text-sm text-muted">Những thông tin cần biết trước khi bắt đầu hành trình học tập trên NextCode.</p>
      </div>
      <div class="mt-8 space-y-3">
        <details
          v-for="faq in faqs"
          :key="faq.q"
          class="group border border-surface-3 bg-surface p-5 transition-colors hover:border-brand"
        >
          <summary class="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-ink">
            {{ faq.q }}
            <span class="text-xl text-brand-soft transition-transform group-open:rotate-45" aria-hidden="true">+</span>
          </summary>
          <p data-ui class="mt-3 border-t border-surface-3 pt-3 text-sm leading-6 text-muted">{{ faq.a }}</p>
        </details>
      </div>
    </div>

    <!-- CTA -->
    <div class="mx-auto mt-16 max-w-[1440px] px-[var(--margin)]">
      <div class="flex flex-col items-start justify-between gap-6 border border-surface-3 bg-navy p-8 text-white sm:p-12 md:flex-row md:items-center">
        <div>
          <h2 class="text-2xl font-bold text-white sm:text-3xl">Sẵn sàng bắt đầu bài học đầu tiên?</h2>
          <p class="mt-2 text-base text-white/70">Tạo tài khoản miễn phí và học thử ngay hôm nay.</p>
        </div>
        <router-link
          :to="authStore.isAuthenticated ? { name: 'Courses' } : '/register'"
          class="inline-flex shrink-0 items-center gap-2 bg-white px-6 py-3.5 text-base font-semibold text-navy transition-colors hover:bg-tint"
        >
          {{ authStore.isAuthenticated ? 'Chọn khóa học' : 'Đăng ký miễn phí' }}
          <ArrowRight class="h-4 w-4" />
        </router-link>
      </div>
    </div>
  </section>
</template>
