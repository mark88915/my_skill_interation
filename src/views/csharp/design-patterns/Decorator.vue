<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const decoratorInterface = `// 元件介面：定義被裝飾者與裝飾者的共同合約
public interface IHttpHandler
{
    Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default);
}`

const baseComponent = `// 具體元件：最基本的 HTTP 處理邏輯
public class BasicHttpHandler : IHttpHandler
{
    private readonly HttpClient _httpClient;

    public BasicHttpHandler(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        return await _httpClient.SendAsync(request, cancellationToken);
    }
}`

const baseDecorator = `// 裝飾者基底類別（可選，但能減少重複程式碼）
public abstract class HttpHandlerDecorator : IHttpHandler
{
    protected readonly IHttpHandler _innerHandler;

    protected HttpHandlerDecorator(IHttpHandler innerHandler)
    {
        _innerHandler = innerHandler;
    }

    public virtual Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        return _innerHandler.SendAsync(request, cancellationToken);
    }
}`

const loggingDecorator = `// 裝飾者 A：記錄 HTTP 請求與回應
public class LoggingHttpHandler : HttpHandlerDecorator
{
    private readonly ILogger<LoggingHttpHandler> _logger;

    public LoggingHttpHandler(
        IHttpHandler innerHandler,
        ILogger<LoggingHttpHandler> logger) : base(innerHandler)
    {
        _logger = logger;
    }

    public override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("→ {Method} {Uri}", request.Method, request.RequestUri);

        var stopwatch = Stopwatch.StartNew();
        var response = await _innerHandler.SendAsync(request, cancellationToken);
        stopwatch.Stop();

        _logger.LogInformation("← {StatusCode} in {Elapsed}ms",
            response.StatusCode, stopwatch.ElapsedMilliseconds);

        return response;
    }
}`

const retryDecorator = `// 裝飾者 B：自動重試失敗的請求
public class RetryHttpHandler : HttpHandlerDecorator
{
    private readonly int _maxRetries;
    private readonly TimeSpan _delay;
    private readonly ILogger<RetryHttpHandler> _logger;

    public RetryHttpHandler(
        IHttpHandler innerHandler,
        int maxRetries = 3,
        TimeSpan? delay = null,
        ILogger<RetryHttpHandler>? logger = null) : base(innerHandler)
    {
        _maxRetries = maxRetries;
        _delay = delay ?? TimeSpan.FromSeconds(1);
        _logger = logger!;
    }

    public override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        for (int attempt = 1; attempt <= _maxRetries; attempt++)
        {
            try
            {
                var response = await _innerHandler.SendAsync(request, cancellationToken);

                if (response.IsSuccessStatusCode || attempt == _maxRetries)
                    return response;

                _logger.LogWarning("嘗試 {Attempt}/{Max} 失敗: {Status}",
                    attempt, _maxRetries, response.StatusCode);
            }
            catch (HttpRequestException ex) when (attempt < _maxRetries)
            {
                _logger.LogWarning(ex, "嘗試 {Attempt}/{Max} 發生例外",
                    attempt, _maxRetries);
            }

            await Task.Delay(_delay * attempt, cancellationToken); // 指數退避
        }

        throw new InvalidOperationException("不應到達此處");
    }
}`

const cachingDecorator = `// 裝飾者 C：快取 GET 請求的回應
public class CachingHttpHandler : HttpHandlerDecorator
{
    private readonly IMemoryCache _cache;
    private readonly TimeSpan _cacheDuration;

    public CachingHttpHandler(
        IHttpHandler innerHandler,
        IMemoryCache cache,
        TimeSpan? cacheDuration = null) : base(innerHandler)
    {
        _cache = cache;
        _cacheDuration = cacheDuration ?? TimeSpan.FromMinutes(5);
    }

    public override async Task<HttpResponseMessage> SendAsync(
        HttpRequestMessage request,
        CancellationToken cancellationToken = default)
    {
        // 只快取 GET 請求
        if (request.Method != HttpMethod.Get)
            return await _innerHandler.SendAsync(request, cancellationToken);

        var cacheKey = request.RequestUri!.ToString();

        if (_cache.TryGetValue(cacheKey, out HttpResponseMessage? cached))
            return cached!;

        var response = await _innerHandler.SendAsync(request, cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            _cache.Set(cacheKey, response, _cacheDuration);
        }

        return response;
    }
}`

