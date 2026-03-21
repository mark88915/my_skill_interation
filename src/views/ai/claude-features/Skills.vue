<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code Skills（自定義指令）</h1>
    <p class="page-subtitle">用 Markdown 定義專屬 Slash Command，一鍵執行複雜的重複工作流程</p>

    <h2>什麼是 Skills？</h2>
    <p>
      Skills 是你為 Claude Code 定義的 <strong>自定義 Slash 指令</strong>（Custom Slash Commands）。
      每個 Skill 是一個 <code>.md</code> Markdown 檔案，描述 Claude 應該如何回應該指令。
      輸入 <code>/skill-name</code> 時，Claude 會讀取 Skill 檔案並依照指示執行。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 Skills 存放位置</div>
      <p>
        <strong>全域 Skills</strong>（所有專案可用）：<code>~/.claude/commands/</code><br>
        <strong>專案 Skills</strong>（僅限當前專案）：<code>.claude/commands/</code><br>
        Skill 檔名（不含 <code>.md</code>）即為指令名稱，例如 <code>commit.md</code> → <code>/commit</code>
      </p>
    </div>

    <h2>Skill 檔案格式</h2>

    <CodeBlock lang="markdown" filename=".claude/commands/commit.md" :code="`---
description: 分析變更並建立有意義的 Git commit
allowed-tools: Bash, Read, Glob, Grep
---

分析當前所有已暫存與未暫存的變更，遵循以下步驟：

1. 執行 \`git diff --staged\` 和 \`git status\` 查看變更內容
2. 理解變更的業務意義（新功能、修復、重構、文件等）
3. 根據 Conventional Commits 格式撰寫 commit message：
   - 格式：type(scope): description
   - type: feat | fix | refactor | docs | test | chore | perf
4. 執行 \`git add -p\` 確認暫存範圍，然後建立 commit
5. 報告 commit hash 與訊息

注意：不要使用 --no-verify，不要跳過 pre-commit hook`" />

    <CodeBlock lang="markdown" filename=".claude/commands/review-pr.md" :code="`---
description: 對當前分支進行全面 Code Review，輸出結構化報告
allowed-tools: Bash, Read, Glob, Grep
---

對當前 Git 分支（相對於 main/master）進行徹底的 Code Review：

## 分析範圍
1. 用 \`git diff main...HEAD\` 查看所有變更
2. 讀取相關檔案了解完整上下文

## 審查重點
- **正確性**：邏輯是否正確、邊界條件處理
- **安全性**：SQL injection、XSS、敏感資料暴露
- **效能**：不必要的 N+1 查詢、記憶體洩漏
- **可讀性**：命名清晰、函式職責單一
- **測試**：是否有對應的測試覆蓋

## 輸出格式
輸出 Markdown 報告，包含：
- 總結（幾個檔案、幾行變更）
- 問題列表（Critical / Warning / Suggestion 三級）
- 每個問題附上檔案路徑與行號
- 整體評分（0-10）與建議`" />

    <h2>使用 $ARGUMENTS 接收參數</h2>

    <CodeBlock lang="markdown" filename=".claude/commands/feature.md" :code="`---
description: 建立新功能的完整骨架（分支 + 檔案 + 測試）
allowed-tools: Bash, Write, Read
---

為功能「$ARGUMENTS」建立完整的開發骨架：

1. 從 main 建立功能分支：\`git checkout -b feature/$ARGUMENTS\`
2. 根據現有專案結構，在正確目錄建立對應的 service、controller、DTO 檔案
3. 建立對應的測試檔案骨架
4. 在 README 的 Features 章節新增該功能的說明佔位符
5. 報告建立的所有檔案清單

使用範例：/feature user-authentication`" />

    <CodeBlock lang="markdown" filename=".claude/commands/hotfix.md" :code="`---
description: 緊急修復流程：建立 hotfix 分支、修復、建立 PR
allowed-tools: Bash, Read, Edit, Glob, Grep
---

執行緊急修復流程，目標：$ARGUMENTS

