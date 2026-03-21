<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const proxyInterface = `// 主題介面 — 定義 RealSubject 和 Proxy 的共同契約
public interface IProductService
{
    Task<Product?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default);
    Task UpdateAsync(Product product, CancellationToken ct = default);
}`

const realService = `// 真正的服務 — 直接存取資料庫
public class ProductService : IProductService
{
    private readonly AppDbContext _db;

    public ProductService(AppDbContext db) => _db = db;

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
        => await _db.Products.FindAsync(new object[] { id }, ct);

    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default)
        => await _db.Products.AsNoTracking().ToListAsync(ct);

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        _db.Products.Update(product);
        await _db.SaveChangesAsync(ct);
    }
}`

const cachingProxy = `// 快取代理 — 在呼叫前先檢查快取，命中就直接回傳
public class CachedProductService : IProductService
{
    private readonly IProductService _inner;   // 被代理的真正服務
    private readonly IMemoryCache _cache;
    private readonly ILogger<CachedProductService> _logger;

    public CachedProductService(
        IProductService inner,
        IMemoryCache cache,
        ILogger<CachedProductService> logger)
    {
        _inner = inner;
        _cache = cache;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var key = $"product:{id}";

        if (_cache.TryGetValue(key, out Product? cached))
        {
            _logger.LogDebug("快取命中: {Key}", key);
            return cached;
        }

        _logger.LogDebug("快取未命中: {Key}，轉發給真正的服務", key);
        var product = await _inner.GetByIdAsync(id, ct);

        if (product is not null)
        {
            _cache.Set(key, product, new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                SlidingExpiration = TimeSpan.FromMinutes(2)
            });
        }

        return product;
    }

    public async Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default)
    {
        const string key = "products:all";

        if (_cache.TryGetValue(key, out IReadOnlyList<Product>? cached))
            return cached!;

        var products = await _inner.GetAllAsync(ct);
        _cache.Set(key, products, TimeSpan.FromMinutes(5));
        return products;
    }

    public async Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        // 寫入時委派給真正的服務，並清除相關快取
        await _inner.UpdateAsync(product, ct);
        _cache.Remove($"product:{product.Id}");
        _cache.Remove("products:all");
        _logger.LogInformation("已清除產品 {Id} 的快取", product.Id);
    }
}`

const protectionProxy = `// 保護代理 — 檢查使用者權限後才委派給真正的服務
public class AuthorizedProductService : IProductService
{
    private readonly IProductService _inner;
    private readonly ICurrentUserService _currentUser;

    public AuthorizedProductService(
        IProductService inner,
        ICurrentUserService currentUser)
    {
        _inner = inner;
        _currentUser = currentUser;
    }

    public Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        // 讀取操作：只要已登入即可
        EnsureAuthenticated();
        return _inner.GetByIdAsync(id, ct);
    }

    public Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken ct = default)
    {
        EnsureAuthenticated();
        return _inner.GetAllAsync(ct);
    }

    public Task UpdateAsync(Product product, CancellationToken ct = default)
    {
        // 寫入操作：需要 Admin 權限
        EnsureAuthenticated();
        EnsureHasRole("Admin");
        return _inner.UpdateAsync(product, ct);
    }

    private void EnsureAuthenticated()
    {
        if (!_currentUser.IsAuthenticated)
            throw new UnauthorizedAccessException("使用者未登入");
    }

    private void EnsureHasRole(string role)
    {
        if (!_currentUser.IsInRole(role))
            throw new ForbiddenException(
                $"需要 {role} 角色才能執行此操作");
    }
}`

const diWiring = `// 手動註冊 — 用 Decorator 手法層層包裝
builder.Services.AddScoped<ProductService>();  // 真正的服務

builder.Services.AddScoped<IProductService>(sp =>
{
    // 由內而外：ProductService → CachedProxy → AuthProxy
    var realService = sp.GetRequiredService<ProductService>();
    var cache = sp.GetRequiredService<IMemoryCache>();
    var logger = sp.GetRequiredService<ILogger<CachedProductService>>();
    var currentUser = sp.GetRequiredService<ICurrentUserService>();

    IProductService cached = new CachedProductService(realService, cache, logger);
    IProductService authorized = new AuthorizedProductService(cached, currentUser);

    return authorized;
});`

