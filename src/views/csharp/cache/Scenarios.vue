<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>使用場景比較</h1>
    <p class="page-subtitle">依場景選對快取方案，搭配完整實作範例</p>

    <h2>場景總覽</h2>
    <table>
      <thead>
        <tr>
          <th>場景</th>
          <th>推薦方案</th>
          <th>原因</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Reference Data（設定、分類）</td>
          <td>IMemoryCache / HybridCache</td>
          <td>資料量小、更新頻率低、速度要求高</td>
        </tr>
        <tr>
          <td>使用者 Session</td>
          <td>Redis（Hash）</td>
          <td>需跨 Instance 共享、部分欄位更新</td>
        </tr>
        <tr>
          <td>API 查詢結果快取</td>
          <td>HybridCache 或 Redis（IDistributedCache）</td>
          <td>多機部署、避免重複 DB 查詢</td>
        </tr>
        <tr>
          <td>HTTP 回應整體快取</td>
          <td>Output Cache + Redis</td>
          <td>相同參數的 API 直接回傳快取回應</td>
        </tr>
        <tr>
          <td>排行榜 / 計數器</td>
          <td>Redis（Sorted Set / String INCR）</td>
          <td>原子操作、豐富排序能力</td>
        </tr>
        <tr>
          <td>非同步任務佇列</td>
          <td>Redis（List）</td>
          <td>FIFO 語義、持久化選項</td>
        </tr>
        <tr>
          <td>分散式鎖</td>
          <td>Redis（NX + EX）/ RedLock.net</td>
          <td>原子性、自動過期防死鎖</td>
        </tr>
        <tr>
          <td>即時廣播 / 通知</td>
          <td>Redis Pub/Sub</td>
          <td>輕量即時訊息傳遞</td>
        </tr>
        <tr>
          <td>速率限制（Rate Limiting）</td>
          <td>Redis（INCR + EXPIRE）</td>
          <td>跨 Instance 的共享計數器</td>
        </tr>
      </tbody>
    </table>

    <h2>場景一：Reference Data 快取</h2>
    <p>商品分類、幣別、國家清單等幾乎不變的資料。</p>

    <CodeBlock lang="csharp" filename="快取 Reference Data" :code="`
public class CategoryService(HybridCache cache, ICategoryRepository repo)
{
    // 快取 1 小時，L1 記憶體 5 分鐘
    // 因為分類幾乎不變，過期時間可設較長
    public async Task<IReadOnlyList<Category>> GetAllAsync(CancellationToken ct = default)
        => await cache.GetOrCreateAsync(
            &quot;categories:all&quot;,
            async ct => await repo.GetAllAsync(ct),
            new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromHours(1),
                LocalCacheExpiration = TimeSpan.FromMinutes(5)
            },
            cancellationToken: ct);

    public async Task AddCategoryAsync(CreateCategoryCommand cmd, CancellationToken ct)
    {
        await repo.AddAsync(cmd, ct);
        // 更新分類後，清除快取
        await cache.RemoveAsync(&quot;categories:all&quot;, ct);
    }
}`" />

    <h2>場景二：Session 管理</h2>
    <CodeBlock lang="csharp" filename="Redis Session Service" :code="`
