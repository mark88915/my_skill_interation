<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const eventBasicCode = `// 方法 1：使用 C# 原生 event / delegate — 最基本的觀察者模式
// 這是 C# 語言內建的觀察者機制

// Subject（被觀察者）— 訂單
public class Order
{
    // 定義事件（使用 EventHandler<T> 委派）
    public event EventHandler<OrderStatusChangedEventArgs>? StatusChanged;

    public string OrderId { get; }
    public OrderStatus Status { get; private set; }

    public Order(string orderId)
    {
        OrderId = orderId;
        Status = OrderStatus.Created;
    }

    public void ChangeStatus(OrderStatus newStatus, string? reason = null)
    {
        var oldStatus = Status;
        Status = newStatus;

        // 觸發事件 — 通知所有訂閱者
        StatusChanged?.Invoke(this, new OrderStatusChangedEventArgs
        {
            OrderId = OrderId,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Reason = reason,
            ChangedAt = DateTime.UtcNow
        });
    }
}

public class OrderStatusChangedEventArgs : EventArgs
{
    public required string OrderId { get; init; }
    public required OrderStatus OldStatus { get; init; }
    public required OrderStatus NewStatus { get; init; }
    public string? Reason { get; init; }
    public DateTime ChangedAt { get; init; }
}

public enum OrderStatus
{
    Created,
    Paid,
    Preparing,
    Shipped,
    Delivered,
    Cancelled,
    Refunded
}`

const eventObserversCode = `// Observer（觀察者）— 各種通知服務

// Email 通知服務
public class EmailNotificationService
{
    private readonly IEmailSender _emailSender;
    private readonly ILogger<EmailNotificationService> _logger;

    public EmailNotificationService(IEmailSender emailSender, ILogger<EmailNotificationService> logger)
    {
        _emailSender = emailSender;
        _logger = logger;
    }

    // 事件處理方法 — 符合 EventHandler<T> 簽章
    public async void OnOrderStatusChanged(object? sender, OrderStatusChangedEventArgs e)
    {
        _logger.LogInformation("📧 發送 Email 通知：訂單 {OrderId} 狀態 {Old} → {New}",
            e.OrderId, e.OldStatus, e.NewStatus);

        await _emailSender.SendAsync(new EmailMessage
        {
            Subject = $"您的訂單 {e.OrderId} 狀態已更新",
            Body = $"訂單狀態已從 {e.OldStatus} 變更為 {e.NewStatus}",
        });
    }
}

// SMS 通知服務
public class SmsNotificationService
{
    private readonly ISmsSender _smsSender;
    private readonly ILogger<SmsNotificationService> _logger;

    public SmsNotificationService(ISmsSender smsSender, ILogger<SmsNotificationService> logger)
    {
        _smsSender = smsSender;
        _logger = logger;
    }

    public async void OnOrderStatusChanged(object? sender, OrderStatusChangedEventArgs e)
    {
        // 只有重要狀態才發 SMS（避免簡訊轟炸）
        if (e.NewStatus is not (OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Cancelled))
            return;

        _logger.LogInformation("📱 發送 SMS 通知：訂單 {OrderId} 狀態 → {New}",
            e.OrderId, e.NewStatus);

        await _smsSender.SendAsync($"您的訂單 {e.OrderId} 已{e.NewStatus}");
    }
}

// 推播通知服務
public class PushNotificationService
{
    private readonly IPushSender _pushSender;

    public PushNotificationService(IPushSender pushSender) => _pushSender = pushSender;

    public async void OnOrderStatusChanged(object? sender, OrderStatusChangedEventArgs e)
    {
        await _pushSender.SendAsync(new PushMessage
        {
            Title = "訂單狀態更新",
            Body = $"訂單 {e.OrderId}：{e.OldStatus} → {e.NewStatus}",
            Data = new { e.OrderId, Status = e.NewStatus.ToString() }
        });
    }
}`

