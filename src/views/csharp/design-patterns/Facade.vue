<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const subsystemInventory = `// 子系統 1：庫存服務
public class InventoryService
{
    public async Task<bool> CheckStockAsync(string productId, int quantity)
    {
        // 查詢庫存是否足夠
        Console.WriteLine($"[庫存] 檢查商品 {productId} 是否有 {quantity} 件庫存");
        await Task.Delay(50);
        return true; // 模擬有庫存
    }

    public async Task ReserveStockAsync(string productId, int quantity)
    {
        // 預扣庫存（避免超賣）
        Console.WriteLine($"[庫存] 預扣商品 {productId} x {quantity}");
        await Task.Delay(50);
    }

    public async Task ReleaseStockAsync(string productId, int quantity)
    {
        // 釋放預扣的庫存（付款失敗時）
        Console.WriteLine($"[庫存] 釋放商品 {productId} x {quantity}");
        await Task.Delay(30);
    }
}`

const subsystemPayment = `// 子系統 2：支付服務
public class PaymentService
{
    public async Task<PaymentResult> ProcessPaymentAsync(
        string orderId, decimal amount, PaymentMethod method)
    {
        Console.WriteLine($"[支付] 處理訂單 {orderId} 付款 {amount:C}");
        await Task.Delay(200); // 模擬支付 API 呼叫

        return new PaymentResult
        {
            Success = true,
            TransactionId = $"TXN-{Guid.NewGuid():N}",
            PaidAt = DateTime.UtcNow
        };
    }

    public async Task RefundAsync(string transactionId, decimal amount)
    {
        Console.WriteLine($"[支付] 退款交易 {transactionId}，金額 {amount:C}");
        await Task.Delay(150);
    }
}

public class PaymentResult
{
    public bool Success { get; set; }
    public string TransactionId { get; set; } = "";
    public DateTime PaidAt { get; set; }
}`

const subsystemShipping = `// 子系統 3：物流服務
public class ShippingService
{
    public async Task<decimal> CalculateShippingFeeAsync(
        Address from, Address to, decimal totalWeight)
    {
        Console.WriteLine($"[物流] 計算運費: {from.City} → {to.City}");
        await Task.Delay(80);
        return totalWeight > 5 ? 120m : 60m;
    }

    public async Task<ShipmentInfo> CreateShipmentAsync(
        string orderId, Address destination, List<OrderItem> items)
    {
        Console.WriteLine($"[物流] 建立出貨單: 訂單 {orderId}");
        await Task.Delay(100);

        return new ShipmentInfo
        {
            TrackingNumber = $"SHIP-{DateTime.Now:yyyyMMdd}-{orderId}",
            EstimatedDelivery = DateTime.Now.AddDays(3),
            Carrier = "黑貓宅急便"
        };
    }
}

public class ShipmentInfo
{
    public string TrackingNumber { get; set; } = "";
    public DateTime EstimatedDelivery { get; set; }
    public string Carrier { get; set; } = "";
}`

const subsystemNotification = `// 子系統 4：通知服務
public class NotificationService
{
    public async Task SendOrderConfirmationAsync(
        string email, string orderId, string trackingNumber)
    {
        Console.WriteLine($"[通知] 寄送訂單確認信至 {email}");
        await Task.Delay(50);
    }

    public async Task SendPaymentReceiptAsync(
        string email, string transactionId, decimal amount)
    {
        Console.WriteLine($"[通知] 寄送付款收據至 {email}");
        await Task.Delay(50);
    }

    public async Task NotifyWarehouseAsync(string orderId, List<OrderItem> items)
    {
        Console.WriteLine($"[通知] 通知倉庫揀貨: 訂單 {orderId}，{items.Count} 項商品");
        await Task.Delay(30);
    }
}`

const subsystemDiscount = `// 子系統 5：折扣 / 優惠券服務
public class DiscountService
{
    public async Task<DiscountResult> ApplyCouponAsync(
        string couponCode, decimal originalAmount)
    {
        Console.WriteLine($"[折扣] 驗證優惠券: {couponCode}");
        await Task.Delay(40);

        return new DiscountResult
        {
            IsValid = true,
            DiscountAmount = originalAmount * 0.1m, // 假設 9 折
            FinalAmount = originalAmount * 0.9m
        };
    }

    public async Task MarkCouponUsedAsync(string couponCode, string orderId)
    {
        Console.WriteLine($"[折扣] 標記優惠券 {couponCode} 已被訂單 {orderId} 使用");
        await Task.Delay(20);
    }
}

public class DiscountResult
{
    public bool IsValid { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal FinalAmount { get; set; }
}`

