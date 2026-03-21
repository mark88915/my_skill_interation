<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const commandInterfaceCode = `// 定義 Command 介面
public interface ICommand
{
    void Execute();
    void Undo();
}

// NoCommand — Null Object Pattern，避免 null 檢查
public class NoCommand : ICommand
{
    public void Execute() { }
    public void Undo() { }
}`

const textEditorCode = `// 接收者（Receiver）— 實際執行操作的物件
public class TextDocument
{
    private readonly StringBuilder _content = new();
    private int _cursorPosition;

    public string Content => _content.ToString();
    public int CursorPosition => _cursorPosition;

    public void InsertText(int position, string text)
    {
        _content.Insert(position, text);
        _cursorPosition = position + text.Length;
    }

    public void DeleteText(int position, int length)
    {
        _content.Remove(position, length);
        _cursorPosition = position;
    }

    public void SetCursorPosition(int position)
    {
        _cursorPosition = Math.Clamp(position, 0, _content.Length);
    }

    public override string ToString() =>
        $"[游標:{_cursorPosition}] {_content}";
}`

const insertCommandCode = `// 具體命令：插入文字
public class InsertTextCommand : ICommand
{
    private readonly TextDocument _document;
    private readonly string _text;
    private readonly int _position;

    public InsertTextCommand(TextDocument document, string text, int position)
    {
        _document = document;
        _text = text;
        _position = position;
    }

    public void Execute()
    {
        _document.InsertText(_position, _text);
    }

    public void Undo()
    {
        // 復原 = 刪除剛剛插入的文字
        _document.DeleteText(_position, _text.Length);
    }
}

// 具體命令：刪除文字
public class DeleteTextCommand : ICommand
{
    private readonly TextDocument _document;
    private readonly int _position;
    private readonly int _length;
    private string _deletedText = string.Empty; // 備份被刪除的文字

    public DeleteTextCommand(TextDocument document, int position, int length)
    {
        _document = document;
        _position = position;
        _length = length;
    }

    public void Execute()
    {
        // 備份即將被刪除的文字（供 Undo 使用）
        _deletedText = _document.Content.Substring(_position, _length);
        _document.DeleteText(_position, _length);
    }

    public void Undo()
    {
        // 復原 = 重新插入被刪除的文字
        _document.InsertText(_position, _deletedText);
    }
}

// 具體命令：批次巨集命令
public class MacroCommand : ICommand
{
    private readonly List<ICommand> _commands;

    public MacroCommand(List<ICommand> commands)
    {
        _commands = commands;
    }

    public void Execute()
    {
        foreach (var cmd in _commands)
            cmd.Execute();
    }

    public void Undo()
    {
        // 反向復原！
        foreach (var cmd in Enumerable.Reverse(_commands))
            cmd.Undo();
    }
}`

const invokerCode = `// 調用者（Invoker）— 管理命令歷史與 Undo/Redo
public class TextEditor
{
    private readonly TextDocument _document = new();
    private readonly Stack<ICommand> _undoStack = new();
    private readonly Stack<ICommand> _redoStack = new();

    public string Content => _document.Content;

    public void ExecuteCommand(ICommand command)
    {
        command.Execute();
        _undoStack.Push(command);

        // 執行新命令後，清空 Redo 堆疊
        _redoStack.Clear();
    }

    public void Undo()
    {
        if (_undoStack.Count == 0)
        {
            Console.WriteLine("沒有可復原的操作");
            return;
        }

        var command = _undoStack.Pop();
        command.Undo();
        _redoStack.Push(command);
    }

    public void Redo()
    {
        if (_redoStack.Count == 0)
        {
            Console.WriteLine("沒有可重做的操作");
            return;
        }

        var command = _redoStack.Pop();
        command.Execute();
        _undoStack.Push(command);
    }

    public bool CanUndo => _undoStack.Count > 0;
    public bool CanRedo => _redoStack.Count > 0;
}`

const usageCode = `// 實際使用
var editor = new TextEditor();

// 輸入 "Hello"
editor.ExecuteCommand(new InsertTextCommand(
    editor.Document, "Hello", 0));
// Content: "Hello"

// 輸入 " World"
editor.ExecuteCommand(new InsertTextCommand(
    editor.Document, " World", 5));
// Content: "Hello World"

// 刪除 "World"（位置 6，長度 5）
editor.ExecuteCommand(new DeleteTextCommand(
    editor.Document, 6, 5));
// Content: "Hello "

// Undo → 恢復 "World"
editor.Undo();
// Content: "Hello World"

// Undo → 恢復刪除 " World"
editor.Undo();
// Content: "Hello"

// Redo → 重新加入 " World"
editor.Redo();
// Content: "Hello World"`

