<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code Rules（CLAUDE.md）</h1>
    <p class="page-subtitle">用 Markdown 撰寫永久性的專案規則，讓 Claude 在每次對話都遵循你的架構決策</p>

    <h2>什麼是 CLAUDE.md？</h2>
    <p>
      <code>CLAUDE.md</code> 是 Claude Code 在每次對話開始時自動讀取的 Markdown 檔案，
      用來告訴 Claude 關於這個專案的 <strong>架構、規範、禁止事項與開發脈絡</strong>。
      好的 CLAUDE.md 讓你不需要在每次對話都重複說明背景。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 CLAUDE.md 的讀取優先順序</div>
      <p>
        <strong>全域</strong>：<code>~/.claude/CLAUDE.md</code>（適用所有專案的個人偏好）<br>
        <strong>專案根目錄</strong>：<code>./CLAUDE.md</code>（最主要的規則檔）<br>
        <strong>子目錄</strong>：<code>./src/CLAUDE.md</code>（進入 src/ 時額外讀取）<br>
        <strong>@import</strong>：<code>@./docs/architecture.md</code>（從 CLAUDE.md 引入外部文件）
      </p>
    </div>

    <h2>全域 CLAUDE.md — 個人偏好設定</h2>

    <CodeBlock lang="markdown" filename="~/.claude/CLAUDE.md（全域偏好）" :code="`# 個人開發偏好

## 溝通風格
- 回應使用繁體中文
- 解釋要簡潔，不要廢話連篇
- 程式碼修改後不需要重述「我做了什麼」，直接說明理由即可

## 程式碼風格
- TypeScript 優先，避免 any
- 函式命名使用動詞開頭（getUser、createOrder、validateEmail）
- 常數使用 SCREAMING_SNAKE_CASE
- 不要加不必要的注釋，讓程式碼自我說明

## Git 規範
- Commit message 使用 Conventional Commits（feat/fix/refactor/docs）
- 不要 force push 到 main/master
- PR 描述要說明「為什麼」，不只是「做了什麼」

## 安全原則
- 不要在程式碼中寫死 Secret 或 API Key
- 敏感設定一律放環境變數或 Secret Manager`" />

    <h2>後端 API 專案 CLAUDE.md</h2>

    <CodeBlock lang="markdown" filename="./CLAUDE.md（ASP.NET Core DDD 專案）" :code="`# MyShop API — 開發指南

## 專案概述
電商後台 API，使用 ASP.NET Core 8 + DDD + CQRS 架構，部署在 GCP Cloud Run。

## 技術棧
- 語言：C# 12 / .NET 8
- 架構：DDD（領域驅動設計） + CQRS + MediatR
- ORM：EF Core 8（Code First）
- 資料庫：PostgreSQL 15（Cloud SQL）
- 測試：xUnit + FluentAssertions + Respawn
- CI/CD：GitHub Actions → Cloud Build → Cloud Run

## 目錄結構
\`\`\`
src/
├── MyShop.API/          # ASP.NET Core Web API（Controllers、Middleware）
├── MyShop.Application/  # CQRS Commands/Queries/Handlers（應用層）
├── MyShop.Domain/       # 實體、值物件、領域事件、Repository 介面（領域層）
└── MyShop.Infrastructure/ # EF Core、外部服務（基礎設施層）
tests/
├── MyShop.UnitTests/
└── MyShop.IntegrationTests/
\`\`\`

## 架構規則（絕對不能違反）
- Domain 層不能引用 Infrastructure 或 Application 層
- Controller 只能呼叫 MediatR，不能直接呼叫 Repository
- 所有 Entity 必須有私有建構子，透過 Factory Method 建立
- 不要在 Controller 層做業務邏輯
- Repository 介面定義在 Domain 層，實作在 Infrastructure 層

## 命名慣例
- Command：動詞 + 受詞 + Command（CreateOrderCommand、UpdateUserEmailCommand）
- Query：Get + 受詞 + Query（GetOrderByIdQuery、GetUserOrdersQuery）
- Handler：對應 Command/Query + Handler
- Value Object：名詞（Email、Money、Address）

## 禁止事項
- 禁止使用 EF Core 的 lazy loading（會造成 N+1 問題）
- 禁止直接修改 Entity 的 public property，必須透過 Domain Method
- 禁止在測試中 mock 資料庫（用真實 PostgreSQL 容器）
- 禁止跳過 Migration，一律透過 EF Core Migration 管理 Schema

@./docs/domain-model.md
@./docs/api-conventions.md`" />

    <h2>前端 Vue 專案 CLAUDE.md</h2>

    <CodeBlock lang="markdown" filename="./CLAUDE.md（Nuxt 3 + shadcn-vue 專案）" :code="`# MyApp Frontend — 開發指南

