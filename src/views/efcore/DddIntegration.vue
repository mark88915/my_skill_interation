<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>整合 DDD</h1>
    <p class="page-subtitle">將 EF Core 與 DDD 模式完美結合的完整實作</p>

    <h2>整體架構回顧</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 550px;">
        <strong>WebApi（Presentation）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Controllers → MediatR → Commands/Queries</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer application" style="max-width: 550px;">
        <strong>Application</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Command Handlers / Query Handlers（協調領域物件）</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 550px;">
        <strong>Domain（核心）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Aggregates, Entities, Value Objects, Domain Events, Repository Interfaces</div>
      </div>
      <div class="arch-arrow">⬆️ 依賴反轉</div>
      <div class="arch-layer infrastructure" style="max-width: 550px;">
        <strong>Infrastructure（EF Core + SQL Server）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">DbContext, Configurations, Repository 實作, Domain Event 發送</div>
      </div>
    </div>

    <h2>關鍵整合點</h2>

    <h3>1. DbContext 實作 IUnitOfWork + 自動發送 Domain Event</h3>
    <CodeBlock lang="csharp" filename="Infrastructure/Persistence/AppDbContext.cs" :code="`
public class AppDbContext : DbContext, IUnitOfWork
{
    private readonly IMediator _mediator;

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Product> Products => Set<Product>();

    public AppDbContext(
        DbContextOptions<AppDbContext> options,
        IMediator mediator) : base(options)
    {
        _mediator = mediator;
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }

    public override async Task<int> SaveChangesAsync(
        CancellationToken ct = default)
    {
        // 1. 收集所有 Aggregate Root 的 Domain Events
        var aggregateRoots = ChangeTracker.Entries()
            .Where(e => e.Entity is IAggregateRoot)
            .Select(e => (IAggregateRoot)e.Entity)
            .Where(a => a.DomainEvents.Any())
            .ToList();

        var domainEvents = aggregateRoots
            .SelectMany(a => a.DomainEvents)
            .ToList();

        // 2. 清除事件（避免重複發送）
        aggregateRoots.ForEach(a => a.ClearDomainEvents());

        // 3. 儲存變更到資料庫
        var result = await base.SaveChangesAsync(ct);

        // 4. 發送 Domain Events（SaveChanges 成功後）
        foreach (var domainEvent in domainEvents)
        {
            await _mediator.Publish(domainEvent, ct);
        }

        return result;
    }
}

// 讓 AggregateRoot 實作 IAggregateRoot 介面
public interface IAggregateRoot
{
    IReadOnlyCollection<DomainEvent> DomainEvents { get; }
    void ClearDomainEvents();
}`" />

    <h3>2. Strongly Typed ID 的全域設定</h3>
    <CodeBlock lang="csharp" filename="Infrastructure/Persistence/ValueConverters.cs" :code="`
// 集中管理所有 Value Converter
public static class ValueConverterExtensions
{
    public static void ConfigureStronglyTypedIds(
        this ModelBuilder modelBuilder)
    {
        // OrderId
        modelBuilder.Entity<Order>()
            .Property(o => o.Id)
            .HasConversion(id => id.Value, v => new OrderId(v));

        // ProductId
        modelBuilder.Entity<Product>()
            .Property(p => p.Id)
            .HasConversion(id => id.Value, v => new ProductId(v));

        // 或使用 EF Core 8 的 Convention
    }
}

