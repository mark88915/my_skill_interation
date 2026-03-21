<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>進階技巧</h1>
    <p class="page-subtitle">MCP Servers、Worktree、Memory 系統</p>

    <h2>MCP (Model Context Protocol) Servers</h2>
    <p>
      MCP 是一個開放標準，讓 Claude Code 可以連接外部工具和資料來源。
      透過設定 MCP Server，你可以擴展 Claude Code 的能力。
    </p>

    <CodeBlock lang="json" filename=".claude/settings.json" :code="`
{
  &quot;mcpServers&quot;: {
    &quot;github&quot;: {
      &quot;command&quot;: &quot;npx&quot;,
      &quot;args&quot;: [&quot;-y&quot;, &quot;@modelcontextprotocol/server-github&quot;],
      &quot;env&quot;: {
        &quot;GITHUB_TOKEN&quot;: &quot;ghp_xxxx&quot;
      }
    },
    &quot;postgres&quot;: {
      &quot;command&quot;: &quot;npx&quot;,
      &quot;args&quot;: [&quot;-y&quot;, &quot;@modelcontextprotocol/server-postgres&quot;,
        &quot;postgresql://user:pass@localhost/mydb&quot;]
    },
    &quot;filesystem&quot;: {
      &quot;command&quot;: &quot;npx&quot;,
      &quot;args&quot;: [&quot;-y&quot;, &quot;@modelcontextprotocol/server-filesystem&quot;,
        &quot;/path/to/allowed/directory&quot;]
    }
  }
}`" />

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🗃️</div>
        <h4>資料庫連接</h4>
        <p>讓 Claude 直接查詢你的開發資料庫，理解 Schema 和資料。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>API 整合</h4>
        <p>連接 GitHub、Jira、Slack 等工具，實現跨平台自動化。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>Web 搜尋</h4>
        <p>讓 Claude 可以搜尋文件和 API 參考。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📊</div>
        <h4>監控系統</h4>
        <p>連接 Grafana、Datadog 等，輔助除錯生產問題。</p>
      </div>
    </div>

    <h2>多工作區（Worktree）</h2>
    <p>
      Claude Code 支援在 Git Worktree 中工作，讓你同時處理多個分支。
    </p>

    <CodeBlock lang="bash" filename="Worktree 使用" :code="`
# Claude 可以在獨立的 worktree 中工作
# 不影響你當前的工作目錄

> 在新的 worktree 中實作 feature/coupon 功能，
> 完成後建立 PR`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 Memory 系統</div>
      <p>
        Claude Code 具有持久化的記憶系統。當你說「記住這個」，Claude 會將資訊存儲到
        <code>~/.claude/projects/</code> 目錄下，在未來的對話中自動載入。
        這讓 Claude 可以記住你的偏好、專案脈絡和過去的決策。
      </p>
    </div>

    <div class="info-box info">
      <div class="info-box-title">📌 更多進階功能</div>
      <p>
        Claude Code 還提供 Skills（自訂指令）、Agents（子代理）、Rules（CLAUDE.md）、Hooks（事件鉤子）等進階功能，
        詳見「Claude 進階功能」章節的各頁面深入教學。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-code/workflow', label: '開發工作流' }"
      :next="{ path: '/ai/claude-code/best-practices', label: '最佳實踐' }"
    />
  </div>
</template>
