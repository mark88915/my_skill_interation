<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>生產環境建議</h1>
    <p class="page-subtitle">Redis 高可用配置、監控、Key 設計與效能調校</p>

    <h2>Redis 高可用架構</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>Redis Sentinel</h4>
        <p>自動主從切換（Failover）。適合中小型應用，最少 3 個 Sentinel 節點。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>Redis Cluster</h4>
        <p>自動分片（Sharding），支援線性水平擴展。適合大型應用，最少 3 主 3 從。</p>
      </div>
      <div class="concept-card">
        <div class="icon">☁️</div>
        <h4>雲端託管服務</h4>
        <p>Azure Cache for Redis、AWS ElastiCache，免管理節點，推薦生產環境使用。</p>
      </div>
    </div>

    <CodeBlock lang="json" filename="appsettings.Production.json — Redis Sentinel" :code="`
{
  &quot;ConnectionStrings&quot;: {
    &quot;Redis&quot;: &quot;sentinel-host-1:26379,sentinel-host-2:26379,sentinel-host-3:26379,serviceName=mymaster,password=secret,ssl=true,abortConnect=false&quot;
  }
}`" />

    <CodeBlock lang="csharp" filename="Program.cs — 生產環境設定" :code="`
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var options = new ConfigurationOptions
    {
        Password = config[&quot;Redis:Password&quot;],
        Ssl = true,
        SslProtocols = System.Security.Authentication.SslProtocols.Tls12,

        ConnectTimeout  = 5000,
        SyncTimeout     = 5000,
        AsyncTimeout    = 5000,

        // 斷線後自動重試
        ReconnectRetryPolicy = new ExponentialRetry(baseDelayMs: 1000),
        AbortOnConnectFail = false,

        // 連線池大小（預設 50）
        // 依你的應用並發量調整
    };

    foreach (var ep in config[&quot;Redis:Endpoints&quot;]!.Split(','))
        options.EndPoints.Add(ep.Trim());

    return ConnectionMultiplexer.Connect(options);
});`" />

    <h2>Key 命名規範</h2>
    <p>好的 Key 命名能讓你輕鬆管理和監控快取，避免衝突。</p>

    <CodeBlock lang="csharp" filename="CacheKeys.cs — 統一管理 Key" :code="`
public static class CacheKeys
{
    // 格式：{app}:{entity}:{id}[:qualifier]

    // ✅ 好的命名
    public static string Product(Guid id)          => $&quot;eshop:product:{id}&quot;;
    public static string ProductList(int page)     => $&quot;eshop:products:list:{page}&quot;;
    public static string UserSession(string token) => $&quot;eshop:session:{token}&quot;;
    public static string RateLimit(string ip)      => $&quot;eshop:ratelimit:{ip}:&quot; +
                                                       $&quot;{DateTimeOffset.UtcNow:yyyyMMddHHmm}&quot;;

    // ❌ 不好的命名
    // &quot;product123&quot;        — 沒有命名空間，容易與其他 App 衝突
    // &quot;GetProductById&quot;    — 以方法名命名，不直覺
    // &quot;p:{id}&quot;            — 縮寫太短，難以辨識
    // &quot;product:all:list:page:1&quot; — 過長且冗餘

    // 前綴群組（用於批次失效）
    public const string ProductPrefix  = &quot;eshop:product:&quot;;
    public const string SessionPrefix  = &quot;eshop:session:&quot;;
}`" />

    <table>
      <thead>
        <tr>
          <th>規則</th>
          <th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>使用冒號分隔命名空間</td>
          <td><code>app:entity:id</code>，Redis 工具（如 RedisInsight）可樹狀顯示</td>
        </tr>
        <tr>
          <td>加入應用前綴</td>
          <td>同一 Redis 服務器服務多個應用時避免衝突</td>
        </tr>
        <tr>
          <td>避免過長 Key</td>
          <td>Key 本身也佔記憶體，建議 100 bytes 以內</td>
        </tr>
        <tr>
          <td>不要在 Key 中放敏感資訊</td>
          <td>Key 在 Redis 工具中可見，不應包含密碼、Token 明文</td>
        </tr>
        <tr>
          <td>統一管理 Key 格式</td>
          <td>用 <code>static class CacheKeys</code> 集中定義，避免散落在各處</td>
        </tr>
      </tbody>
    </table>

    <h2>監控指標</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>命中率（Hit Rate）</h4>
        <p>目標 &gt; 90%。過低代表快取策略需調整或 TTL 太短。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💾</div>
        <h4>記憶體使用量</h4>
        <p>監控 <code>used_memory</code>，設定 <code>maxmemory</code> 防止 OOM。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⏱️</div>
        <h4>P99 延遲</h4>
        <p>Redis 命令延遲應在 1ms 以內。過高需檢查慢查詢。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>連線數</h4>
        <p>監控 <code>connected_clients</code>，避免連線洩漏。</p>
      </div>
    </div>

    <CodeBlock lang="csharp" filename="Program.cs — 加入 Redis 健康檢查" :code="`
builder.Services.AddHealthChecks()
    .AddRedis(
        redisConnectionString: builder.Configuration.GetConnectionString(&quot;Redis&quot;)!,
        name: &quot;redis&quot;,
        failureStatus: HealthStatus.Degraded,
        tags: [&quot;cache&quot;, &quot;infrastructure&quot;]);

// 暴露健康檢查端點
app.MapHealthChecks(&quot;/health/cache&quot;, new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains(&quot;cache&quot;)
});`" />

    <h2>效能調校建議</h2>
    <table>
      <thead>
        <tr>
          <th>問題</th>
          <th>原因</th>
          <th>解法</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>快取命中率低</td>
          <td>TTL 太短或 Key 設計不當</td>
          <td>調長 TTL、檢查 Key 是否一致</td>
        </tr>
        <tr>
          <td>Redis 記憶體暴增</td>
          <td>Value 過大或 TTL 未設定</td>
          <td>縮小 Value、強制設定 TTL、設定 maxmemory</td>
        </tr>
        <tr>
          <td>連線數過多</td>
          <td>ConnectionMultiplexer 未以 Singleton 注入</td>
          <td>確保 <code>AddSingleton&lt;IConnectionMultiplexer&gt;</code></td>
        </tr>
        <tr>
          <td>Hot Key 延遲高</td>
          <td>單一 Key 被頻繁存取</td>
          <td>在 L1（IMemoryCache）加一層本地快取</td>
        </tr>
        <tr>
          <td>序列化耗時</td>
          <td>使用 JSON 序列化大物件</td>
          <td>改用 MessagePack 或 System.Text.Json Source Generator</td>
        </tr>
      </tbody>
    </table>

    <h2>快速清單：選擇決策</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ 生產環境快取 Checklist</div>
      <p>
        ☐ 所有快取 Key 都有 TTL（不設 TTL = 潛在記憶體洩漏）<br>
        ☐ TTL 加入 Jitter 防止雪崩<br>
        ☐ 快取空值防止穿透<br>
        ☐ 使用 SemaphoreSlim 或 HybridCache 防止 Stampede<br>
        ☐ ConnectionMultiplexer 以 Singleton 注入<br>
        ☐ 設定 Redis maxmemory 和 maxmemory-policy<br>
        ☐ 加入健康檢查端點<br>
        ☐ 監控命中率、記憶體、延遲<br>
        ☐ CacheKeys 集中管理<br>
        ☐ 敏感資料不放入快取（或加密後再放）
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/cache/scenarios', label: '使用場景比較' }"
    />
  </div>
</template>