// EF Core 8+：用 Convention 自動轉換所有 Strongly Typed ID
public class StronglyTypedIdConvention : IModelFinalizingConvention
{
    public void ProcessModelFinalizing(
        IConventionModelBuilder modelBuilder,
        IConventionContext<IConventionModelBuilder> context)
    {
        foreach (var entityType in modelBuilder.Metadata.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                var clrType = property.ClrType;
                if (IsStronglyTypedId(clrType))
                {
                    // 自動設定 ValueConverter
                    property.SetValueConverter(
                        CreateConverter(clrType));
                }
            }
        }
    }

    private static bool IsStronglyTypedId(Type type)
        => type.IsValueType
           && type.GetProperty(&quot;Value&quot;) is not null
           && type.GetProperty(&quot;Value&quot;)!.PropertyType == typeof(Guid);
}`" />

    <h3>3. Repository 實作完整範例</h3>
    <CodeBlock lang="csharp" filename="Infrastructure/Repositories/OrderRepository.cs" :code="`
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context) => _context = context;

    public async Task<Order?> GetByIdAsync(
        OrderId id, CancellationToken ct = default)
    {
        // Include 子 Entity，確保 Aggregate 完整載入
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task<IReadOnlyList<Order>> GetByCustomerIdAsync(
        CustomerId customerId, CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .Where(o => o.CustomerId == customerId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task AddAsync(Order order, CancellationToken ct = default)
        => await _context.Orders.AddAsync(order, ct);

    public void Update(Order order)
        => _context.Orders.Update(order);

    public void Remove(Order order)
        => _context.Orders.Remove(order);
}`" />

    <h3>4. 完整 Command Handler（建立訂單）</h3>
    <CodeBlock lang="csharp" filename="Application/Orders/Commands/CreateOrderCommand.cs" :code="`
// Command
public record CreateOrderCommand(
    Guid CustomerId,
    AddressDto ShippingAddress,
    List<OrderItemDto> Items
) : IRequest<Result<Guid>>;

public record AddressDto(
    string City, string District, string Street, string ZipCode);

public record OrderItemDto(
    Guid ProductId, string ProductName,
    decimal UnitPrice, int Quantity);

// Handler
public class CreateOrderCommandHandler
    : IRequestHandler<CreateOrderCommand, Result<Guid>>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IUnitOfWork _unitOfWork;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepo, IUnitOfWork unitOfWork)
    {
        _orderRepo = orderRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Guid>> Handle(
        CreateOrderCommand request, CancellationToken ct)
    {
        try
        {
            // 1. 建立 Value Objects
            var address = new ShippingAddress(
                request.ShippingAddress.City,
                request.ShippingAddress.District,
                request.ShippingAddress.Street,
                request.ShippingAddress.ZipCode);

            // 2. 建立 Aggregate（透過工廠方法）
            var order = Order.Create(
                new CustomerId(request.CustomerId),
                address);

            // 3. 新增項目
            foreach (var item in request.Items)
            {
                order.AddItem(
                    new ProductId(item.ProductId),
                    item.ProductName,
                    new Money(item.UnitPrice, Currency.TWD),
                    item.Quantity);
            }

            // 4. 持久化
            await _orderRepo.AddAsync(order, ct);
            await _unitOfWork.SaveChangesAsync(ct);
            // Domain Events 在 SaveChanges 中自動發送

            return Result.Success(order.Id.Value);
        }
        catch (DomainException ex)
        {
            return Result.Failure<Guid>(ex.Message);
        }
    }
}`" />

    <h3>5. DI 註冊（彙整）</h3>
    <CodeBlock lang="csharp" filename="Infrastructure/DependencyInjection.cs" :code="`
namespace EShop.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // DbContext + SQL Server
        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(
                configuration.GetConnectionString(&quot;DefaultConnection&quot;),
                sql => sql.EnableRetryOnFailure(3));
        });

        // UnitOfWork = DbContext
        services.AddScoped<IUnitOfWork>(sp =>
            sp.GetRequiredService<AppDbContext>());

        // Repositories
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();

        return services;
    }
}

// Program.cs
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssemblyContaining<CreateOrderCommand>());

