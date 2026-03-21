<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const componentInterface = `// 組件介面 — 定義葉節點和組合節點的共用操作
public interface IPermissionComponent
{
    string Name { get; }
    bool HasPermission(string permissionName);
    void Display(int depth = 0);
}`;

const leafPermission = `// 葉節點 — 單一權限（不可再包含子項）
public class LeafPermission : IPermissionComponent
{
    public string Name { get; }

    public LeafPermission(string name)
    {
        Name = name;
    }

    public bool HasPermission(string permissionName)
    {
        return Name.Equals(permissionName, StringComparison.OrdinalIgnoreCase);
    }

    public void Display(int depth = 0)
    {
        Console.WriteLine($"{new string(' ', depth * 2)}── {Name}");
    }
}`;

const permissionGroup = `// 組合節點 — 權限群組（可包含子群組和單一權限）
public class PermissionGroup : IPermissionComponent
{
    public string Name { get; }
    private readonly List<IPermissionComponent> _children = new();

    public PermissionGroup(string name)
    {
        Name = name;
    }

    // 管理子項的方法
    public void Add(IPermissionComponent component)
    {
        _children.Add(component);
    }

    public void Remove(IPermissionComponent component)
    {
        _children.Remove(component);
    }

    // 遞迴檢查：只要任一子項擁有該權限就回傳 true
    public bool HasPermission(string permissionName)
    {
        return _children.Any(child => child.HasPermission(permissionName));
    }

    // 遞迴顯示樹狀結構
    public void Display(int depth = 0)
    {
        Console.WriteLine($"{new string(' ', depth * 2)}[+] {Name}");
        foreach (var child in _children)
        {
            child.Display(depth + 1);
        }
    }
}`;

const usageExample = `// 建立權限樹
var allPermissions = new PermissionGroup("全部權限");

// 使用者管理群組
var userMgmt = new PermissionGroup("使用者管理");
userMgmt.Add(new LeafPermission("User.Create"));
userMgmt.Add(new LeafPermission("User.Read"));
userMgmt.Add(new LeafPermission("User.Update"));
userMgmt.Add(new LeafPermission("User.Delete"));

// 訂單管理群組
var orderMgmt = new PermissionGroup("訂單管理");
orderMgmt.Add(new LeafPermission("Order.Read"));
orderMgmt.Add(new LeafPermission("Order.Cancel"));

// 報表群組（包含子群組）
var reportMgmt = new PermissionGroup("報表管理");
var salesReport = new PermissionGroup("銷售報表");
salesReport.Add(new LeafPermission("Report.Sales.View"));
salesReport.Add(new LeafPermission("Report.Sales.Export"));
reportMgmt.Add(salesReport);
reportMgmt.Add(new LeafPermission("Report.Dashboard.View"));

// 組合成完整的權限樹
allPermissions.Add(userMgmt);
allPermissions.Add(orderMgmt);
allPermissions.Add(reportMgmt);

// 顯示整棵權限樹
allPermissions.Display();
// [+] 全部權限
//   [+] 使用者管理
//     ── User.Create
//     ── User.Read
//     ── User.Update
//     ── User.Delete
//   [+] 訂單管理
//     ── Order.Read
//     ── Order.Cancel
//   [+] 報表管理
//     [+] 銷售報表
//       ── Report.Sales.View
//       ── Report.Sales.Export
//     ── Report.Dashboard.View

// 檢查權限 — 客戶端不需要知道是群組還是單一權限
Console.WriteLine(allPermissions.HasPermission("User.Create")); // True
Console.WriteLine(orderMgmt.HasPermission("User.Create"));     // False
Console.WriteLine(reportMgmt.HasPermission("Report.Sales.Export")); // True`;

const fileSystemExample = `// 另一個經典範例：檔案系統
public interface IFileSystemEntry
{
    string Name { get; }
    long GetSize();
}

public class File : IFileSystemEntry
{
    public string Name { get; }
    public long Size { get; }

    public File(string name, long size)
    {
        Name = name;
        Size = size;
    }

    public long GetSize() => Size;
}

public class Directory : IFileSystemEntry
{
    public string Name { get; }
    private readonly List<IFileSystemEntry> _entries = new();

    public Directory(string name) => Name = name;

    public void Add(IFileSystemEntry entry) => _entries.Add(entry);
    public void Remove(IFileSystemEntry entry) => _entries.Remove(entry);

    // 遞迴計算所有檔案大小總和
    public long GetSize() => _entries.Sum(e => e.GetSize());
}

// 使用
var root = new Directory("root");
var src = new Directory("src");
src.Add(new File("Program.cs", 1200));
src.Add(new File("Startup.cs", 800));
root.Add(src);
root.Add(new File("README.md", 500));

Console.WriteLine(root.GetSize()); // 2500`;

