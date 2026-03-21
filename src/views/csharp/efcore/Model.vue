<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>模型設定</h1>
    <p class="page-subtitle">使用 Fluent API 精確控制 Entity 到資料庫的映射</p>

    <h2>兩種設定方式</h2>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Data Annotations</th>
          <th>Fluent API</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>位置</strong></td>
          <td>Entity 類別上的 Attribute</td>
          <td>DbContext.OnModelCreating 或獨立 Configuration 類別</td>
        </tr>
        <tr>
          <td><strong>優點</strong></td>
          <td>簡單直觀</td>
          <td>功能完整、不汙染 Domain Model</td>
        </tr>
        <tr>
          <td><strong>DDD 適配</strong></td>
          <td>❌ 汙染 Domain Model</td>
          <td>⭐ 完美分離</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box purple">
      <div class="info-box-title">📐 DDD 原則</div>
      <p>Domain Layer 不應該依賴 EF Core。使用 Fluent API 搭配獨立的 <code>IEntityTypeConfiguration</code>，讓所有資料庫映射設定留在 Infrastructure Layer。</p>
    </div>

    <h2>Data Annotations（不推薦用於 DDD）</h2>
    <CodeBlock lang="csharp" filename="不推薦：Data Annotations" :code="`
// ❌ Domain Model 被 EF Core 的 Attribute 汙染
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

[Table(&quot;Products&quot;)]
public class Product
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = &quot;decimal(18,2)&quot;)]
    public decimal Price { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }
}`" />

    <h2>Fluent API（推薦）</h2>
    <CodeBlock lang="csharp" filename="Infrastructure/Configurations/ProductConfiguration.cs" :code="`
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EShop.Infrastructure.Persistence.Configurations;

// ✅ 獨立的 Configuration 類別，Domain Model 保持乾淨
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // 資料表名稱
        builder.ToTable(&quot;Products&quot;);

        // 主鍵
        builder.HasKey(p => p.Id);

        // Strongly Typed ID 轉換
        builder.Property(p => p.Id)
            .HasConversion(
                id => id.Value,         // 寫入 DB 時轉為 Guid
                value => new ProductId(value))  // 讀取 DB 時轉為 ProductId
            .ValueGeneratedNever();

        // 字串屬性
        builder.Property(p => p.Name)
            .HasMaxLength(200)
            .IsRequired();

        builder.Property(p => p.Description)
            .HasMaxLength(2000);

        // 是否啟用
        builder.Property(p => p.IsActive)
            .HasDefaultValue(true);

        // 索引
        builder.HasIndex(p => p.Name);

        // 忽略特定屬性（不對應到資料庫）
        // builder.Ignore(p => p.SomeComputedProperty);
    }
}`" />

    <h2>Value Object 的映射</h2>
    <p>EF Core 支援 <strong>Owned Entity</strong> 來映射 Value Object，可以存在同一張表或獨立表。</p>

    <h3>方式一：Owned Entity（同表）</h3>
    <CodeBlock lang="csharp" filename="Infrastructure/Configurations/OrderConfiguration.cs" :code="`
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable(&quot;Orders&quot;);

        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id)
            .HasConversion(
                id => id.Value,
                value => new OrderId(value));

        builder.Property(o => o.CustomerId)
            .HasConversion(
                id => id.Value,
                value => new CustomerId(value));

        // Value Object: Money（映射到同一張表的兩個欄位）
        builder.OwnsOne(o => o.TotalAmount, money =>
        {
            money.Property(m => m.Amount)
                .HasColumnName(&quot;TotalAmount&quot;)
                .HasColumnType(&quot;decimal(18,2)&quot;);

            money.OwnsOne(m => m.Currency, currency =>
            {
                currency.Property(c => c.Code)
                    .HasColumnName(&quot;CurrencyCode&quot;)
                    .HasMaxLength(3);

                currency.Property(c => c.Symbol)
                    .HasColumnName(&quot;CurrencySymbol&quot;)
                    .HasMaxLength(5);
            });
        });

        // Value Object: ShippingAddress
        builder.OwnsOne(o => o.ShippingAddress, addr =>
        {
            addr.Property(a => a.City)
                .HasColumnName(&quot;ShipCity&quot;)
                .HasMaxLength(50);
            addr.Property(a => a.District)
                .HasColumnName(&quot;ShipDistrict&quot;)
                .HasMaxLength(50);
            addr.Property(a => a.Street)
                .HasColumnName(&quot;ShipStreet&quot;)
                .HasMaxLength(200);
            addr.Property(a => a.ZipCode)
                .HasColumnName(&quot;ShipZipCode&quot;)
                .HasMaxLength(10);
        });

        // Enum 映射
        builder.Property(o => o.Status)
            .HasConversion<string>()  // 存為字串而非數字
            .HasMaxLength(20);

        builder.Property(o => o.CreatedAt);

        // 子 Entity 集合（OrderItem）
        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(&quot;OrderId&quot;)
            .OnDelete(DeleteBehavior.Cascade);

        // 存取 private backing field
        builder.Navigation(o => o.Items)
            .UsePropertyAccessMode(PropertyAccessMode.Field)
            .HasField(&quot;_items&quot;);
    }
}`" />

    <h3>方式二：Value Conversion（簡單 Value Object）</h3>
    <CodeBlock lang="csharp" filename="簡單 Value Object 的轉換" :code="`