const cqrsConceptCode = `// CQRS — Command Query Responsibility Segregation
// 將「寫入操作」與「讀取操作」分離成不同模型

// Command = 改變系統狀態的操作（寫入）
// Query   = 不改變系統狀態的操作（讀取）

// 這正是 Command Pattern 在現代 .NET 架構中最廣泛的應用！`

const mediatrSetupCode = `// 安裝 MediatR NuGet 套件
// dotnet add package MediatR

// Program.cs 中註冊
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddMediatR(cfg =>
{
    cfg.RegisterServicesFromAssembly(typeof(Program).Assembly);

    // 加入 Pipeline Behaviors（類似中介軟體）
    cfg.AddBehavior<LoggingBehavior>();
    cfg.AddBehavior<ValidationBehavior>();
});`

const mediatrCommandCode = `// ✅ MediatR Command — 建立訂單

// 1. 定義 Command（請求物件）
public record CreateOrderCommand(
    string CustomerId,
    List<OrderItemDto> Items,
    string ShippingAddress
) : IRequest<CreateOrderResult>;

public record CreateOrderResult(
    string OrderId,
    decimal TotalAmount,
    DateTime EstimatedDelivery
);

// 2. 定義 Handler（處理邏輯）
public class CreateOrderHandler
    : IRequestHandler<CreateOrderCommand, CreateOrderResult>
{
    private readonly IOrderRepository _repository;
    private readonly IPaymentService _payment;
    private readonly ILogger<CreateOrderHandler> _logger;

    public CreateOrderHandler(
        IOrderRepository repository,
        IPaymentService payment,
        ILogger<CreateOrderHandler> logger)
    {
        _repository = repository;
        _payment = payment;
        _logger = logger;
    }

    public async Task<CreateOrderResult> Handle(
        CreateOrderCommand request,
        CancellationToken cancellationToken)
    {
        _logger.LogInformation("建立訂單: {CustomerId}", request.CustomerId);

        // 建立領域物件
        var order = Order.Create(
            request.CustomerId,
            request.Items.Select(i => new OrderItem(i.ProductId, i.Quantity)),
            request.ShippingAddress);

        // 處理付款
        await _payment.ProcessAsync(order.TotalAmount, cancellationToken);

        // 儲存
        await _repository.AddAsync(order, cancellationToken);

        return new CreateOrderResult(
            order.Id.ToString(),
            order.TotalAmount,
            DateTime.UtcNow.AddDays(3));
    }
}`

const mediatrQueryCode = `// ✅ MediatR Query — 查詢訂單

// 1. 定義 Query
public record GetOrderByIdQuery(string OrderId)
    : IRequest<OrderDetailDto?>;

// 2. 定義 Handler
public class GetOrderByIdHandler
    : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    // Query Handler 可以直接讀取 Read Model / View
    private readonly IReadOnlyOrderRepository _readRepo;

    public GetOrderByIdHandler(IReadOnlyOrderRepository readRepo)
    {
        _readRepo = readRepo;
    }

    public async Task<OrderDetailDto?> Handle(
        GetOrderByIdQuery request,
        CancellationToken cancellationToken)
    {
        return await _readRepo.GetDetailByIdAsync(
            request.OrderId, cancellationToken);
    }
}`

const mediatrControllerCode = `// 3. 在 Controller / Minimal API 中使用
[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public OrdersController(IMediator mediator)
    {
        _mediator = mediator;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateOrderCommand command)
    {
        var result = await _mediator.Send(command);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.OrderId },
            result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var result = await _mediator.Send(new GetOrderByIdQuery(id));
        return result is null ? NotFound() : Ok(result);
    }
}`

