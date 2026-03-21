<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>進階查詢</h1>
    <p class="page-subtitle">效能優化、原生 SQL、全域篩選器、攔截器</p>

    <h2>AsNoTracking（唯讀查詢）</h2>
    <p>
      查詢僅供讀取時，加上 <code>AsNoTracking()</code> 跳過 Change Tracker，可顯著提升效能。
    </p>
    <CodeBlock lang="csharp" filename="AsNoTracking" :code="`
// ✅ 唯讀查詢，不需要追蹤
var orders = await context.Orders
    .AsNoTracking()
    .Where(o => o.Status == OrderStatus.Confirmed)
    .ToListAsync();

// 整個 DbContext 預設不追蹤
// （適合 CQRS 的 Query Side）
services.AddDbContext<ReadOnlyDbContext>(options =>
{
    options.UseSqlServer(connectionString);
    options.UseQueryTrackingBehavior(
        QueryTrackingBehavior.NoTracking);
});`" />

    <h2>Split Query（分割查詢）</h2>
    <p>
      當 Include 導致笛卡爾爆炸（Cartesian Explosion）時，使用 Split Query 拆成多個 SQL 查詢。
    </p>
    <CodeBlock lang="csharp" filename="Split Query" :code="`
// ❌ 單一查詢：如果 Items 和 Tags 各有 10 筆，結果集有 100 行
var orders = await context.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)
    .ToListAsync();

// ✅ Split Query：拆成三個查詢
var orders = await context.Orders
    .Include(o => o.Items)
    .Include(o => o.Tags)
    .AsSplitQuery()
    .ToListAsync();

// 產生的 SQL：
// SELECT * FROM Orders WHERE ...
// SELECT * FROM OrderItems WHERE OrderId IN (...)
// SELECT * FROM OrderTags WHERE OrderId IN (...)`" />

    <h2>Global Query Filter（全域篩選器）</h2>
    <p>自動套用到所有查詢的篩選條件，常用於軟刪除和多租戶。</p>
    <CodeBlock lang="csharp" filename="全域篩選器" :code="`
public class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        // 所有查詢自動加上 IsActive = true
        builder.HasQueryFilter(p => p.IsActive);
    }
}

// 使用時自動套用
var products = await context.Products.ToListAsync();
// SQL: SELECT * FROM Products WHERE IsActive = 1

// 需要查詢所有資料時，暫時忽略篩選器
var allProducts = await context.Products
    .IgnoreQueryFilters()
    .ToListAsync();
// SQL: SELECT * FROM Products`" />

    <h3>多租戶篩選器</h3>
    <CodeBlock lang="csharp" filename="多租戶" :code="`
public class AppDbContext : DbContext
{
    private readonly Guid _tenantId;

    public AppDbContext(
        DbContextOptions options, ITenantProvider tenantProvider)
        : base(options)
    {
        _tenantId = tenantProvider.GetCurrentTenantId();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 每個多租戶 Entity 自動篩選
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => o.TenantId == _tenantId);

        modelBuilder.Entity<Product>()
            .HasQueryFilter(p => p.TenantId == _tenantId);
    }
}`" />

    <h2>原生 SQL 查詢</h2>
    <CodeBlock lang="csharp" filename="Raw SQL" :code="`
// 使用原生 SQL（結果映射到 Entity）
var orders = await context.Orders
    .FromSqlRaw(
        &quot;SELECT * FROM Orders WHERE Status = {0}&quot;,
        &quot;Confirmed&quot;)
    .ToListAsync();

// 使用 SQL Interpolation（自動參數化，防 SQL Injection）
var status = &quot;Confirmed&quot;;
var orders = await context.Orders
    .FromSqlInterpolated(
        $&quot;SELECT * FROM Orders WHERE Status = {status}&quot;)
    .Include(o => o.Items)  // 可以串接 LINQ
    .ToListAsync();

