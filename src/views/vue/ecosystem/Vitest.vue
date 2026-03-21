<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const setupExample = `# 安裝
npm install -D vitest @vue/test-utils happy-dom @vitest/coverage-v8

# package.json scripts
# "test":         "vitest",
# "test:ui":      "vitest --ui",
# "test:coverage":"vitest run --coverage"

// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',  // 輕量 DOM（或用 'jsdom'）
    globals: true,             // 無需 import describe/it/expect
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**'],
      exclude: ['src/main.ts', '**/*.d.ts'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})`

const componentTestExample = `// tests/components/TodoList.test.ts
import { mount } from '@vue/test-utils'
import TodoList from '@/components/TodoList.vue'

describe('TodoList', () => {
  // 基礎渲染測試
  test('renders empty state when no todos', () => {
    const wrapper = mount(TodoList, {
      props: { todos: [] },
    })
    expect(wrapper.find('[data-testid="empty"]').exists()).toBe(true)
  })

  // 互動測試
  test('adds a todo on form submit', async () => {
    const wrapper = mount(TodoList, {
      props: { todos: [] },
    })

    await wrapper.find('input').setValue('Buy milk')
    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.emitted('add')).toBeTruthy()
    expect(wrapper.emitted('add')![0]).toEqual(['Buy milk'])
  })

  // 快照測試
  test('matches snapshot', () => {
    const wrapper = mount(TodoList, {
      props: {
        todos: [
          { id: 1, text: 'Buy milk', done: false },
          { id: 2, text: 'Walk dog', done: true },
        ],
      },
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  // 非同步測試
  test('loads todos from API', async () => {
    const wrapper = mount(AsyncTodoList)
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(true)
    await flushPromises()  // 等待所有 Promise 完成
    expect(wrapper.find('[data-testid="loading"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="todo-item"]')).toHaveLength(3)
  })
})`

const piniaTestExample = `// tests/components/UserDashboard.test.ts — Pinia store 測試
import { mount } from '@vue/test-utils'
import { createTestingPinia } from '@pinia/testing'
import UserDashboard from '@/components/UserDashboard.vue'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'

describe('UserDashboard', () => {
  function createWrapper(options = {}) {
    return mount(UserDashboard, {
      global: {
        plugins: [
          createTestingPinia({
            // 初始 state
            initialState: {
              user: { user: { id: 1, name: 'Alice', role: 'admin' }, isLoggedIn: true },
            },
            // stubActions: false — 允許 actions 真實執行
            stubActions: false,
          }),
        ],
      },
      ...options,
    })
  }

  test('displays user name', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).toContain('Alice')
  })

  test('admin sees extra controls', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('[data-testid="admin-panel"]').exists()).toBe(true)
  })

  test('logout action is called', async () => {
    const wrapper = createWrapper()
    const store = useUserStore()

    await wrapper.find('[data-testid="logout-btn"]').trigger('click')
    expect(store.logout).toHaveBeenCalled()
  })
})`

const composableTestExample = `// tests/composables/useCounter.test.ts — Composable 測試
import { useCounter } from '@/composables/useCounter'

describe('useCounter', () => {
  test('初始值', () => {
    const { count } = useCounter(5)
    expect(count.value).toBe(5)
  })

  test('increment', () => {
    const { count, increment } = useCounter()
    increment()
    expect(count.value).toBe(1)
    increment(3)
    expect(count.value).toBe(4)
  })

  test('reset', () => {
    const { count, increment, reset } = useCounter(10)
    increment(5)
    reset()
    expect(count.value).toBe(10)  // 回到初始值
  })

  test('double computed', () => {
    const { count, double } = useCounter(3)
    expect(double.value).toBe(6)
    count.value = 7
    expect(double.value).toBe(14)
  })
})

// tests/composables/useFetch.test.ts — Mock API 測試
import { useFetch } from '@/composables/useFetch'
import { flushPromises } from '@vue/test-utils'

// Mock global fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  test('成功取得資料', async () => {
    const mockData = { id: 1, name: 'Alice' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { data, loading, error } = useFetch('/api/user')
    expect(loading.value).toBe(true)

    await flushPromises()
    expect(loading.value).toBe(false)
    expect(data.value).toEqual(mockData)
    expect(error.value).toBeNull()
  })

  test('處理錯誤回應', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })

    const { data, loading, error } = useFetch('/api/user')
    await flushPromises()

    expect(data.value).toBeNull()
    expect(error.value).toBeInstanceOf(Error)
  })
})`

