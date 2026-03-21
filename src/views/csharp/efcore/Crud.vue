<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>CRUD 操作</h1>
    <p class="page-subtitle">使用 EF Core 執行基本的新增、查詢、更新、刪除</p>

    <h2>Create（新增）</h2>
    <CodeBlock lang="csharp" filename="新增資料" :code="`
// 新增單筆
var product = new Product(
    ProductId.NewId(),
    &quot;MacBook Pro 14&quot;,
    new Money(59900, Currency.TWD),
    &quot;Apple M3 Pro 晶片&quot;);

await context.Products.AddAsync(product);
await context.SaveChangesAsync();

// 新增多筆
var products = new List<Product>
{
    new(ProductId.NewId(), &quot;iPhone 15&quot;, new Money(35900, Currency.TWD), &quot;A17 Pro&quot;),
    new(ProductId.NewId(), &quot;iPad Air&quot;, new Money(22900, Currency.TWD), &quot;M2 晶片&quot;),
    new(ProductId.NewId(), &quot;AirPods Pro&quot;, new Money(7490, Currency.TWD), &quot;第二代&quot;)
};

await context.Products.AddRangeAsync(products);
await context.SaveChangesAsync();`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 SaveChanges 的時機</div>
      <p>所有變更都是在呼叫 <code>SaveChangesAsync()</code> 時才會一次寫入資料庫。EF Core 會自動用 Transaction 包裝，確保原子性。</p>
    </div>

    <h2>Read（查詢）</h2>
    <h3>基本查詢</h3>
    <CodeBlock lang="csharp" filename="LINQ 查詢" :code="`
// 取得所有產品
var allProducts = await context.Products.ToListAsync();

// 根據 ID 查詢（推薦用 FindAsync，有快取）
var product = await context.Products.FindAsync(productId);

// 條件查詢
var activeProducts = await context.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .ToListAsync();

// 取得第一筆（找不到回傳 null）
var firstProduct = await context.Products
    .FirstOrDefaultAsync(p => p.Name.Contains(&quot;MacBook&quot;));

// 取得唯一一筆（多筆或零筆都會拋例外）
var singleProduct = await context.Products
    .SingleOrDefaultAsync(p => p.Id == productId);`" />

    <h3>投影（Projection）</h3>
    <CodeBlock lang="csharp" filename="投影查詢" :code="`
// 只取需要的欄位，減少資料傳輸量
var productSummaries = await context.Products
    .Where(p => p.IsActive)
    .Select(p => new
    {
        p.Id,
        p.Name,
        Price = p.Price.Amount
    })
    .ToListAsync();

// 投影為 DTO
var productDtos = await context.Products
    .Select(p => new ProductDto
    {
        Id = p.Id.Value,
        Name = p.Name,
        Price = p.Price.Amount,
        IsActive = p.IsActive
    })
    .ToListAsync();`" />

    <h3>分頁查詢</h3>
    <CodeBlock lang="csharp" filename="分頁" :code="`
int pageNumber = 1;
int pageSize = 20;

var pagedProducts = await context.Products
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .Skip((pageNumber - 1) * pageSize)
    .Take(pageSize)
    .ToListAsync();

// 總數（配合分頁 UI）
var totalCount = await context.Products
    .CountAsync(p => p.IsActive);`" />

    <h3>載入關聯資料</h3>
    <CodeBlock lang="csharp" filename="Include 載入關聯" :code="`
// Eager Loading：一次查詢載入關聯
var ordersWithItems = await context.Orders
    .Include(o => o.Items)
    .Where(o => o.Status == OrderStatus.Pending)
    .ToListAsync();

// 多層載入
var ordersDeep = await context.Orders
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .ToListAsync();

// 篩選 Include（EF Core 5+）
var ordersFiltered = await context.Orders
    .Include(o => o.Items.Where(i => i.Quantity > 5))
    .ToListAsync();`" />

    <h2>Update（更新）</h2>
    <CodeBlock lang="csharp" filename="更新資料" :code="`
// 方式一：追蹤式更新（推薦，DDD 常用模式）
var order = await context.Orders
    .Include(o => o.Items)
    .FirstOrDefaultAsync(o => o.Id == orderId);

if (order is not null)
{
    // 透過 Domain Method 修改狀態
    order.Confirm();

    // EF Core 自動偵測變更
    await context.SaveChangesAsync();
}

// 方式二：ExecuteUpdate（EF Core 7+，批次更新，不載入記憶體）
await context.Products
    .Where(p => !p.IsActive)
    .ExecuteUpdateAsync(setters => setters
        .SetProperty(p => p.IsActive, true));`" />

    <div class="info-box info">
      <div class="info-box-title">📌 Change Tracker</div>
      <p>
        EF Core 的 Change Tracker 會自動追蹤從 DbContext 查詢出來的物件。
        當你修改物件屬性後呼叫 <code>SaveChangesAsync()</code>，
        EF Core 會比對原始值與現在值，只產生有變更欄位的 UPDATE SQL。
      </p>
    </div>

    <h2>Delete（刪除）</h2>
    <CodeBlock lang="csharp" filename="刪除資料" :code="`
// 方式一：追蹤式刪除
var product = await context.Products.FindAsync(productId);
if (product is not null)
{
    context.Products.Remove(product);
    await context.SaveChangesAsync();
}

// 方式二：ExecuteDelete（EF Core 7+，批次刪除）
await context.Products
    .Where(p => !p.IsActive)
    .ExecuteDeleteAsync();

// 軟刪除（推薦用於 DDD）
// 不真正刪除，而是標記為停用
var productToDeactivate = await context.Products.FindAsync(productId);
productToDeactivate?.Deactivate();
await context.SaveChangesAsync();`" />

    <h2>Transaction（交易）</h2>
    <CodeBlock lang="csharp" filename="手動控制 Transaction" :code="`
// SaveChangesAsync 預設已包含 Transaction
// 但如果需要跨多次 SaveChanges 的 Transaction：

await using var transaction = await context.Database
    .BeginTransactionAsync();

try
{
    // 操作 1
    var order = Order.Create(customerId, address);
    await context.Orders.AddAsync(order);
    await context.SaveChangesAsync();

    // 操作 2（使用 order 的 Id）
    order.AddItem(productId, &quot;商品A&quot;, price, 2);
    await context.SaveChangesAsync();

    // 全部成功才 Commit
    await transaction.CommitAsync();
}
catch
{
    await transaction.RollbackAsync();
    throw;
}`" />

    <h2>生成的 SQL 範例</h2>
    <CodeBlock lang="sql" filename="EF Core 產生的 SQL" :code="`
-- 查詢
SELECT [o].[Id], [o].[CustomerId], [o].[Status],
       [o].[TotalAmount], [o].[CurrencyCode],
       [o].[CreatedAt],
       [i].[Id], [i].[ProductName], [i].[UnitPrice], [i].[Quantity]
FROM [Orders] AS [o]
LEFT JOIN [OrderItems] AS [i] ON [o].[Id] = [i].[OrderId]
WHERE [o].[Status] = N'Pending'
ORDER BY [o].[Id], [i].[Id]

-- 更新（只更新有變更的欄位）
UPDATE [Orders]
SET [Status] = N'Confirmed'
WHERE [Id] = @p0;

-- 批次刪除（ExecuteDelete）
DELETE FROM [Products]
WHERE [IsActive] = CAST(0 AS bit);`" />

    <PageNav
      :prev="{ path: '/csharp/efcore/model', label: '模型設定' }"
      :next="{ path: '/csharp/efcore/relations', label: '關聯設定' }"
    />
  </div>
</template>
