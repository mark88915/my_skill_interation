# 技術整合網站

一站式技術學習平台，涵蓋 C# 架構設計、AI 開發工具、容器化部署、雲端服務與 Vue 前端生態系的完整教學資源。

## 主題涵蓋

### C#
- **DDD 領域驅動設計** — Bounded Context、Aggregate、Entity、Value Object、Domain Event
- **EF Core 資料存取** — DbContext、Fluent API、Migration、CRUD、進階查詢與 DDD 整合
- **Redis 與快取** — IMemoryCache、IDistributedCache、Redis、Cache-Aside、HybridCache
- **設計模式 (Design Patterns)** — Intro、Factory、Singleton、Strategy、Observer、Decorator、Adapter、Facade、Command、Template Method、Iterator、State、Proxy、Composite

### AI 開發工具
- **Claude Code** — Anthropic CLI 工具的安裝、基本操作、工作流程與進階用法
- **Claude Dispatch** — 設定與整合
- **SDD (Spec-Driven Development)** — 規格驅動開發的原則、撰寫方式與實戰案例
- **Claude 進階功能** — Skills、Agents、Rules、Hooks

### 基礎設施
- **Docker** — Dockerfile 撰寫、Docker Compose、實戰演練
- **Kubernetes** — 核心概念、設定檔撰寫、實戰部署

### 上雲
- **GCP** — Google Cloud Platform 入門與實作
- **Cloudflare** — CDN 與安全防護設定
- **網域管理** — 自訂網域設定

### Vue 生態系
- **Vue 進階** — 深入 Vue 3 進階模式
- **Pinia** — 狀態管理
- **Nuxt** — SSR 框架
- **生態系套件** — Vue Router、VueUse、Vitest、VeeValidate、i18n、TanStack Query、shadcn-vue

## 技術棧

- **前端框架：** Vue 3 (`<script setup>` SFC)
- **建置工具：** Vite 8
- **路由：** Vue Router 4
- **程式碼高亮：** highlight.js + @highlightjs/vue-plugin
- **套件管理：** pnpm

## 快速開始

```bash
# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev

# 建置生產版本
pnpm build

# 預覽生產版本
pnpm preview
```

## 專案結構

```
src/
├── components/       # 共用元件 (Sidebar, NavLink, CodeBlock, DarkModeToggle)
├── views/
│   ├── Home.vue      # 首頁
│   ├── csharp/
│   │   ├── ddd/              # DDD 教學頁面
│   │   ├── efcore/           # EF Core 教學頁面
│   │   ├── cache/            # 快取教學頁面
│   │   └── design-patterns/  # 設計模式教學頁面
│   ├── ai/           # AI 工具教學 (Claude Code, Dispatch, SDD, Features)
│   ├── infra/        # Docker & K8s 教學頁面
│   ├── cloud/        # 雲端服務教學頁面
│   └── vue/          # Vue 生態系教學頁面
├── router/           # Vue Router 設定
├── assets/           # 靜態資源
├── style.css         # 全域樣式
├── main.js           # 應用程式入口
└── App.vue           # 根元件
```

## License

MIT
