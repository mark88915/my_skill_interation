<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const gcpLbCode = `# 建立 Serverless NEG（Network Endpoint Group）指向 Cloud Run
gcloud compute network-endpoint-groups create myapp-neg \\
  --region=\${REGION} \\
  --network-endpoint-type=SERVERLESS \\
  --cloud-run-service=myapp

# 建立後端服務
gcloud compute backend-services create myapp-backend \\
  --global \\
  --load-balancing-scheme=EXTERNAL_MANAGED

gcloud compute backend-services add-backend myapp-backend \\
  --global \\
  --network-endpoint-group=myapp-neg \\
  --network-endpoint-group-region=\${REGION}

# 建立 URL Map
gcloud compute url-maps create myapp-urlmap \\
  --default-service=myapp-backend

# 建立 HTTPS Proxy
gcloud compute ssl-certificates create myapp-cert \\
  --domains=api.myapp.com \\
  --global

gcloud compute target-https-proxies create myapp-https-proxy \\
  --ssl-certificates=myapp-cert \\
  --url-map=myapp-urlmap

# 建立 Forwarding Rule（取得靜態 IP）
gcloud compute addresses create myapp-ip --global
export LB_IP=\$(gcloud compute addresses describe myapp-ip --global --format='value(address)')
echo "Load Balancer IP: \${LB_IP}"

gcloud compute forwarding-rules create myapp-https-rule \\
  --global \\
  --target-https-proxy=myapp-https-proxy \\
  --address=myapp-ip \\
  --ports=443

# 在 Cloudflare 設定 A Record（Proxied）
# Type: A | Name: api | Content: \${LB_IP} | Proxy: Proxied`

const githubActionsYaml = `name: CI/CD — Build, Push & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  PROJECT_ID: \${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-east1
  REPOSITORY: myapp
  IMAGE_NAME: myapp
  SERVICE_NAME: myapp

jobs:
  test-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write   # 需要 OIDC Workload Identity

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 9
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Run Tests
        run: dotnet test --no-restore --verbosity normal

      - name: Authenticate to GCP (OIDC Workload Identity)
        if: github.ref == 'refs/heads/main'
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: \${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: \${{ secrets.GCP_SERVICE_ACCOUNT }}

      - name: Set up Cloud SDK
        if: github.ref == 'refs/heads/main'
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker for Artifact Registry
        if: github.ref == 'refs/heads/main'
        run: gcloud auth configure-docker \${{ env.REGION }}-docker.pkg.dev

      - name: Build & Push Docker Image
        if: github.ref == 'refs/heads/main'
        run: |
          IMAGE=\${{ env.REGION }}-docker.pkg.dev/\${{ env.PROJECT_ID }}/\${{ env.REPOSITORY }}/\${{ env.IMAGE_NAME }}
          docker build -t \${IMAGE}:sha-\$(echo \${{ github.sha }} | cut -c1-7) -t \${IMAGE}:latest .
          docker push --all-tags \${IMAGE}

      - name: Deploy to Cloud Run
        if: github.ref == 'refs/heads/main'
        run: |
          IMAGE=\${{ env.REGION }}-docker.pkg.dev/\${{ env.PROJECT_ID }}/\${{ env.REPOSITORY }}/\${{ env.IMAGE_NAME }}
          gcloud run deploy \${{ env.SERVICE_NAME }} \\
            --image=\${IMAGE}:sha-\$(echo \${{ github.sha }} | cut -c1-7) \\
            --region=\${{ env.REGION }} \\
            --platform=managed

      - name: Purge Cloudflare Cache
        if: github.ref == 'refs/heads/main'
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/\${{ secrets.CF_ZONE_ID }}/purge_cache" \\
            -H "Authorization: Bearer \${{ secrets.CF_API_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            --data '{"purge_everything": true}'`
</script>

