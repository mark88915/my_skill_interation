import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', component: () => import('../views/Home.vue') },

  // C# — DDD 教學
  { path: '/csharp/ddd/intro', component: () => import('../views/csharp/ddd/Intro.vue') },
  { path: '/csharp/ddd/strategic', component: () => import('../views/csharp/ddd/Strategic.vue') },
  { path: '/csharp/ddd/tactical', component: () => import('../views/csharp/ddd/Tactical.vue') },
  { path: '/csharp/ddd/layers', component: () => import('../views/csharp/ddd/Layers.vue') },
  { path: '/csharp/ddd/project', component: () => import('../views/csharp/ddd/Project.vue') },
  { path: '/csharp/ddd/advanced', component: () => import('../views/csharp/ddd/Advanced.vue') },

  // C# — Redis 與快取
  { path: '/csharp/cache/intro',        component: () => import('../views/csharp/cache/Intro.vue') },
  { path: '/csharp/cache/memory',       component: () => import('../views/csharp/cache/MemoryCache.vue') },
  { path: '/csharp/cache/distributed',  component: () => import('../views/csharp/cache/Distributed.vue') },
  { path: '/csharp/cache/redis',        component: () => import('../views/csharp/cache/Redis.vue') },
  { path: '/csharp/cache/patterns',     component: () => import('../views/csharp/cache/Patterns.vue') },
  { path: '/csharp/cache/scenarios',    component: () => import('../views/csharp/cache/Scenarios.vue') },
  { path: '/csharp/cache/production',   component: () => import('../views/csharp/cache/Production.vue') },

  // C# — 設計模式
  { path: '/csharp/design-patterns/intro',           component: () => import('../views/csharp/design-patterns/Intro.vue') },
  { path: '/csharp/design-patterns/strategy',        component: () => import('../views/csharp/design-patterns/Strategy.vue') },
  { path: '/csharp/design-patterns/observer',        component: () => import('../views/csharp/design-patterns/Observer.vue') },
  { path: '/csharp/design-patterns/decorator',       component: () => import('../views/csharp/design-patterns/Decorator.vue') },
  { path: '/csharp/design-patterns/factory',         component: () => import('../views/csharp/design-patterns/Factory.vue') },
  { path: '/csharp/design-patterns/singleton',       component: () => import('../views/csharp/design-patterns/Singleton.vue') },
  { path: '/csharp/design-patterns/command',         component: () => import('../views/csharp/design-patterns/Command.vue') },
  { path: '/csharp/design-patterns/adapter',         component: () => import('../views/csharp/design-patterns/Adapter.vue') },
  { path: '/csharp/design-patterns/facade',          component: () => import('../views/csharp/design-patterns/Facade.vue') },
  { path: '/csharp/design-patterns/template-method', component: () => import('../views/csharp/design-patterns/TemplateMethod.vue') },
  { path: '/csharp/design-patterns/iterator',        component: () => import('../views/csharp/design-patterns/Iterator.vue') },
  { path: '/csharp/design-patterns/composite',       component: () => import('../views/csharp/design-patterns/Composite.vue') },
  { path: '/csharp/design-patterns/state',           component: () => import('../views/csharp/design-patterns/State.vue') },
  { path: '/csharp/design-patterns/proxy',           component: () => import('../views/csharp/design-patterns/Proxy.vue') },

  // C# — EF Core 教學
  { path: '/csharp/efcore/intro', component: () => import('../views/csharp/efcore/Intro.vue') },
  { path: '/csharp/efcore/setup', component: () => import('../views/csharp/efcore/Setup.vue') },
  { path: '/csharp/efcore/model', component: () => import('../views/csharp/efcore/Model.vue') },
  { path: '/csharp/efcore/crud', component: () => import('../views/csharp/efcore/Crud.vue') },
  { path: '/csharp/efcore/relations', component: () => import('../views/csharp/efcore/Relations.vue') },
  { path: '/csharp/efcore/migration', component: () => import('../views/csharp/efcore/Migration.vue') },
  { path: '/csharp/efcore/advanced', component: () => import('../views/csharp/efcore/AdvancedEf.vue') },
  { path: '/csharp/efcore/ddd-integration', component: () => import('../views/csharp/efcore/DddIntegration.vue') },

  // AI — Claude Code
  { path: '/ai/claude-code/intro', component: () => import('../views/ai/claude-code/Intro.vue') },
  { path: '/ai/claude-code/install', component: () => import('../views/ai/claude-code/Install.vue') },
  { path: '/ai/claude-code/basic', component: () => import('../views/ai/claude-code/Basic.vue') },
  { path: '/ai/claude-code/workflow', component: () => import('../views/ai/claude-code/Workflow.vue') },
  { path: '/ai/claude-code/advanced', component: () => import('../views/ai/claude-code/Advanced.vue') },
  { path: '/ai/claude-code/best-practices', component: () => import('../views/ai/claude-code/BestPractices.vue') },

  // AI — Claude Dispatch
  { path: '/ai/claude-dispatch/intro', component: () => import('../views/ai/claude-dispatch/Intro.vue') },
  { path: '/ai/claude-dispatch/setup', component: () => import('../views/ai/claude-dispatch/Setup.vue') },

  // AI — Claude 進階功能
  { path: '/ai/claude-features/skills',   component: () => import('../views/ai/claude-features/Skills.vue') },
  { path: '/ai/claude-features/agents',   component: () => import('../views/ai/claude-features/Agents.vue') },
  { path: '/ai/claude-features/rules',    component: () => import('../views/ai/claude-features/Rules.vue') },
  { path: '/ai/claude-features/hooks',    component: () => import('../views/ai/claude-features/Hooks.vue') },
  { path: '/ai/claude-features/combined', component: () => import('../views/ai/claude-features/Combined.vue') },

  // AI — SDD
  { path: '/ai/sdd/intro', component: () => import('../views/ai/sdd/Intro.vue') },
  { path: '/ai/sdd/spec-writing', component: () => import('../views/ai/sdd/SpecWriting.vue') },
  { path: '/ai/sdd/workflow', component: () => import('../views/ai/sdd/Workflow.vue') },
  { path: '/ai/sdd/case-study', component: () => import('../views/ai/sdd/CaseStudy.vue') },

  // Infra — Docker
  { path: '/infra/docker/intro',      component: () => import('../views/infra/docker/Intro.vue') },
  { path: '/infra/docker/dockerfile', component: () => import('../views/infra/docker/DockerfileGuide.vue') },
  { path: '/infra/docker/compose',    component: () => import('../views/infra/docker/Compose.vue') },

  // Infra — Kubernetes
  { path: '/infra/k8s/intro',     component: () => import('../views/infra/k8s/Intro.vue') },
  { path: '/infra/k8s/concepts',  component: () => import('../views/infra/k8s/Concepts.vue') },
  { path: '/infra/k8s/config',    component: () => import('../views/infra/k8s/Config.vue') },
  { path: '/infra/k8s/practice',  component: () => import('../views/infra/k8s/Practice.vue') },

  // Infra — 整合實戰
  { path: '/infra/combined/practice', component: () => import('../views/infra/combined/Practice.vue') },

  // Cloud — GCP
  { path: '/cloud/gcp/intro',     component: () => import('../views/cloud/gcp/Intro.vue') },
  { path: '/cloud/gcp/practice',  component: () => import('../views/cloud/gcp/Practice.vue') },

  // Cloud — Cloudflare
  { path: '/cloud/cloudflare/intro',     component: () => import('../views/cloud/cloudflare/Intro.vue') },
  { path: '/cloud/cloudflare/practice',  component: () => import('../views/cloud/cloudflare/Practice.vue') },

  // Cloud — 網域管理
  { path: '/cloud/domain/intro', component: () => import('../views/cloud/domain/Intro.vue') },

  // Cloud — 整合實戰
  { path: '/cloud/combined/practice', component: () => import('../views/cloud/combined/Practice.vue') },

  // Vue 生態系
  { path: '/vue/advanced/index',          component: () => import('../views/vue/advanced/Index.vue') },
  { path: '/vue/nuxt/intro',              component: () => import('../views/vue/nuxt/Intro.vue') },
  { path: '/vue/pinia/intro',             component: () => import('../views/vue/pinia/Intro.vue') },
  { path: '/vue/ecosystem/intro',         component: () => import('../views/vue/ecosystem/Intro.vue') },
  { path: '/vue/ecosystem/vueuse',        component: () => import('../views/vue/ecosystem/VueUse.vue') },
  { path: '/vue/ecosystem/router',        component: () => import('../views/vue/ecosystem/Router.vue') },
  { path: '/vue/ecosystem/vitest',        component: () => import('../views/vue/ecosystem/Vitest.vue') },
  { path: '/vue/ecosystem/veevalidate',   component: () => import('../views/vue/ecosystem/VeeValidate.vue') },
  { path: '/vue/ecosystem/i18n',          component: () => import('../views/vue/ecosystem/I18n.vue') },
  { path: '/vue/ecosystem/tanstack-query',component: () => import('../views/vue/ecosystem/TanstackQuery.vue') },
  { path: '/vue/ecosystem/shadcn',        component: () => import('../views/vue/ecosystem/Shadcn.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
