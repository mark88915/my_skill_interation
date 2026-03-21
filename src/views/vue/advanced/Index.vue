<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const composableExample = `// composables/useCounter.ts
import { ref, computed, onUnmounted } from 'vue'

export function useCounter(initial = 0) {
  const count = ref(initial)
  const double = computed(() => count.value * 2)
  const isEven = computed(() => count.value % 2 === 0)

  function increment(step = 1) { count.value += step }
  function decrement(step = 1) { count.value -= step }
  function reset() { count.value = initial }

  return { count, double, isEven, increment, decrement, reset }
}

// 組件使用
const { count, double, increment, reset } = useCounter(10)`

const useFetchExample = `// composables/useFetch.ts
import { ref, watchEffect, toValue, type MaybeRefOrGetter } from 'vue'

export function useFetch<T>(url: MaybeRefOrGetter<string>) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(false)

  watchEffect(async () => {
    // 每次 url 變更自動重新取得
    const resolvedUrl = toValue(url)
    loading.value = true
    data.value = null
    error.value = null

    try {
      const res = await fetch(resolvedUrl)
      if (!res.ok) throw new Error('Network response was not ok')
      data.value = await res.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}

// 使用：url 是響應式的，切換時自動重新請求
const userId = ref(1)
const { data: user, loading } = useFetch(() => \`/api/users/\${userId.value}\`)`

const provideInjectExample = `// 父組件 (ThemeProvider.vue)
import { provide, reactive } from 'vue'

const theme = reactive({
  color: 'primary',
  dark: false,
  toggle() { this.dark = !this.dark }
})

provide('theme', theme)  // 提供響應式物件

// 子孫組件 (TheButton.vue)
import { inject } from 'vue'

interface Theme {
  color: string
  dark: boolean
  toggle: () => void
}

// 帶預設值的注入（型別安全）
const theme = inject<Theme>('theme', {
  color: 'default',
  dark: false,
  toggle: () => {}
})

// 更好的寫法：使用 InjectionKey 確保型別安全
// ── keys.ts ──
import { type InjectionKey } from 'vue'
export const ThemeKey: InjectionKey<Theme> = Symbol('theme')

// 父組件
provide(ThemeKey, theme)

// 子組件（自動推斷型別，無需手動標注）
const theme = inject(ThemeKey)`

const customDirectiveExample = `// directives/vFocus.ts
import type { Directive } from 'vue'

export const vFocus: Directive = {
  mounted(el: HTMLElement) {
    el.focus()
  }
}

// directives/vClickOutside.ts
export const vClickOutside: Directive<HTMLElement, () => void> = {
  mounted(el, binding) {
    el._clickOutsideHandler = (event: Event) => {
      if (!el.contains(event.target as Node)) {
        binding.value()
      }
    }
    document.addEventListener('click', el._clickOutsideHandler)
  },
  unmounted(el) {
    document.removeEventListener('click', el._clickOutsideHandler)
  }
}

// main.ts 全域註冊
app.directive('focus', vFocus)
app.directive('click-outside', vClickOutside)

// 模板使用
// <input v-focus />
// <div v-click-outside="closeMenu">...</div>`

const renderlessExample = `<!-- RenderlessCounter.vue — 只負責邏輯，不產生任何 DOM -->
<script setup lang="ts">
const props = defineProps<{ initial?: number }>()
const count = ref(props.initial ?? 0)

defineExpose({ count })
<\/script>

<template>
  <slot :count="count" :increment="() => count++" :decrement="() => count--" />
</template>

<!-- 使用時自由決定外觀 -->
<RenderlessCounter :initial="5" v-slot="{ count, increment, decrement }">
  <div class="my-counter">
    <button @click="decrement">-</button>
    <span>{{ count }}</span>
    <button @click="increment">+</button>
  </div>
</RenderlessCounter>`

