<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>最佳實踐</h1>
    <p class="page-subtitle">如何有效地使用 Claude Code 提升開發效率</p>

    <h2>提示工程（Prompt Engineering）</h2>

    <h3>明確且具體</h3>
    <table>
      <thead>
        <tr>
          <th>不佳</th>
          <th>較好</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>幫我改一下程式碼</td>
          <td>在 OrderService.CreateOrder 方法中加入庫存檢查，如果庫存不足就拋出 DomainException</td>
        </tr>
        <tr>
          <td>這個有 bug</td>
          <td>OrderController.GetById 在 orderId 為空 GUID 時回傳 500 而不是 400</td>
        </tr>
        <tr>
          <td>幫我重構</td>
          <td>把 UserService 中超過 200 行的 RegisterUser 方法拆分成更小的 private 方法</td>
        </tr>
      </tbody>
    </table>

    <h3>提供上下文</h3>
    <CodeBlock lang="bash" filename="好的提示範例" :code="`
# ✅ 提供背景和約束
> 我們使用 DDD + CQRS 架構。
> 我想新增一個「退貨」功能，需要：
> 1. 在 Order aggregate 加上 RequestReturn() 方法
> 2. 只有已出貨的訂單可以退貨
> 3. 產生 ReturnRequestedEvent
> 4. 建立對應的 Command 和 Handler
> 5. 寫測試覆蓋正常和異常情境

# ✅ 引用相關檔案
> 參考 @src/Domain/Aggregates/Order.cs 的 Cancel() 方法風格，
> 實作 RequestReturn() 方法`" />

    <h2>CLAUDE.md 的最佳寫法</h2>
    <CodeBlock lang="bash" filename="CLAUDE.md 範例" :code="`
# EShop 專案

## 架構決策
- 使用 DDD 分層架構，嚴格遵守依賴方向
- Domain Layer 不得引用任何外部套件（EF Core, MediatR 等）
- 每個 Aggregate Root 對應一個 Repository

## 重要規則（請務必遵守）
- Entity 必須使用 Strongly Typed ID（不使用 int, Guid）
- 所有集合屬性使用 private backing field + IReadOnlyCollection
- Enum 在 DB 中存為 string（不是 int）
- API 回傳使用 Result pattern，不直接拋例外

## 測試慣例
- 使用 xUnit + FluentAssertions
- Domain 測試不需要 Mock，直接測試 Domain 物件
- Repository 測試使用 In-Memory Database

## 不要做的事
- 不要使用 Data Annotations（用 Fluent API）
- 不要在 Domain Layer 引用 Microsoft.EntityFrameworkCore
- 不要建立 anemic domain model（Entity 要有行為）
- 不要在 Controller 中放業務邏輯`" />

    <h2>效率技巧</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>一次一個任務</h4>
        <p>將大任務拆成小步驟，每步驟確認後再進行下一步，避免方向偏離。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>先計畫再實作</h4>
        <p>複雜任務先用「幫我規劃...」確認方向，再說「開始實作」。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>迭代式修正</h4>
        <p>不要期望一次完美。先讓 Claude 做出初版，再指出需要修改的地方。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🧹</div>
        <h4>定期壓縮對話</h4>
        <p>對話過長會降低效率。使用 /compact 壓縮，或 /clear 重新開始。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📝</div>
        <h4>維護 CLAUDE.md</h4>
        <p>隨著專案演進更新 CLAUDE.md，讓 Claude 總是了解最新的專案規範。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚡</div>
        <h4>善用自訂指令</h4>
        <p>把常用的提示模板存為 slash command，減少重複輸入。</p>
      </div>
    </div>

    <h2>安全注意事項</h2>
    <div class="info-box warning">
      <div class="info-box-title">⚠️ 務必注意</div>
      <p>
        ・不要在 CLAUDE.md 或提示中包含密碼、API Key 等敏感資訊<br>
        ・使用 Suggest 模式時仔細審查每個檔案修改<br>
        ・在執行破壞性操作（如 git push --force、rm -rf）前務必確認<br>
        ・不要在正式環境的伺服器上以 Full Auto 模式運行<br>
        ・定期檢查 <code>.gitignore</code>，確保敏感檔案不會被提交
      </p>
    </div>

    <h2>常見陷阱</h2>
    <table>
      <thead>
        <tr>
          <th>陷阱</th>
          <th>解決方式</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>對話太長導致 Claude 忘記早期的上下文</td>
          <td>使用 <code>/compact</code> 壓縮，或將關鍵決策寫入 CLAUDE.md</td>
        </tr>
        <tr>
          <td>Claude 修改了不相關的檔案</td>
          <td>更明確地指定範圍：「只修改 OrderService，不要動其他檔案」</td>
        </tr>
        <tr>
          <td>Claude 引入了不符合專案風格的程式碼</td>
          <td>在 CLAUDE.md 中記錄程式碼風格規範</td>
        </tr>
        <tr>
          <td>Claude 一直重試失敗的方法</td>
          <td>明確指出問題：「這個方法行不通，換一個思路」</td>
        </tr>
        <tr>
          <td>Token 用量過高</td>
          <td>用 <code>/cost</code> 檢查用量，<code>/compact</code> 壓縮對話</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">💡 總結</div>
      <p>
        Claude Code 是你的 AI 結對夥伴，而不是魔法按鈕。
        最有效的使用方式是：提供清楚的需求和約束，讓 Claude 處理繁瑣的實作細節，
        你專注在架構決策和品質審查上。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-code/advanced', label: '進階技巧' }"
      :next="{ path: '/ai/sdd/intro', label: 'SDD 概述' }"
    />
  </div>
</template>
