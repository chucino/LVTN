<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Lock,
  RotateCcw,
  Send,
} from 'lucide-vue-next';
import type {
  LearnerQuizQuestion,
  QuizQuestionResultItem,
  SubmitQuizResponse,
} from '@/types/learning';

const props = defineProps<{
  lessonId: string;
  hasQuiz: boolean;
  quizCount: number;
  requiredPassPercent: number;
  watchedFully: boolean;
  quizPassed: boolean;
  quizUnlocked: boolean;
  quizLockedReason: string | null;
  questions: LearnerQuizQuestion[];
  submitting: boolean;
  lastSubmitResult: SubmitQuizResponse | null;
}>();

const emit = defineEmits<{
  (
    e: 'submit',
    answers: Array<{ questionId: string; selectedOption: number }>,
  ): void;
}>();

const selectedAnswers = reactive<Record<string, number>>({});
const validationError = ref<string | null>(null);

watch(
  () => [props.lessonId, props.questions],
  () => {
    validationError.value = null;
    for (const key of Object.keys(selectedAnswers)) {
      delete selectedAnswers[key];
    }
    // Nếu bài đã vượt qua trắc nghiệm, điền sẵn đáp án đúng để học viên ôn lại
    if (props.quizPassed) {
      for (const q of props.questions) {
        if (q.correctOption !== null && q.correctOption !== undefined) {
          selectedAnswers[q.id] = q.correctOption;
        }
      }
    }
  },
  { immediate: true },
);

const resultByQuestionId = computed(() => {
  const map = new Map<string, QuizQuestionResultItem>();
  for (const item of props.lastSubmitResult?.results ?? []) {
    map.set(item.questionId, item);
  }
  return map;
});

const allAnswered = computed(() => {
  if (props.questions.length === 0) return false;
  return props.questions.every(
    (q) => typeof selectedAnswers[q.id] === 'number',
  );
});

function selectOption(questionId: string, optionIndex: number): void {
  if (props.submitting) return;
  selectedAnswers[questionId] = optionIndex;
  validationError.value = null;
}

function resetForRetry(): void {
  validationError.value = null;
  for (const q of props.questions) {
    const res = resultByQuestionId.value.get(q.id);
    // Giữ lại các câu đã trả lời đúng, chỉ xóa lựa chọn ở câu sai để học viên chọn lại nhanh
    if (res && !res.isCorrect) {
      delete selectedAnswers[q.id];
    }
  }
}

function handleSubmit(): void {
  if (!allAnswered.value) {
    validationError.value =
      'Vui lòng chọn đáp án cho tất cả câu hỏi trước khi nộp bài.';
    return;
  }
  const payload = props.questions.map((q) => ({
    questionId: q.id,
    selectedOption: selectedAnswers[q.id]!,
  }));
  emit('submit', payload);
}
</script>

