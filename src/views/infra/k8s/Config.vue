<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>K8s 設定管理</h1>
    <p class="page-subtitle">ConfigMap、Secret、Resource Limits、Probe 與 PersistentVolume</p>

    <h2>ConfigMap — 非敏感設定</h2>
    <p>
      ConfigMap 將應用程式設定與 Image 分離，可以環境變數、命令列參數或掛載為檔案的方式注入 Pod。
      適合存放非敏感的設定值，如功能旗標、日誌等級、外部服務 URL 等。
    </p>

    <CodeBlock lang="yaml" filename="configmap.yaml" :code="`
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
  namespace: production
data:
  # 簡單鍵值對
  ASPNETCORE_ENVIRONMENT: Production
  Logging__LogLevel__Default: Information
  FeatureFlags__NewCheckout: 'true'

  # 完整 JSON 檔案（掛載為 appsettings.json）
  appsettings.Production.json: |
    {
      &quot;AllowedHosts&quot;: &quot;*&quot;,
      &quot;Logging&quot;: {
        &quot;LogLevel&quot;: {
          &quot;Default&quot;: &quot;Information&quot;
        }
      }
    }
`" />

    <CodeBlock lang="yaml" filename="deployment.yaml — 使用 ConfigMap" :code="`
spec:
  containers:
    - name: api
      image: myregistry.io/myapp:1.0
      # 方式一：個別環境變數
      env:
        - name: ASPNETCORE_ENVIRONMENT
          valueFrom:
            configMapKeyRef:
              name: myapp-config
              key: ASPNETCORE_ENVIRONMENT

      # 方式二：全部鍵值對轉為環境變數
      envFrom:
        - configMapRef:
            name: myapp-config

      # 方式三：掛載為設定檔
      volumeMounts:
        - name: config-volume
          mountPath: /app/appsettings.Production.json
          subPath: appsettings.Production.json

  volumes:
    - name: config-volume
      configMap:
        name: myapp-config
`" />

    <h2>Secret — 敏感資訊管理</h2>
    <p>
      Secret 與 ConfigMap 結構相同，但專門用於敏感資訊（密碼、Token、憑證）。
      K8s 以 base64 編碼儲存（<strong>非加密</strong>），生產環境應搭配 External Secrets Operator 或
      Azure Key Vault、AWS Secrets Manager 整合。
    </p>

    <CodeBlock lang="bash" filename="建立 Secret（命令列方式，不留敏感資訊在檔案中）" :code="`
# 從字串建立 Secret
kubectl create secret generic myapp-secrets \\
  --from-literal=SA_PASSWORD='YourStrong!Password123' \\
  --from-literal=JWT_SECRET='super-secret-jwt-key' \\
  -n production

# 從檔案建立（如 TLS 憑證）
kubectl create secret tls myapp-tls-secret \\
  --cert=tls.crt \\
  --key=tls.key \\
  -n production
`" />

    <CodeBlock lang="yaml" filename="secret.yaml（適合 GitOps，但值需 base64 編碼）" :code="`
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
  namespace: production
type: Opaque
data:
  # echo -n 'YourStrong!Password123' | base64
  SA_PASSWORD: WW91clN0cm9uZyFQYXNzd29yZDEyMw==
  JWT_SECRET: c3VwZXItc2VjcmV0LWp3dC1rZXk=
`" />

    <CodeBlock lang="yaml" filename="deployment.yaml — 使用 Secret" :code="`
spec:
  containers:
    - name: api
      env:
        - name: SA_PASSWORD
          valueFrom:
            secretKeyRef:
              name: myapp-secrets
              key: SA_PASSWORD
        # 直接引用組合成連線字串
        - name: ConnectionStrings__Default
          value: 'Server=sqlserver;Database=MyAppDb;User Id=sa;Password=$(SA_PASSWORD);TrustServerCertificate=True'
