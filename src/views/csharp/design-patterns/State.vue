<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const stateInterface = `// 狀態介面 — 定義所有狀態都要處理的操作
public interface IOrderState
{
    string Name { get; }
    void Pay(Order order);
    void Ship(Order order);
    void Deliver(Order order);
    void Cancel(Order order);
}`;

const createdState = `// 已建立狀態 — 只能付款或取消
public class CreatedState : IOrderState
{
    public string Name => "Created";

    public void Pay(Order order)
    {
        Console.WriteLine("付款成功！訂單進入已付款狀態。");
        order.SetState(new PaidState());
    }

    public void Ship(Order order)
    {
        Console.WriteLine("❌ 尚未付款，無法出貨。");
    }

    public void Deliver(Order order)
    {
        Console.WriteLine("❌ 尚未付款，無法標記送達。");
    }

    public void Cancel(Order order)
    {
        Console.WriteLine("訂單已取消。");
        order.SetState(new CancelledState());
    }
}`;

const paidState = `// 已付款狀態 — 可以出貨或取消（退款）
public class PaidState : IOrderState
{
    public string Name => "Paid";

    public void Pay(Order order)
    {
        Console.WriteLine("❌ 訂單已付款，請勿重複付款。");
    }

    public void Ship(Order order)
    {
        Console.WriteLine("開始出貨！訂單進入運送中狀態。");
        order.SetState(new ShippingState());
    }

    public void Deliver(Order order)
    {
        Console.WriteLine("❌ 尚未出貨，無法標記送達。");
    }

    public void Cancel(Order order)
    {
        Console.WriteLine("訂單已取消，款項將退回。");
        order.SetState(new CancelledState());
    }
}`;

const shippingState = `// 運送中狀態 — 只能送達，不可取消
public class ShippingState : IOrderState
{
    public string Name => "Shipping";

    public void Pay(Order order)
    {
        Console.WriteLine("❌ 訂單已在運送中。");
    }

    public void Ship(Order order)
    {
        Console.WriteLine("❌ 訂單已在運送中，請勿重複操作。");
    }

    public void Deliver(Order order)
    {
        Console.WriteLine("商品已送達！訂單完成。");
        order.SetState(new DeliveredState());
    }

    public void Cancel(Order order)
    {
        Console.WriteLine("❌ 運送中的訂單無法取消，請申請退貨。");
    }
}`;

const terminalStates = `// 終態 — 已送達和已取消，所有操作都無效
public class DeliveredState : IOrderState
{
    public string Name => "Delivered";

    public void Pay(Order order)
        => Console.WriteLine("❌ 訂單已完成。");
    public void Ship(Order order)
        => Console.WriteLine("❌ 訂單已完成。");
    public void Deliver(Order order)
        => Console.WriteLine("❌ 訂單已完成。");
    public void Cancel(Order order)
        => Console.WriteLine("❌ 已送達的訂單無法取消，請申請退貨。");
}

public class CancelledState : IOrderState
{
    public string Name => "Cancelled";

    public void Pay(Order order)
        => Console.WriteLine("❌ 訂單已取消。");
    public void Ship(Order order)
        => Console.WriteLine("❌ 訂單已取消。");
    public void Deliver(Order order)
        => Console.WriteLine("❌ 訂單已取消。");
    public void Cancel(Order order)
        => Console.WriteLine("❌ 訂單已經是取消狀態。");
}`;

const orderContext = `// Context — 訂單本身，持有當前狀態並委派操作
public class Order
{
    private IOrderState _state;

    public string OrderId { get; }
    public string CurrentState => _state.Name;

    public Order(string orderId)
    {
        OrderId = orderId;
        _state = new CreatedState(); // 初始狀態
    }

    // 狀態轉換由具體 State 呼叫
    internal void SetState(IOrderState newState)
    {
        Console.WriteLine($"  [狀態轉換] {_state.Name} → {newState.Name}");
        _state = newState;
    }

    // 所有操作都委派給當前狀態
    public void Pay() => _state.Pay(this);
    public void Ship() => _state.Ship(this);
    public void Deliver() => _state.Deliver(this);
    public void Cancel() => _state.Cancel(this);
}`;

