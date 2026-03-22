<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const postEditHookScript = `#!/bin/bash
FILE="$CLAUDE_TOOL_INPUT_FILE_PATH"

case "$FILE" in
  *.cs)
    # C# 自動格式化
    dotnet format --include "$FILE" 2>/dev/null
    echo "✅ [Hook] C# 格式化：$FILE"
    ;;
  *.vue|*.ts)
    # Vue/TypeScript 格式化
    npx eslint --fix "$FILE" 2>/dev/null
    npx prettier --write "$FILE" 2>/dev/null
    echo "✅ [Hook] TS/Vue 格式化：$FILE"
    ;;
esac`

const settingsJson = `// .claude/settings.json — 專案級 Hooks 設定
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/post-edit.sh"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/pre-bash.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/on-complete.sh"
          }
        ]
      }
    ]
  }
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Skills + Agents + Rules + Hooks 整合實戰</h1>
    <p class="page-subtitle">以完整的全端功能開發流程，展示四大功能如何協同運作</p>

    <h2>實戰情境：電商平台新增「訂單退款」功能</h2>
    <p>
      情境：你是電商後台（ASP.NET Core DDD + Nuxt 3 前端）的開發者，
      今天要實作「使用者申請訂單退款」功能，涵蓋後端 API、前端 UI、測試，並最終部署。
      以下展示如何用 Skills + Agents + Rules + Hooks <strong>讓整個流程自動化且一致</strong>。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 四功能分工</div>
      <p>
        <strong>Rules（CLAUDE.md）</strong>：告訴 Claude 架構規範，讓它知道怎麼寫才對<br>
        <strong>Agents</strong>：並行處理探索、規劃、研究等多個獨立任務<br>
        <strong>Skills</strong>：一鍵觸發標準化的工作流程（建立功能、Review、部署）<br>
        <strong>Hooks</strong>：背景自動執行格式化、安全檢查、完成通知
      </p>
    </div>

    <h2>Step 1：Rules — 事先建立架構規範</h2>
    <p>
      在開始任何功能前，CLAUDE.md 已定義好的規則會讓 Claude 自動遵循正確的架構，
      你不需要在每次對話都重述。
    </p>

    <CodeBlock lang="markdown" filename="./CLAUDE.md（節錄重要規則）" :code="`# EcommerceShop API

## 領域模型
- Order（訂單）：有 PlaceOrder、CancelOrder、RequestRefund 等 Domain Method
- Refund（退款）：ValueObject，包含 amount、reason、status
- 退款狀態：Pending → Approved/Rejected（由管理員審核）

## 架構規則
- Controller → MediatR → Command/Query Handler → Domain → Infrastructure
- Domain Method 封裝業務邏輯，不在 Handler 中寫規則
- 退款金額不能超過訂單金額（Domain 層驗證）
- 所有 Domain Event 在 Handler 中 Dispatch（OrderRefundRequested）

## 禁止事項
- 禁止在 Controller 直接修改 Order 狀態
- 禁止繞過 Domain Method 直接改 Entity 屬性
- 退款邏輯禁止在前端計算，後端驗證為主

## 測試規範
- Integration Test 使用真實 PostgreSQL（Testcontainers）
- 每個 Command Handler 需有成功 + 失敗情境的測試`" />

    <h2>Step 2：Agents — 並行探索與規劃</h2>
    <p>
      開始實作前，讓 Claude 派遣並行代理，同時完成程式碼探索與技術研究，縮短前置時間。
    </p>

    <CodeBlock lang="markdown" filename="使用者提示：並行準備工作" :code="`請同時進行以下準備工作：

1. 探索現有的 Order 相關程式碼（Order Entity、OrderController、
   現有的 CancelOrder Command 作為退款的參考實作）

2. 查看現有測試的結構與 Testcontainers 的設定方式

請完成後給我：
- Order 的現有 Domain Method 清單
- 推薦的退款 Command 實作架構（參考 CancelOrder 的模式）
- 需要建立的檔案清單`" />

    <CodeBlock lang="markdown" filename="Claude 的並行代理執行結果" :code="`# Agent 1（Explore 代理）回報：

## 現有 Order Domain Methods
- PlaceOrder() — 建立訂單
- CancelOrder(reason) — 取消訂單（已有完整實作可參考）
- MarkAsShipped(trackingNumber)