const genericComposite = `// 泛型版 Composite — 可重複使用的基礎類別
public abstract class CompositeBase<T> where T : CompositeBase<T>
{
    public string Name { get; }
    private readonly List<T> _children = new();
    public IReadOnlyList<T> Children => _children.AsReadOnly();

    protected CompositeBase(string name) => Name = name;

    public virtual void Add(T child) => _children.Add(child);
    public virtual void Remove(T child) => _children.Remove(child);

    // 範本方法：遞迴走訪所有節點
    public IEnumerable<T> Flatten()
    {
        yield return (T)this;
        foreach (var child in _children)
        {
            foreach (var descendant in child.Flatten())
            {
                yield return descendant;
            }
        }
    }
}

// UI 元件樹的應用
public class UIComponent : CompositeBase<UIComponent>
{
    public bool IsVisible { get; set; } = true;

    public UIComponent(string name) : base(name) { }

    public void Render(int indent = 0)
    {
        if (!IsVisible) return;

        Console.WriteLine($"{new string(' ', indent)}<{Name}>");
        foreach (var child in Children)
        {
            child.Render(indent + 2);
        }
        Console.WriteLine($"{new string(' ', indent)}</{Name}>");
    }
}

// 使用
var page = new UIComponent("Page");
var header = new UIComponent("Header");
header.Add(new UIComponent("Logo"));
header.Add(new UIComponent("NavMenu"));
var content = new UIComponent("Content");
content.Add(new UIComponent("Sidebar"));
content.Add(new UIComponent("MainPanel"));
page.Add(header);
page.Add(content);

page.Render();
// <Page>
//   <Header>
//     <Logo></Logo>
//     <NavMenu></NavMenu>
//   </Header>
//   <Content>
//     <Sidebar></Sidebar>
//     <MainPanel></MainPanel>
//   </Content>
// </Page>

// Flatten 可列舉所有節點
var allComponents = page.Flatten().Select(c => c.Name);
// Page, Header, Logo, NavMenu, Content, Sidebar, MainPanel`;

const safetyVariant = `// 安全版 vs. 透明版 Composite

// ❌ 透明版：Leaf 也有 Add/Remove（會拋出例外）
public class LeafPermissionTransparent : IPermissionComponent
{
    // 被迫實作但毫無意義的方法
    public void Add(IPermissionComponent c)
        => throw new InvalidOperationException("葉節點不支援 Add");
    public void Remove(IPermissionComponent c)
        => throw new InvalidOperationException("葉節點不支援 Remove");
}

// ✅ 安全版：將 Add/Remove 只放在 Composite
// 介面只定義共用操作（HasPermission、Display）
// Add/Remove 只存在於 PermissionGroup 類別上
// 客戶端需要知道具體型別才能呼叫 Add/Remove
// → 編譯期安全，避免執行期例外`;
</script>

