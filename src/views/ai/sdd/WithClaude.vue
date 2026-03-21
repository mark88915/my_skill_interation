<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>搭配 AI 實作</h1>
    <p class="page-subtitle">SDD + Claude Code 的完整實作流程</p>

    <h2>為什麼 SDD + AI 是絕配？</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>規格 = 最佳 Prompt</h4>
        <p>精確的規格就是最好的 AI 提示，不需要額外學習 prompt engineering。</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>測試 = 自動驗證</h4>
        <p>AI 生成的程式碼能否通過規格轉化的測試，一跑就知道。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>迭代修正</h4>
        <p>測試失敗時，AI 可以自動分析原因並修正，直到所有測試通過。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🧑‍💻</div>
        <h4>人類專注高價值工作</h4>
        <p>人類專注在規格設計與審查，AI 處理程式碼實作。</p>
      </div>
    </div>

    <h2>完整工作流：退貨功能實作</h2>

    <h3>Step 1：將規格餵給 Claude Code</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
> 我要實作訂單退貨功能。請先閱讀以下規格文件：
> @specs/return-order.md

# Claude 會讀取規格文件，理解所有行為要求`" />

    <h3>Step 2：請 Claude 先產生測試</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
> 根據規格，先幫我產生完整的測試案例。
> 使用 xUnit + FluentAssertions。
> 先不要寫實作程式碼。

# Claude 根據規格中的 Given-When-Then 生成測試
# 你審查測試是否完整覆蓋規格`" />

    <h3>Step 3：請 Claude 實作</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
> 測試看起來很完整。現在請根據規格實作退貨功能：
> 1. 在 Order aggregate 加上 RequestReturn() 方法
> 2. 建立 ReturnRequest entity
> 3. 建立 ReturnRequestedEvent
> 4. 加上 EF Core Configuration
> 5. 建立 RequestReturnCommand 和 Handler
> 6. 建立 API endpoint

# Claude 開始實作，每個步驟都會產出程式碼`" />

    <h3>Step 4：自動驗證</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
> 跑一下所有退貨相關的測試

# Claude 執行 dotnet test --filter ReturnOrder
# 如果有失敗的測試，Claude 會自動分析並修正`" />

    <h3>Step 5：迭代直到通過</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
# 假設有 2 個測試失敗
> 有兩個測試失敗了：
> - RequestReturn_OnDay7_ShouldSucceed：邊界日期計算錯誤
> - RequestReturn_WhenAlreadyRequested_ShouldFail：缺少重複檢查
>
> 請修正

# Claude 分析失敗原因並修正程式碼
# 再次跑測試，直到全部通過`" />

    <h2>CLAUDE.md 中的 SDD 設定</h2>
    <CodeBlock lang="bash" filename="CLAUDE.md" :code="`
## SDD 規範

### 開發流程
1. 所有新功能必須先有規格文件（放在 specs/ 目錄下）
2. 先根據規格生成測試，確認測試完整後再開始實作
3. 實作完成後，所有相關測試必須通過

### 規格文件格式
- 使用 Markdown
- 必須包含：概述、術語定義、行為規格（Given-When-Then）、API 規格
- 行為規格必須涵蓋：正常路徑、錯誤路徑、邊界條件

### 測試規範
- 測試方法命名：{Method}_{Scenario}_{Expected}
- 使用 Arrange-Act-Assert 結構
- 每個 Given-When-Then 對應一個測試方法`" />

    <h2>進階：自動化 SDD Pipeline</h2>
    <CodeBlock lang="bash" filename="自動化腳本" :code="`
# 自動化 SDD Pipeline（使用 Claude Code headless 模式）

# Step 1: 根據規格生成測試
claude -p &quot;Read @specs/return-order.md and generate xUnit tests
in Tests/ReturnOrderTests.cs. Do NOT write implementation code.&quot; \\
  --auto-edit

# Step 2: 確認測試都失敗（因為還沒實作）
dotnet test --filter ReturnOrder
# Expected: All tests FAIL

# Step 3: 根據規格 + 測試實作
claude -p &quot;Read @specs/return-order.md. Make all tests in
@Tests/ReturnOrderTests.cs pass. Follow the project architecture
in CLAUDE.md.&quot; --auto-edit

# Step 4: 驗證所有測試通過
dotnet test --filter ReturnOrder
# Expected: All tests PASS

# Step 5: 跑完整測試確認沒有 regression
dotnet test`" />

    <h2>常見模式</h2>
    <table>
      <thead>
        <tr>
          <th>模式</th>
          <th>說明</th>
          <th>效果</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>規格 → 測試 → 實作</strong></td>
          <td>標準 SDD 流程</td>
          <td>最高品質，適合核心業務邏輯</td>
        </tr>
        <tr>
          <td><strong>規格 → AI 同時生成測試+實作</strong></td>
          <td>讓 AI 一次產出</td>
          <td>較快速，適合簡單功能</td>
        </tr>
        <tr>
          <td><strong>現有程式碼 → 抽取規格 → 重構</strong></td>
          <td>逆向 SDD</td>
          <td>適合改善遺留系統</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">📌 關鍵心態</div>
      <p>
        SDD + AI 的目標不是讓 AI 取代你，而是讓你把時間花在最有價值的地方——
        <strong>思考「做什麼」和「為什麼」，讓 AI 處理「怎麼做」</strong>。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/sdd/workflow', label: '開發流程' }"
      :next="{ path: '/ai/sdd/case-study', label: '實戰案例' }"
    />
  </div>
</template>
