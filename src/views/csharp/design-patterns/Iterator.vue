<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const basicIteratorCode = `// IEnumerable<T> 和 IEnumerator<T> 是 C# 內建的 Iterator Pattern 介面
// IEnumerable<T> = 聚合物件（Aggregate），可以產生迭代器
// IEnumerator<T> = 迭代器（Iterator），知道如何逐一走訪元素

public interface IEnumerable<out T>
{
    IEnumerator<T> GetEnumerator();  // 工廠方法：產生迭代器
}

public interface IEnumerator<out T> : IDisposable
{
    T Current { get; }     // 目前元素
    bool MoveNext();       // 移動到下一個元素，回傳是否還有元素
    void Reset();          // 重置到起始位置（很少使用）
}`

const customCollectionCode = `// 自訂集合：部門組織樹
public class Department : IEnumerable<Employee>
{
    private readonly List<Employee> _employees = new();
    private readonly List<Department> _subDepartments = new();

    public string Name { get; }

    public Department(string name) => Name = name;

    public void AddEmployee(Employee employee) => _employees.Add(employee);
    public void AddSubDepartment(Department dept) => _subDepartments.Add(dept);

    // 手動實作 IEnumerator<T> — 深度優先走訪所有員工（含子部門）
    public IEnumerator<Employee> GetEnumerator()
        => new DepartmentEnumerator(this);

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    private class DepartmentEnumerator : IEnumerator<Employee>
    {
        private readonly Department _department;
        private readonly Stack<IEnumerator<Employee>> _stack = new();
        private IEnumerator<Employee>? _currentEnumerator;

        public DepartmentEnumerator(Department department)
        {
            _department = department;
            Reset();
        }

        public Employee Current => _currentEnumerator!.Current;
        object IEnumerator.Current => Current;

        public bool MoveNext()
        {
            while (_stack.Count > 0)
            {
                _currentEnumerator = _stack.Peek();
                if (_currentEnumerator.MoveNext())
                    return true;

                _stack.Pop();
                _currentEnumerator.Dispose();
            }
            return false;
        }

        public void Reset()
        {
            _stack.Clear();
            // 先加入子部門的迭代器（反序，讓第一個子部門在 Stack 頂端）
            for (int i = _department._subDepartments.Count - 1; i >= 0; i--)
                _stack.Push(_department._subDepartments[i].GetEnumerator());
            // 再加入本部門員工
            _stack.Push(_department._employees.GetEnumerator());
        }

        public void Dispose() { }
    }
}`

const yieldReturnCode = `// ★ yield return 語法糖 — 編譯器自動產生 IEnumerator 狀態機
// 上面幾十行的 DepartmentEnumerator 可以簡化為：

public class Department : IEnumerable<Employee>
{
    private readonly List<Employee> _employees = new();
    private readonly List<Department> _subDepartments = new();

    public string Name { get; }

    public IEnumerator<Employee> GetEnumerator()
    {
        // yield return 讓編譯器自動產生狀態機
        foreach (var employee in _employees)
            yield return employee;

        foreach (var dept in _subDepartments)
            foreach (var employee in dept)  // 遞迴走訪子部門
                yield return employee;
    }

    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();
}

// 使用 — foreach 就是 Iterator Pattern 的語法糖
var engineering = new Department("Engineering");
engineering.AddEmployee(new Employee("Alice", "Senior Dev"));
engineering.AddEmployee(new Employee("Bob", "Junior Dev"));

var frontend = new Department("Frontend");
frontend.AddEmployee(new Employee("Charlie", "React Dev"));
engineering.AddSubDepartment(frontend);

// foreach 自動呼叫 GetEnumerator() → MoveNext() → Current
foreach (var emp in engineering)
    Console.WriteLine($"{emp.Name} - {emp.Title}");
// Alice - Senior Dev
// Bob - Junior Dev
// Charlie - React Dev`

const linqIteratorCode = `// LINQ 完全建立在 Iterator Pattern 之上
// 每個 LINQ 方法都回傳 IEnumerable<T>，使用 yield return 實現延遲執行

// Where 的簡化實作（展示原理）
public static IEnumerable<T> MyWhere<T>(
    this IEnumerable<T> source, Func<T, bool> predicate)
{
    foreach (var item in source)
        if (predicate(item))
            yield return item;  // 延遲執行：只有被列舉時才會執行
}

// Select 的簡化實作
public static IEnumerable<TResult> MySelect<T, TResult>(
    this IEnumerable<T> source, Func<T, TResult> selector)
{
    foreach (var item in source)
        yield return selector(item);
}

// ★ LINQ 鏈式呼叫 = 多層 Iterator 包裹
var result = employees
    .Where(e => e.Salary > 50000)    // Iterator 1：過濾
    .OrderBy(e => e.Name)            // Iterator 2：排序
    .Select(e => new { e.Name, e.Department }); // Iterator 3：投影

// 直到 foreach 或 ToList() 才真正開始走訪！
// 這就是「延遲執行」(Deferred Execution)
foreach (var r in result)  // 此時才開始從 Iterator 1 → 2 → 3 逐一取值
    Console.WriteLine(r);`

