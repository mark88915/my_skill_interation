<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const interfaceCode = `// 定義策略介面 — 所有付款方式都必須實作這個介面
public interface IPaymentStrategy
{
    /// <summary>付款方式名稱（用於日誌與顯示）</summary>
    string Name { get; }

    /// <summary>執行付款</summary>
    Task<PaymentResult> PayAsync(PaymentRequest request, CancellationToken ct = default);

    /// <summary>執行退款</summary>
    Task<RefundResult> RefundAsync(string transactionId, decimal amount, CancellationToken ct = default);
}

// 付款請求
public record PaymentRequest(
    string OrderId,
    decimal Amount,
    string Currency = "TWD",
    Dictionary<string, string>? Metadata = null
);

// 付款結果
public record PaymentResult(
    bool Success,
    string TransactionId,
    string? ErrorMessage = null
);

// 退款結果
public record RefundResult(
    bool Success,
    string RefundId,
    string? ErrorMessage = null
);`

const creditCardCode = `// 具體策略 1：信用卡付款
public class CreditCardPayment : IPaymentStrategy
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<CreditCardPayment> _logger;

    public CreditCardPayment(
        IHttpClientFactory httpClientFactory,
        ILogger<CreditCardPayment> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Name => "CreditCard";

    public async Task<PaymentResult> PayAsync(
        PaymentRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "使用信用卡處理訂單 {OrderId}，金額 {Amount} {Currency}",
            request.OrderId, request.Amount, request.Currency);

        var client = _httpClientFactory.CreateClient("PaymentGateway");

        var response = await client.PostAsJsonAsync("/api/credit-card/charge",
            new { request.OrderId, request.Amount, request.Currency }, ct);

        if (!response.IsSuccessStatusCode)
            return new PaymentResult(false, "", "信用卡扣款失敗");

        var result = await response.Content
            .ReadFromJsonAsync<GatewayResponse>(ct);

        return new PaymentResult(true, result!.TransactionId);
    }

    public async Task<RefundResult> RefundAsync(
        string transactionId, decimal amount, CancellationToken ct = default)
    {
        var client = _httpClientFactory.CreateClient("PaymentGateway");
        var response = await client.PostAsJsonAsync("/api/credit-card/refund",
            new { transactionId, amount }, ct);

        var result = await response.Content
            .ReadFromJsonAsync<GatewayResponse>(ct);

        return new RefundResult(response.IsSuccessStatusCode, result!.TransactionId);
    }
}`

const linePayCode = `// 具體策略 2：LINE Pay
public class LinePayPayment : IPaymentStrategy
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly LinePayOptions _options;
    private readonly ILogger<LinePayPayment> _logger;

    public LinePayPayment(
        IHttpClientFactory httpClientFactory,
        IOptions<LinePayOptions> options,
        ILogger<LinePayPayment> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options.Value;
        _logger = logger;
    }

    public string Name => "LinePay";

    public async Task<PaymentResult> PayAsync(
        PaymentRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "使用 LINE Pay 處理訂單 {OrderId}，金額 {Amount}",
            request.OrderId, request.Amount);

        var client = _httpClientFactory.CreateClient("LinePay");

        // LINE Pay 需要先 Reserve，再 Confirm
        var reserveResponse = await client.PostAsJsonAsync(
            "/v3/payments/request",
            new
            {
                amount = request.Amount,
                currency = request.Currency,
                orderId = request.OrderId,
                packages = new[]
                {
                    new { id = request.OrderId, amount = request.Amount, name = "訂單付款" }
                },
                redirectUrls = new
                {
                    confirmUrl = _options.ConfirmUrl,
                    cancelUrl = _options.CancelUrl
                }
            }, ct);

        if (!reserveResponse.IsSuccessStatusCode)
            return new PaymentResult(false, "", "LINE Pay 預約付款失敗");

        var result = await reserveResponse.Content
            .ReadFromJsonAsync<LinePayReserveResponse>(ct);

        return new PaymentResult(true, result!.Info.TransactionId.ToString());
    }

    public async Task<RefundResult> RefundAsync(
        string transactionId, decimal amount, CancellationToken ct = default)
    {
        var client = _httpClientFactory.CreateClient("LinePay");
        var response = await client.PostAsJsonAsync(
            $"/v3/payments/{transactionId}/refund",
            new { refundAmount = amount }, ct);

        return new RefundResult(response.IsSuccessStatusCode, transactionId);
    }
}`

