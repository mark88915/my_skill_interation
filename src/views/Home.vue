<template>
  <div>
    <div class="home-hero">
      <h1>
        <span class="gradient-text">技術整合網站</span>
      </h1>
      <p>涵蓋 C# 架構設計與 AI 開發工具的完整教學資源，從 DDD、EF Core 到 Claude Code、Dispatch、SDD 一站式學習</p>
    </div>

    <div class="home-cards">
      <router-link to="/csharp/ddd/intro" class="home-card">
        <div class="card-icon">🏛️</div>
        <h3>DDD 領域驅動設計</h3>
        <p>掌握戰略設計與戰術設計模式，用 Bounded Context、Aggregate、Entity 等概念建模複雜業務。</p>
        <div class="topics">
          <span class="topic-tag">Bounded Context</span>
          <span class="topic-tag">Aggregate</span>
          <span class="topic-tag">Value Object</span>
          <span class="topic-tag">Domain Event</span>
        </div>
      </router-link>

      <router-link to="/csharp/cache/intro" class="home-card">
        <div class="card-icon">⚡</div>
        <h3>Redis 與快取</h3>
        <p>從 IMemoryCache、IDistributedCache 到 Redis 完整教學，掌握快取策略、常見問題解法與生產環境最佳實踐。</p>
        <div class="topics">
          <span class="topic-tag">IMemoryCache</span>
          <span class="topic-tag">Redis</span>
          <span class="topic-tag">HybridCache</span>
          <span class="topic-tag">Cache-Aside</span>
        </div>
      </router-link>

      <router-link to="/csharp/efcore/intro" class="home-card">
        <div class="card-icon">🗄️</div>
        <h3>EF Core 資料存取</h3>
        <p>深入學習 Entity Framework Core 搭配 SQL Server，從 CRUD 到進階查詢與 DDD 整合。</p>
        <div class="topics">
          <span class="topic-tag ef">DbContext</span>
          <span class="topic-tag ef">Fluent API</span>
          <span class="topic-tag ef">Migration</span>
          <span class="topic-tag ef">效能優化</span>
        </div>
      </router-link>

      <router-link to="/ai/claude-code/intro" class="home-card">
        <div class="card-icon">🤖</div>
        <h3>Claude Code</h3>
        <p>Anthropic 官方 CLI 工具，直接在終端機中使用 AI 輔助開發，大幅提升編碼效率。</p>
        <div class="topics">
          <span class="topic-tag ai">CLI 工具</span>
          <span class="topic-tag ai">AI 輔助開發</span>
          <span class="topic-tag ai">自動化</span>
          <span class="topic-tag ai">CLAUDE.md</span>
        </div>
      </router-link>

      <router-link to="/ai/claude-features/skills" class="home-card">
        <div class="card-icon">⚙️</div>
        <h3>Claude 進階功能</h3>
        <p>Skills 自定義指令、Agents 多智能代理、CLAUDE.md 規則、Hooks 自動化觸發，以及四功能整合實戰。</p>
        <div class="topics">
          <span class="topic-tag ai">Skills</span>
          <span class="topic-tag ai">Agents</span>
          <span class="topic-tag ai">CLAUDE.md</span>
          <span class="topic-tag ai">Hooks</span>
        </div>
      </router-link>

      <router-link to="/ai/claude-dispatch/intro" class="home-card">
        <div class="card-icon">📡</div>
        <h3>Claude Dispatch</h3>
        <p>透過手機遠端委派任務給桌機上的 Claude，非同步完成跨服務的資料整合與自動化作業。</p>
        <div class="topics">
          <span class="topic-tag ai">非同步任務</span>
          <span class="topic-tag ai">手機遙控</span>
          <span class="topic-tag ai">Cowork</span>
          <span class="topic-tag ai">Research Preview</span>
        </div>
      </router-link>

      <router-link to="/infra/docker/intro" class="home-card">
        <div class="card-icon">🐳</div>
        <h3>Docker 容器化</h3>
        <p>從 Dockerfile 撰寫、多階段建構到 Docker Compose，完整掌握 ASP.NET Core 應用程式的容器化技術。</p>
        <div class="topics">
          <span class="topic-tag">Dockerfile</span>
          <span class="topic-tag">Docker Compose</span>
          <span class="topic-tag">多階段建構</span>
          <span class="topic-tag">容器網路</span>
        </div>
      </router-link>

      <router-link to="/infra/k8s/intro" class="home-card">
        <div class="card-icon">☸️</div>
        <h3>Kubernetes 編排</h3>
        <p>深入 K8s 核心概念，從 Pod、Deployment、Service 到 ConfigMap、HPA，實現高可用的生產部署。</p>
        <div class="topics">
          <span class="topic-tag">Pod / Deployment</span>
          <span class="topic-tag">Service / Ingress</span>
          <span class="topic-tag">ConfigMap / Secret</span>
          <span class="topic-tag">HPA 自動擴展</span>
        </div>
      </router-link>

      <router-link to="/infra/combined/practice" class="home-card">
        <div class="card-icon">🚀</div>
        <h3>Docker + K8s 整合實戰</h3>
        <p>完整 DevOps 工作流程：Dockerfile → 推送 Registry → K8s 部署 → 滾動更新 → 自動擴展一站式實作。</p>
        <div class="topics">
          <span class="topic-tag">CI/CD 流程</span>
          <span class="topic-tag">滾動更新</span>
          <span class="topic-tag">Registry</span>
          <span class="topic-tag">生產部署</span>
        </div>
      </router-link>

      <router-link to="/ai/sdd/intro" class="home-card">
        <div class="card-icon">📋</div>
        <h3>SDD 規格驅動開發</h3>
        <p>Spec-Driven Development — 先寫規格再寫程式碼，搭配 AI 實現高品質的軟體交付。</p>
        <div class="topics">
          <span class="topic-tag ai">規格優先</span>
          <span class="topic-tag ai">AI 協作</span>
          <span class="topic-tag ai">品質保證</span>
          <span class="topic-tag ai">自動驗證</span>
        </div>
      </router-link>

      <router-link to="/cloud/gcp/intro" class="home-card">
        <div class="card-icon">☁️</div>
        <h3>GCP 雲端平台</h3>
        <p>從零部署 ASP.NET Core 到 Google Cloud，涵蓋 Artifact Registry、Cloud Run、GKE、Cloud SQL 與 IAM。</p>
        <div class="topics">
          <span class="topic-tag">Cloud Run</span>
          <span class="topic-tag">GKE</span>
          <span class="topic-tag">Artifact Registry</span>
          <span class="topic-tag">Cloud SQL</span>
        </div>
      </router-link>

      <router-link to="/cloud/cloudflare/intro" class="home-card">
        <div class="card-icon">🟠</div>
        <h3>Cloudflare</h3>
        <p>利用 Cloudflare 全球邊緣網路加速、保護應用，含 DNS、CDN、WAF、DDoS 防護與 Tunnel 零信任通道。</p>
        <div class="topics">
          <span class="topic-tag">CDN 加速</span>
          <span class="topic-tag">DDoS / WAF</span>
          <span class="topic-tag">SSL 自動化</span>
          <span class="topic-tag">Tunnel</span>
        </div>
      </router-link>

      <router-link to="/vue/advanced/index" class="home-card">
        <div class="card-icon">💚</div>
        <h3>Vue 3 進階技術</h3>
        <p>深入 Composables 設計模式、provide/inject、Teleport、Suspense、自定義指令與效能優化。</p>
        <div class="topics">
          <span class="topic-tag">Composables</span>
          <span class="topic-tag">provide/inject</span>
          <span class="topic-tag">Custom Directive</span>
          <span class="topic-tag">效能優化</span>
        </div>
      </router-link>

      <router-link to="/vue/nuxt/intro" class="home-card">
        <div class="card-icon">🟢</div>
        <h3>Nuxt 3</h3>
        <p>全端 Vue 框架：SSR/SSG/ISR 混合渲染、檔案式路由、自動導入、Server Routes（Nitro 引擎）。</p>
        <div class="topics">
          <span class="topic-tag">SSR / SSG</span>
          <span class="topic-tag">Server Routes</span>
          <span class="topic-tag">Auto Import</span>
          <span class="topic-tag">Nuxt Modules</span>
        </div>
      </router-link>

      <router-link to="/vue/pinia/intro" class="home-card">
        <div class="card-icon">🍍</div>
        <h3>Pinia & Vue 生態系</h3>
        <p>官方推薦的狀態管理 Pinia，以及 VueUse、Vitest、VeeValidate、TanStack Query 等熱門工具。</p>
        <div class="topics">
          <span class="topic-tag">Pinia</span>
          <span class="topic-tag">VueUse</span>
          <span class="topic-tag">Vitest</span>
          <span class="topic-tag">shadcn-vue</span>
        </div>
      </router-link>

      <router-link to="/cloud/combined/practice" class="home-card">
        <div class="card-icon">🚀</div>
        <h3>全流程上雲實戰</h3>
        <p>完整雲端部署流程：GoDaddy 購買網域 → Cloudflare DNS/CDN/WAF → GCP Cloud Run → GitHub Actions CI/CD。</p>
        <div class="topics">
          <span class="topic-tag">網域管理</span>
          <span class="topic-tag">Cloudflare + GCP</span>
          <span class="topic-tag">CI/CD 自動化</span>
          <span class="topic-tag">生產環境</span>
        </div>
      </router-link>
    </div>
  </div>
</template>
