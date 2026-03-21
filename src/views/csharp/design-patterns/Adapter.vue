<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const targetInterface = `// Target：客戶端期望的統一支付介面
public interface IPaymentGateway
{
    Task<PaymentResult> ChargeAsync(PaymentRequest request);
    Task<RefundResult> RefundAsync(string transactionId, decimal amount);
    Task<PaymentStatus> GetStatusAsync(string transactionId);
}

public record PaymentRequest(
    string OrderId,
    decimal Amount,
    string Currency,
    string Description,
    CustomerInfo Customer
);

public record PaymentResult(
    bool Success,
    string TransactionId,
    string Message
);

public record RefundResult(bool Success, string RefundId);

public enum PaymentStatus
{
    Pending, Completed, Failed, Refunded
}`

const ecpayAdaptee = `// Adaptee 1：綠界 ECPay 的原始 API（第三方 SDK，我們無法修改）
public class ECPaySdk
{
    public ECPayTradeResult CreateTrade(
        string merchantTradeNo,
        int totalAmount,          // 注意：用 int，單位是「元」
        string tradeDesc,
        string itemName)
    {
        // 呼叫綠界 API ...
        Console.WriteLine($"[ECPay] 建立交易: {merchantTradeNo}, 金額: {totalAmount}");
        return new ECPayTradeResult
        {
            RtnCode = 1,
            TradeNo = $"EC{DateTime.Now:yyyyMMddHHmmss}",
            RtnMsg = "交易成功"
        };
    }

    public ECPayRefundResult RefundTrade(string tradeNo, int refundAmount)
    {
        Console.WriteLine($"[ECPay] 退款: {tradeNo}, 金額: {refundAmount}");
        return new ECPayRefundResult { Status = "OK", RefundNo = $"ECR{tradeNo}" };
    }

    public ECPayQueryResult QueryTrade(string merchantTradeNo)
    {
        return new ECPayQueryResult { TradeStatus = "1" }; // 1 = 已付款
    }
}

public class ECPayTradeResult
{
    public int RtnCode { get; set; }
    public string TradeNo { get; set; } = "";
    public string RtnMsg { get; set; } = "";
}

public class ECPayRefundResult
{
    public string Status { get; set; } = "";
    public string RefundNo { get; set; } = "";
}

public class ECPayQueryResult
{
    public string TradeStatus { get; set; } = "";
}`

const newebPayAdaptee = `// Adaptee 2：藍新 NewebPay 的原始 API（另一種完全不同的介面）
public class NewebPayApi
{
    public async Task<NewebPayResponse> SendPayment(
        string orderNo,
        long amountInCents,       // 注意：用 long，單位是「分」
        string buyerEmail,
        string productDescription)
    {
        // 呼叫藍新 API ...
        await Task.Delay(100); // 模擬網路延遲
        Console.WriteLine($"[NewebPay] 發送付款: {orderNo}, 金額: {amountInCents} 分");
        return new NewebPayResponse
        {
            StatusCode = "SUCCESS",
            TradeId = $"NP{Guid.NewGuid():N}",
            Msg = "付款成功"
        };
    }

    public async Task<NewebPayResponse> CancelPayment(
        string tradeId, long refundAmountInCents)
    {
        await Task.Delay(50);
        return new NewebPayResponse
        {
            StatusCode = "SUCCESS",
            TradeId = $"NPR{tradeId}",
            Msg = "退款成功"
        };
    }

    public async Task<NewebPayQueryResponse> QueryOrder(string tradeId)
    {
        await Task.Delay(50);
        return new NewebPayQueryResponse { Result = "PAID" };
    }
}

public class NewebPayResponse
{
    public string StatusCode { get; set; } = "";
    public string TradeId { get; set; } = "";
    public string Msg { get; set; } = "";
}

public class NewebPayQueryResponse
{
    public string Result { get; set; } = "";
}`

const ecpayAdapter = `// Adapter 1：將 ECPay SDK 轉接成 IPaymentGateway
public class ECPayAdapter : IPaymentGateway
{
    private readonly ECPaySdk _ecpay;

    public ECPayAdapter(ECPaySdk ecpay)
    {
        _ecpay = ecpay;
    }

    public Task<PaymentResult> ChargeAsync(PaymentRequest request)
    {
        // 轉換介面：decimal → int，組裝 ECPay 需要的參數格式
        var result = _ecpay.CreateTrade(
            merchantTradeNo: request.OrderId,
            totalAmount: (int)request.Amount,        // ECPay 用整數金額
            tradeDesc: request.Description,
            itemName: request.Description
        );

        return Task.FromResult(new PaymentResult(
            Success: result.RtnCode == 1,
            TransactionId: result.TradeNo,
            Message: result.RtnMsg
        ));
    }

    public Task<RefundResult> RefundAsync(string transactionId, decimal amount)
    {
        var result = _ecpay.RefundTrade(transactionId, (int)amount);

        return Task.FromResult(new RefundResult(
            Success: result.Status == "OK",
            RefundId: result.RefundNo
        ));
    }

    public Task<PaymentStatus> GetStatusAsync(string transactionId)
    {
        var result = _ecpay.QueryTrade(transactionId);

        var status = result.TradeStatus switch
        {
            "1" => PaymentStatus.Completed,
            "0" => PaymentStatus.Pending,
            "10200095" => PaymentStatus.Refunded,
            _ => PaymentStatus.Failed
        };

        return Task.FromResult(status);
    }
}`

