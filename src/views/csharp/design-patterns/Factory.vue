<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const notificationInterface = `// 產品介面：所有通知服務的共同合約
public interface INotificationSender
{
    Task SendAsync(string recipient, string subject, string body);
    string Channel { get; } // "Email", "SMS", "Push"
}

// 具體產品 A：Email 通知
public class EmailNotificationSender : INotificationSender
{
    private readonly SmtpClient _smtpClient;

    public EmailNotificationSender(SmtpClient smtpClient)
    {
        _smtpClient = smtpClient;
    }

    public string Channel => "Email";

    public async Task SendAsync(string recipient, string subject, string body)
    {
        var message = new MailMessage("noreply@example.com", recipient, subject, body);
        await _smtpClient.SendMailAsync(message);
    }
}

// 具體產品 B：SMS 通知
public class SmsNotificationSender : INotificationSender
{
    private readonly ISmsGateway _gateway;

    public SmsNotificationSender(ISmsGateway gateway)
    {
        _gateway = gateway;
    }

    public string Channel => "SMS";

    public async Task SendAsync(string recipient, string subject, string body)
    {
        await _gateway.SendSmsAsync(recipient, $"{subject}: {body}");
    }
}

// 具體產品 C：Push 通知
public class PushNotificationSender : INotificationSender
{
    private readonly IFirebaseClient _firebase;

    public PushNotificationSender(IFirebaseClient firebase)
    {
        _firebase = firebase;
    }

    public string Channel => "Push";

    public async Task SendAsync(string recipient, string subject, string body)
    {
        await _firebase.SendPushAsync(recipient, new { title = subject, body });
    }
}`

const factoryMethodCode = `// 工廠方法：定義建立物件的介面，讓子類別決定實例化哪個類別
public enum NotificationType
{
    Email,
    Sms,
    Push
}

// 抽象建立者（Creator）
public abstract class NotificationFactory
{
    // 工廠方法：子類別必須實作
    public abstract INotificationSender CreateSender();

    // 範本方法：使用工廠方法建立的產品
    public async Task NotifyAsync(string recipient, string subject, string body)
    {
        var sender = CreateSender();
        Console.WriteLine($"透過 {sender.Channel} 發送通知...");
        await sender.SendAsync(recipient, subject, body);
    }
}

// 具體建立者 A
public class EmailNotificationFactory : NotificationFactory
{
    private readonly SmtpClient _smtpClient;

    public EmailNotificationFactory(SmtpClient smtpClient)
    {
        _smtpClient = smtpClient;
    }

    public override INotificationSender CreateSender()
        => new EmailNotificationSender(_smtpClient);
}

// 具體建立者 B
public class SmsNotificationFactory : NotificationFactory
{
    private readonly ISmsGateway _gateway;

    public SmsNotificationFactory(ISmsGateway gateway)
    {
        _gateway = gateway;
    }

    public override INotificationSender CreateSender()
        => new SmsNotificationSender(_gateway);
}

// 具體建立者 C
public class PushNotificationFactory : NotificationFactory
{
    private readonly IFirebaseClient _firebase;

    public PushNotificationFactory(IFirebaseClient firebase)
    {
        _firebase = firebase;
    }

    public override INotificationSender CreateSender()
        => new PushNotificationSender(_firebase);
}`

const factoryMethodUsage = `// 使用工廠方法 — 客戶端程式碼不依賴具體產品
public class OrderService
{
    private readonly NotificationFactory _notificationFactory;

    public OrderService(NotificationFactory notificationFactory)
    {
        _notificationFactory = notificationFactory;
    }

    public async Task PlaceOrderAsync(Order order)
    {
        // 處理訂單邏輯...

        // 發送通知：不需要知道用的是 Email、SMS 還是 Push
        await _notificationFactory.NotifyAsync(
            order.CustomerContact,
            "訂單確認",
            $"您的訂單 {order.Id} 已成立");
    }
}`

const simpleFactoryCode = `// 簡單工廠（不算正式的設計模式，但常用）
// 將建立邏輯集中在一個靜態方法或類別中
public static class NotificationSenderFactory
{
    public static INotificationSender Create(
        NotificationType type,
        IServiceProvider services)
    {
        return type switch
        {
            NotificationType.Email => new EmailNotificationSender(
                services.GetRequiredService<SmtpClient>()),
            NotificationType.Sms => new SmsNotificationSender(
                services.GetRequiredService<ISmsGateway>()),
            NotificationType.Push => new PushNotificationSender(
                services.GetRequiredService<IFirebaseClient>()),
            _ => throw new ArgumentException($"不支援的通知類型: {type}")
        };
    }
}`

