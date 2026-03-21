<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const nuxtConfigExample = `// nuxt.config.ts
export default defineNuxtConfig({
  // 混合渲染：按路由設定渲染模式
  routeRules: {
    '/':           { prerender: true },     // SSG 靜態生成
    '/blog/**':    { isr: 3600 },           // ISR 每 1 小時重新生成
    '/dashboard':  { ssr: false },          // CSR 純客戶端（需登入）
    '/api/**':     { cors: true },          // API 路由設定
  },

  // 模組
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    'nuxt-icon',
  ],

  // 執行時設定（伺服器端也可存取）
  runtimeConfig: {
    // 只在伺服器端可用
    apiSecret: process.env.API_SECRET,
    // 公開設定（客戶端也可用）
    public: {
      apiBase: process.env.API_BASE || '/api',
      appName: 'MyApp',
    }
  },

  // TypeScript
  typescript: { strict: true },

  // CSS / UI
  css: ['~/assets/css/main.css'],
})`

const fileRoutingExample = `pages/
├── index.vue              → /
├── about.vue              → /about
├── blog/
│   ├── index.vue          → /blog
│   ├── [slug].vue         → /blog/:slug     (動態路由)
│   └── [...path].vue      → /blog/*         (catch-all)
├── user/
│   ├── [id]/
│   │   ├── index.vue      → /user/:id
│   │   └── settings.vue   → /user/:id/settings
│   └── (group)/           → 路由群組（不影響 URL）
│       └── profile.vue    → /profile
└── admin/
    └── index.vue          → /admin`

const serverRoutesExample = `// server/api/users/[id].get.ts — GET /api/users/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  // 連接資料庫（使用 Nitro 的 server utils）
  const user = await db.user.findUnique({ where: { id: Number(id) } })

  if (!user) {
    throw createError({ statusCode: 404, message: 'User not found' })
  }

  return user
})

// server/api/users/index.post.ts — POST /api/users
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  // 驗證輸入
  const { name, email } = body
  if (!name || !email) {
    throw createError({ statusCode: 400, message: 'Missing fields' })
  }

  const user = await db.user.create({ data: { name, email } })
  return user
})

// server/middleware/auth.ts — 所有請求的中間件
export default defineEventHandler((event) => {
  const token = getCookie(event, 'auth_token')
  if (!token && event.path.startsWith('/api/admin')) {
    throw createError({ statusCode: 401, message: 'Unauthorized' })
  }
})`

const useFetchBasicExample = `<!-- useFetch 基礎 — SSR 友好的資料取得 -->
<script setup lang="ts">
interface Post { id: number; title: string; body: string }

// 基本用法：伺服器端取得資料後序列化傳給客戶端（不會二次請求）
const { data: posts, pending, error, refresh } = await useFetch<Post[]>('/api/posts')
<\/script>

<template>
  <div v-if="pending">載入中...</div>
  <div v-else-if="error">錯誤：{{ error.message }}</div>
  <ul v-else>
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
    <button @click="refresh()">重新整理</button>
  </ul>
</template>`

const useFetchAdvancedExample = `<!-- useFetch 進階 — 動態參數 + 查詢字串 + 轉換 -->
<script setup lang="ts">
const page = ref(1)
const search = ref('')

// URL 和 query 可以是 computed 或 ref，變動時自動重新請求
const { data, pending } = await useFetch('/api/posts', {
  // 響應式查詢參數
  query: { page, search, limit: 10 },

  // 轉換回應資料（不影響快取的原始資料）
  transform: (data) => ({
    items: data.items.map(p => ({ ...p, titleUpper: p.title.toUpperCase() })),
    total: data.total,
  }),

  // 只取需要的欄位（減少序列化資料量）
  pick: ['items', 'total'],

  // 監聽哪些 ref 變化時重新請求（預設監聽所有 reactive 依賴）
  watch: [page, search],

  // 快取鍵（相同 key 共享快取）
  key: 'posts-list',
})`

const useFetchLazyExample = `<!-- useFetch lazy 模式 — 不阻塞頁面導航 -->
<script setup lang="ts">
// lazy: true → 不在 setup 中 await，立即導航到頁面
// 適合：次要資料、非關鍵資訊
const { data: recommendations, pending } = useFetch('/api/recommendations', {
  lazy: true,    // 不阻塞導航
  server: false, // 只在客戶端執行（不需要 SSR）
})

// 搭配 useFetch POST（帶 body）
const { data: result, execute } = useFetch('/api/search', {
  method: 'POST',
  body: { query: 'Vue 3' },
  immediate: false,  // 不立即執行，等待手動呼叫
})

// 手動觸發
function doSearch() {
  execute()
}
<\/script>

<template>
  <!-- 次要內容可以有 loading 狀態 -->
  <div class="recommendations">
    <div v-if="pending" class="skeleton" />
    <RecommendCard v-else v-for="item in recommendations" :key="item.id" :data="item" />
  </div>
</template>`