const pipelineBehaviorCode = `// Pipeline Behavior — 橫切關注點（AOP 風格）
// 類似 ASP.NET Core Middleware，但作用在 MediatR 層級

// 驗證 Behavior
public class ValidationBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly IEnumerable<IValidator<TRequest>> _validators;

    public ValidationBehavior(IEnumerable<IValidator<TRequest>> validators)
    {
        _validators = validators;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        // 在 Handler 執行前驗證
        var context = new ValidationContext<TRequest>(request);
        var failures = _validators
            .Select(v => v.Validate(context))
            .SelectMany(r => r.Errors)
            .Where(f => f is not null)
            .ToList();

        if (failures.Any())
            throw new ValidationException(failures);

        // 驗證通過，繼續往下執行
        return await next();
    }
}

// 日誌 Behavior
public class LoggingBehavior<TRequest, TResponse>
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : IRequest<TResponse>
{
    private readonly ILogger<LoggingBehavior<TRequest, TResponse>> _logger;

    public LoggingBehavior(ILogger<LoggingBehavior<TRequest, TResponse>> logger)
    {
        _logger = logger;
    }

    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        var requestName = typeof(TRequest).Name;
        _logger.LogInformation("Handling {RequestName}: {@Request}",
            requestName, request);

        var sw = Stopwatch.StartNew();
        var response = await next();
        sw.Stop();

        _logger.LogInformation("Handled {RequestName} in {ElapsedMs}ms",
            requestName, sw.ElapsedMilliseconds);

        return response;
    }
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Command 命令模式</h1>
    <p class="page-subtitle">將請求封裝成物件，讓你可以用不同的請求、佇列或日誌來參數化其他物件，並支援可復原的操作</p>

    <div class="info-box info">
      <div class="info-box-title">Head First Design Patterns</div>
      <p>
        Command Pattern 將「發出請求的物件」與「執行請求的物件」解耦。
        每個命令都是一個物件，封裝了所有執行操作所需的資訊，包括接收者、方法和參數。
      </p>
    </div>

    <h2>模式概覽</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>Command</h4>
        <p>定義執行操作的介面（Execute / Undo），封裝所有必要資訊。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>Receiver</h4>
        <p>實際執行業務邏輯的物件，知道如何完成工作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📞</div>
        <h4>Invoker</h4>
        <p>持有並觸發命令的物件，不需知道命令的具體實作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">👤</div>
        <h4>Client</h4>
        <p>建立命令物件並設定其接收者，將命令交給 Invoker。</p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>角色</th>
          <th>職責</th>
          <th>文字編輯器範例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>ICommand</strong></td>
          <td>定義 Execute() 和 Undo()</td>
          <td>InsertTextCommand、DeleteTextCommand</td>
        </tr>
        <tr>
          <td><strong>Receiver</strong></td>
          <td>知道如何做具體的事</td>
          <td>TextDocument（操作文字內容）</td>
        </tr>
        <tr>
          <td><strong>Invoker</strong></td>
          <td>管理命令堆疊、觸發執行</td>
          <td>TextEditor（管理 Undo/Redo）</td>
        </tr>
        <tr>
          <td><strong>Client</strong></td>
          <td>組裝命令與接收者</td>
          <td>使用者介面（按鈕、快捷鍵）</td>
        </tr>
      </tbody>
    </table>

    <h2>實戰範例：文字編輯器 Undo/Redo</h2>

    <h3>Step 1：定義 Command 介面</h3>
    <CodeBlock lang="csharp" filename="ICommand.cs" :code="commandInterfaceCode" />

    <h3>Step 2：建立接收者（Receiver）</h3>
    <CodeBlock lang="csharp" filename="TextDocument.cs" :code="textEditorCode" />

    <h3>Step 3：建立具體命令</h3>
    <CodeBlock lang="csharp" filename="Commands — 具體命令實作" :code="insertCommandCode" />

    <div class="info-box tip">
      <div class="info-box-title">Undo 的關鍵</div>
      <p>
        每個 Command 必須保存足夠的狀態來復原操作。<code>DeleteTextCommand</code> 在 Execute 時
        會先備份即將被刪除的文字，這樣 Undo 時才有資料可以恢復。
        <strong>MacroCommand</strong> 則展示了組合模式的應用 — Undo 時必須反向執行！
      </p>
    </div>

    <h3>Step 4：建立調用者（Invoker）</h3>
    <CodeBlock lang="csharp" filename="TextEditor.cs — Undo/Redo 管理" :code="invokerCode" />

    <h3>Step 5：使用範例</h3>
    <CodeBlock lang="csharp" filename="Program.cs — 操作演示" :code="usageCode" />

    <h2>現代 .NET 應用：CQRS + MediatR</h2>

    <div class="info-box warning">
      <div class="info-box-title">Command Pattern 的最大舞台</div>
      <p>
        在現代 .NET 後端開發中，Command Pattern 最常見的應用就是
        <strong>CQRS（Command Query Responsibility Segregation）</strong>。
        搭配 <strong>MediatR</strong> 套件，將每個 API 請求封裝成 Command 或 Query 物件，
        實現清晰的關注點分離。
      </p>
    </div>

    <CodeBlock lang="csharp" filename="CQRS 核心概念" :code="cqrsConceptCode" />

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">✏️</div>
        <h4>Command（命令）</h4>
        <p>改變系統狀態的操作：建立訂單、更新會員資料、刪除商品。命名慣例：動詞 + 名詞 + Command。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔍</div>
        <h4>Query（查詢）</h4>
        <p>不改變狀態的操作：取得訂單明細、搜尋商品。命名慣例：Get/List/Search + 名詞 + Query。</p>
      </div>
    </div>

    <h3>MediatR 設定</h3>
    <CodeBlock lang="csharp" filename="Program.cs — MediatR 註冊" :code="mediatrSetupCode" />

    <h3>Command + Handler</h3>
    <CodeBlock lang="csharp" filename="建立訂單 — Command 與 Handler" :code="mediatrCommandCode" />

    <h3>Query + Handler</h3>
    <CodeBlock lang="csharp" filename="查詢訂單 — Query 與 Handler" :code="mediatrQueryCode" />

    <h3>Controller 使用</h3>
    <CodeBlock lang="csharp" filename="OrdersController.cs" :code="mediatrControllerCode" />

    <h2>Pipeline Behavior — 命令管線</h2>
    <p>
      MediatR 的 <strong>Pipeline Behavior</strong> 是 Command Pattern 的進階應用，
      類似 ASP.NET Core 的 Middleware，可以在命令執行前後插入橫切關注點。
    </p>

    <CodeBlock lang="csharp" filename="Pipeline Behaviors — 驗證與日誌" :code="pipelineBehaviorCode" />

    <div class="info-box tip">
      <div class="info-box-title">Pipeline 執行順序</div>
      <p>
        Pipeline Behavior 像洋蔥一樣層層包裹 Handler：<br><br>
        <strong>Request → Logging → Validation → Handler → Validation → Logging → Response</strong><br><br>
        這讓你可以在不修改 Handler 的情況下，統一加入日誌、驗證、交易管理、快取等橫切功能。
      </p>
    </div>

    <h2>傳統 vs 現代做法對比</h2>
    <table>
      <thead>
        <tr>
          <th>面向</th>
          <th>傳統 Command Pattern</th>
          <th>CQRS + MediatR</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Command 定義</strong></td>
          <td>ICommand 介面 + Execute()/Undo()</td>
          <td>IRequest&lt;T&gt; record class</td>
        </tr>
        <tr>
          <td><strong>執行邏輯位置</strong></td>
          <td>在 Command 自身（或 Receiver）</td>
          <td>在獨立的 Handler 類別中</td>
        </tr>
        <tr>
          <td><strong>Undo 支援</strong></td>
          <td>內建（每個 Command 實作 Undo）</td>
          <td>需自行實作（Event Sourcing 更適合）</td>
        </tr>
        <tr>
          <td><strong>DI 整合</strong></td>
          <td>手動管理依賴</td>
          <td>完整 DI 支援（Handler 建構函式注入）</td>
        </tr>
        <tr>
          <td><strong>橫切關注點</strong></td>
          <td>需裝飾者模式</td>
          <td>Pipeline Behavior 自動套用</td>
        </tr>
        <tr>
          <td><strong>適用場景</strong></td>
          <td>UI Undo/Redo、巨集錄製</td>
          <td>Web API、微服務、領域驅動設計</td>
        </tr>
      </tbody>
    </table>

    <h2>重點整理</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>封裝請求</h4>
        <p>將操作所需的所有資訊（接收者、參數、方法）封裝成物件，實現發送者與執行者的解耦。</p>
      </div>
      <div class="concept-card">
        <div class="icon">↩️</div>
        <h4>Undo/Redo</h4>
        <p>透過命令堆疊追蹤操作歷史，每個命令自行實作復原邏輯。反向執行即可 Undo。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔀</div>
        <h4>CQRS 分離</h4>
        <p>Command 負責寫入、Query 負責讀取，各自獨立的模型讓系統更易維護和擴展。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>MediatR Pipeline</h4>
        <p>Pipeline Behavior 實現橫切關注點（日誌、驗證、交易），不修改 Handler 即可統一套用。</p>
      </div>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/singleton', label: 'Singleton 單例模式' }"
      :next="{ path: '/csharp/design-patterns/adapter', label: 'Adapter 轉接器模式' }"
    />
  </div>
</template>
