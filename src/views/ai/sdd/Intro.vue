<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>SDD 概述</h1>
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

    <PageNav
      :prev="{ path: '/ai/claude-code/best-practices', label: 'Claude Code 最佳實踐' }"
      :next="{ path: '/ai/sdd/principles', label: '核心原則' }"
    />
  </div>
</template>
