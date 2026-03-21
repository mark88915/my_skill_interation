<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>進階主題</h1>
    <p class="page-subtitle">CQRS、Domain Event 處理、Specification Pattern</p>

    <h2>CQRS（Command Query Responsibility Segregation）</h2>
    <p>
      CQRS 將讀取（Query）和寫入（Command）分離到不同的模型中。
      寫入走 Domain Model + Repository，讀取可以直接查資料庫或用專門的 Read Model。
    </p>

    <div class="arch-diagram">
      <div style="display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;">
        <div style="flex: 1; min-width: 250px;">
          <div class="arch-layer presentation" style="max-width: none;">
            <strong>Command Side（寫入）</strong>
            <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">
              Controller → Command → Handler → Domain → Repository → DB
            </div>
          </div>
        </div>
        <div style="flex: 1; min-width: 250px;">
          <div class="arch-layer application" style="max-width: none;">
            <strong>Query Side（讀取）</strong>
            <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">
              Controller → Query → Handler → DB (直接查詢)
            </div>
          </div>
        </div>
      </div>
    </div>

    <h3>Query 範例（繞過 Domain Model 直接查詢）</h3>
    <CodeBlock lang="csharp" filename="Application/Orders/Queries/GetOrderByIdQuery.cs" :code="`
public record GetOrderByIdQuery(Guid OrderId) : IRequest<OrderDto?>;

public class GetOrderByIdQueryHandler
    : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    private readonly AppDbContext _context;

    // Query 端可以直接使用 DbContext，不需要經過 Repository
    public GetOrderByIdQueryHandler(AppDbContext context)
    {
        _context = context;
    }

    public async Task<OrderDto?> Handle(
        GetOrderByIdQuery request, CancellationToken ct)
    {
        return await _context.Orders
            .AsNoTracking()  // 讀取不需要追蹤
            .Where(o => o.Id == new OrderId(request.OrderId))
            .Select(o => new OrderDto
            {
                Id = o.Id.Value,
                Status = o.Status.ToString(),
                TotalAmount = o.TotalAmount.Amount,
                Currency = o.TotalAmount.Currency.Code,
                CreatedAt = o.CreatedAt,
                Items = o.Items.Select(i => new OrderItemDto
                {
                    ProductName = i.ProductName,
                    UnitPrice = i.UnitPrice.Amount,
                    Quantity = i.Quantity,
                    Subtotal = i.UnitPrice.Amount * i.Quantity
                }).ToList()
            })
            .FirstOrDefaultAsync(ct);
    }
}

public record OrderDto
{
    public Guid Id { get; init; }
    public string Status { get; init; } = string.Empty;
    public decimal TotalAmount { get; init; }
    public string Currency { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public List<OrderItemDto> Items { get; init; } = new();
}

public record OrderItemDto
{
    public string ProductName { get; init; } = string.Empty;
    public decimal UnitPrice { get; init; }
    public int Quantity { get; init; }
    public decimal Subtotal { get; init; }
}`" />

    <h2>Domain Event 處理</h2>
    <p>使用 MediatR 的 Notification 來處理 Domain Event，實現 Aggregate 之間的解耦通訊。</p>

    <CodeBlock lang="csharp" filename="Infrastructure/DomainEventDispatcher.cs" :code="`
// 在 SaveChanges 時自動發送 Domain Events
public class AppDbContext : DbContext, IUnitOfWork
{
    private readonly IMediator _mediator;

    public AppDbContext(
        DbContextOptions<AppDbContext> options, IMediator mediator)
        : base(options)
    {
        _mediator = mediator;
    }

