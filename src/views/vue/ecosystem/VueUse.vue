<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const searchExample = `<!-- 實戰 1：搜尋防抖 + 即時結果 -->
<script setup lang="ts">
import { useDebounce } from '@vueuse/core'

const query = ref('')
const debouncedQuery = useDebounce(query, 400)

const { data: results, pending } = useFetch(
  () => \`/api/search?q=\${debouncedQuery.value}\`,
  { watch: [debouncedQuery] }
)
<\/script>

<template>
  <input v-model="query" placeholder="搜尋..." />
  <span v-if="pending">搜尋中...</span>
  <ul>
    <li v-for="item in results" :key="item.id">{{ item.title }}</li>
  </ul>
</template>`

const darkModeExample = `<!-- 實戰 2：深色模式切換（自動同步系統設定 + localStorage）-->
<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

// 自動偵測 prefers-color-scheme，並同步到 <html class="dark">
// 使用者偏好存入 localStorage，重新整理後保持
const isDark = useDark({
  selector: 'html',          // 切換 class 到哪個元素
  attribute: 'class',        // 用 class 切換（Tailwind 的方式）
  valueDark: 'dark',
  valueLight: '',
})
const toggleDark = useToggle(isDark)
<\/script>

<template>
  <button @click="toggleDark()">
    {{ isDark ? '🌙 深色模式' : '☀️ 淺色模式' }}
  </button>
</template>`

const infiniteScrollExample = `<!-- 實戰 3：無限捲動列表 -->
<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'

const posts = ref<Post[]>([])
const page = ref(1)
const hasMore = ref(true)
const loadMoreRef = ref<HTMLElement | null>(null)

async function loadMore() {
  if (!hasMore.value) return
  const newPosts = await $fetch(\`/api/posts?page=\${page.value}\`)
  if (newPosts.length === 0) {
    hasMore.value = false
    return
  }
  posts.value.push(...newPosts)
  page.value++
}

// 當 loadMoreRef 進入視窗時自動載入
useIntersectionObserver(loadMoreRef, ([{ isIntersecting }]) => {
  if (isIntersecting) loadMore()
})

onMounted(() => loadMore())
<\/script>

<template>
  <div v-for="post in posts" :key="post.id" class="post-card">
    {{ post.title }}
  </div>
  <div ref="loadMoreRef" class="load-trigger">
    <span v-if="hasMore">載入中...</span>
    <span v-else>沒有更多了</span>
  </div>
</template>`

const localStorageExample = `<!-- 實戰 4：使用者設定持久化 -->
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'

interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: string
  fontSize: number
  sidebarCollapsed: boolean
}

// 自動序列化/反序列化 JSON，型別安全
const settings = useLocalStorage<AppSettings>('app-settings', {
  theme: 'system',
  language: 'zh-TW',
  fontSize: 16,
  sidebarCollapsed: false,
})

// 直接修改 settings.value，自動同步到 localStorage
function resetSettings() {
  settings.value = {
    theme: 'system',
    language: 'zh-TW',
    fontSize: 16,
    sidebarCollapsed: false,
  }
}
<\/script>`

const draggableExample = `<!-- 實戰 5：可拖拽面板 -->
<script setup lang="ts">
import { useDraggable } from '@vueuse/core'

const panelRef = ref<HTMLElement | null>(null)

const { x, y, style } = useDraggable(panelRef, {
  initialValue: { x: 100, y: 100 },
  // 限制在視窗內
  onMove({ x, y }) {
    const maxX = window.innerWidth - 300
    const maxY = window.innerHeight - 200
    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    }
  },
})
<\/script>

<template>
  <div ref="panelRef" :style="style" class="floating-panel">
    拖拽我！ ({{ Math.round(x) }}, {{ Math.round(y) }})
  </div>
</template>`

const networkExample = `<!-- 實戰 6：網路狀態感知 -->
<script setup lang="ts">
import { useNetwork, useOnline, usePageLeave } from '@vueuse/core'

const isOnline = useOnline()

const { isSupported, type, downlink, rtt, effectiveType } = useNetwork()
// type: 'wifi' | '4g' | '3g' | '2g' | 'slow-2g' | 'ethernet' | 'none' | 'unknown'
// effectiveType: '4g' | '3g' | '2g' | 'slow-2g'

// 離線時顯示提示，恢復後自動重試
watch(isOnline, (online) => {
  if (online) {
    notify('網路已恢復，正在同步資料...')
    syncPendingData()
  } else {
    notify('網路已斷線，部分功能可能無法使用', 'warning')
  }
})

// 低網速時降低圖片品質
const imageQuality = computed(() => {
  if (effectiveType.value === '4g') return 'high'
  if (effectiveType.value === '3g') return 'medium'
  return 'low'
})
<\/script>

<template>
  <div v-if="!isOnline" class="offline-banner">
    ⚠️ 目前離線，顯示快取資料
  </div>
</template>`

const clipboardExample = `<!-- 實戰 7：一鍵複製 + 鍵盤快捷鍵 -->
<script setup lang="ts">
import { useClipboard, onKeyStroke, useMagicKeys } from '@vueuse/core'

const { copy, copied, isSupported } = useClipboard()

// 複製分享連結
const shareUrl = computed(() => window.location.href)

// 鍵盤快捷鍵
const { ctrl_k, meta_k } = useMagicKeys()

// Cmd+K / Ctrl+K 開啟搜尋
watch([ctrl_k, meta_k], ([ctrlK, metaK]) => {
  if (ctrlK || metaK) openSearch()
})

// 阻止預設行為
onKeyStroke('k', (e) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
  }
})
<\/script>

<template>
  <button v-if="isSupported" @click="copy(shareUrl)">
    {{ copied ? '✅ 已複製！' : '📋 複製連結' }}
  </button>
</template>`
</script>