const pagedResultCode = `// 實戰：分頁查詢的 PagedResult<T>
public class PagedResult<T> : IEnumerable<T>
{
    public IReadOnlyList<T> Items { get; }
    public int TotalCount { get; }
    public int PageNumber { get; }
    public int PageSize { get; }
    public int TotalPages => (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => PageNumber > 1;
    public bool HasNext => PageNumber < TotalPages;

    public PagedResult(IReadOnlyList<T> items, int totalCount, int pageNumber, int pageSize)
    {
        Items = items;
        TotalCount = totalCount;
        PageNumber = pageNumber;
        PageSize = pageSize;
    }

    // 實作 IEnumerable<T> 讓 PagedResult 可以直接用 foreach
    public IEnumerator<T> GetEnumerator() => Items.GetEnumerator();
    IEnumerator IEnumerable.GetEnumerator() => GetEnumerator();

    // 可以直接用 LINQ 操作分頁結果
    // pagedResult.Where(x => x.IsActive).Select(x => x.Name)
}

// Repository 實作
public class OrderRepository : IOrderRepository
{
    private readonly AppDbContext _db;

    public async Task<PagedResult<Order>> GetPagedAsync(
        int pageNumber, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Orders
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt);

        var totalCount = await query.CountAsync(ct);

        var items = await query
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return new PagedResult<Order>(items, totalCount, pageNumber, pageSize);
    }
}`

const asyncEnumerableCode = `// IAsyncEnumerable<T> — 非同步版的 Iterator Pattern（C# 8+）
// 適合串流大量資料，不需要一次載入所有資料到記憶體

public class OrderStreamRepository
{
    private readonly AppDbContext _db;

    // 使用 async yield return 串流資料庫結果
    public async IAsyncEnumerable<Order> StreamAllAsync(
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        // AsAsyncEnumerable() 讓 EF Core 以串流方式逐筆讀取
        await foreach (var order in _db.Orders
            .Include(o => o.Items)
            .OrderBy(o => o.Id)
            .AsAsyncEnumerable()
            .WithCancellation(ct))
        {
            yield return order;
        }
    }

    // 批次串流：每次從 DB 取一批，逐筆 yield
    public async IAsyncEnumerable<Order> StreamInBatchesAsync(
        int batchSize = 100,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        int lastId = 0;

        while (true)
        {
            var batch = await _db.Orders
                .Where(o => o.Id > lastId)
                .OrderBy(o => o.Id)
                .Take(batchSize)
                .ToListAsync(ct);

            if (batch.Count == 0) yield break;  // 沒有更多資料

            foreach (var order in batch)
                yield return order;

            lastId = batch[^1].Id;  // Keyset Pagination
        }
    }
}

// 使用 — await foreach 走訪非同步串流
await foreach (var order in repo.StreamAllAsync(ct))
{
    await ProcessOrderAsync(order, ct);
    // 記憶體中同時只有一筆 Order，適合處理百萬筆資料
}

// 搭配 LINQ（需要 System.Linq.Async 套件）
var bigOrders = repo.StreamAllAsync(ct)
    .Where(o => o.Total > 10000)
    .Take(50);

await foreach (var order in bigOrders)
    Console.WriteLine($"大額訂單：{order.Id} - {order.Total}");`

const aspnetStreamCode = `// ASP.NET Core 支援直接回傳 IAsyncEnumerable<T>
// 框架會自動串流 JSON 回應，不需要一次序列化所有資料

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly OrderStreamRepository _repo;

    // 回傳 IAsyncEnumerable<T> — 框架自動以串流方式回傳 JSON
    [HttpGet("stream")]
    public IAsyncEnumerable<OrderDto> StreamOrders(CancellationToken ct)
    {
        return _repo.StreamAllAsync(ct)
            .Select(o => OrderDto.FromDomain(o));
    }

    // 搭配 Server-Sent Events (SSE) 即時推送
    [HttpGet("live")]
    public async Task LiveOrders(CancellationToken ct)
    {
        Response.Headers["Content-Type"] = "text/event-stream";

        await foreach (var order in _repo.StreamNewOrdersAsync(ct))
        {
            var json = JsonSerializer.Serialize(OrderDto.FromDomain(order));
            await Response.WriteAsync($"data: {json}\\n\\n", ct);
            await Response.Body.FlushAsync(ct);
        }
    }
}`