const useAsyncDataExample = `<!-- useAsyncData — 非 fetch 的非同步操作 + 快取控制 -->
<script setup lang="ts">
// 適合：使用第三方 SDK、複雜資料組合、需要精確快取控制

// 1. 基本用法：手動指定 key（相同 key 在整個應用共享快取）
const { data: user } = await useAsyncData('current-user', () =>
  userService.getCurrentUser()
)

// 2. 動態 key（依賴變化時重新請求）
const userId = useRoute().params.id
const { data: profile } = await useAsyncData(
  \`user-\${userId}\`,
  () => $fetch(\`/api/users/\${userId}\`)
)

// 3. getCachedData — 自訂快取策略（實現 SWR 或 ISR 效果）
const { data: config } = await useAsyncData('app-config', () =>
  $fetch('/api/config'),
  {
    // 若快取存在且未過期，直接回傳（不重新請求）
    getCachedData(key, nuxtApp) {
      const cached = nuxtApp.payload.data[key]
      if (!cached) return null
      // 快取 5 分鐘
      const expiry = new Date(cached._cachedAt)
      expiry.setMinutes(expiry.getMinutes() + 5)
      if (new Date() > expiry) return null
      return cached
    },
    transform: (data) => ({ ...data, _cachedAt: new Date().toISOString() }),
  }
)

// 4. 合併多個請求
const [{ data: posts }, { data: tags }] = await Promise.all([
  useAsyncData('posts', () => $fetch('/api/posts')),
  useAsyncData('tags',  () => $fetch('/api/tags')),
])`

const fetchClientExample = `// $fetch — 程式化 API 呼叫（不快取）
// 適合：表單送出、POST/PUT/DELETE、需要手動控制的請求

// 1. 基本呼叫（自動推斷型別）
const newPost = await $fetch('/api/posts', {
  method: 'POST',
  body: { title: '新文章', content: '內容...' },
})

// 2. 在 Server Route 中呼叫外部 API（帶 Secret Key）
// server/api/weather.ts
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  // config.weatherApiKey 只在伺服器端可用（不暴露給客戶端）
  return await $fetch('https://api.weather.com/forecast', {
    headers: { Authorization: \`Bearer \${config.weatherApiKey}\` },
  })
})

// 3. 自訂 $fetch 實例（全域攔截器）
// plugins/api.ts
export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    baseURL: '/api',
    onRequest({ options }) {
      const auth = useAuthStore()
      options.headers.set('Authorization', \`Bearer \${auth.token}\`)
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    },
  })

  return { provide: { api } }
})

// 組件中使用
const { $api } = useNuxtApp()
const users = await $api('/users')  // 自動帶上 token`

const useStateExample = `<!-- useState — 跨組件 SSR 友好的共享狀態 -->
<script setup lang="ts">
// useState 的狀態在 SSR 和客戶端之間自動 hydration
// 相同 key 在所有組件中共享同一個 ref

// composables/useCart.ts
export function useCart() {
  const items = useState<CartItem[]>('cart', () => [])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  )

  function addItem(product: Product) {
    const existing = items.value.find(i => i.id === product.id)
    if (existing) {
      existing.qty++
    } else {
      items.value.push({ ...product, qty: 1 })
    }
  }

  function removeItem(id: number) {
    items.value = items.value.filter(i => i.id !== id)
  }

  return { items, total, addItem, removeItem }
}

// 任何組件直接使用，狀態共享
const { items, total, addItem } = useCart()
<\/script>`

const autoImportExample = `// Nuxt 3 自動導入 — 無需 import 語句！

// Vue API（ref, computed, watch...）
const count = ref(0)
const double = computed(() => count.value * 2)

// Nuxt Composables（useRouter, useFetch...）
const route = useRoute()
const router = useRouter()
const { data } = await useFetch('/api/data')

// 自訂 Composables（放在 composables/ 目錄下自動可用）
// composables/useUser.ts → useUser() 可直接使用

// components/ 目錄下的組件也自動導入
// components/MyButton.vue → <MyButton /> 可直接使用
// components/ui/Card.vue  → <UiCard />  (路徑轉為組件名)`