const performanceExample = `// ✅ shallowRef — 只追蹤頂層，適合大型物件
const bigList = shallowRef<Item[]>([])
// 修改時要整個替換（觸發更新）
bigList.value = [...bigList.value, newItem]

// ✅ markRaw — 標記不需響應式的物件（如第三方 class）
import { markRaw } from 'vue'
const chart = markRaw(new Chart(canvas, config))
const state = reactive({ chart })  // chart 不會被代理

// ✅ v-memo — 記憶化列表項目（只有依賴變更才重渲染）
// <li v-for="item in list" :key="item.id" v-memo="[item.selected]">

// ✅ defineAsyncComponent — 代碼分割 + 懶加載
const HeavyChart = defineAsyncComponent({
  loader: () => import('./HeavyChart.vue'),
  loadingComponent: Spinner,
  errorComponent: ErrorDisplay,
  delay: 200,       // 200ms 後才顯示 loading
  timeout: 5000,    // 超過 5s 顯示 error
})

// ✅ computed 有副作用時用 watch，純計算用 computed
// ✅ 避免在 template 內寫行內函式 @click="() => handler(item)"
//    改用方法接收事件參數或使用 .lazy 修飾符`

const watchAdvancedExample = `import { watch, watchEffect, watchPostEffect } from 'vue'

const count = ref(0)
const user = reactive({ name: 'Alice', age: 25 })

// watch — 懶執行，精確控制監聽來源
watch(count, (newVal, oldVal) => {
  console.log(\`\${oldVal} → \${newVal}\`)
})

// 監聽多個來源
watch([count, () => user.name], ([newCount, newName]) => {
  // ...
})

// immediate: true — 立即執行一次
watch(count, handler, { immediate: true })

// deep: true — 深度監聽（注意效能）
watch(() => user, handler, { deep: true })

// watchEffect — 自動追蹤依賴，立即執行
const stopWatch = watchEffect(() => {
  console.log(count.value)  // 自動追蹤 count
})
stopWatch()  // 手動停止

// watchPostEffect — DOM 更新後執行（相當於 watchEffect + flush: 'post'）
watchPostEffect(() => {
  // 可以安全存取更新後的 DOM
})`
</script>

<template>
  <div class="content-wrapper">
    <h1>Vue 3 進階技術</h1>
    <p class="page-subtitle">深入 Composables、provide/inject、自定義指令、效能優化等進階模式</p>

    <h2>Composable 函式深入</h2>
    <p>
      Composables 是 Vue 3 最重要的設計模式，透過封裝響應式邏輯實現跨組件複用。
      好的 Composable 遵循 <strong>單一職責</strong>，接受參數可為響應式（MaybeRefOrGetter），並在 setup 階段清理副作用。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 Composable 命名慣例</div>
      <p>
        所有 Composable 函式以 <code>use</code> 開頭（如 <code>useCounter</code>、<code>useFetch</code>）。<br>
        檔案放在 <code>src/composables/</code> 目錄，檔名與函式同名（camelCase）。
      </p>
    </div>

    <CodeBlock lang="typescript" filename="composables/useCounter.ts" :code="composableExample" />

    <CodeBlock lang="typescript" filename="composables/useFetch.ts（響應式 URL）" :code="useFetchExample" />

    <h2>provide / inject 進階用法</h2>
    <p>
      <code>provide/inject</code> 適合跨層級共享資料（避免 props drilling）。
      搭配 <code>InjectionKey</code> Symbol 可獲得完整的 TypeScript 型別推斷。
    </p>

    <CodeBlock lang="typescript" filename="provide/inject 型別安全範例" :code="provideInjectExample" />

    <h2>Teleport — 傳送 DOM 節點</h2>
    <p>
      <code>&lt;Teleport&gt;</code> 將組件的 DOM 渲染到任意 DOM 位置（如 body），但邏輯仍屬於當前組件（props、事件、inject 都正常工作）。
    </p>

    <CodeBlock lang="html" filename="Modal.vue — 使用 Teleport" :code="`<!-- Modal 渲染到 #modals 容器，避免 CSS 堆疊上下文問題 -->
<template>
  <Teleport to='#modals'>
    <div v-if='show' class='modal-overlay' @click.self='close'>
      <div class='modal'>
        <slot />
        <button @click='close'>關閉</button>
      </div>
    </div>
  </Teleport>
</template>

<!-- index.html 需有容器 -->
<!-- <div id='modals'></div> -->

<!-- 多個 Teleport 可指向同一 to，用 defer 處理動態目標 -->
<Teleport to='#modals' :disabled='isMobile'>
  <!-- disabled 時原地渲染 -->
