<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>開發流程</h1>
    <p class="page-subtitle">SDD 的完整開發生命週期</p>

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

    <div class="info-box tip">
      <div class="info-box-title">💡 SDD + AI 的威力</div>
      <p>
        當你有精確的規格和測試案例時，AI 的實作準確率大幅提升。
        因為 AI 有明確的驗收標準（測試通過），而不是模糊的「做出退貨功能」。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/sdd/spec-writing', label: '規格撰寫' }"
      :next="{ path: '/ai/sdd/with-claude', label: '搭配 AI 實作' }"
    />
  </div>
</template>
