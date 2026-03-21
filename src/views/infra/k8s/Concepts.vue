<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Kubernetes 核心概念</h1>
    <p class="page-subtitle">Pod、Deployment、Service、Ingress、Namespace — K8s 的基礎積木</p>

    <h2>Pod — 最小部署單元</h2>
    <p>
      Pod 是 K8s 的最小部署單元，包含一個或多個緊密耦合的容器，共用網路（相同 IP）和 Volume。
      一般情況下，一個 Pod 只有一個主容器，側車容器（Sidecar）用於日誌收集、Service Mesh 等輔助功能。
    </p>

    <CodeBlock lang="yaml" filename="pod.yaml — 最基本的 Pod（實際少用，通常透過 Deployment 管理）" :code="`
apiVersion: v1
kind: Pod
metadata:
  name: myapp-api
  labels:
    app: myapp-api
spec:
  containers:
    - name: api
      image: myregistry.io/myapp:1.0
      ports:
        - containerPort: 8080
      env:
        - name: ASPNETCORE_HTTP_PORTS
          value: '8080'
`" />

    <div class="info-box info">
      <div class="info-box-title">📌 Pod 的特性</div>
      <p>
        Pod 是<strong>短暫的（ephemeral）</strong>，不會自動重啟或被重新排程。<br>
        實際工作負載應透過 <strong>Deployment</strong> 管理 Pod，由 Deployment 確保期望的副本數持續存在。
      </p>
    </div>

    <h2>Deployment — 宣告式部署管理</h2>
    <p>
      Deployment 宣告應用程式的期望狀態（幾個副本、用哪個 Image、如何更新），
      Controller Manager 持續確保實際狀態與期望狀態一致。
    </p>

    <CodeBlock lang="yaml" filename="deployment.yaml" :code="`
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp-api
  namespace: production
spec:
  replicas: 3                    # 期望 3 個 Pod 副本

  selector:
    matchLabels:
      app: myapp-api             # 管理帶有此 Label 的 Pod

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1          # 更新期間最多 1 個 Pod 不可用
      maxSurge: 1                # 更新期間最多額外建立 1 個新 Pod

  template:                      # Pod 模板
    metadata:
      labels:
        app: myapp-api
    spec:
      containers:
        - name: api
          image: myregistry.io/myapp:1.0
          ports:
            - containerPort: 8080
          resources:
            requests:
              cpu: 100m          # 至少需要 0.1 CPU
              memory: 128Mi
            limits:
              cpu: 500m          # 最多使用 0.5 CPU
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
            initialDelaySeconds: 30
            periodSeconds: 30
`" />

    <h2>ReplicaSet vs Deployment</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ 使用 Deployment，不要直接用 ReplicaSet</div>
      <p>
        ReplicaSet 確保指定數量的 Pod 副本存在，但不支援滾動更新。<br>
        Deployment 在 ReplicaSet 上面加了一層，支援版本控制、滾動更新和回滾。<br>
        日常工作中只需要使用 Deployment，K8s 會自動管理底層的 ReplicaSet。
      </p>
    </div>

    <h2>Service — 穩定的網路端點</h2>
    <p>
      Pod 的 IP 是動態的，每次重新排程都會改變。Service 提供一個穩定的虛擬 IP 和 DNS 名稱，
      自動將流量路由到匹配 Label 的健康 Pod。
    </p>

    <table>
      <thead>
        <tr><th>Service 類型</th><th>用途</th><th>可存取範圍</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>ClusterIP</strong>（預設）</td><td>Cluster 內部服務間通訊</td><td>僅 Cluster 內部</td></tr>
        <tr><td><strong>NodePort</strong></td><td>開放節點 IP + Port 供外部存取</td><td>節點 IP:30000-32767</td></tr>
        <tr><td><strong>LoadBalancer</strong></td><td>建立雲端 Load Balancer（AWS ELB、Azure LB）</td><td>外部公網（需雲端支援）</td></tr>
        <tr><td><strong>ExternalName</strong></td><td>將 Service 對應到外部 DNS 名稱</td><td>—</td></tr>
      </tbody>
    </table>

    <CodeBlock lang="yaml" filename="service.yaml" :code="`
# ClusterIP — Cluster 內部使用（API 被其他服務呼叫）
apiVersion: v1
kind: Service
metadata:
  name: myapp-api
  namespace: production
spec:
  selector:
    app: myapp-api               # 路由到帶有此 Label 的 Pod
  ports:
    - protocol: TCP
      port: 80                   # Service 暴露的 Port
      targetPort: 8080           # Pod 實際監聽的 Port
  type: ClusterIP

---
# LoadBalancer — 外部存取（生產環境）
apiVersion: v1
kind: Service
metadata:
  name: myapp-api-lb
spec:
  selector:
    app: myapp-api
  ports:
    - port: 80
      targetPort: 8080
  type: LoadBalancer
`" />

    <h2>Ingress — HTTP 路由控制器</h2>
    <p>
      Ingress 在 Service 上層提供 HTTP/HTTPS 路由規則，支援基於 Host 和 Path 的路由，
      以及 TLS 終止。需要搭配 Ingress Controller（如 nginx-ingress、Traefik）才能運作。
    </p>

    <CodeBlock lang="yaml" filename="ingress.yaml — 基於路徑的路由" :code="`
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  namespace: production
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.myapp.com
      secretName: myapp-tls-secret    # TLS 憑證 Secret
  rules:
    - host: api.myapp.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: myapp-api
                port:
                  number: 80
          - path: /admin
            pathType: Prefix
            backend:
              service:
                name: myapp-admin
                port:
                  number: 80
`" />

    <h2>Namespace — 資源隔離</h2>
    <p>
      Namespace 將 Cluster 邏輯分區，常用於區隔不同環境（development、staging、production）
      或不同團隊的資源，可對 Namespace 設定資源配額和網路政策。
    </p>

    <CodeBlock lang="yaml" filename="namespace.yaml" :code="`
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
`" />

    <CodeBlock lang="bash" filename="Namespace 操作指令" :code="`
# 建立 Namespace
kubectl create namespace production

# 在特定 Namespace 操作
kubectl get pods -n production
kubectl apply -f deployment.yaml -n production

# 設定預設 Namespace（避免每次加 -n）
kubectl config set-context --current --namespace=production
`" />

    <h2>Label 與 Selector</h2>
    <p>Label 是 K8s 的核心機制，Service、Deployment 都透過 Label Selector 找到對應的 Pod。</p>

    <CodeBlock lang="bash" filename="Label 相關指令" :code="`
# 查看帶有特定 Label 的 Pod
kubectl get pods -l app=myapp-api

# 為 Pod 加上 Label
kubectl label pod myapp-api-xxxxx version=v2

# 查看所有 Label
kubectl get pods --show-labels
`" />

    <PageNav
      :prev="{ path: '/infra/k8s/intro', label: 'K8s 概述' }"
      :next="{ path: '/infra/k8s/config', label: '設定管理' }"
    />
  </div>
</template>