const applePayCode = `// 具體策略 3：Apple Pay
public class ApplePayPayment : IPaymentStrategy
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<ApplePayPayment> _logger;

    public ApplePayPayment(
        IHttpClientFactory httpClientFactory,
        ILogger<ApplePayPayment> logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public string Name => "ApplePay";

    public async Task<PaymentResult> PayAsync(
        PaymentRequest request, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "使用 Apple Pay 處理訂單 {OrderId}，金額 {Amount}",
            request.OrderId, request.Amount);

        // Apple Pay 使用 token-based 付款
        var paymentToken = request.Metadata?["applePayToken"]
            ?? throw new ArgumentException("缺少 Apple Pay Token");

        var client = _httpClientFactory.CreateClient("PaymentGateway");
        var response = await client.PostAsJsonAsync("/api/apple-pay/process",
            new { token = paymentToken, request.Amount, request.Currency }, ct);

        if (!response.IsSuccessStatusCode)
            return new PaymentResult(false, "", "Apple Pay 付款失敗");

        var result = await response.Content
            .ReadFromJsonAsync<GatewayResponse>(ct);

        return new PaymentResult(true, result!.TransactionId);
    }

    public async Task<RefundResult> RefundAsync(
        string transactionId, decimal amount, CancellationToken ct = default)
    {
        var client = _httpClientFactory.CreateClient("PaymentGateway");
        var response = await client.PostAsJsonAsync("/api/apple-pay/refund",
            new { transactionId, amount }, ct);

        var result = await response.Content
            .ReadFromJsonAsync<GatewayResponse>(ct);

        return new RefundResult(response.IsSuccessStatusCode, result!.TransactionId);
    }
}`

const contextCode = `// Context 類別 — 使用策略的 OrderService
public class OrderService
{
    private readonly IEnumerable<IPaymentStrategy> _strategies;
    private readonly IOrderRepository _orderRepo;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IEnumerable<IPaymentStrategy> strategies,
        IOrderRepository orderRepo,
        ILogger<OrderService> logger)
    {
        _strategies = strategies;
        _orderRepo = orderRepo;
        _logger = logger;
    }

    public async Task<PaymentResult> ProcessPaymentAsync(
        string orderId,
        string paymentMethod,
        Dictionary<string, string>? metadata = null,
        CancellationToken ct = default)
    {
        // 根據付款方式名稱，找到對應的策略
        var strategy = _strategies
            .FirstOrDefault(s => s.Name.Equals(paymentMethod, StringComparison.OrdinalIgnoreCase))
            ?? throw new NotSupportedException($"不支援的付款方式：{paymentMethod}");

        var order = await _orderRepo.GetByIdAsync(orderId, ct)
            ?? throw new NotFoundException($"找不到訂單：{orderId}");

        _logger.LogInformation(
            "訂單 {OrderId} 使用 {PaymentMethod} 付款，金額 {Amount}",
            orderId, strategy.Name, order.TotalAmount);

        var request = new PaymentRequest(orderId, order.TotalAmount, "TWD", metadata);
        var result = await strategy.PayAsync(request, ct);

        if (result.Success)
        {
            order.MarkAsPaid(result.TransactionId, strategy.Name);
            await _orderRepo.UpdateAsync(order, ct);
        }

        return result;
    }
}`