<template>
  <div class="content-wrapper">
    <h1>VueUse 實戰</h1>
    <p class="page-subtitle">200+ Composable 的真實場景應用 — 搜尋防抖、深色模式、無限捲動、拖拽、網路感知</p>

    <div class="info-box info">
      <div class="info-box-title">📌 安裝</div>
      <p>
        <code>npm install @vueuse/core</code><br>
        Nuxt 3 請改用 <code>@vueuse/nuxt</code> 模組，可以自動導入所有 Composable。
      </p>
    </div>

    <h2>實戰 1：搜尋防抖</h2>
    <p>輸入時使用 <code>useDebounce</code> 延遲觸發 API，避免每個字都發送請求。</p>
    <CodeBlock lang="html" filename="SearchInput.vue" :code="searchExample" />

    <h2>實戰 2：深色模式切換</h2>
    <p><code>useDark</code> 自動偵測系統主題偏好、同步到 HTML class、並持久化到 localStorage。</p>
    <CodeBlock lang="html" filename="DarkModeToggle.vue" :code="darkModeExample" />

    <h2>實戰 3：無限捲動列表</h2>
    <p><code>useIntersectionObserver</code> 監聽觸底元素進入視窗，自動觸發下一頁載入。</p>
    <CodeBlock lang="html" filename="InfiniteList.vue" :code="infiniteScrollExample" />

    <h2>實戰 4：使用者設定持久化</h2>
    <p><code>useLocalStorage</code> 提供完全響應式的 localStorage 存取，自動 JSON 序列化，支援 TypeScript 泛型。</p>
    <CodeBlock lang="html" filename="useSettings.ts" :code="localStorageExample" />

    <h2>實戰 5：可拖拽面板</h2>
    <p><code>useDraggable</code> 讓任何元素可拖拽，支援限制範圍、初始位置、自訂邊界邏輯。</p>
    <CodeBlock lang="html" filename="FloatingPanel.vue" :code="draggableExample" />

    <h2>實戰 6：網路狀態感知</h2>
    <p><code>useNetwork</code> 提供連線類型、速度等資訊，可根據網路品質動態調整 UI 策略。</p>
    <CodeBlock lang="html" filename="NetworkAware.vue" :code="networkExample" />

    <h2>實戰 7：剪貼簿 + 鍵盤快捷鍵</h2>
    <p><code>useClipboard</code> 提供 copy/copied 響應式狀態；<code>useMagicKeys</code> 優雅處理組合鍵。</p>
    <CodeBlock lang="html" filename="KeyboardShortcuts.vue" :code="clipboardExample" />

    <h2>常用 Composable 速查</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>分類</th>
            <th>Composable</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowspan="3">狀態</td>
            <td><code>useLocalStorage</code></td>
            <td>響應式 localStorage（自動 JSON 序列化）</td>
          </tr>
          <tr>
            <td><code>useSessionStorage</code></td>
            <td>響應式 sessionStorage</td>
          </tr>
          <tr>
            <td><code>useRefHistory</code></td>
            <td>ref 的歷史紀錄（undo/redo）</td>
          </tr>
          <tr>
            <td rowspan="3">網路</td>
            <td><code>useNetwork</code></td>
            <td>網路連線狀態與速度</td>
          </tr>
          <tr>
            <td><code>useOnline</code></td>
            <td>是否連線（boolean）</td>
          </tr>
          <tr>
            <td><code>useFetch</code></td>
            <td>響應式 fetch（帶 abort、重試）</td>
          </tr>
          <tr>
            <td rowspan="3">DOM</td>
            <td><code>useIntersectionObserver</code></td>
            <td>元素進入/離開視窗</td>
          </tr>
          <tr>
            <td><code>useResizeObserver</code></td>
            <td>元素尺寸變化</td>
          </tr>
          <tr>
            <td><code>useDraggable</code></td>
            <td>拖拽元素</td>
          </tr>
          <tr>
            <td rowspan="3">動畫</td>
            <td><code>useDebounce / useThrottle</code></td>
            <td>防抖 / 節流</td>
          </tr>
          <tr>
            <td><code>useTransition</code></td>
            <td>數值動畫插值（計數器動畫）</td>
          </tr>
          <tr>
            <td><code>useAnimate</code></td>
            <td>Web Animations API 封裝</td>
          </tr>
          <tr>
            <td rowspan="2">UI</td>
            <td><code>useDark</code></td>
            <td>深色模式（含系統偵測 + 持久化）</td>
          </tr>
          <tr>
            <td><code>useClipboard</code></td>
            <td>複製到剪貼簿</td>
          </tr>
          <tr>
            <td rowspan="2">鍵盤</td>
            <td><code>onKeyStroke</code></td>
            <td>監聽特定按鍵</td>
          </tr>
          <tr>
            <td><code>useMagicKeys</code></td>
            <td>組合鍵（Ctrl+K、Cmd+K 等）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/intro', label: 'Vue 生態系總覽' }"
      :next="{ path: '/vue/ecosystem/router', label: 'Vue Router 實戰' }"
    />
  </div>
</template>
