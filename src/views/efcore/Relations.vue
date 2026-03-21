<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>關聯設定</h1>
    <p class="page-subtitle">一對一、一對多、多對多的 EF Core 設定方式</p>

    <h2>一對多 (One-to-Many)</h2>
    <p>最常見的關聯類型。例如：一個 Order 有多個 OrderItem。</p>

    <CodeBlock lang="csharp" filename="Entity 定義" :code="`
// 一（Order）
public class Order
{
    public OrderId Id { get; private set; }
    private readonly List<OrderItem> _items = new();
    public IReadOnlyCollection<OrderItem> Items => _items.AsReadOnly();
}

// 多（OrderItem）
public class OrderItem
{
    public OrderItemId Id { get; private set; }
    public ProductId ProductId { get; private set; }
    public string ProductName { get; private set; }
    public Money UnitPrice { get; private set; }
    public int Quantity { get; private set; }
}`" />

    <CodeBlock lang="csharp" filename="Fluent API 設定" :code="`
public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.HasMany(o => o.Items)
            .WithOne()                    // OrderItem 不需要導航屬性回 Order
            .HasForeignKey(&quot;OrderId&quot;)     // Shadow Property 作為 FK
            .OnDelete(DeleteBehavior.Cascade);  // 刪 Order 連帶刪 Items

        // 讓 EF Core 存取 private field
        builder.Navigation(o => o.Items)
            .UsePropertyAccessMode(PropertyAccessMode.Field)
            .HasField(&quot;_items&quot;);
    }
}

public class OrderItemConfiguration : IEntityTypeConfiguration<OrderItem>
{
    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable(&quot;OrderItems&quot;);

        builder.HasKey(i => i.Id);
        builder.Property(i => i.Id)
            .HasConversion(id => id.Value, v => new OrderItemId(v));

        builder.Property(i => i.ProductId)
            .HasConversion(id => id.Value, v => new ProductId(v));

        builder.Property(i => i.ProductName)
            .HasMaxLength(200)
            .IsRequired();

        builder.OwnsOne(i => i.UnitPrice, money =>
        {
            money.Property(m => m.Amount)
                .HasColumnName(&quot;UnitPrice&quot;)
                .HasColumnType(&quot;decimal(18,2)&quot;);
        });
    }
}`" />

    <CodeBlock lang="sql" filename="產生的資料表" :code="`
CREATE TABLE [OrderItems] (
    [Id]          UNIQUEIDENTIFIER NOT NULL,
    [OrderId]     UNIQUEIDENTIFIER NOT NULL,  -- Shadow FK
    [ProductId]   UNIQUEIDENTIFIER NOT NULL,
    [ProductName] NVARCHAR(200)    NOT NULL,
    [UnitPrice]   DECIMAL(18,2)    NOT NULL,
    [Quantity]    INT              NOT NULL,
    CONSTRAINT [PK_OrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderItems_Orders] FOREIGN KEY ([OrderId])
        REFERENCES [Orders]([Id]) ON DELETE CASCADE
);`" />

    <h2>一對一 (One-to-One)</h2>
    <p>例如：一個 Order 有一個 ShippingInfo。</p>

    <CodeBlock lang="csharp" filename="一對一設定" :code="`
// Entity
public class ShippingInfo
{
    public Guid Id { get; private set; }
    public OrderId OrderId { get; private set; }
    public string TrackingNumber { get; private set; } = string.Empty;
    public string Carrier { get; private set; } = string.Empty;
    public DateTime? ShippedAt { get; private set; }
}

// Configuration
public class ShippingInfoConfiguration
    : IEntityTypeConfiguration<ShippingInfo>
{
    public void Configure(EntityTypeBuilder<ShippingInfo> builder)
    {
        builder.ToTable(&quot;ShippingInfos&quot;);

        builder.HasKey(s => s.Id);

        builder.Property(s => s.OrderId)
            .HasConversion(id => id.Value, v => new OrderId(v));

        // 一對一：ShippingInfo 依賴 Order
        builder.HasOne<Order>()
            .WithOne()
            .HasForeignKey<ShippingInfo>(s => s.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(s => s.OrderId).IsUnique();

        builder.Property(s => s.TrackingNumber).HasMaxLength(100);
        builder.Property(s => s.Carrier).HasMaxLength(50);
    }
}`" />

    <h2>多對多 (Many-to-Many)</h2>
    <p>例如：Product 和 Category 的多對多關聯。</p>

    <h3>方式一：隱式聯結表（EF Core 5+）</h3>
    <CodeBlock lang="csharp" filename="隱式多對多" :code="`
// Entity
public class Product
{
    public ProductId Id { get; private set; }
    public string Name { get; private set; }
    public List<Category> Categories { get; private set; } = new();
}

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<Product> Products { get; set; } = new();
}

// Configuration
builder.HasMany(p => p.Categories)
    .WithMany(c => c.Products)
    .UsingEntity(j => j.ToTable(&quot;ProductCategories&quot;));
    // EF Core 自動建立聯結表`" />

    <h3>方式二：顯式聯結 Entity（需要額外欄位時）</h3>
    <CodeBlock lang="csharp" filename="顯式多對多" :code="`
// 當聯結表需要額外欄位（如加入日期、排序等）
public class ProductCategory
{
    public ProductId ProductId { get; set; }
    public int CategoryId { get; set; }
    public int DisplayOrder { get; set; }    // 額外欄位
    public DateTime AssignedAt { get; set; }  // 額外欄位

    public Product Product { get; set; } = null!;
    public Category Category { get; set; } = null!;
}

// Configuration
public class ProductCategoryConfiguration
    : IEntityTypeConfiguration<ProductCategory>
{
    public void Configure(EntityTypeBuilder<ProductCategory> builder)
    {
        builder.ToTable(&quot;ProductCategories&quot;);

        // 複合主鍵
        builder.HasKey(pc => new { pc.ProductId, pc.CategoryId });

        builder.Property(pc => pc.ProductId)
            .HasConversion(id => id.Value, v => new ProductId(v));

        builder.HasOne(pc => pc.Product)
            .WithMany()
            .HasForeignKey(pc => pc.ProductId);

        builder.HasOne(pc => pc.Category)
            .WithMany()
            .HasForeignKey(pc => pc.CategoryId);
    }
}`" />

    <h2>刪除行為</h2>
    <table>
      <thead>
        <tr>
          <th>DeleteBehavior</th>
          <th>說明</th>
          <th>使用時機</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>Cascade</code></td>
          <td>刪除主體時連帶刪除依賴</td>
          <td>Aggregate 內的子 Entity</td>
        </tr>
        <tr>
          <td><code>Restrict</code></td>
          <td>禁止刪除有依賴的主體</td>
          <td>跨 Aggregate 參考</td>
        </tr>
        <tr>
          <td><code>SetNull</code></td>
          <td>刪除主體時將 FK 設為 null</td>
          <td>可選的關聯（nullable FK）</td>
        </tr>
        <tr>
          <td><code>NoAction</code></td>
          <td>不做任何事（DB 層處理）</td>
          <td>手動管理完整性</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box purple">
      <div class="info-box-title">📐 DDD 觀點</div>
      <p>
        ・Aggregate 內部使用 <code>Cascade</code>（OrderItem 隨 Order 刪除）<br>
        ・Aggregate 之間只透過 ID 參考，使用 <code>Restrict</code> 或不設 FK<br>
        ・避免跨 Aggregate 的導航屬性（Navigation Property）
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/efcore/crud', label: 'CRUD 操作' }"
      :next="{ path: '/csharp/efcore/migration', label: 'Migration' }"
    />
  </div>
</template>
