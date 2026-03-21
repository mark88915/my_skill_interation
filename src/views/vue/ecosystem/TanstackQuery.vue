<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const setupExample = `# 安裝
npm install @tanstack/vue-query

// main.ts
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,  // 5 分鐘後資料才視為 stale
      retry: 2,                  // 失敗自動重試 2 次
      refetchOnWindowFocus: false,
    },
  },
})

app.use(VueQueryPlugin, { queryClient })`

const basicQueryExample = `<!-- 實戰 1：基礎查詢 + 錯誤/Loading 狀態 -->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

interface Post { id: number; title: string; body: string }

const { data: posts, isPending, isError, error, refetch } = useQuery({
  queryKey: ['posts'],
  queryFn: (): Promise<Post[]> => fetch('/api/posts').then(r => r.json()),
  staleTime: 60_000,   // 1 分鐘內不重新請求
  select: (data) => data.slice(0, 10),  // 只取前 10 筆
})
<\/script>

<template>
  <div v-if="isPending">載入中...</div>
  <div v-else-if="isError" class="error">
    錯誤：{{ error.message }}
    <button @click="refetch()">重試</button>
  </div>
  <ul v-else>
    <li v-for="post in posts" :key="post.id">{{ post.title }}</li>
  </ul>
</template>`

const dependentQueryExample = `<!-- 實戰 2：依賴查詢（先取 user，再取 user 的 posts）-->
<script setup lang="ts">
import { useQuery } from '@tanstack/vue-query'

const userId = ref<number | null>(null)

// 查詢 1：取使用者列表
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(r => r.json()),
})

// 查詢 2：依賴 userId，有值才執行
const { data: userPosts } = useQuery({
  queryKey: ['user-posts', userId],  // queryKey 包含依賴值
  queryFn: () => fetch(\`/api/users/\${userId.value}/posts\`).then(r => r.json()),
  enabled: computed(() => !!userId.value),  // 有 userId 才執行
})
<\/script>

<template>
  <div>
    <select v-model="userId">
      <option v-for="u in users" :key="u.id" :value="u.id">{{ u.name }}</option>
    </select>
    <ul>
      <li v-for="post in userPosts" :key="post.id">{{ post.title }}</li>
    </ul>
  </div>
</template>`

const mutationExample = `<!-- 實戰 3：Mutation + 樂觀更新 -->
<script setup lang="ts">
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

const queryClient = useQueryClient()

interface Todo { id: number; text: string; done: boolean }

const { data: todos } = useQuery({
  queryKey: ['todos'],
  queryFn: (): Promise<Todo[]> => fetch('/api/todos').then(r => r.json()),
})

// 樂觀更新：先更新 UI，若失敗則回滾
const { mutate: toggleTodo } = useMutation({
  mutationFn: (todo: Todo) =>
    fetch(\`/api/todos/\${todo.id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !todo.done }),
    }).then(r => r.json()),

  onMutate: async (todo) => {
    // 取消可能覆蓋樂觀更新的背景請求
    await queryClient.cancelQueries({ queryKey: ['todos'] })

    // 儲存舊資料（用於回滾）
    const previous = queryClient.getQueryData<Todo[]>(['todos'])

    // 樂觀更新快取
    queryClient.setQueryData<Todo[]>(['todos'], (old) =>
      old?.map(t => t.id === todo.id ? { ...t, done: !t.done } : t) ?? []
    )

    return { previous }
  },

  onError: (_err, _todo, context) => {
    // 失敗時回滾到舊資料
    if (context?.previous) {
      queryClient.setQueryData(['todos'], context.previous)
    }
  },

  onSettled: () => {
    // 成功或失敗後都重新整理
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})`

const infiniteQueryExample = `<!-- 實戰 4：無限捲動分頁 (useInfiniteQuery) -->
<script setup lang="ts">
import { useInfiniteQuery } from '@tanstack/vue-query'
import { useIntersectionObserver } from '@vueuse/core'

interface PostsPage { items: Post[]; nextPage: number | null }

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey: ['infinite-posts'],
  queryFn: ({ pageParam }): Promise<PostsPage> =>
    fetch(\`/api/posts?page=\${pageParam}\`).then(r => r.json()),
  initialPageParam: 1,
  getNextPageParam: (lastPage) => lastPage.nextPage,  // null 表示沒有更多
})

// 所有頁面的 posts 攤平
const allPosts = computed(() =>
  data.value?.pages.flatMap(page => page.items) ?? []
)

// 用 VueUse 偵測觸底
const loadMoreRef = ref<HTMLElement | null>(null)
useIntersectionObserver(loadMoreRef, ([{ isIntersecting }]) => {
  if (isIntersecting && hasNextPage.value) fetchNextPage()
})
<\/script>

<template>
  <div v-for="post in allPosts" :key="post.id">{{ post.title }}</div>

  <div ref="loadMoreRef">
    <span v-if="isFetchingNextPage">載入更多...</span>
    <span v-else-if="!hasNextPage">已載入全部</span>
  </div>
</template>`