const newebPayAdapter = `// Adapter 2：將 NewebPay API 轉接成 IPaymentGateway
public class NewebPayAdapter : IPaymentGateway
{
    private readonly NewebPayApi _newebPay;

    public NewebPayAdapter(NewebPayApi newebPay)
    {
        _newebPay = newebPay;
    }

    public async Task<PaymentResult> ChargeAsync(PaymentRequest request)
    {
        // 轉換介面：decimal → long（分），提供不同參數
        var response = await _newebPay.SendPayment(
            orderNo: request.OrderId,
            amountInCents: (long)(request.Amount * 100),  // 轉成「分」
            buyerEmail: request.Customer.Email,
            productDescription: request.Description
        );

        return new PaymentResult(
            Success: response.StatusCode == "SUCCESS",
            TransactionId: response.TradeId,
            Message: response.Msg
        );
    }

    public async Task<RefundResult> RefundAsync(string transactionId, decimal amount)
    {
        var response = await _newebPay.CancelPayment(
            transactionId, (long)(amount * 100)
        );

        return new RefundResult(
            Success: response.StatusCode == "SUCCESS",
            RefundId: response.TradeId
        );
    }

    public async Task<PaymentStatus> GetStatusAsync(string transactionId)
    {
        var response = await _newebPay.QueryOrder(transactionId);

        return response.Result switch
        {
            "PAID" => PaymentStatus.Completed,
            "WAITING" => PaymentStatus.Pending,
            "REFUNDED" => PaymentStatus.Refunded,
            _ => PaymentStatus.Failed
        };
    }
}`

const diRegistration = `// DI 註冊 — 根據設定選擇不同的支付商 Adapter
builder.Services.AddSingleton<ECPaySdk>();
builder.Services.AddSingleton<NewebPayApi>();

// 方式 1：根據設定檔決定使用哪個支付商
var paymentProvider = builder.Configuration["Payment:Provider"];
switch (paymentProvider)
{
    case "ECPay":
        builder.Services.AddScoped<IPaymentGateway, ECPayAdapter>();
        break;
    case "NewebPay":
        builder.Services.AddScoped<IPaymentGateway, NewebPayAdapter>();
        break;
}

// 方式 2：使用 Keyed Services（.NET 8+）同時註冊多個
builder.Services.AddKeyedScoped<IPaymentGateway, ECPayAdapter>("ECPay");
builder.Services.AddKeyedScoped<IPaymentGateway, NewebPayAdapter>("NewebPay");`

const clientUsage = `// 客戶端程式碼 — 完全不知道底層是哪個支付商
public class OrderService
{
    private readonly IPaymentGateway _payment;

    public OrderService(IPaymentGateway payment)
    {
        _payment = payment;  // 注入的可能是 ECPay 或 NewebPay
    }

    public async Task<string> PlaceOrderAsync(Order order)
    {
        var request = new PaymentRequest(
            OrderId: order.Id.ToString(),
            Amount: order.TotalAmount,
            Currency: "TWD",
            Description: $"訂單 {order.Id}",
            Customer: new CustomerInfo(order.CustomerEmail, order.CustomerName)
        );

        var result = await _payment.ChargeAsync(request);

        if (!result.Success)
            throw new PaymentException($"付款失敗: {result.Message}");

        order.SetTransactionId(result.TransactionId);
        return result.TransactionId;
    }
}`