## 現有 CancelOrder 架構（退款的參考模式）
Commands/Orders/
  CancelOrderCommand.cs      — 輸入 DTO
  CancelOrderCommandHandler.cs — 業務邏輯協調
Domain/Orders/
  Order.cs                   — CancelOrder() Domain Method

---
# Agent 2（Explore 代理）回報：

## Testcontainers 設定
- DatabaseFixture.cs 在 IntegrationTests/Fixtures/
- 每個 Test Class 繼承 IntegrationTestBase
- 使用 Respawn 在每個測試前重置資料庫

## 需建立的檔案（共 8 個）
後端：RequestRefundCommand.cs, Handler.cs, Order.RequestRefund() method
前端：RefundDialog.vue, useRefundMutation.ts
測試：RequestRefundCommandHandlerTests.cs`" />

    <h2>Step 3：Skills — 一鍵建立功能骨架</h2>
    <p>用 <code>/feature</code> Skill 自動建立所有骨架檔案，確保結構一致、不遺漏任何檔案。</p>

    <CodeBlock lang="markdown" filename=".claude/skills/feature/SKILL.md（回顧）" :code="`---
description: 建立新功能的完整骨架（後端 Command + 前端組件 + 測試）
allowed-tools: Bash, Write, Read, Glob
---

根據 CLAUDE.md 的架構規範，為功能「$ARGUMENTS」建立完整骨架：

後端（參考現有 Command 的結構）：
1. src/Application/Commands/Orders/[Feature]Command.cs
2. src/Application/Commands/Orders/[Feature]CommandHandler.cs
3. 在對應的 Entity 新增 [Feature]() Domain Method 的骨架

前端（參考現有 Dialog 組件的結構）：
4. components/features/orders/[Feature]Dialog.vue
5. composables/orders/use[Feature]Mutation.ts

測試：
6. tests/IntegrationTests/Commands/[Feature]CommandHandlerTests.cs

輸出建立的所有檔案清單，並標注哪些是骨架需要填寫內容`" />

    <CodeBlock lang="bash" filename="執行 /feature 指令" :code="`# 輸入：
/feature RefundOrder

# Claude 自動建立 6 個骨架檔案：
✅ src/Application/Commands/Orders/RequestRefundCommand.cs
✅ src/Application/Commands/Orders/RequestRefundCommandHandler.cs
✅ src/Domain/Orders/Order.cs (新增 RequestRefund 骨架)
✅ components/features/orders/RefundDialog.vue
✅ composables/orders/useRefundMutation.ts
✅ tests/IntegrationTests/Commands/RequestRefundCommandHandlerTests.cs`" />

    <h2>Step 4：Hooks — 背景自動格式化與安全防護</h2>
    <p>
      當 Claude 實作各個檔案時，Hooks 在背景自動執行，你完全不需要手動操作。
    </p>

    <CodeBlock lang="json" filename=".claude/settings.json — 專案 Hooks" :code="settingsJson" />

    <CodeBlock lang="bash" filename=".claude/hooks/post-edit.sh — 自動格式化" :code="postEditHookScript" />

    <CodeBlock lang="markdown" filename="使用者看到的效果（Claude 實作期間）" :code="`Claude 正在實作 RequestRefundCommandHandler.cs...
[背景 Hook] ✅ C# 格式化：RequestRefundCommandHandler.cs

Claude 正在實作 RefundDialog.vue...
[背景 Hook] ✅ TS/Vue 格式化：RefundDialog.vue

→ 所有檔案在 Claude 寫完的瞬間就已格式化，
  不需要最後再跑一次 formatter`" />

    <h2>Step 5：Claude 實作核心邏輯</h2>
    <p>
      有了骨架、有了規則指引，Claude 現在實作完整的業務邏輯。
      CLAUDE.md 的規則確保 Claude 遵循正確的 DDD 模式。
    </p>

    <CodeBlock lang="markdown" filename="使用者提示：實作退款邏輯" :code="`請根據 CancelOrder 的模式，實作完整的退款功能：

後端需求：
- Order.RequestRefund(amount, reason) — 驗證金額不超過訂單金額
- 退款後發布 OrderRefundRequested Domain Event
- Handler 呼叫 Repository 保存，並 Dispatch 事件

前端需求：
- RefundDialog 顯示訂單資訊，輸入退款金額與原因
- 提交後呼叫 /api/orders/{id}/refund（POST）
- 成功後 invalidate TanStack Query 的 order cache

