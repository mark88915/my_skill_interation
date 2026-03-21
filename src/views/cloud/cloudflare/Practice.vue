<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const cloudflareApiCode = `# 取得 Zone ID
export CF_ZONE_ID=your_zone_id
export CF_API_TOKEN=your_api_token

# 列出 DNS 記錄
curl -X GET 'https://api.cloudflare.com/client/v4/zones/\${CF_ZONE_ID}/dns_records' \\
  -H 'Authorization: Bearer \${CF_API_TOKEN}' \\
  -H 'Content-Type: application/json'

# 建立 DNS 記錄
curl -X POST 'https://api.cloudflare.com/client/v4/zones/\${CF_ZONE_ID}/dns_records' \\
  -H 'Authorization: Bearer \${CF_API_TOKEN}' \\
  -H 'Content-Type: application/json' \\
  --data '{
    "type": "A",
    "name": "api",
    "content": "34.102.x.x",
    "ttl": 1,
    "proxied": true
  }'

# 清除特定 URL 快取
curl -X POST 'https://api.cloudflare.com/client/v4/zones/\${CF_ZONE_ID}/purge_cache' \\
  -H 'Authorization: Bearer \${CF_API_TOKEN}' \\
  -H 'Content-Type: application/json' \\
  --data '{"files": ["https://myapp.com/", "https://myapp.com/static/"]}'`

const tunnelConfig = `tunnel: YOUR_TUNNEL_ID
credentials-file: /root/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  # 主要 API 服務
  - hostname: api.myapp.com
    service: http://myapp-api-service.production.svc.cluster.local:80

  # 健康檢查端點
  - hostname: api.myapp.com
    path: /health
    service: http://myapp-api-service.production.svc.cluster.local:80

  # 管理後台（限制存取）
  - hostname: admin.myapp.com
    service: http://myapp-admin-service.production.svc.cluster.local:3000

  # 必須有 catch-all
  - service: http_status:404`
</script>

<template>
  <div class="content-wrapper">
    <h1>Cloudflare 實戰</h1>
    <p class="page-subtitle">設定 DNS、CDN 快取、SSL、WAF 規則，及使用 Cloudflare Tunnel 安全暴露 K8s 服務</p>

    <h2>實戰目標</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 本章實作內容</div>
      <p>
        完整設定 Cloudflare 保護你的 GCP 應用：<br>
        ✅ 將網域 DNS 遷移到 Cloudflare<br>
        ✅ 設定 DNS 記錄並啟用代理模式<br>
        ✅ 設定 SSL Full (Strict) 模式<br>
        ✅ 設定 Cache Rules 最佳化快取策略<br>
        ✅ 設定 WAF 規則阻擋常見攻擊<br>
        ✅ 使用 Cloudflare Tunnel 安全連接 K8s 服務<br>
        ✅ 使用 Cloudflare API 自動化 DNS 管理
      </p>
    </div>

    <h2>Step 1：將網域加入 Cloudflare</h2>
    <CodeBlock lang="bash" filename="加入網域步驟" :code="`
# 1. 登入 Cloudflare Dashboard → Add a Site → 輸入你的網域（如 myapp.com）
# 2. 選擇方案（Free 即可）
# 3. Cloudflare 會自動掃描現有 DNS 記錄

# 4. Cloudflare 會給你兩個 Nameserver，例如：
#    aria.ns.cloudflare.com
#    bolt.ns.cloudflare.com

# 5. 到網域商（GoDaddy/Namecheap）的 DNS 設定頁面
#    將 Nameservers 改為 Cloudflare 提供的兩個

# 等待 DNS 傳播（最多 24 小時，通常 < 1 小時）
# Cloudflare 會發 Email 確認啟用成功`" />

    <h2>Step 2：設定 DNS 記錄</h2>
    <CodeBlock lang="bash" filename="DNS 記錄設定（Dashboard 或 API）" :code="`
# A Record — 根域名指向 GCP Load Balancer IP（Proxied）
# Type: A    | Name: @    | Content: 34.102.x.x  | Proxy: 🟠

# CNAME — www 指向根域名（Proxied）
# Type: CNAME | Name: www | Content: myapp.com   | Proxy: 🟠

# CNAME — API 子域名指向 Cloud Run 服務（Proxied）
# Type: CNAME | Name: api | Content: myapp-xxx.a.run.app | Proxy: 🟠

# MX Record — 郵件服務（DNS Only，不代理）
# Type: MX   | Name: @   | Content: mail.myapp.com | Priority: 10 | Proxy: ⚫

# TXT Record — SPF / 網域驗證
# Type: TXT  | Name: @   | Content: v=spf1 include:_spf.google.com ~all`" />

    <h2>Step 3：設定 SSL/TLS</h2>
    <CodeBlock lang="bash" filename="SSL 設定步驟" :code="`
# 1. Cloudflare Dashboard → SSL/TLS → Overview
#    選擇：Full (Strict)（需來源伺服器有有效 SSL 憑證）

# 2. 如果來源是 GCP Cloud Run / GKE Ingress：
#    它們本身已有有效 SSL → 可以使用 Full (Strict)

# 3. 若來源是自架 Nginx 沒有憑證，可使用 Cloudflare Origin Certificate：
#    SSL/TLS → Origin Server → Create Certificate
#    → 下載 .pem 和 .key 安裝到來源伺服器

