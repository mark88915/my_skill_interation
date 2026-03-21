<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>快取策略</h1>
    <p class="page-subtitle">Cache-Aside、Write-Through、HybridCache 與常見問題解法</p>

    <h2>主要快取寫入策略</h2>

    <h3>Cache-Aside（旁路快取）</h3>
    <p>最常見的模式。應用程式負責管理快取和資料庫的同步，資料庫是唯一真相來源。</p>

    <div class="arch-diagram">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: flex-start;">
        <div style="flex: 1; min-width: 200px;">
          <h4 style="margin-bottom: 8px; font-size: 13px; color: var(--vt-c-text-2);">讀取流程</h4>
          <div class="arch-layer application" style="max-width: none; font-size: 13px;">1. 查快取</div>
          <div class="arch-arrow">⬇️ 未命中</div>
          <div class="arch-layer infrastructure" style="max-width: none; font-size: 13px;">2. 查資料庫</div>
          <div class="arch-arrow">⬇️</div>
          <div class="arch-layer domain" style="max-width: none; font-size: 13px;">3. 寫入快取</div>
          <div class="arch-arrow">⬇️</div>
          <div class="arch-layer presentation" style="max-width: none; font-size: 13px;">4. 回傳結果</div>
        </div>
        <div style="flex: 1; min-width: 200px;">
          <h4 style="margin-bottom: 8px; font-size: 13px; color: var(--vt-c-text-2);">寫入流程</h4>
          <div class="arch-layer infrastructure" style="max-width: none; font-size: 13px;">1. 寫入資料庫</div>
          <div class="arch-arrow">⬇️</div>
          <div class="arch-layer domain" style="max-width: none; font-size: 13px;">2. 刪除（失效）快取</div>
          <div class="arch-arrow">⬇️</div>
          <div class="arch-layer presentation" style="max-width: none; font-size: 13px;">3. 下次讀取時重新載入</div>
        </div>
      </div>
    </div>

    <CodeBlock lang="csharp" filename="Cache-Aside 實作" :code="`
public class ProductService
{
    public async Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct)
    {
        var key = CacheKeys.Product(id);

        // 1. 查快取
        var cached = await _cache.GetAsync<Product>(key, ct);
        if (cached is not null) return cached;

        // 2. 查 DB
        var product = await _repo.GetByIdAsync(id, ct);
        if (product is null) return null;

        // 3. 寫入快取
        await _cache.SetAsync(key, product, TimeSpan.FromMinutes(10), ct);
        return product;
    }

    public async Task UpdateAsync(UpdateProductCommand cmd, CancellationToken ct)
    {
        await _repo.UpdateAsync(cmd, ct);

        // 刪除快取（Delete-on-Write，不更新）
        // ✅ 避免「先寫快取後寫 DB」導致的短暫不一致
        await _cache.RemoveAsync(CacheKeys.Product(cmd.ProductId), ct);
    }
}

// 統一管理 CacheKey 格式
public static class CacheKeys
{
    public static string Product(ProductId id) => $&quot;product:{id.Value}&quot;;
    public static string ProductList(int page) => $&quot;products:list:p{page}&quot;;
    public static string UserCart(UserId id) => $&quot;cart:{id.Value}&quot;;
}`" />

    <h3>Write-Through（同步寫入）</h3>
    <p>寫入資料庫的同時也更新快取，保持高一致性，但寫入稍慢。</p>

    <CodeBlock lang="csharp" filename="Write-Through 實作" :code="`
public async Task UpdateProductPriceAsync(ProductId id, Money newPrice, CancellationToken ct)
{
    var product = await _repo.GetByIdAsync(id, ct)
        ?? throw new NotFoundException(id);

    product.UpdatePrice(newPrice);

    // 同時寫入 DB 和快取
    await _repo.UpdateAsync(product, ct);
    await _cache.SetAsync(
        CacheKeys.Product(id), product,
        TimeSpan.FromMinutes(10), ct);
}`" />

    <h2>HybridCache（.NET 9+）</h2>
    <p>
      <code>HybridCache</code> 是 .NET 9 新增的官方快取 API，
      結合 L1（本機記憶體）+ L2（分散式如 Redis），並內建防 Stampede 機制。
    </p>

    <CodeBlock lang="bash" filename="Terminal" :code="`
dotnet add package Microsoft.Extensions.Caching.Hybrid`" />

    <CodeBlock lang="csharp" filename="Program.cs" :code="`
builder.Services.AddHybridCache(options =>
{
    options.MaximumPayloadBytes = 1024 * 1024; // 1MB
    options.DefaultEntryOptions = new HybridCacheEntryOptions
    {
        Expiration = TimeSpan.FromMinutes(10),       // L2 (Redis) 過期時間
        LocalCacheExpiration = TimeSpan.FromMinutes(1) // L1 (Memory) 過期時間
    };
});

