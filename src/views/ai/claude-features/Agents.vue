<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code Agents（多智能代理）</h1>
    <p class="page-subtitle">讓 Claude 派遣子代理並行處理複雜任務，隔離風險、加速完成</p>

    <h2>什麼是 Agents？</h2>
    <p>
      Claude Code 可以派遣 <strong>子代理（Sub-agents）</strong>——獨立的 Claude 實例——來並行或隔離地處理複雜任務。
      子代理擁有完整的工具存取能力，能夠自主完成研究、實作、測試等任務後回報結果給主 Claude。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 什麼時候讓 Claude 使用 Agents？</div>
      <p>
        當你描述任務時，Claude 會自行判斷是否需要派遣子代理。你也可以明確提示：<br>
        「請並行處理這些任務」、「幫我用隔離的工作目錄測試這個變更」<br>
        「請同時研究 A 和 B 兩個方案」
      </p>
    </div>

    <h2>Agents 的核心能力</h2>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>能力</th>
            <th>說明</th>
            <th>適用情境</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>並行執行</strong></td>
            <td>同時派遣多個子代理，各自處理獨立任務</td>
            <td>研究多個方案、同時測試多個模組、並行搜尋</td>
          </tr>
          <tr>
            <td><strong>背景執行</strong></td>
            <td>代理在背景獨立運行，完成後通知主 Claude</td>
            <td>耗時任務（跑測試、建構）讓主執行緒繼續回應</td>
          </tr>
          <tr>
            <td><strong>Git Worktree 隔離</strong></td>
            <td>在獨立的 Git worktree 中操作，不影響主工作目錄</td>
            <td>實驗性變更、危險操作、比較不同實作</td>
          </tr>
          <tr>
            <td><strong>代理恢復</strong></td>
            <td>透過 Agent ID 恢復之前的代理對話</td>
            <td>長任務分階段執行、繼續上次未完成的分析</td>
          </tr>
          <tr>
            <td><strong>專業化代理</strong></td>
            <td>針對特定任務優化的代理類型（Explore、Plan 等）</td>
            <td>程式碼探索、架構規劃、研究調查</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>Agents 類型</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>代理類型</th>
            <th>適合任務</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>general-purpose</code></td>
            <td>複雜的多步驟任務、研究、程式碼搜尋、自主執行</td>
          </tr>
          <tr>
            <td><code>Explore</code></td>
            <td>快速探索程式碼庫：找檔案、搜尋關鍵字、回答架構問題</td>
          </tr>
          <tr>
            <td><code>Plan</code></td>
            <td>設計實作策略、識別關鍵檔案、評估架構取捨</td>
          </tr>
          <tr>
            <td><code>claude-code-guide</code></td>
            <td>回答 Claude Code 功能問題、API 使用、Agent SDK</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>實戰 1：並行研究多個技術方案</h2>
    <p>
      當你需要評估多個實作方案時，可以請 Claude 並行派遣多個研究代理，大幅縮短評估時間。
    </p>

    <CodeBlock lang="markdown" filename="提示 Claude 並行研究" :code="`# 使用者提示範例：

我要為電商平台選擇支付整合方案，請同時研究以下三個選項並給我比較報告：

1. Stripe：整合複雜度、手續費結構、Taiwan 支援狀況
2. ECPay：在台灣的市佔率、API 文件品質、退款流程
3. 自建金流：開發工時、PCI DSS 合規成本、維護負擔

請同時進行這三個方向的研究，完成後提供決策矩陣`" />

    <CodeBlock lang="markdown" filename="Claude 的內部處理方式" :code="`# Claude 會派遣三個並行代理：

Agent 1 → 研究 Stripe（網路搜尋 + 文件分析）
Agent 2 → 研究 ECPay（網路搜尋 + 台灣市場資訊）
Agent 3 → 分析自建金流成本（程式碼庫探索 + 估算）

