<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const authGuardExample = `// router/index.ts — 完整 Auth 導航守衛
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/',          component: () => import('@/views/Home.vue') },
    { path: '/login',     component: () => import('@/views/Login.vue'), meta: { guestOnly: true } },
    {
      path: '/dashboard',
      component: () => import('@/views/DashboardLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '',       component: () => import('@/views/DashboardHome.vue') },
        { path: 'users',  component: () => import('@/views/Users.vue'), meta: { roles: ['admin'] } },
        { path: 'profile',component: () => import('@/views/Profile.vue') },
      ],
    },
    { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFound.vue') },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  // 首次進入頁面時恢復登入狀態
  if (!auth.initialized) await auth.initialize()

  // 訪客專用頁面（已登入不能進）
  if (to.meta.guestOnly && auth.isLoggedIn) {
    return { path: '/dashboard' }
  }

  // 需要登入的頁面
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  // 角色權限檢查
  const requiredRoles = to.meta.roles as string[] | undefined
  if (requiredRoles && !requiredRoles.some(r => auth.user?.roles.includes(r))) {
    return { path: '/403' }
  }
})

export default router`

const progressBarExample = `// router/progress.ts — NProgress 進度條整合
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'

NProgress.configure({ showSpinner: false, speed: 300 })

router.beforeEach(() => { NProgress.start() })
router.afterEach(() => { NProgress.done() })
router.onError(() => { NProgress.done() })

// 搭配頁面切換追蹤（Google Analytics）
router.afterEach((to) => {
  gtag('config', 'G-XXXXXXX', { page_path: to.fullPath })
})`

const routeTransitionExample = `<!-- App.vue — 動態頁面過渡動畫 -->
<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// 根據路由 meta 決定過渡動畫
const transitionName = computed(() =>
  route.meta.transition as string ?? 'fade'
)
<\/script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="route.meta.transition ?? 'fade'" mode="out-in">
      <component :is="Component" :key="route.path" />
    </Transition>
  </RouterView>
</template>

<style>
/* Fade 過渡 */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

/* Slide 過渡 */
.slide-enter-active, .slide-leave-active { transition: transform 0.3s; }
.slide-enter-from { transform: translateX(100%); }
.slide-leave-to  { transform: translateX(-100%); }
</style>`

const queryBindingExample = `<!-- 實戰：查詢參數雙向綁定（搜尋 + 過濾 + 分頁）-->
<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// 從 URL 讀取查詢參數
const search = computed({
  get: () => (route.query.q as string) ?? '',
  set: (val) => updateQuery({ q: val || undefined, page: undefined }),
})

const page = computed({
  get: () => Number(route.query.page ?? 1),
  set: (val) => updateQuery({ page: val > 1 ? val : undefined }),
})

const status = computed({
  get: () => (route.query.status as string) ?? 'all',
  set: (val) => updateQuery({ status: val !== 'all' ? val : undefined }),
})

// 更新 URL（不觸發頁面跳轉）
function updateQuery(patch: Record<string, unknown>) {
  router.replace({
    query: { ...route.query, ...patch },
  })
}

// 資料取得（URL 變化時自動重新請求）
const { data: users, pending } = await useFetch('/api/users', {
  query: { q: search, page, status },
  watch: [search, page, status],
})
<\/script>

<template>
  <input v-model="search" placeholder="搜尋使用者..." />
  <select v-model="status">
    <option value="all">全部</option>
    <option value="active">啟用</option>
    <option value="inactive">停用</option>
  </select>

  <div v-for="user in users?.items" :key="user.id">{{ user.name }}</div>

  <!-- 分頁 -->
  <button :disabled="page <= 1" @click="page--">上一頁</button>
  <span>第 {{ page }} 頁</span>
  <button :disabled="!users?.hasMore" @click="page++">下一頁</button>
</template>`