<template>
  <div class="content-wrapper">
    <h1>全流程整合實戰</h1>
    <p class="page-subtitle">從購買網域、設定 Cloudflare DNS、部署到 GCP Cloud Run，到自動化 CI/CD 的完整雲端部署流程</p>

    <h2>完整架構概覽</h2>
    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>① 網域購買（GoDaddy / Namecheap）</strong>
        <span>購買 myapp.com → 將 Nameservers 改為 Cloudflare</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>② Cloudflare（DNS + CDN + 安全層）</strong>
        <span>DNS 解析 + DDoS 防護 + WAF + SSL 終結 + CDN 快取</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>③ GCP（運算與儲存）</strong>
        <span>Artifact Registry（Image）→ Cloud Run / GKE（執行）→ Cloud SQL（資料庫）</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>④ CI/CD（GitHub Actions）</strong>
        <span>Push to main → 測試 → Build Image → Push → Deploy → 清除 CDN 快取</span>
      </div>
    </div>

    <h2>實戰目標</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 本章實作內容</div>
      <p>
        完整串連所有雲端服務：<br>
        ✅ 購買網域並遷移 DNS 到 Cloudflare<br>
        ✅ 設定 DNS 記錄、SSL、CDN、WAF<br>
        ✅ 建立 GCP 專案、Artifact Registry、Cloud Run<br>
        ✅ 設定 Cloud Run Custom Domain 與 Cloudflare 整合<br>
        ✅ 設定 GitHub Actions CI/CD Pipeline<br>
        ✅ 部署後自動清除 Cloudflare CDN 快取
      </p>
    </div>

    <h2>Step 1：購買網域</h2>
    <CodeBlock lang="bash" filename="建議網域購買流程" :code="`
# 選擇網域商
# - 開發者/省錢優先：Namecheap（約 $9/年，免費隱私保護）
# - 已用 Cloudflare：Cloudflare Registrar（成本價，DNS 整合最佳）
# - 台灣本地需求：GoDaddy（中文介面，接受信用卡/ibon 繳費）

# 購買後取得的資訊
# - 網域：myapp.com
# - 登入帳號：your@email.com
# - 預設 Nameservers：ns1.godaddy.com, ns2.godaddy.com（或各家的 NS）

# 啟用兩步驟驗證（重要！網域是重要資產）
# WHOIS 隱私保護：隱藏個人資料，防止垃圾郵件`" />

    <h2>Step 2：將網域加入 Cloudflare 並設定 DNS</h2>
    <CodeBlock lang="bash" filename="Cloudflare 設定流程" :code="`
# 1. cloudflare.com → Add a Site → 輸入 myapp.com
# 2. 選 Free 方案
# 3. 記下 Cloudflare 給的 Nameservers，例如：
#    aria.ns.cloudflare.com
#    bolt.ns.cloudflare.com

# 4. 到網域商設定頁面更改 NS
# GoDaddy：
#   My Products → 網域 → DNS → Nameservers → Change → 輸入兩個 Cloudflare NS
# Namecheap：
#   Domain List → Manage → Nameservers → Custom DNS → 輸入兩個 Cloudflare NS

# 5. 等待 NS 更新（通常 10 分鐘~1 小時，最多 24 小時）
# 確認方式：
dig myapp.com NS    # 應顯示 cloudflare.com 結尾的 NS`" />

    <h2>Step 3：設定 GCP 並部署服務</h2>
    <CodeBlock lang="bash" filename="GCP 快速部署" :code="`
# 設定專案
export PROJECT_ID=my-app-project-12345
export REGION=asia-east1

gcloud config set project \${PROJECT_ID}

# 啟用必要 API
gcloud services enable artifactregistry.googleapis.com run.googleapis.com

# 建立 Artifact Registry
gcloud artifacts repositories create myapp \\
  --repository-format=docker --location=\${REGION}

# 設定 Docker 認證
gcloud auth configure-docker \${REGION}-docker.pkg.dev

# Build & Push Image
export IMAGE=\${REGION}-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp
docker build -t \${IMAGE}:latest .
docker push \${IMAGE}:latest

# 部署到 Cloud Run
gcloud run deploy myapp \\
  --image=\${IMAGE}:latest \\
  --region=\${REGION} \\
  --platform=managed \\
  --allow-unauthenticated \\
  --port=8080 \\
  --memory=512Mi

# 取得 Cloud Run URL
gcloud run services describe myapp --region=\${REGION} --format='value(status.url)'
# 輸出：https://myapp-xxx-de.a.run.app`" />

    <h2>Step 4：設定 Cloud Run 自訂網域</h2>
    <CodeBlock lang="bash" filename="Cloud Run 自訂網域（透過 GCP Console 或 gcloud）" :code="`