const eventUsageCode = `// 使用方式 — 訂閱與觸發
var order = new Order("ORD-20260321-001");

var emailService = new EmailNotificationService(emailSender, logger1);
var smsService = new SmsNotificationService(smsSender, logger2);
var pushService = new PushNotificationService(pushSender);

// 訂閱（加入觀察者）
order.StatusChanged += emailService.OnOrderStatusChanged;
order.StatusChanged += smsService.OnOrderStatusChanged;
order.StatusChanged += pushService.OnOrderStatusChanged;

// 狀態變更 → 自動通知所有觀察者
order.ChangeStatus(OrderStatus.Paid);
// 📧 Email 通知被觸發
// 📱 SMS 不觸發（Paid 不在 SMS 的重要狀態清單中）
// 🔔 Push 通知被觸發

order.ChangeStatus(OrderStatus.Shipped);
// 📧 Email 通知被觸發
// 📱 SMS 通知被觸發（Shipped 是重要狀態）
// 🔔 Push 通知被觸發

// 取消訂閱（移除觀察者）
order.StatusChanged -= smsService.OnOrderStatusChanged;`

const iobservableCode = `// 方法 2：使用 IObservable<T> / IObserver<T> — .NET 內建介面
// 適合需要串流式處理的場景（搭配 System.Reactive / Rx.NET）

// Subject — 實作 IObservable<T>
public class OrderStatusSubject : IObservable<OrderStatusChangedEventArgs>, IDisposable
{
    private readonly List<IObserver<OrderStatusChangedEventArgs>> _observers = [];

    public IDisposable Subscribe(IObserver<OrderStatusChangedEventArgs> observer)
    {
        if (!_observers.Contains(observer))
            _observers.Add(observer);

        return new Unsubscriber(_observers, observer);
    }

    public void NotifyStatusChanged(OrderStatusChangedEventArgs args)
    {
        foreach (var observer in _observers.ToList()) // ToList 避免遍歷時修改集合
        {
            try
            {
                observer.OnNext(args);
            }
            catch (Exception ex)
            {
                observer.OnError(ex);
            }
        }
    }

    public void Complete()
    {
        foreach (var observer in _observers.ToList())
            observer.OnCompleted();

        _observers.Clear();
    }

    public void Dispose() => Complete();

    // 內部類別 — 處理取消訂閱
    private sealed class Unsubscriber(
        List<IObserver<OrderStatusChangedEventArgs>> observers,
        IObserver<OrderStatusChangedEventArgs> observer) : IDisposable
    {
        public void Dispose() => observers.Remove(observer);
    }
}

// Observer — 實作 IObserver<T>
public class EmailObserver : IObserver<OrderStatusChangedEventArgs>
{
    private readonly IEmailSender _emailSender;

    public EmailObserver(IEmailSender emailSender) => _emailSender = emailSender;

    public void OnNext(OrderStatusChangedEventArgs value)
    {
        Console.WriteLine($"📧 Email：訂單 {value.OrderId} 狀態 → {value.NewStatus}");
        // 發送 Email...
    }

    public void OnError(Exception error)
        => Console.WriteLine($"❌ Email 觀察者發生錯誤：{error.Message}");

    public void OnCompleted()
        => Console.WriteLine("📧 Email 觀察者：訂單狀態串流結束");
}`

const iobservableUsageCode = `// IObservable 使用方式
var subject = new OrderStatusSubject();

var emailObserver = new EmailObserver(emailSender);
var smsObserver = new SmsObserver(smsSender);

// 訂閱 — Subscribe 回傳 IDisposable，可用 using 自動取消訂閱
using var emailSub = subject.Subscribe(emailObserver);
using var smsSub = subject.Subscribe(smsObserver);

// 發出通知
subject.NotifyStatusChanged(new OrderStatusChangedEventArgs
{
    OrderId = "ORD-001",
    OldStatus = OrderStatus.Created,
    NewStatus = OrderStatus.Paid,
    ChangedAt = DateTime.UtcNow
});

// 結束串流
subject.Complete();`