const usageExample = `// 使用範例
var order = new Order("ORD-2024-001");

Console.WriteLine($"當前狀態: {order.CurrentState}"); // Created

order.Ship();    // ❌ 尚未付款，無法出貨
order.Pay();     // 付款成功！ [Created → Paid]
order.Pay();     // ❌ 訂單已付款，請勿重複付款
order.Ship();    // 開始出貨！ [Paid → Shipping]
order.Cancel();  // ❌ 運送中的訂單無法取消
order.Deliver(); // 商品已送達！ [Shipping → Delivered]
order.Cancel();  // ❌ 已送達的訂單無法取消

Console.WriteLine($"最終狀態: {order.CurrentState}"); // Delivered`;

const badIfSwitch = `// ❌ 不用 State 模式 — 大量 if/switch，難以維護
public class OrderWithoutPattern
{
    public string State { get; private set; } = "Created";

    public void Pay()
    {
        switch (State)
        {
            case "Created":
                State = "Paid";
                break;
            case "Paid":
                Console.WriteLine("已付款");
                break;
            case "Shipping":
                Console.WriteLine("運送中不能付款");
                break;
            // ... 每個操作都要對每個狀態做 switch
            // 新增一個狀態 → 修改所有方法
            // 新增一個操作 → 修改所有 case
            // 🔥 違反 OCP（開閉原則）
        }
    }

    public void Ship()
    {
        switch (State) { /* 又一大堆 case... */ }
    }

    // Ship、Deliver、Cancel 都是類似的 switch...
}`;

const strategyComparison = `// State vs. Strategy — 結構相同，意圖不同

// ✅ State 模式 — 狀態會自動轉換，行為隨狀態改變
public class Order
{
    private IOrderState _state; // 狀態會在內部自動切換

    public void Pay()
    {
        _state.Pay(this); // 狀態自己決定下一個狀態
    }
}

// ✅ Strategy 模式 — 策略由外部注入，不會自動切換
public class ShippingCalculator
{
    private IShippingStrategy _strategy; // 由呼叫端決定使用哪個策略

    public void SetStrategy(IShippingStrategy strategy)
    {
        _strategy = strategy; // 外部控制切換
    }

    public decimal Calculate(Package package)
    {
        return _strategy.Calculate(package); // 策略不會自己換
    }
}`;

const withEvents = `// 進階：搭配事件和歷史紀錄
public class Order
{
    private IOrderState _state;
    private readonly List<StateTransition> _history = new();

    public IReadOnlyList<StateTransition> History => _history.AsReadOnly();

    internal void SetState(IOrderState newState)
    {
        _history.Add(new StateTransition(
            From: _state.Name,
            To: newState.Name,
            At: DateTime.UtcNow
        ));
        _state = newState;
    }
}

public record StateTransition(
    string From,
    string To,
    DateTime At
);

// 使用
var order = new Order("ORD-001");
order.Pay();
order.Ship();
order.Deliver();

foreach (var t in order.History)
{
    Console.WriteLine($"{t.At:HH:mm:ss} | {t.From} → {t.To}");
}
// 10:00:01 | Created → Paid
// 10:00:02 | Paid → Shipping
// 10:00:03 | Shipping → Delivered`;
</script>

