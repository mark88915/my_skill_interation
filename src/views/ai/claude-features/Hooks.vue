<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const hooksSettingsJson = `// ~/.claude/settings.json 或 .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/pre-bash.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/post-edit.sh"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "osascript -e 'display notification \"Claude 需要你的注意\" with title \"Claude Code\"'"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/on-stop.sh"
          }
        ]
      }
    ]
  }
}`

const postEditHook = `#!/bin/bash
# ~/.claude/hooks/post-edit.sh
# 在 Claude 每次編輯/新建檔案後自動格式化

FILE="$CLAUDE_TOOL_INPUT_FILE_PATH"

if [ -z "$FILE" ]; then
  exit 0
fi

# 根據副檔名選擇格式化工具
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx|*.vue)
    # ESLint + Prettier 自動修復
    npx eslint --fix "$FILE" 2>/dev/null
    npx prettier --write "$FILE" 2>/dev/null
    echo "✅ 格式化完成：$FILE"
    ;;
  *.cs)
    # C# dotnet format
    dotnet format --include "$FILE" 2>/dev/null
    echo "✅ 格式化完成：$FILE"
    ;;
  *.go)
    gofmt -w "$FILE" 2>/dev/null
    echo "✅ 格式化完成：$FILE"
    ;;
  *.py)
    black "$FILE" 2>/dev/null
    echo "✅ 格式化完成：$FILE"
    ;;
esac`

const preBashHook = `#!/bin/bash
# ~/.claude/hooks/pre-bash.sh
# 在 Claude 執行 Bash 命令前進行安全檢查

COMMAND="$CLAUDE_TOOL_INPUT_COMMAND"

# 危險指令清單
DANGEROUS_PATTERNS=(
  "rm -rf /"
  "DROP TABLE"
  "DROP DATABASE"
  "git push --force"
  "git push -f"
  "> /dev/sda"
)

for pattern in "\${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qi "$pattern"; then
    echo "❌ 安全攔截：偵測到危險指令模式「$pattern」"
    echo "   指令：$COMMAND"
    echo "   請確認是否真的需要執行此操作。"
    exit 1  # 非零退出碼 = 阻止 Claude 執行
  fi
done

# 生產環境保護
if echo "$COMMAND" | grep -q "kubectl" && [ "$KUBECTL_CONTEXT" = "production" ]; then
  echo "⚠️  偵測到生產環境 kubectl 操作，需要額外確認"
  exit 1
fi

exit 0  # 零退出碼 = 允許執行`

const onStopHook = `#!/bin/bash
# ~/.claude/hooks/on-stop.sh
# Claude 完成工作時發送通知

SESSION_ID="$CLAUDE_SESSION_ID"
TIMESTAMP=$(date '+%H:%M:%S')

# macOS 通知
if command -v osascript &> /dev/null; then
  osascript -e "display notification \"Claude 完成工作 ($TIMESTAMP)\" with title \"Claude Code\" sound name \"Glass\""
fi

# Linux 通知（需要 notify-send）
if command -v notify-send &> /dev/null; then
  notify-send "Claude Code" "任務完成 ($TIMESTAMP)"
fi

# 寫入工作日誌
echo "[$TIMESTAMP] Session $SESSION_ID 完成" >> ~/.claude/work-log.txt`

const userPromptSettingsJson = `{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "bash ~/.claude/hooks/user-prompt.sh"
          }
        ]
      }
    ]
  }
}`

const matcherExample = `// matcher 是正規表達式，匹配工具名稱
// 常用工具名稱：Bash, Read, Edit, Write, MultiEdit, Glob, Grep, Agent

// 只對 Edit 和 Write 觸發
{ "matcher": "Edit|Write" }

// 只對 Bash 觸發
{ "matcher": "Bash" }

// 對所有工具觸發
{ "matcher": ".*" }

// 對所有寫入相關工具觸發
{ "matcher": "Edit|Write|MultiEdit|NotebookEdit" }`

const loggingHook = `#!/bin/bash
# ~/.claude/hooks/log-tools.sh
# 記錄 Claude 使用的所有工具（審計日誌）

LOG_FILE="$HOME/.claude/audit.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TOOL_NAME="$CLAUDE_TOOL_NAME"
SESSION_ID="$CLAUDE_SESSION_ID"

# 截斷過長的 input（避免日誌過大）
INPUT_PREVIEW=$(echo "$CLAUDE_TOOL_INPUT" | head -c 200)

echo "[$TIMESTAMP] [$SESSION_ID] TOOL: $TOOL_NAME | INPUT: $INPUT_PREVIEW" >> "$LOG_FILE"

exit 0`

const userPromptHook = `#!/bin/bash
# ~/.claude/hooks/user-prompt.sh
# 在使用者送出訊息時自動注入當前上下文

# 輸出當前 Git 狀態（Claude 會讀取這些資訊）
echo "=== 當前 Git 狀態 ==="
git status --short 2>/dev/null || echo "(非 Git 目錄)"
echo ""

# 輸出最近的 5 個 commit
echo "=== 最近 5 個 Commit ==="
git log --oneline -5 2>/dev/null
echo ""`
</script>

