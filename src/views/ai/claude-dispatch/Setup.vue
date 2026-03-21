<script setup>
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>設定與使用</h1>
    <p class="page-subtitle">完整的 Claude Dispatch 設定流程與任務下達技巧</p>

    <h2>系統需求</h2>
    <table>
      <thead>
        <tr>
          <th>項目</th>
          <th>需求</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>訂閱方案</strong></td>
          <td>Claude Max（優先）或 Claude Pro</td>
        </tr>
        <tr>
          <td><strong>桌機 App</strong></td>
          <td>Claude Desktop — macOS 或 Windows x64（最新版本）</td>
        </tr>
        <tr>
          <td><strong>手機 App</strong></td>
          <td>Claude 行動版（iOS 或 Android，最新版本）</td>
        </tr>
        <tr>
          <td><strong>桌機狀態</strong></td>
          <td>需保持開機、螢幕不鎖定、Claude Desktop 保持執行</td>
        </tr>
        <tr>
          <td><strong>網路</strong></td>
          <td>兩台裝置均需有網路連線</td>
        </tr>
      </tbody>
    </table>

    <h2>設定步驟</h2>

    <h3>Step 1：更新所有 App</h3>
    <p>確保 Claude Desktop 和 Claude 行動版都已更新至最新版本。可前往 <code>claude.com/download</code> 下載最新桌機版。</p>

    <h3>Step 2：在桌機開啟 Cowork</h3>
    <p>
      開啟 Claude Desktop，在左側側邊欄找到 <strong>Cowork</strong> 區塊，
      點擊其中的 <strong>Dispatch</strong> 選項。
    </p>

    <h3>Step 3：掃描 QR Code 配對</h3>
    <p>
      桌機端會顯示一個 QR Code。打開手機上的 Claude App，
      前往 <strong>Dispatch</strong> 區塊，點擊「Get started」，
      用手機掃描桌機螢幕上的 QR Code 完成裝置配對。
    </p>

    <div class="info-box tip">
      <div class="info-box-title">💡 配對安全性</div>
      <p>配對需要實體掃描 QR Code，確保只有你能夠授權連接，第三方無法遠端接入你的桌機。</p>
    </div>

    <h3>Step 4：設定存取權限</h3>
    <p>配對後，你可以設定 Claude 在桌機上可以存取哪些資源：</p>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📁</div>
        <h4>檔案存取</h4>
        <p>選擇允許 Claude 讀寫的本機資料夾範圍。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔌</div>
        <h4>整合服務</h4>
        <p>選擇開放 Google Drive、Slack、Email、Notion、Apple Notes 等連接器。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💤</div>
        <h4>防休眠設定</h4>
        <p>可選擇讓 Claude Desktop 防止桌機進入睡眠，確保任務能順利執行。</p>
      </div>
    </div>

    <h3>Step 5：完成設定，開始使用</h3>
    <p>點擊「Finish setup」，完成！之後只需在手機 Dispatch 的訊息框輸入任務即可。</p>

    <h2>如何有效下達任務</h2>
    <p>Dispatch 使用一個持續的對話執行緒，以下是寫出好指令的技巧：</p>

    <h3>提供清楚的來源與目標</h3>
    <table>
      <thead>
        <tr>
          <th>模糊指令</th>
          <th>清楚指令</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>整理一下我的檔案</td>
          <td>把桌面 Downloads 資料夾裡的 PDF 移到 Documents/PDF，圖片移到 Pictures/2025</td>
        </tr>
        <tr>
          <td>看一下 Slack</td>
          <td>在 Slack 的 #engineering 頻道搜尋今天與「部署」相關的訊息，整理成摘要</td>
        </tr>
        <tr>
          <td>幫我弄個報告</td>
          <td>從 Google Drive 的「月報範本.docx」讀取格式，填入 Notion 資料庫「Q2 數據」的本月資料，存成 monthly-report-june.docx</td>
        </tr>
      </tbody>
    </table>

    <h3>實際任務範例</h3>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📊</div>
        <h4>資料整合</h4>
        <p>「從 Downloads/sales.xlsx 提取各區業績數字，產生 summary.txt 放在桌面」</p>
      </div>
      <div class="concept-card">
        <div class="icon">📝</div>
        <h4>搜尋與摘要</h4>
        <p>「搜尋 Apple Notes 裡的會議記錄，找出所有 Action Item，整理清單寄到我的 Email」</p>
      </div>
      <div class="concept-card">
        <div class="icon">📂</div>
        <h4>檔案整理</h4>
        <p>「把 Desktop/截圖 資料夾裡超過 30 天的圖片移到 Archive/Screenshots/2025-old」</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔍</div>
        <h4>Notion 查詢</h4>
        <p>「從 Notion 的 OKR 資料庫列出所有狀態為 In Progress 的任務，存成 txt 檔」</p>
      </div>
    </div>

    <h2>目前支援與限制</h2>

    <h3>運作良好的場景</h3>
    <ul>
      <li>依特定條件搜尋並找出本機檔案</li>
      <li>從 Apple Notes、Notion 等整合服務摘要資料</li>
      <li>本機資料夾的檔案移動與整理</li>
      <li>從試算表提取資料並輸出報告</li>
    </ul>

    <h3>目前仍有困難的場景</h3>
    <ul>
      <li>開啟 Mac 應用程式（可靠性不穩定）</li>
      <li>取得目前瀏覽器的分頁資訊</li>
      <li>存取 Terminal Session 的狀態</li>
      <li>向其他 App 發送資料（如透過 iMessage）</li>
      <li>授權第三方服務（OAuth 流程）</li>
    </ul>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 重要限制</div>
      <p>
        ・<strong>桌機需保持開機</strong>：桌機休眠或 Claude Desktop 關閉時，任務無法執行<br>
        ・<strong>不主動通知</strong>：任務完成後，手機和桌機都不會收到通知，需主動查看<br>
        ・<strong>單一對話</strong>：目前只有一個 Dispatch 對話執行緒，無法建立多個分類<br>
        ・<strong>不支援排程</strong>：無法設定在固定時間自動執行任務<br>
        ・<strong>成功率約 50%</strong>：Research Preview 階段，複雜任務的可靠性仍在提升中
      </p>
    </div>

    <h2>與 Claude Code 的關係</h2>
    <p>
      Claude Dispatch 屬於 <strong>Claude Cowork</strong> 的功能範疇，
      定位是日常工作的非同步自動化。Claude Code 則是專注於開發者的程式碼編輯 CLI 工具。
      兩者互補：
    </p>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Claude Dispatch</th>
          <th>Claude Code</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>主要對象</strong></td>
          <td>一般使用者、知識工作者</td>
          <td>開發者</td>
        </tr>
        <tr>
          <td><strong>操作方式</strong></td>
          <td>手機發指令，桌機執行</td>
          <td>終端機互動</td>
        </tr>
        <tr>
          <td><strong>主要任務</strong></td>
          <td>檔案整理、跨服務資料整合</td>
          <td>程式碼編輯、建置、測試</td>
        </tr>
        <tr>
          <td><strong>執行模式</strong></td>
          <td>非同步</td>
          <td>同步（即時互動）</td>
        </tr>
      </tbody>
    </table>

    <PageNav
      :prev="{ path: '/ai/claude-dispatch/intro', label: 'Claude Dispatch 概述' }"
    />
  </div>
</template>
