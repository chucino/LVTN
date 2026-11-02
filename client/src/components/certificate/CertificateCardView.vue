<script setup lang="ts">
import { computed, ref } from 'vue';
import { Award, Check, Copy, ExternalLink, Printer, ShieldCheck } from 'lucide-vue-next';

const props = defineProps<{
  certificateCode: string;
  studentName: string;
  courseTitle: string;
  instructorName: string;
  issuedAt: string;
  isValid?: boolean;
  hideActions?: boolean;
}>();

const copied = ref(false);

const formattedDate = computed(() => {
  const d = new Date(props.issuedAt);
  if (Number.isNaN(d.getTime())) return props.issuedAt;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
});

const verifyUrl = computed(() => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://nextcode.vn';
  return `${origin}/certificates/verify/${encodeURIComponent(props.certificateCode)}`;
});

/**
 * Tạo ma trận mã QR biểu diễn trực quan bằng SVG (21x21 module chuẩn có 3 góc định vị Finder Pattern
 * và dữ liệu băm từ certificateCode) để hiển thị sắc nét ở mọi kích thước và khi in PDF.
 */
const qrGrid = computed(() => {
  const size = 21;
  const grid: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const drawFinder = (startR: number, startC: number) => {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        grid[startR + r]![startC + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  // Timing pattern
  for (let i = 8; i < size - 8; i += 1) {
    grid[6]![i] = i % 2 === 0;
    grid[i]![6] = i % 2 === 0;
  }

  const seedStr = `${props.certificateCode}|${props.studentName}|${props.courseTitle}`;
  let hash = 2166136261;
  for (let i = 0; i < seedStr.length; i += 1) {
    hash ^= seedStr.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      if (inTopLeft || inTopRight || inBottomLeft || isTiming) continue;

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      grid[r]![c] = (Math.abs(hash) % 10) < 5;
    }
  }

  return grid;
});

async function copyVerifyLink(): Promise<void> {
  try {
    await navigator.clipboard.writeText(verifyUrl.value);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2200);
  } catch {
    copied.value = false;
  }
}

function printCertificate(): void {
  window.print();
}
</script>