const apiMockExample = `// tests/setup.ts — MSW (Mock Service Worker) 全域設定
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'

// 定義 API mock handler
export const handlers = [
  http.get('/api/users', () => {
    return HttpResponse.json([
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ])
  }),

  http.post('/api/users', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 3, ...body }, { status: 201 })
  }),

  http.get('/api/users/:id', ({ params }) => {
    if (params.id === '999') {
      return HttpResponse.json({ message: 'Not found' }, { status: 404 })
    }
    return HttpResponse.json({ id: Number(params.id), name: 'Alice' })
  }),
]

const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// 在特定測試覆寫 handler
test('顯示 404 錯誤', async () => {
  server.use(
    http.get('/api/users/1', () =>
      HttpResponse.json({ message: 'Not found' }, { status: 404 })
    )
  )
  // ...
})`
</script>

<template>
  <div class="content-wrapper">
    <h1>Vitest 測試實戰</h1>
    <p class="page-subtitle">組件測試、Composable 測試、Pinia Store 測試、MSW API Mock</p>

    <h2>安裝與設定</h2>
    <CodeBlock lang="bash" filename="安裝 & vitest.config.ts" :code="setupExample" />

    <h2>實戰 1：組件測試</h2>
    <p>
      使用 <code>@vue/test-utils</code> 的 <code>mount</code> 渲染組件，
      搭配 <code>data-testid</code> 屬性選取元素（比 CSS class 更穩定）。
    </p>
    <CodeBlock lang="typescript" filename="tests/components/TodoList.test.ts" :code="componentTestExample" />

    <h2>實戰 2：Pinia Store 測試</h2>
    <p>
      <code>@pinia/testing</code> 提供 <code>createTestingPinia</code>，
      可以設定初始 state、選擇是否 stub actions，讓組件測試能夠精確控制 store 狀態。
    </p>
    <CodeBlock lang="typescript" filename="tests/components/UserDashboard.test.ts" :code="piniaTestExample" />

    <h2>實戰 3：Composable 測試</h2>
    <p>Composable 可以直接在測試中呼叫，無需渲染組件。Mock <code>global.fetch</code> 或使用 <code>vi.fn()</code> 控制外部依賴。</p>
    <CodeBlock lang="typescript" filename="tests/composables/ 測試範例" :code="composableTestExample" />

    <h2>實戰 4：MSW API Mock（推薦）</h2>
    <p>
      <strong>Mock Service Worker（MSW）</strong> 在 Node 環境攔截 HTTP 請求，
      比 <code>vi.mock</code> 更接近真實環境，且可以在測試間覆寫特定端點。
    </p>
    <CodeBlock lang="typescript" filename="tests/setup.ts — MSW 設定" :code="apiMockExample" />

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>測試類型</th>
            <th>工具</th>
            <th>建議</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>組件渲染</td>
            <td>@vue/test-utils mount</td>
            <td>用 data-testid 選取元素，避免依賴 CSS class</td>
          </tr>
          <tr>
            <td>Store 測試</td>
            <td>@pinia/testing</td>
            <td>createTestingPinia 設定初始 state</td>
          </tr>
          <tr>
            <td>API Mock</td>
            <td>MSW 或 vi.fn()</td>
            <td>優先 MSW，只在測試簡單邏輯時用 vi.fn()</td>
          </tr>
          <tr>
            <td>非同步等待</td>
            <td>flushPromises</td>
            <td>等待所有 Promise 完成後再斷言</td>
          </tr>
          <tr>
            <td>快照測試</td>
            <td>toMatchSnapshot</td>
            <td>適合 UI 組件，但要小心過度快照</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/router', label: 'Vue Router 實戰' }"
      :next="{ path: '/vue/ecosystem/veevalidate', label: 'VeeValidate 實戰' }"
    />
  </div>
</template>