const enumerableAdapter = `// .NET 本身也大量使用 Adapter 模式
// 範例：將舊版非泛型 API 包裝成 IEnumerable<T>

// 假設有一個舊版 COM 元件回傳 IEnumerable（非泛型）
public class LegacyCustomerRepository
{
    public System.Collections.IEnumerable GetAllCustomers()
    {
        // 回傳舊式非泛型集合
        var list = new System.Collections.ArrayList();
        list.Add(new LegacyCustomer { Id = 1, Name = "Alice" });
        list.Add(new LegacyCustomer { Id = 2, Name = "Bob" });
        return list;
    }
}

// Adapter：將非泛型 IEnumerable 轉接成 IEnumerable<Customer>
public class CustomerRepositoryAdapter : ICustomerRepository
{
    private readonly LegacyCustomerRepository _legacy;

    public CustomerRepositoryAdapter(LegacyCustomerRepository legacy)
    {
        _legacy = legacy;
    }

    public IEnumerable<Customer> GetAll()
    {
        // 使用 LINQ 的 Cast<T>() — 這本身就是一個 Adapter！
        return _legacy.GetAllCustomers()
            .Cast<LegacyCustomer>()
            .Select(lc => new Customer(lc.Id, lc.Name));
    }
}

// 其他 .NET 內建 Adapter 範例：
// - StreamReader/StreamWriter：將 Stream 轉接成文字讀寫介面
// - DbDataAdapter：將資料庫連線轉接成 DataSet 操作
// - ReadOnlyCollection<T>：將 IList<T> 轉接成唯讀介面`