const facadeClass = `// Facade：結帳外觀 — 封裝所有子系統的複雜互動
public class CheckoutFacade
{
    private readonly InventoryService _inventory;
    private readonly PaymentService _payment;
    private readonly ShippingService _shipping;
    private readonly NotificationService _notification;
    private readonly DiscountService _discount;

    public CheckoutFacade(
        InventoryService inventory,
        PaymentService payment,
        ShippingService shipping,
        NotificationService notification,
        DiscountService discount)
    {
        _inventory = inventory;
        _payment = payment;
        _shipping = shipping;
        _notification = notification;
        _discount = discount;
    }

    /// <summary>
    /// 一鍵結帳 — 客戶端只需呼叫這個方法
    /// 內部協調 5 個子系統完成整個結帳流程
    /// </summary>
    public async Task<CheckoutResult> PlaceOrderAsync(CheckoutRequest request)
    {
        // 1. 檢查庫存
        foreach (var item in request.Items)
        {
            var inStock = await _inventory.CheckStockAsync(item.ProductId, item.Quantity);
            if (!inStock)
                return CheckoutResult.Fail($"商品 {item.ProductId} 庫存不足");
        }

        // 2. 預扣庫存
        foreach (var item in request.Items)
        {
            await _inventory.ReserveStockAsync(item.ProductId, item.Quantity);
        }

        try
        {
            // 3. 計算折扣
            var totalAmount = request.Items.Sum(i => i.Price * i.Quantity);
            var finalAmount = totalAmount;

            if (!string.IsNullOrEmpty(request.CouponCode))
            {
                var discountResult = await _discount.ApplyCouponAsync(
                    request.CouponCode, totalAmount);

                if (discountResult.IsValid)
                    finalAmount = discountResult.FinalAmount;
            }

            // 4. 計算運費
            var shippingFee = await _shipping.CalculateShippingFeeAsync(
                Address.Warehouse, request.ShippingAddress,
                request.Items.Sum(i => i.Weight * i.Quantity));
            finalAmount += shippingFee;

            // 5. 處理付款
            var paymentResult = await _payment.ProcessPaymentAsync(
                request.OrderId, finalAmount, request.PaymentMethod);

            if (!paymentResult.Success)
            {
                // 付款失敗，釋放庫存
                foreach (var item in request.Items)
                    await _inventory.ReleaseStockAsync(item.ProductId, item.Quantity);

                return CheckoutResult.Fail("付款處理失敗");
            }

            // 6. 標記優惠券已使用
            if (!string.IsNullOrEmpty(request.CouponCode))
                await _discount.MarkCouponUsedAsync(request.CouponCode, request.OrderId);

            // 7. 建立出貨單
            var shipment = await _shipping.CreateShipmentAsync(
                request.OrderId, request.ShippingAddress, request.Items);

            // 8. 發送通知
            await _notification.SendOrderConfirmationAsync(
                request.CustomerEmail, request.OrderId, shipment.TrackingNumber);
            await _notification.SendPaymentReceiptAsync(
                request.CustomerEmail, paymentResult.TransactionId, finalAmount);
            await _notification.NotifyWarehouseAsync(request.OrderId, request.Items);

            return CheckoutResult.Ok(
                request.OrderId, paymentResult.TransactionId,
                shipment.TrackingNumber, finalAmount);
        }
        catch (Exception)
        {
            // 任何步驟失敗，釋放預扣庫存
            foreach (var item in request.Items)
                await _inventory.ReleaseStockAsync(item.ProductId, item.Quantity);
            throw;
        }
    }
}

public record CheckoutRequest(
    string OrderId,
    List<OrderItem> Items,
    Address ShippingAddress,
    PaymentMethod PaymentMethod,
    string CustomerEmail,
    string? CouponCode
);

public class CheckoutResult
{
    public bool Success { get; init; }
    public string? OrderId { get; init; }
    public string? TransactionId { get; init; }
    public string? TrackingNumber { get; init; }
    public decimal TotalAmount { get; init; }
    public string? ErrorMessage { get; init; }

    public static CheckoutResult Ok(
        string orderId, string txnId, string tracking, decimal total)
        => new() { Success = true, OrderId = orderId,
                   TransactionId = txnId, TrackingNumber = tracking,
                   TotalAmount = total };

    public static CheckoutResult Fail(string message)
        => new() { Success = false, ErrorMessage = message };
}`

