<script setup>
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Vue 生態系</h1>
    <p class="page-subtitle">VueUse、Vue Router、Vitest、VeeValidate、Vue I18n、TanStack Query、shadcn-vue — 主流工具全覽</p>

    <h2>Vue 生態系全景</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>類別</th>
            <th>主流選擇</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>狀態管理</td>
            <td>Pinia</td>
            <td>官方推薦，輕量、TypeScript 友好</td>
          </tr>
          <tr>
            <td>路由</td>
            <td>Vue Router 4</td>
            <td>官方路由，支援 Composition API</td>
          </tr>
          <tr>
            <td>工具 Composables</td>
            <td>VueUse</td>
            <td>200+ 常用 Composable，開箱即用</td>
          </tr>
          <tr>
            <td>建構工具</td>
            <td>Vite</td>
            <td>快速 HMR，官方 Vue 插件</td>
          </tr>
          <tr>
            <td>UI 框架</td>
            <td>Vuetify / Quasar / PrimeVue / shadcn-vue</td>
            <td>成熟的組件庫</td>
          </tr>
          <tr>
            <td>無頭 UI</td>
            <td>Radix Vue / Headless UI</td>
            <td>無樣式、純邏輯，自行設計 UI</td>
          </tr>
          <tr>
            <td>表單驗證</td>
            <td>VeeValidate + Zod</td>
            <td>型別安全的表單驗證</td>
          </tr>
          <tr>
            <td>資料請求</td>
            <td>TanStack Query (Vue) / Axios</td>
            <td>Server State 管理，快取、重試</td>
          </tr>
          <tr>
            <td>全端框架</td>
            <td>Nuxt 3</td>
            <td>SSR/SSG、自動導入、Server Routes</td>
          </tr>
          <tr>
            <td>測試</td>
            <td>Vitest + Vue Test Utils</td>
            <td>Vite 原生測試框架</td>
          </tr>
          <tr>
            <td>多語言</td>
            <td>Vue I18n</td>
            <td>官方 i18n 方案，支援 Composition API</td>
          </tr>
          <tr>
            <td>動畫</td>
            <td>GSAP / Motion One / @vueuse/motion</td>
            <td>高性能動畫庫</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>工具詳細介紹與實戰</h2>
    <p>點擊下方各工具進入詳細頁面，包含概念說明與實戰範例：</p>

    <div class="home-cards" style="margin-top: 1.5rem;">
      <router-link to="/vue/ecosystem/vueuse" class="home-card">
        <div class="card-icon">🔧</div>
        <h3>VueUse 實戰</h3>
        <p>搜尋防抖、深色模式、無限捲動、可拖拽面板、網路狀態感知、剪貼簿操作。</p>
        <div class="topics">
          <span class="topic-tag">useDebounce</span>
          <span class="topic-tag">useDark</span>
          <span class="topic-tag">useIntersectionObserver</span>
          <span class="topic-tag">useDraggable</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/router" class="home-card">
        <div class="card-icon">🧭</div>
        <h3>Vue Router 進階實戰</h3>
        <p>Auth 導航守衛、角色權限、進度條、頁面過渡動畫、URL 查詢綁定、懶加載預載。</p>
        <div class="topics">
          <span class="topic-tag">Auth Guard</span>
          <span class="topic-tag">Role 權限</span>
          <span class="topic-tag">URL 綁定</span>
          <span class="topic-tag">Code Split</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/vitest" class="home-card">
        <div class="card-icon">🧪</div>
        <h3>Vitest 測試實戰</h3>
        <p>組件測試、Pinia Store 測試、Composable 測試、MSW API Mock、Coverage 設定。</p>
        <div class="topics">
          <span class="topic-tag">mount</span>
          <span class="topic-tag">@pinia/testing</span>
          <span class="topic-tag">MSW</span>
          <span class="topic-tag">Coverage</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/veevalidate" class="home-card">
        <div class="card-icon">✅</div>
        <h3>VeeValidate + Zod 實戰</h3>
        <p>登入表單、確認密碼跨欄位驗證、非同步驗證、動態陣列欄位、shadcn-vue 整合。</p>
        <div class="topics">
          <span class="topic-tag">useForm</span>
          <span class="topic-tag">Zod Schema</span>
          <span class="topic-tag">跨欄位驗證</span>
          <span class="topic-tag">非同步驗證</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/i18n" class="home-card">
        <div class="card-icon">🌏</div>
        <h3>Vue I18n 實戰</h3>
        <p>語系切換器、Lazy Loading 語系檔、數字日期格式化、Nuxt i18n 路由前綴整合。</p>
        <div class="topics">
          <span class="topic-tag">useI18n</span>
          <span class="topic-tag">Lazy Loading</span>
          <span class="topic-tag">複數形式</span>
          <span class="topic-tag">@nuxtjs/i18n</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/tanstack-query" class="home-card">
        <div class="card-icon">⚡</div>
        <h3>TanStack Query 實戰</h3>
        <p>依賴查詢、樂觀更新（Optimistic Update）、無限捲動、Prefetch 預載策略。</p>
        <div class="topics">
          <span class="topic-tag">useQuery</span>
          <span class="topic-tag">useMutation</span>
          <span class="topic-tag">樂觀更新</span>
          <span class="topic-tag">無限捲動</span>
        </div>
      </router-link>

      <router-link to="/vue/ecosystem/shadcn" class="home-card">
        <div class="card-icon">🎨</div>
        <h3>shadcn-vue 實戰</h3>
        <p>主題客製化、Button + Dialog、Form + VeeValidate 整合、DataTable + TanStack Table。</p>
        <div class="topics">
          <span class="topic-tag">CSS 變數主題</span>
          <span class="topic-tag">Form 組件</span>
          <span class="topic-tag">DataTable</span>
          <span class="topic-tag">Radix Vue</span>
        </div>
      </router-link>
    </div>

    <PageNav
      :prev="{ path: '/vue/pinia/intro', label: 'Pinia 狀態管理' }"
      :next="{ path: '/vue/ecosystem/vueuse', label: 'VueUse 實戰' }"
    />
  </div>
</template>