const diCode = `// Program.cs — ASP.NET Core DI 註冊
builder.Services.AddHttpClient("PaymentGateway", client =>
{
    client.BaseAddress = new Uri("https://api.payment-gateway.com");
    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("LinePay", client =>
{
    client.BaseAddress = new Uri("https://api-pay.line.me");
    client.Timeout = TimeSpan.FromSeconds(30);
});

// 註冊所有付款策略
builder.Services.AddScoped<IPaymentStrategy, CreditCardPayment>();
builder.Services.AddScoped<IPaymentStrategy, LinePayPayment>();
builder.Services.AddScoped<IPaymentStrategy, ApplePayPayment>();

// 註冊 Context
builder.Services.AddScoped<OrderService>();

// 設定 LINE Pay
builder.Services.Configure<LinePayOptions>(
    builder.Configuration.GetSection("LinePay"));`

const controllerCode = `// PaymentController.cs — API 端點
[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    private readonly OrderService _orderService;

    public PaymentController(OrderService orderService)
        => _orderService = orderService;

    [HttpPost("{orderId}/pay")]
    public async Task<IActionResult> Pay(
        string orderId,
        [FromBody] PayRequest request,
        CancellationToken ct)
    {
        var result = await _orderService.ProcessPaymentAsync(
            orderId, request.PaymentMethod, request.Metadata, ct);

        return result.Success
            ? Ok(result)
            : BadRequest(result);
    }
}

public record PayRequest(
    string PaymentMethod,                   // "CreditCard", "LinePay", "ApplePay"
    Dictionary<string, string>? Metadata    // 額外參數（如 Apple Pay Token）
);`

const factoryCode = `// 進階：使用 Factory 模式搭配策略模式
// 當策略的建立邏輯更複雜時，可以搭配工廠模式
public interface IPaymentStrategyFactory
{
    IPaymentStrategy Create(string paymentMethod);
}

public class PaymentStrategyFactory : IPaymentStrategyFactory
{
    private readonly IServiceProvider _serviceProvider;
    private readonly Dictionary<string, Type> _strategyMap = new(StringComparer.OrdinalIgnoreCase)
    {
        ["CreditCard"] = typeof(CreditCardPayment),
        ["LinePay"] = typeof(LinePayPayment),
        ["ApplePay"] = typeof(ApplePayPayment),
    };

    public PaymentStrategyFactory(IServiceProvider serviceProvider)
        => _serviceProvider = serviceProvider;

    public IPaymentStrategy Create(string paymentMethod)
    {
        if (!_strategyMap.TryGetValue(paymentMethod, out var strategyType))
            throw new NotSupportedException($"不支援的付款方式：{paymentMethod}");

        return (IPaymentStrategy)_serviceProvider.GetRequiredService(strategyType);
    }
}

// DI 註冊改為
builder.Services.AddScoped<CreditCardPayment>();
builder.Services.AddScoped<LinePayPayment>();
builder.Services.AddScoped<ApplePayPayment>();
builder.Services.AddScoped<IPaymentStrategyFactory, PaymentStrategyFactory>();`
</script>