const clientWithout = `// ❌ 沒有 Facade：客戶端需要了解所有子系統的細節
public class OrderController : ControllerBase
{
    private readonly InventoryService _inventory;
    private readonly PaymentService _payment;
    private readonly ShippingService _shipping;
    private readonly NotificationService _notification;
    private readonly DiscountService _discount;

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(CheckoutDto dto)
    {
        // 客戶端需要自己協調 5 個服務、處理錯誤、管理順序...
        // 每個使用結帳功能的地方都要重複這段邏輯！
        foreach (var item in dto.Items)
        {
            if (!await _inventory.CheckStockAsync(item.ProductId, item.Quantity))
                return BadRequest("庫存不足");
            await _inventory.ReserveStockAsync(item.ProductId, item.Quantity);
        }
        // ... 還有折扣、付款、出貨、通知 ... 幾十行程式碼
        return Ok();
    }
}`

const clientWith = `// ✅ 有 Facade：客戶端只需一行呼叫
public class OrderController : ControllerBase
{
    private readonly CheckoutFacade _checkout;

    public OrderController(CheckoutFacade checkout)
    {
        _checkout = checkout;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(CheckoutDto dto)
    {
        var request = new CheckoutRequest(
            OrderId: Guid.NewGuid().ToString(),
            Items: dto.Items.Select(i => i.ToOrderItem()).ToList(),
            ShippingAddress: dto.ShippingAddress,
            PaymentMethod: dto.PaymentMethod,
            CustomerEmail: dto.Email,
            CouponCode: dto.CouponCode
        );

        var result = await _checkout.PlaceOrderAsync(request);

        if (!result.Success)
            return BadRequest(result.ErrorMessage);

        return Ok(new
        {
            result.OrderId,
            result.TrackingNumber,
            result.TotalAmount
        });
    }
}`

const diSetup = `// DI 註冊
builder.Services.AddScoped<InventoryService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<ShippingService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddScoped<DiscountService>();

// 註冊 Facade — 它依賴的子系統由 DI 容器自動注入
builder.Services.AddScoped<CheckoutFacade>();`

const aspnetFacade = `// ASP.NET Core 本身就大量使用 Facade 模式！

// WebApplication.CreateBuilder() 是一個巨大的 Facade
// 它封裝了：Host、Configuration、Logging、DI、Kestrel、Routing 等子系統
var builder = WebApplication.CreateBuilder(args);

// 你不需要知道底層有多少子系統在運作
// builder.Services → DI 子系統
// builder.Configuration → 設定子系統
// builder.Logging → 日誌子系統
// builder.WebHost → Web 伺服器子系統

var app = builder.Build();

// app.Run() 也是 Facade — 啟動 Kestrel、Middleware Pipeline、Routing...
app.Run();

// 其他 ASP.NET Core 中的 Facade 範例：

// 1. IServiceCollection 的擴充方法就是 Facade
builder.Services.AddAuthentication()     // 封裝 AuthN 子系統的設定
    .AddJwtBearer()                      // 封裝 JWT 驗證的多個元件
    .AddCookie();                        // 封裝 Cookie 驗證的多個元件

// 2. Entity Framework Core 的 DbContext
// DbContext 封裝了 Connection、ChangeTracking、Query、Migration 等子系統
public class AppDbContext : DbContext
{
    // SaveChangesAsync() 是 Facade 方法：
    // 內部協調 ChangeTracker、StateManager、SqlGenerator、Connection
    public DbSet<Order> Orders => Set<Order>();
}

// 3. ILogger<T> 封裝了多個 LogProvider
// 你不需要知道日誌同時寫入 Console、File、Application Insights
logger.LogInformation("訂單建立: {OrderId}", orderId);`

const demeterBad = `// ❌ 違反最少知識原則（火車殘骸 Train Wreck）
public decimal GetShippingFee(Order order)
{
    // 呼叫鏈太長：Order → Customer → Address → City → ShippingZone → Fee
    return order.Customer.Address.City.GetShippingZone().CalculateFee();
}

// 這段程式碼依賴了 Order、Customer、Address、City、ShippingZone 五個類別
// 任何一個改變都可能破壞這段程式碼`

