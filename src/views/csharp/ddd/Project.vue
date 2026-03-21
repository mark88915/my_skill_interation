<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>專案實作</h1>
    <p class="page-subtitle">從零建立一個 DDD 電商專案</p>

    <h2>專案結構</h2>
    <CodeBlock lang="bash" filename="Solution Structure" :code="`
EShop/
├── EShop.sln
│
├── src/
│   ├── EShop.Domain/                    # 領域層
│   │   ├── Common/
│   │   │   ├── Entity.cs
│   │   │   ├── AggregateRoot.cs
│   │   │   ├── ValueObject.cs
│   │   │   └── DomainEvent.cs
│   │   ├── Aggregates/
│   │   │   ├── Orders/
│   │   │   │   ├── Order.cs
│   │   │   │   ├── OrderItem.cs
│   │   │   │   ├── OrderStatus.cs
│   │   │   │   └── IOrderRepository.cs
│   │   │   └── Products/
│   │   │       ├── Product.cs
│   │   │       └── IProductRepository.cs
│   │   ├── ValueObjects/
│   │   │   ├── Money.cs
│   │   │   ├── Address.cs
│   │   │   └── StronglyTypedIds.cs
│   │   ├── Services/
│   │   │   └── PricingService.cs
│   │   ├── Events/
│   │   │   └── OrderEvents.cs
│   │   └── Exceptions/
│   │       └── DomainException.cs
│   │
│   ├── EShop.Application/              # 應用層
│   │   ├── Common/
│   │   │   ├── IUnitOfWork.cs
│   │   │   └── Result.cs
│   │   ├── Orders/
│   │   │   ├── Commands/
│   │   │   │   ├── CreateOrderCommand.cs
│   │   │   │   └── ConfirmOrderCommand.cs
│   │   │   ├── Queries/
│   │   │   │   ├── GetOrderByIdQuery.cs
│   │   │   │   └── GetOrdersByCustomerQuery.cs
│   │   │   └── DTOs/
│   │   │       └── OrderDto.cs
│   │   └── Products/
│   │       ├── Commands/
│   │       └── Queries/
│   │
│   ├── EShop.Infrastructure/           # 基礎設施層
│   │   ├── Persistence/
│   │   │   ├── AppDbContext.cs
│   │   │   ├── Configurations/
│   │   │   │   ├── OrderConfiguration.cs
│   │   │   │   └── ProductConfiguration.cs
│   │   │   └── Migrations/
│   │   ├── Repositories/
│   │   │   ├── OrderRepository.cs
│   │   │   └── ProductRepository.cs
│   │   └── DependencyInjection.cs
│   │
│   └── EShop.WebApi/                   # 展示層
│       ├── Controllers/
│       │   ├── OrdersController.cs
│       │   └── ProductsController.cs
│       ├── Middleware/
│       │   └── ExceptionHandlingMiddleware.cs
│       ├── Program.cs
│       └── appsettings.json
│
└── tests/
    ├── EShop.Domain.Tests/
    ├── EShop.Application.Tests/
    └── EShop.Integration.Tests/`" />

    <h2>步驟 1：建立 Solution</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 建立解決方案
dotnet new sln -n EShop

# 建立各層專案
dotnet new classlib -n EShop.Domain -o src/EShop.Domain
dotnet new classlib -n EShop.Application -o src/EShop.Application
dotnet new classlib -n EShop.Infrastructure -o src/EShop.Infrastructure
dotnet new webapi -n EShop.WebApi -o src/EShop.WebApi

# 加入解決方案
dotnet sln add src/EShop.Domain
dotnet sln add src/EShop.Application
dotnet sln add src/EShop.Infrastructure
dotnet sln add src/EShop.WebApi

# 設定專案參考（依賴方向）
cd src/EShop.Application
dotnet add reference ../EShop.Domain

cd ../EShop.Infrastructure
dotnet add reference ../EShop.Domain
dotnet add reference ../EShop.Application

cd ../EShop.WebApi
dotnet add reference ../EShop.Application
dotnet add reference ../EShop.Infrastructure`" />

    <h2>步驟 2：安裝必要套件</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# EShop.Infrastructure - EF Core + SQL Server
cd src/EShop.Infrastructure
dotnet add package Microsoft.EntityFrameworkCore
dotnet add package Microsoft.EntityFrameworkCore.SqlServer
dotnet add package Microsoft.EntityFrameworkCore.Tools

# EShop.Application - MediatR
cd ../EShop.Application
dotnet add package MediatR

