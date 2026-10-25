<script setup lang="ts">
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  Check,
  Code2,
  GraduationCap,
  Laptop,
  PlayCircle,
  Route,
  Sparkles,
  TrendingUp,
} from 'lucide-vue-next';
import CourseCard from '@/components/course/CourseCard.vue';
import { courses } from '@/data/courses';
import { useAuthStore } from '@/stores/auth.store';

const authStore = useAuthStore();
const featuredCourses = courses.filter((course) => course.featured);
const freeCourses = courses.filter((course) => course.plan === 'Free');
const proCourses = courses.filter((course) => course.plan === 'Pro');

const benefits = [
  {
    icon: Laptop,
    title: 'Học mọi lúc, mọi nơi',
    description: 'Chủ động sắp xếp thời gian học trên thiết bị bạn yêu thích.',
  },
  {
    icon: Route,
    title: 'Lộ trình rõ ràng',
    description: 'Nội dung được sắp xếp theo từng bước, dễ theo dõi và thực hành.',
  },
  {
    icon: PlayCircle,
    title: 'Video xem lại',
    description: 'Học theo tốc độ của riêng bạn và xem lại bài giảng bất cứ lúc nào.',
  },
  {
    icon: TrendingUp,
    title: 'Theo dõi tiến độ',
    description: 'Biết mình đã học đến đâu để duy trì động lực mỗi ngày.',
  },
  {
    icon: Award,
    title: 'Nhận chứng chỉ',
    description: 'Ghi nhận nỗ lực sau khi hoàn thành lộ trình khóa học.',
  },
];

const learningSteps = [
  ['01', 'Chọn khóa học', 'Tìm chủ đề và lộ trình phù hợp với mục tiêu của bạn.'],
  ['02', 'Bắt đầu học', 'Khám phá bài giảng video theo từng bước rõ ràng.'],
  ['03', 'Thực hành', 'Củng cố kiến thức qua bài tập và dự án học tập.'],
  ['04', 'Theo dõi tiến độ', 'Học tiếp từ nơi bạn đã dừng và duy trì nhịp học.'],
  ['05', 'Hoàn thành', 'Khép lại lộ trình và ghi nhận thành quả học tập.'],
];
</script>