<template>
  <section v-if="hasQuiz" data-ui class="bg-surface p-6 sm:p-8" aria-labelledby="quiz-heading">
    <div class="flex flex-wrap items-start justify-between gap-4 pb-2">
      <div>
        <div class="flex items-center gap-2 text-brand-soft">
          <CircleHelp class="h-5 w-5" />
          <h2 id="quiz-heading" class="text-lg font-bold text-ink">
            Bài kiểm tra trắc nghiệm sau video
          </h2>
        </div>
        <p class="mt-1 text-sm text-muted">
          <template v-if="quizCount === 1">
            Bài học có <strong>1 câu hỏi</strong>: Bạn cần trả lời đúng <strong>100% (1/1 câu)</strong> để mở khóa bài tiếp theo.
          </template>
          <template v-else>
            Bài học có <strong>{{ quizCount }} câu hỏi</strong>: Bạn cần đạt tối thiểu <strong>{{ requiredPassPercent }}%</strong> số câu đúng để mở khóa bài tiếp theo.
          </template>
        </p>
      </div>

      <span
        v-if="quizPassed"
        class="inline-flex items-center gap-1.5 rounded-full bg-teal-tint px-3.5 py-1.5 text-xs font-semibold text-teal"
      >
        <CheckCircle2 class="h-4 w-4" />
        Đã vượt qua trắc nghiệm
      </span>
    </div>

    <!-- Trạng thái chưa xem hết video -> khóa trắc nghiệm -->
    <div
      v-if="!quizUnlocked"
      class="mt-6 flex items-center gap-4 bg-ground p-5 text-sm text-muted"
    >
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-ink">
        <Lock class="h-5 w-5" />
      </span>
      <div>
        <p class="font-semibold text-ink">Câu hỏi trắc nghiệm đang khóa</p>
        <p class="mt-0.5 text-xs leading-5 text-muted">
          {{
            quizLockedReason ||
            'Hệ thống sẽ tự động mở câu hỏi trắc nghiệm ngay khi bạn xem hết 100% thời lượng video bài giảng.'
          }}
        </p>
      </div>
    </div>

    <!-- Danh sách câu hỏi khi đã mở khóa -->
    <form v-else class="mt-6 space-y-6" @submit.prevent="handleSubmit">
      <!-- Thông báo kết quả lần nộp gần nhất -->
      <div
        v-if="lastSubmitResult"
        class="p-4 text-sm"
        :class="
          lastSubmitResult.passed
            ? 'bg-teal-tint text-teal'
            : 'bg-brand-surface text-ink'
        "
        role="status"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2 font-semibold">
            <CheckCircle2 v-if="lastSubmitResult.passed" class="h-5 w-5 shrink-0" />
            <AlertCircle v-else class="h-5 w-5 shrink-0 text-brand-soft" />
            <span>
              Kết quả: Đúng {{ lastSubmitResult.correctCount }}/{{ lastSubmitResult.totalQuestions }} câu
              ({{ lastSubmitResult.scorePercent }}% — Yêu cầu cần đạt {{ lastSubmitResult.requiredPassPercent }}%)
            </span>
          </div>
          <button
            v-if="lastSubmitResult.canRetry"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:bg-surface-2"
            @click="resetForRetry"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            Chọn lại câu sai
          </button>
        </div>
        <p class="mt-1 text-xs opacity-90">
          {{
            lastSubmitResult.passed
              ? 'Chúc mừng! Bạn đã hoàn thành bài kiểm tra và mở khóa bài học tiếp theo.'
              : 'Bạn chưa đạt tỷ lệ câu đúng yêu cầu. Hãy kiểm tra lại các câu chưa chính xác và nộp lại nhé.'
          }}
        </p>
      </div>

      <div
        v-for="(question, qIdx) in questions"
        :key="question.id"
        class="space-y-3 bg-ground p-5"
      >
        <p class="text-base font-bold text-ink">
          Câu {{ qIdx + 1 }}: {{ question.content }}
        </p>

        <div class="grid gap-2.5">
          <button
            v-for="(optionText, optIdx) in question.options"
            :key="`${question.id}-${optIdx}`"
            type="button"
            class="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors"
            :class="[
              selectedAnswers[question.id] === optIdx
                ? 'bg-brand font-semibold text-white'
                : 'bg-surface text-ink hover:bg-tint',
            ]"
            @click="selectOption(question.id, optIdx)"
          >
            <span>
              <strong class="mr-2 tabular-nums">{{ String.fromCharCode(65 + optIdx) }}.</strong>
              {{ optionText }}
            </span>
            <CheckCircle2
              v-if="
                (resultByQuestionId.get(question.id)?.isCorrect &&
                  resultByQuestionId.get(question.id)?.selectedOption === optIdx) ||
                (quizPassed && question.correctOption === optIdx)
              "
              class="h-4 w-4 shrink-0"
            />
          </button>
        </div>

        <!-- Giải thích đáp án khi trả lời đúng -->
        <div
          v-if="
            resultByQuestionId.get(question.id)?.isCorrect &&
            resultByQuestionId.get(question.id)?.explanation
          "
          class="mt-3 rounded-lg bg-teal-tint p-3.5 text-xs leading-5 text-teal"
        >
          <p class="font-bold">Chính xác! Giải thích đáp án:</p>
          <p class="mt-1">{{ resultByQuestionId.get(question.id)?.explanation }}</p>
        </div>
        <div
          v-else-if="quizPassed && question.explanation"
          class="mt-3 rounded-lg bg-teal-tint p-3.5 text-xs leading-5 text-teal"
        >
          <p class="font-bold">Giải thích đáp án:</p>
          <p class="mt-1">{{ question.explanation }}</p>
        </div>
        <div
          v-else-if="
            resultByQuestionId.get(question.id) &&
            !resultByQuestionId.get(question.id)?.isCorrect
          "
          class="mt-3 rounded-lg bg-brand-surface p-3 text-xs text-ink"
        >
          Đáp án bạn chọn chưa chính xác. Hãy suy nghĩ và chọn lại đáp án khác.
        </div>
      </div>

      <p v-if="validationError" class="text-sm text-brand-soft" role="alert">
        {{ validationError }}
      </p>

      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="submitting || !allAnswered"
          class="manage-button-primary"
        >
          <Send class="h-4 w-4" />
          <span>
            {{
              submitting
                ? 'Đang chấm điểm...'
                : quizPassed
                  ? 'Nộp lại để ôn tập'
                  : 'Nộp bài trắc nghiệm'
            }}
          </span>
        </button>
      </div>
    </form>
  </section>
</template>
