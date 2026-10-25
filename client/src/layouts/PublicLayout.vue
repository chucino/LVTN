<script setup lang="ts">
import PublicFooter from '@/components/public/PublicFooter.vue';
import PublicHeader from '@/components/public/PublicHeader.vue';
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100">
    <PublicHeader />
    <main>
      <router-view />
    </main>
    <PublicFooter />
  </div>
</template>