<template>
  <section class="relative isolate overflow-hidden">
    <div class="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_15%_20%,rgba(79,70,229,0.2),transparent_42%),radial-gradient(ellipse_at_85%_30%,rgba(6,182,212,0.12),transparent_38%)]" />
    <div class="mx-auto grid w-full min-w-0 max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-28">
      <div class="min-w-0">
        <span class="inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3.5 py-2 text-xs font-semibold text-indigo-200 sm:text-sm">
          <Sparkles class="h-4 w-4 text-cyan-300" />
          Học lập trình theo cách của bạn
        </span>
        <h1 class="mt-6 max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
          Từng bước code nên
          <span class="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            tương lai
          </span>
          của bạn.
        </h1>
        <p class="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
          Học lập trình với lộ trình rõ ràng, video bài giảng dễ xem lại và nội dung thực hành giúp bạn tiến bộ mỗi ngày.
        </p>
        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <a
            href="#courses"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-950/50 transition hover:brightness-110"
          >
            Khám phá khóa học
            <ArrowRight class="h-4 w-4" />
          </a>
          <router-link
            :to="authStore.isAuthenticated ? '/dashboard' : '/login'"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3.5 text-sm font-semibold text-white transition hover:border-slate-500 hover:bg-slate-800"
          >
            Bắt đầu học
            <PlayCircle class="h-4 w-4 text-cyan-300" />
          </router-link>
        </div>
        <div class="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
          <span class="inline-flex items-center gap-2"><Check class="h-4 w-4 text-emerald-400" /> Học theo tiến độ riêng</span>
          <span class="inline-flex items-center gap-2"><Check class="h-4 w-4 text-emerald-400" /> Có khóa học miễn phí</span>
        </div>
      </div>

      <div class="relative mx-auto w-full min-w-0 max-w-xl">
        <div class="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-indigo-500/20 to-cyan-500/10 blur-2xl" />
        <div class="relative overflow-hidden rounded-[1.75rem] border border-slate-700/80 bg-slate-900/90 p-5 shadow-2xl shadow-black/40 sm:p-7">
          <div class="flex items-center justify-between border-b border-slate-800 pb-5">
            <div class="flex items-center gap-3">
              <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Code2 class="h-6 w-6" />
              </span>
              <div>
                <p class="text-sm font-bold text-white">Hành trình học tập</p>
                <p class="mt-1 text-xs text-slate-400">Tiến bộ qua từng bài học</p>
              </div>
            </div>
            <span class="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">Đang học</span>
          </div>
          <div class="mt-6 rounded-2xl border border-slate-800 bg-slate-950/80 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs text-slate-400">Khóa học gợi ý</p>
                <p class="mt-1 text-lg font-bold text-white">Lập trình Web</p>
              </div>
              <span class="rounded-xl bg-cyan-400/10 p-3 text-cyan-300"><Laptop class="h-5 w-5" /></span>
            </div>
            <div class="mt-5 flex items-center justify-between text-xs text-slate-400">
              <span>Tiến độ học tập</span>
              <span class="font-semibold text-white">65%</span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <div class="h-full w-[65%] rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" />
            </div>
            <div class="mt-5 flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
              <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-400/10 text-violet-300">
                <BookOpenCheck class="h-4 w-4" />
              </span>
              <div class="min-w-0 flex-1">
                <p class="truncate text-xs font-semibold text-white">Bài học tiếp theo</p>
                <p class="mt-1 truncate text-xs text-slate-400">Tạo giao diện web đầu tiên</p>
              </div>
              <PlayCircle class="h-5 w-5 text-cyan-300" />
            </div>
          </div>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <GraduationCap class="h-5 w-5 text-indigo-300" />
              <p class="mt-3 text-lg font-bold text-white">Từng bước</p>
              <p class="mt-1 text-xs text-slate-400">Lộ trình dễ theo</p>
            </div>
            <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
              <Award class="h-5 w-5 text-cyan-300" />
              <p class="mt-3 text-lg font-bold text-white">Bền vững</p>
              <p class="mt-1 text-xs text-slate-400">Học để tiến xa hơn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section id="about" class="scroll-mt-24 border-y border-slate-800/80 bg-slate-900/35">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Học tập hiệu quả</p>
        <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Một lộ trình, nhiều cách để tiến bộ</h2>
        <p class="mt-4 leading-7 text-slate-400">Tập trung vào trải nghiệm học linh hoạt, dễ tiếp cận và có định hướng.</p>
      </div>
      <div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article
          v-for="benefit in benefits"
          :key="benefit.title"
          class="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-indigo-500/40"
        >
          <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300">
            <component :is="benefit.icon" class="h-5 w-5" />
          </span>
          <h3 class="mt-4 font-bold text-white">{{ benefit.title }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-400">{{ benefit.description }}</p>
        </article>
      </div>
    </div>
  </section>

  <section id="courses" class="scroll-mt-20">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-indigo-300">Bắt đầu hành trình</p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Khóa học nổi bật</h2>
        </div>
        <p class="max-w-lg text-sm leading-6 text-slate-400">Một vài lựa chọn giúp bạn khám phá kiến thức lập trình theo từng cấp độ.</p>
      </div>
      <div class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in featuredCourses" :key="course.id" :course="course" />
      </div>
    </div>
  </section>

  <section class="border-y border-slate-800/80 bg-slate-900/35">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Bắt đầu miễn phí</p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Khóa học Free</h2>
        </div>
        <p class="max-w-lg text-sm leading-6 text-slate-400">Khám phá kiến thức nền tảng và chọn nhịp học phù hợp với bạn.</p>
      </div>
      <div class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in freeCourses" :key="course.id" :course="course" />
      </div>
    </div>
  </section>

  <section>
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p class="text-sm font-bold uppercase tracking-[0.18em] text-amber-200">Học sâu hơn</p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Khóa học Pro</h2>
        </div>
        <p class="max-w-lg text-sm leading-6 text-slate-400">Lộ trình chi tiết hơn, nội dung chuyên sâu và nhiều thời gian thực hành.</p>
      </div>
      <div class="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        <CourseCard v-for="course in proCourses" :key="course.id" :course="course" />
      </div>
    </div>
  </section>

  <section class="border-y border-slate-800/80 bg-slate-900/35">
    <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
      <div class="mx-auto max-w-2xl text-center">
        <p class="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Đơn giản và có định hướng</p>
        <h2 class="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Quy trình học 5 bước</h2>
      </div>
      <div class="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <article v-for="step in learningSteps" :key="step[0]" class="relative rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
          <span class="text-sm font-black tracking-wider text-indigo-300">{{ step[0] }}</span>
          <h3 class="mt-3 font-bold text-white">{{ step[1] }}</h3>
          <p class="mt-2 text-sm leading-6 text-slate-400">{{ step[2] }}</p>
        </article>
      </div>
    </div>
  </section>

  <section class="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
    <div class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl border border-indigo-400/20 bg-gradient-to-br from-indigo-950 via-slate-900 to-cyan-950 px-6 py-12 text-center sm:px-12 sm:py-16">
      <div class="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      <span class="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-cyan-200">
        <Sparkles class="h-6 w-6" />
      </span>
      <h2 class="relative mt-5 text-3xl font-black text-white sm:text-4xl">Sẵn sàng bắt đầu chưa?</h2>
      <p class="relative mx-auto mt-4 max-w-xl leading-7 text-slate-300">
        Chọn khóa học đầu tiên và bắt đầu xây dựng kỹ năng của bạn ngay hôm nay.
      </p>
      <a
        href="#courses"
        class="relative mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-cyan-50"
      >
        Khám phá khóa học
        <ArrowRight class="h-4 w-4" />
      </a>
    </div>
  </section>
</template>