## 專案概述
Nuxt 3 企業後台，使用 shadcn-vue + TanStack Query + Pinia。

## 技術棧
- Nuxt 3（SSR 模式）
- shadcn-vue（UI 組件）
- TanStack Query（Server State）
- Pinia（Client State）
- VeeValidate + Zod（表單驗證）
- VueUse（工具 Composables）
- Vitest + @vue/test-utils（測試）

## 目錄結構
\`\`\`
components/
├── ui/          # shadcn-vue 組件（勿直接修改）
├── layout/      # 頁面佈局組件
└── features/    # 功能性組件（依業務模組分類）
composables/     # 自訂 Composables（use 開頭）
stores/          # Pinia stores（use 結尾 Store）
pages/           # Nuxt 頁面（檔案式路由）
server/api/      # Nuxt Server Routes
\`\`\`

## 組件規範
- Server State（API 資料）用 TanStack Query，不要用 Pinia 存
- Client State（UI 狀態、使用者偏好）用 Pinia
- 組件超過 150 行時，抽出 Composable 或拆分子組件
- 使用 defineProps 型別宣告，不要用 withDefaults（除非有預設值需求）
- 所有表單必須有 VeeValidate + Zod 驗證，不要手動驗證

## TypeScript 規則
- 禁止使用 any，用 unknown 配合 type guard
- API 回應型別定義在 types/ 目錄，伺服器端與客戶端共用
- Props 型別使用 interface，不要用 type alias

## 測試規範
- 用 data-testid 屬性選取元素，不要用 CSS class
- API 呼叫一律用 MSW mock，不要直接 mock fetch
- 每個 Composable 必須有對應的單元測試`" />

    <h2>子目錄 CLAUDE.md — 精確化上下文</h2>

    <CodeBlock lang="markdown" filename="./server/api/CLAUDE.md（API 路由規範）" :code="`# Server Routes 規範

這個目錄包含 Nuxt 3 的 Server Routes（Nitro 引擎）。

## 重要規則
- 所有 API 錯誤使用 createError({ statusCode, message })
- 認證由 server/middleware/auth.ts 處理，不要在 route 重複做
- 資料庫連線透過 server/utils/db.ts 的 useDrizzle()
- 所有 mutation 操作必須驗證 CSRF token
- 回應格式統一：{ data: T } 成功，{ error: string } 失敗

## 命名規範
- GET：[resource].get.ts 或 [resource]/[id].get.ts
- POST：[resource].post.ts
- PUT/PATCH：[resource]/[id].put.ts
- DELETE：[resource]/[id].delete.ts`" />

    <h2>@import — 引用外部文件</h2>

    <CodeBlock lang="markdown" filename="CLAUDE.md 使用 @import 引入文件" :code="`# MyProject

## 核心文件（自動載入）

@./docs/architecture-decisions.md   # ADR（架構決策記錄）
@./docs/domain-glossary.md          # 業務術語表
@./CONTRIBUTING.md                  # 貢獻指南
@./docs/api-spec.md                 # API 規格（簡版）

<!-- @import 讓你把規則分散在多個文件管理，CLAUDE.md 只做索引 -->`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ CLAUDE.md 的常見錯誤</div>
      <p>
        ❌ <strong>太長的 CLAUDE.md</strong>：超過 500 行會降低 Claude 的注意力，只寫最重要的規則<br>
        ❌ <strong>只寫「要做什麼」，不說「為什麼」</strong>：說明理由才能讓 Claude 舉一反三<br>
        ❌ <strong>把 CLAUDE.md 當 README</strong>：CLAUDE.md 給 Claude 看，不是給人看的<br>
        ❌ <strong>把所有文件都放在根目錄</strong>：善用子目錄 CLAUDE.md，精確對應上下文
      </p>
    </div>

    <div class="info-box success">
      <div class="info-box-title">✅ 什麼內容值得寫進 CLAUDE.md</div>
      <p>
        ✅ 非明顯的架構決策（為什麼用 CQRS 而非直接 Repository）<br>
        ✅ 嚴格的禁止事項（禁止 Lazy Loading、禁止 any）<br>
        ✅ 特殊的命名慣例（與業界慣例不同的地方）<br>
        ✅ 目錄結構說明（每個目錄的職責）<br>
        ✅ 測試策略（用真實 DB 還是 mock）<br>
        ✅ CI/CD 和部署的特殊注意事項
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-features/agents', label: 'Agents 多智能代理' }"
      :next="{ path: '/ai/claude-features/hooks', label: 'Hooks 自動化觸發' }"
    />
  </div>
</template>
