<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>分層架構</h1>
    <p class="page-subtitle">Clean Architecture 與 DDD 的分層設計</p>

    <h2>經典四層架構</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation">
        <strong>Presentation Layer（展示層）</strong>
        <div style="font-size: 13px; font-weight: 400; margin-top: 4px;">API Controllers, DTOs, Middleware</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer application">
        <strong>Application Layer（應用層）</strong>
        <div style="font-size: 13px; font-weight: 400; margin-top: 4px;">Use Cases, Commands, Queries, Application Services</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain">
        <strong>Domain Layer（領域層）⭐ 核心</strong>
        <div style="font-size: 13px; font-weight: 400; margin-top: 4px;">Entities, Value Objects, Aggregates, Domain Events, Repository Interfaces</div>
      </div>
      <div class="arch-arrow">⬆️</div>
      <div class="arch-layer infrastructure">
        <strong>Infrastructure Layer（基礎設施層）</strong>
        <div style="font-size: 13px; font-weight: 400; margin-top: 4px;">EF Core, SQL Server, Email, 外部 API, Repository 實作</div>
      </div>
    </div>

    <div class="info-box purple">
      <div class="info-box-title">📐 依賴方向原則</div>
      <p>
        依賴只能由外向內：Presentation → Application → Domain ← Infrastructure。
        Domain Layer 不依賴任何外層，Infrastructure 實作 Domain 定義的介面（依賴反轉）。
      </p>
    </div>

    <h2>各層職責</h2>

    <h3>1. Domain Layer（領域層）</h3>
    <p>系統的核心，包含所有業務邏輯，不依賴任何外部框架。</p>
    <CodeBlock lang="csharp" filename="Domain/Aggregates/Order.cs" :code="`
// Domain Layer 只有純 C# 程式碼，不依賴 EF Core、ASP.NET 等
namespace EShop.Domain.Aggregates.Orders;

public class Order : AggregateRoot<OrderId>
{
    public CustomerId CustomerId { get; private set; }
    public OrderStatus Status { get; private set; }
    public Money TotalAmount { get; private set; }
    // ... 省略其他屬性

    public void Confirm()
    {
        if (Status != OrderStatus.Pending)
            throw new DomainException(&quot;只有待處理的訂單可以確認&quot;);

        Status = OrderStatus.Confirmed;
        AddDomainEvent(new OrderConfirmedEvent(Id, TotalAmount));
    }
}`" />

    <h3>2. Application Layer（應用層）</h3>
    <p>協調 Domain 物件完成使用案例，不包含業務邏輯。常搭配 CQRS 模式。</p>
    <CodeBlock lang="csharp" filename="Application/Commands/ConfirmOrderCommand.cs" :code="`
namespace EShop.Application.Orders.Commands;

// Command 定義
public record ConfirmOrderCommand(Guid OrderId) : IRequest<Result>;

// Command Handler
public class ConfirmOrderCommandHandler
    : IRequestHandler<ConfirmOrderCommand, Result>
{
    private readonly IOrderRepository _orderRepo;
    private readonly IUnitOfWork _unitOfWork;

    public ConfirmOrderCommandHandler(
        IOrderRepository orderRepo, IUnitOfWork unitOfWork)
    {
        _orderRepo = orderRepo;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(
        ConfirmOrderCommand request, CancellationToken ct)
    {
        var orderId = new OrderId(request.OrderId);
        var order = await _orderRepo.GetByIdAsync(orderId, ct)
            ?? throw new NotFoundException(&quot;訂單不存在&quot;);

        // 呼叫 Domain 的業務邏輯
        order.Confirm();

        // 持久化
        _orderRepo.Update(order);
        await _unitOfWork.SaveChangesAsync(ct);

        return Result.Success();
    }
}`" />

    <h3>3. Infrastructure Layer（基礎設施層）</h3>
    <p>實作 Domain 定義的介面，處理技術細節。</p>
    <CodeBlock lang="csharp" filename="Infrastructure/Repositories/OrderRepository.cs" :code="`
namespace EShop.Infrastructure.Repositories;

public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _context;

    public OrderRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Order?> GetByIdAsync(
        OrderId id, CancellationToken ct = default)
    {
        return await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id, ct);
    }

    public async Task AddAsync(
        Order order, CancellationToken ct = default)
    {
        await _context.Orders.AddAsync(order, ct);
    }

    public void Update(Order order)
    {
        _context.Orders.Update(order);
    }

    public void Remove(Order order)
    {
        _context.Orders.Remove(order);
    }

    public async Task<IReadOnlyList<Order>> GetByCustomerIdAsync(
        CustomerId customerId, CancellationToken ct = default)
    {
        return await _context.Orders
            .Where(o => o.CustomerId == customerId)
            .Include(o => o.Items)
            .ToListAsync(ct);
    }
}`" />

    <h3>4. Presentation Layer（展示層）</h3>
    <p>處理 HTTP 請求，將外部輸入轉為 Application 層的 Command/Query。</p>
    <CodeBlock lang="csharp" filename="WebApi/Controllers/OrdersController.cs" :code="`
namespace EShop.WebApi.Controllers;

[ApiController]
[Route(&quot;api/[controller]&quot;)]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost(&quot;{orderId:guid}/confirm&quot;)]
    public async Task<IActionResult> Confirm(Guid orderId)
    {
        var result = await _mediator.Send(
            new ConfirmOrderCommand(orderId));

        return result.IsSuccess
            ? Ok()
            : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderRequest request)
    {
        var result = await _mediator.Send(
            new CreateOrderCommand(
                request.CustomerId,
                request.ShippingAddress,
                request.Items));

        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById),
                new { orderId = result.Value }, result.Value)
            : BadRequest(result.Error);
    }

    [HttpGet(&quot;{orderId:guid}&quot;)]
    public async Task<IActionResult> GetById(Guid orderId)
    {
        var result = await _mediator.Send(
            new GetOrderByIdQuery(orderId));

        return result is not null
            ? Ok(result)
            : NotFound();
    }
}`" />

    <h2>DI 註冊</h2>
    <CodeBlock lang="csharp" filename="WebApi/Program.cs" :code="`
var builder = WebApplication.CreateBuilder(args);

// Infrastructure 層：EF Core + SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(&quot;DefaultConnection&quot;)));

// Repository 註冊
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IUnitOfWork>(sp =>
    sp.GetRequiredService<AppDbContext>());

// Application 層：MediatR
builder.Services.AddMediatR(cfg =>
    cfg.RegisterServicesFromAssembly(
        typeof(ConfirmOrderCommand).Assembly));

// Domain Services
builder.Services.AddScoped<PricingService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();
app.MapControllers();
app.Run();`" />

    <PageNav
      :prev="{ path: '/csharp/ddd/tactical', label: '戰術設計' }"
      :next="{ path: '/csharp/ddd/project', label: '專案實作' }"
    />
  </div>
</template>
