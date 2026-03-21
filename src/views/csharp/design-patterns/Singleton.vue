<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const naiveSingletonCode = `// ❌ 反模式：手寫 Singleton（非執行緒安全）
public class AppSettings
{
    private static AppSettings? _instance;

    // 私有建構函式，防止外部 new
    private AppSettings()
    {
        // 從設定檔讀取
        ConnectionString = "Server=localhost;Database=MyApp;";
        MaxRetryCount = 3;
    }

    public string ConnectionString { get; private set; }
    public int MaxRetryCount { get; private set; }

    public static AppSettings Instance
    {
        get
        {
            // ⚠️ 多執行緒同時進入時，可能建立多個實例！
            if (_instance == null)
            {
                _instance = new AppSettings();
            }
            return _instance;
        }
    }
}`

const threadSafeSingletonCode = `// ⚠️ 改進：加鎖的 Singleton（效能差）
public class AppSettings
{
    private static AppSettings? _instance;
    private static readonly object _lock = new();

    private AppSettings() { /* ... */ }

    public static AppSettings Instance
    {
        get
        {
            // Double-Check Locking
            if (_instance == null)
            {
                lock (_lock)
                {
                    if (_instance == null)
                    {
                        _instance = new AppSettings();
                    }
                }
            }
            return _instance;
        }
    }
}`

const lazySingletonCode = `// ✅ 較好：使用 Lazy<T>（執行緒安全 + 延遲初始化）
public class AppSettings
{
    // Lazy<T> 預設就是 LazyThreadSafetyMode.ExecutionAndPublication
    private static readonly Lazy<AppSettings> _lazy =
        new(() => new AppSettings());

    private AppSettings()
    {
        // 讀取設定...
        ConnectionString = "Server=localhost;Database=MyApp;";
        MaxRetryCount = 3;
        CacheDurationMinutes = 30;
    }

    public static AppSettings Instance => _lazy.Value;

    public string ConnectionString { get; private set; }
    public int MaxRetryCount { get; private set; }
    public int CacheDurationMinutes { get; private set; }
}

// 使用方式（全域直接存取）
var connStr = AppSettings.Instance.ConnectionString;`

const singletonProblemsCode = `// ❌ 手寫 Singleton 的痛點

// 1️⃣ 無法單元測試 — 緊耦合
public class OrderService
{
    public void PlaceOrder(Order order)
    {
        // 直接引用 Singleton，無法在測試中替換
        var connStr = AppSettings.Instance.ConnectionString;
        var maxRetry = AppSettings.Instance.MaxRetryCount;
        // ...
    }
}

// 2️⃣ 隱藏依賴 — 從建構函式看不出依賴了什麼
public class ReportService
{
    // 建構函式沒有任何參數，卻偷偷依賴 AppSettings
    public ReportService() { }

    public Report Generate()
    {
        // 到這裡才發現依賴...
        var timeout = AppSettings.Instance.CacheDurationMinutes;
        return new Report();
    }
}

// 3️⃣ 生命週期無法控制 — 永遠存活到程式結束
// 4️⃣ 不支援多態 — 無法根據環境切換實作`

const appSettingsJsonCode = `// appsettings.json
{
    "AppSettings": {
        "ConnectionString": "Server=localhost;Database=MyApp;",
        "MaxRetryCount": 3,
        "CacheDurationMinutes": 30,
        "FeatureFlags": {
            "EnableNewUI": true,
            "EnableBetaApi": false
        }
    }
}`

const optionsPatternCode = `// ✅ 現代做法：IOptions<T> + DI Container

// 1. 定義強型別設定類別
public class AppSettingsOptions
{
    public const string SectionName = "AppSettings";

    public string ConnectionString { get; set; } = string.Empty;
    public int MaxRetryCount { get; set; } = 3;
    public int CacheDurationMinutes { get; set; } = 30;
    public FeatureFlagOptions FeatureFlags { get; set; } = new();
}

public class FeatureFlagOptions
{
    public bool EnableNewUI { get; set; }
    public bool EnableBetaApi { get; set; }
}

// 2. 在 Program.cs 中註冊（AddSingleton 生命週期）
var builder = WebApplication.CreateBuilder(args);

// 繫結設定區段 → 自動注入為 Singleton
builder.Services.Configure<AppSettingsOptions>(
    builder.Configuration.GetSection(AppSettingsOptions.SectionName));

// 如果需要在啟動時驗證設定值
builder.Services.AddOptions<AppSettingsOptions>()
    .Bind(builder.Configuration.GetSection(AppSettingsOptions.SectionName))
    .ValidateDataAnnotations()   // 支援 [Required]、[Range] 等驗證
    .ValidateOnStart();          // 應用啟動時立即驗證`