# EShop.WebApi - Swagger
cd ../EShop.WebApi
dotnet add package Microsoft.EntityFrameworkCore.Design`" />

    <h2>步驟 3：Strongly Typed ID</h2>
    <CodeBlock lang="csharp" filename="Domain/ValueObjects/StronglyTypedIds.cs" :code="`
namespace EShop.Domain.ValueObjects;

// 用 record struct 實作強型別 ID，避免 Primitive Obsession
public readonly record struct OrderId(Guid Value)
{
    public static OrderId NewId() => new(Guid.NewGuid());
    public override string ToString() => Value.ToString();
}

public readonly record struct OrderItemId(Guid Value)
{
    public static OrderItemId NewId() => new(Guid.NewGuid());
}

public readonly record struct ProductId(Guid Value)
{
    public static ProductId NewId() => new(Guid.NewGuid());
}

public readonly record struct CustomerId(Guid Value)
{
    public static CustomerId NewId() => new(Guid.NewGuid());
}`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 Strongly Typed ID 的好處</div>
      <p>
        避免將 OrderId 誤傳為 CustomerId。
        使用 <code>record struct</code> 比 <code>class</code> 更輕量，而且自動具備值相等語義。
      </p>
    </div>

    <h2>步驟 4：Domain Exception</h2>
    <CodeBlock lang="csharp" filename="Domain/Exceptions/DomainException.cs" :code="`
namespace EShop.Domain.Exceptions;

public class DomainException : Exception
{
    public DomainException(string message) : base(message) { }

    public DomainException(string message, Exception innerException)
        : base(message, innerException) { }
}`" />

    <h2>步驟 5：Application 層的 Result 模式</h2>
    <CodeBlock lang="csharp" filename="Application/Common/Result.cs" :code="`
namespace EShop.Application.Common;

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }

    protected Result(bool isSuccess, string? error)
    {
        IsSuccess = isSuccess;
        Error = error;
    }

    public static Result Success() => new(true, null);
    public static Result Failure(string error) => new(false, error);
    public static Result<T> Success<T>(T value) => new(value, true, null);
    public static Result<T> Failure<T>(string error) => new(default, false, error);
}

public class Result<T> : Result
{
    public T? Value { get; }

    internal Result(T? value, bool isSuccess, string? error)
        : base(isSuccess, error)
    {
        Value = value;
    }
}`" />

    <h2>步驟 6：全域例外處理</h2>
    <CodeBlock lang="csharp" filename="WebApi/Middleware/ExceptionHandlingMiddleware.cs" :code="`
namespace EShop.WebApi.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DomainException ex)
        {
            _logger.LogWarning(ex, &quot;Domain exception: {Message}&quot;, ex.Message);
            context.Response.StatusCode = 400;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message,
                type = &quot;DomainError&quot;
            });
        }
        catch (NotFoundException ex)
        {
            context.Response.StatusCode = 404;
            await context.Response.WriteAsJsonAsync(new
            {
                error = ex.Message,
                type = &quot;NotFound&quot;
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, &quot;Unhandled exception&quot;);
            context.Response.StatusCode = 500;
            await context.Response.WriteAsJsonAsync(new
            {
                error = &quot;發生系統錯誤，請稍後再試&quot;,
                type = &quot;InternalError&quot;
            });
        }
    }
}`" />

    <h2>步驟 7：appsettings.json</h2>
    <CodeBlock lang="json" filename="WebApi/appsettings.json" :code="`
{
  &quot;ConnectionStrings&quot;: {
    &quot;DefaultConnection&quot;: &quot;Server=(localdb)\\\\mssqllocaldb;Database=EShopDb;Trusted_Connection=True;MultipleActiveResultSets=true&quot;
  },
  &quot;Logging&quot;: {
    &quot;LogLevel&quot;: {
      &quot;Default&quot;: &quot;Information&quot;,
      &quot;Microsoft.EntityFrameworkCore&quot;: &quot;Warning&quot;
    }
  }
}`" />

    <div class="info-box info">
      <div class="info-box-title">📌 下一步</div>
      <p>專案骨架已建立完成。接下來在「EF Core 教學」中，我們會詳細說明如何設定 DbContext、Entity Configuration、Migration 等，並在最後的「整合 DDD」章節中串接所有內容。</p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/ddd/layers', label: '分層架構' }"
      :next="{ path: '/csharp/ddd/advanced', label: '進階主題' }"
    />
  </div>
</template>
