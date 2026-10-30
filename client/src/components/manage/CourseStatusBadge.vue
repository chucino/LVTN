<script setup lang="ts">
import { MANAGE_COURSE_STATUS, type ManageCourseStatus } from '@/types/manage-course';

defineProps<{ status: ManageCourseStatus }>();
</script>

<template>
  <span class="inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold" :class="MANAGE_COURSE_STATUS[status].className">
    {{ MANAGE_COURSE_STATUS[status].label }}
  </span>
</template>

<style scoped>
.status-draft {
  border-color: rgb(148 163 184 / 0.25);
  background: rgb(148 163 184 / 0.1);
  color: #cbd5e1;
}
.status-pending {
  border-color: rgb(251 191 36 / 0.25);
  background: rgb(251 191 36 / 0.1);
  color: #fde68a;
}
.status-approved {
  border-color: rgb(52 211 153 / 0.25);
  background: rgb(52 211 153 / 0.1);
  color: #6ee7b7;
}
.status-hidden {
  border-color: rgb(248 113 113 / 0.25);
  background: rgb(248 113 113 / 0.1);
  color: #fca5a5;
}
</style>
