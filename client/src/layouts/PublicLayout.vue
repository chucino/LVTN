<script setup lang="ts">
import PublicFooter from '@/components/public/PublicFooter.vue';
import PublicHeader from '@/components/public/PublicHeader.vue';
</script>

<template>
  <div class="min-h-svh text-ink">
    <PublicHeader />
    <main>
      <router-view />
    </main>
    <PublicFooter />
  </div>
</template>
