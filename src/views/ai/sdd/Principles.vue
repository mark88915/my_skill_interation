<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>核心原則</h1>
    <p class="page-subtitle">SDD 的五大核心原則與思維模式</p>

    <h2>原則一：規格優先（Spec First）</h2>
    <p>
      在任何實作開始之前，先完成規格文件。規格是唯一的真相來源（Single Source of Truth）。
    </p>
    <div class="info-box purple">
      <div class="info-box-title">📐 規格 > 程式碼</div>
      <p>如果規格和程式碼不一致，修正的是程式碼，不是規格。規格變更必須經過正式的審查流程。</p>
    </div>

    <CodeBlock lang="bash" filename="規格優先的開發順序" :code="`
1. 撰寫規格文件（描述行為、約束、邊界條件）
2. 審查規格（團隊/利害關係人 Review）
3. 根據規格產生測試案例
4. 實作程式碼（或交給 AI 實作）
5. 用測試驗證程式碼是否符合規格
6. 持續維護規格（需求變更時先改規格）`" />

    <h2>原則二：可驗證性（Verifiability）</h2>
    <p>
      每一條規格都必須是可驗證的。如果一個規格無法被測試，它就不是好的規格。
    </p>

    <table>
      <thead>
        <tr>
          <th>不可驗證（模糊）</th>
          <th>可驗證（精確）</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>系統應該「快速」回應</td>
          <td>API 回應時間 P95 &lt; 200ms</td>
        </tr>
        <tr>
          <td>密碼應該「安全」</td>
          <td>密碼至少 8 字元，包含大小寫、數字和特殊符號</td>
        </tr>
        <tr>
          <td>使用者體驗要好</td>
          <td>表單提交後 1 秒內顯示成功訊息或錯誤細節</td>
        </tr>
        <tr>
          <td>系統要能處理「大量」資料</td>
          <td>單次查詢最多回傳 1000 筆，支援 cursor-based 分頁</td>
        </tr>
      </tbody>
    </table>

    <h2>原則三：完整性（Completeness）</h2>
    <p>規格必須涵蓋所有可能的情境，包括：</p>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>正常路徑（Happy Path）</h4>
        <p>所有輸入都正確時的預期行為。</p>
      </div>
      <div class="concept-card">
        <div class="icon">❌</div>
        <h4>錯誤路徑（Error Path）</h4>
        <p>無效輸入、權限不足、資源不存在等情境。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔲</div>
        <h4>邊界條件（Edge Cases）</h4>
        <p>空值、最大值、最小值、並發操作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>安全約束</h4>
        <p>認證、授權、資料隱私等安全需求。</p>
      </div>
    </div>

    <h2>原則四：無歧義性（Unambiguity）</h2>
    <p>規格的每一句話都應該只有一種解讀方式。</p>

    <CodeBlock lang="bash" filename="歧義 vs 明確" :code="`
# ❌ 有歧義
&quot;如果使用者取消訂單，系統應該退款&quot;
# 問題：全額退款？部分退款？退到哪裡？多久完成？

# ✅ 無歧義
&quot;當使用者取消狀態為 Confirmed 的訂單時：
  1. 訂單狀態變更為 Cancelled
  2. 系統建立全額退款請求（金額 = 訂單總額）
  3. 退款請求發送至原付款管道
  4. 退款需在 3-5 個工作天內完成
  5. 系統發送取消確認 Email 至使用者信箱
  6. 若訂單已出貨（Shipped），拒絕取消並回傳錯誤&quot;`" />

    <h2>原則五：分層規格（Layered Specs）</h2>
    <p>規格應該分層撰寫，從高層次到低層次：</p>

    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 450px;">
        <strong>Level 1：功能規格（Feature Spec）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">使用者視角的功能描述</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer application" style="max-width: 450px;">
        <strong>Level 2：API 規格（Interface Spec）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">API 端點、輸入輸出、錯誤碼</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 450px;">
        <strong>Level 3：行為規格（Behavior Spec）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">業務規則、狀態轉換、驗證邏輯</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer infrastructure" style="max-width: 450px;">
        <strong>Level 4：技術規格（Technical Spec）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">資料模型、效能需求、部署需求</div>
      </div>
    </div>

    <div class="info-box info">
      <div class="info-box-title">📌 規格的粒度</div>
      <p>
        不需要事事都寫規格。核心業務邏輯、公開 API、跨團隊介面需要嚴格的規格。
        內部實作細節和工具函數可以由開發者自行決定。
        關鍵是：<strong>越是重要的行為，規格越要詳細</strong>。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/sdd/intro', label: 'SDD 概述' }"
      :next="{ path: '/ai/sdd/spec-writing', label: '規格撰寫' }"
    />
  </div>
</template>
