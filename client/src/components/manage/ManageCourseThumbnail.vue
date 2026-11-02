<script setup lang="ts">
import { ref, watch } from 'vue';
import { BookOpen } from 'lucide-vue-next';

const props = defineProps<{
  src: string | null;
  title: string;
}>();
const failed = ref(false);

watch(() => props.src, () => {
  failed.value = false;
});
</script>

<template>
  <div class="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden bg-surface-2 text-muted">
    <BookOpen v-if="!src || failed" class="h-4 w-4" aria-hidden="true" />
    <img v-if="src && !failed" :src="src" :alt="`Ảnh khóa học ${title}`" class="absolute inset-0 h-full w-full object-cover" @error="failed = true" />
  </div>
</template>