const diConsumerCode = `// 3. 在服務中透過 DI 注入使用
public class OrderService
{
    private readonly AppSettingsOptions _settings;

    // ✅ 依賴一目了然，可測試、可替換
    public OrderService(IOptions<AppSettingsOptions> options)
    {
        _settings = options.Value;
    }

    public void PlaceOrder(Order order)
    {
        var connStr = _settings.ConnectionString;
        var maxRetry = _settings.MaxRetryCount;
        // ... 業務邏輯
    }
}

// 4. 單元測試時輕鬆 Mock
[Fact]
public void PlaceOrder_ShouldUseConfiguredRetryCount()
{
    var mockOptions = Options.Create(new AppSettingsOptions
    {
        ConnectionString = "Server=test;Database=TestDB;",
        MaxRetryCount = 5
    });

    var service = new OrderService(mockOptions);
    // ... 測試邏輯
}`

const optionsVariantsCode = `// IOptions vs IOptionsSnapshot vs IOptionsMonitor

public class MyService
{
    // IOptions<T> — Singleton，啟動時讀取一次，不會更新
    public MyService(IOptions<AppSettingsOptions> options)
    {
        var val = options.Value; // 永遠是啟動時的值
    }
}

public class MyScopedService
{
    // IOptionsSnapshot<T> — Scoped，每次 Request 重新讀取
    // 適合需要動態更新設定的場景
    public MyScopedService(IOptionsSnapshot<AppSettingsOptions> options)
    {
        var val = options.Value; // 每次 Request 取得最新值
    }
}

public class MyBackgroundService
{
    // IOptionsMonitor<T> — Singleton，但會監聽變更並通知
    // 適合長時間運行的背景服務
    public MyBackgroundService(IOptionsMonitor<AppSettingsOptions> monitor)
    {
        var val = monitor.CurrentValue; // 永遠是最新值

        // 訂閱變更事件
        monitor.OnChange(updatedSettings =>
        {
            Console.WriteLine("設定已更新！");
        });
    }
}`