const composition = `// 組合裝飾者：由外而內層層包裝
// 執行順序：Logging → Retry → Caching → BasicHandler
var httpClient = new HttpClient();

IHttpHandler handler = new BasicHttpHandler(httpClient);
handler = new CachingHttpHandler(handler, memoryCache);
handler = new RetryHttpHandler(handler, maxRetries: 3);
handler = new LoggingHttpHandler(handler, logger);

// 使用時完全不知道背後有多少裝飾者
var response = await handler.SendAsync(new HttpRequestMessage(HttpMethod.Get, url));`

const diRegistration = `// 使用 DI 容器組裝裝飾者鏈（搭配 Scrutor 套件更方便）
builder.Services.AddMemoryCache();

// 方法 1：手動註冊
builder.Services.AddScoped<IHttpHandler>(sp =>
{
    var httpClient = sp.GetRequiredService<HttpClient>();
    var cache = sp.GetRequiredService<IMemoryCache>();
    var loggerFactory = sp.GetRequiredService<ILoggerFactory>();

    IHttpHandler handler = new BasicHttpHandler(httpClient);
    handler = new CachingHttpHandler(handler, cache);
    handler = new RetryHttpHandler(handler, maxRetries: 3);
    handler = new LoggingHttpHandler(handler,
        loggerFactory.CreateLogger<LoggingHttpHandler>());

    return handler;
});

// 方法 2：使用 Scrutor 套件的 Decorate 語法
builder.Services.AddScoped<IHttpHandler, BasicHttpHandler>();
builder.Services.Decorate<IHttpHandler, CachingHttpHandler>();
builder.Services.Decorate<IHttpHandler, RetryHttpHandler>();
builder.Services.Decorate<IHttpHandler, LoggingHttpHandler>();`

const streamDecorator = `// .NET 內建的裝飾者經典範例：Stream
using var fileStream = new FileStream("data.bin", FileMode.Create);

// GZipStream 裝飾 FileStream → 寫入時自動壓縮
using var gzipStream = new GZipStream(fileStream, CompressionLevel.Optimal);

// BufferedStream 再裝飾 GZipStream → 加上緩衝區
using var bufferedStream = new BufferedStream(gzipStream, bufferSize: 4096);

// CryptoStream 最外層裝飾 → 加上加密
using var cryptoStream = new CryptoStream(bufferedStream, aes.CreateEncryptor(),
    CryptoStreamMode.Write);

// 對外部而言，cryptoStream 就是一個普通的 Stream
// 實際寫入時：加密 → 緩衝 → 壓縮 → 寫入檔案
await cryptoStream.WriteAsync(data);`

const middlewareExample = `// ASP.NET Core Middleware 本質上也是裝飾者模式
// 每個 Middleware 包裝 next，形成 pipeline

app.Use(async (context, next) =>
{
    // 裝飾前：記錄請求
    var stopwatch = Stopwatch.StartNew();
    Console.WriteLine($"→ {context.Request.Method} {context.Request.Path}");

    await next(context); // 呼叫內層

    // 裝飾後：記錄回應
    Console.WriteLine($"← {context.Response.StatusCode} in {stopwatch.ElapsedMilliseconds}ms");
});

app.Use(async (context, next) =>
{
    try
    {
        await next(context);
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = 500;
        await context.Response.WriteAsync("Internal Server Error");
    }
});

app.MapGet("/api/orders", () => Results.Ok(new { orders = new[] { "A", "B" } }));`
</script>

