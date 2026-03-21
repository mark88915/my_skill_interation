<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  to: { type: String, required: true },
  pageHeadings: { type: Array, default: () => [] }
})
const emit = defineEmits(['navigate'])
const route = useRoute()

const isActive = computed(() => route.path === props.to)

function scrollTo(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <router-link :to="to" @click="emit('navigate')"><slot /></router-link>
  <div v-if="isActive && pageHeadings.length" class="toc-group">
    <a
      v-for="h in pageHeadings"
      :key="h.id"
      class="toc-sublink"
      @click.prevent="scrollTo(h.id)"
    >{{ h.text }}</a>
  </div>
</template>
