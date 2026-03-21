<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Redis 深入教學</h1>
    <p class="page-subtitle">StackExchange.Redis — 直接操作 Redis 豐富資料結構</p>

    <h2>為什麼直接用 StackExchange.Redis？</h2>
    <p>
      <code>IDistributedCache</code> 介面只支援 Key-Value（byte[]）操作，
      無法使用 Redis 的進階資料結構（List、Hash、Set、Sorted Set、Stream 等）。
      若需完整的 Redis 能力，需直接使用 <code>StackExchange.Redis</code>。
    </p>

    <h2>安裝與連線</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
dotnet add package StackExchange.Redis`" />

    <CodeBlock lang="csharp" filename="Program.cs" :code="`
// 方式 1：作為 Singleton 直接注入 ConnectionMultiplexer
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var config = ConfigurationOptions.Parse(
        builder.Configuration.GetConnectionString(&quot;Redis&quot;)!);

    config.ConnectTimeout = 5000;
    config.SyncTimeout = 5000;
    config.ReconnectRetryPolicy = new ExponentialRetry(5000);

    return ConnectionMultiplexer.Connect(config);
});

// 方式 2：搭配 IDistributedCache 一起使用（最常見）
builder.Services.AddStackExchangeRedisCache(options =>
{
    options.Configuration = builder.Configuration.GetConnectionString(&quot;Redis&quot;);
    options.InstanceName = &quot;EShop:&quot;;
});

builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
    sp.GetRequiredService<IStackExchangeRedisCacheClient>()
      .GetConnectionMultiplexer());`" />

    <CodeBlock lang="json" filename="appsettings.json" :code="`
{
  &quot;ConnectionStrings&quot;: {
    &quot;Redis&quot;: &quot;localhost:6379,password=your-password,ssl=false,abortConnect=false,connectTimeout=5000&quot;
  }
}`" />

    <h2>Docker 快速啟動 Redis</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 啟動 Redis（無密碼，開發用）
docker run -d --name redis -p 6379:6379 redis:7-alpine

# 啟動 Redis（有密碼）
docker run -d --name redis -p 6379:6379 redis:7-alpine \\
  redis-server --requirepass &quot;your-password&quot;

# 進入 Redis CLI
docker exec -it redis redis-cli`" />

    <h2>String — 基本 Key-Value</h2>
    <CodeBlock lang="csharp" filename="Redis String 操作" :code="`
public class RedisStringExample
{
    private readonly IDatabase _db;

    public RedisStringExample(IConnectionMultiplexer redis)
        => _db = redis.GetDatabase();

    public async Task DemoAsync()
    {
        // 設定（帶 TTL）
        await _db.StringSetAsync(&quot;greeting&quot;, &quot;Hello, Redis!&quot;,
            expiry: TimeSpan.FromMinutes(10));

        // 取得
        RedisValue value = await _db.StringGetAsync(&quot;greeting&quot;);
        string? str = value.HasValue ? (string?)value : null;

        // 原子計數器（不需加鎖）
        await _db.StringSetAsync(&quot;visitors:today&quot;, 0);
        long count = await _db.StringIncrementAsync(&quot;visitors:today&quot;);  // +1
        await _db.StringIncrementAsync(&quot;visitors:today&quot;, 10);            // +10

        // 不存在才設定（分散式鎖常用）
        bool created = await _db.StringSetAsync(
            &quot;lock:order-123&quot;, &quot;worker-1&quot;,
            expiry: TimeSpan.FromSeconds(30),
            when: When.NotExists);
    }
}`" />

    <h2>Hash — 物件儲存</h2>
    <p>Hash 適合儲存多個欄位的物件，可以只更新部分欄位而不需要讀取整個物件。</p>

    <CodeBlock lang="csharp" filename="Redis Hash — 儲存使用者 Session" :code="`
public async Task StoreUserSessionAsync(string sessionId, UserSession session)
{
    var key = $&quot;session:{sessionId}&quot;;

    // 一次設定多個欄位
    await _db.HashSetAsync(key, [
        new HashEntry(&quot;userId&quot;,    session.UserId.ToString()),
        new HashEntry(&quot;username&quot;,  session.Username),
        new HashEntry(&quot;role&quot;,      session.Role),
        new HashEntry(&quot;createdAt&quot;, session.CreatedAt.Ticks),
    ]);

    await _db.KeyExpireAsync(key, TimeSpan.FromHours(2));
}

public async Task<UserSession?> GetUserSessionAsync(string sessionId)
{
    var key = $&quot;session:{sessionId}&quot;;
    var entries = await _db.HashGetAllAsync(key);
    if (entries.Length == 0) return null;

    var dict = entries.ToDictionary(e => e.Name.ToString(), e => e.Value);
    return new UserSession
    {
        UserId  = Guid.Parse(dict[&quot;userId&quot;]!),
        Username = dict[&quot;username&quot;]!,
        Role    = dict[&quot;role&quot;]!,
        CreatedAt = new DateTime((long)dict[&quot;createdAt&quot;])
    };
}