const customSingletonDiCode = `// ✅ 如果真的需要 Singleton 服務（非設定類別）
// 用 DI Container 管理，而非手寫 Singleton

public interface ICacheManager
{
    T? Get<T>(string key);
    void Set<T>(string key, T value, TimeSpan expiry);
}

public class InMemoryCacheManager : ICacheManager
{
    private readonly ConcurrentDictionary<string, object> _store = new();

    // 不需要 private 建構函式、不需要 static Instance
    // DI Container 會確保只建立一個實例

    public T? Get<T>(string key) =>
        _store.TryGetValue(key, out var val) ? (T)val : default;

    public void Set<T>(string key, T value, TimeSpan expiry) =>
        _store[key] = value!;
}

// 註冊為 Singleton — DI Container 保證全應用只有一個實例
builder.Services.AddSingleton<ICacheManager, InMemoryCacheManager>();

// 使用時透過建構函式注入
public class ProductService
{
    private readonly ICacheManager _cache;

    public ProductService(ICacheManager cache) => _cache = cache;

    public Product? GetProduct(int id) =>
        _cache.Get<Product>($"product:{id}");
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Singleton 單例模式</h1>
    <p class="page-subtitle">確保一個類別只有一個實例，並提供一個全域存取點</p>

    <div class="info-box warning">
      <div class="info-box-title">Head First Design Patterns</div>
      <p>
        Singleton 是最簡單、也是最容易被誤用的設計模式。本章將從傳統手寫 Singleton 的問題出發，
        帶你了解為什麼在現代 .NET 開發中，<strong>DI Container 的 AddSingleton</strong> 才是正確做法。
      </p>
    </div>

    <h2>模式概覽</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>意圖</h4>
        <p>確保一個類別在整個應用程式中只有一個實例，並提供全域存取點來取得它。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>適用場景</h4>
        <p>應用設定、Logger、快取管理器、連線池 — 任何「全域只需要一份」的資源。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚠️</div>
        <h4>常見問題</h4>
        <p>執行緒不安全、難以測試、隱藏依賴關係、違反單一職責原則。</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>現代解法</h4>
        <p>使用 .NET DI Container 的 AddSingleton，讓框架管理生命週期，而非手寫 Singleton。</p>
      </div>
    </div>

    <h2>傳統做法：手寫 Singleton</h2>

    <h3>最基本的 Singleton（有 Bug！）</h3>
    <CodeBlock lang="csharp" filename="AppSettings.cs — 非執行緒安全版本" :code="naiveSingletonCode" />

    <div class="info-box danger">
      <div class="info-box-title">多執行緒問題</div>
      <p>
        當兩個執行緒同時通過 <code>if (_instance == null)</code> 檢查時，會各自建立一個實例。
        在 Web 伺服器這種高併發環境下，這個 Bug 幾乎必然發生。
      </p>
    </div>

    <h3>加鎖的 Singleton（Double-Check Locking）</h3>
    <CodeBlock lang="csharp" filename="AppSettings.cs — 執行緒安全但囉嗦" :code="threadSafeSingletonCode" />

    <h3>Lazy&lt;T&gt; 版本</h3>
    <CodeBlock lang="csharp" filename="AppSettings.cs — 推薦的傳統寫法" :code="lazySingletonCode" />

    <h2>手寫 Singleton 的問題</h2>
    <CodeBlock lang="csharp" filename="為什麼手寫 Singleton 是反模式" :code="singletonProblemsCode" />

    <table>
      <thead>
        <tr>
          <th>問題</th>
          <th>手寫 Singleton</th>
          <th>DI Container</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>執行緒安全</strong></td>
          <td>需自行處理（容易出錯）</td>
          <td>框架保證</td>
        </tr>
        <tr>
          <td><strong>可測試性</strong></td>
          <td>難以 Mock（靜態存取）</td>
          <td>透過介面輕鬆替換</td>
        </tr>
        <tr>
          <td><strong>依賴可見性</strong></td>
          <td>隱藏在方法內部</td>
          <td>建構函式一目了然</td>
        </tr>
        <tr>
          <td><strong>生命週期管理</strong></td>
          <td>永遠存活（無法控制）</td>
          <td>Singleton / Scoped / Transient</td>
        </tr>
        <tr>
          <td><strong>多態支援</strong></td>
          <td>綁死具體類別</td>
          <td>可依環境切換實作</td>
        </tr>
        <tr>
          <td><strong>設定熱更新</strong></td>
          <td>不支援</td>
          <td>IOptionsMonitor 自動偵測</td>
        </tr>
      </tbody>
    </table>

    <h2>現代做法：IOptions&lt;T&gt; + DI</h2>
    <div class="info-box tip">
      <div class="info-box-title">最佳實踐</div>
      <p>
        在現代 .NET 中，應用程式設定應使用 <strong>Options Pattern</strong>，搭配
        <code>IOptions&lt;T&gt;</code> / <code>IOptionsSnapshot&lt;T&gt;</code> /
        <code>IOptionsMonitor&lt;T&gt;</code>，完全不需要手寫 Singleton。
      </p>
    </div>

    <h3>Step 1：定義設定檔</h3>
    <CodeBlock lang="json" filename="appsettings.json" :code="appSettingsJsonCode" />

    <h3>Step 2：定義設定類別 + 註冊</h3>
    <CodeBlock lang="csharp" filename="Options Pattern 設定" :code="optionsPatternCode" />

    <h3>Step 3：注入使用 + 單元測試</h3>
    <CodeBlock lang="csharp" filename="OrderService.cs — 依賴注入版本" :code="diConsumerCode" />

    <h2>IOptions 三兄弟</h2>
    <CodeBlock lang="csharp" filename="三種 Options 介面的差異" :code="optionsVariantsCode" />

    <table>
      <thead>
        <tr>
          <th>介面</th>
          <th>生命週期</th>
          <th>設定更新</th>
          <th>適用場景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>IOptions&lt;T&gt;</code></td>
          <td>Singleton</td>
          <td>啟動後不更新</td>
          <td>大部分情況，設定不會變動</td>
        </tr>
        <tr>
          <td><code>IOptionsSnapshot&lt;T&gt;</code></td>
          <td>Scoped</td>
          <td>每次 Request 重新讀取</td>
          <td>Web 應用、設定可能熱更新</td>
        </tr>
        <tr>
          <td><code>IOptionsMonitor&lt;T&gt;</code></td>
          <td>Singleton</td>
          <td>即時偵測變更 + 通知</td>
          <td>背景服務、需要即時反應變更</td>
        </tr>
      </tbody>
    </table>

    <h2>自訂 Singleton 服務</h2>
    <p>
      如果你的需求不是「應用設定」，而是某個真正需要全域唯一的服務（如快取管理器），
      仍然應透過 DI Container 而非手寫 Singleton：
    </p>
    <CodeBlock lang="csharp" filename="用 DI 管理 Singleton 服務" :code="customSingletonDiCode" />

    <h2>何時還是會看到手寫 Singleton？</h2>
    <div class="info-box info">
      <div class="info-box-title">例外情況</div>
      <p>
        雖然推薦使用 DI，但在以下情況你可能仍會看到傳統 Singleton：
      </p>
      <ul>
        <li><strong>Library / SDK 開發</strong> — 不依賴特定 DI 框架時</li>
        <li><strong>靜態工具類別</strong> — 如 Logger 的 static factory（<code>Log.Logger</code>）</li>
        <li><strong>極早期初始化</strong> — DI Container 尚未建立前就需要的服務</li>
        <li><strong>效能極端敏感</strong> — 避免 DI 解析開銷（極少見）</li>
      </ul>
      <p>
        即便如此，也建議使用 <code>Lazy&lt;T&gt;</code> 來確保執行緒安全。
      </p>
    </div>

    <h2>重點整理</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📖</div>
        <h4>Head First 教的</h4>
        <p>Private 建構函式 + static Instance 屬性，確保全域唯一實例。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏭</div>
        <h4>現實世界的做法</h4>
        <p>用 DI Container 的 AddSingleton 管理生命週期，搭配 IOptions&lt;T&gt; 管理設定。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🧪</div>
        <h4>可測試性</h4>
        <p>DI 版本可用 Options.Create() 輕鬆建立測試用的 Mock 設定物件。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>設定熱更新</h4>
        <p>IOptionsMonitor 可在 appsettings.json 變更時自動偵測並通知服務更新。</p>
      </div>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/factory', label: 'Factory 工廠模式' }"
      :next="{ path: '/csharp/design-patterns/command', label: 'Command 命令模式' }"
    />
  </div>
</template>