`" />

    <h2>Resource Requests &amp; Limits</h2>
    <p>
      <code>requests</code> 告訴 Scheduler 這個容器至少需要多少資源（影響排程決策）；
      <code>limits</code> 設定容器最多能使用多少資源（超過則被 OOM Kill 或 CPU Throttle）。
    </p>

    <table>
      <thead>
        <tr><th>參數</th><th>CPU 單位</th><th>Memory 單位</th><th>說明</th></tr>
      </thead>
      <tbody>
        <tr><td>requests.cpu</td><td>100m = 0.1 核心</td><td>128Mi</td><td>排程保證</td></tr>
        <tr><td>limits.cpu</td><td>500m = 0.5 核心</td><td>512Mi</td><td>超過會被 Throttle</td></tr>
        <tr><td>limits.memory</td><td>—</td><td>512Mi</td><td>超過會被 OOM Kill</td></tr>
      </tbody>
    </table>

    <CodeBlock lang="yaml" filename="Resource 設定範例" :code="`
resources:
  requests:
    cpu: 100m        # 保證至少 0.1 CPU
    memory: 128Mi    # 保證至少 128MB 記憶體
  limits:
    cpu: 500m        # 最多使用 0.5 CPU
    memory: 512Mi    # 最多使用 512MB 記憶體
`" />

    <h2>Liveness &amp; Readiness Probe</h2>
    <table>
      <thead>
        <tr><th>Probe</th><th>用途</th><th>失敗時行為</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>livenessProbe</strong></td><td>檢查容器是否還活著（如死鎖）</td><td>重啟容器</td></tr>
        <tr><td><strong>readinessProbe</strong></td><td>檢查容器是否準備好接受流量</td><td>從 Service 移除（不重啟）</td></tr>
        <tr><td><strong>startupProbe</strong></td><td>啟動期間的特殊探針，避免慢啟動被誤判</td><td>重啟容器</td></tr>
      </tbody>
    </table>

    <CodeBlock lang="yaml" filename="Probe 設定範例（ASP.NET Core）" :code="`
containers:
  - name: api
    image: myregistry.io/myapp:1.0
    # 啟動探針：給予最多 5 * 30s = 150s 啟動時間
    startupProbe:
      httpGet:
        path: /health
        port: 8080
      failureThreshold: 5
      periodSeconds: 30

    # 就緒探針：未就緒時從 Service 移除
    readinessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3

    # 存活探針：死鎖時重啟
    livenessProbe:
      httpGet:
        path: /health
        port: 8080
      initialDelaySeconds: 60
      periodSeconds: 30
      failureThreshold: 3
`" />

    <h2>HorizontalPodAutoscaler（HPA）</h2>
    <CodeBlock lang="yaml" filename="hpa.yaml — 自動擴縮容" :code="`
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
  minReplicas: 2     # 最少副本數
  maxReplicas: 10    # 最多副本數
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70    # CPU 超過 70% 時擴展
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
`" />

    <h2>PersistentVolume &amp; PersistentVolumeClaim</h2>
    <p>
      K8s 儲存與容器生命週期解耦：PV（PersistentVolume）是 Cluster 管理員提供的儲存資源，
      PVC（PersistentVolumeClaim）是應用程式對儲存的請求。
    </p>

    <CodeBlock lang="yaml" filename="pvc.yaml — 動態 Provisioning（雲端環境）" :code="`
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sqlserver-data-pvc
  namespace: production
spec:
  accessModes:
    - ReadWriteOnce         # 同時只有一個節點可讀寫
  resources:
    requests:
      storage: 50Gi
  storageClassName: managed-premium   # Azure Premium SSD
`" />

    <CodeBlock lang="yaml" filename="deployment.yaml — 掛載 PVC" :code="`
spec:
  containers:
    - name: sqlserver
      image: mcr.microsoft.com/mssql/server:2022-latest
      volumeMounts:
        - name: sqlserver-storage
          mountPath: /var/opt/mssql
  volumes:
    - name: sqlserver-storage
      persistentVolumeClaim:
        claimName: sqlserver-data-pvc
`" />

    <PageNav
      :prev="{ path: '/infra/k8s/concepts', label: '核心概念' }"
      :next="{ path: '/infra/k8s/practice', label: 'K8s 實戰' }"
    />
  </div>
</template>
