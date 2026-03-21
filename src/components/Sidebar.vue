<script setup>
import NavLink from './NavLink.vue'

defineProps({
  category: { type: String, default: '' },
  pageHeadings: { type: Array, default: () => [] }
})
const emit = defineEmits(['navigate'])
</script>

<template>
  <aside class="sidebar">
    <!-- C# Category -->
    <template v-if="category === 'csharp'">
      <div class="nav-section">
        <div class="nav-group-title">DDD 領域驅動設計</div>
        <NavLink to="/csharp/ddd/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">DDD 概述</NavLink>
        <NavLink to="/csharp/ddd/strategic" :pageHeadings="pageHeadings" @navigate="emit('navigate')">戰略設計</NavLink>
        <NavLink to="/csharp/ddd/tactical" :pageHeadings="pageHeadings" @navigate="emit('navigate')">戰術設計</NavLink>
        <NavLink to="/csharp/ddd/layers" :pageHeadings="pageHeadings" @navigate="emit('navigate')">分層架構</NavLink>
        <NavLink to="/csharp/ddd/project" :pageHeadings="pageHeadings" @navigate="emit('navigate')">專案實作</NavLink>
        <NavLink to="/csharp/ddd/advanced" :pageHeadings="pageHeadings" @navigate="emit('navigate')">進階主題</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Redis 與快取</div>
        <NavLink to="/csharp/cache/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">快取概述</NavLink>
        <NavLink to="/csharp/cache/memory" :pageHeadings="pageHeadings" @navigate="emit('navigate')">IMemoryCache</NavLink>
        <NavLink to="/csharp/cache/distributed" :pageHeadings="pageHeadings" @navigate="emit('navigate')">IDistributedCache</NavLink>
        <NavLink to="/csharp/cache/redis" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Redis 深入教學</NavLink>
        <NavLink to="/csharp/cache/patterns" :pageHeadings="pageHeadings" @navigate="emit('navigate')">快取策略</NavLink>
        <NavLink to="/csharp/cache/scenarios" :pageHeadings="pageHeadings" @navigate="emit('navigate')">使用場景比較</NavLink>
        <NavLink to="/csharp/cache/production" :pageHeadings="pageHeadings" @navigate="emit('navigate')">生產環境建議</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">設計模式</div>
        <NavLink to="/csharp/design-patterns/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">設計模式概述</NavLink>
        <NavLink to="/csharp/design-patterns/strategy" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Strategy 策略模式</NavLink>
        <NavLink to="/csharp/design-patterns/observer" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Observer 觀察者模式</NavLink>
        <NavLink to="/csharp/design-patterns/decorator" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Decorator 裝飾者模式</NavLink>
        <NavLink to="/csharp/design-patterns/factory" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Factory 工廠模式</NavLink>
        <NavLink to="/csharp/design-patterns/singleton" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Singleton 單例模式</NavLink>
        <NavLink to="/csharp/design-patterns/command" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Command 命令模式</NavLink>
        <NavLink to="/csharp/design-patterns/adapter" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Adapter 轉接器模式</NavLink>
        <NavLink to="/csharp/design-patterns/facade" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Facade 外觀模式</NavLink>
        <NavLink to="/csharp/design-patterns/template-method" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Template Method 範本方法</NavLink>
        <NavLink to="/csharp/design-patterns/iterator" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Iterator 迭代器模式</NavLink>
        <NavLink to="/csharp/design-patterns/composite" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Composite 組合模式</NavLink>
        <NavLink to="/csharp/design-patterns/state" :pageHeadings="pageHeadings" @navigate="emit('navigate')">State 狀態模式</NavLink>
        <NavLink to="/csharp/design-patterns/proxy" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Proxy 代理模式</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">EF Core 教學</div>
        <NavLink to="/csharp/efcore/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">EF Core 概述</NavLink>
        <NavLink to="/csharp/efcore/setup" :pageHeadings="pageHeadings" @navigate="emit('navigate')">環境設定</NavLink>
        <NavLink to="/csharp/efcore/model" :pageHeadings="pageHeadings" @navigate="emit('navigate')">模型設定</NavLink>
        <NavLink to="/csharp/efcore/crud" :pageHeadings="pageHeadings" @navigate="emit('navigate')">CRUD 操作</NavLink>
        <NavLink to="/csharp/efcore/relations" :pageHeadings="pageHeadings" @navigate="emit('navigate')">關聯設定</NavLink>
        <NavLink to="/csharp/efcore/migration" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Migration</NavLink>
        <NavLink to="/csharp/efcore/advanced" :pageHeadings="pageHeadings" @navigate="emit('navigate')">進階查詢</NavLink>
        <NavLink to="/csharp/efcore/ddd-integration" :pageHeadings="pageHeadings" @navigate="emit('navigate')">整合 DDD</NavLink>
      </div>
    </template>

    <!-- AI Category -->
    <template v-if="category === 'ai'">
      <div class="nav-section">
        <div class="nav-group-title">Claude Code</div>
        <NavLink to="/ai/claude-code/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Claude Code 概述</NavLink>
        <NavLink to="/ai/claude-code/install" :pageHeadings="pageHeadings" @navigate="emit('navigate')">安裝與設定</NavLink>
        <NavLink to="/ai/claude-code/basic" :pageHeadings="pageHeadings" @navigate="emit('navigate')">基礎用法</NavLink>
        <NavLink to="/ai/claude-code/workflow" :pageHeadings="pageHeadings" @navigate="emit('navigate')">開發工作流</NavLink>
        <NavLink to="/ai/claude-code/advanced" :pageHeadings="pageHeadings" @navigate="emit('navigate')">進階技巧</NavLink>
        <NavLink to="/ai/claude-code/best-practices" :pageHeadings="pageHeadings" @navigate="emit('navigate')">最佳實踐</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Claude Dispatch</div>
        <NavLink to="/ai/claude-dispatch/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Dispatch 概述</NavLink>
        <NavLink to="/ai/claude-dispatch/setup" :pageHeadings="pageHeadings" @navigate="emit('navigate')">設定與使用</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Claude 進階功能</div>
        <NavLink to="/ai/claude-features/skills" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Skills 自定義指令</NavLink>
        <NavLink to="/ai/claude-features/agents" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Agents 多智能代理</NavLink>
        <NavLink to="/ai/claude-features/rules" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Rules（CLAUDE.md）</NavLink>
        <NavLink to="/ai/claude-features/hooks" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Hooks 自動化觸發</NavLink>
        <NavLink to="/ai/claude-features/combined" :pageHeadings="pageHeadings" @navigate="emit('navigate')">四功能整合實戰</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">SDD 規格驅動開發</div>
        <NavLink to="/ai/sdd/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">SDD 概述</NavLink>
        <NavLink to="/ai/sdd/principles" :pageHeadings="pageHeadings" @navigate="emit('navigate')">核心原則</NavLink>
        <NavLink to="/ai/sdd/spec-writing" :pageHeadings="pageHeadings" @navigate="emit('navigate')">規格撰寫</NavLink>
        <NavLink to="/ai/sdd/workflow" :pageHeadings="pageHeadings" @navigate="emit('navigate')">開發流程</NavLink>
        <NavLink to="/ai/sdd/with-claude" :pageHeadings="pageHeadings" @navigate="emit('navigate')">搭配 AI 實作</NavLink>
        <NavLink to="/ai/sdd/case-study" :pageHeadings="pageHeadings" @navigate="emit('navigate')">實戰案例</NavLink>
      </div>
    </template>

    <!-- Infra Category -->
    <template v-if="category === 'infra'">
      <div class="nav-section">
        <div class="nav-group-title">Docker</div>
        <NavLink to="/infra/docker/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Docker 概述</NavLink>
        <NavLink to="/infra/docker/dockerfile" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Dockerfile 撰寫</NavLink>
        <NavLink to="/infra/docker/compose" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Docker Compose</NavLink>
        <NavLink to="/infra/docker/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Docker 實戰</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Kubernetes</div>
        <NavLink to="/infra/k8s/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">K8s 概述</NavLink>
        <NavLink to="/infra/k8s/concepts" :pageHeadings="pageHeadings" @navigate="emit('navigate')">核心概念</NavLink>
        <NavLink to="/infra/k8s/config" :pageHeadings="pageHeadings" @navigate="emit('navigate')">設定管理</NavLink>
        <NavLink to="/infra/k8s/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">K8s 實戰</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">整合實戰</div>
        <NavLink to="/infra/combined/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Docker + K8s 全流程</NavLink>
      </div>
    </template>

    <!-- Vue Category -->
    <template v-if="category === 'vue'">
      <div class="nav-section">
        <div class="nav-group-title">Vue 3 進階</div>
        <NavLink to="/vue/advanced/index" :pageHeadings="pageHeadings" @navigate="emit('navigate')">進階技術</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Nuxt 3</div>
        <NavLink to="/vue/nuxt/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Nuxt 3 概述</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">熱門生態系</div>
        <NavLink to="/vue/pinia/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Pinia 狀態管理</NavLink>
        <NavLink to="/vue/ecosystem/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">生態系總覽</NavLink>
        <NavLink to="/vue/ecosystem/vueuse" :pageHeadings="pageHeadings" @navigate="emit('navigate')">VueUse 實戰</NavLink>
        <NavLink to="/vue/ecosystem/router" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Vue Router 實戰</NavLink>
        <NavLink to="/vue/ecosystem/vitest" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Vitest 測試實戰</NavLink>
        <NavLink to="/vue/ecosystem/veevalidate" :pageHeadings="pageHeadings" @navigate="emit('navigate')">VeeValidate 實戰</NavLink>
        <NavLink to="/vue/ecosystem/i18n" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Vue I18n 實戰</NavLink>
        <NavLink to="/vue/ecosystem/tanstack-query" :pageHeadings="pageHeadings" @navigate="emit('navigate')">TanStack Query 實戰</NavLink>
        <NavLink to="/vue/ecosystem/shadcn" :pageHeadings="pageHeadings" @navigate="emit('navigate')">shadcn-vue 實戰</NavLink>
      </div>
    </template>

    <!-- Cloud Category -->
    <template v-if="category === 'cloud'">
      <div class="nav-section">
        <div class="nav-group-title">GCP 雲端平台</div>
        <NavLink to="/cloud/gcp/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">GCP 概述</NavLink>
        <NavLink to="/cloud/gcp/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">GCP 實戰</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">Cloudflare</div>
        <NavLink to="/cloud/cloudflare/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Cloudflare 概述</NavLink>
        <NavLink to="/cloud/cloudflare/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">Cloudflare 實戰</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">網域管理</div>
        <NavLink to="/cloud/domain/intro" :pageHeadings="pageHeadings" @navigate="emit('navigate')">網域管理概述</NavLink>
      </div>

      <div class="nav-section">
        <div class="nav-group-title">整合實戰</div>
        <NavLink to="/cloud/combined/practice" :pageHeadings="pageHeadings" @navigate="emit('navigate')">全流程整合實戰</NavLink>
      </div>
    </template>
  </aside>
</template>