const abstractFactoryInterface = `// 抽象工廠：建立一「家族」相關物件的介面
// 場景：多雲環境中，需要建立一整組雲端服務（Storage, Queue, Cache）

public interface IStorageService
{
    Task UploadAsync(string path, Stream data);
    Task<Stream> DownloadAsync(string path);
}

public interface IQueueService
{
    Task EnqueueAsync<T>(string queueName, T message);
    Task<T?> DequeueAsync<T>(string queueName);
}

public interface ICacheService
{
    Task SetAsync<T>(string key, T value, TimeSpan? expiry = null);
    Task<T?> GetAsync<T>(string key);
}

// 抽象工廠介面
public interface ICloudServiceFactory
{
    IStorageService CreateStorage();
    IQueueService CreateQueue();
    ICacheService CreateCache();
    string ProviderName { get; }
}`

const azureFactory = `// 具體工廠 A：Azure 服務家族
public class AzureServiceFactory : ICloudServiceFactory
{
    private readonly string _connectionString;

    public AzureServiceFactory(string connectionString)
    {
        _connectionString = connectionString;
    }

    public string ProviderName => "Azure";

    public IStorageService CreateStorage()
        => new AzureBlobStorageService(_connectionString);

    public IQueueService CreateQueue()
        => new AzureServiceBusQueueService(_connectionString);

    public ICacheService CreateCache()
        => new AzureRedisCacheService(_connectionString);
}

// 具體工廠 B：GCP 服務家族
public class GcpServiceFactory : ICloudServiceFactory
{
    private readonly string _projectId;

    public GcpServiceFactory(string projectId)
    {
        _projectId = projectId;
    }

    public string ProviderName => "GCP";

    public IStorageService CreateStorage()
        => new GcpCloudStorageService(_projectId);

    public IQueueService CreateQueue()
        => new GcpPubSubQueueService(_projectId);

    public ICacheService CreateCache()
        => new GcpMemorystoreCacheService(_projectId);
}`

const abstractFactoryUsage = `// 使用抽象工廠 — 客戶端程式碼完全不依賴具體雲端實作
public class FileProcessingService
{
    private readonly IStorageService _storage;
    private readonly IQueueService _queue;
    private readonly ICacheService _cache;

    // 注入的是工廠建立的產品，不是工廠本身
    public FileProcessingService(ICloudServiceFactory factory)
    {
        _storage = factory.CreateStorage();
        _queue = factory.CreateQueue();
        _cache = factory.CreateCache();
    }

    public async Task ProcessAsync(string filePath)
    {
        // 檢查快取
        var cached = await _cache.GetAsync<ProcessResult>(filePath);
        if (cached is not null) return;

        // 從雲端儲存下載
        using var stream = await _storage.DownloadAsync(filePath);

        // 處理檔案...
        var result = await DoProcessing(stream);

        // 快取結果
        await _cache.SetAsync(filePath, result, TimeSpan.FromHours(1));

        // 發送後續處理任務到佇列
        await _queue.EnqueueAsync("processed-files", new { filePath, result });
    }
}`

const diRegistrationCode = `// DI 註冊：根據設定決定使用哪個雲端工廠
builder.Services.AddSingleton<ICloudServiceFactory>(sp =>
{
    var config = sp.GetRequiredService<IConfiguration>();
    var provider = config["CloudProvider"]; // "Azure" 或 "GCP"

    return provider switch
    {
        "Azure" => new AzureServiceFactory(config["Azure:ConnectionString"]!),
        "GCP" => new GcpServiceFactory(config["GCP:ProjectId"]!),
        _ => throw new InvalidOperationException($"不支援的雲端供應商: {provider}")
    };
});

// 也可以直接註冊工廠產出的服務
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<ICloudServiceFactory>().CreateStorage());
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<ICloudServiceFactory>().CreateQueue());
builder.Services.AddSingleton(sp =>
    sp.GetRequiredService<ICloudServiceFactory>().CreateCache());

// 通知工廠也可以用 Keyed Services (.NET 8)
builder.Services.AddKeyedScoped<NotificationFactory, EmailNotificationFactory>("email");
builder.Services.AddKeyedScoped<NotificationFactory, SmsNotificationFactory>("sms");
builder.Services.AddKeyedScoped<NotificationFactory, PushNotificationFactory>("push");`