<template>
  <div class="content-wrapper">
    <h1>State 狀態模式</h1>
    <p class="page-subtitle">允許物件在內部狀態改變時改變它的行為，物件看起來好像修改了它的類別</p>

    <h2>核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔀</div>
        <h4>狀態驅動行為</h4>
        <p>同一個操作（如 Pay、Ship）在不同狀態下有不同結果，由當前狀態物件決定行為。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🎭</div>
        <h4>消除 if/switch</h4>
        <p>每個狀態封裝為獨立類別，新增狀態不需修改現有程式碼，符合開閉原則。</p>
      </div>
      <div class="concept-card">
        <div class="icon">➡️</div>
        <h4>狀態自動轉換</h4>
        <p>狀態物件自己決定下一個狀態並通知 Context 進行切換，轉換邏輯清晰明確。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>有限狀態機</h4>
        <p>物件在有限的狀態集合中轉換，每個狀態定義了哪些操作合法、哪些操作被拒絕。</p>
      </div>
    </div>

    <h2>模式結構</h2>
    <div class="info-box info">
      <div class="info-box-title">📐 State 模式的三個角色</div>
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
            <td><strong>State</strong></td>
            <td>定義狀態介面，宣告所有狀態必須處理的操作</td>
            <td><code>IOrderState</code></td>
          </tr>
          <tr>
            <td><strong>ConcreteState</strong></td>
            <td>實作特定狀態的行為，負責狀態轉換邏輯</td>
            <td><code>CreatedState</code>、<code>PaidState</code> 等</td>
          </tr>
          <tr>
            <td><strong>Context</strong></td>
            <td>持有當前狀態的參考，將操作委派給狀態物件</td>
            <td><code>Order</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>狀態轉換圖</h2>
    <div class="arch-diagram">
      <div style="text-align: center; font-size: 14px; color: var(--vt-c-text-2); margin-bottom: 12px;">
        <strong>訂單狀態機 — 狀態轉換流程</strong>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
        <div class="arch-layer presentation" style="max-width: 200px;">Created (已建立)</div>
        <div style="display: flex; gap: 40px; align-items: center;">
          <div style="text-align: center;">
            <div class="arch-arrow">⬇️ Pay()</div>
          </div>
          <div style="text-align: center; color: var(--vt-c-text-2); font-size: 13px;">
            Cancel() ➡️
          </div>
        </div>
        <div style="display: flex; gap: 24px; align-items: flex-start; flex-wrap: wrap; justify-content: center;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <div class="arch-layer domain" style="min-width: 180px;">Paid (已付款)</div>
            <div style="display: flex; gap: 40px; align-items: center;">
              <div class="arch-arrow">⬇️ Ship()</div>
              <div style="color: var(--vt-c-text-2); font-size: 13px;">Cancel() ➡️</div>
            </div>
            <div class="arch-layer application" style="min-width: 180px;">Shipping (運送中)</div>
            <div class="arch-arrow">⬇️ Deliver()</div>
            <div class="arch-layer infrastructure" style="min-width: 180px;">Delivered (已送達)</div>
          </div>
          <div style="display: flex; align-items: center; min-height: 100px;">
            <div class="arch-layer" style="background: #dc3545; color: white; min-width: 140px;">Cancelled (已取消)</div>
          </div>
        </div>
      </div>
    </div>

    <h2>為什麼不用 if/switch？</h2>
    <p>先看看不使用 State 模式時，程式碼會變成什麼樣子：</p>
    <CodeBlock :code="badIfSwitch" lang="csharp" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ if/switch 寫法的問題</div>
      <p>
        當有 <strong>N 個狀態 x M 個操作</strong> 時，你需要寫 N x M 個 case。
        每新增一個狀態，就要修改所有方法的 switch；每新增一個操作，就要在所有 case 裡加邏輯。
        這嚴重違反<strong>開閉原則（OCP）</strong>和<strong>單一職責原則（SRP）</strong>。
      </p>
    </div>

    <h2>實戰範例：訂單狀態機</h2>

    <h3>Step 1 — 定義 State 介面</h3>
    <CodeBlock :code="stateInterface" lang="csharp" />

    <h3>Step 2 — 實作 Created 狀態</h3>
    <CodeBlock :code="createdState" lang="csharp" />

    <h3>Step 3 — 實作 Paid 狀態</h3>
    <CodeBlock :code="paidState" lang="csharp" />

    <h3>Step 4 — 實作 Shipping 狀態</h3>
    <CodeBlock :code="shippingState" lang="csharp" />

    <h3>Step 5 — 實作終態（Delivered / Cancelled）</h3>
    <CodeBlock :code="terminalStates" lang="csharp" />

    <h3>Step 6 — Context（Order 訂單）</h3>
    <CodeBlock :code="orderContext" lang="csharp" />

    <h3>Step 7 — 使用範例</h3>
    <CodeBlock :code="usageExample" lang="csharp" />

    <h2>State vs. Strategy 模式比較</h2>
    <p>State 和 Strategy 的類別圖幾乎一模一樣，但它們的<strong>意圖</strong>和<strong>使用方式</strong>完全不同。</p>

    <table>
      <thead>
        <tr>
          <th>面向</th>
          <th>State 模式</th>
          <th>Strategy 模式</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>意圖</strong></td>
          <td>根據內部狀態改變行為</td>
          <td>在不同演算法之間切換</td>
        </tr>
        <tr>
          <td><strong>誰觸發切換</strong></td>
          <td>State 物件自己決定下一個狀態</td>
          <td>客戶端（外部）決定使用哪個策略</td>
        </tr>
        <tr>
          <td><strong>切換頻率</strong></td>
          <td>隨操作自動切換，頻繁變動</td>
          <td>通常在初始化或設定時決定，不頻繁</td>
        </tr>
        <tr>
          <td><strong>狀態之間是否知道彼此</strong></td>
          <td>是，每個狀態知道可轉換到哪些狀態</td>
          <td>否，策略之間互不相識</td>
        </tr>
        <tr>
          <td><strong>典型應用</strong></td>
          <td>訂單流程、TCP 連線、遊戲角色狀態</td>
          <td>排序演算法、運費計算、折扣策略</td>
        </tr>
      </tbody>
    </table>

    <CodeBlock :code="strategyComparison" lang="csharp" />

    <h2>進階：搭配事件與狀態歷史紀錄</h2>
    <p>在實際專案中，記錄狀態轉換歷史對除錯和稽核非常有用。</p>
    <CodeBlock :code="withEvents" lang="csharp" />

    <h2>適用場景</h2>
    <table>
      <thead>
        <tr>
          <th>場景</th>
          <th>狀態集合</th>
          <th>Context</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>電商訂單</td>
          <td>Created、Paid、Shipping、Delivered、Cancelled</td>
          <td>Order</td>
        </tr>
        <tr>
          <td>TCP 連線</td>
          <td>Closed、Listen、Established、CloseWait</td>
          <td>TcpConnection</td>
        </tr>
        <tr>
          <td>文件審批</td>
          <td>Draft、Submitted、Reviewing、Approved、Rejected</td>
          <td>Document</td>
        </tr>
        <tr>
          <td>遊戲角色</td>
          <td>Idle、Walking、Running、Attacking、Dead</td>
          <td>Character</td>
        </tr>
        <tr>
          <td>自動販賣機</td>
          <td>NoCoin、HasCoin、Dispensing、SoldOut</td>
          <td>VendingMachine</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">📌 何時使用 State 模式</div>
      <p>
        <strong>適合使用</strong>：物件有明確的狀態集合，不同狀態下相同操作有不同行為，且狀態轉換邏輯複雜。<br>
        <strong>不適合使用</strong>：只有 2-3 個狀態且轉換簡單，此時用 enum + switch 反而更直觀。<br><br>
        經驗法則：當你發現某個方法裡的 <code>if/switch</code> 已經超過 4-5 個 case，
        且每個 case 的邏輯超過 3-4 行，就是考慮重構為 State 模式的好時機。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/composite', label: 'Composite 組合模式' }"
      :next="{ path: '/csharp/design-patterns/proxy', label: 'Proxy 代理模式' }"
    />
  </div>
</template>
