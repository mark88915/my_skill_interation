<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>SDD 概述與核心原則</h1>
    <p class="page-subtitle">Spec-Driven Development — 先寫規格，再寫程式碼</p>

    <h2>什麼是 SDD？</h2>
    <p>
      <strong>Spec-Driven Development（規格驅動開發）</strong>是一種軟體開發方法論，
      核心理念是：在寫任何程式碼之前，先完成詳細且可驗證的規格文件。
      程式碼的正確性由規格定義，而非由開發者的直覺決定。
    </p>
    <p>
      在 AI 輔助開發的時代，SDD 的價值更加明顯——精確的規格文件既是人類溝通的工具，
      也是 AI 的最佳提示（Prompt）。
    </p>

    <div class="info-box tip">
      <div class="info-box-title">💡 核心觀點</div>
      <p>「如果你無法精確描述你想要什麼，你也無法驗證你得到的是否正確。」<br>SDD 就是要解決這個問題。</p>
    </div>

    <h2>SDD vs. 傳統開發</h2>
    <div class="arch-diagram">
      <div style="display: flex; gap: 24px; flex-wrap: wrap; justify-content: center;">
        <div style="flex: 1; min-width: 280px;">
          <h4 style="margin-bottom: 12px; color: var(--vt-c-text-2);">傳統開發</h4>
          <div class="arch-layer presentation" style="max-width: none;">
            需求 → 設計 → <strong>寫程式碼</strong> → 測試 → 修Bug
          </div>
          <div style="font-size: 13px; color: var(--vt-c-text-3); margin-top: 8px;">程式碼是核心產出，規格常常過時</div>
        </div>
        <div style="flex: 1; min-width: 280px;">
          <h4 style="margin-bottom: 12px; color: var(--vt-c-text-2);">SDD</h4>
          <div class="arch-layer domain" style="max-width: none;">
            需求 → <strong>寫規格</strong> → 驗證規格 → 生成程式碼 → 自動驗證
          </div>
          <div style="font-size: 13px; color: var(--vt-c-text-3); margin-top: 8px;">規格是核心產出，程式碼可以重新生成</div>
        </div>
      </div>
    </div>

    <h2>為什麼需要 SDD？</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🎯</div>
        <h4>消除模糊性</h4>
        <p>強迫你在動手之前想清楚每個邊界條件和行為預期。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🤖</div>
        <h4>AI 友善</h4>
        <p>精確的規格就是最好的 AI Prompt，產出品質大幅提升。</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>可驗證性</h4>
        <p>規格直接轉為驗收標準，程式碼是否正確有客觀判斷。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>可重現性</h4>
        <p>有了規格，程式碼可以重寫、重構、甚至換語言，行為不變。</p>
      </div>
      <div class="concept-card">
        <div class="icon">👥</div>
        <h4>團隊溝通</h4>
        <p>規格文件是需求方、開發者、AI 之間的共同語言。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📈</div>
        <h4>減少返工</h4>
        <p>早期發現規格矛盾比寫完程式碼後改需求成本低得多。</p>
      </div>
    </div>

    <h2>SDD 的適用場景</h2>
    <table>
      <thead>
        <tr>
          <th>適合 SDD</th>
          <th>不適合 SDD</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>有明確業務規則的系統</td>
          <td>探索性原型（不確定需求）</td>
        </tr>
        <tr>
          <td>AI 輔助開發的專案</td>
          <td>藝術性 / 視覺設計導向的 UI</td>
        </tr>
        <tr>
          <td>需要高可靠性的金融/醫療系統</td>
          <td>極短生命週期的一次性腳本</td>
        </tr>
        <tr>
          <td>多人協作的大型專案</td>
          <td>個人 side project（快速迭代）</td>
        </tr>
        <tr>
          <td>API 設計與微服務介面</td>
          <td>R&D 實驗性程式碼</td>
        </tr>
      </tbody>
    </table>

    <h2>SDD 與其他方法論的關係</h2>
    <table>
      <thead>
        <tr>
          <th>方法論</th>
          <th>關注焦點</th>
          <th>與 SDD 的關係</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>TDD</strong></td>
          <td>測試先行</td>
          <td>SDD 的規格可以生成測試案例，TDD 是 SDD 的子集</td>
        </tr>
        <tr>
          <td><strong>BDD</strong></td>
          <td>行為描述（Given-When-Then）</td>
          <td>BDD 的 Gherkin 語法可作為 SDD 規格的一種格式</td>
        </tr>
        <tr>
          <td><strong>DDD</strong></td>
          <td>領域模型設計</td>
          <td>DDD 的 Ubiquitous Language 自然融入 SDD 的規格中</td>
        </tr>
        <tr>
          <td><strong>Design by Contract</strong></td>
          <td>前置/後置條件</td>
          <td>SDD 規格包含契約式設計的 Pre/Post Conditions</td>
        </tr>
      </tbody>
    </table>

    <!-- 核心原則 -->
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
      :prev="{ path: '/ai/claude-code/best-practices', label: 'Claude Code 最佳實踐' }"
      :next="{ path: '/ai/sdd/spec-writing', label: '規格撰寫' }"
    />
  </div>
</template>