    public override async Task<int> SaveChangesAsync(
        CancellationToken ct = default)
    {
        // 在儲存之前收集所有 Domain Events
        var domainEvents = ChangeTracker.Entries<AggregateRoot<object>>()
            .SelectMany(e => e.Entity.DomainEvents)
            .ToList();

        // 清除事件（避免重複發送）
        foreach (var entry in ChangeTracker.Entries<AggregateRoot<object>>())
            entry.Entity.ClearDomainEvents();

        // 儲存變更
        var result = await base.SaveChangesAsync(ct);

        // 儲存成功後發送事件
        foreach (var domainEvent in domainEvents)
        {
            await _mediator.Publish(
                domainEvent as INotification, ct);
        }

        return result;
    }
}`" />

    <h3>Event Handler 範例</h3>
    <CodeBlock lang="csharp" filename="Application/Orders/EventHandlers/OrderConfirmedHandler.cs" :code="`
// 訂單確認後，通知庫存系統扣減庫存
public class OrderConfirmedEventHandler
    : INotificationHandler<OrderConfirmedEvent>
{
    private readonly IProductRepository _productRepo;
    private readonly ILogger<OrderConfirmedEventHandler> _logger;

    public OrderConfirmedEventHandler(
        IProductRepository productRepo,
        ILogger<OrderConfirmedEventHandler> logger)
    {
        _productRepo = productRepo;
        _logger = logger;
    }

    public async Task Handle(
        OrderConfirmedEvent notification, CancellationToken ct)
    {
        _logger.LogInformation(
            &quot;處理訂單確認事件: {OrderId}&quot;, notification.OrderId);

        // 這裡可以執行跨 Aggregate 的操作
        // 例如：扣減庫存、發送通知信、記錄審計日誌等
    }
}

// 訂單取消後，寄送通知信
public class OrderCancelledNotificationHandler
    : INotificationHandler<OrderCancelledEvent>
{
    private readonly IEmailService _emailService;

    public OrderCancelledNotificationHandler(IEmailService emailService)
    {
        _emailService = emailService;
    }

    public async Task Handle(
        OrderCancelledEvent notification, CancellationToken ct)
    {
        await _emailService.SendOrderCancelledEmailAsync(
            notification.OrderId, notification.Reason);
    }
}`" />

    <h2>Specification Pattern</h2>
    <p>
      Specification Pattern 將查詢條件封裝為可重用的物件，避免在 Repository 中堆積大量查詢方法。
    </p>

    <CodeBlock lang="csharp" filename="Domain/Specifications/Specification.cs" :code="`
// 通用 Specification 基底
public abstract class Specification<T>
{
    public abstract Expression<Func<T, bool>> ToExpression();

    public bool IsSatisfiedBy(T entity)
    {
        return ToExpression().Compile()(entity);
    }

    public Specification<T> And(Specification<T> other)
        => new AndSpecification<T>(this, other);

    public Specification<T> Or(Specification<T> other)
        => new OrSpecification<T>(this, other);

    public Specification<T> Not()
        => new NotSpecification<T>(this);
}

internal class AndSpecification<T> : Specification<T>
{
    private readonly Specification<T> _left;
    private readonly Specification<T> _right;

    public AndSpecification(Specification<T> left, Specification<T> right)
    {
        _left = left;
        _right = right;
    }

    public override Expression<Func<T, bool>> ToExpression()
    {
        var left = _left.ToExpression();
        var right = _right.ToExpression();
        var param = Expression.Parameter(typeof(T));
        var body = Expression.AndAlso(
            Expression.Invoke(left, param),
            Expression.Invoke(right, param));
        return Expression.Lambda<Func<T, bool>>(body, param);
    }
}`" />

    <h3>使用 Specification</h3>
    <CodeBlock lang="csharp" filename="Domain/Specifications/OrderSpecs.cs" :code="`
// 定義具體的 Specification
public class PendingOrderSpec : Specification<Order>
{
    public override Expression<Func<Order, bool>> ToExpression()
        => order => order.Status == OrderStatus.Pending;
}

public class CustomerOrderSpec : Specification<Order>
{
    private readonly CustomerId _customerId;

    public CustomerOrderSpec(CustomerId customerId)
    {
        _customerId = customerId;
    }

    public override Expression<Func<Order, bool>> ToExpression()
        => order => order.CustomerId == _customerId;
}

public class HighValueOrderSpec : Specification<Order>
{
    private readonly decimal _threshold;

    public HighValueOrderSpec(decimal threshold)
    {
        _threshold = threshold;
    }

    public override Expression<Func<Order, bool>> ToExpression()
        => order => order.TotalAmount.Amount >= _threshold;
}

// 使用：組合多個 Specification
// 查詢某客戶的待處理高價訂單
var spec = new CustomerOrderSpec(customerId)
    .And(new PendingOrderSpec())
    .And(new HighValueOrderSpec(10000));

var orders = await _orderRepo.FindAsync(spec);`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 進階建議</div>
      <p>
        ・在真實專案中可搭配 MediatR Pipeline Behavior 做 Validation、Logging、Transaction<br>
        ・考慮使用 Outbox Pattern 確保 Domain Event 與資料庫變更的一致性<br>
        ・大型系統可將 CQRS 的讀取端獨立為 Read Database（最終一致性）
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/ddd/project', label: '專案實作' }"
      :next="{ path: '/csharp/efcore/intro', label: 'EF Core 概述' }"
    />
  </div>
</template>