<template>
  <div class="content-wrapper">
    <h1>Strategy 策略模式</h1>
    <p class="page-subtitle">定義一系列演算法，將每一個封裝起來，讓它們可以互相替換</p>

    <h2>模式定義</h2>
    <p>
      <strong>策略模式（Strategy Pattern）</strong>定義了一系列的演算法，
      將每一個演算法封裝起來，並且讓它們可以互相替換。
      策略模式讓演算法獨立於使用它的客戶端而變化。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>核心問題</h4>
        <p>當一個操作有多種實作方式，且需要在執行期動態切換時，如何避免大量的 if-else 或 switch-case？</p>
      </div>
      <div class="concept-card">
        <div class="icon">💡</div>
        <h4>解決方案</h4>
        <p>將每種演算法封裝成獨立的類別，透過共同的介面互換使用，讓客戶端程式碼完全不需改動。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📐</div>
        <h4>OO 原則</h4>
        <p>封裝變化的部分——付款邏輯是會變動的，將它獨立出來，不影響訂單處理的主流程。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>擴展性</h4>
        <p>新增付款方式時，只需新增一個類別實作介面即可，完全不需要修改既有程式碼（OCP）。</p>
      </div>
    </div>

    <h2>實戰場景：支付系統</h2>
    <p>
      假設我們有一個電商平台，需要支援多種付款方式：信用卡、LINE Pay、Apple Pay。
      未來可能還會加入街口支付、Google Pay 等。使用策略模式，我們可以輕鬆擴展而不需修改核心邏輯。
    </p>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 沒有策略模式的寫法（反面教材）</div>
      <p>
        如果不用策略模式，你可能會在 <code>OrderService</code> 裡寫出一大堆
        <code>if (method == "CreditCard") ... else if (method == "LinePay") ...</code>，
        每新增一種付款方式就要修改這個類別，違反開放封閉原則，而且程式碼會越來越臃腫。
      </p>
    </div>

    <h3>Step 1：定義策略介面</h3>
    <CodeBlock :code="interfaceCode" lang="csharp" />

    <h3>Step 2：實作具體策略</h3>
    <p>每種付款方式都是一個獨立的策略類別：</p>

    <CodeBlock :code="creditCardCode" lang="csharp" />
    <CodeBlock :code="linePayCode" lang="csharp" />
    <CodeBlock :code="applePayCode" lang="csharp" />

    <h3>Step 3：Context 類別 — 使用策略</h3>
    <p>
      <code>OrderService</code> 是 Context 角色，它持有所有策略的集合，
      根據付款方式名稱動態選擇對應的策略：
    </p>

    <CodeBlock :code="contextCode" lang="csharp" />

    <h3>Step 4：DI 註冊（ASP.NET Core）</h3>
    <p>
      在 ASP.NET Core 中，我們可以利用 DI 容器注入 <code>IEnumerable&lt;IPaymentStrategy&gt;</code>，
      讓所有實作同一介面的類別自動被收集起來：
    </p>

    <CodeBlock :code="diCode" lang="csharp" />

    <h3>Step 5：API 端點</h3>
    <CodeBlock :code="controllerCode" lang="csharp" />

    <h2>進階：搭配 Factory 模式</h2>
    <p>
      當策略的建立邏輯更複雜，或是你不想在 Context 中注入所有策略（效能考量），
      可以搭配工廠模式：
    </p>

    <CodeBlock :code="factoryCode" lang="csharp" />

    <h2>策略模式結構對照</h2>
    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>教科書名稱</th>
          <th>本範例對應</th>
          <th>職責</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Strategy</strong></td>
          <td>策略介面</td>
          <td><code>IPaymentStrategy</code></td>
          <td>定義所有策略共同的介面</td>
        </tr>
        <tr>
          <td><strong>ConcreteStrategy</strong></td>
          <td>具體策略</td>
          <td><code>CreditCardPayment</code>、<code>LinePayPayment</code>、<code>ApplePayPayment</code></td>
          <td>實作特定的演算法</td>
        </tr>
        <tr>
          <td><strong>Context</strong></td>
          <td>環境 / 上下文</td>
          <td><code>OrderService</code></td>
          <td>持有策略參考，委派工作給策略</td>
        </tr>
      </tbody>
    </table>

    <h2>何時使用策略模式？</h2>
    <div class="info-box info">
      <div class="info-box-title">✅ 適用場景</div>
      <p>
        <strong>多種演算法可互換：</strong>付款方式、排序演算法、壓縮策略、驗證規則<br>
        <strong>避免條件判斷：</strong>當你發現自己寫了大量 if-else 來選擇不同行為時<br>
        <strong>執行期動態切換：</strong>用戶在結帳頁面選擇不同付款方式<br>
        <strong>隔離第三方依賴：</strong>每個策略封裝各自的第三方 API 呼叫，測試時容易 Mock
      </p>
    </div>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 不適用場景</div>
      <p>
        <strong>策略數量很少且不太會變動：</strong>只有 2-3 種固定行為，簡單的 if-else 反而更清楚<br>
        <strong>客戶端需要了解所有策略差異：</strong>如果呼叫端必須知道每個策略的細節才能選擇，模式的價值就降低了
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/intro', label: '設計模式概述' }"
      :next="{ path: '/csharp/design-patterns/observer', label: 'Observer 觀察者模式' }"
    />
  </div>
</template>