// 設定 L2 使用 Redis（如果沒設定就只有 L1）
builder.Services.AddStackExchangeRedisCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString(&quot;Redis&quot;));`" />

    <CodeBlock lang="csharp" filename="使用 HybridCache" :code="`
public class ProductService(HybridCache cache, IProductRepository repo)
{
    public async Task<ProductDto> GetByIdAsync(
        ProductId id, CancellationToken ct = default)
    {
        // GetOrCreateAsync 自動處理：
        // ① 查 L1 記憶體快取
        // ② 查 L2 Redis 快取
        // ③ 都沒有 → 呼叫 factory（自動防 Stampede）
        // ④ 寫回 L1 + L2
        return await cache.GetOrCreateAsync(
            key: $&quot;product:{id.Value}&quot;,
            factory: async ct =>
            {
                var product = await repo.GetByIdAsync(id, ct);
                return ProductDto.FromDomain(product!);
            },
            options: new HybridCacheEntryOptions
            {
                Expiration = TimeSpan.FromMinutes(15),
                LocalCacheExpiration = TimeSpan.FromMinutes(2)
            },
            cancellationToken: ct);
    }

    public async Task InvalidateAsync(ProductId id, CancellationToken ct = default)
    {
        // 同時清除 L1 和 L2
        await cache.RemoveAsync($&quot;product:{id.Value}&quot;, ct);
    }
}`" />

    <h2>常見問題解法</h2>

    <h3>快取雪崩（Cache Avalanche）— TTL 加 Jitter</h3>
    <p>大量 Key 同時過期，瞬間大量請求打到 DB。解法：TTL 加入隨機偏差。</p>

    <CodeBlock lang="csharp" filename="TTL Jitter 防雪崩" :code="`
public static class CacheExtensions
{
    private static readonly Random Random = new();

    // 在基礎 TTL 的 ±20% 範圍內加入隨機偏差
    public static TimeSpan WithJitter(this TimeSpan baseTtl, double jitterRatio = 0.2)
    {
        var jitter = baseTtl.TotalSeconds * jitterRatio;
        var delta = (Random.NextDouble() * 2 - 1) * jitter; // -jitter ~ +jitter
        return TimeSpan.FromSeconds(baseTtl.TotalSeconds + delta);
    }
}

// 使用
await _cache.SetAsync(key, value,
    TimeSpan.FromMinutes(10).WithJitter(), ct);`" />

    <h3>快取穿透（Cache Penetration）— 快取空值</h3>
    <p>查詢不存在的資料，每次都打穿到 DB。解法：快取 null 或空物件。</p>

    <CodeBlock lang="csharp" filename="快取空值防穿透" :code="`
// 使用 Optional<T> 包裝，讓 null 也能被快取
public async Task<Product?> GetByIdAsync(ProductId id, CancellationToken ct)
{
    var key = $&quot;product:{id.Value}&quot;;

    // 取出「可能是空值的快取」
    var cached = await _cache.GetAsync<CachedResult<Product>>(key, ct);
    if (cached is not null)
        return cached.HasValue ? cached.Value : null; // null 也算命中

    var product = await _repo.GetByIdAsync(id, ct);

    await _cache.SetAsync(key,
        new CachedResult<Product>(product),
        product is null
            ? TimeSpan.FromMinutes(1)   // null 快取較短
            : TimeSpan.FromMinutes(10), // 有資料快取較長
        ct);

    return product;
}

public record CachedResult<T>(T? Value)
{
    public bool HasValue => Value is not null;
}`" />

    <h3>Output Cache（HTTP 回應快取）</h3>
    <CodeBlock lang="csharp" filename="Output Cache — API 整個回應快取" :code="`
// Program.cs
builder.Services.AddOutputCache(options =>
{
    // 定義命名策略
    options.AddPolicy(&quot;ProductList&quot;, b => b
        .Expire(TimeSpan.FromMinutes(5))
        .SetVaryByQuery(&quot;page&quot;, &quot;pageSize&quot;, &quot;category&quot;));
});

// 使用 Redis 作為 Output Cache 後端
builder.Services.AddStackExchangeRedisOutputCache(options =>
    options.Configuration = builder.Configuration.GetConnectionString(&quot;Redis&quot;));

// Controller 或 Minimal API
app.MapGet(&quot;/api/products&quot;, async (IProductQueryService svc, ...) =>
{
    return await svc.GetPagedAsync(...);
})
.CacheOutput(&quot;ProductList&quot;);

// 主動清除（資料更新時）
app.MapPut(&quot;/api/products/{id}&quot;, async (IOutputCacheStore cacheStore, ...) =>
{
    await UpdateProductAsync(...);
    await cacheStore.EvictByTagAsync(&quot;products&quot;, ct);
});`" />

    <PageNav
      :prev="{ path: '/csharp/cache/redis', label: 'Redis 深入教學' }"
      :next="{ path: '/csharp/cache/scenarios', label: '使用場景比較' }"
    />
  </div>
</template>