// 對於簡單的 Value Object，可以用 HasConversion
builder.Property(o => o.Id)
    .HasConversion(
        id => id.Value,           // C# → DB
        value => new OrderId(value));  // DB → C#

// 也可以建立可重用的 ValueConverter
public class OrderIdConverter : ValueConverter<OrderId, Guid>
{
    public OrderIdConverter()
        : base(id => id.Value, value => new OrderId(value))
    {
    }
}

// 使用
builder.Property(o => o.Id)
    .HasConversion(new OrderIdConverter());`" />

    <h2>Private 集合的映射</h2>
    <p>DDD 中我們常用 private backing field 來保護集合，EF Core 可以直接存取。</p>

    <CodeBlock lang="csharp" filename="映射 private backing field" :code="`
// Domain Model
public class Order
{
    // private backing field
    private readonly List<OrderItem> _items = new();

    // 對外唯讀
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
}

// Configuration
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        // 告訴 EF Core 使用 _items field
        builder.HasMany(o => o.Items)
            .WithOne()
            .HasForeignKey(&quot;OrderId&quot;);

        builder.Navigation(o => o.Items)
            .UsePropertyAccessMode(PropertyAccessMode.Field)
            .HasField(&quot;_items&quot;);
    }
}`" />

    <h2>生成的 SQL Server 結構</h2>
    <CodeBlock lang="sql" filename="Generated Table: Orders" :code="`
-- EF Core 根據 Fluent API 設定產生的資料表
CREATE TABLE [Orders] (
    [Id]               UNIQUEIDENTIFIER NOT NULL,
    [CustomerId]       UNIQUEIDENTIFIER NOT NULL,
    [Status]           NVARCHAR(20)     NOT NULL,
    [TotalAmount]      DECIMAL(18,2)    NOT NULL,
    [CurrencyCode]     NVARCHAR(3)      NOT NULL,
    [CurrencySymbol]   NVARCHAR(5)      NOT NULL,
    [ShipCity]         NVARCHAR(50)     NOT NULL,
    [ShipDistrict]     NVARCHAR(50)     NOT NULL,
    [ShipStreet]       NVARCHAR(200)    NOT NULL,
    [ShipZipCode]      NVARCHAR(10)     NOT NULL,
    [CreatedAt]        DATETIME2        NOT NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id])
);`" />

    <div class="info-box info">
      <div class="info-box-title">📌 小結</div>
      <p>使用 Fluent API 搭配 <code>IEntityTypeConfiguration</code>，可以讓 Domain Model 完全不知道 EF Core 的存在，同時精確控制資料庫映射的每個細節。</p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/efcore/setup', label: '環境設定' }"
      :next="{ path: '/csharp/efcore/crud', label: 'CRUD 操作' }"
    />
  </div>
</template>