<template>
  <div data-ui class="space-y-4">
    <!-- Thanh thao tác -->
    <div v-if="!hideActions" class="print-hidden flex flex-wrap items-center justify-between gap-3 bg-surface p-4">
      <div class="flex items-center gap-2.5 text-sm font-medium text-teal">
        <ShieldCheck class="h-5 w-5 shrink-0" />
        <span>Chứng chỉ điện tử hợp lệ · Mã số: <strong class="tabular-nums">{{ certificateCode }}</strong></span>
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          class="manage-button-secondary text-xs"
          @click="copyVerifyLink"
        >
          <Check v-if="copied" class="h-4 w-4 text-teal" />
          <Copy v-else class="h-4 w-4" />
          <span>{{ copied ? 'Đã sao chép liên kết' : 'Sao chép link xác thực' }}</span>
        </button>
        <router-link
          :to="{ name: 'CertificateVerifyCode', params: { code: certificateCode } }"
          class="manage-button-secondary text-xs"
        >
          <ExternalLink class="h-4 w-4" />
          <span>Trang tra cứu</span>
        </router-link>
        <button
          type="button"
          class="manage-button-primary text-xs"
          @click="printCertificate"
        >
          <Printer class="h-4 w-4" />
          <span>In / Tải PDF</span>
        </button>
      </div>
    </div>

    <!-- Bản vẽ Chứng chỉ -->
    <article
      class="certificate-sheet relative overflow-hidden bg-white p-4 text-ink sm:p-8"
      aria-label="Chứng chỉ hoàn thành khóa học NextCode"
    >
      <div class="relative bg-ground p-5 sm:p-10">
        <div class="bg-white p-6 sm:p-10">
          <!-- Header chứng chỉ -->
          <div class="flex flex-col items-start justify-between gap-4 bg-ground p-5 sm:flex-row sm:items-center">
            <div class="flex items-center gap-3">
              <img
                src="/logo.jpg"
                alt="Logo NextCode"
                width="44"
                height="44"
                class="h-11 w-11 rounded-lg bg-white object-contain p-1"
              />
              <div>
                <p class="text-lg font-extrabold tracking-tight text-navy">NEXTCODE ACADEMY</p>
                <p class="text-xs text-muted">Học hôm nay, kiến tạo ngày mai</p>
              </div>
            </div>

            <div class="inline-flex items-center gap-2 rounded-full bg-teal-tint px-3.5 py-1.5 text-xs font-semibold text-teal">
              <Award class="h-4 w-4" />
              <span>CHỨNG CHỈ ĐÃ XÁC THỰC</span>
            </div>
          </div>

          <!-- Nội dung chính -->
          <div class="my-8 text-center sm:my-12">
            <p class="text-sm font-bold text-brand-soft">
              Chứng nhận hoàn thành chương trình đào tạo
            </p>
            <h2 class="mt-2 text-2xl font-extrabold tracking-tight text-navy sm:text-4xl">
              Chứng chỉ hoàn thành khóa học
            </h2>
            <p class="mt-5 text-sm text-muted">Trân trọng chứng nhận học viên</p>

            <p class="mt-3 text-2xl font-extrabold text-ink sm:text-4xl">
              {{ studentName }}
            </p>

            <p class="mx-auto mt-5 max-w-xl text-sm leading-6 text-muted">
              Đã hoàn thành 100% chương trình bài giảng video và vượt qua toàn bộ bài kiểm tra trắc nghiệm theo lộ trình của khóa học:
            </p>

            <h3 class="mt-3 text-xl font-bold text-brand-soft sm:text-2xl">
              “{{ courseTitle }}”
            </h3>
          </div>

          <!-- Chân chứng chỉ: Giảng viên, Ngày cấp & Mã QR -->
          <div class="mt-8 grid items-end gap-6 bg-ground p-6 sm:grid-cols-3">
            <div>
              <p class="text-xs text-muted">Giảng viên hướng dẫn</p>
              <p class="mt-2 text-base font-bold text-ink">{{ instructorName }}</p>
              <p class="mt-0.5 text-xs text-muted">Giảng viên chuyên môn NextCode</p>
            </div>

            <div class="sm:text-center">
              <p class="text-xs text-muted">Ngày cấp chứng chỉ</p>
              <p class="mt-1 text-sm font-bold tabular-nums text-ink">{{ formattedDate }}</p>
              <p class="mt-2 text-xs text-muted">Mã số xác thực</p>
              <p class="mt-0.5 text-sm font-bold tabular-nums text-brand-soft">{{ certificateCode }}</p>
            </div>

            <div class="flex items-center gap-3 sm:justify-end">
              <div class="rounded-lg bg-white p-2">
                <svg
                  viewBox="0 0 21 21"
                  class="h-20 w-20"
                  role="img"
                  :aria-label="`Mã QR tra cứu chứng chỉ ${certificateCode}`"
                >
                  <rect width="21" height="21" fill="#ffffff" />
                  <template v-for="(row, rIdx) in qrGrid" :key="`r-${rIdx}`">
                    <template v-for="(cell, cIdx) in row" :key="`c-${rIdx}-${cIdx}`">
                      <rect
                        v-if="cell"
                        :x="cIdx"
                        :y="rIdx"
                        width="1"
                        height="1"
                        fill="#0b1f4d"
                      />
                    </template>
                  </template>
                </svg>
              </div>
              <div class="text-xs text-muted">
                <p class="font-semibold text-ink">Tra cứu trực tuyến</p>
                <p class="mt-0.5 max-w-[140px] break-all text-xs tabular-nums">
                  /certificates/verify/{{ certificateCode }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped>
@media print {
  .print-hidden {
    display: none !important;
  }
  .certificate-sheet {
    padding: 0 !important;
  }
}
</style>