const nuxtLayersExample = `// Nuxt Layers — 類似 extends 的模組化方案
// nuxt.config.ts
export default defineNuxtConfig({
  extends: [
    '../ui-layer',         // 本地共用 UI 層
    '@myorg/base-layer',   // npm 套件形式的共用層
  ]
})

// ui-layer/nuxt.config.ts — 共用 UI 組件層
export default defineNuxtConfig({
  components: [{ path: './components', global: true }],
  css: ['./assets/ui.css'],
})`
</script>

<template>
  <div class="content-wrapper">
    <h1>Nuxt 3 概述</h1>
    <p class="page-subtitle">全端 Vue 框架 — SSR、SSG、混合渲染、自動導入、Server Routes</p>

    <h2>Vue 3 vs Nuxt 3</h2>
    <p>Nuxt 3 是建立在 Vue 3 之上的全端框架，提供了 Vue 3 沒有的許多開箱即用特性：</p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>特性</th>
            <th>Vue 3（純前端）</th>
            <th>Nuxt 3（全端框架）</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>渲染模式</td>
            <td>CSR（客戶端）</td>
            <td>SSR / SSG / ISR / CSR / 混合</td>
          </tr>
          <tr>
            <td>路由</td>
            <td>需安裝 Vue Router，手動設定</td>
            <td>檔案式路由，自動生成</td>
          </tr>
          <tr>
            <td>API / 後端</td>
            <td>需另建後端服務</td>
            <td>內建 Server Routes（Nitro 引擎）</td>
          </tr>
          <tr>
            <td>Import</td>
            <td>手動 import 所有依賴</td>
            <td>自動導入 Vue API、Composables、組件</td>
          </tr>
          <tr>
            <td>SEO</td>
            <td>需額外設定（vite-ssr 等）</td>
            <td>內建 useHead、useSeoMeta</td>
          </tr>
          <tr>
            <td>資料取得</td>
            <td>手動 onMounted + fetch</td>
            <td>useFetch / useAsyncData（SSR 友好）</td>
          </tr>
          <tr>
            <td>部署</td>
            <td>靜態檔案 hosting</td>
            <td>Node.js / Serverless / Edge / 靜態 多種目標</td>
          </tr>
          <tr>
            <td>狀態管理</td>
            <td>需安裝 Pinia</td>
            <td>內建 useState + 一鍵整合 @pinia/nuxt</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>渲染模式</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>模式</th>
            <th>說明</th>
            <th>適合場景</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SSR</strong></td>
            <td>每次請求在伺服器端渲染 HTML</td>
            <td>動態頁面、需要 SEO 的首頁</td>
          </tr>
          <tr>
            <td><strong>SSG</strong></td>
            <td>Build 時靜態生成 HTML（prerender）</td>
            <td>部落格、文件站、行銷頁</td>
          </tr>
          <tr>
            <td><strong>ISR</strong></td>
            <td>增量靜態再生成（Incremental Static Regeneration）</td>
            <td>商品頁、新聞站（定時更新）</td>
          </tr>
          <tr>
            <td><strong>SWR</strong></td>
            <td>Stale-While-Revalidate（先回快取再背景更新）</td>
            <td>即時性不高但快取有效的頁面</td>
          </tr>
          <tr>
            <td><strong>CSR</strong></td>
            <td>純客戶端渲染（同 Vue SPA）</td>
            <td>需要登入才能看到的 Dashboard</td>
          </tr>
          <tr>
            <td><strong>混合模式</strong></td>
            <td>不同路由使用不同渲染策略</td>
            <td>大型應用（首頁 SSG + Dashboard CSR）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>nuxt.config.ts — 核心設定</h2>
    <CodeBlock lang="typescript" filename="nuxt.config.ts" :code="nuxtConfigExample" />

    <h2>檔案式路由</h2>
    <p>
      Nuxt 3 的 <code>pages/</code> 目錄自動對應路由，無需手動設定 Vue Router。
      支援動態路由（<code>[param]</code>）、catch-all（<code>[...path]</code>）和路由群組（<code>(group)</code>）。
    </p>
    <CodeBlock lang="bash" filename="pages/ 目錄結構 → 路由對應" :code="fileRoutingExample" />

    <h2>Server Routes — 內建後端 API</h2>
    <p>
      Nuxt 3 透過 <strong>Nitro</strong> 引擎提供 Server Routes，讓你在同一個專案內撰寫後端 API，
      無需另建 Express/Fastify 服務。支援 GET/POST 等 HTTP 方法、中間件、以及部署到 Node.js、Cloudflare Workers、AWS Lambda 等。
    </p>
    <CodeBlock lang="typescript" filename="server/api/ 目錄範例" :code="serverRoutesExample" />

    <h2>資料取得：useFetch</h2>
    <p>
      Nuxt 提供 SSR 友好的資料取得 Composable，在伺服器端取得資料後 <strong>序列化傳給客戶端</strong>（避免二次請求）。
    </p>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>適合場景</th>
            <th>特點</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>useFetch</code></td>
            <td>一般 HTTP 請求，URL 響應式</td>
            <td>自動快取、URL 變化自動重請求</td>
          </tr>
          <tr>
            <td><code>useAsyncData</code></td>
            <td>非 fetch 操作、複雜快取控制</td>
            <td>手動 key 管理、可用任意非同步函式</td>
          </tr>
          <tr>
            <td><code>$fetch</code></td>
            <td>表單送出、POST/PUT/DELETE</td>
            <td>不快取、可建立攔截器實例</td>
          </tr>
          <tr>
            <td><code>useState</code></td>
            <td>跨組件共享的 SSR 狀態</td>
            <td>自動 hydration，取代簡單的 Pinia store</td>
          </tr>
        </tbody>
      </table>
    </div>

    <CodeBlock lang="html" filename="useFetch 基礎用法" :code="useFetchBasicExample" />

    <CodeBlock lang="html" filename="useFetch 進階 — 動態參數 + transform" :code="useFetchAdvancedExample" />

    <CodeBlock lang="html" filename="useFetch lazy 模式 + immediate: false" :code="useFetchLazyExample" />

    <CodeBlock lang="html" filename="useAsyncData — 快取控制 + 多請求合併" :code="useAsyncDataExample" />

    <CodeBlock lang="typescript" filename="$fetch — 程式化呼叫 + 攔截器" :code="fetchClientExample" />

    <CodeBlock lang="html" filename="useState — 跨組件共享狀態" :code="useStateExample" />

    <h2>自動導入（Auto Imports）</h2>
    <p>
      Nuxt 3 最受歡迎的功能之一：自動導入 Vue API、Nuxt Composable、<code>composables/</code> 和 <code>components/</code>
      目錄中的自訂模組，<strong>完全無需手動 import</strong>。
    </p>
    <CodeBlock lang="typescript" filename="自動導入示範" :code="autoImportExample" />

    <h2>Nuxt Modules 生態系</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>模組</th>
            <th>功能</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>@pinia/nuxt</code></td>
            <td>Pinia 狀態管理（SSR 友好，自動 store hydration）</td>
          </tr>
          <tr>
            <td><code>@nuxtjs/tailwindcss</code></td>
            <td>Tailwind CSS 整合（自動 purge + JIT）</td>
          </tr>
          <tr>
            <td><code>@vueuse/nuxt</code></td>
            <td>VueUse 所有 Composable 自動導入</td>
          </tr>
          <tr>
            <td><code>nuxt-auth-utils</code></td>
            <td>輕量認證（Session-based，內建 OAuth providers）</td>
          </tr>
          <tr>
            <td><code>@nuxt/content</code></td>
            <td>MDX/Markdown 為基礎的 CMS，直接渲染 .md 檔案為頁面</td>
          </tr>
          <tr>
            <td><code>@nuxt/image</code></td>
            <td>自動圖片最佳化（WebP 轉換、lazy load、CDN 整合）</td>
          </tr>
          <tr>
            <td><code>@nuxtjs/i18n</code></td>
            <td>多語言支援（路由前綴、SEO meta、lazy loading 語系檔）</td>
          </tr>
          <tr>
            <td><code>nuxt-icon</code></td>
            <td>10 萬+ 圖示（Iconify），使用 &lt;Icon name="..." /&gt;</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Nuxt Layers — 跨專案複用</h2>
    <CodeBlock lang="typescript" filename="Nuxt Layers 範例" :code="nuxtLayersExample" />

    <div class="info-box success">
      <div class="info-box-title">✅ 何時選擇 Nuxt 而非 Vue SPA？</div>
      <p>
        ✅ 需要 SEO（行銷網站、部落格、電商）<br>
        ✅ 需要後端 API 但不想維護獨立服務<br>
        ✅ 想要全端 TypeScript 型別安全（前後端共用型別）<br>
        ✅ 需要靜態生成或增量再生成（ISR）<br>
        ❌ 純後台管理系統（無 SEO 需求）→ Vue SPA + Pinia 就夠了
      </p>
    </div>

    <PageNav
      :prev="{ path: '/vue/advanced/index', label: 'Vue 3 進階技術' }"
      :next="{ path: '/vue/pinia/intro', label: 'Pinia 狀態管理' }"
    />
  </div>
</template>
