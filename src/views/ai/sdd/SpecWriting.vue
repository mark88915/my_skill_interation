<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>規格撰寫</h1>
    <p class="page-subtitle">如何撰寫高品質的規格文件</p>

    <h2>規格文件結構</h2>
    <p>一份完整的規格文件應包含以下部分：</p>

    <CodeBlock lang="bash" filename="Spec Template" :code="`
# Feature: [功能名稱]

## 概述
簡要描述功能的目的和價值。

## 術語定義
列出所有領域術語及其精確定義。

## 使用者故事
As a [角色], I want [目標], so that [價值]

## 行為規格
### 正常情境
### 錯誤情境
### 邊界條件

## API 規格（如適用）
### 端點、方法、請求/回應格式

## 狀態轉換圖
描述物件的生命週期和合法狀態轉換

## 驗收標準
可以直接轉為測試案例的條件列表

## 非功能需求
效能、安全性、可用性等約束`" />

    <h2>實戰範例：訂單退貨功能</h2>

    <h3>概述</h3>
    <CodeBlock lang="bash" filename="specs/return-order.md" :code="`
# Feature: 訂單退貨

## 概述
允許已收貨的客戶在收貨後 7 天內申請退貨。
退貨審核通過後，全額退款至原付款管道。

## 術語定義
- 退貨請求（Return Request）：客戶發起的退貨申請
- 退貨審核（Return Review）：客服人員審核退貨請求
- 退貨完成（Return Completed）：商品已回收且退款完成`" />

    <h3>行為規格</h3>
    <CodeBlock lang="bash" filename="specs/return-order.md (行為規格)" :code="`
## 行為規格

### 前置條件
- 客戶已登入
- 訂單狀態為 Delivered（已送達）

### 正常情境

GIVEN 一個已送達的訂單（送達日為 3 天前）
WHEN 客戶發起退貨請求，附上原因 &quot;商品瑕疵&quot;
THEN
  - 建立一筆 ReturnRequest，狀態為 Pending
  - 訂單狀態變更為 ReturnRequested
  - 發送 ReturnRequestedEvent
  - 回傳 ReturnRequest 的 ID

### 錯誤情境

GIVEN 一個已送達的訂單（送達日為 10 天前）
WHEN 客戶發起退貨請求
THEN 拒絕請求，回傳錯誤 &quot;已超過 7 天退貨期限&quot;

GIVEN 一個狀態為 Pending 的訂單
WHEN 客戶發起退貨請求
THEN 拒絕請求，回傳錯誤 &quot;訂單尚未送達，無法退貨&quot;

GIVEN 一個已有待處理退貨請求的訂單
WHEN 客戶再次發起退貨請求
THEN 拒絕請求，回傳錯誤 &quot;已有進行中的退貨請求&quot;

### 邊界條件

GIVEN 訂單送達日恰好為 7 天前（含當天）
WHEN 客戶發起退貨請求
THEN 允許退貨（7 天為含頭含尾）

GIVEN 退貨原因為空字串
WHEN 客戶發起退貨請求
THEN 拒絕請求，回傳錯誤 &quot;退貨原因不可為空&quot;`" />

    <h3>API 規格</h3>
    <CodeBlock lang="bash" filename="specs/return-order.md (API 規格)" :code="`
## API 規格

### POST /api/orders/{orderId}/returns

Request:
{
  &quot;reason&quot;: string (required, 1-500 chars)
}

Response 201:
{
  &quot;returnRequestId&quot;: &quot;guid&quot;,
  &quot;status&quot;: &quot;Pending&quot;,
  &quot;createdAt&quot;: &quot;2024-01-15T10:30:00Z&quot;
}

Response 400:
{
  &quot;error&quot;: &quot;已超過 7 天退貨期限&quot;,
  &quot;type&quot;: &quot;DomainError&quot;
}

Response 404:
{
  &quot;error&quot;: &quot;訂單不存在&quot;,
  &quot;type&quot;: &quot;NotFound&quot;
}`" />

    <h3>狀態轉換</h3>
    <CodeBlock lang="bash" filename="specs/return-order.md (狀態轉換)" :code="`
## 退貨請求狀態轉換

Pending ──[客服核准]──> Approved
Pending ──[客服駁回]──> Rejected
Approved ──[收到退貨商品]──> Received
Received ──[退款完成]──> Completed

限制：
- 只有 Pending 狀態可以被核准或駁回
- 只有 Approved 狀態可以標記收到商品
- 只有 Received 狀態可以標記退款完成
- 任何狀態都不能回到前一個狀態（不可逆）`" />

    <h2>規格品質檢查清單</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔍</div>
        <h4>無歧義？</h4>
        <p>每一句話是否只有一種解讀方式？</p>
      </div>
      <div class="concept-card">
        <div class="icon">✅</div>
        <h4>可測試？</h4>
        <p>每個行為是否能寫出對應的測試案例？</p>
      </div>
      <div class="concept-card">
        <div class="icon">📋</div>
        <h4>完整？</h4>
        <p>正常/錯誤/邊界情境是否都涵蓋了？</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>一致？</h4>
        <p>術語使用是否前後一致？有無矛盾？</p>
      </div>
    </div>

    <div class="info-box tip">
      <div class="info-box-title">💡 撰寫技巧</div>
      <p>
        ・使用 Given-When-Then 格式讓行為規格結構化<br>
        ・每個 Then 只描述一個可觀察的結果<br>
        ・用具體的數字取代「很多」「快速」等模糊詞彙<br>
        ・列出術語定義，消除團隊間的認知差異<br>
        ・先寫驗收標準，再倒推行為規格
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/sdd/principles', label: '核心原則' }"
      :next="{ path: '/ai/sdd/workflow', label: '開發流程' }"
    />
  </div>
</template>
