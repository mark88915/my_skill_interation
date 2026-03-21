<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>進階技巧</h1>
    <p class="page-subtitle">MCP Servers、Hooks、Sub-agent、自訂指令</p>

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

    <h2>Hooks（事件鉤子）</h2>
    <p>
      Hooks 讓你在 Claude Code 執行特定操作前後自動執行自訂腳本。
    </p>

    <CodeBlock lang="json" filename=".claude/settings.json" :code="`
{
  &quot;hooks&quot;: {
    &quot;preToolUse&quot;: [
      {
        &quot;matcher&quot;: &quot;Edit&quot;,
        &quot;command&quot;: &quot;echo 'Claude is about to edit a file'&quot;
      }
    ],
    &quot;postToolUse&quot;: [
      {
        &quot;matcher&quot;: &quot;Write&quot;,
        &quot;command&quot;: &quot;npx prettier --write $CLAUDE_FILE_PATH&quot;
      }
    ],
    &quot;notification&quot;: [
      {
        &quot;command&quot;: &quot;terminal-notifier -message '$CLAUDE_NOTIFICATION' -title 'Claude Code'&quot;
      }
    ]
  }
}`" />

    <table>
      <thead>
        <tr>
          <th>Hook 類型</th>
          <th>觸發時機</th>
          <th>常見用途</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>preToolUse</code></td>
          <td>工具呼叫之前</td>
          <td>驗證、阻擋危險操作</td>
        </tr>
        <tr>
          <td><code>postToolUse</code></td>
          <td>工具呼叫之後</td>
          <td>自動格式化、lint</td>
        </tr>
        <tr>
          <td><code>notification</code></td>
          <td>Claude 等待你的輸入時</td>
          <td>桌面通知</td>
        </tr>
        <tr>
          <td><code>stop</code></td>
          <td>Claude 完成任務時</td>
          <td>自動跑測試</td>
        </tr>
      </tbody>
    </table>

    <h2>Sub-agent（子代理）</h2>
    <p>
      Claude Code 可以派生子代理來平行處理多個任務，提升複雜任務的效率。
    </p>

    <CodeBlock lang="bash" filename="Sub-agent 使用範例" :code="`
# Claude 在處理大型重構時，可能會自動使用 Sub-agent：
# - Agent 1：搜尋所有受影響的檔案
# - Agent 2：分析依賴關係
# - Agent 3：平行修改多個不相依的檔案

# 你也可以明確要求使用平行處理：
> 平行處理以下任務：
> 1. 在 OrderService 加上快取
> 2. 在 ProductService 加上快取
> 3. 更新對應的測試`" />

    <h2>自訂 Slash 指令</h2>
    <p>
      可以在 <code>.claude/commands/</code> 目錄下建立自訂指令。
    </p>

    <CodeBlock lang="bash" filename=".claude/commands/review.md" :code="`
---
description: 進行 Code Review
---

請幫我對目前 staged 的變更進行 Code Review，注意以下重點：

1. **安全性**：是否有 SQL injection、XSS 等安全風險
2. **效能**：是否有 N+1 問題、不必要的 DB 查詢
3. **DDD 原則**：
   - Entity 是否使用 private set
   - 業務邏輯是否在 Domain Layer
   - 是否有不當的跨 Aggregate 參考
4. **測試覆蓋**：重要的業務邏輯是否有對應測試
5. **命名**：是否符合 Ubiquitous Language

如果發現問題，請列出問題並提供修正建議。`" />

    <CodeBlock lang="bash" filename="使用自訂指令" :code="`
# 在 Claude Code 中使用
> /review

# 指令會自動展開為 .claude/commands/review.md 的內容`" />

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

    <PageNav
      :prev="{ path: '/ai/claude-code/workflow', label: '開發工作流' }"
      :next="{ path: '/ai/claude-code/best-practices', label: '最佳實踐' }"
    />
  </div>
</template>
