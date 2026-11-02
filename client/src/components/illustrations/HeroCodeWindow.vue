<script setup lang="ts">
import { CheckCircle2, Trophy } from 'lucide-vue-next';
</script>

<template>
  <div class="relative mx-auto w-full max-w-xl min-w-0" aria-hidden="true">
    <div class="absolute right-0 -top-4 h-36 w-36 rounded-full bg-tint sm:-right-4 sm:-top-6 sm:h-40 sm:w-40" />
    <div class="absolute -bottom-6 left-0 h-28 w-28 rounded-3xl bg-teal-tint sm:-bottom-8 sm:-left-4 sm:h-32 sm:w-32" />

    <div data-ui class="relative overflow-hidden rounded-2xl bg-navy shadow-xl">
      <div class="flex items-center gap-2 bg-white/5 px-4 py-3">
        <span class="h-3 w-3 rounded-full bg-[#ff6b6b]" />
        <span class="h-3 w-3 rounded-full bg-[#ffd166]" />
        <span class="h-3 w-3 rounded-full bg-[#4fd1a5]" />
        <span class="ml-3 text-xs text-white/60">bai-12-reactivity.vue</span>
      </div>
      <pre class="overflow-x-auto px-4 py-5 font-mono text-xs leading-7 text-white/85 sm:px-5 sm:text-[13px]"><code><span class="text-[#7dd3fc]">import</span> { ref, computed } <span class="text-[#7dd3fc]">from</span> <span class="text-[#86efac]">'vue'</span>

<span class="text-[#7dd3fc]">const</span> bai = ref(<span class="text-[#fcd34d]">12</span>)
<span class="text-[#7dd3fc]">const</span> tienDo = computed(() =&gt;
  Math.round((bai.value / <span class="text-[#fcd34d]">40</span>) * <span class="text-[#fcd34d]">100</span>)
)

<span class="text-white/45">// Học đến đâu, hiểu đến đó</span>
console.log(<span class="text-[#86efac]">`Đã hoàn thành ${tienDo.value}%`</span>)</code></pre>
      <div class="bg-white/5 px-5 py-3">
        <div class="flex items-center justify-between text-xs text-white/70">
          <span>Tiến độ khóa học</span>
          <span class="tabular-nums">30%</span>
        </div>
        <div class="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full w-[30%] rounded-full bg-[#4fd1a5]" />
        </div>
      </div>
    </div>

    <div data-ui class="float-soft absolute -bottom-5 right-3 flex items-center gap-2.5 rounded-xl bg-white px-4 py-3 shadow-lg sm:-right-4">
      <CheckCircle2 class="h-5 w-5 text-teal" />
      <div>
        <p class="text-sm font-semibold text-ink">Bài 12 hoàn thành</p>
        <p class="text-xs text-muted">Reactivity trong Vue 3</p>
      </div>
    </div>

    <div data-ui class="float-soft absolute -top-5 right-4 hidden items-center gap-2.5 rounded-xl bg-white px-4 py-2.5 shadow-lg sm:flex" style="animation-delay: 1.5s">
      <Trophy class="h-5 w-5 text-amber-300" />
      <div>
        <p class="text-sm font-semibold text-ink">Trắc nghiệm 9/10</p>
        <p class="text-xs text-muted">Đạt yêu cầu chương 3</p>
      </div>
    </div>
  </div>
</template>

