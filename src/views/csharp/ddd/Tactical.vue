<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>戰術設計</h1>
    <p class="page-subtitle">DDD 的核心建構元素：Entity、Value Object、Aggregate</p>

    <h2>Entity（實體）</h2>
    <p>
      Entity 是具有<strong>唯一識別（Identity）</strong>的物件。即使所有屬性都相同，
      只要 ID 不同就是不同的 Entity。Entity 具有生命週期，狀態會隨時間變化。
    </p>

    <CodeBlock lang="csharp" filename="Domain/Entities/Product.cs" :code="`
public class Product : Entity<ProductId>
{
    public string Name { get; private set; }
    public Money Price { get; private set; }
    public string Description { get; private set; }
    public bool IsActive { get; private set; }

    // 建構子：確保建立時就是有效狀態
    private Product() { } // EF Core 需要

    public Product(ProductId id, string name, Money price, string description)
        : base(id)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new DomainException(&quot;商品名稱不可為空&quot;);
        if (price.Amount <= 0)
            throw new DomainException(&quot;商品價格必須大於零&quot;);

        Name = name;
        Price = price;
        Description = description;
        IsActive = true;
    }

    // 行為方法：封裝業務邏輯
    public void UpdatePrice(Money newPrice)
    {
        if (newPrice.Amount <= 0)
            throw new DomainException(&quot;商品價格必須大於零&quot;);
        Price = newPrice;
    }

    public void Deactivate()
    {
        IsActive = false;
    }
}`" />

    <h3>Entity 基底類別</h3>
    <CodeBlock lang="csharp" filename="Domain/Common/Entity.cs" :code="`
public abstract class Entity<TId> where TId : notnull
{
    public TId Id { get; protected set; }

    protected Entity() { }

    protected Entity(TId id)
    {
        Id = id;
    }

    public override bool Equals(object? obj)
    {
        if (obj is not Entity<TId> other) return false;
        if (ReferenceEquals(this, other)) return true;
        return Id.Equals(other.Id);
    }

    public override int GetHashCode() => Id.GetHashCode();

    public static bool operator ==(Entity<TId>? a, Entity<TId>? b)
    {
        if (a is null && b is null) return true;
        if (a is null || b is null) return false;
        return a.Equals(b);
    }

    public static bool operator !=(Entity<TId>? a, Entity<TId>? b) => !(a == b);
}`" />

    <h2>Value Object（值物件）</h2>
    <p>
      Value Object 沒有唯一識別，透過<strong>屬性值</strong>來判斷相等性。
      Value Object 應該是<strong>不可變的（Immutable）</strong>。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📌</div>
        <h4>無唯一識別</h4>
        <p>兩個金額都是 100 元，它們就是相等的。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>不可變</h4>
        <p>一旦建立就不能修改，要變更就建立新的。</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>自我驗證</h4>
        <p>在建構子中驗證，確保永遠處於有效狀態。</p>
      </div>
    </div>

    <CodeBlock lang="csharp" filename="Domain/ValueObjects/Money.cs" :code="`
public record Money
{
    public decimal Amount { get; }
    public Currency Currency { get; }

    public static readonly Money Zero = new(0, Currency.TWD);

    public Money(decimal amount, Currency currency)
    {
        if (amount < 0)
            throw new DomainException(&quot;金額不可為負數&quot;);
        Amount = amount;
        Currency = currency;
    }

    public static Money operator +(Money a, Money b)
    {
        if (a.Currency != b.Currency)
            throw new DomainException(&quot;不同幣別無法相加&quot;);
        return new Money(a.Amount + b.Amount, a.Currency);
    }

    public static Money operator *(Money money, int quantity)
        => new(money.Amount * quantity, money.Currency);

    public override string ToString()
        => $&quot;{Currency.Symbol}{Amount:N0}&quot;;
}

public record Currency(string Code, string Symbol)
{
    public static readonly Currency TWD = new(&quot;TWD&quot;, &quot;NT$&quot;);
    public static readonly Currency USD = new(&quot;USD&quot;, &quot;$&quot;);

    public static Currency FromCode(string code) => code switch
    {
        &quot;TWD&quot; => TWD,
        &quot;USD&quot; => USD,
        _ => throw new DomainException($&quot;不支援的幣別: {code}&quot;)
    };
}`" />

    <CodeBlock lang="csharp" filename="Domain/ValueObjects/Address.cs" :code="`
