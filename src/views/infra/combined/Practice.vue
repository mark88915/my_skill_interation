<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const localCompose = `name: myapp

services:
  api:
    build: .
    ports:
      - '8080:8080'
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Server=sqlserver;Database=MyAppDb;User Id=sa;Password=\${SA_PASSWORD};TrustServerCertificate=True
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      sqlserver:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=\${SA_PASSWORD}
    volumes:
      - sqlserver-data:/var/opt/mssql
    networks:
      - app-network
    healthcheck:
      test: /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "\${SA_PASSWORD}" -C -Q 'SELECT 1' || exit 1
      interval: 10s
      timeout: 5s
      retries: 10
      start_period: 30s

  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5

networks:
  app-network:
volumes:
  sqlserver-data:
  redis-data:`

const ciYaml = `name: CI — Build & Push Image

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: myregistry.azurecr.io
  IMAGE_NAME: myapp

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET 9
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '9.0.x'

      - name: Restore & Test
        run: |
          dotnet restore
          dotnet test --no-restore --verbosity normal

      - name: Log in to Registry
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ secrets.REGISTRY_USERNAME }}
          password: \${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        if: github.ref == 'refs/heads/main'
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=sha-
            type=ref,event=branch
            latest

      - name: Build and push Image
        if: github.ref == 'refs/heads/main'
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max`

const cdYaml = `name: CD — Deploy to K8s

on:
  workflow_run:
    workflows: ['CI — Build & Push Image']
    types: [completed]
    branches: [main]

jobs:
  deploy:
    if: \${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v4

      - name: Configure K8s credentials
        uses: azure/k8s-set-context@v4
        with:
          method: kubeconfig
          kubeconfig: \${{ secrets.KUBECONFIG }}

      - name: Update image tag and deploy
        run: |
          IMAGE_TAG=sha-$(echo \${{ github.sha }} | cut -c1-7)
          kubectl set image deployment/myapp-api \\
            api=\${{ env.REGISTRY }}/myapp:$IMAGE_TAG \\
            -n production
          kubectl rollout status deployment/myapp-api -n production --timeout=5m

      - name: Rollback on failure
        if: failure()
        run: kubectl rollout undo deployment/myapp-api -n production`
</script>

<template>
  <div class="content-wrapper">
    <h1>Docker + K8s 整合實戰</h1>
    <p class="page-subtitle">從撰寫 Dockerfile、推送 Registry，到 K8s 部署、滾動更新的完整 DevOps 工作流程</p>

    <h2>完整工作流程</h2>
    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>① 本地開發</strong>
        <span>撰寫程式碼 → docker compose up 本地測試 → git push</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>② CI Pipeline（GitHub Actions / Azure DevOps）</strong>
        <span>checkout → dotnet test → docker build → docker push（Registry）</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>③ CD Pipeline</strong>
        <span>更新 K8s Image Tag → kubectl apply → 等待 rollout 完成 → 失敗自動回滾</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>④ K8s Cluster（生產環境）</strong>
        <span>滾動更新 → Health Probe 驗證 → HPA 自動擴縮 → 持續監控</span>
      </div>
    </div>

    <h2>① 本地開發：Docker Compose</h2>
    <p>開發階段使用 Docker Compose，確保本地環境與生產容器映像檔一致。</p>

    <CodeBlock lang="yaml" filename="compose.yaml（本地開發）" :code="localCompose" />

    <h2>② CI Pipeline：建構並推送 Image</h2>

    <CodeBlock lang="yaml" filename=".github/workflows/ci.yaml" :code="ciYaml" />

    <h2>③ CD Pipeline：部署到 K8s</h2>

    <CodeBlock lang="yaml" filename=".github/workflows/cd.yaml" :code="cdYaml" />

    <h2>④ 完整 K8s 資源清單</h2>

    <CodeBlock lang="bash" filename="一鍵部署所有資源" :code="`
# 套用整個 k8s 目錄
kubectl apply -f k8s/

# 等待所有 Pod 就緒
kubectl rollout status deployment/myapp-api -n production

# 查看完整狀態
kubectl get all -n production`" />

    <CodeBlock lang="yaml" filename="k8s/deployment.yaml（完整版）" :code="`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp-api
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  template:
    metadata:
      labels:
        app: myapp-api
    spec:
      terminationGracePeriodSeconds: 30
      containers:
        - name: api
          image: myregistry.azurecr.io/myapp:sha-abc1234
          ports:
            - containerPort: 8080
          envFrom:
            - configMapRef:
                name: myapp-config
          env:
            - name: SA_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: myapp-secrets
                  key: SA_PASSWORD
            - name: ConnectionStrings__Default
              value: 'Server=sqlserver-service;Database=MyAppDb;User Id=sa;Password=$(SA_PASSWORD);TrustServerCertificate=True'
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          startupProbe:
            httpGet:
              path: /health
              port: 8080
            failureThreshold: 5
            periodSeconds: 30
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
            periodSeconds: 30
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values: [myapp-api]
                topologyKey: kubernetes.io/hostname`" />

    <h2>本地到生產：環境差異對照</h2>
    <table>
      <thead>
        <tr><th>面向</th><th>本地（Docker Compose）</th><th>生產（Kubernetes）</th></tr>
      </thead>
      <tbody>
        <tr><td>設定來源</td><td>.env 檔案</td><td>ConfigMap + Secret</td></tr>
        <tr><td>服務發現</td><td>服務名稱（如 <code>sqlserver</code>）</td><td>Service 名稱（如 <code>sqlserver-service</code>）</td></tr>
        <tr><td>副本數</td><td>通常 1 個</td><td>多個（含 HPA 自動擴展）</td></tr>
        <tr><td>更新方式</td><td><code>docker compose up --build</code></td><td><code>kubectl set image</code> + 滾動更新</td></tr>
        <tr><td>健康檢查</td><td>compose healthcheck</td><td>readinessProbe + livenessProbe</td></tr>
        <tr><td>儲存</td><td>具名 Volume（本地磁碟）</td><td>PersistentVolumeClaim（雲端儲存）</td></tr>
        <tr><td>對外流量</td><td>ports 直接暴露</td><td>Service → Ingress → LoadBalancer</td></tr>
      </tbody>
    </table>

    <h2>生產部署 Checklist</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ 部署前確認清單</div>
      <p>
        ☐ Dockerfile 使用多階段建構，Image &lt; 300 MB<br>
        ☐ .dockerignore 排除 bin/obj/appsettings.*.json<br>
        ☐ 非 root 使用者執行（<code>USER app</code>）<br>
        ☐ 所有設定透過環境變數或 ConfigMap/Secret 注入<br>
        ☐ 有 <code>/health</code> 端點，對應 readiness + liveness Probe<br>
        ☐ 設定 Resource Requests &amp; Limits<br>
        ☐ Deployment 至少 2 個副本，設定 podAntiAffinity<br>
        ☐ 設定 terminationGracePeriodSeconds（優雅關閉）<br>
        ☐ HPA 自動擴縮容已設定<br>
        ☐ CI Pipeline 含測試並在失敗時阻止部署<br>
        ☐ CD Pipeline 含 rollout status 等待和失敗自動回滾<br>
        ☐ Secret 不提交到 Git（使用 External Secrets 或 Vault）
      </p>
    </div>

    <PageNav
      :prev="{ path: '/infra/k8s/practice', label: 'K8s 實戰' }"
    />
  </div>
</template>