// 不映射到 Entity 的查詢（EF Core 8+）
var stats = await context.Database
    .SqlQuery<OrderStatDto>(
        $&quot;SELECT Status, COUNT(*) AS Count, SUM(TotalAmount) AS Total FROM Orders GROUP BY Status&quot;)
    .ToListAsync();

// 執行非查詢 SQL
await context.Database.ExecuteSqlRawAsync(
    &quot;UPDATE Products SET IsActive = 0 WHERE Stock = 0&quot;);`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ SQL Injection 防護</div>
      <p>使用 <code>FromSqlInterpolated</code> 或 <code>FromSqlRaw</code> 搭配參數。永遠不要直接串接使用者輸入！</p>
    </div>

    <h2>Interceptor（攔截器）</h2>
    <p>攔截 EF Core 的操作，可用於記錄、審計、效能監控等。</p>
    <CodeBlock lang="csharp" filename="查詢攔截器" :code="`
// 記錄慢查詢
public class SlowQueryInterceptor : DbCommandInterceptor
{
    private readonly ILogger<SlowQueryInterceptor> _logger;
    private const int SlowQueryThresholdMs = 500;

    public SlowQueryInterceptor(
        ILogger<SlowQueryInterceptor> logger)
    {
        _logger = logger;
    }

    public override ValueTask<DbDataReader> ReaderExecutedAsync(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result,
        CancellationToken ct = default)
    {
        if (eventData.Duration.TotalMilliseconds > SlowQueryThresholdMs)
        {
            _logger.LogWarning(
                &quot;慢查詢 ({Duration}ms): {Sql}&quot;,
                eventData.Duration.TotalMilliseconds,
                command.CommandText);
        }

        return ValueTask.FromResult(result);
    }
}

// 註冊
services.AddDbContext<AppDbContext>((sp, options) =>
{
    options.UseSqlServer(connectionString);
    options.AddInterceptors(
        sp.GetRequiredService<SlowQueryInterceptor>());
});`" />

    <h2>效能小結</h2>
    <table>
      <thead>
        <tr>
          <th>技巧</th>
          <th>適用場景</th>
          <th>效果</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>AsNoTracking()</code></td>
          <td>唯讀查詢</td>
          <td>減少記憶體、提升速度</td>
        </tr>
        <tr>
          <td><code>AsSplitQuery()</code></td>
          <td>多個 Include</td>
          <td>避免笛卡爾爆炸</td>
        </tr>
        <tr>
          <td><code>Select()</code> 投影</td>
          <td>只需部分欄位</td>
          <td>減少資料傳輸量</td>
        </tr>
        <tr>
          <td>Compiled Query</td>
          <td>高頻重複查詢</td>
          <td>省去 LINQ 翻譯成本</td>
        </tr>
        <tr>
          <td><code>ExecuteUpdate/Delete</code></td>
          <td>批次操作</td>
          <td>不載入記憶體直接操作 DB</td>
        </tr>
        <tr>
          <td>適當的索引</td>
          <td>常見查詢條件</td>
          <td>大幅加速查詢</td>
        </tr>
      </tbody>
    </table>

    <CodeBlock lang="csharp" filename="Compiled Query" :code="`
// Compiled Query：預先編譯 LINQ 查詢，高頻使用時避免重複翻譯
private static readonly Func<AppDbContext, OrderStatus, IAsyncEnumerable<Order>>
    GetOrdersByStatusQuery = EF.CompileAsyncQuery(
        (AppDbContext ctx, OrderStatus status) =>
            ctx.Orders
                .Where(o => o.Status == status)
                .OrderByDescending(o => o.CreatedAt));

// 使用
await foreach (var order in GetOrdersByStatusQuery(context, OrderStatus.Pending))
{
    // 處理訂單
}`" />

    <PageNav
      :prev="{ path: '/csharp/efcore/migration', label: 'Migration' }"
      :next="{ path: '/csharp/efcore/ddd-integration', label: '整合 DDD' }"
    />
  </div>
</template>