const channelIteratorCode = `// Channel<T> + IAsyncEnumerable = 生產者/消費者模式
public class OrderProcessingPipeline
{
    public async IAsyncEnumerable<ProcessedOrder> ProcessAsync(
        IAsyncEnumerable<Order> orders,
        [EnumeratorCancellation] CancellationToken ct = default)
    {
        var channel = Channel.CreateBounded<ProcessedOrder>(
            new BoundedChannelOptions(100)
            {
                FullMode = BoundedChannelFullMode.Wait
            });

        // 生產者：平行處理訂單
        _ = Task.Run(async () =>
        {
            await Parallel.ForEachAsync(orders, ct, async (order, token) =>
            {
                var result = await ProcessSingleOrderAsync(order, token);
                await channel.Writer.WriteAsync(result, token);
            });
            channel.Writer.Complete();
        }, ct);

        // 消費者：以 IAsyncEnumerable 串流產出結果
        await foreach (var processed in channel.Reader.ReadAllAsync(ct))
            yield return processed;
    }
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>Iterator 迭代器模式</h1>
    <p class="page-subtitle">提供一種方法循序存取聚合物件中的各個元素，而不暴露其內部表示</p>

    <div class="info-box tip">
      <div class="info-box-title">C# 與 Iterator Pattern</div>
      <p>
        Iterator 是 C# 中最無所不在的設計模式。<code>foreach</code> 迴圈、<code>LINQ</code>、
        <code>yield return</code>、<code>IAsyncEnumerable</code> 全都是 Iterator Pattern 的體現。
        可以說，每一位 C# 開發者每天都在使用這個模式，即使沒有意識到。
      </p>
    </div>

    <h2>核心概念</h2>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>統一走訪介面</h4>
        <p>不管底層是陣列、鏈結串列、樹還是資料庫，都用相同的方式巡覽。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>封裝內部結構</h4>
        <p>呼叫者不需要知道集合的內部實作，只需要透過迭代器逐一取得元素。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⏳</div>
        <h4>延遲執行</h4>
        <p><code>yield return</code> 讓元素在被要求時才產生，節省記憶體與運算資源。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌊</div>
        <h4>非同步串流</h4>
        <p><code>IAsyncEnumerable&lt;T&gt;</code> 將 Iterator 擴展到非同步世界，實現串流處理。</p>
      </div>
    </div>

    <h2>C# 的 Iterator 介面</h2>

    <CodeBlock :code="basicIteratorCode" lang="csharp" />

    <table>
      <thead>
        <tr>
          <th>介面</th>
          <th>角色</th>
          <th>職責</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>IEnumerable&lt;T&gt;</code></td>
          <td>Aggregate（聚合物件）</td>
          <td>提供 <code>GetEnumerator()</code> 工廠方法建立迭代器</td>
        </tr>
        <tr>
          <td><code>IEnumerator&lt;T&gt;</code></td>
          <td>Iterator（迭代器）</td>
          <td>透過 <code>MoveNext()</code> 和 <code>Current</code> 逐一走訪元素</td>
        </tr>
        <tr>
          <td><code>IAsyncEnumerable&lt;T&gt;</code></td>
          <td>Async Aggregate</td>
          <td>非同步版本，搭配 <code>await foreach</code></td>
        </tr>
        <tr>
          <td><code>IAsyncEnumerator&lt;T&gt;</code></td>
          <td>Async Iterator</td>
          <td>透過 <code>MoveNextAsync()</code> 非同步走訪</td>
        </tr>
      </tbody>
    </table>

    <h2>手動實作 IEnumerator</h2>
    <p>
      先看看手動實作迭代器需要多少程式碼 — 這能幫助你理解 <code>yield return</code> 幫你省了多少工作。
    </p>

    <CodeBlock :code="customCollectionCode" lang="csharp" />

    <h2>yield return 語法糖</h2>
    <p>
      C# 的 <code>yield return</code> 是編譯器層級的語法糖，編譯器會自動將含有 <code>yield return</code>
      的方法轉換為一個實作 <code>IEnumerator&lt;T&gt;</code> 的狀態機類別。上面幾十行的手動實作可以簡化為幾行。
    </p>

    <CodeBlock :code="yieldReturnCode" lang="csharp" />

    <div class="info-box info">
      <div class="info-box-title">yield return 的延遲執行原理</div>
      <p>
        含有 <code>yield return</code> 的方法在呼叫時<strong>不會立即執行</strong>。
        它會回傳一個迭代器物件，直到有人呼叫 <code>MoveNext()</code>（通常是 <code>foreach</code>）
        才會開始執行，並在每次 <code>yield return</code> 處暫停，記住目前位置。
        下次 <code>MoveNext()</code> 時從上次暫停處繼續。這就是「延遲執行」（Deferred Execution）。
      </p>
    </div>

    <h2>LINQ 如何建立在 Iterator 之上</h2>
    <p>
      LINQ 的每一個運算子（<code>Where</code>、<code>Select</code>、<code>OrderBy</code> 等）都回傳
      <code>IEnumerable&lt;T&gt;</code>，使用 <code>yield return</code> 實現延遲執行。
      多個 LINQ 運算子串接在一起時，形成多層 Iterator 的管線（Pipeline）。
    </p>

    <CodeBlock :code="linqIteratorCode" lang="csharp" />

    <h2>實戰：分頁查詢 PagedResult&lt;T&gt;</h2>
    <p>
      將分頁結果實作為 <code>IEnumerable&lt;T&gt;</code>，讓它可以直接被 <code>foreach</code>
      走訪，也可以搭配 LINQ 做二次篩選。
    </p>

    <CodeBlock :code="pagedResultCode" lang="csharp" />

    <h2>IAsyncEnumerable — 非同步串流</h2>
    <p>
      C# 8 引入的 <code>IAsyncEnumerable&lt;T&gt;</code> 將 Iterator Pattern 擴展到非同步世界。
      搭配 <code>await foreach</code> 和 <code>yield return</code>，可以串流處理大量資料，
      不需要一次載入所有資料到記憶體。
    </p>

    <CodeBlock :code="asyncEnumerableCode" lang="csharp" />

    <h3>ASP.NET Core 串流回應</h3>
    <CodeBlock :code="aspnetStreamCode" lang="csharp" />

    <h3>Channel + IAsyncEnumerable — 生產者/消費者管線</h3>
    <CodeBlock :code="channelIteratorCode" lang="csharp" />

    <h2>Iterator 在 C# 中的各種面貌</h2>
    <table>
      <thead>
        <tr>
          <th>語法 / API</th>
          <th>底層機制</th>
          <th>使用場景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>foreach</code></td>
          <td>呼叫 <code>GetEnumerator()</code> → <code>MoveNext()</code> + <code>Current</code></td>
          <td>走訪任何集合</td>
        </tr>
        <tr>
          <td><code>yield return</code></td>
          <td>編譯器產生 <code>IEnumerator&lt;T&gt;</code> 狀態機</td>
          <td>自訂集合、延遲產生序列</td>
        </tr>
        <tr>
          <td><code>LINQ</code></td>
          <td>多層 <code>IEnumerable&lt;T&gt;</code> 管線</td>
          <td>資料查詢、轉換、過濾</td>
        </tr>
        <tr>
          <td><code>await foreach</code></td>
          <td>呼叫 <code>GetAsyncEnumerator()</code> → <code>MoveNextAsync()</code></td>
          <td>非同步串流、資料庫串流讀取</td>
        </tr>
        <tr>
          <td><code>System.Linq.Async</code></td>
          <td>LINQ 的非同步版本</td>
          <td>對 <code>IAsyncEnumerable</code> 做 LINQ 操作</td>
        </tr>
        <tr>
          <td><code>Channel&lt;T&gt;.Reader.ReadAllAsync()</code></td>
          <td>回傳 <code>IAsyncEnumerable&lt;T&gt;</code></td>
          <td>生產者/消費者模式</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box warning">
      <div class="info-box-title">注意事項</div>
      <p>
        <strong>多次列舉（Multiple Enumeration）：</strong><code>IEnumerable&lt;T&gt;</code> 每次 <code>foreach</code>
        都會重新執行查詢。如果資料來源是資料庫，會多次查詢。需要重複使用時，先呼叫 <code>.ToList()</code> 快取結果。<br><br>
        <strong>修改集合：</strong>在 <code>foreach</code> 走訪期間修改集合會拋出 <code>InvalidOperationException</code>。
        如需修改，先用 <code>.ToList()</code> 建立副本。<br><br>
        <strong>無限序列：</strong><code>yield return</code> 可以產生無限序列，搭配 <code>.Take(n)</code> 使用時安全，
        但如果對無限序列呼叫 <code>.Count()</code> 或 <code>.ToList()</code> 會導致程式卡住。
      </p>
    </div>

    <div class="info-box tip">
      <div class="info-box-title">設計建議</div>
      <p>
        在 C# 中，你幾乎不需要從零實作 Iterator Pattern — 語言和框架已經幫你做好了。
        你真正需要掌握的是：<br>
        1. 實作 <code>IEnumerable&lt;T&gt;</code> 讓自訂集合支援 <code>foreach</code> 和 LINQ。<br>
        2. 善用 <code>yield return</code> 實現延遲執行，避免一次載入大量資料。<br>
        3. 使用 <code>IAsyncEnumerable&lt;T&gt;</code> 串流處理資料庫結果或 API 回應。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/template-method', label: 'Template Method 範本方法模式' }"
      :next="{ path: '/csharp/design-patterns/composite', label: 'Composite 組合模式' }"
    />
  </div>
</template>
