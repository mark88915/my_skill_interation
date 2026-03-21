<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>GCP 雲端平台概述</h1>
    <p class="page-subtitle">Google Cloud Platform 核心服務介紹，及與 AWS、Azure 的對應關係</p>

    <h2>為什麼需要雲端平台？</h2>
    <p>
      雲端平台（Cloud Platform）提供隨需取用的運算、儲存、資料庫與網路資源，
      讓開發者無需自行維護實體機器，即可部署全球可用、高可用的應用程式。
      三大主流平台 GCP、AWS、Azure 提供相似的服務，只是命名和定價策略不同。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">⚙️</div>
        <h4>運算（Compute）</h4>
        <p>虛擬機、容器服務、無伺服器函式，依需求選擇最適合的執行環境。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💾</div>
        <h4>儲存（Storage）</h4>
        <p>物件儲存、區塊儲存、檔案系統，滿足不同類型資料的持久化需求。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🗄️</div>
        <h4>資料庫（Database）</h4>
        <p>託管 SQL、NoSQL 資料庫服務，免去管理備份、升級、HA 的負擔。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>網路（Networking）</h4>
        <p>VPC、Load Balancer、CDN、DNS，建構安全且高效能的網路架構。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🐳</div>
        <h4>容器（Container）</h4>
        <p>Artifact Registry 儲存 Image，GKE 管理 K8s，Cloud Run 無伺服器容器。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔐</div>
        <h4>安全（IAM）</h4>
        <p>Identity and Access Management 控制誰可以存取哪些資源，最小權限原則。</p>
      </div>
    </div>

    <h2>三大平台服務對照表</h2>
    <table>
      <thead>
        <tr><th>類別</th><th>GCP</th><th>AWS</th><th>Azure</th></tr>
      </thead>
      <tbody>
        <tr><td>虛擬機</td><td>Compute Engine (GCE)</td><td>EC2</td><td>Virtual Machines</td></tr>
        <tr><td>無伺服器容器</td><td>Cloud Run</td><td>ECS Fargate / App Runner</td><td>Container Apps</td></tr>
        <tr><td>K8s 管理服務</td><td>GKE</td><td>EKS</td><td>AKS</td></tr>
        <tr><td>無伺服器函式</td><td>Cloud Functions</td><td>Lambda</td><td>Azure Functions</td></tr>
        <tr><td>物件儲存</td><td>Cloud Storage (GCS)</td><td>S3</td><td>Blob Storage</td></tr>
        <tr><td>Container Registry</td><td>Artifact Registry</td><td>ECR</td><td>Azure Container Registry</td></tr>
        <tr><td>託管 SQL</td><td>Cloud SQL</td><td>RDS</td><td>Azure SQL Database</td></tr>
        <tr><td>託管 Redis</td><td>Memorystore</td><td>ElastiCache</td><td>Azure Cache for Redis</td></tr>
        <tr><td>DNS</td><td>Cloud DNS</td><td>Route 53</td><td>Azure DNS</td></tr>
        <tr><td>Load Balancer</td><td>Cloud Load Balancing</td><td>ELB / ALB</td><td>Azure Load Balancer</td></tr>
        <tr><td>CDN</td><td>Cloud CDN</td><td>CloudFront</td><td>Azure CDN / Front Door</td></tr>
        <tr><td>VPN / 私有網路</td><td>Cloud VPN / VPC</td><td>VPC / Direct Connect</td><td>VNet / ExpressRoute</td></tr>
        <tr><td>身分管理</td><td>Cloud IAM</td><td>IAM</td><td>Azure AD / Entra ID</td></tr>
        <tr><td>CI/CD</td><td>Cloud Build</td><td>CodePipeline</td><td>Azure DevOps / GitHub Actions</td></tr>
        <tr><td>秘密管理</td><td>Secret Manager</td><td>Secrets Manager</td><td>Azure Key Vault</td></tr>
      </tbody>
    </table>

    <h2>GCP 核心服務詳解</h2>

    <h3>Artifact Registry — Container Image 倉庫</h3>
    <p>儲存 Docker Image（以及 Maven、npm、Python 等套件），整合 Cloud Build 與 GKE 的 CI/CD 流程。</p>

    <CodeBlock lang="bash" filename="Artifact Registry 常用指令" :code="`
# 啟用 Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# 建立 Docker Repository
gcloud artifacts repositories create myapp \\
  --repository-format=docker \\
  --location=asia-east1 \\
  --description='MyApp Docker images'

# 設定 Docker 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 推送 Image
docker tag myapp:latest asia-east1-docker.pkg.dev/PROJECT_ID/myapp/myapp:latest
docker push asia-east1-docker.pkg.dev/PROJECT_ID/myapp/myapp:latest

# 列出所有 Image
gcloud artifacts docker images list asia-east1-docker.pkg.dev/PROJECT_ID/myapp`" />

    <h3>Cloud Run — 無伺服器容器</h3>
    <p>
      執行任何容器化應用，自動擴縮（含縮至 0），按請求計費，不需管理 K8s。
      適合無狀態 API、Web App、Background Jobs。
    </p>

    <CodeBlock lang="bash" filename="Cloud Run 部署" :code="`
# 啟用 Cloud Run API
gcloud services enable run.googleapis.com

# 部署容器（最簡單的方式）
gcloud run deploy myapp \\
  --image=asia-east1-docker.pkg.dev/PROJECT_ID/myapp/myapp:latest \\
  --region=asia-east1 \\
  --platform=managed \\
  --allow-unauthenticated \\
  --port=8080 \\
  --memory=512Mi \\
  --cpu=1 \\
  --min-instances=0 \\
  --max-instances=10 \\
  --set-env-vars=ASPNETCORE_ENVIRONMENT=Production