# 方法 A：直接對應（GCP 提供 SSL，Cloudflare 設 DNS Only）
gcloud run domain-mappings create \\
  --service=myapp \\
  --domain=api.myapp.com \\
  --region=\${REGION}

# GCP 會給你需要設定的 DNS 記錄，例如：
# api.myapp.com → CNAME → ghs.googlehosted.com

# 在 Cloudflare 設定（注意：Cloud Run 自訂網域需設 DNS Only）
# Type: CNAME | Name: api | Content: ghs.googlehosted.com | Proxy: ⚫ DNS Only

# 等待 SSL 憑證簽發（Google 自動處理）
gcloud run domain-mappings describe --domain=api.myapp.com --region=\${REGION}

# ---

# 方法 B：透過 Cloudflare Proxy（推薦，更多保護）
# 1. 取得 Cloud Run 服務的 IP（需 GCP Load Balancer）
# 2. 在 Cloudflare 設定 A Record → Proxied
# 詳見 Step 5`" />

    <h2>Step 5：整合 Cloudflare + Cloud Run（推薦方式）</h2>
    <p>透過 GCP Serverless NEG + Load Balancer，讓 Cloudflare 代理流量到 Cloud Run，獲得最完整保護。</p>

    <CodeBlock lang="bash" filename="GCP Load Balancer + Cloudflare 整合" :code="gcpLbCode" />

    <h2>Step 6：設定 Cloudflare DNS 與安全規則</h2>
    <CodeBlock lang="bash" filename="Cloudflare 完整設定" :code="`
# DNS 設定（在 Cloudflare Dashboard）
# @ (根域名) → A → \${LB_IP} → 🟠 Proxied
# api        → A → \${LB_IP} → 🟠 Proxied
# www        → CNAME → myapp.com → 🟠 Proxied

# SSL/TLS 設定
# SSL/TLS → Overview → Full (Strict)
# SSL/TLS → Edge Certificates → Always Use HTTPS: ON

# 快取規則（Caching → Cache Rules）
# 規則 1：API 路由繞過快取
#   URI Path starts with /api → Cache Status: Bypass
# 規則 2：靜態資源積極快取
#   File extension matches → Cache Everything → 30 days

# WAF（Security → WAF）
# Cloudflare Managed Ruleset: ON
# Bot Fight Mode: ON

# Page Rules：www 重定向到根域名
# If: www.myapp.com/*
# Then: Forwarding URL (301) → https://myapp.com/\$1`" />

    <h2>Step 7：設定 GitHub Actions CI/CD</h2>
    <CodeBlock lang="bash" filename="設定 Workload Identity（無需 Service Account Key）" :code="`
# 建立服務帳號供 GitHub Actions 使用
gcloud iam service-accounts create github-actions-sa \\
  --display-name='GitHub Actions Service Account'

# 授予所需權限
gcloud projects add-iam-policy-binding \${PROJECT_ID} \\
  --member=serviceAccount:github-actions-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/artifactregistry.writer

gcloud projects add-iam-policy-binding \${PROJECT_ID} \\
  --member=serviceAccount:github-actions-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/run.developer

# 建立 Workload Identity Pool（不需要儲存 Service Account Key）
gcloud iam workload-identity-pools create github-pool \\
  --location=global \\
  --display-name='GitHub Actions Pool'

gcloud iam workload-identity-pools providers create-oidc github-provider \\
  --location=global \\
  --workload-identity-pool=github-pool \\
  --display-name='GitHub Provider' \\
  --attribute-mapping='google.subject=assertion.sub,attribute.repository=assertion.repository' \\
  --issuer-uri='https://token.actions.githubusercontent.com'

# 允許特定 Repo 使用此 SA
gcloud iam service-accounts add-iam-policy-binding \\
  github-actions-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/iam.workloadIdentityUser \\
  --member='principalSet://iam.googleapis.com/projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/YOUR_GITHUB_ORG/myapp'

# 取得 Workload Identity Provider Resource Name（設定到 GitHub Secrets）
gcloud iam workload-identity-pools providers describe github-provider \\
  --location=global \\
  --workload-identity-pool=github-pool \\
  --format='value(name)'`" />

    <CodeBlock lang="bash" filename="GitHub Repository Secrets 設定" :code="`