const mediatrCode = `// 方法 3：使用 MediatR — 現代 ASP.NET Core 最推薦的方式
// MediatR 的 INotification 就是觀察者模式的實現

// 安裝套件
// dotnet add package MediatR

// Step 1：定義通知（Event）
public record OrderStatusChangedNotification(
    string OrderId,
    OrderStatus OldStatus,
    OrderStatus NewStatus,
    string? Reason,
    DateTime ChangedAt
) : INotification;

// Step 2：定義處理器（Observer）— 每個處理器獨立處理

// Email 處理器
public class SendEmailOnOrderStatusChanged
    : INotificationHandler<OrderStatusChangedNotification>
{
    private readonly IEmailSender _emailSender;
    private readonly ILogger<SendEmailOnOrderStatusChanged> _logger;

    public SendEmailOnOrderStatusChanged(
        IEmailSender emailSender,
        ILogger<SendEmailOnOrderStatusChanged> logger)
    {
        _emailSender = emailSender;
        _logger = logger;
    }

    public async Task Handle(
        OrderStatusChangedNotification notification,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation(
            "📧 處理訂單狀態變更 Email：{OrderId} {Old} → {New}",
            notification.OrderId, notification.OldStatus, notification.NewStatus);

        await _emailSender.SendAsync(new EmailMessage
        {
            Subject = $"訂單 {notification.OrderId} 狀態更新",
            Body = $"您的訂單狀態已更新為：{notification.NewStatus}"
        }, cancellationToken);
    }
}

// SMS 處理器
public class SendSmsOnOrderStatusChanged
    : INotificationHandler<OrderStatusChangedNotification>
{
    private readonly ISmsSender _smsSender;

    public SendSmsOnOrderStatusChanged(ISmsSender smsSender)
        => _smsSender = smsSender;

    public async Task Handle(
        OrderStatusChangedNotification notification,
        CancellationToken cancellationToken)
    {
        if (notification.NewStatus is not
            (OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Cancelled))
            return;

        await _smsSender.SendAsync(
            $"訂單 {notification.OrderId} 已{notification.NewStatus}",
            cancellationToken);
    }
}

// 推播處理器
public class SendPushOnOrderStatusChanged
    : INotificationHandler<OrderStatusChangedNotification>
{
    private readonly IPushSender _pushSender;

    public SendPushOnOrderStatusChanged(IPushSender pushSender)
        => _pushSender = pushSender;

    public async Task Handle(
        OrderStatusChangedNotification notification,
        CancellationToken cancellationToken)
    {
        await _pushSender.SendAsync(new PushMessage
        {
            Title = "訂單狀態更新",
            Body = $"訂單 {notification.OrderId}：{notification.NewStatus}"
        }, cancellationToken);
    }
}`

const mediatrDiCode = `// Program.cs — DI 設定
builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssemblyContaining<Program>();

    // 可選：加入行為管線（類似 Middleware）
    cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
});`

const mediatrUsageCode = `// Step 3：在 OrderService 中發布通知（Subject 角色）
public class OrderService
{
    private readonly IOrderRepository _orderRepo;
    private readonly IMediator _mediator;  // MediatR 負責分發通知
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository orderRepo,
        IMediator mediator,
        ILogger<OrderService> logger)
    {
        _orderRepo = orderRepo;
        _mediator = mediator;
        _logger = logger;
    }

    public async Task UpdateStatusAsync(
        string orderId,
        OrderStatus newStatus,
        string? reason = null,
        CancellationToken ct = default)
    {
        var order = await _orderRepo.GetByIdAsync(orderId, ct)
            ?? throw new NotFoundException($"找不到訂單：{orderId}");

        var oldStatus = order.Status;
        order.ChangeStatus(newStatus);
        await _orderRepo.UpdateAsync(order, ct);

        // 發布通知 — MediatR 會自動找到所有 INotificationHandler 並執行
        await _mediator.Publish(new OrderStatusChangedNotification(
            OrderId: orderId,
            OldStatus: oldStatus,
            NewStatus: newStatus,
            Reason: reason,
            ChangedAt: DateTime.UtcNow
        ), ct);

        _logger.LogInformation(
            "訂單 {OrderId} 狀態 {Old} → {New}，已通知所有處理器",
            orderId, oldStatus, newStatus);
    }
}`

