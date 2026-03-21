<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>安裝與設定</h1>
    <p class="page-subtitle">在你的開發環境中安裝並設定 Claude Code</p>

    <h2>系統需求</h2>
    <ul>
      <li><strong>作業系統</strong>：macOS 10.15+、Ubuntu 20.04+ / Debian 10+、Windows（透過 WSL2）</li>
      <li><strong>Node.js</strong>：18 以上版本</li>
      <li><strong>網路</strong>：需要連線到 Anthropic API</li>
      <li><strong>帳號</strong>：Anthropic Console 帳號（API Key 或 Max Plan）</li>
    </ul>

    <h2>安裝步驟</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 使用 npm 全域安裝
npm install -g @anthropic-ai/claude-code

# 驗證安裝
claude --version

# 啟動 Claude Code（會自動導引登入）
claude`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 首次啟動</div>
      <p>第一次執行 <code>claude</code> 時，會自動開啟瀏覽器進行 OAuth 認證。登入 Anthropic 帳號後，會自動完成授權。</p>
    </div>

    <h2>認證方式</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔑</div>
        <h4>Anthropic Console（推薦）</h4>
        <p>直接使用 Anthropic 帳號 OAuth 登入，最簡單的方式。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💳</div>
        <h4>API Key</h4>
        <p>設定 ANTHROPIC_API_KEY 環境變數，按用量計費。</p>
      </div>
      <div class="concept-card">
        <div class="icon">☁️</div>
        <h4>Amazon Bedrock</h4>
        <p>透過 AWS Bedrock 使用，適合企業環境。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏢</div>
        <h4>Google Vertex AI</h4>
        <p>透過 Google Cloud Vertex AI 使用。</p>
      </div>
    </div>

    <h3>使用 API Key</h3>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 方式 1：環境變數
export ANTHROPIC_API_KEY=sk-ant-xxxxxxxx

# 方式 2：在啟動時設定
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx claude`" />

    <h2>權限模式</h2>
    <p>Claude Code 提供三種權限模式，控制 AI 可以自動執行哪些操作：</p>

    <table>
      <thead>
        <tr>
          <th>模式</th>
          <th>說明</th>
          <th>適用情境</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Suggest</strong></td>
          <td>所有檔案修改與指令都需要你的確認</td>
          <td>初次使用、敏感專案</td>
        </tr>
        <tr>
          <td><strong>Auto-edit</strong></td>
          <td>檔案編輯自動執行，終端指令需確認</td>
          <td>日常開發（推薦）</td>
        </tr>
        <tr>
          <td><strong>Full auto</strong></td>
          <td>所有操作自動執行，無需確認</td>
          <td>CI/CD、自動化腳本</td>
        </tr>
      </tbody>
    </table>

    <CodeBlock lang="bash" filename="Terminal" :code="`
# 以不同權限模式啟動
claude                    # 預設 Suggest 模式
claude --auto-edit        # 自動編輯模式
claude --dangerously-skip-permissions  # 完全自動（謹慎使用）`" />

    <h2>CLAUDE.md — 專案指引檔</h2>
    <p>
      <code>CLAUDE.md</code> 是 Claude Code 的專案記憶檔。放在專案根目錄，
      每次啟動 Claude Code 時會自動載入，讓 AI 理解你的專案慣例。
    </p>

    <CodeBlock lang="bash" filename="CLAUDE.md" :code="`
# 專案：EShop 電商平台

## 技術棧
- .NET 8 + C# 12
- EF Core 8 + SQL Server
- 前端：Vue 3 + Vite
- 測試：xUnit + FluentAssertions

## 架構
- DDD 分層架構（Domain / Application / Infrastructure / WebApi）
- CQRS 模式（MediatR）
- Repository Pattern

## 程式碼風格
- 使用 C# record 定義 DTO 和 Value Object
- Strongly Typed ID（不使用 int/Guid 做 Entity ID）
- Entity 使用 private set，透過方法修改狀態
- 所有 DB 設定使用 Fluent API（不使用 Data Annotations）

## Git 慣例
- commit message 使用英文
- 格式：type(scope): description
- type: feat / fix / refactor / test / docs / chore

## 常用指令
- 建置：dotnet build
- 測試：dotnet test
- Migration：dotnet ef migrations add <Name> --project src/EShop.Infrastructure`" />

    <div class="info-box info">
      <div class="info-box-title">📌 CLAUDE.md 的層級</div>
      <p>
        ・<code>~/.claude/CLAUDE.md</code> — 全域設定（跨專案）<br>
        ・<code>專案根目錄/CLAUDE.md</code> — 專案設定（納入版本控制）<br>
        ・<code>任意子目錄/CLAUDE.md</code> — 子目錄設定（特定模組）
      </p>
    </div>

    <h2>IDE 整合</h2>
    <p>Claude Code 也支援在 IDE 中使用：</p>
    <ul>
      <li><strong>VS Code</strong>：安裝 Claude Code 擴充套件，在編輯器內直接使用</li>
      <li><strong>JetBrains IDE</strong>：支援 IntelliJ IDEA、WebStorm、Rider 等</li>
      <li><strong>Terminal 模式</strong>：在任何 IDE 的整合終端機中直接使用 <code>claude</code></li>
    </ul>

    <PageNav
      :prev="{ path: '/ai/claude-code/intro', label: 'Claude Code 概述' }"
      :next="{ path: '/ai/claude-code/basic', label: '基礎用法' }"
    />
  </div>
</template>
