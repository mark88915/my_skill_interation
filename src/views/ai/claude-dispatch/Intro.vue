<script setup>
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Dispatch 概述</h1>
    <p class="page-subtitle">從手機遠端控制桌機上的 Claude，非同步完成複雜任務</p>

    <div class="info-box info">
      <div class="info-box-title">📌 目前狀態</div>
      <p>Claude Dispatch 目前為 <strong>Research Preview</strong>（研究預覽階段），功能仍在持續改善中。首先向 Max 訂閱者開放，Pro 訂閱者隨後跟進。</p>
    </div>

    <h2>什麼是 Claude Dispatch？</h2>
    <p>
      <strong>Claude Dispatch</strong> 是 Anthropic 為 Claude Cowork 推出的官方功能，
      讓你可以透過手機（iOS / Android）向桌機上的 Claude 下達任務指令，
      然後離開去做其他事，等回來時任務已經完成。
    </p>
    <p>
      這徹底改變了與 AI 互動的方式——從「即時問答」進化到「非同步任務委派」。
      你不再需要守在電腦前等 Claude 回應，而是像交辦任務給同事一樣，
      傳個訊息說清楚需求，去做別的事，回來看結果。
    </p>

    <h2>核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📱</div>
        <h4>行動端下令</h4>
        <p>用手機 Claude App 的 Dispatch 區塊發送任務指令，隨時隨地都能委派工作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🖥️</div>
        <h4>桌機端執行</h4>
        <p>Claude Desktop 在你的電腦上自主執行，存取本機檔案、整合服務與應用程式。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⏳</div>
        <h4>非同步模式</h4>
        <p>不需等待即時回應。發出指令後離開，稍後再回來查看已完成的工作。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>整合本機資源</h4>
        <p>可存取本機資料夾、Google Drive、Slack、Email、Notion、Apple Notes 等服務。</p>
      </div>
    </div>

    <h2>與一般 Claude 使用方式的差異</h2>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>一般 Claude 對話</th>
          <th>Claude Dispatch</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>互動模式</strong></td>
          <td>即時問答（同步）</td>
          <td>任務委派（非同步）</td>
        </tr>
        <tr>
          <td><strong>使用裝置</strong></td>
          <td>任何裝置皆可</td>
          <td>手機下令，桌機執行</td>
        </tr>
        <tr>
          <td><strong>等待與否</strong></td>
          <td>需在場等待回應</td>
          <td>發出後可離開，稍後看結果</td>
        </tr>
        <tr>
          <td><strong>本機資源</strong></td>
          <td>無法存取</td>
          <td>可存取桌機的檔案與整合服務</td>
        </tr>
        <tr>
          <td><strong>適合任務</strong></td>
          <td>知識問答、寫作、分析</td>
          <td>跨服務資料整合、檔案處理、自動化</td>
        </tr>
      </tbody>
    </table>

    <h2>典型使用情境</h2>
    <ul>
      <li>早上通勤前，用手機告訴 Claude：「把昨天的 Slack 訊息整理成摘要，寄到我的信箱」</li>
      <li>開會前，委派：「從 Google Drive 的報表整理出本月業績數字，存成 summary.txt」</li>
      <li>下班後，交辦：「整理桌面的 Downloads 資料夾，依類型分類到對應子目錄」</li>
      <li>出門買咖啡時，說：「搜尋 Notion 裡的 Q2 OKR，列出尚未完成的項目」</li>
    </ul>

    <h2>運作架構</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 420px;">
        <strong>📱 手機 Claude App</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">Dispatch 區塊 → 輸入任務指令</div>
      </div>
      <div class="arch-arrow">⬇️ 透過網路（加密傳輸）</div>
      <div class="arch-layer application" style="max-width: 420px;">
        <strong>☁️ Anthropic 伺服器</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">中繼訊息，不儲存你的檔案內容</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 420px;">
        <strong>🖥️ 桌機 Claude Desktop</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">在本機執行任務、存取檔案與服務</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer infrastructure" style="max-width: 420px;">
        <strong>📂 本機資源</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">檔案系統 / Google Drive / Slack / Email / Notion</div>
      </div>
    </div>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 安全提醒</div>
      <p>Dispatch 讓手機端的指令可以觸發桌機上的操作，包含檔案讀寫和瀏覽器控制。官方建議：<strong>只連接你對其行為感到放心的代理，而不只是對你的意圖感到放心。</strong>設定時請謹慎選擇開放哪些檔案存取和整合服務。</p>
    </div>

    <PageNav
      :next="{ path: '/ai/claude-dispatch/setup', label: '設定與使用' }"
    />
  </div>
</template>
