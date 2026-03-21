<script setup>
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyDark(value) {
  isDark.value = value
  document.documentElement.classList.toggle('dark', value)
  localStorage.setItem('theme', value ? 'dark' : 'light')
}

function toggle() {
  applyDark(!isDark.value)
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  applyDark(saved ? saved === 'dark' : prefersDark)
})
</script>

<template>
  <div class="dark-toggle">
    <span class="dark-toggle-label" aria-hidden="true">
      {{ isDark ? '🌙' : '☀️' }}
    </span>
    <button
      class="toggle-track"
      :class="{ active: isDark }"
      role="switch"
      :aria-checked="isDark"
      aria-label="切換深色模式"
      @click="toggle"
    >
      <span class="toggle-thumb" />
    </button>
  </div>
</template>