# 查看部署狀態
gcloud run services describe myapp --region=asia-east1

# 列出所有 Revision
gcloud run revisions list --service=myapp --region=asia-east1`" />

    <h3>GKE — Google Kubernetes Engine</h3>
    <p>全託管的 K8s 服務，自動升級控制平面、節點自動修復、與 GCP 服務深度整合。</p>

    <CodeBlock lang="bash" filename="GKE 叢集建立與操作" :code="`
# 啟用 GKE API
gcloud services enable container.googleapis.com

# 建立 Autopilot 叢集（推薦，無需管理節點）
gcloud container clusters create-auto myapp-cluster \\
  --region=asia-east1

# 或建立 Standard 叢集（需自管節點）
gcloud container clusters create myapp-cluster \\
  --region=asia-east1 \\
  --num-nodes=3 \\
  --machine-type=e2-standard-2

# 取得 kubectl 認證
gcloud container clusters get-credentials myapp-cluster --region=asia-east1

# 確認叢集節點
kubectl get nodes`" />

    <h3>Cloud SQL — 託管關聯式資料庫</h3>
    <p>支援 PostgreSQL、MySQL、SQL Server，自動備份、HA 容錯移轉、Replica 只讀副本。</p>

    <CodeBlock lang="bash" filename="Cloud SQL 建立與連線" :code="`
# 啟用 Cloud SQL API
gcloud services enable sqladmin.googleapis.com

# 建立 SQL Server 執行個體
gcloud sql instances create myapp-sql \\
  --database-version=SQLSERVER_2022_EXPRESS \\
  --tier=db-custom-2-4096 \\
  --region=asia-east1 \\
  --root-password=YourStrong!Password123

# 建立資料庫
gcloud sql databases create MyAppDb --instance=myapp-sql

# 建立使用者
gcloud sql users create appuser \\
  --instance=myapp-sql \\
  --password=AppUser!Password123

# 查看連線資訊
gcloud sql instances describe myapp-sql --format='value(connectionName)'`" />

    <h3>Cloud Storage — 物件儲存</h3>
    <p>儲存靜態檔案、備份、前端 SPA，支援 CDN 整合與公開存取設定。</p>

    <CodeBlock lang="bash" filename="Cloud Storage 操作" :code="`
# 建立 Bucket（名稱全球唯一）
gcloud storage buckets create gs://myapp-static \\
  --location=asia-east1 \\
  --uniform-bucket-level-access

# 上傳前端靜態檔案
gcloud storage cp -r dist/* gs://myapp-static/

# 設定公開存取（靜態網站）
gcloud storage buckets add-iam-policy-binding gs://myapp-static \\
  --member=allUsers \\
  --role=roles/storage.objectViewer

# 設定網站首頁與 404
gcloud storage buckets update gs://myapp-static \\
  --web-main-page-suffix=index.html \\
  --web-error-page=index.html`" />

    <h3>IAM — 身分與存取管理</h3>
    <p>控制服務帳號（Service Account）的權限，讓 GKE Pod、Cloud Run 服務能安全存取 GCP 資源。</p>

    <CodeBlock lang="bash" filename="IAM 服務帳號設定" :code="`
# 建立服務帳號
gcloud iam service-accounts create myapp-sa \\
  --display-name='MyApp Service Account'

# 授予 Cloud SQL 存取權限
gcloud projects add-iam-policy-binding PROJECT_ID \\
  --member=serviceAccount:myapp-sa@PROJECT_ID.iam.gserviceaccount.com \\
  --role=roles/cloudsql.client

# 授予 Artifact Registry 讀取權限
gcloud projects add-iam-policy-binding PROJECT_ID \\
  --member=serviceAccount:myapp-sa@PROJECT_ID.iam.gserviceaccount.com \\
  --role=roles/artifactregistry.reader

# 授予 Secret Manager 存取權限
gcloud projects add-iam-policy-binding PROJECT_ID \\
  --member=serviceAccount:myapp-sa@PROJECT_ID.iam.gserviceaccount.com \\
  --role=roles/secretmanager.secretAccessor`" />

    <h2>GCP vs AWS vs Azure — 選擇建議</h2>
    <table>
      <thead>
        <tr><th>場景</th><th>推薦平台</th><th>理由</th></tr>
      </thead>
      <tbody>
        <tr><td>K8s 工作負載</td><td>GCP (GKE)</td><td>GKE 是 K8s 原生開發者設計，最成熟</td></tr>
        <tr><td>企業 / Microsoft 生態</td><td>Azure</td><td>與 Active Directory、Office 365 整合最佳</td></tr>
        <tr><td>最大生態 / 服務最多</td><td>AWS</td><td>服務數量最多，社群最大</td></tr>
        <tr><td>無伺服器容器</td><td>GCP (Cloud Run)</td><td>最簡單的無狀態容器部署</td></tr>
        <tr><td>台灣區域延遲</td><td>GCP asia-east1</td><td>彰化機房，台灣延遲最低</td></tr>
        <tr><td>免費額度練習</td><td>GCP</td><td>$300 USD 90天試用 + 永久免費方案</td></tr>
      </tbody>
    </table>

    <PageNav
      :prev="{ path: '/', label: '首頁' }"
      :next="{ path: '/cloud/gcp/practice', label: 'GCP 實戰' }"
    />
  </div>
</template>