1. 確認目前 main/master 的狀態
2. 建立 hotfix 分支：\`git checkout -b hotfix/$ARGUMENTS\`
3. 搜尋並定位問題所在（根據 $ARGUMENTS 描述）
4. 實施最小範圍的修復（不要順手重構）
5. 執行相關測試確認修復有效
6. Commit 並用 \`gh pr create\` 建立緊急 PR
7. 輸出修復摘要供 Incident Report 使用`" />

    <h2>實戰：打造完整 Git 工作流 Skill 組</h2>

    <CodeBlock lang="bash" filename="建立 Skill 目錄與指令組" :code="`# 建立專案 Skills 目錄
mkdir -p .claude/commands

# 查看目前已有的 Skills
ls ~/.claude/commands/    # 全域
ls .claude/commands/      # 專案

# 使用自定義 Skill
/commit                          # 自動 commit
/review-pr                       # Code review
/feature user-auth               # 建立 user-auth 功能骨架
/hotfix fix-login-timeout        # 緊急修復登入逾時問題`" />

    <CodeBlock lang="markdown" filename=".claude/commands/standup.md（每日站會摘要）" :code="`---
description: 產生今日站會報告（昨天做了什麼、今天計畫、阻礙）
allowed-tools: Bash
---

產生今日站會報告：

1. 執行 \`git log --since='yesterday' --author=\$(git config user.email) --oneline\`
   取得昨天的 commit 紀錄
2. 查看目前的 WIP（未 commit 的變更）
3. 讀取 TODO 或 JIRA ticket（如果有）

輸出格式：
**昨天完成：**
- （根據 commit 列出）

**今天計畫：**
- （根據 WIP 和 issue 推斷）

**阻礙：**
- 無（除非有明顯的問題）`" />

    <CodeBlock lang="markdown" filename=".claude/commands/deploy.md（部署流程）" :code="`---
description: 執行完整的部署前檢查與部署
allowed-tools: Bash, Read
---

執行生產部署流程：

## 部署前檢查（Pre-flight）
1. \`git status\` — 確認沒有未 commit 的變更
2. \`npm test\` — 所有測試通過
3. \`npm run build\` — 建構成功
4. 確認在正確分支（main 或 release/*）

## 部署
5. 推送到遠端：\`git push origin main\`
6. 觸發 CI/CD 並等待（如使用 GitHub Actions：\`gh run watch\`）

## 部署後確認
7. 檢查 health check 端點
8. 查看錯誤監控（Sentry/CloudWatch）前 5 分鐘的錯誤率
9. 輸出部署摘要（版本、時間、deployer）

若任何步驟失敗，立即停止並報告`" />

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Skill 設定</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>description:</code></td>
            <td>指令的簡短說明（顯示在 / 選單中）</td>
          </tr>
          <tr>
            <td><code>allowed-tools:</code></td>
            <td>限制此 Skill 可使用的工具（安全邊界）</td>
          </tr>
          <tr>
            <td><code>$ARGUMENTS</code></td>
            <td>接收使用者在指令後輸入的內容（如 <code>/feature user-auth</code> 中的 <code>user-auth</code>）</td>
          </tr>
          <tr>
            <td>存放位置</td>
            <td><code>~/.claude/commands/</code>（全域）或 <code>.claude/commands/</code>（專案）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="info-box success">
      <div class="info-box-title">✅ Skills 最佳實踐</div>
      <p>
        ✅ 用 <code>allowed-tools</code> 限制可用工具，降低誤操作風險<br>
        ✅ 在 Skill 中明確列出步驟，Claude 才能可靠地重現流程<br>
        ✅ 重複性高的工作流程（commit、review、deploy）最適合做成 Skill<br>
        ✅ 在 Skill 開頭說明「注意事項」（如「不要用 --force」）<br>
        ✅ 全域 Skills 放通用工具，專案 Skills 放專案特有流程
      </p>
    </div>

    <PageNav
      :next="{ path: '/ai/claude-features/agents', label: 'Agents 多智能代理' }"
    />
  </div>
</template>