const scrutorDecorate = `// 使用 Scrutor 的 Decorate — 更簡潔的寫法
// dotnet add package Scrutor

builder.Services.AddScoped<IProductService, ProductService>();

// Decorate 會自動把原本的 IProductService 注入到裝飾器的建構子
// 順序很重要：先加的在最內層，後加的在最外層
builder.Services.Decorate<IProductService, CachedProductService>();
builder.Services.Decorate<IProductService, AuthorizedProductService>();

// 解析順序（由外到內）：
// AuthorizedProductService
//   └─ CachedProductService
//        └─ ProductService（真正的實作）`

const virtualProxyLazy = `// 虛擬代理 — 使用 Lazy<T> 延遲建立昂貴物件
public class HeavyReportGenerator
{
    // 建立需要 5 秒的昂貴資源
    public HeavyReportGenerator()
    {
        Thread.Sleep(5000); // 模擬載入大型模型
        Console.WriteLine("HeavyReportGenerator 已初始化");
    }

    public string Generate() => "報表內容...";
}

public class ReportService
{
    // Lazy<T> 是 .NET 內建的虛擬代理
    // 只在第一次存取 .Value 時才會建立物件
    private readonly Lazy<HeavyReportGenerator> _generator;

    public ReportService()
    {
        _generator = new Lazy<HeavyReportGenerator>(
            () => new HeavyReportGenerator(),
            LazyThreadSafetyMode.ExecutionAndPublication);
    }

    public string GetReport()
    {
        // 第一次呼叫：建立物件（5 秒）
        // 後續呼叫：直接回傳已建立的物件
        return _generator.Value.Generate();
    }
}`

const loggingProxy = `// 日誌代理 — 記錄每次呼叫的輸入、輸出與耗時
public class LoggingProductService : IProductService
{
    private readonly IProductService _inner;
    private readonly ILogger<LoggingProductService> _logger;

    public LoggingProductService(
        IProductService inner,
        ILogger<LoggingProductService> logger)
    {
        _inner = inner;
        _logger = logger;
    }

    public async Task<Product?> GetByIdAsync(int id, CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        _logger.LogInformation("開始呼叫 GetByIdAsync(id: {Id})", id);

        try
        {
            var result = await _inner.GetByIdAsync(id, ct);
            sw.Stop();

            _logger.LogInformation(
                "GetByIdAsync 完成 — 結果: {Found}, 耗時: {Elapsed}ms",
                result is not null ? "找到" : "未找到",
                sw.ElapsedMilliseconds);

            return result;
        }
        catch (Exception ex)
        {
            sw.Stop();
            _logger.LogError(ex,
                "GetByIdAsync 失敗 — id: {Id}, 耗時: {Elapsed}ms",
                id, sw.ElapsedMilliseconds);
            throw;
        }
    }

    // ... 其他方法同理
}`

const classStructure = `// UML 類別結構
//
//       ┌─────────────────────┐
//       │   <<interface>>     │
//       │   IProductService   │
//       │─────────────────────│
//       │ + GetByIdAsync()    │
//       │ + GetAllAsync()     │
//       │ + UpdateAsync()     │
//       └────────┬────────────┘
//                │ implements
//       ┌────────┴────────────────────┐
//       │                             │
// ┌─────┴──────────┐   ┌─────────────┴──────────┐
// │ ProductService  │   │ CachedProductService   │
// │ (RealSubject)   │   │ (Proxy)                │
// │────────────────│   │────────────────────────│
// │ - _db           │   │ - _inner: IProductSvc  │
// │                 │   │ - _cache: IMemoryCache  │
// └─────────────────┘   └────────────────────────┘
//                              │
//                              │ delegates to
//                              ▼
//                       ProductService`
</script>