const factoryWithGenerics = `// 進階：結合泛型的工廠模式
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id);
    Task<IEnumerable<T>> GetAllAsync();
    Task AddAsync(T entity);
}

// 泛型工廠
public interface IRepositoryFactory
{
    IRepository<T> Create<T>() where T : class;
}

public class EfRepositoryFactory : IRepositoryFactory
{
    private readonly DbContext _context;

    public EfRepositoryFactory(DbContext context)
    {
        _context = context;
    }

    public IRepository<T> Create<T>() where T : class
        => new EfRepository<T>(_context);
}

// 使用
var orderRepo = factory.Create<Order>();
var productRepo = factory.Create<Product>();`
</script>

<template>
  <div class="content-wrapper">
    <h1>Factory 工廠模式</h1>
    <p class="page-subtitle">將物件的建立封裝起來，讓子類別決定實例化哪個類別</p>

    <h2>工廠模式家族</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>簡單工廠</h4>
        <p>一個方法根據參數決定建立哪個物件。雖不算正式模式，但最常用。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏭</div>
        <h4>Factory Method</h4>
        <p>定義建立物件的介面，讓<strong>子類別</strong>決定實例化哪個具體類別。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏗️</div>
        <h4>Abstract Factory</h4>
        <p>提供一個介面，建立一整個<strong>相關物件家族</strong>，不需指定具體類別。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>共同目標</h4>
        <p>封裝 <code>new</code> 的細節，讓客戶端程式碼依賴抽象而非具體實作。</p>
      </div>
    </div>

    <h2>OO 設計原則</h2>
    <div class="info-box tip">
      <div class="info-box-title">📖 依賴反轉原則 (Dependency Inversion Principle)</div>
      <p>
        <strong>要依賴抽象，不要依賴具體類別。</strong><br><br>
        工廠模式讓高層模組（如 <code>OrderService</code>）不直接 <code>new</code> 具體產品，
        而是透過工廠取得抽象介面的實作。這樣當需要替換實作時（例如從 Email 改成 Push），
        只要更換注入的工廠即可，業務邏輯完全不受影響。
      </p>
    </div>

    <h2>Part 1：Factory Method 工廠方法</h2>
    <p>
      <strong>情境：</strong>一個訂單系統需要發送通知，但通知管道（Email / SMS / Push）
      可能隨客戶偏好或系統設定而不同。我們不希望 <code>OrderService</code> 直接
      <code>new EmailSender()</code>，而是讓工廠決定建立哪種通知服務。
    </p>

    <h3>模式結構</h3>
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
          <td><strong>Product</strong></td>
          <td><code>INotificationSender</code></td>
          <td>產品介面，定義通知服務的合約</td>
        </tr>
        <tr>
          <td><strong>ConcreteProduct</strong></td>
          <td><code>EmailNotificationSender</code> 等</td>
          <td>具體產品，實作特定通知管道</td>
        </tr>
        <tr>
          <td><strong>Creator</strong></td>
          <td><code>NotificationFactory</code></td>
          <td>宣告工廠方法，可包含使用產品的邏輯</td>
        </tr>
        <tr>
          <td><strong>ConcreteCreator</strong></td>
          <td><code>EmailNotificationFactory</code> 等</td>
          <td>覆寫工廠方法，決定建立哪個具體產品</td>
        </tr>
      </tbody>
    </table>

    <h3>Step 1：定義產品介面與具體產品</h3>
    <CodeBlock :code="notificationInterface" lang="csharp" />

    <h3>Step 2：建立工廠方法</h3>
    <CodeBlock :code="factoryMethodCode" lang="csharp" />

    <h3>Step 3：客戶端使用</h3>
    <CodeBlock :code="factoryMethodUsage" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">💡 簡單工廠 vs 工廠方法</div>
      <p>
        實務中更常見的是<strong>簡單工廠</strong>（用 <code>switch</code> 或字典選擇產品），
        它不需要建立子類別，適合產品種類不多且較少變動的場景。
        工廠方法適合產品種類會不斷擴展、且每種產品的建立邏輯差異較大的場景。
      </p>
    </div>

    <h3>簡單工廠寫法（常用替代方案）</h3>
    <CodeBlock :code="simpleFactoryCode" lang="csharp" />

    <h2>Part 2：Abstract Factory 抽象工廠</h2>
    <p>
      <strong>情境：</strong>系統需要支援多雲部署（Azure / GCP），每個雲端供應商都有自己的
      Storage、Queue、Cache 實作。我們需要確保同一個環境使用<strong>同一家族</strong>的服務
      ——不能混用 Azure Storage 搭配 GCP Queue。
    </p>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 工廠方法 vs 抽象工廠的關鍵差異</div>
      <p>
        <strong>Factory Method：</strong>建立<strong>一種</strong>產品，透過繼承讓子類別決定具體類別。<br>
        <strong>Abstract Factory：</strong>建立<strong>一整組相關</strong>產品（一個家族），透過組合確保產品之間的相容性。<br><br>
        簡單記法：Factory Method 建立「一個」，Abstract Factory 建立「一組」。
      </p>
    </div>

    <h3>模式結構</h3>
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
          <td><strong>AbstractFactory</strong></td>
          <td><code>ICloudServiceFactory</code></td>
          <td>宣告建立一組產品的介面</td>
        </tr>
        <tr>
          <td><strong>ConcreteFactory</strong></td>
          <td><code>AzureServiceFactory</code>、<code>GcpServiceFactory</code></td>
          <td>實作特定家族的產品建立</td>
        </tr>
        <tr>
          <td><strong>AbstractProduct</strong></td>
          <td><code>IStorageService</code>、<code>IQueueService</code>、<code>ICacheService</code></td>
          <td>每種產品的介面</td>
        </tr>
        <tr>
          <td><strong>ConcreteProduct</strong></td>
          <td><code>AzureBlobStorageService</code>、<code>GcpCloudStorageService</code> 等</td>
          <td>特定家族中的具體產品</td>
        </tr>
      </tbody>
    </table>

    <h3>Step 1：定義產品介面與抽象工廠</h3>
    <CodeBlock :code="abstractFactoryInterface" lang="csharp" />

    <h3>Step 2：實作具體工廠</h3>
    <CodeBlock :code="azureFactory" lang="csharp" />

    <h3>Step 3：客戶端使用</h3>
    <CodeBlock :code="abstractFactoryUsage" lang="csharp" />

    <h2>DI 容器中的工廠註冊</h2>
    <CodeBlock :code="diRegistrationCode" lang="csharp" />

    <h2>進階：泛型工廠</h2>
    <p>結合 C# 泛型，可以建立更靈活的工廠，根據型別參數自動建立對應的 Repository。</p>
    <CodeBlock :code="factoryWithGenerics" lang="csharp" />

    <h2>三種工廠模式比較</h2>
    <table>
      <thead>
        <tr>
          <th>面向</th>
          <th>簡單工廠</th>
          <th>Factory Method</th>
          <th>Abstract Factory</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>建立物件數</strong></td>
          <td>一種產品</td>
          <td>一種產品</td>
          <td>一組相關產品</td>
        </tr>
        <tr>
          <td><strong>擴展方式</strong></td>
          <td>修改 switch（違反 OCP）</td>
          <td>新增子類別</td>
          <td>新增工廠 + 產品家族</td>
        </tr>
        <tr>
          <td><strong>複雜度</strong></td>
          <td>低</td>
          <td>中</td>
          <td>高</td>
        </tr>
        <tr>
          <td><strong>適用場景</strong></td>
          <td>產品種類少且穩定</td>
          <td>產品種類會擴展</td>
          <td>需要確保產品家族一致性</td>
        </tr>
        <tr>
          <td><strong>實務常見度</strong></td>
          <td>最常見</td>
          <td>常見</td>
          <td>較少，用於多平台/多供應商</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">💡 何時使用工廠模式？</div>
      <p>
        <strong>簡單工廠：</strong>需要根據參數建立不同物件，且種類不多時<br>
        <strong>Factory Method：</strong>框架或程式庫需要讓使用者自訂建立邏輯時（如 ASP.NET Core 的 <code>ILoggerFactory</code>）<br>
        <strong>Abstract Factory：</strong>需要建立一整組相關物件，且必須確保一致性時（如跨平台 UI、多雲部署）<br><br>
        <strong>實務建議：</strong>在 .NET 的 DI 環境中，很多時候直接用 DI 容器註冊介面與實作，
        就能達到工廠模式的效果。只有在建立邏輯較複雜、需要動態決定、或需要延遲建立時，
        才需要明確使用工廠模式。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/decorator', label: 'Decorator 裝飾者模式' }"
      :next="{ path: '/csharp/design-patterns/singleton', label: 'Singleton 單例模式' }"
    />
  </div>
</template>
