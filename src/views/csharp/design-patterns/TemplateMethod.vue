<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const abstractExporterCode = `// 抽象基底類別：定義演算法骨架
public abstract class DataExporter
{
    // ★ Template Method — 定義匯出流程的骨架
    // sealed 防止子類別覆寫整個流程
    public sealed async Task ExportAsync(ExportRequest request, CancellationToken ct = default)
    {
        Validate(request);                          // Step 1: 驗證
        var data = await FetchDataAsync(request, ct); // Step 2: 取得資料

        if (!data.Any())
        {
            OnNoData(request);  // Hook：沒有資料時的處理
            return;
        }

        BeforeTransform(data);                      // Hook：轉換前的前處理
        var output = Transform(data, request);      // Step 3: 轉換格式
        await WriteOutputAsync(output, request, ct);// Step 4: 寫入輸出
        AfterExport(request);                       // Hook：匯出後的後處理
    }

    // ── 必須由子類別實作的抽象步驟 ──
    protected abstract void Validate(ExportRequest request);
    protected abstract Task<IReadOnlyList<DataRow>> FetchDataAsync(
        ExportRequest request, CancellationToken ct);
    protected abstract byte[] Transform(IReadOnlyList<DataRow> data, ExportRequest request);
    protected abstract Task WriteOutputAsync(
        byte[] output, ExportRequest request, CancellationToken ct);

    // ── Hook Methods（鉤子方法）── 子類別可選擇性覆寫 ──
    protected virtual void OnNoData(ExportRequest request) { }
    protected virtual void BeforeTransform(IReadOnlyList<DataRow> data) { }
    protected virtual void AfterExport(ExportRequest request) { }
}`

const csvExporterCode = `public class CsvExporter : DataExporter
{
    protected override void Validate(ExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OutputPath))
            throw new ArgumentException("CSV 匯出需要指定輸出路徑");
    }

    protected override async Task<IReadOnlyList<DataRow>> FetchDataAsync(
        ExportRequest request, CancellationToken ct)
    {
        using var conn = new SqlConnection(request.ConnectionString);
        return (await conn.QueryAsync<DataRow>(request.Query, ct)).ToList();
    }

    protected override byte[] Transform(IReadOnlyList<DataRow> data, ExportRequest request)
    {
        var sb = new StringBuilder();
        sb.AppendLine(string.Join(",", data.First().Columns)); // Header

        foreach (var row in data)
            sb.AppendLine(string.Join(",", row.Values.Select(EscapeCsv)));

        return Encoding.UTF8.GetPreamble().Concat(
            Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
    }

    protected override async Task WriteOutputAsync(
        byte[] output, ExportRequest request, CancellationToken ct)
    {
        await File.WriteAllBytesAsync(request.OutputPath, output, ct);
    }

    // 覆寫 Hook：記錄日誌
    protected override void AfterExport(ExportRequest request)
    {
        Console.WriteLine($"CSV 匯出完成：{request.OutputPath}");
    }

    private static string EscapeCsv(object? value)
    {
        var str = value?.ToString() ?? "";
        return str.Contains(',') ? $"\\"{str}\\"" : str;
    }
}`

const excelExporterCode = `public class ExcelExporter : DataExporter
{
    protected override void Validate(ExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OutputPath))
            throw new ArgumentException("Excel 匯出需要指定輸出路徑");
        if (!request.OutputPath.EndsWith(".xlsx"))
            throw new ArgumentException("Excel 檔案必須使用 .xlsx 副檔名");
    }

    protected override async Task<IReadOnlyList<DataRow>> FetchDataAsync(
        ExportRequest request, CancellationToken ct)
    {
        using var conn = new SqlConnection(request.ConnectionString);
        return (await conn.QueryAsync<DataRow>(request.Query, ct)).ToList();
    }

    protected override byte[] Transform(IReadOnlyList<DataRow> data, ExportRequest request)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add(request.SheetName ?? "Sheet1");

        // 寫入標題列
        var columns = data.First().Columns;
        for (int i = 0; i < columns.Count; i++)
            sheet.Cell(1, i + 1).Value = columns[i];

        // 寫入資料列
        for (int r = 0; r < data.Count; r++)
            for (int c = 0; c < data[r].Values.Count; c++)
                sheet.Cell(r + 2, c + 1).Value = data[r].Values[c]?.ToString() ?? "";

        using var ms = new MemoryStream();
        workbook.SaveAs(ms);
        return ms.ToArray();
    }

    protected override async Task WriteOutputAsync(
        byte[] output, ExportRequest request, CancellationToken ct)
    {
        await File.WriteAllBytesAsync(request.OutputPath, output, ct);
    }

    // 覆寫 Hook：套用格式
    protected override void BeforeTransform(IReadOnlyList<DataRow> data)
    {
        Console.WriteLine($"準備轉換 {data.Count} 筆資料為 Excel 格式...");
    }
}`

