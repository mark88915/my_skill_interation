<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>開發工作流</h1>
    <p class="page-subtitle">將 Claude Code 整合到日常開發工作中</p>

    <h2>典型開發循環</h2>
    <div class="arch-diagram">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
        <div class="arch-layer domain" style="max-width: 150px; flex: 1;">
          <strong>理解需求</strong>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 400;">探索程式碼</div>
        </div>
        <div class="arch-arrow" style="margin: auto 0;">→</div>
        <div class="arch-layer application" style="max-width: 150px; flex: 1;">
          <strong>計畫實作</strong>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 400;">設計方案</div>
        </div>
        <div class="arch-arrow" style="margin: auto 0;">→</div>
        <div class="arch-layer presentation" style="max-width: 150px; flex: 1;">
          <strong>撰寫程式碼</strong>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 400;">編輯與建立</div>
        </div>
        <div class="arch-arrow" style="margin: auto 0;">→</div>
        <div class="arch-layer infrastructure" style="max-width: 150px; flex: 1;">
          <strong>測試與提交</strong>
          <div style="font-size: 11px; margin-top: 4px; font-weight: 400;">驗證與 commit</div>
        </div>
      </div>
    </div>

    <h2>工作流 1：功能開發</h2>
    <CodeBlock lang="bash" filename="Step by Step" :code="`
# 1. 理解現有程式碼
> 幫我理解目前的購物車功能是怎麼實作的

# 2. 規劃實作（使用 Plan 模式）
> /plan 我想加上「優惠券」功能，支援百分比折扣和固定金額折扣

# 3. 開始實作
> 按照計畫，先建立 Coupon 的 Domain Model

# 4. 建立測試
> 幫我寫 CouponTests，覆蓋以下情境：
> - 百分比折扣不超過 100%
> - 固定金額折扣不超過訂單總額
> - 過期優惠券無法使用

# 5. 跑測試
> 跑一下測試，如果有失敗就修好

# 6. 提交
> 幫我 commit 這些變更`" />

    <h2>工作流 2：Bug 修復</h2>
    <CodeBlock lang="bash" filename="Bug Fix Flow" :code="`
# 1. 描述問題
> 使用者反映在結帳時如果購物車有超過 50 件商品，頁面會 timeout。
> 相關的 Error log 是：
> &quot;SqlException: Timeout expired. The timeout period elapsed prior to
> completion of the operation&quot;

# 2. Claude 會分析問題
# - 搜尋相關的 Repository 和 Query
# - 找到 N+1 問題或缺少分頁的查詢
# - 提出修正方案

# 3. 確認修復
> 看起來不錯，但我們也加上分頁機制避免一次載入太多

# 4. 驗證
> 跑測試確認沒有回歸問題`" />

    <h2>工作流 3：Code Review 輔助</h2>
    <CodeBlock lang="bash" filename="Code Review" :code="`
# 審查 PR 的變更
> 幫我 review PR #42 的變更，特別注意：
> - SQL injection 風險
> - N+1 查詢問題
> - DDD 原則是否被違反
> - 是否有測試覆蓋

# Claude 會使用 gh CLI 取得 PR 差異並進行分析`" />

    <h2>工作流 4：重構</h2>
    <CodeBlock lang="bash" filename="Refactoring" :code="`
# 大規模重構
> 我想把所有使用 int Id 的 Entity 改成 Strongly Typed ID，
> 包含 Order, Product, Customer 三個 Aggregate

# Claude 會：
# 1. 找出所有受影響的檔案
# 2. 建立 Strongly Typed ID 的 record struct
# 3. 修改 Entity 類別
# 4. 更新 EF Core Configuration（ValueConverter）
# 5. 修改 Repository 和 Service
# 6. 修改 Controller 和 DTO
# 7. 更新測試
# 8. 執行建置和測試確認無誤`" />

    <h2>Headless 模式（CI/CD 整合）</h2>
    <p>Claude Code 可以在無人值守的環境中使用，適合自動化流程。</p>

    <CodeBlock lang="bash" filename="CI/CD 使用範例" :code="`
# 自動化 Code Review
claude -p &quot;Review the changes in this PR and post comments&quot; \\
  --dangerously-skip-permissions

# 自動修復 lint 錯誤
claude -p &quot;Fix all ESLint errors in the project&quot; \\
  --dangerously-skip-permissions

# 自動產生 changelog
claude -p &quot;Based on git log since last tag, generate a changelog&quot; \\
  --dangerously-skip-permissions`" />

    <h2>多檔案操作技巧</h2>
    <div class="info-box tip">
      <div class="info-box-title">💡 提升效率的小技巧</div>
      <p>
        ・一次描述完整需求，讓 Claude 一氣呵成處理多個檔案<br>
        ・善用 <code>@filename</code> 指定要修改的檔案，減少搜尋時間<br>
        ・複雜任務先用 <code>/plan</code> 確認方向再開始實作<br>
        ・用 <code>/compact</code> 定期壓縮對話，維持效率<br>
        ・將常用的專案規範寫在 CLAUDE.md 中
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/claude-code/basic', label: '基礎用法' }"
      :next="{ path: '/ai/claude-code/advanced', label: '進階技巧' }"
    />
  </div>
</template>