builder.Services.AddControllers();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();
app.MapControllers();
app.Run();`" />

    <h2>完整流程圖</h2>
    <div class="info-box purple">
      <div class="info-box-title">📐 一個請求的生命週期</div>
      <p>
        1. HTTP POST /api/orders → <strong>OrdersController</strong><br>
        2. Controller 建立 <code>CreateOrderCommand</code> 送給 <strong>MediatR</strong><br>
        3. <strong>CreateOrderCommandHandler</strong> 接手處理<br>
        4. 建立 <code>Order</code> Aggregate（Domain Layer 驗證業務規則）<br>
        5. 透過 <code>IOrderRepository</code> 持久化（Infrastructure 的 EF Core 實作）<br>
        6. <code>SaveChangesAsync</code> → EF Core 產生 INSERT SQL 寫入 <strong>SQL Server</strong><br>
        7. 成功後自動發送 <code>OrderCreatedEvent</code>（Domain Event）<br>
        8. Event Handler 執行後續動作（通知、庫存等）<br>
        9. 回傳 201 Created + Order ID
      </p>
    </div>

    <h2>測試策略</h2>
    <CodeBlock lang="csharp" filename="Domain.Tests/OrderTests.cs" :code="`
// Domain 層測試：純單元測試，不需要 DB
public class OrderTests
{
    [Fact]
    public void Create_ShouldReturnOrder_WithPendingStatus()
    {
        var order = Order.Create(
            CustomerId.NewId(),
            new ShippingAddress(&quot;台北市&quot;, &quot;信義區&quot;, &quot;XX路&quot;, &quot;110&quot;));

        Assert.Equal(OrderStatus.Pending, order.Status);
        Assert.Empty(order.Items);
        Assert.Single(order.DomainEvents);
        Assert.IsType<OrderCreatedEvent>(order.DomainEvents.First());
    }

    [Fact]
    public void Confirm_WithNoItems_ShouldThrowDomainException()
    {
        var order = Order.Create(
            CustomerId.NewId(),
            new ShippingAddress(&quot;台北市&quot;, &quot;信義區&quot;, &quot;XX路&quot;, &quot;110&quot;));

        Assert.Throws<DomainException>(() => order.Confirm());
    }

    [Fact]
    public void AddItem_ShouldRecalculateTotal()
    {
        var order = Order.Create(
            CustomerId.NewId(),
            new ShippingAddress(&quot;台北市&quot;, &quot;信義區&quot;, &quot;XX路&quot;, &quot;110&quot;));

        order.AddItem(
            ProductId.NewId(), &quot;商品A&quot;,
            new Money(100, Currency.TWD), 3);

        Assert.Single(order.Items);
        Assert.Equal(300, order.TotalAmount.Amount);
    }
}`" />

    <CodeBlock lang="csharp" filename="Integration.Tests/OrderRepositoryTests.cs" :code="`
// 整合測試：使用真實的 SQL Server（或 In-Memory DB）
public class OrderRepositoryTests : IClassFixture<DatabaseFixture>
{
    private readonly AppDbContext _context;
    private readonly OrderRepository _repo;

    public OrderRepositoryTests(DatabaseFixture fixture)
    {
        _context = fixture.CreateContext();
        _repo = new OrderRepository(_context);
    }

    [Fact]
    public async Task AddAndRetrieve_ShouldPersistOrder()
    {
        // Arrange
        var order = Order.Create(
            CustomerId.NewId(),
            new ShippingAddress(&quot;台北市&quot;, &quot;信義區&quot;, &quot;XX路&quot;, &quot;110&quot;));
        order.AddItem(ProductId.NewId(), &quot;測試商品&quot;,
            new Money(500, Currency.TWD), 2);

        // Act
        await _repo.AddAsync(order);
        await _context.SaveChangesAsync();

        // Assert（用新的 DbContext 確認真正寫入 DB）
        var retrieved = await _repo.GetByIdAsync(order.Id);
        Assert.NotNull(retrieved);
        Assert.Single(retrieved!.Items);
        Assert.Equal(1000, retrieved.TotalAmount.Amount);
    }
}`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 恭喜完成！</div>
      <p>
        你已經學完 DDD + EF Core 的完整教學！現在你具備了：<br>
        ・使用 DDD 戰略與戰術設計來建模複雜業務<br>
        ・使用 EF Core Fluent API 映射 Domain Model 到 SQL Server<br>
        ・使用 Clean Architecture 分層設計<br>
        ・使用 CQRS + Domain Event 實現鬆耦合架構<br>
        ・撰寫單元測試與整合測試
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/efcore/advanced', label: '進階查詢' }"
    />
  </div>
</template>