public record Address
{
    public string City { get; }
    public string District { get; }
    public string Street { get; }
    public string ZipCode { get; }

    public Address(string city, string district, string street, string zipCode)
    {
        if (string.IsNullOrWhiteSpace(city))
            throw new DomainException(&quot;城市不可為空&quot;);
        if (string.IsNullOrWhiteSpace(street))
            throw new DomainException(&quot;街道地址不可為空&quot;);

        City = city;
        District = district;
        Street = street;
        ZipCode = zipCode;
    }

    public override string ToString()
        => $&quot;{ZipCode} {City}{District}{Street}&quot;;
}`" />

    <h2>Aggregate（聚合）</h2>
    <p>
      Aggregate 是一組相關物件的集合，以 <strong>Aggregate Root</strong> 作為唯一入口。
      外部只能透過 Aggregate Root 來操作內部的 Entity 和 Value Object。
    </p>

    <div class="info-box purple">
      <div class="info-box-title">📐 Aggregate 設計原則</div>
      <p>
        1. 透過 Aggregate Root 存取所有內部物件<br>
        2. 保持 Aggregate 盡可能小<br>
        3. Aggregate 之間透過 ID 參考（而非物件參考）<br>
        4. 一個交易只修改一個 Aggregate
      </p>
    </div>

    <CodeBlock lang="csharp" filename="Domain/Aggregates/Order.cs" :code="`
// Order 是 Aggregate Root
public class Order : AggregateRoot<OrderId>
{
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public ShippingAddress ShippingAddress { get; private set; }
    public Money TotalAmount { get; private set; }
    public DateTime CreatedAt { get; private set; }

    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();

    private Order() { } // EF Core

    public static Order Create(CustomerId customerId, ShippingAddress address)
    {
        var order = new Order
        {
            Id = OrderId.NewId(),
            CustomerId = customerId,
            ShippingAddress = address,
            Status = OrderStatus.Pending,
            TotalAmount = Money.Zero,
            CreatedAt = DateTime.UtcNow
        };

        order.AddDomainEvent(new OrderCreatedEvent(order.Id));
        return order;
    }

    public void AddItem(ProductId productId, string productName,
        Money unitPrice, int quantity)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException(&quot;只有待處理的訂單可以新增項目&quot;);
        if (quantity <= 0)
            throw new DomainException(&quot;數量必須大於零&quot;);

        var existingItem = _items.FirstOrDefault(
            i => i.ProductId == productId);

        if (existingItem != null)
        {
            existingItem.IncreaseQuantity(quantity);
        }
        else
        {
            _items.Add(new OrderItem(productId, productName,
                unitPrice, quantity));
        }

        RecalculateTotal();
    }

    public void RemoveItem(ProductId productId)
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException(&quot;只有待處理的訂單可以移除項目&quot;);

        var item = _items.FirstOrDefault(i => i.ProductId == productId)
            ?? throw new DomainException(&quot;找不到該訂單項目&quot;);

        _items.Remove(item);
        RecalculateTotal();
    }

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException(&quot;只有待處理的訂單可以確認&quot;);
        if (!_items.Any())
            throw new DomainException(&quot;訂單至少需要一個項目&quot;);

        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmedEvent(Id, TotalAmount));
    }

    public void Ship()
    {
        if (Status != OrderStatus.Confirmed)
            throw new DomainException(&quot;只有已確認的訂單可以出貨&quot;);

        Status = OrderStatus.Shipped;
        AddDomainEvent(new OrderShippedEvent(Id));
    }

    public void Cancel(string reason)
    {
        if (Status == OrderStatus.Shipped)
            throw new DomainException(&quot;已出貨訂單無法取消&quot;);

        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledEvent(Id, reason));
    }

    private void RecalculateTotal()
    {
        TotalAmount = _items.Aggregate(
            Money.Zero, (sum, item) => sum + item.Subtotal);
    }
}`" />

    <h3>Aggregate 內部的 Entity</h3>
    <CodeBlock lang="csharp" filename="Domain/Aggregates/OrderItem.cs" :code="`
