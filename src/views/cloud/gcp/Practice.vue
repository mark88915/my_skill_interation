<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const cloudBuildYaml = `steps:
  # Step 1: Run tests
  - name: 'mcr.microsoft.com/dotnet/sdk:9.0'
    entrypoint: 'dotnet'
    args: ['test', '--no-restore', '--verbosity', 'normal']

  # Step 2: Build & push Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - 'asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp:\${SHORT_SHA}'
      - '-t'
      - 'asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp:latest'
      - '.'

  # Step 3: Push to Artifact Registry
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '--all-tags'
      - 'asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp'

  # Step 4: Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gcloud'
    args:
      - 'run'
      - 'deploy'
      - 'myapp'
      - '--image=asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp:\${SHORT_SHA}'
      - '--region=asia-east1'
      - '--platform=managed'

images:
  - 'asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp'

options:
  logging: CLOUD_LOGGING_ONLY`

const gkeDeployYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp-api
  template:
    metadata:
      labels:
        app: myapp-api
    spec:
      serviceAccountName: myapp-ksa   # Workload Identity
      containers:
        - name: api
          image: asia-east1-docker.pkg.dev/PROJECT_ID/myapp/myapp:latest
          ports:
            - containerPort: 8080
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: Production
            - name: ConnectionStrings__Default
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: db-connection-string
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          readinessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 60
            periodSeconds: 30`
</script>

<template>
  <div class="content-wrapper">
    <h1>GCP 實戰</h1>
    <p class="page-subtitle">從零到部署：建立 GCP 專案、推送 Image 到 Artifact Registry，並部署到 Cloud Run 與 GKE</p>

    <h2>實戰目標</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 本章實作內容</div>
      <p>
        將 ASP.NET Core API 完整部署到 GCP：<br>
        ✅ 初始化 GCP 專案並啟用所需 API<br>
        ✅ 建立 Artifact Registry 並推送 Docker Image<br>
        ✅ 使用 Cloud Run 快速部署無狀態服務<br>
        ✅ 建立 GKE Autopilot 叢集並部署 K8s 資源<br>
        ✅ 使用 Cloud SQL 作為生產資料庫<br>
        ✅ 使用 Secret Manager 管理機密<br>
        ✅ 設定 Cloud Build 自動化 CI/CD Pipeline
      </p>
    </div>

    <h2>Step 1：初始化 GCP 專案</h2>
    <CodeBlock lang="bash" filename="初始化環境" :code="`
# 安裝 Google Cloud CLI（macOS）
brew install --cask google-cloud-sdk

# 登入並初始化
gcloud auth login
gcloud init

# 設定專案 ID（替換為你的專案 ID）
export PROJECT_ID=my-app-project-12345
gcloud config set project \${PROJECT_ID}

# 啟用所需的 API（一次啟用全部）
gcloud services enable \\
  artifactregistry.googleapis.com \\
  run.googleapis.com \\
  container.googleapis.com \\
  sqladmin.googleapis.com \\
  secretmanager.googleapis.com \\
  cloudbuild.googleapis.com \\
  compute.googleapis.com`" />

    <h2>Step 2：建立 Artifact Registry 並推送 Image</h2>
    <CodeBlock lang="bash" filename="Artifact Registry 設定" :code="`
# 建立 Docker Repository（亞洲東部 = 台灣彰化）
gcloud artifacts repositories create myapp \\
  --repository-format=docker \\
  --location=asia-east1

# 設定 Docker 認證
gcloud auth configure-docker asia-east1-docker.pkg.dev

# 定義 Image 路徑
export IMAGE=asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp/myapp

# 建構 Image
docker build -t \${IMAGE}:latest .

# 推送到 Artifact Registry
docker push \${IMAGE}:latest

# 確認 Image 已上傳
gcloud artifacts docker images list asia-east1-docker.pkg.dev/\${PROJECT_ID}/myapp`" />

    <h2>Step 3：使用 Secret Manager 管理機密</h2>
    <CodeBlock lang="bash" filename="Secret Manager 設定" :code="`
