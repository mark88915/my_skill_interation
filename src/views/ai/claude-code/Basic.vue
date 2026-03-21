<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>基礎用法</h1>
    <p class="page-subtitle">學會 Claude Code 的日常使用方式</p>

    <h2>啟動與基本互動</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 在專案目錄中啟動
cd my-project
claude

# 帶初始提示啟動
claude &quot;幫我看一下這個專案的架構&quot;

# 非互動模式（適合腳本）
claude -p &quot;列出所有 TODO 項目&quot;`" />

    <h2>常用 Slash 指令</h2>
    <table>
      <thead>
        <tr>
          <th>指令</th>
          <th>功能</th>
          <th>說明</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>/help</code></td>
          <td>說明</td>
          <td>顯示所有可用指令</td>
        </tr>
        <tr>
          <td><code>/clear</code></td>
          <td>清除對話</td>
          <td>重置對話歷史，保留 CLAUDE.md 上下文</td>
        </tr>
        <tr>
          <td><code>/compact</code></td>
          <td>壓縮對話</td>
          <td>將目前對話摘要化，節省 Token 用量</td>
        </tr>
        <tr>
          <td><code>/status</code></td>
          <td>狀態</td>
          <td>顯示目前的設定與帳號狀態</td>
        </tr>
        <tr>
          <td><code>/cost</code></td>
          <td>費用</td>
          <td>顯示本次對話的 Token 使用量</td>
        </tr>
        <tr>
          <td><code>/vim</code></td>
          <td>Vim 模式</td>
          <td>切換 Vim 風格的鍵盤快捷鍵</td>
        </tr>
        <tr>
          <td><code>/model</code></td>
          <td>模型選擇</td>
          <td>切換使用的 Claude 模型</td>
        </tr>
      </tbody>
    </table>

    <h2>實際使用範例</h2>

    <h3>探索專案</h3>
    <CodeBlock lang="bash" filename="與 Claude Code 互動" :code="`
> 幫我了解這個專案的架構和技術棧

Claude 會自動：
  1. 讀取 package.json / *.csproj 等設定檔
  2. 瀏覽目錄結構
  3. 讀取關鍵檔案
  4. 產出架構概覽`" />

    <h3>修改程式碼</h3>
    <CodeBlock lang="bash" filename="與 Claude Code 互動" :code="`
> 在 OrderService 加上一個方法，可以依照日期範圍查詢訂單

Claude 會自動：
  1. 搜尋 OrderService 檔案位置
  2. 讀取現有程式碼
  3. 理解 Repository 介面
  4. 在 IOrderRepository 新增方法簽名
  5. 在 OrderRepository 實作查詢
  6. 在 OrderService 加上對應方法
  7. 請你確認變更`" />

    <h3>修 Bug</h3>
    <CodeBlock lang="bash" filename="與 Claude Code 互動" :code="`
> 跑測試的時候 OrderTests.Confirm_WithNoItems_ShouldThrowDomainException 失敗了，
> 錯誤訊息是 &quot;Expected DomainException but got InvalidOperationException&quot;

Claude 會自動：
  1. 找到對應的測試檔案
  2. 讀取測試程式碼
  3. 找到被測試的方法（Order.Confirm）
  4. 分析例外型別不符的原因
  5. 修正程式碼
  6. 重新跑測試確認通過`" />

    <h3>Git 操作</h3>
    <CodeBlock lang="bash" filename="與 Claude Code 互動" :code="`
> 幫我把剛才的修改 commit，然後建立 PR 到 main

Claude 會自動：
  1. 執行 git status 查看變更
  2. 執行 git diff 分析內容
  3. 組織一個有意義的 commit message
  4. 建立 commit
  5. push 到 remote
  6. 使用 gh 建立 Pull Request`" />

    <h2>輸入技巧</h2>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📄</div>
        <h4>多行輸入</h4>
        <p>按 <code>Shift + Enter</code> 換行，或按 <code>Esc</code> 進入 Vim 多行編輯模式。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📎</div>
        <h4>附加檔案</h4>
        <p>使用 <code>@filename</code> 語法直接引用檔案，如 <code>@src/order.cs</code>。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🖼️</div>
        <h4>圖片輸入</h4>
        <p>可以拖曳圖片到終端機，Claude 會分析截圖、UI 設計稿等。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>管道輸入</h4>
        <p>使用 <code>cat log.txt | claude -p "分析這個錯誤"</code> 透過管道傳入資料。</p>
      </div>
    </div>

    <h2>審核操作</h2>
    <p>
      當 Claude Code 要執行操作時，你會看到工具呼叫的提示。
      你可以選擇：
    </p>
    <ul>
      <li><strong>y（Yes）</strong>— 允許這次操作</li>
      <li><strong>n（No）</strong>— 拒絕這次操作</li>
      <li><strong>a（Always）</strong>— 本次對話中永遠允許此類操作</li>
      <li>直接輸入文字 — 提供額外的指示或修正方向</li>
    </ul>

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 安全提醒</div>
      <p>初期建議使用 Suggest 模式，仔細審查每一個檔案修改和指令執行。熟悉後再切換到 Auto-edit 模式提升效率。</p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-code/install', label: '安裝與設定' }"
      :next="{ path: '/ai/claude-code/workflow', label: '開發工作流' }"
    />
  </div>
</template>