// 只更新單一欄位（不影響其他欄位）
public async Task UpdateLastActiveAsync(string sessionId)
{
    await _db.HashSetAsync($&quot;session:{sessionId}&quot;,
        &quot;lastActive&quot;, DateTimeOffset.UtcNow.Ticks);
}`" />

    <h2>List — 佇列與最新訊息</h2>
    <CodeBlock lang="csharp" filename="Redis List — 最新訂單佇列" :code="`
public async Task PushRecentOrderAsync(string orderId)
{
    const string key = &quot;orders:recent&quot;;

    // 推入左端（最新的在最前面）
    await _db.ListLeftPushAsync(key, orderId);

    // 裁剪，只保留最新 100 筆
    await _db.ListTrimAsync(key, 0, 99);
}

public async Task<IEnumerable<string>> GetRecentOrdersAsync(int count = 10)
{
    var values = await _db.ListRangeAsync(&quot;orders:recent&quot;, 0, count - 1);
    return values.Select(v => (string)v!);
}

// 作為 FIFO 佇列（生產者/消費者模式）
public async Task EnqueueEmailAsync(string emailJson)
    => await _db.ListRightPushAsync(&quot;queue:emails&quot;, emailJson);

public async Task<string?> DequeueEmailAsync()
{
    var value = await _db.ListLeftPopAsync(&quot;queue:emails&quot;);
    return value.HasValue ? (string?)value : null;
}`" />

    <h2>Sorted Set — 排行榜</h2>
    <CodeBlock lang="csharp" filename="Redis Sorted Set — 商品熱度排行榜" :code="`
public async Task RecordProductViewAsync(string productId)
{
    // 每次瀏覽 +1 分
    await _db.SortedSetIncrementAsync(&quot;ranking:products:views&quot;, productId, 1);
}

public async Task<IEnumerable<(string ProductId, double Score)>> GetTopProductsAsync(int top = 10)
{
    // 取得分數最高的 N 個（降冪排列）
    var entries = await _db.SortedSetRangeByRankWithScoresAsync(
        &quot;ranking:products:views&quot;,
        start: 0, stop: top - 1,
        order: Order.Descending);

    return entries.Select(e => ((string)e.Element!, e.Score));
}`" />

    <h2>Pub/Sub — 即時事件廣播</h2>
    <CodeBlock lang="csharp" filename="Redis Pub/Sub" :code="`
// 發布者
public async Task PublishOrderCreatedAsync(string orderId)
{
    var subscriber = _redis.GetSubscriber();
    await subscriber.PublishAsync(
        RedisChannel.Literal(&quot;order:created&quot;),
        orderId);
}

// 訂閱者（在 Background Service 中）
protected override async Task ExecuteAsync(CancellationToken ct)
{
    var subscriber = _redis.GetSubscriber();

    await subscriber.SubscribeAsync(
        RedisChannel.Literal(&quot;order:created&quot;),
        async (channel, message) =>
        {
            var orderId = (string)message!;
            await ProcessNewOrderAsync(orderId);
        });

    await Task.Delay(Timeout.Infinite, ct);
}`" />

    <h2>分散式鎖（Distributed Lock）</h2>
    <CodeBlock lang="csharp" filename="使用 Redis 實作分散式鎖" :code="`
public class RedisDistributedLock
{
    private readonly IDatabase _db;
    private readonly string _lockKey;
    private readonly string _lockValue = Guid.NewGuid().ToString();

    public RedisDistributedLock(IDatabase db, string resource)
    {
        _db = db;
        _lockKey = $&quot;lock:{resource}&quot;;
    }

    public async Task<bool> AcquireAsync(TimeSpan expiry)
    {
        // NX：不存在才設定；EX：設定過期時間 → 原子操作
        return await _db.StringSetAsync(
            _lockKey, _lockValue, expiry, When.NotExists);
    }

    public async Task ReleaseAsync()
    {
        // 使用 Lua Script 確保只有持鎖者才能釋放（原子性）
        const string script = @&quot;
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end&quot;;

        await _db.ScriptEvaluateAsync(script,
            keys: [_lockKey],
            values: [_lockValue]);
    }
}

// 使用
var @lock = new RedisDistributedLock(_db, &quot;order-123&quot;);
if (await @lock.AcquireAsync(TimeSpan.FromSeconds(30)))
{
    try { await ProcessOrderAsync(); }
    finally { await @lock.ReleaseAsync(); }
}`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 生產環境建議使用 RedLock</div>
      <p>
        上述的單節點鎖在 Redis 重啟或主從切換時存在風險。
        生產環境建議使用 <code>RedLock.net</code> 套件，它實作了 Redlock 演算法，
        在多個 Redis 節點間確保鎖的安全性。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/cache/distributed', label: 'IDistributedCache' }"
      :next="{ path: '/csharp/cache/patterns', label: '快取策略' }"
    />
  </div>
</template>
