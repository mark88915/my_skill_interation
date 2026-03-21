<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code 概述</h1>
    <p class="page-subtitle">認識 Anthropic 官方的 AI 輔助開發 CLI 工具</p>

    <h2>什麼是 Claude Code？</h2>
    <p>
      <strong>Claude Code</strong> 是 Anthropic 推出的命令列（CLI）AI 開發工具。
      它讓你直接在終端機中與 Claude 互動，執行程式碼編輯、搜尋、除錯、Git 操作等開發任務，
      無需離開你的開發環境。
    </p>
    <p>
      與傳統的聊天式 AI 助手不同，Claude Code 是一個 <strong>Agentic（代理式）</strong>工具——
      它不只回答問題，還能直接讀取檔案、修改程式碼、執行指令，像一個 AI 結對程式設計夥伴。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🖥️</div>
        <h4>終端機原生</h4>
        <p>直接在 Terminal 中執行，不需要瀏覽器或額外 IDE 插件。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📂</div>
        <h4>理解整個專案</h4>
        <p>自動讀取和搜尋你的程式碼庫，理解專案脈絡後再做修改。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>直接操作</h4>
        <p>不只建議，還能直接編輯檔案、執行指令、建立 Git commit。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>權限控制</h4>
        <p>你可以選擇哪些操作需要確認，確保 AI 不會做出意外的變更。</p>
      </div>
    </div>

    <h2>核心能力</h2>
    <table>
      <thead>
        <tr>
          <th>能力</th>
          <th>說明</th>
          <th>範例</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>程式碼編輯</strong></td>
          <td>直接修改專案中的檔案</td>
          <td>「幫我在 UserService 加上快取機制」</td>
        </tr>
        <tr>
          <td><strong>程式碼搜尋</strong></td>
          <td>跨檔案搜尋特定程式碼</td>
          <td>「找出所有使用 deprecated API 的地方」</td>
        </tr>
        <tr>
          <td><strong>Bug 修復</strong></td>
          <td>分析錯誤並修正</td>
          <td>「這個測試為什麼失敗了？幫我修好」</td>
        </tr>
        <tr>
          <td><strong>重構</strong></td>
          <td>改善程式碼結構</td>
          <td>「把這個 God Class 拆成符合 SRP 的多個類別」</td>
        </tr>
        <tr>
          <td><strong>Git 操作</strong></td>
          <td>建立 commit、PR 等</td>
          <td>「幫我 commit 這些變更並建立 PR」</td>
        </tr>
        <tr>
          <td><strong>專案建置</strong></td>
          <td>執行建置與測試</td>
          <td>「跑一下測試，修好失敗的部分」</td>
        </tr>
      </tbody>
    </table>

    <h2>Claude Code vs. 其他 AI 工具</h2>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Claude Code</th>
          <th>ChatGPT / Web AI</th>
          <th>GitHub Copilot</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>介面</strong></td>
          <td>CLI（終端機）</td>
          <td>瀏覽器</td>
          <td>IDE 插件</td>
        </tr>
        <tr>
          <td><strong>專案感知</strong></td>
          <td>讀取整個程式碼庫</td>
          <td>需手動貼程式碼</td>
          <td>當前檔案 + 有限上下文</td>
        </tr>
        <tr>
          <td><strong>直接操作</strong></td>
          <td>可直接修改檔案</td>
          <td>只能給建議</td>
          <td>自動完成</td>
        </tr>
        <tr>
          <td><strong>指令執行</strong></td>
          <td>可執行終端指令</td>
          <td>無法</td>
          <td>無法</td>
        </tr>
        <tr>
          <td><strong>最適場景</strong></td>
          <td>複雜多檔案任務</td>
          <td>問答與學習</td>
          <td>行級自動完成</td>
        </tr>
      </tbody>
    </table>

    <h2>工作流程概覽</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 400px;">
        <strong>1. 你下達指令</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">用自然語言描述任務</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer domain" style="max-width: 400px;">
        <strong>2. Claude 分析程式碼庫</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">自動讀取相關檔案、搜尋程式碼</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer application" style="max-width: 400px;">
        <strong>3. 擬定計畫並執行</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">修改檔案、執行指令</div>
      </div>
      <div class="arch-arrow">⬇️</div>
      <div class="arch-layer infrastructure" style="max-width: 400px;">
        <strong>4. 你審查並確認</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">確認變更、微調指示</div>
      </div>
    </div>

    <div class="info-box tip">
      <div class="info-box-title">💡 適用場景</div>
      <p>
        Claude Code 特別適合：複雜的多檔案重構、跨模組的功能開發、程式碼庫探索與理解、
        自動化的 Git workflow、以及任何需要理解專案全貌的開發任務。
      </p>
    </div>

    <PageNav
      :next="{ path: '/ai/claude-code/install', label: '安裝與設定' }"
    />
  </div>
</template>