const lazyRoutesExample = `// router/index.ts — 路由分組懶加載 + 預載
const router = createRouter({
  routes: [
    {
      path: '/admin',
      // 同一 chunk 打包（webpackChunkName → Rollup manualChunks）
      component: () => import(/* webpackChunkName: "admin" */ '@/layouts/AdminLayout.vue'),
      children: [
        { path: 'users',   component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/Users.vue') },
        { path: 'settings',component: () => import(/* webpackChunkName: "admin" */ '@/views/admin/Settings.vue') },
      ],
    },
  ],
})

// 預載（滑鼠 hover 時提前載入）
function prefetchRoute(path: string) {
  const matched = router.resolve(path).matched
  matched.forEach(({ components }) => {
    Object.values(components ?? {}).forEach(component => {
      if (typeof component === 'function') component()
    })
  })
}

// 在 <RouterLink> 上使用
// <RouterLink to="/admin/users" @mouseenter="prefetchRoute('/admin/users')">`

const routeMetaType = `// router/types.ts — 擴充 RouteMeta 型別
import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guestOnly?: boolean
    roles?: string[]
    transition?: 'fade' | 'slide'
    title?: string
  }
}

// router/index.ts — 動態 document.title
router.afterEach((to) => {
  const title = to.meta.title
  document.title = title ? \`\${title} | MyApp\` : 'MyApp'
})`
</script>

<template>
  <div class="content-wrapper">
    <h1>Vue Router 進階實戰</h1>
    <p class="page-subtitle">Auth 守衛、角色權限、進度條、頁面過渡、URL 查詢綁定、懶加載</p>

    <h2>實戰 1：完整 Auth 導航守衛</h2>
    <p>
      生產環境常見需求：首次進入恢復登入狀態、訪客專用頁面攔截、需登入頁面重定向、角色權限檢查。
    </p>
    <CodeBlock lang="typescript" filename="router/index.ts" :code="authGuardExample" />

    <h2>實戰 2：頁面載入進度條</h2>
    <p>搭配 <code>nprogress</code> 在路由切換時顯示頂部進度條，提升使用體驗。</p>
    <CodeBlock lang="typescript" filename="router/progress.ts" :code="progressBarExample" />

    <h2>實戰 3：頁面過渡動畫</h2>
    <p>使用 <code>RouterView</code> 的 v-slot 搭配 <code>&lt;Transition&gt;</code> 實現頁面切換動畫，可根據路由 meta 動態切換動畫類型。</p>
    <CodeBlock lang="html" filename="App.vue — 動態過渡動畫" :code="routeTransitionExample" />

    <h2>實戰 4：URL 查詢參數雙向綁定</h2>
    <p>
      將搜尋、過濾、分頁等狀態綁定到 URL query params，讓使用者可以分享/書籤當前頁面狀態，
      瀏覽器前後退也能正確恢復。
    </p>
    <CodeBlock lang="html" filename="UserList.vue — URL 狀態綁定" :code="queryBindingExample" />

    <h2>實戰 5：路由懶加載 & 預載</h2>
    <p>
      將相關頁面打包到同一 chunk（減少 HTTP 請求），並在 hover 時預載，消除首次點擊的延遲感。
    </p>
    <CodeBlock lang="typescript" filename="懶加載 + 預載策略" :code="lazyRoutesExample" />

    <h2>實戰 6：RouteMeta 型別擴充</h2>
    <p>透過 TypeScript Module Augmentation 擴充 RouteMeta，獲得完整的型別安全。</p>
    <CodeBlock lang="typescript" filename="router/types.ts — RouteMeta 型別定義" :code="routeMetaType" />

    <div class="info-box info">
      <div class="info-box-title">📌 重要模式總結</div>
      <p>
        <strong>導航守衛順序：</strong> beforeEach → beforeEnter（路由） → beforeRouteEnter（組件） → afterEach<br>
        <strong>重定向 vs replace：</strong> 守衛中 return 物件 = replace（不留歷史）；<code>router.push</code> 留歷史記錄<br>
        <strong>Composition API 守衛：</strong> <code>onBeforeRouteLeave</code> 取代 Options API 的 <code>beforeRouteLeave</code>
      </p>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/vueuse', label: 'VueUse 實戰' }"
      :next="{ path: '/vue/ecosystem/vitest', label: 'Vitest 測試實戰' }"
    />
  </div>
</template>
