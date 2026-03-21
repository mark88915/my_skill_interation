<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Cloudflare 概述</h1>
    <p class="page-subtitle">全球 CDN、DNS、DDoS 防護、Zero Trust 與邊緣運算，及與 AWS CloudFront、Azure CDN 的對比</p>

    <h2>Cloudflare 是什麼？</h2>
    <p>
      Cloudflare 是全球最大的 CDN 與網路安全服務商，在全球 300+ 個城市擁有資料中心（PoP）。
      其核心價值是讓你的服務「躲在 Cloudflare 後面」：使用者連到 Cloudflare 的邊緣節點，
      Cloudflare 再回源到你的真實伺服器，同時提供快取、DDoS 防護、WAF、SSL 等保護。
    </p>

    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>使用者（全球）</strong>
        <span>連接到最近的 Cloudflare 邊緣節點（台灣、日本、香港等）</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>Cloudflare 邊緣網路</strong>
        <span>CDN 快取 + DDoS 防護 + WAF + SSL 終結 + Workers 邊緣運算</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>DNS 解析層</strong>
        <span>Cloudflare DNS（全球最快）→ A Record / CNAME 指向來源伺服器</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>來源伺服器（Origin）</strong>
        <span>GCP / AWS / Azure / 自架伺服器</span>
      </div>
    </div>

    <h2>Cloudflare 核心服務</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>DNS 管理</h4>
        <p>全球最快的公共 DNS（1.1.1.1），支援 A、CNAME、MX、TXT 等記錄，免費且即時生效。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚡</div>
        <h4>CDN 加速</h4>
        <p>靜態資源（圖片、JS、CSS）快取在邊緣節點，降低來源伺服器負載，提升全球載入速度。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🛡️</div>
        <h4>DDoS 防護</h4>
        <p>自動吸收並清洗 Layer 3/4/7 攻擊流量，保護來源伺服器不直接暴露在攻擊下。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>SSL/TLS 自動化</h4>
        <p>免費 SSL 憑證自動簽發、自動更新，支援 Full (Strict) 模式確保端到端加密。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🧱</div>
        <h4>WAF（網頁應用防火牆）</h4>
        <p>基於規則集阻擋 OWASP Top 10、SQL Injection、XSS 等常見攻擊，可自訂規則。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚙️</div>
        <h4>Workers（邊緣運算）</h4>
        <p>在 Cloudflare 邊緣執行 JavaScript，不需後端伺服器即可處理請求轉換、A/B Test、認證。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>Tunnel（零信任通道）</h4>
        <p>無需開放防火牆埠，讓內部服務（如 K8s）透過加密隧道暴露到公網，取代 VPN。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>R2 Storage</h4>
        <p>相容 S3 API 的物件儲存，無出口流量費用（Egress Free），適合靜態檔案與備份。</p>
      </div>
    </div>

    <h2>CDN 服務對照表</h2>
    <table>
      <thead>
        <tr><th>功能</th><th>Cloudflare</th><th>AWS CloudFront</th><th>Azure CDN / Front Door</th><th>Fastly</th></tr>
      </thead>
      <tbody>
        <tr><td>免費方案</td><td>✅ 功能完整的免費版</td><td>❌ 按用量計費</td><td>❌ 按用量計費</td><td>❌ 按用量計費</td></tr>
        <tr><td>邊緣節點數</td><td>300+ 城市</td><td>450+ 城市</td><td>130+ 城市</td><td>65+ 城市</td></tr>
        <tr><td>DDoS 防護</td><td>✅ 免費無限量</td><td>AWS Shield Standard</td><td>DDoS Protection Standard</td><td>付費方案</td></tr>
        <tr><td>WAF</td><td>免費基本 / Pro 版進階</td><td>AWS WAF（付費）</td><td>付費方案</td><td>付費方案</td></tr>
        <tr><td>邊緣運算</td><td>Workers（免費額度）</td><td>Lambda@Edge / CloudFront Functions</td><td>Azure Functions（非邊緣）</td><td>Compute@Edge</td></tr>
        <tr><td>DNS 管理</td><td>✅ 內建</td><td>需 Route 53</td><td>需 Azure DNS</td><td>❌</td></tr>
        <tr><td>SSL 自動化</td><td>✅ 免費</td><td>ACM 免費，需設定</td><td>✅ 免費</td><td>✅</td></tr>
        <tr><td>零信任通道</td><td>Cloudflare Tunnel（免費）</td><td>AWS Private Link</td><td>Azure Private Link</td><td>❌</td></tr>
        <tr><td>台灣 PoP</td><td>✅ 台北</td><td>✅ 台北</td><td>✅ 台北（Front Door）</td><td>❌</td></tr>
      </tbody>
    </table>

    <h2>Cloudflare DNS — Proxy vs DNS-Only</h2>
    <p>
      Cloudflare DNS 的關鍵功能是「橘色雲朵」代理模式：
    </p>
    <table>
      <thead>
        <tr><th>模式</th><th>圖示</th><th>效果</th><th>適用場景</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Proxied（代理）</strong></td>
          <td>🟠 橘色雲朵</td>
          <td>流量經 Cloudflare，隱藏真實 IP，啟用 CDN/WAF/DDoS 防護</td>
          <td>Web 應用（HTTP/HTTPS）</td>
        </tr>
        <tr>
          <td><strong>DNS Only</strong></td>
          <td>⚫ 灰色雲朵</td>
          <td>純 DNS 解析，直接連到來源 IP，不經 Cloudflare</td>
          <td>Mail、SSH、非 HTTP 協定</td>
        </tr>
      </tbody>
    </table>

    <h2>SSL/TLS 模式說明</h2>
    <table>
      <thead>
        <tr><th>模式</th><th>瀏覽器→Cloudflare</th><th>Cloudflare→來源</th><th>推薦度</th></tr>
      </thead>
      <tbody>
        <tr><td>Flexible</td><td>HTTPS</td><td>HTTP（不加密）</td><td>❌ 不推薦，來源傳輸未加密</td></tr>
        <tr><td>Full</td><td>HTTPS</td><td>HTTPS（接受自簽憑證）</td><td>⚠️ 可接受但有風險</td></tr>
        <tr><td>Full (Strict)</td><td>HTTPS</td><td>HTTPS（需有效憑證）</td><td>✅ 推薦，端到端加密</td></tr>
        <tr><td>Off</td><td>HTTP</td><td>HTTP</td><td>❌ 禁用</td></tr>
      </tbody>
    </table>

    <h2>Page Rules / Transform Rules</h2>
    <CodeBlock lang="bash" filename="常見 Cloudflare 規則設定（透過 Dashboard 或 API）" :code="`
