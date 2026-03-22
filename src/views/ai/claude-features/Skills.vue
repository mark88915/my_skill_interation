<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code Skills（自定義指令）</h1>
    <p class="page-subtitle">用 SKILL.md 定義專屬 Slash Command，一鍵執行複雜的重複工作流程</p>

    <h2>什麼是 Skills？</h2>
    <p>
      Skills 擴展了 Claude 能做的事情。建立一個 <code>SKILL.md</code> 檔案，其中包含說明，
      Claude 就會將其加入工具包中。Claude 在相關時自動使用 Skills，或者你可以用 <code>/skill-name</code> 直接呼叫。
    </p>

    <div class="info-box info">
      <div class="info-box-title">📌 Skills 存放位置</div>
      <p>
        <strong>個人 Skills</strong>（所有專案可用）：<code>~/.claude/skills/&lt;skill-name&gt;/SKILL.md</code><br>
        <strong>專案 Skills</strong>（僅限當前專案）：<code>.claude/skills/&lt;skill-name&gt;/SKILL.md</code><br>
        每個 Skill 是一個目錄，以 <code>SKILL.md</code> 為入口，目錄名即為指令名稱。
      </p>
    </div>

    <div class="info-box tip">
      <div class="info-box-title">💡 與舊版 commands 的關係</div>
      <p>
        <code>.claude/commands/</code> 中的舊格式檔案仍然有效。Skills 是其進化版，
        新增了目錄結構（可附帶支援檔案）、frontmatter 控制（誰可以呼叫、是否自動觸發）等功能。
        建議新建的指令都使用 Skills 格式。
      </p>
    </div>

    <h2>SKILL.md 檔案格式</h2>

    <CodeBlock lang="yaml" filename=".claude/skills/commit/SKILL.md" :code="`---
name: commit
description: 分析變更並建立有意義的 Git commit
allowed-tools: Bash, Read, Glob, Grep
disable-model-invocation: true
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

    <CodeBlock lang="yaml" filename=".claude/skills/review-pr/SKILL.md" :code="`---
name: review-pr
description: 對當前分支進行全面 Code Review，輸出結構化報告
allowed-tools: Bash, Read, Glob, Grep
disable-model-invocation: true
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

    <h2>Frontmatter 設定欄位</h2>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>欄位</th>
            <th>說明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>name</code></td>
            <td>Skill 名稱，即 <code>/slash-command</code> 的名稱（省略則用目錄名）</td>
          </tr>
          <tr>
            <td><code>description</code></td>
            <td>簡短說明，Claude 用來判斷何時自動載入此 Skill</td>
          </tr>
          <tr>
            <td><code>allowed-tools</code></td>
            <td>限制此 Skill 可使用的工具（安全邊界）</td>
          </tr>
          <tr>
            <td><code>disable-model-invocation</code></td>
            <td>設為 <code>true</code> 時只有使用者手動 <code>/name</code> 才會觸發，Claude 不會自動呼叫</td>
          </tr>
          <tr>
            <td><code>user-invocable</code></td>
            <td>設為 <code>false</code> 時只有 Claude 可以呼叫，不出現在 <code>/</code> 選單中</td>
          </tr>
          <tr>
            <td><code>argument-hint</code></td>
            <td>自動完成時顯示的提示，例如 <code>[issue-number]</code></td>
          </tr>
          <tr>
            <td><code>context</code></td>
            <td>設為 <code>fork</code> 時在隔離的 subagent 中執行</td>
          </tr>
          <tr>
            <td><code>agent</code></td>
            <td>搭配 <code>context: fork</code> 使用，指定代理類型（<code>Explore</code>、<code>Plan</code> 等）</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>使用 $ARGUMENTS 接收參數</h2>

    <CodeBlock lang="yaml" filename=".claude/skills/feature/SKILL.md" :code="`---
name: feature
description: 建立新功能的完整骨架（分支 + 檔案 + 測試）
argument-hint: '[feature-name]'
allowed-tools: Bash, Write, Read
disable-model-invocation: true
---

為功能「$ARGUMENTS」建立完整的開發骨架：