→ 三個代理同時執行，時間縮短到單個代理的 1/3
→ 主 Claude 等待所有代理完成後，整合報告輸出決策矩陣`" />

    <h2>實戰 2：Worktree 隔離的安全實驗</h2>
    <p>
      對生產程式碼做大幅重構時，使用 <code>isolation: worktree</code> 讓代理在完全隔離的副本中工作，
      不影響你的工作目錄，失敗了也沒關係。
    </p>

    <CodeBlock lang="markdown" filename="提示 Claude 使用隔離 Worktree" :code="`# 使用者提示範例：

請在隔離的環境中，將這個 Express.js 專案遷移到 Fastify：

1. 替換所有 express() 的使用
2. 更新中間件語法（express middleware → Fastify plugins）
3. 調整路由定義方式
4. 確保所有現有測試通過

如果遷移成功，告訴我具體做了哪些變更；如果失敗，丟棄變更即可`" />

    <CodeBlock lang="markdown" filename="Git Worktree 隔離的好處" :code="`# Worktree 隔離的運作方式：

1. Claude 建立臨時 Git worktree（獨立的工作目錄）
2. 代理在隔離目錄中執行所有變更
3. 主工作目錄完全不受影響

→ 成功：代理報告變更清單，你決定是否 merge
→ 失敗：worktree 自動清理，零副作用

# 適合隔離執行的情境：
- 大幅重構（換框架、換資料庫）
- 實驗性功能（不確定是否可行）
- 危險的大量檔案修改
- 比較不同的實作方法`" />

    <h2>實戰 3：背景代理處理耗時任務</h2>

    <CodeBlock lang="markdown" filename="讓代理在背景跑測試" :code="`# 使用者提示範例：

請在背景執行完整的測試套件，執行完後告訴我結果。
我在等待期間要繼續討論其他事情。

# Claude 的回應方式：

Claude 派遣背景代理：
  → 執行 npm test（可能需要 5-10 分鐘）
  → 主對話繼續正常運作

你可以繼續問 Claude 其他問題。
背景代理完成後，Claude 會主動報告測試結果。`" />

    <h2>實戰 4：代理協作完成大型功能</h2>

    <CodeBlock lang="markdown" filename="提示 Claude 分工協作" :code="`# 使用者提示範例：

幫我實作「使用者通知系統」這個完整功能，要求：
- 後端 API（POST /notifications、GET /notifications）
- 前端組件（NotificationBell、NotificationList）
- 單元測試

請用多個代理並行處理：
- 一個代理負責探索現有程式碼架構，確保新功能風格一致
- 主執行緒負責核心實作
- 完成後在隔離環境中跑測試驗證`" />

    <CodeBlock lang="markdown" filename="代理協作流程圖" :code="`┌─────────────────────────────────────────┐
│              主 Claude                   │
│  分析需求 → 規劃任務 → 協調子代理         │
└──────────┬──────────────────────────────┘
           │
    ┌──────▼──────┐         ┌────────────┐
    │  Explore 代理 │ ──────► │  Plan 代理  │
    │  探索程式碼架構 │         │  設計 API  │
    └──────┬──────┘         └─────┬──────┘
           │                      │
           └──────────┬───────────┘
                      ▼
              ┌───────────────┐
              │   主 Claude    │
              │  整合結果實作   │
              └───────┬───────┘
                      │
              ┌───────▼───────┐
              │  背景代理（隔離）│
              │  執行測試套件   │
              └───────────────┘`" />

    <div class="info-box success">
      <div class="info-box-title">✅ Agents 最佳實踐</div>
      <p>
        ✅ <strong>明確描述任務分工</strong>：告訴 Claude「請並行研究…」或「用隔離環境測試…」<br>
        ✅ <strong>危險操作用 Worktree 隔離</strong>：大幅重構、實驗性變更一定要隔離<br>
        ✅ <strong>耗時任務用背景執行</strong>：跑測試、建構、大量搜尋放背景<br>
        ✅ <strong>獨立任務才並行</strong>：有依賴關係的任務（A 完成才能開始 B）必須順序執行<br>
        ✅ <strong>描述預期結果</strong>：告訴代理「成功時回報 X，失敗時做 Y」
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-features/skills', label: 'Skills 自定義指令' }"
      :next="{ path: '/ai/claude-features/rules', label: 'Rules 專案規則' }"
    />
  </div>
</template>
