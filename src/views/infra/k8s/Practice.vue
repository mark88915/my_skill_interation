<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Kubernetes 實戰</h1>
    <p class="page-subtitle">將 ASP.NET Core API 部署到 K8s，含完整 YAML 資源清單與滾動更新</p>

    <h2>實戰目標</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 本章實作內容</div>
      <p>
        部署 ASP.NET Core Web API 至 Kubernetes：<br>
        ✅ Namespace 隔離環境<br>
        ✅ ConfigMap 管理非敏感設定<br>
        ✅ Secret 管理資料庫密碼<br>
        ✅ Deployment 宣告 3 個副本，含 Resource Limits 和 Health Probe<br>
        ✅ Service（ClusterIP）供叢集內部呼叫<br>
        ✅ Ingress 暴露外部 HTTP 端點<br>
        ✅ HPA 自動擴縮容<br>
        ✅ 滾動更新與手動回滾
      </p>
    </div>

    <h2>目錄結構</h2>
    <CodeBlock lang="bash" filename="K8s 資源清單目錄" :code="`
k8s/
├── namespace.yaml
├── configmap.yaml
├── secret.yaml           # ⚠️ 不應提交至 Git（或使用 External Secrets）
├── deployment.yaml
├── service.yaml
├── ingress.yaml
└── hpa.yaml
`" />

    <h2>Step 1：Namespace</h2>
    <CodeBlock lang="yaml" filename="k8s/namespace.yaml" :code="`
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
`" />

    <h2>Step 2：ConfigMap</h2>
    <CodeBlock lang="yaml" filename="k8s/configmap.yaml" :code="`
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: production
data:
  ASPNETCORE_ENVIRONMENT: Production
  Logging__LogLevel__Default: Information
  ConnectionStrings__Redis: redis-service:6379
`" />

    <h2>Step 3：Secret</h2>
    <CodeBlock lang="bash" filename="建立 Secret（命令列，避免密碼進 Git）" :code="`
kubectl create secret generic myapp-secrets \\
  --from-literal=SA_PASSWORD='YourStrong!Password123' \\
  --from-literal=JWT_SECRET='your-super-secret-key' \\
  -n production
`" />

    <h2>Step 4：Deployment</h2>
    <CodeBlock lang="yaml" filename="k8s/deployment.yaml" :code="`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: production
  labels:
    app: myapp-api
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
        version: '1.0'
    spec:
      containers:
        - name: api
          image: myregistry.io/myapp:1.0
          ports:
            - containerPort: 8080
          # 從 ConfigMap 注入環境變數
          envFrom:
            - configMapRef:
                name: myapp-config
          # 從 Secret 注入敏感設定
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
`" />

    <h2>Step 5：Service</h2>
    <CodeBlock lang="yaml" filename="k8s/service.yaml" :code="`
apiVersion: v1
kind: Service
metadata:
  name: myapp-api-service
  namespace: production
spec:
  selector:
    app: myapp-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080
  type: ClusterIP
`" />

    <h2>Step 6：Ingress</h2>
    <CodeBlock lang="yaml" filename="k8s/ingress.yaml" :code="`
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: '10m'
spec:
  ingressClassName: nginx
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp-api-service
                port:
                  number: 80
`" />

    <h2>Step 7：HPA</h2>
    <CodeBlock lang="yaml" filename="k8s/hpa.yaml" :code="`
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
`" />

    <h2>Step 8：部署與驗證</h2>
    <CodeBlock lang="bash" filename="部署完整應用" :code="`
# 套用所有資源（按目錄）
kubectl apply -f k8s/

# 監看 Pod 啟動狀態
kubectl get pods -n production -w

# 確認 Deployment 狀態
kubectl rollout status deployment/myapp-api -n production

# 查看 Service 和 Ingress
kubectl get svc,ingress -n production

# 查看 HPA 狀態
kubectl get hpa -n production

# 測試健康檢查（port-forward 方式）
kubectl port-forward deployment/myapp-api 8080:8080 -n production
curl http://localhost:8080/health
`" />

    <h2>滾動更新與回滾</h2>
    <CodeBlock lang="bash" filename="更新 Image 版本" :code="`
# 方式一：直接更新 Image（適合緊急修復）
kubectl set image deployment/myapp-api api=myregistry.io/myapp:1.1 -n production

# 方式二：修改 YAML 後 apply（推薦，保持 YAML 與實際狀態一致）
# 修改 deployment.yaml 中的 image tag，然後：
kubectl apply -f k8s/deployment.yaml

# 監看滾動更新進度
kubectl rollout status deployment/myapp-api -n production

# 查看 Rollout 歷史
kubectl rollout history deployment/myapp-api -n production

# 回滾到上一個版本
kubectl rollout undo deployment/myapp-api -n production

# 回滾到指定版本
kubectl rollout undo deployment/myapp-api --to-revision=2 -n production
`" />

    <h2>常見除錯指令</h2>
    <CodeBlock lang="bash" filename="K8s 除錯指令" :code="`
# Pod 無法啟動 — 查看事件
kubectl describe pod &lt;pod-name&gt; -n production

# 查看容器日誌
kubectl logs &lt;pod-name&gt; -n production
kubectl logs &lt;pod-name&gt; -n production --previous   # Crash 後的日誌

# 進入容器除錯
kubectl exec -it &lt;pod-name&gt; -n production -- bash

# 查看 Secret 內容（解碼）
kubectl get secret myapp-secrets -n production -o jsonpath='{.data.SA_PASSWORD}' | base64 -d

# 查看資源使用量（需安裝 metrics-server）
kubectl top pods -n production
kubectl top nodes
`" />

    <PageNav
      :prev="{ path: '/infra/k8s/config', label: '設定管理' }"
      :next="{ path: '/infra/combined/practice', label: 'Docker + K8s 全流程' }"
    />
  </div>
</template>
