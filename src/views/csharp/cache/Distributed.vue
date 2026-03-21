<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>IDistributedCache</h1>
    <p class="page-subtitle">分散式快取抽象介面 — 一份程式碼，多種後端實作</p>

    <h2>為什麼需要分散式快取？</h2>
    <p>
      當應用程式部署多個 Instance（例如 Kubernetes 水平擴展），
      <code>IMemoryCache</code> 的資料只存在各自的記憶體中，
      不同 Instance 之間無法共享，導致快取命中率低、資料不一致。
    </p>
    <p>
      <code>IDistributedCache</code> 是 .NET 提供的統一介面，
      無論後端是 Redis、SQL Server 還是記憶體模擬，
      應用程式程式碼完全相同，只需切換 DI 的實作即可。
    </p>

    <h2>可用的實作</h2>
    <table>
      <thead>
        <tr>
          <th>實作</th>
          <th>套件</th>
          <th>適用場景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Redis</strong></td>
          <td><code>Microsoft.Extensions.Caching.StackExchangeRedis</code></td>
          <td>生產環境首選（高效能、功能豐富）</td>
        </tr>
        <tr>
          <td><strong>SQL Server</strong></td>
          <td><code>Microsoft.Extensions.Caching.SqlServer</code></td>
          <td>已有 SQL Server 且流量不高</td>
        </tr>
        <tr>
          <td><strong>In-Memory（測試用）</strong></td>
          <td>內建</td>
          <td>單元測試、本機開發模擬</td>
        </tr>
        <tr>
          <td><strong>NCache</strong></td>
          <td>第三方</td>
          <td>企業級分散式快取</td>
        </tr>
      </tbody>
    </table>

    <h2>Redis 實作設定</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
dotnet add package Microsoft.Extensions.Caching.StackExchangeRedis`" />

    <CodeBlock lang="csharp" filename="Program.cs" :code="`
// 開發環境：使用 InMemory 模擬
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddDistributedMemoryCache();
}
else
{
    // 生產環境：使用 Redis
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = builder.Configuration
            .GetConnectionString(&quot;Redis&quot;);

        // 為所有 Key 加上前綴，避免不同應用共用 Redis 時衝突
        options.InstanceName = &quot;EShop:&quot;;
    });
}`" />

    <CodeBlock lang="json" filename="appsettings.json" :code="`
{
  &quot;ConnectionStrings&quot;: {
    &quot;Redis&quot;: &quot;localhost:6379,password=secret,ssl=false,abortConnect=false&quot;
  }
}`" />

    <h2>IDistributedCache 基本操作</h2>
    <p>
      <code>IDistributedCache</code> 只支援 <code>byte[]</code> 和 <code>string</code>，
      因此需要自行序列化物件。
    </p>

    <CodeBlock lang="csharp" filename="Services/OrderQueryService.cs" :code="`
public class OrderQueryService
{
    private readonly IDistributedCache _cache;
    private readonly IOrderRepository _repo;

    public OrderQueryService(IDistributedCache cache, IOrderRepository repo)
    {
        _cache = cache;
        _repo = repo;
    }

    public async Task<OrderDto?> GetOrderAsync(OrderId id, CancellationToken ct = default)
    {
        var key = $&quot;order:{id.Value}&quot;;

        // 取得（回傳 byte[]，需自行反序列化）
        var bytes = await _cache.GetAsync(key, ct);
        if (bytes is not null)
            return JsonSerializer.Deserialize<OrderDto>(bytes);

        var order = await _repo.GetByIdAsync(id, ct);
        if (order is null) return null;

        var dto = OrderDto.FromDomain(order);

        // 儲存（需自行序列化）
        var serialized = JsonSerializer.SerializeToUtf8Bytes(dto);
        await _cache.SetAsync(key, serialized, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15),
            SlidingExpiration = TimeSpan.FromMinutes(5)
        }, ct);

        return dto;
    }

    public async Task InvalidateOrderCacheAsync(OrderId id, CancellationToken ct = default)
    {
        await _cache.RemoveAsync($&quot;order:{id.Value}&quot;, ct);
    }
}`" />

    <h2>封裝泛型快取服務（推薦）</h2>
    <p>
      每次都要手動序列化很繁瑣。建議封裝一個泛型的快取服務：
    </p>

    <CodeBlock lang="csharp" filename="Infrastructure/Caching/CacheService.cs" :code="`
public interface ICacheService
{
    Task<T?> GetAsync<T>(string key, CancellationToken ct = default);
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null, CancellationToken ct = default);
    Task RemoveAsync(string key, CancellationToken ct = default);
    Task<T> GetOrCreateAsync<T>(string key, Func<CancellationToken, Task<T>> factory,
        TimeSpan? expiry = null, CancellationToken ct = default);
}

public class CacheService : ICacheService
{
    private readonly IDistributedCache _cache;
    private static readonly TimeSpan DefaultExpiry = TimeSpan.FromMinutes(10);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public CacheService(IDistributedCache cache) => _cache = cache;

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default)
    {
        var bytes = await _cache.GetAsync(key, ct);
        if (bytes is null) return default;
        return JsonSerializer.Deserialize<T>(bytes, JsonOptions);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
        await _cache.SetAsync(key, bytes, new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = expiry ?? DefaultExpiry
        }, ct);
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
        => await _cache.RemoveAsync(key, ct);

    public async Task<T> GetOrCreateAsync<T>(
        string key,
        Func<CancellationToken, Task<T>> factory,
        TimeSpan? expiry = null,
        CancellationToken ct = default)
    {
        var cached = await GetAsync<T>(key, ct);
        if (cached is not null) return cached;

        var value = await factory(ct);
        await SetAsync(key, value, expiry, ct);
        return value;
    }
}

// 註冊
builder.Services.AddScoped<ICacheService, CacheService>();`" />

    <h2>SQL Server 分散式快取</h2>
    <CodeBlock lang="bash" filename="Terminal — 初始化資料表" :code="`
dotnet add package Microsoft.Extensions.Caching.SqlServer

# 建立快取資料表
dotnet sql-cache create &quot;Server=.;Database=EShop;Integrated Security=true&quot; dbo AspNetCache`" />

    <CodeBlock lang="csharp" filename="Program.cs" :code="`
builder.Services.AddSqlServerCache(options =>
{
    options.ConnectionString = builder.Configuration
        .GetConnectionString(&quot;SqlServer&quot;);
    options.SchemaName = &quot;dbo&quot;;
    options.TableName = &quot;AspNetCache&quot;;

    // 清理過期項目的頻率（預設 30 分鐘）
    options.ExpiredItemsDeletionInterval = TimeSpan.FromMinutes(30);
});`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ SQL Server 快取的限制</div>
      <p>
        SQL Server 快取的讀取速度遠不如 Redis（通常慢 10x 以上）。
        適合快取量小、更新不頻繁、且已有 SQL Server 基礎設施的場景。
        若有高頻存取需求，請選擇 Redis。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/cache/memory', label: 'IMemoryCache' }"
      :next="{ path: '/csharp/cache/redis', label: 'Redis 深入教學' }"
    />
  </div>
</template>
