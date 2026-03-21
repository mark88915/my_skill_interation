<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const setupExample = `# 安裝
npm install vue-i18n@9

# Nuxt 3
npm install @nuxtjs/i18n

// main.ts — Vue 3 設定
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

const i18n = createI18n({
  legacy: false,           // 必須設為 false（使用 Composition API 模式）
  locale: 'zh-TW',
  fallbackLocale: 'en',
  // messages 放在這裡（小專案）或用 lazy loading（大專案）
  messages: {
    'zh-TW': (await import('./locales/zh-TW.json')).default,
    en:      (await import('./locales/en.json')).default,
  },
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')`

const localeFilesExample = `// locales/zh-TW.json
{
  "nav": {
    "home": "首頁",
    "about": "關於我們",
    "contact": "聯絡我們"
  },
  "auth": {
    "login": "登入",
    "logout": "登出",
    "register": "註冊",
    "welcome": "歡迎回來，{name}！",
    "loginSuccess": "登入成功"
  },
  "validation": {
    "required": "{field} 為必填項目",
    "email": "請輸入有效的 Email",
    "min": "{field} 至少需要 {min} 個字元"
  },
  "pagination": {
    "items": "沒有項目 | 共 1 筆 | 共 {n} 筆"
  }
}

// locales/en.json
{
  "nav": {
    "home": "Home",
    "about": "About",
    "contact": "Contact"
  },
  "auth": {
    "login": "Sign In",
    "logout": "Sign Out",
    "register": "Sign Up",
    "welcome": "Welcome back, {name}!",
    "loginSuccess": "Login successful"
  },
  "validation": {
    "required": "{field} is required",
    "email": "Please enter a valid email",
    "min": "{field} must be at least {min} characters"
  },
  "pagination": {
    "items": "No items | 1 item | {n} items"
  }
}`

const composableUsageExample = `<!-- 實戰 1：組件內使用 -->
<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t, locale, availableLocales, n, d } = useI18n()

// 切換語言
function switchLocale(lang: string) {
  locale.value = lang
  // 也更新 <html lang="...">
  document.documentElement.setAttribute('lang', lang)
  // 持久化使用者偏好
  localStorage.setItem('user-locale', lang)
}

// 數字格式化
const price = 1234567.89
const formattedPrice = n(price, 'currency')  // NT$1,234,567

// 日期格式化
const today = new Date()
const shortDate = d(today, 'short')   // 2024/3/15
const longDate  = d(today, 'long')    // 2024年3月15日 星期五
<\/script>

<template>
  <!-- 基本翻譯 -->
  <h1>{{ t('nav.home') }}</h1>

  <!-- 帶參數的翻譯 -->
  <p>{{ t('auth.welcome', { name: user.name }) }}</p>

  <!-- 複數形式 -->
  <p>{{ t('pagination.items', totalItems) }}</p>

  <!-- 語言切換器 -->
  <div class="locale-switcher">
    <button
      v-for="lang in availableLocales"
      :key="lang"
      :class="{ active: locale === lang }"
      @click="switchLocale(lang)"
    >
      {{ lang }}
    </button>
  </div>
</template>`

const lazyLoadExample = `// 實戰 2：Lazy Loading 語系檔（大型專案必備）
// 避免一次載入所有語系，按需載入

const i18n = createI18n({
  legacy: false,
  locale: 'zh-TW',
  fallbackLocale: 'en',
  messages: {},  // 先空著
})

// 動態載入語系
const loadedLocales = new Set<string>()

async function loadLocaleMessages(locale: string) {
  if (loadedLocales.has(locale)) return

  const messages = await import(\`./locales/\${locale}.json\`)
  i18n.global.setLocaleMessage(locale, messages.default)
  loadedLocales.add(locale)
}

// 在路由守衛中使用
router.beforeEach(async (to) => {
  const lang = to.params.locale as string || 'zh-TW'
  await loadLocaleMessages(lang)
  i18n.global.locale.value = lang
})`

