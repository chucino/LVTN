<script setup lang="ts">
defineProps<{ msg?: string }>();
</script>

<template>
  <div class="p-4 text-ink">
    <p>{{ msg || 'NextCode' }}</p>
  </div>
</template>