public class SessionService(IDatabase redis)
{
    public async Task CreateAsync(string sessionId, UserId userId, string role)
    {
        var key = $&quot;session:{sessionId}&quot;;

        await redis.HashSetAsync(key, [
            new HashEntry(&quot;userId&quot;,     userId.Value.ToString()),
            new HashEntry(&quot;role&quot;,       role),
            new HashEntry(&quot;createdAt&quot;,  DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
            new HashEntry(&quot;lastActive&quot;, DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
        ]);

        await redis.KeyExpireAsync(key, TimeSpan.FromHours(8));
    }

    public async Task<SessionInfo?> GetAsync(string sessionId)
    {
        var key = $&quot;session:{sessionId}&quot;;
        var data = await redis.HashGetAllAsync(key);
        if (data.Length == 0) return null;

        var map = data.ToDictionary(x => x.Name.ToString(), x => (string?)x.Value);

        // 每次存取時滑動過期時間
        await redis.KeyExpireAsync(key, TimeSpan.FromHours(8));
        await redis.HashSetAsync(key, &quot;lastActive&quot;,
            DateTimeOffset.UtcNow.ToUnixTimeSeconds());

        return new SessionInfo(
            UserId: Guid.Parse(map[&quot;userId&quot;]!),
            Role:   map[&quot;role&quot;]!);
    }

    public async Task DeleteAsync(string sessionId)
        => await redis.KeyDeleteAsync($&quot;session:{sessionId}&quot;);
}

public record SessionInfo(Guid UserId, string Role);`" />

    <h2>場景三：速率限制（Rate Limiting）</h2>
    <CodeBlock lang="csharp" filename="Redis 速率限制" :code="`
public class RateLimiterService(IDatabase redis)
{
    // 固定視窗速率限制：每個 IP 每分鐘最多 60 次
    public async Task<bool> IsAllowedAsync(string clientIp, int limit = 60)
    {
        var key = $&quot;ratelimit:{clientIp}:{GetWindowKey()}&quot;;

        var count = await redis.StringIncrementAsync(key);

        if (count == 1) // 第一次請求，設定過期
            await redis.KeyExpireAsync(key, TimeSpan.FromMinutes(1));

        return count <= limit;
    }

    private static string GetWindowKey()
    {
        var now = DateTimeOffset.UtcNow;
        return $&quot;{now:yyyyMMddHHmm}&quot;;  // 以分鐘為視窗
    }
}

// Middleware 中使用
app.Use(async (ctx, next) =>
{
    var rateLimiter = ctx.RequestServices.GetRequiredService<RateLimiterService>();
    var ip = ctx.Connection.RemoteIpAddress?.ToString() ?? &quot;unknown&quot;;

    if (!await rateLimiter.IsAllowedAsync(ip))
    {
        ctx.Response.StatusCode = 429;
        await ctx.Response.WriteAsync(&quot;Too Many Requests&quot;);
        return;
    }

    await next();
});`" />

    <h2>場景四：非同步任務佇列</h2>
    <CodeBlock lang="csharp" filename="Redis 任務佇列" :code="`
// 生產者
public class EmailQueueProducer(IDatabase redis)
{
    public async Task EnqueueAsync(SendEmailCommand command)
    {
        var json = JsonSerializer.Serialize(command);
        await redis.ListRightPushAsync(&quot;queue:emails:pending&quot;, json);
    }
}

// 消費者（Background Service）
public class EmailQueueConsumer(IDatabase redis, IEmailService emailService)
    : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            // BLPOP：阻塞式彈出，無訊息時等待（避免空轉 CPU）
            var result = await redis.ListLeftPopAsync(&quot;queue:emails:pending&quot;);

            if (result.HasValue)
            {
                var command = JsonSerializer.Deserialize<SendEmailCommand>(result!);
                await emailService.SendAsync(command!, ct);
            }
            else
            {
                await Task.Delay(500, ct); // 無任務時稍作等待
            }
        }
    }
}`" />

    <h2>場景五：搭配 DDD 的快取邊界</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 快取在 DDD 分層中的位置</div>
      <p>
        快取屬於 <strong>Infrastructure Layer</strong>，不應出現在 Domain 或 Application Layer。<br>
        快取的讀取和失效應封裝在 Repository 實作中，或在 Application Service 的 Decorator 中。
      </p>
    </div>

    <CodeBlock lang="csharp" filename="Cached Repository Decorator（推薦）" :code="`
// 原始 Repository
public class OrderRepository : IOrderRepository { ... }

// 快取 Decorator：透明地加上快取，不改動原始邏輯
public class CachedOrderRepository(
    IOrderRepository inner,
    ICacheService cache) : IOrderRepository
{
    public async Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct)
    {
        var key = $&quot;order:{id.Value}&quot;;

        return await cache.GetOrCreateAsync(
            key,
            async ct => await inner.GetByIdAsync(id, ct),
            TimeSpan.FromMinutes(10),
            ct);
    }

    public async Task UpdateAsync(Order order, CancellationToken ct)
    {
        await inner.UpdateAsync(order, ct);
        // 更新後失效快取
        await cache.RemoveAsync($&quot;order:{order.Id.Value}&quot;, ct);
    }

    public async Task<IReadOnlyList<Order>> GetByCustomerAsync(
        CustomerId customerId, CancellationToken ct)
    {
        // 列表查詢一般不快取，或使用較短 TTL
        return await inner.GetByCustomerAsync(customerId, ct);
    }
}

// DI 註冊：用 Decorator 取代原始實作
builder.Services.AddScoped<OrderRepository>();
builder.Services.AddScoped<IOrderRepository>(sp =>
    new CachedOrderRepository(
        sp.GetRequiredService<OrderRepository>(),
        sp.GetRequiredService<ICacheService>()));`" />

    <PageNav
      :prev="{ path: '/csharp/cache/patterns', label: '快取策略' }"
      :next="{ path: '/csharp/cache/production', label: '生產環境建議' }"
    />
  </div>
</template>