const classVsObject = `// 物件轉接器（Object Adapter）— 使用組合，推薦方式
public class ECPayAdapter : IPaymentGateway
{
    private readonly ECPaySdk _ecpay;  // 用組合持有 Adaptee

    public ECPayAdapter(ECPaySdk ecpay)
    {
        _ecpay = ecpay;
    }

    public Task<PaymentResult> ChargeAsync(PaymentRequest request)
    {
        var result = _ecpay.CreateTrade(/* ... */);
        return Task.FromResult(/* 轉換結果 */);
    }
}

// 類別轉接器（Class Adapter）— 使用繼承，C# 因單一繼承限制較少使用
// 注意：C# 不支援多重繼承，所以只能繼承 Adaptee、實作 Target 介面
public class ECPayClassAdapter : ECPaySdk, IPaymentGateway
{
    public Task<PaymentResult> ChargeAsync(PaymentRequest request)
    {
        // 直接呼叫繼承來的方法，不需要額外持有參考
        var result = CreateTrade(/* ... */);
        return Task.FromResult(/* 轉換結果 */);
    }

    // 問題：緊耦合、無法轉接 ECPaySdk 的子類別
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Adapter 轉接器模式</h1>
    <p class="page-subtitle">將一個類別的介面轉換成客戶期望的另一個介面，讓原本不相容的類別可以合作</p>

    <h2>模式概覽</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>問題</h4>
        <p>你想使用某個現有類別，但它的介面與你需要的不相容，而你又無法修改它的原始碼。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>解法</h4>
        <p>建立一個 Adapter 類別，實作目標介面（Target），內部委託給被轉接者（Adaptee）完成實際工作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>核心精神</h4>
        <p>讓客戶端面對統一介面，隔離第三方 API 的差異，降低耦合度。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📐</div>
        <h4>OO 原則</h4>
        <p>使用組合（Composition）優於繼承 — 物件轉接器透過組合包裝 Adaptee，保持彈性。</p>
      </div>
    </div>

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
          <td><strong>Target</strong></td>
          <td>客戶端期望的介面</td>
          <td>IPaymentGateway</td>
        </tr>
        <tr>
          <td><strong>Adaptee</strong></td>
          <td>需要被轉接的現有類別（通常是第三方）</td>
          <td>ECPaySdk、NewebPayApi</td>
        </tr>
        <tr>
          <td><strong>Adapter</strong></td>
          <td>實作 Target 介面，內部委託 Adaptee</td>
          <td>ECPayAdapter、NewebPayAdapter</td>
        </tr>
        <tr>
          <td><strong>Client</strong></td>
          <td>只依賴 Target 介面的使用者</td>
          <td>OrderService</td>
        </tr>
      </tbody>
    </table>

    <h2>實戰範例：第三方支付整合</h2>
    <div class="info-box info">
      <div class="info-box-title">情境說明</div>
      <p>
        台灣電商常需串接多家支付商：綠界 ECPay 使用同步 API、金額單位為「元」（int）；
        藍新 NewebPay 使用非同步 API、金額單位為「分」（long）。兩者介面完全不同，
        但我們的 OrderService 不應關心底層是哪一家。透過 Adapter 模式，
        定義統一的 <code>IPaymentGateway</code>，讓切換支付商只需更換 DI 註冊。
      </p>
    </div>

    <h3>Step 1：定義 Target 介面</h3>
    <CodeBlock :code="targetInterface" lang="csharp" />

    <h3>Step 2：了解 Adaptee — 綠界 ECPay SDK</h3>
    <CodeBlock :code="ecpayAdaptee" lang="csharp" />

    <h3>Step 3：了解 Adaptee — 藍新 NewebPay API</h3>
    <CodeBlock :code="newebPayAdaptee" lang="csharp" />

    <div class="info-box warning">
      <div class="info-box-title">注意介面差異</div>
      <p>
        兩個支付商的 API 差異極大：方法名稱不同（CreateTrade vs SendPayment）、
        金額型別不同（int 元 vs long 分）、同步 vs 非同步、回傳格式完全不同。
        這正是 Adapter 模式要解決的核心問題。
      </p>
    </div>

    <h3>Step 4：建立 ECPay Adapter</h3>
    <CodeBlock :code="ecpayAdapter" lang="csharp" />

    <h3>Step 5：建立 NewebPay Adapter</h3>
    <CodeBlock :code="newebPayAdapter" lang="csharp" />

    <h3>Step 6：DI 註冊與切換</h3>
    <CodeBlock :code="diRegistration" lang="csharp" />

    <h3>Step 7：客戶端使用 — 完全解耦</h3>
    <CodeBlock :code="clientUsage" lang="csharp" />

    <h2>物件轉接器 vs 類別轉接器</h2>
    <CodeBlock :code="classVsObject" lang="csharp" />

    <table>
      <thead>
        <tr>
          <th>比較</th>
          <th>物件轉接器（Object Adapter）</th>
          <th>類別轉接器（Class Adapter）</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>實作方式</strong></td>
          <td>組合（持有 Adaptee 的參考）</td>
          <td>繼承（同時繼承 Adaptee 與實作 Target）</td>
        </tr>
        <tr>
          <td><strong>C# 支援度</strong></td>
          <td>完全支援，推薦方式</td>
          <td>受限（C# 不支援多重繼承）</td>
        </tr>
        <tr>
          <td><strong>彈性</strong></td>
          <td>可轉接 Adaptee 的子類別</td>
          <td>只能轉接特定 Adaptee</td>
        </tr>
        <tr>
          <td><strong>效能</strong></td>
          <td>多一層間接呼叫（可忽略不計）</td>
          <td>直接呼叫，略快</td>
        </tr>
        <tr>
          <td><strong>DI 友善度</strong></td>
          <td>完美搭配依賴注入</td>
          <td>不利於 DI</td>
        </tr>
      </tbody>
    </table>

    <h2>.NET 中常見的 Adapter 範例</h2>
    <CodeBlock :code="enumerableAdapter" lang="csharp" />

    <table>
      <thead>
        <tr>
          <th>.NET 類別</th>
          <th>Target（期望介面）</th>
          <th>Adaptee（被轉接者）</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>StreamReader</strong></td>
          <td>TextReader（文字讀取）</td>
          <td>Stream（位元組串流）</td>
        </tr>
        <tr>
          <td><strong>DbDataAdapter</strong></td>
          <td>DataSet / DataTable</td>
          <td>IDbConnection / IDbCommand</td>
        </tr>
        <tr>
          <td><strong>ReadOnlyCollection&lt;T&gt;</strong></td>
          <td>IReadOnlyList&lt;T&gt;</td>
          <td>IList&lt;T&gt;</td>
        </tr>
        <tr>
          <td><strong>Enumerable.Cast&lt;T&gt;()</strong></td>
          <td>IEnumerable&lt;T&gt;</td>
          <td>IEnumerable（非泛型）</td>
        </tr>
        <tr>
          <td><strong>HttpClientHandler</strong></td>
          <td>HttpMessageHandler</td>
          <td>底層 Socket 連線</td>
        </tr>
      </tbody>
    </table>

    <h2>Adapter vs 相關模式比較</h2>
    <table>
      <thead>
        <tr>
          <th>模式</th>
          <th>意圖</th>
          <th>何時使用</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Adapter</strong></td>
          <td>轉換已存在的介面，使其相容</td>
          <td>整合第三方 / 舊系統，事後補救</td>
        </tr>
        <tr>
          <td><strong>Facade</strong></td>
          <td>簡化複雜子系統的介面</td>
          <td>提供高層級簡化入口</td>
        </tr>
        <tr>
          <td><strong>Decorator</strong></td>
          <td>動態增加職責，不改變介面</td>
          <td>加功能但保持同一介面</td>
        </tr>
        <tr>
          <td><strong>Proxy</strong></td>
          <td>控制物件存取，介面相同</td>
          <td>快取、權限、延遲載入</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">Head First 重點回顧</div>
      <p>
        <strong>Adapter 模式</strong>將一個類別的介面轉換成客戶期望的另一個介面。Adapter 讓原本介面不相容的類別可以合作無間。<br><br>
        要記住兩種形式：<strong>物件轉接器</strong>使用組合，<strong>類別轉接器</strong>使用多重繼承（C# 中受限）。
        在 C# / .NET 世界中，物件轉接器搭配 DI 容器是最佳實踐。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/command', label: 'Command 命令模式' }"
      :next="{ path: '/csharp/design-patterns/facade', label: 'Facade 外觀模式' }"
    />
  </div>
</template>
