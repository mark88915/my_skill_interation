<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const optionStoreExample = `// stores/counter.ts — Option Store 寫法（類似 Vuex）
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  // state — 類似 data()
  state: () => ({
    count: 0,
    name: 'Counter',
  }),

  // getters — 類似 computed
  getters: {
    double: (state) => state.count * 2,
    doubleCount(): number {
      return this.count * 2  // 也可用 this，但無法自動推斷型別
    },
  },

  // actions — 類似 methods（支援 async）
  actions: {
    increment(step = 1) {
      this.count += step
    },
    async fetchCount() {
      const data = await fetch('/api/count').then(r => r.json())
      this.count = data.value
    },
  },
})`

const setupStoreExample = `// stores/user.ts — Setup Store 寫法（推薦）
import { defineStore } from 'pinia'

interface User {
  id: number
  name: string
  email: string
}

export const useUserStore = defineStore('user', () => {
  // state — ref / reactive
  const user = ref<User | null>(null)
  const isLoading = ref(false)

  // getters — computed
  const isLoggedIn = computed(() => user.value !== null)
  const displayName = computed(() => user.value?.name ?? '訪客')

  // actions — 函式（支援 async）
  async function login(email: string, password: string) {
    isLoading.value = true
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password },
      })
      user.value = data.user
    } finally {
      isLoading.value = false
    }
  }

  function logout() {
    user.value = null
  }

  return { user, isLoading, isLoggedIn, displayName, login, logout }
})`

const patchResetExample = `import { useCounterStore } from '~/stores/counter'

const counter = useCounterStore()

// 方法 1：直接修改（適合單一屬性）
counter.count++

// 方法 2：$patch 物件（適合同時修改多個屬性，只觸發一次響應）
counter.$patch({ count: 10, name: 'New Name' })

// 方法 3：$patch 函式（適合複雜邏輯）
counter.$patch((state) => {
  state.count = state.count > 100 ? 0 : state.count + 1
})

// $reset — 重置 state 回初始值（僅 Option Store 支援）
counter.$reset()

// $subscribe — 監聽 state 變更（類似 watch）
counter.$subscribe((mutation, state) => {
  // mutation.type: 'direct' | 'patch object' | 'patch function'
  // 儲存到 localStorage
  localStorage.setItem('counter', JSON.stringify(state))
})

// $onAction — 監聽 action 呼叫
counter.$onAction(({ name, args, after, onError }) => {
  console.log('Action:', name, args)
  after((result) => console.log('Result:', result))
  onError((error) => console.error('Error:', error))
})`

const storeCompositionExample = `// stores/cart.ts — Store 間組合
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const userStore = useUserStore()  // 在 Setup Store 中直接使用其他 store

  const items = ref<CartItem[]>([])

  const total = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.qty, 0)
  )

  async function checkout() {
    if (!userStore.isLoggedIn) {
      throw new Error('請先登入')
    }
    await $fetch('/api/orders', {
      method: 'POST',
      body: {
        userId: userStore.user!.id,
        items: items.value,
      },
    })
    items.value = []
  }

  return { items, total, checkout }
})`

const persistPlugin = `// 安裝
// npm install pinia-plugin-persistedstate

// main.ts / plugins/pinia.ts (Nuxt)
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// stores/user.ts — 啟用持久化
export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const user = ref<User | null>(null)
  // ...
  return { token, user }
}, {
  persist: {
    // 儲存到 localStorage（預設）
    storage: localStorage,
    // 只持久化指定欄位
    pick: ['token'],
    // 自訂 key
    key: 'myapp-user',
    // 使用 sessionStorage
    // storage: sessionStorage,
    // 使用 cookie（Nuxt SSR 友好）
    // storage: useCookie('user'),
  }
})`

const storeDevtools = `// Pinia Devtools 整合 — 安裝 Vue DevTools 即可

// 在 DevTools 中可以：
// 1. 查看所有 store 的當前 state
// 2. 直接修改 state 值（即時更新頁面）
// 3. 時間旅行（Time Travel）— 回溯到某個 state 快照
// 4. 追蹤每個 action 的呼叫紀錄與 payload

// 在測試中 mock store
import { setActivePinia, createPinia } from 'pinia'
import { useCounterStore } from '@/stores/counter'

beforeEach(() => {
  setActivePinia(createPinia())
})

test('increments', () => {
  const counter = useCounterStore()
  expect(counter.count).toBe(0)
  counter.increment()
  expect(counter.count).toBe(1)
})`
</script>

