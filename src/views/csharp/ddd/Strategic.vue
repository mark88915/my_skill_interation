<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>戰略設計</h1>
    <p class="page-subtitle">從宏觀角度理解系統邊界與團隊協作</p>

    <h2>Ubiquitous Language（通用語言）</h2>
    <p>
      通用語言是 DDD 最重要的概念之一。它是開發團隊和領域專家之間共享的一套術語，
      並且直接反映在程式碼中。
    </p>
    <div class="info-box tip">
      <div class="info-box-title">💡 核心原則</div>
      <p>當業務人員說「下單」，程式碼中就應該有 <code>PlaceOrder</code>；當他們說「取消訂單」，就應該有 <code>CancelOrder</code>。不要用技術術語替代業務概念。</p>
    </div>

    <h3>實例：電商系統中的通用語言</h3>
    <table>
      <thead>
        <tr>
          <th>業務術語</th>
          <th>程式碼對應</th>
          <th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>訂單</td><td><code>Order</code></td><td>Aggregate Root</td></tr>
        <tr><td>訂單項目</td><td><code>OrderItem</code></td><td>Entity (屬於 Order)</td></tr>
        <tr><td>收貨地址</td><td><code>ShippingAddress</code></td><td>Value Object</td></tr>
        <tr><td>下單</td><td><code>PlaceOrder()</code></td><td>Domain Service / Method</td></tr>
        <tr><td>商品上架</td><td><code>PublishProduct()</code></td><td>Method</td></tr>
      </tbody>
    </table>

    <h2>Bounded Context（限界上下文）</h2>
    <p>
      Bounded Context 是 DDD 戰略設計中最關鍵的模式。它定義了一個模型的適用邊界——
      同一個業務概念在不同的 Bounded Context 中可以有完全不同的含義和結構。
    </p>

    <div class="arch-diagram">
      <h4 style="margin-bottom: 16px; color: var(--text-light);">電商系統的 Bounded Context</h4>
      <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
        <div class="arch-layer presentation" style="max-width: 200px; flex: 1;">
          <div style="font-size: 24px; margin-bottom: 4px;">🛒</div>
          <strong>訂單上下文</strong>
          <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Order, OrderItem, Payment</div>
        </div>
        <div class="arch-layer domain" style="max-width: 200px; flex: 1;">
          <div style="font-size: 24px; margin-bottom: 4px;">📦</div>
          <strong>庫存上下文</strong>
          <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Product, Stock, Warehouse</div>
        </div>
        <div class="arch-layer application" style="max-width: 200px; flex: 1;">
          <div style="font-size: 24px; margin-bottom: 4px;">🚚</div>
          <strong>物流上下文</strong>
          <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Shipment, Carrier, Tracking</div>
        </div>
        <div class="arch-layer infrastructure" style="max-width: 200px; flex: 1;">
          <div style="font-size: 24px; margin-bottom: 4px;">👤</div>
          <strong>會員上下文</strong>
          <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Customer, Address, Membership</div>
        </div>
      </div>
    </div>

    <h3>同一概念，不同上下文</h3>
    <CodeBlock lang="csharp" filename="OrderContext/Customer.cs" :code="`
// 訂單上下文中的 Customer —— 只關心下單資訊
namespace OrderContext
{
    public class Customer
    {
        public CustomerId Id { get; private set; }
        public string Name { get; private set; }
        public ShippingAddress DefaultAddress { get; private set; }
    }
}`" />

    <CodeBlock lang="csharp" filename="MemberContext/Customer.cs" :code="`
// 會員上下文中的 Customer —— 關心會員等級、點數
namespace MemberContext
{
    public class Customer
    {
        public CustomerId Id { get; private set; }
        public string Name { get; private set; }
        public string Email { get; private set; }
        public MembershipLevel Level { get; private set; }
        public int Points { get; private set; }

        public void UpgradeLevel()
        {
            if (Points >= 10000)
                Level = MembershipLevel.Gold;
            else if (Points >= 5000)
                Level = MembershipLevel.Silver;
        }
    }
}`" />

    <h2>Context Map（上下文映射）</h2>
    <p>Context Map 描述了不同 Bounded Context 之間的關係與整合方式。</p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🤝</div>
        <h4>Partnership（合作關係）</h4>
        <p>兩個團隊共同發展，互相配合調整介面。</p>
      </div>
      <div class="concept-card">
        <div class="icon">👑</div>
        <h4>Customer-Supplier</h4>
        <p>上游（Supplier）提供服務，下游（Customer）消費。上游考慮下游需求。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🛡️</div>
        <h4>Anti-Corruption Layer</h4>
        <p>下游建立轉換層，隔離上游的模型影響，保護自己的領域模型純淨。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📢</div>
        <h4>Published Language</h4>
        <p>使用公開的共享語言（如 JSON Schema）作為上下文間的溝通格式。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>Open Host Service</h4>
        <p>提供標準化的服務介面（如 REST API），讓多個下游消費。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏴</div>
        <h4>Conformist</h4>
        <p>下游完全遵循上游的模型，不做任何轉換。</p>
      </div>
    </div>

    <h2>Anti-Corruption Layer 實作範例</h2>
    <CodeBlock lang="csharp" filename="ACL/ExternalPaymentAdapter.cs" :code="`
// 外部支付系統的 DTO（我們無法控制的格式）
public record ExternalPaymentResult(
    string txn_id,
    string status_code,
    decimal amount_paid,
    string currency_code
);

// 我們領域中的支付結果
public record PaymentConfirmation(
    TransactionId TransactionId,
    PaymentStatus Status,
    Money Amount
);

// Anti-Corruption Layer：將外部模型轉為內部模型
public class PaymentAclService
{
    private readonly IExternalPaymentGateway _gateway;

    public PaymentAclService(IExternalPaymentGateway gateway)
    {
        _gateway = gateway;
    }

    public async Task<PaymentConfirmation> ProcessPaymentAsync(
        OrderId orderId, Money amount)
    {
        // 呼叫外部 API
        var externalResult = await _gateway.ChargeAsync(
            orderId.Value.ToString(),
            amount.Amount,
            amount.Currency.Code);

        // 透過 ACL 轉換為領域模型
        return new PaymentConfirmation(
            TransactionId: new TransactionId(externalResult.txn_id),
            Status: MapStatus(externalResult.status_code),
            Amount: new Money(externalResult.amount_paid,
                Currency.FromCode(externalResult.currency_code))
        );
    }

    private static PaymentStatus MapStatus(string code) => code switch
    {
        &quot;00&quot; => PaymentStatus.Succeeded,
        &quot;01&quot; => PaymentStatus.Pending,
        _   => PaymentStatus.Failed
    };
}`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 重要提醒</div>
      <p>不要讓外部系統的資料結構侵入你的 Domain Model。ACL 是保護領域模型純淨性的關鍵防線。</p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/ddd/intro', label: 'DDD 概述' }"
      :next="{ path: '/csharp/ddd/tactical', label: '戰術設計' }"
    />
  </div>
</template>