# 建立資料庫連線字串 Secret
echo -n 'Server=myapp-sql;Database=MyAppDb;User Id=appuser;Password=AppUser!Password123;TrustServerCertificate=True' \\
  | gcloud secrets create db-connection-string --data-file=-

# 建立 JWT Secret
echo -n 'your-super-secret-jwt-key-at-least-256-bits' \\
  | gcloud secrets create jwt-secret --data-file=-

# 查看所有 Secrets
gcloud secrets list

# 讀取 Secret 值（驗證用）
gcloud secrets versions access latest --secret=db-connection-string`" />

    <h2>Step 4a：部署到 Cloud Run（無伺服器）</h2>
    <p>Cloud Run 適合無狀態服務，部署最簡單，自動處理 HTTPS 和負載平衡。</p>

    <CodeBlock lang="bash" filename="Cloud Run 部署" :code="`
# 建立服務帳號
gcloud iam service-accounts create myapp-sa \\
  --display-name='MyApp Service Account'

# 授予 Secret Manager 存取權限
gcloud secrets add-iam-policy-binding db-connection-string \\
  --member=serviceAccount:myapp-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/secretmanager.secretAccessor

gcloud secrets add-iam-policy-binding jwt-secret \\
  --member=serviceAccount:myapp-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/secretmanager.secretAccessor

# 部署到 Cloud Run（從 Secret Manager 自動注入環境變數）
gcloud run deploy myapp \\
  --image=\${IMAGE}:latest \\
  --region=asia-east1 \\
  --platform=managed \\
  --allow-unauthenticated \\
  --service-account=myapp-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --port=8080 \\
  --memory=512Mi \\
  --cpu=1 \\
  --min-instances=0 \\
  --max-instances=10 \\
  --set-secrets=ConnectionStrings__Default=db-connection-string:latest \\
  --set-secrets=JwtSecret=jwt-secret:latest \\
  --set-env-vars=ASPNETCORE_ENVIRONMENT=Production

# 取得服務 URL
gcloud run services describe myapp --region=asia-east1 --format='value(status.url)'`" />

    <h2>Step 4b：部署到 GKE（Autopilot）</h2>

    <CodeBlock lang="bash" filename="GKE Autopilot 叢集建立" :code="`
# 建立 GKE Autopilot 叢集（無需管理節點）
gcloud container clusters create-auto myapp-cluster \\
  --region=asia-east1

# 取得 kubectl 認證
gcloud container clusters get-credentials myapp-cluster --region=asia-east1

# 建立 Namespace
kubectl create namespace production

# 設定 Workload Identity（讓 Pod 使用 GCP 服務帳號）
gcloud iam service-accounts add-iam-policy-binding \\
  myapp-sa@\${PROJECT_ID}.iam.gserviceaccount.com \\
  --role=roles/iam.workloadIdentityUser \\
  --member=serviceAccount:\${PROJECT_ID}.svc.id.goog[production/myapp-ksa]

kubectl create serviceaccount myapp-ksa -n production
kubectl annotate serviceaccount myapp-ksa -n production \\
  iam.gke.io/gcp-service-account=myapp-sa@\${PROJECT_ID}.iam.gserviceaccount.com`" />

    <CodeBlock lang="yaml" filename="k8s/deployment.yaml（GKE 版本）" :code="gkeDeployYaml" />

    <CodeBlock lang="bash" filename="部署到 GKE" :code="`
# 從 Secret Manager 建立 K8s Secret
gcloud secrets versions access latest --secret=db-connection-string \\
  | kubectl create secret generic myapp-secrets \\
    --from-literal=db-connection-string=\$(cat) \\
    -n production

# 套用 K8s 資源
kubectl apply -f k8s/

# 監看 Pod 狀態
kubectl get pods -n production -w