1. 從 main 建立功能分支：\`git checkout -b feature/$ARGUMENTS\`
2. 根據現有專案結構，在正確目錄建立對應的 service、controller、DTO 檔案
3. 建立對應的測試檔案骨架
4. 在 README 的 Features 章節新增該功能的說明佔位符
5. 報告建立的所有檔案清單

使用範例：/feature user-authentication`" />

    <p>
      也可以用 <code>$ARGUMENTS[N]</code> 或簡寫 <code>$N</code> 取得個別參數：
    </p>

    <CodeBlock lang="yaml" filename=".claude/skills/migrate-component/SKILL.md" :code="`---
name: migrate-component
description: 將元件從一個框架遷移到另一個
---

Migrate the $0 component from $1 to $2.
Preserve all existing behavior and tests.

# 使用：/migrate-component SearchBar React Vue`" />

    <h2>支援檔案（目錄結構）</h2>
    <p>
      Skills 是目錄而非單一檔案，可以包含範本、範例、腳本等支援檔案：
    </p>

    <CodeBlock lang="bash" filename="Skill 目錄結構" :code="`my-skill/
├── SKILL.md           # 主要說明（必需）
├── template.md        # Claude 要填入的範本
├── examples/
│   └── sample.md      # 預期格式的範例
└── scripts/
    └── validate.sh    # Claude 可以執行的腳本`" />

    <h2>注入動態上下文</h2>
    <p>
      使用 <code>!\`command\`</code> 語法，在 Skill 傳送給 Claude 前先執行 shell 命令，
      將命令輸出注入到提示中：
    </p>

    <CodeBlock lang="yaml" filename=".claude/skills/pr-summary/SKILL.md" :code="`---
name: pr-summary
description: 摘要 Pull Request 的變更
context: fork
agent: Explore
---

## PR 即時資料
- PR diff: !\`gh pr diff\`
- PR 留言: !\`gh pr view --comments\`
- 變更檔案: !\`gh pr diff --name-only\`

## 任務
根據以上資料摘要這個 PR...`" />

    <h2>實戰：打造完整 Git 工作流 Skill 組</h2>

    <CodeBlock lang="bash" filename="建立 Skill 目錄與指令組" :code="`# 建立專案 Skills 目錄
mkdir -p .claude/skills/commit
mkdir -p .claude/skills/review-pr
mkdir -p .claude/skills/feature
mkdir -p .claude/skills/deploy

# 查看目前已有的 Skills
ls ~/.claude/skills/      # 個人（全域）
ls .claude/skills/        # 專案

# 使用自定義 Skill
/commit                          # 自動 commit
/review-pr                       # Code review
/feature user-auth               # 建立 user-auth 功能骨架
/deploy                          # 部署`" />

    <CodeBlock lang="yaml" filename=".claude/skills/standup/SKILL.md（每日站會摘要）" :code="`---
name: standup
description: 產生今日站會報告（昨天做了什麼、今天計畫、阻礙）
allowed-tools: Bash
disable-model-invocation: true
---

產生今日站會報告：

1. 執行 \`git log --since='yesterday' --author=$(git config user.email) --oneline\`
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

    <div class="info-box success">
      <div class="info-box-title">✅ Skills 最佳實踐</div>
      <p>
        ✅ 用 <code>allowed-tools</code> 限制可用工具，降低誤操作風險<br>
        ✅ 在 SKILL.md 中明確列出步驟，Claude 才能可靠地重現流程<br>
        ✅ 會產生副作用的 Skill（commit、deploy）加上 <code>disable-model-invocation: true</code><br>
        ✅ 重複性高的工作流程（commit、review、deploy）最適合做成 Skill<br>
        ✅ 將 SKILL.md 保持在 500 行以下，詳細參考資料放支援檔案<br>
        ✅ 個人 Skills 放通用工具，專案 Skills 放專案特有流程
      </p>
    </div>

    <PageNav
      :next="{ path: '/ai/claude-features/agents', label: 'Agents 多智能代理' }"
    />
  </div>
</template>