<template>
  <div class="content-wrapper">
    <h1>Claude Code Hooks（自動化觸發）</h1>
    <p class="page-subtitle">在 Claude 的工具執行前後插入 Shell 命令，實現自動格式化、安全攔截、通知、審計</p>

    <h2>什麼是 Hooks？</h2>
    <p>
      Hooks 是你在 <code>settings.json</code> 中設定的 <strong>Shell 命令</strong>，
      會在 Claude 執行特定動作（使用工具、完成任務）時自動觸發。
      透過 Hooks，你可以在不改變 Claude 行為的情況下，加入自動化的前置或後置處理。
    </p>

    <h2>Hook 事件類型</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>事件</th>
            <th>觸發時機</th>
            <th>退出碼的意義</th>
            <th>典型用途</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>PreToolUse</code></td>
            <td>Claude 使用工具之前</td>
            <td>非零 = 阻止工具執行</td>
            <td>安全攔截、前置驗證</td>
          </tr>
          <tr>
            <td><code>PostToolUse</code></td>
            <td>Claude 使用工具之後</td>
            <td>輸出會回饋給 Claude</td>
            <td>自動格式化、自動測試、通知</td>
          </tr>
          <tr>
            <td><code>Notification</code></td>
            <td>Claude 需要使用者注意時</td>
            <td>一般忽略</td>
            <td>系統通知、Slack 警報</td>
          </tr>
          <tr>
            <td><code>UserPromptSubmit</code></td>
            <td>使用者送出訊息時</td>
            <td>輸出注入到對話上下文</td>
            <td>自動注入 Git 狀態、環境資訊</td>
          </tr>
          <tr>
            <td><code>Stop</code></td>
            <td>Claude 完成回應後</td>
            <td>一般忽略</td>
            <td>完成通知、寫入日誌</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>設定格式（settings.json）</h2>
    <CodeBlock lang="json" filename="~/.claude/settings.json" :code="hooksSettingsJson" />

    <h2>Hook 可用的環境變數</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>環境變數</th>
            <th>內容</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>$CLAUDE_TOOL_NAME</code></td>
            <td>被觸發的工具名稱（如 <code>Bash</code>、<code>Edit</code>、<code>Write</code>）</td>
          </tr>
          <tr>
            <td><code>$CLAUDE_TOOL_INPUT</code></td>
            <td>工具的完整輸入（JSON 格式）</td>
          </tr>
          <tr>
            <td><code>$CLAUDE_TOOL_INPUT_FILE_PATH</code></td>
            <td>被編輯/讀取的檔案路徑（Edit/Read/Write 工具）</td>
          </tr>
          <tr>
            <td><code>$CLAUDE_TOOL_INPUT_COMMAND</code></td>
            <td>Bash 工具要執行的命令</td>
          </tr>
          <tr>
            <td><code>$CLAUDE_SESSION_ID</code></td>
            <td>當前對話的唯一 ID</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h2>實戰 1：PostToolUse — 自動格式化</h2>
    <p>每次 Claude 修改檔案後，自動執行對應語言的 linter/formatter，確保程式碼風格一致。</p>
    <CodeBlock lang="bash" filename="~/.claude/hooks/post-edit.sh" :code="postEditHook" />

    <h2>實戰 2：PreToolUse — 安全攔截危險指令</h2>
    <p>
      <code>PreToolUse</code> Hook 退出碼非零時，Claude <strong>不會執行該工具</strong>。
      這讓你能攔截危險操作，例如 <code>rm -rf /</code> 或在生產環境執行 <code>kubectl</code>。
    </p>
    <CodeBlock lang="bash" filename="~/.claude/hooks/pre-bash.sh" :code="preBashHook" />

    <h2>實戰 3：Stop — 任務完成通知</h2>
    <p>Claude 完成回應後，自動發送系統通知，讓你可以離開螢幕等待，不需要盯著看。</p>
    <CodeBlock lang="bash" filename="~/.claude/hooks/on-stop.sh" :code="onStopHook" />

    <h2>實戰 4：PostToolUse — 審計日誌</h2>
    <p>記錄 Claude 使用的每個工具，供後續審計或除錯使用。</p>
    <CodeBlock lang="bash" filename="~/.claude/hooks/log-tools.sh" :code="loggingHook" />

    <h2>實戰 5：UserPromptSubmit — 自動注入上下文</h2>
    <p>
      在使用者每次送出訊息時，自動把 Git 狀態注入到對話上下文，
      讓 Claude 在你不需要手動說明的情況下就知道當前狀態。
    </p>
    <CodeBlock lang="bash" filename="~/.claude/hooks/user-prompt.sh" :code="userPromptHook" />

    <CodeBlock lang="json" filename="settings.json — 設定 UserPromptSubmit Hook" :code="userPromptSettingsJson" />

    <h2>Hook matcher — 精確匹配工具</h2>
    <CodeBlock lang="json" filename="matcher 範例" :code="matcherExample" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ Hooks 安全注意事項</div>
      <p>
        ⚠️ Hook 腳本以你的使用者權限執行，確保腳本本身不含安全漏洞<br>
        ⚠️ <code>PreToolUse</code> 阻止工具後，Claude 會收到阻止通知並調整策略<br>
        ⚠️ 避免在 Hook 中做耗時操作（&gt; 1 秒），會讓每次工具呼叫都變慢<br>
        ⚠️ Hook 腳本的 stdout 會被 Claude 讀取，注意不要輸出敏感資訊
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-features/rules', label: 'Rules 專案規則' }"
      :next="{ path: '/ai/claude-features/combined', label: '四功能整合實戰' }"
    />
  </div>
</template>