# 確認 Deployment
kubectl rollout status deployment/myapp-api -n production`" />

    <h2>Step 5：Cloud SQL 連線設定</h2>
    <p>
      K8s 連線 Cloud SQL 的最佳實踐是使用 <strong>Cloud SQL Auth Proxy</strong> Sidecar，
      透過 Unix socket 安全連線，不需開放公網 IP。
    </p>

    <CodeBlock lang="yaml" filename="k8s/deployment.yaml — Cloud SQL Auth Proxy Sidecar" :code="`
spec:
  containers:
    - name: api
      image: asia-east1-docker.pkg.dev/PROJECT_ID/myapp/myapp:latest
      env:
        - name: ConnectionStrings__Default
          # 使用 Unix socket 連線（不需密碼以外的設定）
          value: 'Server=/cloudsql/PROJECT_ID:asia-east1:myapp-sql;Database=MyAppDb;User Id=appuser;Password=AppUser!Password123;TrustServerCertificate=True'

    # Cloud SQL Auth Proxy Sidecar
    - name: cloud-sql-proxy
      image: gcr.io/cloud-sql-connectors/cloud-sql-proxy:2
      args:
        - '--structured-logs'
        - '--port=5432'
        - 'PROJECT_ID:asia-east1:myapp-sql'
      securityContext:
        runAsNonRoot: true
      resources:
        requests:
          memory: '32Mi'
          cpu: '100m'`" />

    <h2>Step 6：設定 Cloud Build CI/CD Pipeline</h2>
    <CodeBlock lang="yaml" filename="cloudbuild.yaml" :code="cloudBuildYaml" />

    <CodeBlock lang="bash" filename="連結 GitHub Repository 觸發自動建構" :code="`
# 建立 Cloud Build Trigger（連結 GitHub）
gcloud builds triggers create github \\
  --repo-name=myapp \\
  --repo-owner=your-github-username \\
  --branch-pattern='^main$' \\
  --build-config=cloudbuild.yaml \\
  --name=main-deploy

# 手動觸發建構（測試用）
gcloud builds submit --config=cloudbuild.yaml .

# 查看建構歷史
gcloud builds list --limit=10`" />

    <h2>Step 7：驗證部署</h2>
    <CodeBlock lang="bash" filename="驗證指令" :code="`
# Cloud Run — 取得服務 URL 並測試
SERVICE_URL=\$(gcloud run services describe myapp --region=asia-east1 --format='value(status.url)')
curl \${SERVICE_URL}/health

# GKE — port-forward 測試
kubectl port-forward deployment/myapp-api 8080:8080 -n production &
curl http://localhost:8080/health

# 查看 Cloud Run 日誌
gcloud run services logs read myapp --region=asia-east1 --limit=50

# 查看 GKE Pod 日誌
kubectl logs -l app=myapp-api -n production --tail=50`" />

    <h2>Cloud Run vs GKE 選擇指南</h2>
    <table>
      <thead>
        <tr><th>考量</th><th>Cloud Run</th><th>GKE</th></tr>
      </thead>
      <tbody>
        <tr><td>管理複雜度</td><td>極低（全託管）</td><td>中等（需管理 K8s 資源）</td></tr>
        <tr><td>擴展</td><td>自動縮至 0，按請求計費</td><td>HPA 自動擴縮，需設定</td></tr>
        <tr><td>冷啟動</td><td>有（縮至 0 時）</td><td>無（最少副本保持運行）</td></tr>
        <tr><td>自訂網路</td><td>有限</td><td>完全控制 VPC</td></tr>
        <tr><td>Sidecar 容器</td><td>Cloud Run v2 支援</td><td>完全支援</td></tr>
        <tr><td>適合場景</td><td>API、Webhook、小型服務</td><td>複雜微服務、有狀態應用</td></tr>
        <tr><td>費用</td><td>按用量（可低至 0）</td><td>節點持續收費</td></tr>
      </tbody>
    </table>

    <PageNav
      :prev="{ path: '/cloud/gcp/intro', label: 'GCP 概述' }"
      :next="{ path: '/cloud/cloudflare/intro', label: 'Cloudflare 概述' }"
    />
  </div>
</template>
