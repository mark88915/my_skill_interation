<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const ooPrinciplesCode = `// 1. 封裝變化 — 把會變動的部分獨立出來
public interface IShippingCalculator
{
    decimal Calculate(Order order);
}

// 2. 針對介面寫程式，而非針對實作
public class OrderService
{
    private readonly IShippingCalculator _shipping; // 依賴介面
    public OrderService(IShippingCalculator shipping) => _shipping = shipping;
}

// 3. 多用組合，少用繼承
public class Duck
{
    private readonly IFlyBehavior _flyBehavior;       // 組合
    private readonly IQuackBehavior _quackBehavior;   // 組合

    public Duck(IFlyBehavior fly, IQuackBehavior quack)
    {
        _flyBehavior = fly;
        _quackBehavior = quack;
    }

    public void PerformFly() => _flyBehavior.Fly();
    public void PerformQuack() => _quackBehavior.Quack();
}`
</script>

<template>
  <div class="content-wrapper">
    <h1>設計模式概述</h1>
    <p class="page-subtitle">深入淺出設計模式 — 以 C# 現代實戰為主軸</p>

    <h2>什麼是設計模式？</h2>
    <p>
      設計模式（Design Patterns）是針對軟體開發中<strong>反覆出現的問題</strong>所提出的通用解決方案。
      它們不是可以直接複製貼上的程式碼，而是經過驗證的<strong>設計思維模板</strong>，
      幫助我們寫出更靈活、更容易維護、更容易擴展的系統。
    </p>
    <p>
      本系列以經典書籍《Head First Design Patterns》（深入淺出設計模式）為脈絡，
      搭配 <strong>C# / .NET 現代實戰範例</strong>，讓你不只學到理論，更能在真實專案中立即應用。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🧩</div>
        <h4>共通語言</h4>
        <p>設計模式讓團隊成員能用「策略模式」「觀察者模式」等詞彙快速溝通設計意圖，大幅減少溝通成本。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>久經驗證</h4>
        <p>這些模式源自數十年的工程經驗累積，是前人解決複雜問題的智慧結晶，能幫你避開常見陷阱。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏗️</div>
        <h4>靈活擴展</h4>
        <p>正確使用設計模式，能讓系統在需求變更時只需擴展而非修改，符合開放封閉原則（OCP）。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📖</div>
        <h4>不是銀彈</h4>
        <p>過度使用設計模式會讓程式碼過度抽象、難以理解。應在真正需要時才引入，簡單問題用簡單解法。</p>
      </div>
    </div>

    <h2>OO 設計原則</h2>
    <p>
      《深入淺出設計模式》一書貫穿了幾個核心的物件導向設計原則，這些原則是所有設計模式的基礎：
    </p>

    <table>
      <thead>
        <tr>
          <th>原則</th>
          <th>英文</th>
          <th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>封裝變化</strong></td>
          <td>Encapsulate what varies</td>
          <td>找出程式中會變動的部分，將它們獨立封裝起來，不要和不變的部分混在一起</td>
        </tr>
        <tr>
          <td><strong>針對介面寫程式</strong></td>
          <td>Program to an interface, not an implementation</td>
          <td>依賴抽象（介面），而不是依賴具體類別，讓程式碼更有彈性</td>
        </tr>
        <tr>
          <td><strong>多用組合，少用繼承</strong></td>
          <td>Favor composition over inheritance</td>
          <td>透過將物件組合在一起來獲得新功能，比繼承更有彈性，可在執行期動態改變行為</td>
        </tr>
        <tr>
          <td><strong>鬆耦合</strong></td>
          <td>Strive for loosely coupled designs</td>
          <td>物件之間的互動應儘量減少彼此的依賴，讓變更的影響範圍降到最低</td>
        </tr>
        <tr>
          <td><strong>開放封閉原則</strong></td>
          <td>Open for extension, closed for modification</td>
          <td>類別應該對擴展開放，對修改封閉——透過新增程式碼來增加功能，而非修改既有程式碼</td>
        </tr>
        <tr>
          <td><strong>依賴反轉原則</strong></td>
          <td>Dependency Inversion Principle</td>
          <td>高層模組不應依賴低層模組，兩者都應依賴抽象；抽象不應依賴細節，細節應依賴抽象</td>
        </tr>
        <tr>
          <td><strong>最少知識原則</strong></td>
          <td>Principle of Least Knowledge (Law of Demeter)</td>
          <td>一個物件應只與它的「直接朋友」溝通，不要呼叫透過其他物件取得的物件的方法</td>
        </tr>
        <tr>
          <td><strong>好萊塢原則</strong></td>
          <td>Hollywood Principle — Don't call us, we'll call you</td>
          <td>高層元件控制流程，低層元件不要主動呼叫高層，而是由高層決定何時呼叫低層</td>
        </tr>
        <tr>
          <td><strong>單一責任原則</strong></td>
          <td>Single Responsibility Principle</td>
          <td>一個類別應該只有一個改變的理由，每個類別只負責一件事</td>
        </tr>
      </tbody>
    </table>

    <CodeBlock :code="ooPrinciplesCode" lang="csharp" />

    <h2>《深入淺出設計模式》13 個設計模式總覽</h2>
    <p>下表列出書中涵蓋的所有模式，依章節順序排列：</p>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>模式名稱</th>
          <th>分類</th>
          <th>一句話說明</th>
          <th>C# 實戰場景</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>1</td>
          <td><strong>Strategy 策略</strong></td>
          <td>行為型</td>
          <td>定義一系列演算法，封裝起來讓它們可互換</td>
          <td>支付方式切換、折扣計算策略</td>
        </tr>
        <tr>
          <td>2</td>
          <td><strong>Observer 觀察者</strong></td>
          <td>行為型</td>
          <td>一對多依賴關係，狀態改變時自動通知</td>
          <td>訂單狀態通知、事件驅動架構</td>
        </tr>
        <tr>
          <td>3</td>
          <td><strong>Decorator 裝飾者</strong></td>
          <td>結構型</td>
          <td>動態地為物件加上額外責任</td>
          <td>Middleware Pipeline、Stream 包裝</td>
        </tr>
        <tr>
          <td>4</td>
          <td><strong>Factory Method 工廠方法</strong></td>
          <td>建立型</td>
          <td>將物件的建立延遲到子類別決定</td>
          <td>ILoggerFactory、IHttpClientFactory</td>
        </tr>
        <tr>
          <td>5</td>
          <td><strong>Abstract Factory 抽象工廠</strong></td>
          <td>建立型</td>
          <td>提供介面建立一系列相關的物件</td>
          <td>跨資料庫 Provider、UI 主題工廠</td>
        </tr>
        <tr>
          <td>6</td>
          <td><strong>Singleton 單例</strong></td>
          <td>建立型</td>
          <td>確保類別只有一個實例，並提供全域存取點</td>
          <td>DI 容器 Singleton 生命週期</td>
        </tr>
        <tr>
          <td>7</td>
          <td><strong>Command 命令</strong></td>
          <td>行為型</td>
          <td>將請求封裝為物件，支援撤銷與佇列</td>
          <td>MediatR IRequest、CQRS Command</td>
        </tr>
        <tr>
          <td>8</td>
          <td><strong>Adapter 轉接器</strong></td>
          <td>結構型</td>
          <td>將一個介面轉換成客戶端期望的介面</td>
          <td>第三方 SDK 整合、Legacy 系統對接</td>
        </tr>
        <tr>
          <td>9</td>
          <td><strong>Facade 外觀</strong></td>
          <td>結構型</td>
          <td>為複雜子系統提供一個統一的簡化介面</td>
          <td>Application Service 層</td>
        </tr>
        <tr>
          <td>10</td>
          <td><strong>Template Method 模板方法</strong></td>
          <td>行為型</td>
          <td>定義演算法骨架，子類別填入特定步驟</td>
          <td>ASP.NET Core 的 AuthenticationHandler</td>
        </tr>
        <tr>
          <td>11</td>
          <td><strong>Iterator 迭代器</strong></td>
          <td>行為型</td>
          <td>提供順序存取集合元素的方式，不暴露內部結構</td>
          <td>IEnumerable&lt;T&gt;、yield return</td>
        </tr>
        <tr>
          <td>12</td>
          <td><strong>Composite 組合</strong></td>
          <td>結構型</td>
          <td>將物件組合成樹狀結構，讓單一物件與組合物件被一致對待</td>
          <td>檔案系統、選單結構、組織架構</td>
        </tr>
        <tr>
          <td>13</td>
          <td><strong>State 狀態</strong></td>
          <td>行為型</td>
          <td>允許物件在內部狀態改變時改變它的行為</td>
          <td>訂單狀態機、工作流程引擎</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box info">
      <div class="info-box-title">📚 學習建議</div>
      <p>
        不需要一口氣學完所有模式。建議的學習順序：
      </p>
      <p>
        <strong>第一輪（最常用）：</strong>Strategy → Observer → Decorator → Factory Method → Singleton<br>
        <strong>第二輪（進階應用）：</strong>Command → Adapter → Facade → Template Method<br>
        <strong>第三輪（特定場景）：</strong>Iterator → Composite → State → Abstract Factory
      </p>
      <p>
        每個模式都會搭配<strong>真實的 C# / ASP.NET Core 範例</strong>，讓你看到它們在現代開發中如何被應用。
      </p>
    </div>

    <h2>設計模式三大分類</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🏭</div>
        <h4>建立型 Creational</h4>
        <p>處理物件建立機制，將物件的建立與使用分離。包含：Factory Method、Abstract Factory、Singleton。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>結構型 Structural</h4>
        <p>處理類別與物件的組合方式，形成更大的結構。包含：Decorator、Adapter、Facade、Composite。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>行為型 Behavioral</h4>
        <p>處理物件之間的責任分配與溝通方式。包含：Strategy、Observer、Command、Template Method、Iterator、State。</p>
      </div>
    </div>

    <PageNav
      :next="{ path: '/csharp/design-patterns/strategy', label: 'Strategy 策略模式' }"
    />
  </div>
</template>
