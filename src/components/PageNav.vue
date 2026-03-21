<script setup>
defineProps({
  prev: { type: Object, default: null },
  next: { type: Object, default: null }
})
</script>

<template>
  <div class="page-nav">
    <router-link v-if="prev" :to="prev.path">← {{ prev.label }}</router-link>
    <span v-else></span>
    <router-link v-if="next" :to="next.path">{{ next.label }} →</router-link>
    <span v-else></span>
  </div>
</template>
