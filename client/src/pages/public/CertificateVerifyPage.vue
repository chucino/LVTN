<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { AlertCircle, Award, CheckCircle2, Search } from 'lucide-vue-next';
import CertificateCardView from '@/components/certificate/CertificateCardView.vue';
import { getCourseErrorMessage } from '@/lib/course-format';
import { certificatesApi } from '@/services/certificates.api';
import type { CertificateVerifyResult } from '@/types/learning';

const route = useRoute();
const router = useRouter();

const codeInput = ref('');
const loading = ref(false);
const error = ref<string | null>(null);
const result = ref<CertificateVerifyResult | null>(null);

async function lookupCertificate(rawCode: string): Promise<void> {
  const cleaned = rawCode.trim().toUpperCase();
  if (!cleaned) return;
  loading.value = true;
  error.value = null;
  result.value = null;

  try {
    result.value = await certificatesApi.verifyCertificate(cleaned);
  } catch (err) {
    error.value = getCourseErrorMessage(err);
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(): Promise<void> {
  const cleaned = codeInput.value.trim().toUpperCase();
  if (!cleaned) return;
  if (route.params.code !== cleaned) {
    await router.push({
      name: 'CertificateVerifyCode',
      params: { code: cleaned },
    });
  } else {
    await lookupCertificate(cleaned);
  }
}

watch(
  () => route.params.code,
  (code) => {
    const str = Array.isArray(code) ? (code[0] ?? '') : String(code ?? '');
    if (str) {
      codeInput.value = str.toUpperCase();
      void lookupCertificate(str);
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (typeof route.params.code === 'string' && route.params.code) {
    codeInput.value = route.params.code.toUpperCase();
  }
});
</script>

<template>
  <div class="mx-auto max-w-[1100px] px-[var(--margin)] py-12">
    <section class="bg-surface p-6 sm:p-10">
      <div class="max-w-2xl">
        <p class="inline-flex items-center gap-2 rounded-full bg-tint px-3.5 py-1 text-xs font-semibold text-brand-soft">
          <Award class="h-4 w-4" />
          <span>Hệ thống xác thực chứng chỉ NextCode</span>
        </p>
        <h1 class="mt-3 text-2xl font-extrabold text-ink sm:text-3xl">
          Tra cứu và xác thực chứng chỉ hoàn thành khóa học
        </h1>
        <p class="mt-2 text-sm leading-6 text-muted">
          Nhập mã số chứng chỉ (ví dụ: <code class="font-mono text-ink">NC-2026-8F4K9X2M</code>) in trên chứng chỉ để kiểm tra tính hợp lệ trực tuyến.
        </p>
      </div>

      <form
        class="mt-6 flex flex-col gap-3 sm:flex-row"
        @submit.prevent="handleSubmit"
      >
        <div class="relative flex-1">
          <Search class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            v-model="codeInput"
            type="text"
            required
            placeholder="Nhập mã chứng chỉ (VD: NC-2026-8F4K9X2M)..."
            class="manage-input pl-11 tabular-nums uppercase"
          />
        </div>
        <button
          type="submit"
          :disabled="loading || !codeInput.trim()"
          class="manage-button-primary shrink-0 px-6"
        >
          {{ loading ? 'Đang kiểm tra...' : 'Xác thực chứng chỉ' }}
        </button>
      </form>
    </section>

    <div
      v-if="error"
      class="mt-6 flex items-center gap-3 bg-brand-surface p-5 text-sm text-ink"
      role="alert"
    >
      <AlertCircle class="h-5 w-5 shrink-0 text-brand-soft" />
      <span>{{ error }}</span>
    </div>

    <section v-if="result" class="mt-8 space-y-5">
      <div
        class="flex items-center gap-3 p-4 text-sm font-semibold"
        :class="
          result.isValid
            ? 'bg-teal-tint text-teal'
            : 'bg-brand-surface text-brand-soft'
        "
      >
        <CheckCircle2 v-if="result.isValid" class="h-5 w-5 shrink-0" />
        <AlertCircle v-else class="h-5 w-5 shrink-0" />
        <span>
          {{
            result.isValid
              ? `Chứng chỉ ${result.certificateCode} hoàn toàn hợp lệ và được cấp chính thức bởi NextCode.`
              : `Chứng chỉ ${result.certificateCode} đã bị thu hồi hoặc không còn hiệu lực.`
          }}
        </span>
      </div>

      <CertificateCardView
        :certificate-code="result.certificateCode"
        :student-name="result.studentName"
        :course-title="result.courseTitle"
        :instructor-name="result.instructorName"
        :issued-at="result.issuedAt"
        :is-valid="result.isValid"
      />
    </section>
  </div>
</template>