const prefetchExample = `// 實戰 5：Prefetch（預載資料）
// 在路由進入前預載，消除頁面切換的等待感

// router/index.ts
router.beforeEach(async (to) => {
  const queryClient = useQueryClient()

  // 進入文章列表頁前預載
  if (to.name === 'posts') {
    await queryClient.prefetchQuery({
      queryKey: ['posts'],
      queryFn: () => fetch('/api/posts').then(r => r.json()),
      staleTime: 60_000,
    })
  }

  // 進入文章詳情頁前預載
  if (to.name === 'post' && to.params.id) {
    await queryClient.prefetchQuery({
      queryKey: ['post', to.params.id],
      queryFn: () => fetch(\`/api/posts/\${to.params.id}\`).then(r => r.json()),
    })
  }
})

// 組件中 hover 時預載（更流暢）
const queryClient = useQueryClient()

function prefetchPost(id: number) {
  queryClient.prefetchQuery({
    queryKey: ['post', id],
    queryFn: () => fetch(\`/api/posts/\${id}\`).then(r => r.json()),
    staleTime: 30_000,
  })
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>TanStack Query 實戰</h1>
    <p class="page-subtitle">Server State 管理 — 查詢快取、依賴查詢、樂觀更新、無限捲動、Prefetch</p>

    <div class="info-box info">
      <div class="info-box-title">📌 Server State vs Client State</div>
      <p>
        TanStack Query 管理的是 <strong>Server State</strong>（從後端取得的資料），
        而 Pinia 管理 <strong>Client State</strong>（UI 狀態、使用者偏好）。<br>
        兩者互補，不是替代關係。
      </p>
    </div>

    <h2>安裝與設定</h2>
    <CodeBlock lang="typescript" filename="main.ts — 初始化設定" :code="setupExample" />

    <h2>實戰 1：基礎查詢</h2>
    <CodeBlock lang="html" filename="PostList.vue" :code="basicQueryExample" />

    <h2>實戰 2：依賴查詢</h2>
    <p>使用 <code>enabled</code> 選項讓查詢等待另一個查詢完成，<code>queryKey</code> 包含依賴值會在值變化時自動重新請求。</p>
    <CodeBlock lang="html" filename="UserPosts.vue — 依賴查詢" :code="dependentQueryExample" />

    <h2>實戰 3：Mutation + 樂觀更新</h2>
    <p>
      樂觀更新（Optimistic Update）先更新 UI，讓使用者感覺操作即時，
      失敗時自動回滾到舊資料，大幅提升互動體驗。
    </p>
    <CodeBlock lang="html" filename="TodoList.vue — 樂觀更新" :code="mutationExample" />

    <h2>實戰 4：無限捲動分頁</h2>
    <p><code>useInfiniteQuery</code> 搭配 VueUse <code>useIntersectionObserver</code>，輕鬆實現自動載入更多。</p>
    <CodeBlock lang="html" filename="InfinitePostList.vue" :code="infiniteQueryExample" />

    <h2>實戰 5：Prefetch 預載</h2>
    <p>在路由進入前或 hover 時預載資料，消除頁面切換的白屏時間。</p>
    <CodeBlock lang="typescript" filename="Prefetch 策略" :code="prefetchExample" />

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>用途</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>useQuery</code></td>
            <td>基礎資料查詢，自動快取、背景刷新</td>
          </tr>
          <tr>
            <td><code>useInfiniteQuery</code></td>
            <td>無限捲動 / 載入更多分頁</td>
          </tr>
          <tr>
            <td><code>useMutation</code></td>
            <td>POST/PUT/DELETE，帶樂觀更新支援</td>
          </tr>
          <tr>
            <td><code>useQueryClient</code></td>
            <td>手動操作快取（invalidate、setQueryData、prefetch）</td>
          </tr>
          <tr>
            <td><code>enabled</code></td>
            <td>條件式查詢（依賴其他資料才執行）</td>
          </tr>
          <tr>
            <td><code>staleTime</code></td>
            <td>資料多久後視為 stale（預設 0 = 立即 stale）</td>
          </tr>
          <tr>
            <td><code>gcTime</code></td>
            <td>快取保留時間（預設 5 分鐘）</td>
          </tr>
          <tr>
            <td><code>select</code></td>
            <td>轉換/篩選查詢結果（不影響快取原始資料）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/vue/ecosystem/i18n', label: 'Vue I18n 實戰' }"
      :next="{ path: '/vue/ecosystem/shadcn', label: 'shadcn-vue 實戰' }"
    />
  </div>
</template>