<template>
  <div class="content-wrapper">
    <h1>Pinia 狀態管理</h1>
    <p class="page-subtitle">Vue 官方推薦的狀態管理庫，輕量、型別友好、完整 Devtools 支援</p>

    <h2>為什麼選 Pinia？</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>特性</th>
            <th>Vuex 4</th>
            <th>Pinia</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>TypeScript 支援</td>
            <td>❌ 需大量型別宣告</td>
            <td>✅ 完整自動推斷</td>
          </tr>
          <tr>
            <td>Mutations</td>
            <td>必須透過 mutation 修改 state</td>
            <td>✅ 直接修改，無需 mutation</td>
          </tr>
          <tr>
            <td>模組化</td>
            <td>巢狀 modules，namespaced 繁瑣</td>
            <td>✅ 每個 store 獨立，扁平化</td>
          </tr>
          <tr>
            <td>Bundle Size</td>
            <td>~10 KB</td>
            <td>✅ ~1.5 KB</td>
          </tr>
          <tr>
            <td>Devtools</td>
            <td>有，但功能有限</td>
            <td>✅ 完整 time-travel、action 追蹤</td>
          </tr>
          <tr>
            <td>SSR 支援</td>
            <td>需額外處理</td>
            <td>✅ 開箱即用（Nuxt 整合）</td>
          </tr>
          <tr>
            <td>Store 組合</td>
            <td>跨模組存取繁瑣</td>
            <td>✅ Store 間直接 import 使用</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="info-box info">
      <div class="info-box-title">📌 Vue 官方推薦</div>
      <p>
        Pinia 現為 Vue 3 官方推薦的狀態管理方案，Vuex 5 的開發已由 Pinia 取代。
        新專案應使用 Pinia，舊 Vuex 專案有官方遷移指南。
      </p>
    </div>

    <h2>Option Store 寫法</h2>
    <p>類似 Vue Options API 的風格，有 <code>state</code>、<code>getters</code>、<code>actions</code> 三個區塊，上手容易。</p>
    <CodeBlock lang="typescript" filename="stores/counter.ts（Option Store）" :code="optionStoreExample" />

    <h2>Setup Store 寫法（推薦）</h2>
    <p>
      類似 Vue Composition API 的風格，使用 <code>ref</code>/<code>reactive</code> 定義 state、
      <code>computed</code> 定義 getters、普通函式定義 actions。
      <strong>TypeScript 型別推斷更完整</strong>，也更靈活。
    </p>
    <CodeBlock lang="typescript" filename="stores/user.ts（Setup Store）" :code="setupStoreExample" />

    <h2>$patch、$reset、$subscribe</h2>
    <CodeBlock lang="typescript" filename="store 的輔助方法" :code="patchResetExample" />

    <h2>Store 間組合</h2>
    <p>
      Pinia 採用扁平化設計，各 store 平等獨立。Store 之間可以直接 import 並使用彼此的 state 和 action，
      無需 Vuex 的 <code>rootState</code> 或 namespace。
    </p>
    <CodeBlock lang="typescript" filename="stores/cart.ts — 使用其他 store" :code="storeCompositionExample" />

    <h2>持久化：pinia-plugin-persistedstate</h2>
    <p>
      透過 <code>pinia-plugin-persistedstate</code> 可以將 store state 同步到 localStorage、
      sessionStorage 或 Cookie（Nuxt SSR 友好）。
    </p>
    <CodeBlock lang="typescript" filename="持久化設定" :code="persistPlugin" />

    <h2>Devtools & 測試</h2>
    <CodeBlock lang="typescript" filename="Devtools 功能 & 單元測試" :code="storeDevtools" />

    <h2>在組件中使用 Pinia</h2>
    <CodeBlock lang="html" filename="組件範例" :code="`<script setup lang='ts'>
import { useUserStore } from '~/stores/user'
import { storeToRefs } from 'pinia'

const userStore = useUserStore()

// storeToRefs — 解構 state/getters 保持響應性
// 注意：actions 不需要用 storeToRefs，直接解構即可
const { user, isLoggedIn, displayName } = storeToRefs(userStore)
const { login, logout } = userStore  // actions 直接解構
<\/script>

<template>
  <div v-if='isLoggedIn'>
    <p>歡迎，{{ displayName }}</p>
    <button @click='logout'>登出</button>
  </div>
  <button v-else @click='login(email, password)'>登入</button>
</template>`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 常見錯誤</div>
      <p>
        <strong>直接解構 store</strong> 會失去響應性：<br>
        <code>const &#123; count &#125; = useCounterStore()</code> ← count 不是響應式的<br>
        <br>
        <strong>正確做法</strong>：使用 <code>storeToRefs</code> 解構 state/getters，actions 直接解構。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/vue/nuxt/intro', label: 'Nuxt 3 概述' }"
      :next="{ path: '/vue/ecosystem/intro', label: 'Vue 生態系' }"
    />
  </div>
</template>