# 強制 HTTPS 重新導向（在 SSL/TLS → Edge Certificates 開啟）
# Always Use HTTPS: ON

# 快取規則範例（Cache Rules）
# URL 匹配：*.myapp.com/api/*
#   → Cache Level: Bypass（API 不快取）

# URL 匹配：*.myapp.com/static/*
#   → Cache Level: Cache Everything
#   → Edge Cache TTL: 1 month

# Page Rule：重新導向舊版 URL
# If URL matches: www.myapp.com/old-path
# Then: Forwarding URL (301) → https://myapp.com/new-path`" />

    <h2>Cloudflare Workers — 邊緣運算</h2>
    <p>在 Cloudflare 全球邊緣執行 JavaScript（V8 isolate），延遲極低，適合：請求修改、認證代理、A/B 測試、地理重定向。</p>

    <CodeBlock lang="javascript" filename="Worker 範例：加入 CORS Header" :code="`
export default {
  async fetch(request, env) {
    const response = await fetch(request)

    // 複製回應並加入 CORS header
    const newResponse = new Response(response.body, response)
    newResponse.headers.set('Access-Control-Allow-Origin', '*')
    newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
    newResponse.headers.set('X-Frame-Options', 'DENY')

    return newResponse
  }
}`" />

    <PageNav
      :prev="{ path: '/cloud/gcp/practice', label: 'GCP 實戰' }"
      :next="{ path: '/cloud/cloudflare/practice', label: 'Cloudflare 實戰' }"
    />
  </div>
</template>