const pdfExporterCode = `public class PdfExporter : DataExporter
{
    protected override void Validate(ExportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.OutputPath))
            throw new ArgumentException("PDF 匯出需要指定輸出路徑");
    }

    protected override async Task<IReadOnlyList<DataRow>> FetchDataAsync(
        ExportRequest request, CancellationToken ct)
    {
        using var conn = new SqlConnection(request.ConnectionString);
        return (await conn.QueryAsync<DataRow>(request.Query, ct)).ToList();
    }

    protected override byte[] Transform(IReadOnlyList<DataRow> data, ExportRequest request)
    {
        // 使用 QuestPDF 產生 PDF
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(30);
                page.Header().Text(request.Title ?? "資料匯出報表")
                    .FontSize(18).Bold();

                page.Content().Table(table =>
                {
                    var columns = data.First().Columns;
                    table.ColumnsDefinition(cd =>
                    {
                        foreach (var _ in columns) cd.RelativeColumn();
                    });

                    // Header
                    foreach (var col in columns)
                        table.Cell().Background("#2c3e50").Padding(5)
                             .Text(col).FontColor("#fff").Bold();

                    // Rows
                    foreach (var row in data)
                        foreach (var val in row.Values)
                            table.Cell().Padding(5)
                                 .Text(val?.ToString() ?? "");
                });
            });
        });

        return document.GeneratePdf();
    }

    protected override async Task WriteOutputAsync(
        byte[] output, ExportRequest request, CancellationToken ct)
    {
        await File.WriteAllBytesAsync(request.OutputPath, output, ct);
    }

    // 覆寫 Hook：資料為空時產生空白報表
    protected override void OnNoData(ExportRequest request)
    {
        Console.WriteLine("查無資料，將產生空白 PDF 報表。");
    }
}`

const usageCode = `// 使用方式 — 呼叫者不需要知道具體匯出細節
public class ExportService
{
    private readonly Dictionary<ExportFormat, DataExporter> _exporters;

    public ExportService(
        CsvExporter csv, ExcelExporter excel, PdfExporter pdf)
    {
        _exporters = new()
        {
            [ExportFormat.Csv]   = csv,
            [ExportFormat.Excel] = excel,
            [ExportFormat.Pdf]   = pdf,
        };
    }

    public async Task ExportAsync(ExportRequest request, CancellationToken ct)
    {
        if (!_exporters.TryGetValue(request.Format, out var exporter))
            throw new NotSupportedException($"不支援的格式：{request.Format}");

        // ★ 不管什麼格式，都呼叫同一個 Template Method
        await exporter.ExportAsync(request, ct);
    }
}

// 呼叫端
await exportService.ExportAsync(new ExportRequest
{
    Format = ExportFormat.Excel,
    Query = "SELECT * FROM Orders WHERE Date >= @From",
    OutputPath = "/reports/orders.xlsx",
    SheetName = "訂單報表"
}, ct);`

const aspnetCode = `// ASP.NET Core Controller 就是 Template Method 的應用
// 框架定義了請求處理的骨架：
// Routing → Model Binding → Filters → Action → Result

public class OrdersController : ControllerBase
{
    // 你只需要實作 Action Method（演算法中的「步驟」）
    // 框架負責呼叫你（好萊塢原則）
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _repo.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }
}

// Middleware Pipeline 也是 Template Method
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestTimingMiddleware(RequestDelegate next) => _next = next;

    // 框架定義了：呼叫 Invoke → 你的邏輯 → 呼叫下一個 Middleware
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();

        await _next(context);  // 呼叫下一個 Middleware（骨架中的下一步）

        sw.Stop();
        context.Response.Headers["X-Response-Time"] = $"{sw.ElapsedMilliseconds}ms";
    }
}`