</Teleport>`" />

    <h2>Suspense — 非同步組件協調</h2>
    <p>
      <code>&lt;Suspense&gt;</code> 等待子樹內所有非同步依賴（async setup、defineAsyncComponent）完成後才渲染，
      在此之前顯示 <code>#fallback</code> 插槽。
    </p>

    <CodeBlock lang="html" filename="Suspense 使用範例" :code="`<!-- AsyncUser.vue — 使用 async setup -->
<script setup lang='ts'>
const user = await fetchUser(props.id)  // await 在 setup 頂層
<\/script>

<!-- 父組件 -->
<Suspense>
  <template #default>
    <AsyncUser :id='userId' />  <!-- 等待 setup 完成 -->
  </template>
  <template #fallback>
    <LoadingSpinner />
  </template>
</Suspense>

<!-- 搭配 ErrorBoundary 處理錯誤（需自行實作 onErrorCaptured） -->
<ErrorBoundary>
  <Suspense>
    <AsyncContent />
    <template #fallback><Skeleton /></template>
  </Suspense>
</ErrorBoundary>`" />

    <h2>自定義指令</h2>
    <p>
      自定義指令（Custom Directives）讓你直接操作 DOM，適合封裝底層 DOM 行為（focus、tooltip、拖拽等）。
      對比組件，指令更輕量，適合無需模板的 DOM 操作。
    </p>

    <CodeBlock lang="typescript" filename="directives/vFocus & vClickOutside" :code="customDirectiveExample" />

    <h2>Renderless Components — 無渲染組件</h2>
    <p>
      無渲染組件（Headless Component）只提供邏輯，透過 <code>scoped slot</code> 將狀態暴露給父組件自由決定 UI。
      這是實現「邏輯與 UI 完全分離」的最佳模式。
    </p>

    <CodeBlock lang="html" filename="RenderlessCounter.vue" :code="renderlessExample" />

    <h2>效能優化技巧</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>技術</th>
            <th>適用場景</th>
            <th>注意事項</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>shallowRef / shallowReactive</code></td>
            <td>大型物件只需頂層響應式</td>
            <td>深層變更不觸發更新，需整個替換</td>
          </tr>
          <tr>
            <td><code>markRaw</code></td>
            <td>第三方 class、不可代理物件</td>
            <td>標記後永久不被響應式系統追蹤</td>
          </tr>
          <tr>
            <td><code>v-memo</code></td>
            <td>大型列表，項目有複雜渲染邏輯</td>
            <td>依賴陣列必須精確，否則更新失效</td>
          </tr>
          <tr>
            <td><code>defineAsyncComponent</code></td>
            <td>大型組件、條件顯示的面板</td>
            <td>搭配 Suspense 處理 loading 狀態</td>
          </tr>
          <tr>
            <td><code>computed</code> 快取</td>
            <td>耗時計算（排序、過濾大列表）</td>
            <td>避免在 template 直接呼叫方法</td>
          </tr>
          <tr>
            <td><code>v-once</code></td>
            <td>靜態內容（只渲染一次）</td>
            <td>組件生命週期內只渲染一次</td>
          </tr>
        </tbody>
      </table>
    </div>

    <CodeBlock lang="typescript" filename="效能優化程式碼示範" :code="performanceExample" />

    <h2>watch / watchEffect 進階</h2>

    <CodeBlock lang="typescript" filename="watch 與 watchEffect 完整用法" :code="watchAdvancedExample" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 常見陷阱</div>
      <p>
        <strong>1. 在 watchEffect 中修改被監聽的響應式資料</strong>會造成無限迴圈。<br>
        <strong>2. watch 監聽響應式物件</strong>需用 getter <code>() =&gt; obj.prop</code>，直接傳 <code>obj.prop</code> 會丟失響應性。<br>
        <strong>3. async watchEffect</strong> 裡的 cleanup 必須在 onCleanup 回調中處理，不能用 try/finally。
      </p>
    </div>

    <PageNav
      :next="{ path: '/vue/nuxt/intro', label: 'Nuxt 3 概述' }"
    />
  </div>
</template>