const demeterGood = `// ✅ 遵守最少知識原則
public decimal GetShippingFee(Order order)
{
    // Order 提供一個方法封裝內部細節
    return order.CalculateShippingFee();
}

// Order 類別內部處理細節
public class Order
{
    private readonly Customer _customer;

    public decimal CalculateShippingFee()
    {
        // 只與「直接朋友」互動
        return _customer.GetShippingFee();
    }
}

public class Customer
{
    private readonly Address _address;

    public decimal GetShippingFee()
    {
        return _address.GetShippingFee();
    }
}

// 每個類別只跟自己的「直接朋友」溝通
// 改變不會如骨牌般連鎖影響`
</script>

<template>
  <div class="content-wrapper">
    <h1>Facade 外觀模式</h1>
    <p class="page-subtitle">提供一個統一的介面來存取子系統中的一群介面，定義一個高層級介面讓子系統更容易使用</p>

    <h2>模式概覽</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🏢</div>
        <h4>問題</h4>
        <p>一個子系統由許多類別組成，客戶端需要了解大量細節才能完成一個操作，導致緊耦合。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🚪</div>
        <h4>解法</h4>
        <p>建立一個 Facade 類別，提供簡化的高層方法，內部協調各子系統完成複雜操作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>核心精神</h4>
        <p>簡化介面、降低耦合。客戶端只跟 Facade 溝通，不需認識子系統的每個類別。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📐</div>
        <h4>OO 原則</h4>
        <p>最少知識原則（Law of Demeter）— 只跟你的「直接朋友」溝通，不要跟陌生人說話。</p>
      </div>
    </div>

    <h2>最少知識原則（Law of Demeter）</h2>
    <div class="info-box warning">
      <div class="info-box-title">原則定義</div>
      <p>
        在任何方法中，只應該呼叫以下對象的方法：<br>
        <strong>1.</strong> 物件本身的方法<br>
        <strong>2.</strong> 方法參數傳入的物件<br>
        <strong>3.</strong> 方法內建立的物件<br>
        <strong>4.</strong> 物件的成員變數（直接持有的元件）<br><br>
        不要呼叫「從其他方法回傳的物件」的方法 — 避免「火車殘骸」（Train Wreck）呼叫鏈。
      </p>
    </div>

    <h3>違反 vs 遵守最少知識原則</h3>
    <CodeBlock :code="demeterBad" lang="csharp" />
    <CodeBlock :code="demeterGood" lang="csharp" />

    <table>
      <thead>
        <tr>
          <th>允許呼叫的對象</th>
          <th>範例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>物件自身</strong></td>
          <td><code>this.DoSomething()</code></td>
        </tr>
        <tr>
          <td><strong>方法參數</strong></td>
          <td><code>void Process(IService svc) => svc.Execute()</code></td>
        </tr>
        <tr>
          <td><strong>方法內建立的物件</strong></td>
          <td><code>var helper = new Helper(); helper.Help()</code></td>
        </tr>
        <tr>
          <td><strong>成員變數</strong></td>
          <td><code>_repository.GetAll()</code></td>
        </tr>
        <tr>
          <td><strong>不允許：方法回傳物件的方法</strong></td>
          <td><code>GetService().GetRepo().Find() ❌</code></td>
        </tr>
      </tbody>
    </table>

    <h2>模式角色</h2>
    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>說明</th>
          <th>本例對應</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Facade</strong></td>
          <td>提供簡化介面的高層類別</td>
          <td>CheckoutFacade</td>
        </tr>
        <tr>
          <td><strong>Subsystem Classes</strong></td>
          <td>實際執行工作的子系統類別</td>
          <td>InventoryService、PaymentService 等</td>
        </tr>
        <tr>
          <td><strong>Client</strong></td>
          <td>透過 Facade 使用子系統的呼叫者</td>
          <td>OrderController</td>
        </tr>
      </tbody>
    </table>

    <h2>實戰範例：電商結帳流程</h2>
    <div class="info-box info">
      <div class="info-box-title">情境說明</div>
      <p>
        一個電商系統的結帳流程涉及多個子系統：庫存檢查與預扣、折扣驗證與套用、
        運費計算、支付處理、出貨單建立、顧客通知、倉庫通知。
        如果讓 Controller 直接協調這些服務，程式碼會極度複雜且難以維護。
        透過 <code>CheckoutFacade</code>，將整個流程封裝成一個 <code>PlaceOrderAsync()</code> 方法。
      </p>
    </div>

    <h3>Step 1：子系統 — 庫存服務</h3>
    <CodeBlock :code="subsystemInventory" lang="csharp" />

    <h3>Step 2：子系統 — 支付服務</h3>
    <CodeBlock :code="subsystemPayment" lang="csharp" />

    <h3>Step 3：子系統 — 物流服務</h3>
    <CodeBlock :code="subsystemShipping" lang="csharp" />

    <h3>Step 4：子系統 — 通知服務</h3>
    <CodeBlock :code="subsystemNotification" lang="csharp" />

    <h3>Step 5：子系統 — 折扣服務</h3>
    <CodeBlock :code="subsystemDiscount" lang="csharp" />

    <h3>Step 6：Facade — 結帳外觀</h3>
    <CodeBlock :code="facadeClass" lang="csharp" />

    <div class="info-box tip">
      <div class="info-box-title">Facade 的關鍵特徵</div>
      <p>
        <strong>1.</strong> Facade 並不「封鎖」子系統 — 客戶端仍可直接使用子系統（例如單獨查詢庫存）。<br>
        <strong>2.</strong> Facade 不增加新功能，它只是協調現有子系統的操作順序與錯誤處理。<br>
        <strong>3.</strong> 一個系統可以有多個 Facade — 例如 CheckoutFacade、ReturnFacade、ReportFacade。
      </p>
    </div>

    <h3>Step 7：比較 — 有 Facade vs 沒有 Facade</h3>
    <CodeBlock :code="clientWithout" lang="csharp" />
    <CodeBlock :code="clientWith" lang="csharp" />

    <h3>Step 8：DI 註冊</h3>
    <CodeBlock :code="diSetup" lang="csharp" />

    <h2>ASP.NET Core 中的 Facade</h2>
    <CodeBlock :code="aspnetFacade" lang="csharp" />

    <table>
      <thead>
        <tr>
          <th>ASP.NET Core Facade</th>
          <th>封裝的子系統</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>WebApplication.CreateBuilder()</strong></td>
          <td>Host、Configuration、DI、Logging、Kestrel</td>
        </tr>
        <tr>
          <td><strong>AddAuthentication()</strong></td>
          <td>AuthenticationScheme、Handler、Options、Token 驗證</td>
        </tr>
        <tr>
          <td><strong>DbContext</strong></td>
          <td>Connection、ChangeTracker、SqlGenerator、Migration</td>
        </tr>
        <tr>
          <td><strong>ILogger&lt;T&gt;</strong></td>
          <td>ConsoleLogger、FileLogger、ApplicationInsights 等多個 Provider</td>
        </tr>
        <tr>
          <td><strong>HttpClient</strong></td>
          <td>HttpMessageHandler、DNS 解析、連線池、TLS</td>
        </tr>
      </tbody>
    </table>

    <h2>Facade vs 相關模式比較</h2>
    <table>
      <thead>
        <tr>
          <th>模式</th>
          <th>意圖</th>
          <th>差異</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Facade</strong></td>
          <td>簡化子系統的介面</td>
          <td>提供新的簡化介面，不封鎖原有介面</td>
        </tr>
        <tr>
          <td><strong>Adapter</strong></td>
          <td>轉換不相容的介面</td>
          <td>包裝單一物件使其介面相容</td>
        </tr>
        <tr>
          <td><strong>Mediator</strong></td>
          <td>協調多個物件的互動</td>
          <td>雙向通訊，同事物件也知道 Mediator</td>
        </tr>
        <tr>
          <td><strong>Abstract Factory</strong></td>
          <td>建立相關物件族群</td>
          <td>可搭配 Facade 對外提供簡化建立入口</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">Head First 重點回顧</div>
      <p>
        <strong>Facade 模式</strong>提供一個統一的介面來存取子系統中的一群介面。Facade 定義了一個高層級的介面，讓子系統更容易使用。<br><br>
        <strong>最少知識原則</strong>告訴我們要減少物件之間的互動，只跟少數幾個「朋友」溝通。
        Facade 正是這個原則的完美體現 — 它讓客戶端只需認識一個朋友（Facade），
        而非整個子系統的所有類別。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/adapter', label: 'Adapter 轉接器模式' }"
      :next="{ path: '/csharp/design-patterns/template-method', label: 'Template Method 樣板方法模式' }"
    />
  </div>
</template>
