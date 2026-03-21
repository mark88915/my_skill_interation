<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>開發流程與 AI 實作</h1>
    <p class="page-subtitle">SDD 的完整開發生命週期，以及如何搭配 Claude Code 實作</p>

    <h2>SDD 開發流程</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 500px;">
        <strong>Phase 1：需求收集</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">與利害關係人釐清需求，識別領域概念</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 500px;">
        <strong>Phase 2：規格撰寫</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">撰寫行為規格、API 規格、狀態轉換</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer application" style="max-width: 500px;">
        <strong>Phase 3：規格審查</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">團隊 Review、找出矛盾和遺漏、利害關係人確認</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer infrastructure" style="max-width: 500px;">
        <strong>Phase 4：測試先行</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">根據規格產生測試案例（此時測試全部失敗）</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer presentation" style="max-width: 500px;">
        <strong>Phase 5：實作</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">撰寫程式碼讓測試通過（人工或 AI 輔助）</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 500px;">
        <strong>Phase 6：驗證</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">所有測試通過 = 符合規格</div>
      </div>
    </div>

    <h2>Phase 1：需求收集</h2>
    <p>與領域專家和利害關係人進行對談，使用以下技巧：</p>
    <ul>
      <li><strong>Event Storming</strong>：用便利貼發掘領域事件和業務流程</li>
      <li><strong>使用者故事</strong>：用 As-a / I-want / So-that 格式記錄需求</li>
      <li><strong>反例法</strong>：不斷問「如果⋯⋯會怎樣？」找出邊界情境</li>
    </ul>

    <CodeBlock lang="bash" filename="需求收集範例" :code="`
# 使用者故事
As a 顧客
I want to 在收到商品後申請退貨
So that 我可以在商品有問題時獲得退款

# 反例法提問
- 如果訂單還沒出貨呢？→ 那是取消訂單，不是退貨
- 如果超過 7 天呢？→ 不允許退貨
- 如果已經退過一次呢？→ 不允許重複退貨
- 如果退貨的商品已毀損呢？→ 客服審核時判斷
- 如果是部分退貨呢？→ 第一版只支援全單退貨`" />

    <h2>Phase 2-3：規格撰寫與審查</h2>
    <p>使用前一章介紹的格式撰寫規格。審查重點：</p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔍</div>
        <h4>一致性檢查</h4>
        <p>術語是否前後一致？不同規格之間有無矛盾？</p>
      </div>
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>完整性檢查</h4>
        <p>是否涵蓋所有錯誤情境？邊界條件有無遺漏？</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>可行性檢查</h4>
        <p>技術上是否可實現？有無效能或安全風險？</p>
      </div>
      <div class="concept-card">
        <div class="icon">💰</div>
        <h4>優先級確認</h4>
        <p>哪些是 MVP？哪些可以延後？</p>
      </div>
    </div>

    <h2>Phase 4：測試先行</h2>
    <p>根據規格直接產生測試案例。此時程式碼尚未撰寫，所有測試都應失敗。</p>

    <CodeBlock lang="csharp" filename="Tests/ReturnOrderTests.cs" :code="`
public class ReturnOrderTests
{
    // 正常情境
    [Fact]
    public void RequestReturn_WithDeliveredOrder_ShouldSucceed()
    {
        // GIVEN 一個已送達的訂單（送達日為 3 天前）
        var order = CreateDeliveredOrder(daysAgo: 3);

        // WHEN 客戶發起退貨請求
        var result = order.RequestReturn(&quot;商品瑕疵&quot;);

        // THEN 建立退貨請求，狀態為 Pending
        Assert.True(result.IsSuccess);
        Assert.Equal(OrderStatus.ReturnRequested, order.Status);
        Assert.Contains(order.DomainEvents,
            e => e is ReturnRequestedEvent);
    }

    // 錯誤情境：超過退貨期限
    [Fact]
    public void RequestReturn_After7Days_ShouldFail()
    {
        var order = CreateDeliveredOrder(daysAgo: 10);

        var result = order.RequestReturn(&quot;不喜歡&quot;);

        Assert.False(result.IsSuccess);
        Assert.Equal(&quot;已超過 7 天退貨期限&quot;, result.Error);
    }

    // 邊界條件：恰好第 7 天
    [Fact]
    public void RequestReturn_OnDay7_ShouldSucceed()
    {
        var order = CreateDeliveredOrder(daysAgo: 7);

        var result = order.RequestReturn(&quot;尺寸不合&quot;);

        Assert.True(result.IsSuccess);
    }

    // 錯誤情境：退貨原因為空
    [Fact]
    public void RequestReturn_WithEmptyReason_ShouldFail()
    {
        var order = CreateDeliveredOrder(daysAgo: 1);

        var result = order.RequestReturn(&quot;&quot;);

        Assert.False(result.IsSuccess);
        Assert.Equal(&quot;退貨原因不可為空&quot;, result.Error);
    }

    // 錯誤情境：重複退貨
    [Fact]
    public void RequestReturn_WhenAlreadyRequested_ShouldFail()
    {
        var order = CreateDeliveredOrder(daysAgo: 1);
        order.RequestReturn(&quot;第一次退貨&quot;);

        var result = order.RequestReturn(&quot;再退一次&quot;);

        Assert.False(result.IsSuccess);
        Assert.Equal(&quot;已有進行中的退貨請求&quot;, result.Error);
    }
}`" />

    <h2>Phase 5-6：實作與驗證</h2>
    <p>
      有了完整的測試案例後，實作的目標就很明確：讓所有測試通過。
      這個階段非常適合交給 AI（如 Claude Code）來完成。
    </p>

    <CodeBlock lang="bash" filename="交給 Claude Code 實作" :code="`
> 根據 specs/return-order.md 的規格和 Tests/ReturnOrderTests.cs 的測試案例，
> 在 Order aggregate 中實作退貨功能。
> 請確保所有測試通過。`" />

    <!-- 搭配 AI 實作 -->
    <h2>SDD + AI：為什麼是絕配？</h2>
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

    <h3>Step 4：自動驗證與迭代</h3>
    <CodeBlock lang="bash" filename="Claude Code" :code="`
> 跑一下所有退貨相關的測試

# Claude 執行 dotnet test --filter ReturnOrder
# 如果有失敗的測試，Claude 會自動分析並修正

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
      :prev="{ path: '/ai/sdd/spec-writing', label: '規格撰寫' }"
      :next="{ path: '/ai/sdd/case-study', label: '實戰案例' }"
    />
  </div>
</template>