# 4. 啟用 Always Use HTTPS：
#    SSL/TLS → Edge Certificates → Always Use HTTPS: ON

# 5. 啟用 HSTS（進階，確定再開）：
#    SSL/TLS → Edge Certificates → HTTP Strict Transport Security (HSTS)
#    Max-Age: 6 months, Include Subdomains: ON`" />

    <h2>Step 4：設定快取規則</h2>
    <CodeBlock lang="bash" filename="Cache Rules 設定" :code="`
# 在 Cloudflare Dashboard → Caching → Cache Rules

# 規則 1：API 路由 — 完全繞過快取
# 條件：URI Path starts with /api
# 動作：Cache Status: Bypass

# 規則 2：健康檢查 — 繞過快取
# 條件：URI Path equals /health
# 動作：Cache Status: Bypass

# 規則 3：靜態資源 — 積極快取
# 條件：URI Path matches regex: \\.(jpg|jpeg|png|gif|webp|svg|ico|css|js|woff2?)$
# 動作：Cache Status: Cache Everything
#        Edge Cache TTL: 30 days
#        Browser Cache TTL: 1 day

# 規則 4：前端 SPA index.html — 短時間快取
# 條件：URI Path equals /
# 動作：Cache Status: Cache Everything
#        Edge Cache TTL: 1 hour
#        Browser Cache TTL: No cache`" />

    <h2>Step 5：設定 WAF 規則</h2>
    <CodeBlock lang="bash" filename="WAF 規則設定" :code="`
# Cloudflare Dashboard → Security → WAF

# 1. 啟用 Cloudflare 管理規則集（Managed Rules）
#    OWASP Core Rule Set：ON
#    Cloudflare Managed Ruleset：ON

# 2. 自訂規則範例（Custom Rules）

# 規則：阻擋中國大陸以外的特定路徑存取
# 條件：Country not in [TW, JP, US] AND URI Path starts with /admin
# 動作：Block

# 規則：限制 API 速率（Rate Limiting）
# 條件：URI Path starts with /api/
# 動作：Rate Limit — 100 requests per 1 minute per IP
#        超過：Block for 1 hour

# 規則：阻擋惡意 User-Agent
# 條件：User-Agent contains (sqlmap | nikto | nmap | masscan)
# 動作：Block

# 3. 設定 Bot Fight Mode（阻擋自動爬蟲）
#    Security → Bots → Bot Fight Mode: ON`" />

    <h2>Step 6：Cloudflare Tunnel — 安全暴露 K8s 服務</h2>
    <p>
      Cloudflare Tunnel 讓你不需要 LoadBalancer IP 或開放防火牆，
      即可將 K8s 服務安全地暴露到公網，特別適合沒有公網 IP 的內部環境。
    </p>

    <CodeBlock lang="bash" filename="安裝 cloudflared 並建立 Tunnel" :code="`
# 安裝 cloudflared CLI
brew install cloudflare/cloudflare/cloudflared

# 登入 Cloudflare
cloudflared tunnel login

# 建立 Tunnel
cloudflared tunnel create myapp-tunnel

# 查看 Tunnel ID
cloudflared tunnel list`" />

    <CodeBlock lang="yaml" filename="~/.cloudflared/config.yml" :code="tunnelConfig" />

    <CodeBlock lang="bash" filename="部署 cloudflared 到 K8s" :code="`
# 建立 Tunnel 認證 Secret
kubectl create secret generic cloudflared-credentials \\
  --from-file=credentials.json=\${HOME}/.cloudflared/YOUR_TUNNEL_ID.json \\
  -n production`" />

    <CodeBlock lang="yaml" filename="k8s/cloudflared.yaml（Tunnel Deployment）" :code="`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflared
  namespace: production
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cloudflared
  template:
    metadata:
      labels:
        app: cloudflared
    spec:
      containers:
        - name: cloudflared
          image: cloudflare/cloudflared:latest
          args:
            - tunnel
            - --config
            - /etc/cloudflared/config.yml
            - run
          volumeMounts:
            - name: config
              mountPath: /etc/cloudflared/config.yml
              subPath: config.yml
            - name: credentials
              mountPath: /root/.cloudflared/
              readOnly: true
          resources:
            requests:
              cpu: 50m
              memory: 64Mi
      volumes:
        - name: config
          configMap:
            name: cloudflared-config
        - name: credentials
          secret:
            secretName: cloudflared-credentials`" />

    <CodeBlock lang="bash" filename="設定 DNS 路由並啟動 Tunnel" :code="`
# 建立 DNS CNAME 指向 Tunnel（自動設定）
cloudflared tunnel route dns myapp-tunnel api.myapp.com
cloudflared tunnel route dns myapp-tunnel admin.myapp.com

# 套用 K8s 資源
kubectl apply -f k8s/cloudflared.yaml

# 驗證 Tunnel 已連線
cloudflared tunnel info myapp-tunnel`" />

    <h2>Step 7：使用 Cloudflare API 自動化</h2>
    <CodeBlock lang="bash" filename="Cloudflare API 操作（適合 CI/CD）" :code="cloudflareApiCode" />

    <PageNav
      :prev="{ path: '/cloud/cloudflare/intro', label: 'Cloudflare 概述' }"
      :next="{ path: '/cloud/domain/intro', label: '網域管理概述' }"
    />
  </div>
</template>