const hookCode = `public abstract class OrderProcessor
{
    public sealed async Task ProcessAsync(Order order, CancellationToken ct)
    {
        ValidateOrder(order);

        // Hook：子類別可以決定是否需要庫存檢查
        if (RequiresInventoryCheck())
            await CheckInventoryAsync(order, ct);

        var total = CalculateTotal(order);

        // Hook：子類別可以加入折扣邏輯
        total = ApplyDiscount(order, total);

        await ChargePaymentAsync(order, total, ct);
        await FulfillOrderAsync(order, ct);

        // Hook：訂單完成後的通知
        await OnOrderCompletedAsync(order, ct);
    }

    // 抽象方法 — 子類別必須實作
    protected abstract void ValidateOrder(Order order);
    protected abstract Task ChargePaymentAsync(Order order, Money total, CancellationToken ct);
    protected abstract Task FulfillOrderAsync(Order order, CancellationToken ct);

    // 具體方法 — 基底類別提供預設實作
    protected Money CalculateTotal(Order order)
        => order.Items.Sum(i => i.Price * i.Quantity);

    protected Task CheckInventoryAsync(Order order, CancellationToken ct)
        => Task.CompletedTask;

    // ★ Hook Methods — 子類別「可以」覆寫，但不強制
    protected virtual bool RequiresInventoryCheck() => true;  // 預設需要檢查
    protected virtual Money ApplyDiscount(Order order, Money total) => total; // 預設無折扣
    protected virtual Task OnOrderCompletedAsync(Order order, CancellationToken ct)
        => Task.CompletedTask;
}

// 子類別覆寫 Hook 來改變行為
public class DigitalOrderProcessor : OrderProcessor
{
    // 數位商品不需要庫存檢查
    protected override bool RequiresInventoryCheck() => false;

    // 數位商品打 9 折
    protected override Money ApplyDiscount(Order order, Money total)
        => total * 0.9m;

    protected override void ValidateOrder(Order order) { /* ... */ }
    protected override Task ChargePaymentAsync(Order o, Money t, CancellationToken ct)
        => _paymentGateway.ChargeAsync(o, t, ct);
    protected override Task FulfillOrderAsync(Order o, CancellationToken ct)
        => _emailService.SendDownloadLinkAsync(o, ct);
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Template Method 範本方法模式</h1>
    <p class="page-subtitle">在一個方法中定義演算法的骨架，將某些步驟延遲到子類別實作</p>

    <div class="info-box tip">
      <div class="info-box-title">OO 設計原則 — 好萊塢原則（Hollywood Principle）</div>
      <p>
        <strong>「別呼叫我們，我們會呼叫你。」</strong><br>
        高階元件（基底類別）控制流程，低階元件（子類別）透過覆寫方法被「呼叫」來參與流程。
        子類別不需要主動呼叫基底類別的方法，基底類別會在適當時機呼叫子類別的實作。
        這避免了高階與低階元件之間的循環依賴。
      </p>
    </div>

    <h2>核心概念</h2>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🦴</div>
        <h4>演算法骨架</h4>
        <p>Template Method 在基底類別中定義演算法的完整流程，確保步驟順序不被改變。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>抽象步驟</h4>
        <p>用 <code>abstract</code> 方法宣告子類別必須實作的步驟，強制提供具體邏輯。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🪝</div>
        <h4>Hook 鉤子方法</h4>
        <p>用 <code>virtual</code> 方法提供可選的擴充點，子類別可以選擇性覆寫。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>sealed 保護骨架</h4>
        <p>Template Method 本身標記為 <code>sealed</code>，防止子類別改變演算法流程。</p>
      </div>
    </div>

    <h2>方法類型比較</h2>
    <table>
      <thead>
        <tr>
          <th>方法類型</th>
          <th>C# 關鍵字</th>
          <th>子類別是否必須覆寫</th>
          <th>用途</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Template Method</strong></td>
          <td><code>sealed</code></td>
          <td>不可覆寫</td>
          <td>定義演算法骨架與步驟順序</td>
        </tr>
        <tr>
          <td><strong>Abstract Method</strong></td>
          <td><code>abstract</code></td>
          <td>必須覆寫</td>
          <td>演算法中不同子類別各自不同的步驟</td>
        </tr>
        <tr>
          <td><strong>Hook Method</strong></td>
          <td><code>virtual</code></td>
          <td>可選覆寫</td>
          <td>提供擴充點，預設行為可被替換</td>
        </tr>
        <tr>
          <td><strong>Concrete Method</strong></td>
          <td>一般方法</td>
          <td>不可覆寫</td>
          <td>基底類別中所有子類別共用的邏輯</td>
        </tr>
      </tbody>
    </table>

    <h2>實戰範例：資料匯出系統</h2>
    <p>
      一個典型的資料匯出系統需要支援多種格式（CSV、Excel、PDF），
      但匯出流程是固定的：<strong>驗證 → 取得資料 → 轉換格式 → 寫入輸出</strong>。
      Template Method 讓我們將共同流程定義在基底類別，各格式只需實作差異化的步驟。
    </p>

    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 480px;">
        <strong>DataExporter（抽象基底類別）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">
          Export()：驗證 → 取得資料 → [Hook] → 轉換 → 輸出 → [Hook]
        </div>
      </div>
      <div class="arch-arrow">⬇️ 繼承</div>
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <div class="arch-layer domain" style="max-width: 150px; font-size: 13px;">CsvExporter</div>
        <div class="arch-layer domain" style="max-width: 150px; font-size: 13px;">ExcelExporter</div>
        <div class="arch-layer domain" style="max-width: 150px; font-size: 13px;">PdfExporter</div>
      </div>
    </div>

    <h3>Step 1 — 抽象基底類別（Template Method）</h3>
    <CodeBlock :code="abstractExporterCode" lang="csharp" />

    <h3>Step 2 — 具體子類別：CsvExporter</h3>
    <CodeBlock :code="csvExporterCode" lang="csharp" />

    <h3>Step 3 — 具體子類別：ExcelExporter</h3>
    <CodeBlock :code="excelExporterCode" lang="csharp" />

    <h3>Step 4 — 具體子類別：PdfExporter</h3>
    <CodeBlock :code="pdfExporterCode" lang="csharp" />

    <h3>Step 5 — 使用方式</h3>
    <CodeBlock :code="usageCode" lang="csharp" />

    <h2>Hook 方法深入探討</h2>
    <p>
      Hook（鉤子）是基底類別中定義的 <code>virtual</code> 方法，通常有空實作或回傳預設值。
      子類別可以選擇性覆寫 Hook 來「掛入」演算法流程，而不需要改變整個演算法結構。
    </p>

    <CodeBlock :code="hookCode" lang="csharp" />

    <div class="info-box warning">
      <div class="info-box-title">Hook vs Abstract 的選擇</div>
      <p>
        <strong>用 abstract：</strong>當這個步驟是演算法中不可或缺的一部分，且每個子類別的實作都不同。<br>
        <strong>用 virtual（Hook）：</strong>當這個步驟是選擇性的，或大多數子類別會使用預設行為，只有少數需要客製化。
      </p>
    </div>

    <h2>ASP.NET Core 中的 Template Method</h2>
    <p>
      ASP.NET Core 框架本身大量使用 Template Method 模式。
      Controller 的請求處理管線、Middleware Pipeline 都是框架定義骨架，開發者只需實作特定步驟。
    </p>

    <CodeBlock :code="aspnetCode" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">框架中的好萊塢原則</div>
      <p>
        在 ASP.NET Core 中，你不需要自己呼叫 <code>ModelBinding</code>、<code>Authorization</code> 或 <code>ResultExecution</code>。
        框架會在正確的時機呼叫你的 Controller Action — 這就是好萊塢原則的實踐。
        同樣地，<code>BackgroundService.ExecuteAsync</code>、<code>IHostedService.StartAsync</code> 也都是 Template Method。
      </p>
    </div>

    <h2>Template Method vs Strategy</h2>
    <table>
      <thead>
        <tr>
          <th>比較項目</th>
          <th>Template Method</th>
          <th>Strategy</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>機制</strong></td>
          <td>繼承（Inheritance）</td>
          <td>組合（Composition）</td>
        </tr>
        <tr>
          <td><strong>控制方向</strong></td>
          <td>基底類別控制流程，子類別實作步驟</td>
          <td>Context 委託整個演算法給 Strategy 物件</td>
        </tr>
        <tr>
          <td><strong>彈性</strong></td>
          <td>流程固定，只能替換步驟</td>
          <td>可以動態替換整個演算法</td>
        </tr>
        <tr>
          <td><strong>適用時機</strong></td>
          <td>演算法骨架固定，只有部分步驟不同</td>
          <td>需要完全替換演算法或需在執行期切換</td>
        </tr>
        <tr>
          <td><strong>程式碼重複</strong></td>
          <td>共用邏輯集中在基底類別，減少重複</td>
          <td>各 Strategy 之間可能有重複程式碼</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">設計建議</div>
      <p>
        如果你的演算法流程是固定的，只有個別步驟需要變化 — 用 <strong>Template Method</strong>。<br>
        如果整個演算法都可能被替換，或需要在執行期動態切換 — 用 <strong>Strategy</strong>。<br>
        在現代 C# 中，Template Method 仍然非常實用，尤其是在框架設計與基礎建設程式碼中。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/facade', label: 'Facade 外觀模式' }"
      :next="{ path: '/csharp/design-patterns/iterator', label: 'Iterator 迭代器模式' }"
    />
  </div>
</template>
