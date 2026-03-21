<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>IMemoryCache</h1>
    <p class="page-subtitle">單機記憶體快取 — 速度最快、最簡單的快取方式</p>

    <h2>適用場景</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>適合使用</h4>
        <p>單一伺服器部署、不需跨 Instance 共享資料、低延遲需求優先、快取量不超過記憶體容量。</p>
      </div>
      <div class="concept-card">
        <div class="icon">❌</div>
        <h4>不適合使用</h4>
        <p>多台伺服器（Load Balancer 後方）、容器橫向擴展、需要快取持久化、快取量龐大。</p>
      </div>
    </div>

    <h2>安裝與註冊</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# IMemoryCache 已內建於 .NET，無需額外安裝套件
# 只需在 DI 容器中註冊`" />

    <CodeBlock lang="csharp" filename="Program.cs" :code="`
var builder = WebApplication.CreateBuilder(args);

// 加入 MemoryCache 服務
builder.Services.AddMemoryCache(options =>
{
    // 設定快取大小上限（需搭配 SetSize 使用）
    options.SizeLimit = 1024;

    // 記憶體壓力時的壓縮比例（0.0~1.0，移除 25% 最舊項目）
    options.CompactionPercentage = 0.25;
});

var app = builder.Build();`" />

    <h2>基本操作</h2>
    <CodeBlock lang="csharp" filename="Services/ProductService.cs" :code="`
public class ProductService
{
    private readonly IMemoryCache _cache;
    private readonly IProductRepository _repository;

    public ProductService(IMemoryCache cache, IProductRepository repository)
    {
        _cache = cache;
        _repository = repository;
    }

    public async Task<Product?> GetByIdAsync(ProductId id)
    {
        var cacheKey = $&quot;product:{id.Value}&quot;;

        // 方式 1：TryGetValue 手動取值
        if (_cache.TryGetValue(cacheKey, out Product? cached))
            return cached;

        var product = await _repository.GetByIdAsync(id);
        if (product is null) return null;

        // 設定快取選項
        var options = new MemoryCacheEntryOptions
        {
            // 絕對過期（無論是否被存取，到時間就失效）
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),

            // 滑動過期（每次存取都重設計時器）
            SlidingExpiration = TimeSpan.FromMinutes(2),

            // 快取優先級（記憶體不足時優先移除低優先級項目）
            Priority = CacheItemPriority.Normal,

            // 設定大小（需搭配 SizeLimit 使用）
            Size = 1
        };

        _cache.Set(cacheKey, product, options);
        return product;
    }

    // 方式 2：GetOrCreate — 更簡潔的寫法（推薦）
    public async Task<IReadOnlyList<Product>> GetAllActiveAsync()
    {
        return await _cache.GetOrCreateAsync(
            key: &quot;products:active&quot;,
            factory: async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                entry.Priority = CacheItemPriority.High;

                return await _repository.GetAllActiveAsync();
            }) ?? [];
    }

    // 主動失效（資料更新時呼叫）
    public async Task UpdateAsync(Product product)
    {
        await _repository.UpdateAsync(product);

        // 移除快取，讓下次查詢重新從 DB 取得
        _cache.Remove($&quot;product:{product.Id.Value}&quot;);
        _cache.Remove(&quot;products:active&quot;);
    }
}`" />

    <h2>快取過期策略比較</h2>
    <table>
      <thead>
        <tr>
          <th>策略</th>
          <th>行為</th>
          <th>適用場景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>AbsoluteExpiration</strong></td>
          <td>指定一個固定的到期時間點</td>
          <td>有明確版本概念的資料（如當天的統計）</td>
        </tr>
        <tr>
          <td><strong>AbsoluteExpirationRelativeToNow</strong></td>
          <td>從現在起算的固定時長</td>
          <td>大多數場景的首選</td>
        </tr>
        <tr>
          <td><strong>SlidingExpiration</strong></td>
          <td>每次存取都延長過期時間</td>
          <td>熱門資料永保新鮮，冷資料自動清除</td>
        </tr>
        <tr>
          <td><strong>兩者並用</strong></td>
          <td>Sliding 延長，但不超過 Absolute 上限</td>
          <td>推薦寫法，防止熱點資料永不失效</td>
        </tr>
      </tbody>
    </table>

    <h2>Cache Callback（過期通知）</h2>
    <CodeBlock lang="csharp" filename="快取過期回呼" :code="`
var options = new MemoryCacheEntryOptions()
    .SetAbsoluteExpiration(TimeSpan.FromMinutes(10))
    .RegisterPostEvictionCallback((key, value, reason, state) =>
    {
        // reason: Removed / Expired / Capacity / None
        if (reason == EvictionReason.Expired)
        {
            logger.LogInformation(&quot;快取 {Key} 已過期，觸發重新載入&quot;, key);
        }
    });`" />

    <h2>Cache Dependency（相依性失效）</h2>
    <CodeBlock lang="csharp" filename="使用 CancellationTokenSource 串聯失效" :code="`
// 建立一個 &quot;Category&quot; 快取群組
private readonly CancellationTokenSource _categoryCts = new();

// 設定快取時加入 Token
var options = new MemoryCacheEntryOptions()
    .AddExpirationToken(new CancellationChangeToken(_categoryCts.Token))
    .SetAbsoluteExpiration(TimeSpan.FromHours(1));

_cache.Set(&quot;categories:all&quot;, categories, options);
_cache.Set(&quot;categories:active&quot;, activeCategories, options);

// 當分類更新時，一次失效所有相關快取
public void InvalidateCategoryCache()
{
    _categoryCts.Cancel();
    // 建立新的 Token 供下次使用
    _categoryCts.TryReset();
}`" />

    <h2>防止 Cache Stampede（互斥鎖）</h2>
    <CodeBlock lang="csharp" filename="使用 SemaphoreSlim 防止快取擊穿" :code="`
public class SafeCacheService
{
    private readonly IMemoryCache _cache;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public async Task<T> GetOrCreateSafeAsync<T>(
        string key,
        Func<Task<T>> factory,
        TimeSpan expiry)
    {
        // 先嘗試取快取（不加鎖，效能優先）
        if (_cache.TryGetValue(key, out T? cached))
            return cached!;

        // 快取未命中才進入鎖定區域
        await _lock.WaitAsync();
        try
        {
            // 再次確認（double-check，避免鎖等待期間已被其他請求寫入）
            if (_cache.TryGetValue(key, out cached))
                return cached!;

            var value = await factory();
            _cache.Set(key, value, expiry);
            return value;
        }
        finally
        {
            _lock.Release();
        }
    }
}`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 .NET 9：HybridCache 取代模式</div>
      <p>
        .NET 9 引入的 <code>HybridCache</code> 內建防 Cache Stampede 機制（Stampede Protection），
        在單機場景下可直接取代 IMemoryCache，並無縫升級至 Redis 分散式快取。
        詳見「快取策略」章節。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/cache/intro', label: '快取概述' }"
      :next="{ path: '/csharp/cache/distributed', label: 'IDistributedCache' }"
    />
  </div>
</template>
