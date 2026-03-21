<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>DDD 概述</h1>
    <p class="page-subtitle">什麼是領域驅動設計？為什麼我們需要它？</p>

    <h2>什麼是 DDD？</h2>
    <p>
      <strong>Domain-Driven Design（領域驅動設計）</strong>是由 Eric Evans 在 2003 年提出的軟體設計方法論。
      其核心思想是：<strong>軟體的設計應該以業務領域（Domain）為中心</strong>，而非以技術實作為中心。
    </p>
    <p>
      DDD 強調開發團隊與領域專家（Domain Expert）密切合作，透過共同語言（Ubiquitous Language）
      來確保軟體模型能精確反映業務需求。
    </p>

    <div class="info-box tip">
      <div class="info-box-title">💡 核心理念</div>
      <p>DDD 不是一個框架或技術，而是一種思維方式。它幫助我們在面對複雜業務邏輯時，做出正確的設計決策。</p>
    </div>

    <h2>為什麼需要 DDD？</h2>
    <p>傳統開發方式常見的問題：</p>
    <ul>
      <li><strong>貧血模型（Anemic Domain Model）</strong>：Entity 只有屬性，沒有行為，業務邏輯散落在 Service 層</li>
      <li><strong>大泥球架構（Big Ball of Mud）</strong>：模組之間高度耦合，無清晰邊界</li>
      <li><strong>技術驅動設計</strong>：以資料庫 Schema 為中心設計程式，而非以業務為中心</li>
      <li><strong>溝通鴻溝</strong>：開發人員與業務人員使用不同語言，導致需求理解偏差</li>
    </ul>

    <h2>DDD 的兩大設計層次</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🗺️</div>
        <h4>戰略設計 (Strategic Design)</h4>
        <p>從宏觀角度劃分系統邊界，定義 Bounded Context、Context Map、Ubiquitous Language 等。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚔️</div>
        <h4>戰術設計 (Tactical Design)</h4>
        <p>在 Bounded Context 內部使用 Entity、Value Object、Aggregate、Repository 等模式來實作。</p>
      </div>
    </div>

    <h2>DDD 適用場景</h2>
    <table>
      <thead>
        <tr>
          <th>適合使用 DDD</th>
          <th>不適合使用 DDD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>複雜業務邏輯（如電商、金融、物流）</td>
          <td>簡單 CRUD 應用</td>
        </tr>
        <tr>
          <td>需要長期維護的企業級系統</td>
          <td>一次性工具或腳本</td>
        </tr>
        <tr>
          <td>多團隊協作的大型專案</td>
          <td>原型驗證（Prototype）</td>
        </tr>
        <tr>
          <td>業務規則頻繁變動的系統</td>
          <td>以技術為核心的基礎設施</td>
        </tr>
      </tbody>
    </table>

    <h2>一個簡單的對比</h2>
    <h3>傳統貧血模型</h3>
    <CodeBlock lang="csharp" filename="AnemicOrder.cs" :code="`
// ❌ 貧血模型：Entity 只是資料容器
public class Order
{
    public int Id { get; set; }
    public string Status { get; set; }
    public decimal TotalAmount { get; set; }
    public List<OrderItem> Items { get; set; }
}

// 業務邏輯散落在 Service 中
public class OrderService
{
    public void CancelOrder(Order order)
    {
        if (order.Status == &quot;Shipped&quot;)
            throw new Exception(&quot;已出貨訂單無法取消&quot;);
        order.Status = &quot;Cancelled&quot;;
    }
}`" />

    <h3>DDD 充血模型</h3>
    <CodeBlock lang="csharp" filename="RichOrder.cs" :code="`
// ✅ 充血模型：Entity 封裝業務邏輯
public class Order
{
    public OrderId Id { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    public void Cancel()
    {
        if (Status == OrderStatus.Shipped)
            throw new DomainException(&quot;已出貨訂單無法取消&quot;);

        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id));
    }

    public void AddItem(Product product, int quantity)
    {
        var item = new OrderItem(product, quantity);
        _items.Add(item);
        RecalculateTotal();
    }

    private void RecalculateTotal()
    {
        TotalAmount = _items
            .Aggregate(Money.Zero, (sum, item) => sum + item.Subtotal);
    }
}`" />

    <div class="info-box info">
      <div class="info-box-title">📌 注意</div>
      <p>DDD 充血模型將業務規則封裝在 Entity 內部，使用 private set 保護狀態、透過方法暴露行為，並在狀態變更時發送 Domain Event。</p>
    </div>

    <PageNav
      :next="{ path: '/csharp/ddd/strategic', label: '戰略設計' }"
    />
  </div>
</template>
