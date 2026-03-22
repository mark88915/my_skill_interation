<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import DarkModeToggle from './components/DarkModeToggle.vue'

const route = useRoute()
const sidebarOpen = ref(false)
const mobileNavOpen = ref(false)
const pageHeadings = ref([])

const isHome = computed(() => route.path === '/')
const currentCategory = computed(() => {
  if (route.path.startsWith('/csharp')) return 'csharp'
  if (route.path.startsWith('/ai')) return 'ai'
  if (route.path.startsWith('/infra')) return 'infra'
  if (route.path.startsWith('/cloud')) return 'cloud'
  if (route.path.startsWith('/vue')) return 'vue'
  return ''
})

watch(() => route.path, async () => {
  await nextTick()
  setTimeout(() => {
    const els = document.querySelectorAll('.content-wrapper h2')
    pageHeadings.value = Array.from(els).map(el => {
      if (!el.id) {
        el.id = el.textContent.trim()
          .replace(/\s+/g, '-')
          .replace(/[^\w\u4e00-\u9fff-]/g, '')
          .substring(0, 60)
      }
      return { id: el.id, text: el.textContent.trim() }
    })
  }, 80)
}, { immediate: true })
</script>

<template>
  <header class="top-nav">
    <router-link to="/" class="nav-brand">
      <span class="logo">T</span>
      技術整合網站
    </router-link>
    <nav class="nav-links">
      <router-link to="/csharp/ddd/intro" :class="{ 'router-link-active': currentCategory === 'csharp' }">C#</router-link>
      <router-link to="/ai/claude-code/intro" :class="{ 'router-link-active': currentCategory === 'ai' }">AI</router-link>
      <router-link to="/infra/docker/intro" :class="{ 'router-link-active': currentCategory === 'infra' }">Docker & K8s</router-link>
      <router-link to="/cloud/gcp/intro" :class="{ 'router-link-active': currentCategory === 'cloud' }">上雲</router-link>
      <router-link to="/vue/advanced/index" :class="{ 'router-link-active': currentCategory === 'vue' }">Vue 生態</router-link>
    </nav>
    <DarkModeToggle />
    <button class="mobile-menu-btn" @click="mobileNavOpen = !mobileNavOpen">
      {{ mobileNavOpen ? '✕' : '☰' }}
    </button>
  </header>

  <!-- Mobile nav dropdown (homepage + inner pages) -->
  <div class="mobile-nav-overlay" :class="{ open: mobileNavOpen }" @click="mobileNavOpen = false"></div>
  <nav class="mobile-nav-dropdown" :class="{ open: mobileNavOpen }">
    <router-link to="/csharp/ddd/intro" @click="mobileNavOpen = false">C#</router-link>
    <router-link to="/ai/claude-code/intro" @click="mobileNavOpen = false">AI</router-link>
    <router-link to="/infra/docker/intro" @click="mobileNavOpen = false">Docker & K8s</router-link>
    <router-link to="/cloud/gcp/intro" @click="mobileNavOpen = false">上雲</router-link>
    <router-link to="/vue/advanced/index" @click="mobileNavOpen = false">Vue 生態</router-link>
  </nav>

  <div class="sidebar-overlay" :class="{ open: sidebarOpen }" @click="sidebarOpen = false"></div>

  <div class="app-body" v-if="!isHome">
    <Sidebar :category="currentCategory" :pageHeadings="pageHeadings" :class="{ open: sidebarOpen }" @navigate="sidebarOpen = false" />
    <button class="sidebar-toggle-btn" @click="sidebarOpen = !sidebarOpen">
      {{ sidebarOpen ? '✕' : '☰' }}
    </button>
    <main class="main-content">
      <router-view />
    </main>
  </div>

  <main v-else>
    <router-view />
  </main>
</template>