<template>
  <div class="content-wrapper">
    <h1>Decorator 裝飾者模式</h1>
    <p class="page-subtitle">動態地將責任附加到物件上，提供比繼承更有彈性的擴充方式</p>

    <h2>核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎁</div>
        <h4>包裝物件</h4>
        <p>裝飾者「持有」被裝飾的物件，並實作相同介面，對外完全透明。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>任意組合</h4>
        <p>多個裝飾者可以自由堆疊，順序不同行為就不同，像俄羅斯套娃一樣。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>執行期擴展</h4>
        <p>不需修改原始類別，在執行時期動態新增職責，比繼承更靈活。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📐</div>
        <h4>單一職責</h4>
        <p>每個裝飾者只負責一件事（logging、retry、caching），職責清楚。</p>
      </div>
    </div>

    <h2>OO 設計原則</h2>
    <div class="info-box tip">
      <div class="info-box-title">📖 開放封閉原則 (Open-Closed Principle)</div>
      <p>
        <strong>類別應該對擴展開放，對修改關閉。</strong><br><br>
        裝飾者模式是這個原則的完美實踐：我們不需要修改既有的 <code>BasicHttpHandler</code>，
        只要新增一個裝飾者類別，就能在不改動任何既有程式碼的情況下擴充功能。
        當需求變更時，我們「新增」裝飾者，而不是「修改」原始元件。
      </p>
    </div>

    <h2>模式結構</h2>
    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>本例對應</th>
          <th>職責</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Component</strong></td>
          <td><code>IHttpHandler</code></td>
          <td>定義被裝飾者與裝飾者的共同介面</td>
        </tr>
        <tr>
          <td><strong>ConcreteComponent</strong></td>
          <td><code>BasicHttpHandler</code></td>
          <td>被裝飾的核心物件，提供基本功能</td>
        </tr>
        <tr>
          <td><strong>Decorator</strong></td>
          <td><code>HttpHandlerDecorator</code></td>
          <td>裝飾者基底類別，持有內部元件的參照</td>
        </tr>
        <tr>
          <td><strong>ConcreteDecorator</strong></td>
          <td><code>LoggingHttpHandler</code> 等</td>
          <td>實際新增行為的裝飾者</td>
        </tr>
      </tbody>
    </table>

    <h2>實戰範例：HTTP Pipeline 裝飾者</h2>
    <p>
      以下示範如何用裝飾者模式為 HTTP 請求處理器逐層添加 Logging、Retry、Caching 功能，
      這正是 ASP.NET Core 中 <code>DelegatingHandler</code> 的設計思路。
    </p>

    <h3>Step 1：定義元件介面</h3>
    <CodeBlock :code="decoratorInterface" lang="csharp" />

    <h3>Step 2：實作具體元件</h3>
    <CodeBlock :code="baseComponent" lang="csharp" />

    <h3>Step 3：建立裝飾者基底類別</h3>
    <CodeBlock :code="baseDecorator" lang="csharp" />

    <h3>Step 4：實作具體裝飾者</h3>

    <h4>裝飾者 A — Logging（記錄請求/回應）</h4>
    <CodeBlock :code="loggingDecorator" lang="csharp" />

    <h4>裝飾者 B — Retry（自動重試）</h4>
    <CodeBlock :code="retryDecorator" lang="csharp" />

    <h4>裝飾者 C — Caching（快取 GET 回應）</h4>
    <CodeBlock :code="cachingDecorator" lang="csharp" />

    <h3>Step 5：組合裝飾者</h3>
    <CodeBlock :code="composition" lang="csharp" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 裝飾順序很重要</div>
      <p>
        裝飾者的包裝順序決定了執行順序。以上例來說：<br>
        <strong>請求方向（由外到內）：</strong>Logging → Retry → Caching → BasicHandler<br>
        <strong>回應方向（由內到外）：</strong>BasicHandler → Caching → Retry → Logging<br><br>
        如果把 Logging 放在 Retry 裡面，就會記錄到每次重試的細節；
        放在外面則只記錄最終結果。根據需求選擇適合的順序。
      </p>
    </div>

    <h2>DI 容器中的裝飾者註冊</h2>
    <CodeBlock :code="diRegistration" lang="csharp" />

    <h2>.NET 內建的裝飾者：Stream 系列</h2>
    <p>
      .NET 的 <code>System.IO.Stream</code> 是裝飾者模式最經典的實作。
      每個 Stream 子類別都可以包裝另一個 Stream，逐層添加功能：
    </p>
    <CodeBlock :code="streamDecorator" lang="csharp" />

    <h2>ASP.NET Core Middleware 也是裝飾者</h2>
    <p>
      Middleware pipeline 的概念與裝飾者完全一致：每個 Middleware 包裝 <code>next</code>，
      在呼叫前後執行自己的邏輯。
    </p>
    <CodeBlock :code="middlewareExample" lang="csharp" />

    <h2>.NET 生態中的裝飾者一覽</h2>
    <table>
      <thead>
        <tr>
          <th>場景</th>
          <th>介面 / 基底</th>
          <th>裝飾者範例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>I/O Stream</strong></td>
          <td><code>Stream</code></td>
          <td><code>BufferedStream</code>、<code>GZipStream</code>、<code>CryptoStream</code></td>
        </tr>
        <tr>
          <td><strong>HTTP 管道</strong></td>
          <td><code>DelegatingHandler</code></td>
          <td>Logging、Retry、Auth header injection</td>
        </tr>
        <tr>
          <td><strong>Middleware</strong></td>
          <td><code>RequestDelegate</code></td>
          <td>CORS、Authentication、ExceptionHandler</td>
        </tr>
        <tr>
          <td><strong>快取</strong></td>
          <td><code>IDistributedCache</code></td>
          <td>L1 memory wrapper over L2 distributed cache</td>
        </tr>
        <tr>
          <td><strong>日誌</strong></td>
          <td><code>ILogger</code></td>
          <td>Filter、Enricher、Scope</td>
        </tr>
      </tbody>
    </table>

    <h2>裝飾者 vs 繼承</h2>
    <table>
      <thead>
        <tr>
          <th>面向</th>
          <th>繼承</th>
          <th>裝飾者模式</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>擴展時機</strong></td>
          <td>編譯期決定</td>
          <td>執行期動態組合</td>
        </tr>
        <tr>
          <td><strong>類別數量</strong></td>
          <td>排列組合爆炸（N 個功能 = 2^N 子類別）</td>
          <td>N 個裝飾者即可</td>
        </tr>
        <tr>
          <td><strong>耦合度</strong></td>
          <td>子類別與父類別緊密耦合</td>
          <td>只依賴介面，鬆耦合</td>
        </tr>
        <tr>
          <td><strong>測試性</strong></td>
          <td>難以單獨測試新增的行為</td>
          <td>每個裝飾者可獨立單元測試</td>
        </tr>
        <tr>
          <td><strong>缺點</strong></td>
          <td>繼承鏈過深難以維護</td>
          <td>多層包裝時除錯較不直覺</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">💡 何時使用裝飾者模式？</div>
      <p>
        <strong>適合場景：</strong><br>
        - 需要在不修改既有類別的情況下動態添加功能<br>
        - 功能可以自由組合（如 logging + retry + caching）<br>
        - 避免繼承爆炸（多種功能排列組合會產生大量子類別）<br><br>
        <strong>不適合場景：</strong><br>
        - 只需要固定的一種組合 → 直接用繼承或組合即可<br>
        - 裝飾者需要存取具體元件的特殊方法 → 會破壞透明性
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/observer', label: 'Observer 觀察者模式' }"
      :next="{ path: '/csharp/design-patterns/factory', label: 'Factory 工廠模式' }"
    />
  </div>
</template>
