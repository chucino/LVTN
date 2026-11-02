<script setup lang="ts">
import { MANAGE_COURSE_STATUS, type ManageCourseStatus } from '@/types/manage-course';

defineProps<{ status: ManageCourseStatus }>();
</script>

<template>
  <span class="inline-flex whitespace-nowrap px-2.5 py-1 text-xs font-medium" :class="MANAGE_COURSE_STATUS[status].className">
    {{ MANAGE_COURSE_STATUS[status].label }}
  </span>
</template>

<style scoped>
.status-draft {
  background: var(--color-surface-2);
  color: var(--color-ink);
}
.status-pending {
  background: #fef3c7;
  color: #92400e;
}
.status-approved {
  background: var(--color-teal-tint);
  color: #0f766e;
}
.status-hidden {
  background: #fde8e8;
  color: #b91c1c;
}
</style>