const nuxtI18nExample = `// nuxt.config.ts — Nuxt i18n 設定
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n'],

  i18n: {
    locales: [
      { code: 'zh-TW', language: 'zh-TW', name: '繁體中文', file: 'zh-TW.json' },
      { code: 'en',    language: 'en-US',  name: 'English',  file: 'en.json' },
      { code: 'ja',    language: 'ja-JP',  name: '日本語',    file: 'ja.json' },
    ],
    lazy: true,             // 懶加載語系檔
    langDir: 'locales',     // 語系檔目錄
    defaultLocale: 'zh-TW',
    strategy: 'prefix_except_default',
    // → /about (zh-TW，預設不加前綴)
    // → /en/about (英文)
    // → /ja/about (日文)

    // SEO 自動設定 hreflang
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      alwaysRedirect: false,
      fallbackLocale: 'zh-TW',
    },
  },
})

// 組件中使用（Nuxt i18n 自動導入 useI18n）
// const { t, locale } = useI18n()
// const localePath = useLocalePath()
// const switchLocalePath = useSwitchLocalePath()

// 導向本地化路徑
// localePath('/about')  → '/about' 或 '/en/about'（依當前語言）`

const numberDateExample = `// 實戰 3：數字與日期格式化
// main.ts — 設定格式化選項

const i18n = createI18n({
  legacy: false,
  locale: 'zh-TW',
  numberFormats: {
    'zh-TW': {
      currency: {
        style: 'currency', currency: 'TWD',
        minimumFractionDigits: 0,
      },
      decimal: { style: 'decimal', minimumFractionDigits: 2 },
      percent: { style: 'percent', minimumFractionDigits: 0 },
    },
    en: {
      currency: {
        style: 'currency', currency: 'USD',
        minimumFractionDigits: 2,
      },
    },
  },
  datetimeFormats: {
    'zh-TW': {
      short:  { year: 'numeric', month: '2-digit', day: '2-digit' },
      long:   { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
      time:   { hour: '2-digit', minute: '2-digit' },
    },
    en: {
      short: { year: 'numeric', month: 'short',  day: 'numeric' },
      long:  { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
    },
  },
})

// 使用
const { n, d } = useI18n()
n(1234567, 'currency')   // zh-TW → NT$1,234,567；en → $1,234,567.00
d(new Date(), 'short')   // zh-TW → 2024/03/15；en → Mar 15, 2024`
</script>

<template>
  <div class="content-wrapper">
    <h1>Vue I18n 實戰</h1>
    <p class="page-subtitle">多語言切換、Lazy Loading、數字日期格式化、Nuxt i18n 路由前綴</p>

    <h2>安裝與設定</h2>
    <CodeBlock lang="typescript" filename="main.ts — 基礎設定" :code="setupExample" />

    <h2>語系檔結構</h2>
    <CodeBlock lang="json" filename="locales/zh-TW.json & en.json" :code="localeFilesExample" />

    <h2>實戰 1：組件翻譯 + 語言切換器</h2>
    <CodeBlock lang="html" filename="組件使用範例" :code="composableUsageExample" />

    <h2>實戰 2：Lazy Loading 語系檔</h2>
    <p>大型應用不應一次載入所有語系，改為按需動態 import，減少初始 bundle 大小。</p>
    <CodeBlock lang="typescript" filename="Lazy Loading 語系" :code="lazyLoadExample" />

    <h2>實戰 3：數字與日期格式化</h2>
    <CodeBlock lang="typescript" filename="numberFormats & datetimeFormats 設定" :code="numberDateExample" />

    <h2>Nuxt 3 整合（@nuxtjs/i18n）</h2>
    <CodeBlock lang="typescript" filename="nuxt.config.ts" :code="nuxtI18nExample" />

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>功能</th>
            <th>API</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>基本翻譯</td>
            <td><code>t('key')</code></td>
            <td>支援 dot notation（t('nav.home')）</td>
          </tr>
          <tr>
            <td>帶參數</td>
            <td><code>t('key', { name })</code></td>
            <td>訊息中用 {name} 佔位符</td>
          </tr>
          <tr>
            <td>複數</td>
            <td><code>t('key', count)</code></td>
            <td>訊息用 | 分隔：無 | 一 | 多</td>
          </tr>
          <tr>
            <td>數字格式化</td>
            <td><code>n(number, 'formatName')</code></td>
            <td>貨幣、百分比、小數</td>
          </tr>
          <tr>
            <td>日期格式化</td>
            <td><code>d(date, 'formatName')</code></td>
            <td>short、long、time</td>
          </tr>
          <tr>
            <td>切換語言</td>
            <td><code>locale.value = 'en'</code></td>
            <td>Composition API 模式下</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/veevalidate', label: 'VeeValidate 實戰' }"
      :next="{ path: '/vue/ecosystem/tanstack-query', label: 'TanStack Query 實戰' }"
    />
  </div>
</template>
