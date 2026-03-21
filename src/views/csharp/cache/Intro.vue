<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>快取概述</h1>
    <p class="page-subtitle">了解 .NET 快取生態系與各種方案的選擇時機</p>

    <h2>為什麼需要快取？</h2>
    <p>
      快取（Cache）是一種將計算或查詢結果暫存起來，讓後續相同請求直接取用結果的技術。
      它能大幅減少資料庫負擔、降低 API 延遲，是高效能應用程式不可或缺的一環。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">⚡</div>
        <h4>降低延遲</h4>
        <p>記憶體存取速度（ns 級）遠快於資料庫查詢（ms 級）和網路呼叫。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🗄️</div>
        <h4>減輕 DB 壓力</h4>
        <p>避免重複執行相同 SQL，讓資料庫專注處理寫入與複雜查詢。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📈</div>
        <h4>提升吞吐量</h4>
        <p>相同硬體可服務更多請求，推遲甚至避免擴容需本。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🛡️</div>
        <h4>保護上游服務</h4>
        <p>在流量突增時，快取作為緩衝層防止資料庫或外部 API 被打垮。</p>
      </div>
    </div>

    <h2>.NET 快取方案全覽</h2>
    <table>
      <thead>
        <tr>
          <th>方案</th>
          <th>類型</th>
          <th>適用規模</th>
          <th>持久化</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>IMemoryCache</strong></td>
          <td>記憶體（In-Process）</td>
          <td>單機應用</td>
          <td>❌ 重啟即失</td>
        </tr>
        <tr>
          <td><strong>IDistributedCache</strong></td>
          <td>分散式介面（抽象層）</td>
          <td>多機 / 容器叢集</td>
          <td>依實作決定</td>
        </tr>
        <tr>
          <td><strong>Redis</strong></td>
          <td>分散式記憶體資料庫</td>
          <td>中大型 / 微服務</td>
          <td>✅ 可選持久化</td>
        </tr>
        <tr>
          <td><strong>SQL Server 快取</strong></td>
          <td>資料庫快取</td>
          <td>已有 SQL Server 環境</td>
          <td>✅ 持久化</td>
        </tr>
        <tr>
          <td><strong>HybridCache</strong></td>
          <td>本機 L1 + 分散式 L2</td>
          <td>高效能叢集應用</td>
          <td>依 L2 實作決定</td>
        </tr>
        <tr>
          <td><strong>Output Cache</strong></td>
          <td>HTTP 回應快取</td>
          <td>Web API / MVC</td>
          <td>依 Provider 決定</td>
        </tr>
      </tbody>
    </table>

    <h2>快取層級架構</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 480px;">
        <strong>客戶端快取（Browser / CDN）</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">HTTP Cache-Control、ETag、CDN Edge Cache</div>
      </div>
      <div class="arch-arrow">⬇️ 快取未命中</div>
      <div class="arch-layer application" style="max-width: 480px;">
        <strong>應用程式快取（L1）— IMemoryCache</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">每個 Pod/Instance 自有的記憶體快取，速度最快</div>
      </div>
      <div class="arch-arrow">⬇️ 快取未命中</div>
      <div class="arch-layer domain" style="max-width: 480px;">
        <strong>分散式快取（L2）— Redis</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">跨 Instance 共享，叢集環境的核心</div>
      </div>
      <div class="arch-arrow">⬇️ 快取未命中</div>
      <div class="arch-layer infrastructure" style="max-width: 480px;">
        <strong>資料來源 — SQL Server / 外部 API</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">最終資料來源，負載最重</div>
      </div>
    </div>

    <h2>選擇決策樹</h2>
    <div class="info-box info">
      <div class="info-box-title">🤔 該用哪種快取？</div>
      <p>
        <strong>只有單一伺服器或單機開發？</strong>→ 用 <strong>IMemoryCache</strong><br>
        <strong>多台伺服器 / 容器叢集？</strong>→ 需要 <strong>IDistributedCache</strong><br>
        &nbsp;&nbsp;↳ 需要高效能 + 豐富資料結構？→ 用 <strong>Redis</strong><br>
        &nbsp;&nbsp;↳ 已有 SQL Server 且流量不高？→ 用 <strong>SQL Server Cache</strong><br>
        <strong>多 Instance 且需要最低延遲？</strong>→ 用 <strong>HybridCache</strong>（L1 + L2）<br>
        <strong>快取整個 HTTP 回應？</strong>→ 用 <strong>Output Cache</strong>
      </p>
    </div>

    <h2>快取的核心挑戰</h2>
    <table>
      <thead>
        <tr>
          <th>挑戰</th>
          <th>說明</th>
          <th>應對策略</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>快取失效</strong></td>
          <td>資料過期或更新後快取仍舊</td>
          <td>設定適當 TTL、主動 Invalidation</td>
        </tr>
        <tr>
          <td><strong>快取雪崩</strong></td>
          <td>大量 Key 同時過期，請求湧入 DB</td>
          <td>TTL 加入隨機 Jitter</td>
        </tr>
        <tr>
          <td><strong>快取穿透</strong></td>
          <td>查詢不存在的資料，每次都打穿 DB</td>
          <td>快取空值（Null Object）</td>
        </tr>
        <tr>
          <td><strong>快取擊穿</strong></td>
          <td>熱點 Key 過期瞬間大量並發請求</td>
          <td>互斥鎖（Mutex）防止 Cache Stampede</td>
        </tr>
        <tr>
          <td><strong>資料一致性</strong></td>
          <td>快取與 DB 資料不同步</td>
          <td>Cache-Aside + 寫入時同步失效</td>
        </tr>
      </tbody>
    </table>

    <PageNav
      :next="{ path: '/csharp/cache/memory', label: 'IMemoryCache' }"
    />
  </div>
</template>