// OrderItem 是 Order Aggregate 內的 Entity
public class OrderItem : Entity<OrderItemId>
{
    public ProductId ProductId { get; private set; }
    public string ProductName { get; private set; }
    public Money UnitPrice { get; private set; }
    public int Quantity { get; private set; }
    public Money Subtotal => UnitPrice * Quantity;

    private OrderItem() { }

    internal OrderItem(ProductId productId, string productName,
        Money unitPrice, int quantity)
    {
        Id = OrderItemId.NewId();
        ProductId = productId;
        ProductName = productName;
        UnitPrice = unitPrice;
        Quantity = quantity;
    }

    internal void IncreaseQuantity(int amount)
    {
        if (amount <= 0)
            throw new DomainException(&quot;增加數量必須大於零&quot;);
        Quantity += amount;
    }
}`" />

    <h2>Domain Event（領域事件）</h2>
    <p>
      Domain Event 代表在領域中發生的重要事實，用於 Aggregate 之間的通訊。
    </p>

    <CodeBlock lang="csharp" filename="Domain/Events/OrderEvents.cs" :code="`
public abstract record DomainEvent
{
    public DateTime OccurredOn { get; } = DateTime.UtcNow;
}

public record OrderCreatedEvent(OrderId OrderId) : DomainEvent;

public record OrderConfirmedEvent(
    OrderId OrderId, Money TotalAmount) : DomainEvent;

public record OrderShippedEvent(OrderId OrderId) : DomainEvent;

public record OrderCancelledEvent(
    OrderId OrderId, string Reason) : DomainEvent;`" />

    <h3>Aggregate Root 基底類別</h3>
    <CodeBlock lang="csharp" filename="Domain/Common/AggregateRoot.cs" :code="`
public abstract class AggregateRoot<TId> : Entity<TId> where TId : notnull
{
    private readonly List<DomainEvent> _domainEvents = new();
    public IReadOnlyCollection<DomainEvent> DomainEvents
        => _domainEvents.AsReadOnly();

    protected void AddDomainEvent(DomainEvent domainEvent)
    {
        _domainEvents.Add(domainEvent);
    }

    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}`" />

    <h2>Repository（倉儲）</h2>
    <p>
      Repository 提供存取 Aggregate 的抽象介面，讓 Domain Layer 不需要知道資料如何儲存。
      <strong>每個 Aggregate Root 有一個 Repository</strong>。
    </p>

    <CodeBlock lang="csharp" filename="Domain/Repositories/IOrderRepository.cs" :code="`
// 在 Domain Layer 定義介面
public interface IOrderRepository
{
    Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct = default);
    Task<IReadOnlyList<Order>> GetByCustomerIdAsync(
        CustomerId customerId, CancellationToken ct = default);
    Task AddAsync(Order order, CancellationToken ct = default);
    void Update(Order order);
    void Remove(Order order);
}

// 通用 Unit of Work 介面
public interface IUnitOfWork
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}`" />

    <div class="info-box info">
      <div class="info-box-title">📌 Repository vs. DAO</div>
      <p>Repository 是以 Aggregate 為單位操作，關注領域語義（GetByCustomerId）。DAO 是以資料表為單位操作，關注資料存取細節（FindByColumnValue）。</p>
    </div>

    <h2>Domain Service（領域服務）</h2>
    <p>
      當業務邏輯不自然屬於任何一個 Entity 或 Value Object 時，使用 Domain Service。
    </p>

    <CodeBlock lang="csharp" filename="Domain/Services/PricingService.cs" :code="`
// 跨 Aggregate 的業務邏輯放在 Domain Service
public class PricingService
{
    public Money CalculateDiscount(Order order, MembershipLevel level)
    {
        var discountRate = level switch
        {
            MembershipLevel.Gold => 0.15m,
            MembershipLevel.Silver => 0.10m,
            MembershipLevel.Bronze => 0.05m,
            _ => 0m
        };

        return new Money(
            order.TotalAmount.Amount * discountRate,
            order.TotalAmount.Currency);
    }
}`" />

    <PageNav
      :prev="{ path: '/csharp/ddd/strategic', label: '戰略設計' }"
      :next="{ path: '/csharp/ddd/layers', label: '分層架構' }"
    />
  </div>
</template>