<template>
  <div class="content-wrapper">
    <h1>Composite 組合模式</h1>
    <p class="page-subtitle">將物件組合成樹狀結構以表示「部分—整體」的階層關係，讓客戶端可以一致地處理個別物件和組合物件</p>

    <h2>核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🌳</div>
        <h4>樹狀結構</h4>
        <p>將物件組合成樹狀結構，每個節點可以是葉節點或包含子節點的組合節點。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>一致性操作</h4>
        <p>客戶端透過相同介面操作個別物件和組合物件，無需區分兩者。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔁</div>
        <h4>遞迴組合</h4>
        <p>組合節點可以包含其他組合節點，形成無限深度的巢狀結構。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>部分—整體</h4>
        <p>整體的行為由各部分共同決定，例如目錄大小 = 所有子檔案大小的總和。</p>
      </div>
    </div>

    <h2>模式結構</h2>
    <div class="info-box info">
      <div class="info-box-title">📐 Composite 模式的三個角色</div>
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
            <td><strong>Component</strong></td>
            <td>定義所有物件的共用介面，宣告葉節點和組合節點都要實作的操作</td>
            <td><code>IPermissionComponent</code></td>
          </tr>
          <tr>
            <td><strong>Leaf</strong></td>
            <td>樹的末端節點，沒有子節點，定義基本行為</td>
            <td><code>LeafPermission</code></td>
          </tr>
          <tr>
            <td><strong>Composite</strong></td>
            <td>包含子節點的容器，將操作委派給子節點並可能合併結果</td>
            <td><code>PermissionGroup</code></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="arch-diagram">
      <div style="text-align: center; font-size: 14px; color: var(--vt-c-text-2); margin-bottom: 12px;">
        <strong>Composite 結構圖</strong>
      </div>
      <div style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
        <div class="arch-layer presentation" style="max-width: 300px;">IPermissionComponent</div>
        <div class="arch-arrow">⬇️ 實作</div>
        <div style="display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;">
          <div class="arch-layer domain" style="min-width: 180px;">LeafPermission (Leaf)</div>
          <div class="arch-layer infrastructure" style="min-width: 180px;">PermissionGroup (Composite)</div>
        </div>
        <div class="arch-arrow">⬇️ 包含 children</div>
        <div class="arch-layer application" style="max-width: 350px;">List&lt;IPermissionComponent&gt;</div>
      </div>
    </div>

    <h2>實戰範例：權限系統</h2>

    <h3>Step 1 — 定義 Component 介面</h3>
    <CodeBlock :code="componentInterface" lang="csharp" />

    <h3>Step 2 — 實作 Leaf（單一權限）</h3>
    <CodeBlock :code="leafPermission" lang="csharp" />

    <h3>Step 3 — 實作 Composite（權限群組）</h3>
    <CodeBlock :code="permissionGroup" lang="csharp" />

    <h3>Step 4 — 組合使用</h3>
    <CodeBlock :code="usageExample" lang="csharp" />

    <h2>延伸範例：檔案系統（File / Directory）</h2>
    <p>檔案系統是 Composite 模式最直觀的應用。目錄可以包含檔案和子目錄，而「計算大小」這個操作對檔案和目錄都適用。</p>
    <CodeBlock :code="fileSystemExample" lang="csharp" />

    <h2>延伸範例：泛型 Composite 與 UI 元件樹</h2>
    <p>透過泛型基礎類別，可以快速建立各種樹狀結構。以下示範 UI 元件樹的組合與渲染。</p>
    <CodeBlock :code="genericComposite" lang="csharp" />

    <h2>安全版 vs. 透明版</h2>
    <div class="info-box warning">
      <div class="info-box-title">⚠️ 兩種設計取捨</div>
      <p>
        <strong>透明版</strong>：將 <code>Add</code>/<code>Remove</code> 放在 Component 介面中，
        讓客戶端可以完全不區分 Leaf 和 Composite，但 Leaf 必須拋出例外。<br>
        <strong>安全版</strong>：<code>Add</code>/<code>Remove</code> 只存在於 Composite 類別，
        客戶端需要知道具體型別，但編譯期就能防止錯誤。<br><br>
        Head First 書中偏好透明版以強調「一致性」，但現代 C# 實務中<strong>安全版更受推薦</strong>，
        因為編譯期的型別安全比執行期的例外更可靠。
      </p>
    </div>
    <CodeBlock :code="safetyVariant" lang="csharp" />

    <h2>適用場景</h2>
    <table>
      <thead>
        <tr>
          <th>場景</th>
          <th>Leaf</th>
          <th>Composite</th>
          <th>共用操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>權限系統</td>
          <td>單一權限</td>
          <td>權限群組</td>
          <td><code>HasPermission()</code></td>
        </tr>
        <tr>
          <td>檔案系統</td>
          <td>File</td>
          <td>Directory</td>
          <td><code>GetSize()</code></td>
        </tr>
        <tr>
          <td>UI 元件樹</td>
          <td>Button、Label</td>
          <td>Panel、Form</td>
          <td><code>Render()</code></td>
        </tr>
        <tr>
          <td>組織架構</td>
          <td>員工</td>
          <td>部門</td>
          <td><code>GetHeadcount()</code></td>
        </tr>
        <tr>
          <td>菜單系統</td>
          <td>MenuItem</td>
          <td>Menu / SubMenu</td>
          <td><code>Display()</code></td>
        </tr>
        <tr>
          <td>算術運算式</td>
          <td>數字</td>
          <td>運算子（+、-、*）</td>
          <td><code>Evaluate()</code></td>
        </tr>
      </tbody>
    </table>

    <h2>與其他模式的關係</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 相關設計模式</div>
      <table>
        <thead>
          <tr>
            <th>模式</th>
            <th>與 Composite 的關係</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Iterator</strong></td>
            <td>常用來走訪 Composite 的樹狀結構（深度優先 / 廣度優先）</td>
          </tr>
          <tr>
            <td><strong>Visitor</strong></td>
            <td>在不修改 Composite 結構的情況下，對樹的每個節點執行不同操作</td>
          </tr>
          <tr>
            <td><strong>Decorator</strong></td>
            <td>兩者都透過遞迴組合，但 Decorator 只有一個子節點，Composite 有多個</td>
          </tr>
          <tr>
            <td><strong>Chain of Responsibility</strong></td>
            <td>Leaf 的父節點連結可以作為 CoR 的鏈路</td>
          </tr>
        </tbody>
      </table>
    </div>

    <PageNav
      :prev="{ path: '/csharp/design-patterns/iterator', label: 'Iterator 迭代器模式' }"
      :next="{ path: '/csharp/design-patterns/state', label: 'State 狀態模式' }"
    />
  </div>
</template>