# 到 GitHub Repository → Settings → Secrets and variables → Actions
# 新增以下 Secrets：

# GCP_PROJECT_ID        = my-app-project-12345
# GCP_WORKLOAD_IDENTITY_PROVIDER = projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider
# GCP_SERVICE_ACCOUNT   = github-actions-sa@my-app-project-12345.iam.gserviceaccount.com
# CF_ZONE_ID            = (Cloudflare Dashboard → 右側 Zone ID)
# CF_API_TOKEN          = (Cloudflare Dashboard → My Profile → API Tokens → Create Token)`" />

    <CodeBlock lang="yaml" filename=".github/workflows/deploy.yml" :code="githubActionsYaml" />

    <h2>Step 8：端到端驗證</h2>
    <CodeBlock lang="bash" filename="驗證完整流程" :code="`
# 1. 確認 DNS 已傳播
dig api.myapp.com A    # 應返回 Cloudflare 的 IP（非 GCP IP，因為被代理了）

# 2. 確認 SSL 正常
curl -I https://api.myapp.com/health
# 應看到：HTTP/2 200、server: cloudflare

# 3. 確認 Cloudflare 代理生效（response headers）
curl -I https://api.myapp.com | grep -E '(cf-ray|server|x-cache)'
# cf-ray: xxxxxxxx-TPE（TPE = 台北邊緣節點）
# server: cloudflare

# 4. 確認 CDN 快取
curl -I https://myapp.com/static/app.js | grep cf-cache-status
# cf-cache-status: HIT（第二次請求命中快取）

# 5. Git Push 觸發 CI/CD
git commit -m 'test: trigger deployment'
git push origin main
# → GitHub Actions 自動執行測試 → Build → Push → Deploy → 清除快取`" />

    <h2>完整架構總結</h2>
    <table>
      <thead>
        <tr><th>層次</th><th>服務</th><th>職責</th><th>費用參考</th></tr>
      </thead>
      <tbody>
        <tr><td>網域</td><td>Namecheap / GoDaddy</td><td>域名所有權、NS 設定</td><td>~$9/年</td></tr>
        <tr><td>DNS + CDN + 安全</td><td>Cloudflare（Free）</td><td>DNS、DDoS、WAF、SSL、CDN</td><td>免費</td></tr>
        <tr><td>Container Registry</td><td>GCP Artifact Registry</td><td>Docker Image 儲存</td><td>~$0.1/GB/月</td></tr>
        <tr><td>運算</td><td>GCP Cloud Run</td><td>無狀態 API 執行</td><td>按請求計費，小流量接近免費</td></tr>
        <tr><td>資料庫</td><td>GCP Cloud SQL</td><td>SQL Server 託管</td><td>~$25-50/月（db-f1-micro）</td></tr>
        <tr><td>秘密管理</td><td>GCP Secret Manager</td><td>連線字串、API Key</td><td>$0.06/10,000 存取</td></tr>
        <tr><td>CI/CD</td><td>GitHub Actions</td><td>自動測試、Build、部署</td><td>免費（2000 分鐘/月）</td></tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">✅ 上雲部署 Checklist</div>
      <p>
        ☐ 網域已購買且 WHOIS 隱私保護已啟用<br>
        ☐ Nameservers 已指向 Cloudflare，等待傳播完成<br>
        ☐ Cloudflare SSL 設為 Full (Strict)，Always Use HTTPS 已開啟<br>
        ☐ DNS 記錄設定正確，API 子域名 Proxied 已啟用<br>
        ☐ GCP 服務帳號已建立，最小權限原則<br>
        ☐ 機密資訊存入 Secret Manager，不硬編碼<br>
        ☐ Docker Image 使用多階段建構，非 root 使用者<br>
        ☐ Cloud Run 設定最小/最大實例數，避免冷啟動問題<br>
        ☐ GitHub Actions 使用 Workload Identity（無 Service Account Key）<br>
        ☐ WAF 規則與 Rate Limiting 已設定<br>
        ☐ Cloudflare Cache Rules 分離 API 與靜態資源快取策略<br>
        ☐ 部署後自動清除 CDN 快取
      </p>
    </div>

    <PageNav
      :prev="{ path: '/cloud/domain/intro', label: '網域管理概述' }"
    />
  </div>
</template>