<template>
  <div class="content-wrapper">
    <h1>Proxy 代理模式</h1>
    <p class="page-subtitle">為另一個物件提供一個代理或佔位符號來控制對它的存取</p>

    <div class="info-box info">
      <div class="info-box-title">📖 Head First 定義</div>
      <p>
        <strong>Proxy Pattern</strong> — Provide a surrogate or placeholder for another object to control access to it.<br>
        代理模式讓你建立一個「替身」物件，在客戶端和真正物件之間增加一層控制。
        客戶端透過相同的介面與代理互動，完全不知道背後是代理還是真正的物件。
      </p>
    </div>

    <h2>核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎭</div>
        <h4>相同介面</h4>
        <p>代理和真正的物件實作同一個介面，客戶端無法區分兩者。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>持有參考</h4>
        <p>代理內部持有真正物件的參考，在適當時機將請求委派給它。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🛡️</div>
        <h4>控制存取</h4>
        <p>代理可以在委派前後加入額外邏輯：快取、權限檢查、日誌、延遲載入等。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>透明替換</h4>
        <p>因為介面相同，可以在 DI 容器中無縫替換，不影響既有程式碼。</p>
      </div>
    </div>

    <h2>代理的種類</h2>
    <table>
      <thead>
        <tr>
          <th>代理類型</th>
          <th>目的</th>
          <th>典型場景</th>
          <th>.NET 對應</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>遠端代理</strong><br>Remote Proxy</td>
          <td>代表位於不同位址空間的物件</td>
          <td>gRPC Client、WCF Channel Proxy</td>
          <td><code>ChannelFactory&lt;T&gt;</code></td>
        </tr>
        <tr>
          <td><strong>虛擬代理</strong><br>Virtual Proxy</td>
          <td>延遲建立昂貴物件，需要時才實例化</td>
          <td>大型報表、圖片延遲載入</td>
          <td><code>Lazy&lt;T&gt;</code></td>
        </tr>
        <tr>
          <td><strong>保護代理</strong><br>Protection Proxy</td>
          <td>根據權限控制對物件的存取</td>
          <td>角色權限檢查、API 授權</td>
          <td>自訂 Decorator</td>
        </tr>
        <tr>
          <td><strong>快取代理</strong><br>Caching Proxy</td>
          <td>快取運算結果，避免重複計算或查詢</td>
          <td>API 回應快取、查詢結果快取</td>
          <td><code>IMemoryCache</code> 搭配 Decorator</td>
        </tr>
        <tr>
          <td><strong>日誌代理</strong><br>Logging Proxy</td>
          <td>記錄每次呼叫的輸入、輸出與耗時</td>
          <td>API 呼叫追蹤、效能監控</td>
          <td>Castle DynamicProxy / 自訂</td>
        </tr>
      </tbody>
    </table>

    <h2>類別結構</h2>
    <CodeBlock :code="classStructure" lang="text" />

    <h2>實戰範例一：API 快取代理</h2>

    <h3>Step 1 — 定義共同介面</h3>
    <CodeBlock :code="proxyInterface" lang="csharp" />

    <h3>Step 2 — 真正的服務（RealSubject）</h3>
    <CodeBlock :code="realService" lang="csharp" />

    <h3>Step 3 — 快取代理（Caching Proxy）</h3>
    <p>
      <code>CachedProductService</code> 實作同一個介面，在轉發請求之前先檢查快取。
      如果命中就直接回傳，未命中才委派給真正的 <code>ProductService</code>。
    </p>
    <CodeBlock :code="cachingProxy" lang="csharp" />

    <div class="info-box tip">
      <div class="info-box-title">💡 快取代理 vs Cache-Aside</div>
      <p>
        兩者都實現快取邏輯，差別在於<strong>職責分離</strong>：<br>
        <strong>Cache-Aside</strong>：快取邏輯寫在 Service 內部，Service 自己管理快取。<br>
        <strong>快取代理</strong>：快取邏輯抽到獨立的 Proxy 類別，Service 完全不知道快取的存在。<br>
        代理模式遵循<strong>單一職責原則</strong>和<strong>開放封閉原則</strong>，更容易測試和維護。
      </p>
    </div>

    <h2>實戰範例二：保護代理</h2>
    <p>
      <code>AuthorizedProductService</code> 在委派給真正的服務之前，先檢查使用者是否已登入、是否具備所需角色。
    </p>
    <CodeBlock :code="protectionProxy" lang="csharp" />

    <h2>實戰範例三：日誌代理</h2>
    <CodeBlock :code="loggingProxy" lang="csharp" />

    <h2>在 DI 中組裝代理（Decorator 鏈）</h2>
    <p>
      代理模式的強大之處在於可以<strong>層層包裝</strong>，形成一條裝飾鏈。
      透過 DI 容器的註冊順序，決定代理的執行順序。
    </p>

    <h3>手動註冊</h3>
    <CodeBlock :code="diWiring" lang="csharp" />

    <h3>使用 Scrutor 的 Decorate</h3>
    <CodeBlock :code="scrutorDecorate" lang="csharp" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ Decorate 的順序</div>
      <p>
        <code>Scrutor.Decorate</code> 的呼叫順序決定裝飾鏈的結構。<br>
        先呼叫的在<strong>內層</strong>，後呼叫的在<strong>外層</strong>。<br>
        請求的流向是由外到內：<code>AuthProxy → CacheProxy → RealService</code><br>
        也就是說：先檢查權限，再檢查快取，最後才打到真正的服務。
      </p>
    </div>

    <h2>.NET 生態系中的代理模式</h2>
    <table>
      <thead>
        <tr>
          <th>.NET 元件</th>
          <th>代理類型</th>
          <th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Lazy&lt;T&gt;</strong></td>
          <td>虛擬代理</td>
          <td>延遲初始化，第一次存取 <code>.Value</code> 時才建立物件，支援執行緒安全</td>
        </tr>
        <tr>
          <td><strong>HttpClientFactory</strong></td>
          <td>連線池代理</td>
          <td>管理 <code>HttpMessageHandler</code> 的生命週期，避免 Socket 耗盡問題</td>
        </tr>
        <tr>
          <td><strong>Castle DynamicProxy</strong></td>
          <td>AOP 代理</td>
          <td>在執行時期動態產生代理類別，攔截方法呼叫，用於日誌、快取、交易管理等</td>
        </tr>
        <tr>
          <td><strong>EF Core Change Tracking</strong></td>
          <td>變更追蹤代理</td>
          <td>EF Core 可為 Entity 建立代理子類別，自動偵測屬性變更</td>
        </tr>
        <tr>
          <td><strong>gRPC Client</strong></td>
          <td>遠端代理</td>
          <td>產生的 Client Stub 將本地方法呼叫序列化為網路請求</td>
        </tr>
        <tr>
          <td><strong>DispatchProxy</strong></td>
          <td>動態代理</td>
          <td>.NET 內建的動態代理基底類別，可在執行時期攔截介面方法呼叫</td>
        </tr>
      </tbody>
    </table>

    <h2>Lazy&lt;T&gt; 虛擬代理範例</h2>
    <CodeBlock :code="virtualProxyLazy" lang="csharp" />

    <h2>Proxy vs Decorator vs Adapter</h2>
    <table>
      <thead>
        <tr>
          <th>比較項目</th>
          <th>Proxy</th>
          <th>Decorator</th>
          <th>Adapter</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>意圖</strong></td>
          <td>控制存取</td>
          <td>動態增加行為</td>
          <td>轉換介面</td>
        </tr>
        <tr>
          <td><strong>介面關係</strong></td>
          <td>與被代理物件相同介面</td>
          <td>與被裝飾物件相同介面</td>
          <td>將一個介面轉為另一個</td>
        </tr>
        <tr>
          <td><strong>物件建立</strong></td>
          <td>Proxy 可能自行建立被代理物件</td>
          <td>總是由外部傳入被裝飾物件</td>
          <td>包裝既有物件</td>
        </tr>
        <tr>
          <td><strong>典型用途</strong></td>
          <td>快取、權限、延遲載入</td>
          <td>加日誌、加驗證、加壓縮</td>
          <td>整合舊系統、第三方 API</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">📌 設計重點整理</div>
      <p>
        1. <strong>代理和真正的物件實作同一個介面</strong>，客戶端無需修改程式碼。<br>
        2. <strong>代理控制存取</strong>，而不是增加新行為（這是和 Decorator 的主要區別）。<br>
        3. 在 .NET 中，搭配 <strong>DI + Scrutor Decorate</strong> 可以輕鬆組裝代理鏈。<br>
        4. 善用 .NET 內建的代理：<strong>Lazy&lt;T&gt;</strong>、<strong>HttpClientFactory</strong>、<strong>DispatchProxy</strong>。<br>
        5. 多層代理的順序很重要，要根據業務需求決定：通常是 <strong>Auth → Cache → Real</strong>。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/state', label: 'State 狀態模式' }"
    />
  </div>
</template>