記得遵循 CLAUDE.md 的架構規則`" />

    <h2>Step 6：Agents — 隔離環境跑測試</h2>

    <CodeBlock lang="markdown" filename="使用者提示：背景測試" :code="`請在背景執行退款相關的 Integration Tests，我繼續做其他事。

等測試跑完後告訴我：
- 通過幾個 / 失敗幾個
- 失敗的話是什麼錯誤`" />

    <CodeBlock lang="markdown" filename="Claude 的處理方式" :code="`[背景代理啟動] 執行 dotnet test --filter RefundOrder...

[你可以繼續對話或去做其他事]

[3 分鐘後，背景代理回報]
✅ 測試結果：
- 通過：5 個（成功退款、金額超限拒絕、訂單已取消拒絕、
         已退款訂單拒絕、Domain Event 正確發布）
- 失敗：0 個
- 執行時間：2m 43s`" />

    <h2>Step 7：Skills — 一鍵 Review 與部署</h2>

    <CodeBlock lang="bash" filename="執行 Code Review 與部署" :code="`# Code Review（使用 /review-pr Skill）
/review-pr

# Claude 輸出：
# ✅ 安全性：無問題
# ✅ 退款金額驗證在 Domain 層（符合規範）
# ⚠️  Warning：RefundDialog.vue 缺少 loading 狀態的 UI 反饋
# 整體評分：8.5/10

# 修正 warning 後，執行部署
/deploy`" />

    <CodeBlock lang="markdown" filename="完成通知（Stop Hook 觸發）" :code="`[Stop Hook 觸發]
🔔 系統通知：Claude 完成部署流程（14:32:05）
📝 工作日誌已寫入 ~/.claude/work-log.txt`" />

    <h2>完整流程總覽</h2>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>步驟</th>
            <th>功能</th>
            <th>你做什麼</th>
            <th>自動發生什麼</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>1. 架構指引</td>
            <td>Rules（CLAUDE.md）</td>
            <td>事先設定好規則（一次性）</td>
            <td>Claude 每次對話自動讀取，遵循架構</td>
          </tr>
          <tr>
            <td>2. 探索與規劃</td>
            <td>Agents（並行）</td>
            <td>下一個並行探索的提示</td>
            <td>多個代理同時分析程式碼庫</td>
          </tr>
          <tr>
            <td>3. 建立骨架</td>
            <td>Skills（/feature）</td>
            <td>輸入 <code>/feature RefundOrder</code></td>
            <td>自動建立 6 個骨架檔案</td>
          </tr>
          <tr>
            <td>4. 格式化</td>
            <td>Hooks（PostToolUse）</td>
            <td>無需操作</td>
            <td>每次 Claude 寫檔後自動格式化</td>
          </tr>
          <tr>
            <td>5. 核心實作</td>
            <td>Claude + Rules</td>
            <td>描述業務需求</td>
            <td>Claude 遵循 DDD 模式實作</td>
          </tr>
          <tr>
            <td>6. 跑測試</td>
            <td>Agents（背景）</td>
            <td>說「背景跑測試」</td>
            <td>背景代理跑完自動回報</td>
          </tr>
          <tr>
            <td>7. Review</td>
            <td>Skills（/review-pr）</td>
            <td>輸入 <code>/review-pr</code></td>
            <td>結構化 Code Review 報告</td>
          </tr>
          <tr>
            <td>8. 部署</td>
            <td>Skills（/deploy）</td>
            <td>輸入 <code>/deploy</code></td>
            <td>Pre-flight 檢查 + 部署 + 確認</td>
          </tr>
          <tr>
            <td>9. 完成通知</td>
            <td>Hooks（Stop）</td>
            <td>無需操作</td>
            <td>系統通知 + 工作日誌</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="info-box success">
      <div class="info-box-title">✅ 四功能整合的核心價值</div>
      <p>
        <strong>Rules</strong> = 消除每次重複說明的溝通成本，讓 Claude 永遠知道「怎麼做才對」<br>
        <strong>Agents</strong> = 並行化獨立任務，將數小時的研究與探索壓縮到數分鐘<br>
        <strong>Skills</strong> = 標準化重複流程，確保每個人、每次操作都一致可靠<br>
        <strong>Hooks</strong> = 消除手動的繁瑣後置工作（格式化、通知、日誌），讓 Claude 的每個動作都更完整
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-features/hooks', label: 'Hooks 自動化觸發' }"
    />
  </div>
</template>