const comparisonNote = `三種方式比較：
• event/delegate：最簡單，適合同一個類別內的事件，但不適合跨服務通知
• IObservable/IObserver：適合串流式資料處理，搭配 Rx.NET 威力強大
• MediatR INotification：最適合 ASP.NET Core，支援 DI、非同步、管線行為`
</script>

<template>
  <div class="content-wrapper">
    <h1>Observer 觀察者模式</h1>
    <p class="page-subtitle">定義物件間的一對多依賴關係，當一個物件狀態改變時，所有依賴它的物件都會收到通知</p>

    <h2>模式定義</h2>
    <p>
      <strong>觀察者模式（Observer Pattern）</strong>定義了物件之間的一對多依賴關係，
      當一個物件（Subject / 被觀察者）的狀態改變時，
      所有依賴它的物件（Observer / 觀察者）都會自動收到通知並更新。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔔</div>
        <h4>核心問題</h4>
        <p>當物件 A 的狀態改變時，需要通知多個物件（B、C、D...），但又不想讓 A 直接依賴這些物件。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💡</div>
        <h4>解決方案</h4>
        <p>定義一個訂閱機制，讓觀察者自行訂閱感興趣的事件，Subject 只負責在狀態改變時通知所有已訂閱的觀察者。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📐</div>
        <h4>OO 原則</h4>
        <p>鬆耦合設計——Subject 只知道觀察者實作了某個介面，不需要知道觀察者的具體類別或細節。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>擴展性</h4>
        <p>新增觀察者完全不需要修改 Subject，只需建立新類別並訂閱即可。Subject 和 Observer 可獨立變化。</p>
      </div>
    </div>

    <h2>實戰場景：訂單狀態通知系統</h2>
    <p>
      電商系統中，訂單狀態變更時需要通知多個服務：發送 Email 給客戶、發送 SMS 簡訊、推播通知到 App。
      不同狀態變更可能觸發不同的通知組合，而且未來可能還要加入 Webhook、LINE Notify 等新通知管道。
    </p>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 沒有觀察者模式的寫法（反面教材）</div>
      <p>
        如果在 <code>OrderService.UpdateStatus()</code> 裡直接呼叫
        <code>emailService.Send()</code>、<code>smsService.Send()</code>、
        <code>pushService.Send()</code>，那每次新增通知管道就要修改 OrderService，
        而且 OrderService 會依賴所有通知服務——嚴重違反單一責任原則和開放封閉原則。
      </p>
    </div>

    <p>
      我們將用三種 C# 實作方式展示觀察者模式，從最基本到最現代：
    </p>

    <table>
      <thead>
        <tr>
          <th>方式</th>
          <th>機制</th>
          <th>適用場景</th>
          <th>複雜度</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>C# event / delegate</strong></td>
          <td>語言內建</td>
          <td>同一 Process 內的簡單事件通知</td>
          <td>低</td>
        </tr>
        <tr>
          <td><strong>IObservable / IObserver</strong></td>
          <td>.NET BCL 介面</td>
          <td>串流式資料處理、搭配 Rx.NET</td>
          <td>中</td>
        </tr>
        <tr>
          <td><strong>MediatR INotification</strong></td>
          <td>第三方套件</td>
          <td>ASP.NET Core 應用、DDD 領域事件</td>
          <td>低（DI 自動處理）</td>
        </tr>
      </tbody>
    </table>

    <h2>方式 1：C# event / delegate</h2>
    <p>
      C# 的 <code>event</code> 關鍵字是觀察者模式的語言級支援。
      <code>event</code> 基於 <code>delegate</code>（委派），讓多個方法可以訂閱同一事件。
    </p>

    <h3>定義 Subject（被觀察者）</h3>
    <CodeBlock :code="eventBasicCode" lang="csharp" />

    <h3>定義 Observers（觀察者）</h3>
    <CodeBlock :code="eventObserversCode" lang="csharp" />

    <h3>使用方式</h3>
    <CodeBlock :code="eventUsageCode" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">💡 event / delegate 的限制</div>
      <p>
        <strong>優點：</strong>語法簡潔、零依賴、C# 開發者都熟悉<br>
        <strong>限制：</strong>event handler 中的 <code>async void</code> 無法被 await，錯誤處理困難；
        不支援 DI 容器自動註冊；Subject 與 Observer 必須在同一個 Process 中
      </p>
    </div>

    <h2>方式 2：IObservable&lt;T&gt; / IObserver&lt;T&gt;</h2>
    <p>
      .NET 提供了 <code>System.IObservable&lt;T&gt;</code> 和 <code>System.IObserver&lt;T&gt;</code>
      兩個介面，這是觀察者模式的標準化版本。搭配 <strong>Rx.NET</strong>（System.Reactive）
      可以做到更強大的串流處理，如過濾、節流、合併等。
    </p>

    <CodeBlock :code="iobservableCode" lang="csharp" />

    <h3>使用方式</h3>
    <CodeBlock :code="iobservableUsageCode" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">💡 IObservable 的特色</div>
      <p>
        <strong>優點：</strong>標準介面、<code>Subscribe</code> 回傳 <code>IDisposable</code> 方便管理生命週期、
        搭配 Rx.NET 可做 <code>Throttle</code>、<code>Buffer</code>、<code>Where</code> 等串流操作<br>
        <strong>限制：</strong>手動實作 Subject 較繁瑣，通常需要搭配 Rx.NET 的 <code>Subject&lt;T&gt;</code> 使用
      </p>
    </div>

    <h2>方式 3：MediatR INotification（推薦）</h2>
    <p>
      在現代 ASP.NET Core 應用中，<strong>MediatR</strong> 是最推薦的觀察者模式實作方式。
      它的 <code>INotification</code> + <code>INotificationHandler&lt;T&gt;</code>
      就是觀察者模式的完美體現，而且完全整合 DI 容器。
    </p>

    <CodeBlock :code="mediatrCode" lang="csharp" />

    <h3>DI 設定</h3>
    <CodeBlock :code="mediatrDiCode" lang="csharp" />

    <h3>在 OrderService 中發布通知</h3>
    <CodeBlock :code="mediatrUsageCode" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">✅ MediatR 的優勢</div>
      <p>
        <strong>完全整合 DI：</strong>所有 <code>INotificationHandler&lt;T&gt;</code> 自動被 DI 容器發現並註冊<br>
        <strong>支援非同步：</strong>每個 Handler 都是 <code>async Task</code>，錯誤處理完整<br>
        <strong>鬆耦合：</strong>Publisher 和 Handler 完全解耦，只透過 Notification 型別關聯<br>
        <strong>管線行為：</strong>可加入 Logging、Validation 等橫切關注點<br>
        <strong>易於測試：</strong>每個 Handler 可獨立單元測試
      </p>
    </div>

    <h2>觀察者模式結構對照</h2>
    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>教科書名稱</th>
          <th>C# event</th>
          <th>IObservable</th>
          <th>MediatR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Subject</strong></td>
          <td>被觀察者</td>
          <td>包含 <code>event</code> 的類別</td>
          <td><code>IObservable&lt;T&gt;</code></td>
          <td>呼叫 <code>IMediator.Publish()</code> 的類別</td>
        </tr>
        <tr>
          <td><strong>Observer</strong></td>
          <td>觀察者</td>
          <td>事件處理方法</td>
          <td><code>IObserver&lt;T&gt;</code></td>
          <td><code>INotificationHandler&lt;T&gt;</code></td>
        </tr>
        <tr>
          <td><strong>Event</strong></td>
          <td>通知內容</td>
          <td><code>EventArgs</code></td>
          <td>泛型 <code>T</code></td>
          <td><code>INotification</code></td>
        </tr>
        <tr>
          <td><strong>Subscribe</strong></td>
          <td>訂閱</td>
          <td><code>+=</code> 運算子</td>
          <td><code>Subscribe()</code></td>
          <td>DI 自動註冊</td>
        </tr>
        <tr>
          <td><strong>Unsubscribe</strong></td>
          <td>取消訂閱</td>
          <td><code>-=</code> 運算子</td>
          <td><code>Dispose()</code></td>
          <td>移除 Handler 類別即可</td>
        </tr>
      </tbody>
    </table>

    <h2>三種方式比較</h2>
    <table>
      <thead>
        <tr>
          <th>特性</th>
          <th>C# event</th>
          <th>IObservable</th>
          <th>MediatR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>學習曲線</strong></td>
          <td>低</td>
          <td>中～高</td>
          <td>低</td>
        </tr>
        <tr>
          <td><strong>DI 整合</strong></td>
          <td>需手動</td>
          <td>需手動</td>
          <td>自動</td>
        </tr>
        <tr>
          <td><strong>非同步支援</strong></td>
          <td>有限（async void）</td>
          <td>搭配 Rx.NET</td>
          <td>完整（async Task）</td>
        </tr>
        <tr>
          <td><strong>串流處理</strong></td>
          <td>不支援</td>
          <td>強大（Rx.NET）</td>
          <td>不支援</td>
        </tr>
        <tr>
          <td><strong>外部依賴</strong></td>
          <td>無</td>
          <td>System.Reactive</td>
          <td>MediatR</td>
        </tr>
        <tr>
          <td><strong>跨 Process</strong></td>
          <td>不支援</td>
          <td>不支援</td>
          <td>不支援（需搭配 Message Queue）</td>
        </tr>
        <tr>
          <td><strong>推薦場景</strong></td>
          <td>簡單 UI 事件、遊戲開發</td>
          <td>即時資料串流、IoT</td>
          <td>ASP.NET Core Web 應用</td>
        </tr>
      </tbody>
    </table>

    <h2>何時使用觀察者模式？</h2>
    <div class="info-box info">
      <div class="info-box-title">✅ 適用場景</div>
      <p>
        <strong>事件驅動架構：</strong>狀態改變需要通知多個不相關的服務<br>
        <strong>發布 / 訂閱模型：</strong>不確定有多少觀察者，或觀察者會動態增減<br>
        <strong>解耦通知邏輯：</strong>Subject 不應該知道（也不需要知道）有誰在監聽<br>
        <strong>DDD 領域事件：</strong>Aggregate 狀態改變後發布 Domain Event，觸發 Side Effect
      </p>
    </div>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 注意事項</div>
      <p>
        <strong>記憶體洩漏：</strong>使用 C# event 時，若 Subject 的生命週期比 Observer 長，忘記 <code>-=</code> 會造成 GC 無法回收 Observer<br>
        <strong>執行順序：</strong>多個 Observer 的執行順序通常是不保證的，不要依賴順序<br>
        <strong>錯誤傳播：</strong>一個 Observer 拋出例外可能影響其他 Observer 的執行<br>
        <strong>效能考量：</strong>大量觀察者的同步通知可能造成效能瓶頸，考慮使用非同步或背景佇列
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/strategy', label: 'Strategy 策略模式' }"
      :next="{ path: '/csharp/design-patterns/decorator', label: 'Decorator 裝飾者模式' }"
    />
  </div>
</template>
