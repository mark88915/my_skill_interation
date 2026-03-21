<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Kubernetes 概述</h1>
    <p class="page-subtitle">容器編排的核心問題、K8s 架構與 Docker Compose 的本質差異</p>

    <h2>為什麼需要 Kubernetes？</h2>
    <p>
      Docker 解決了「如何封裝和執行單一容器」的問題，但當應用程式需要在多台主機上執行數十甚至數百個容器時，
      手動管理極為複雜。Kubernetes（K8s）是一個開源的<strong>容器編排平台</strong>，
      自動化處理部署、擴展、自我修復和滾動更新。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>自動自我修復</h4>
        <p>容器崩潰時自動重啟；節點故障時自動在其他節點重新排程；只有通過健康檢查的容器才接受流量。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📈</div>
        <h4>水平自動擴展（HPA）</h4>
        <p>依據 CPU、記憶體使用率自動增減 Pod 副本數，也可依自訂指標（如 Queue 長度）擴展。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🚀</div>
        <h4>零停機滾動更新</h4>
        <p>逐步替換舊 Pod，若新版本健康檢查失敗，自動回滾到前一個穩定版本。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚖️</div>
        <h4>服務發現與負載均衡</h4>
        <p>Service 自動在所有健康的 Pod 之間分配流量，內建 DNS 解析，服務間只需用名稱互呼。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>機密與設定管理</h4>
        <p>ConfigMap 管理非敏感設定，Secret 加密儲存密碼和 Token，與程式碼完全分離。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🗄️</div>
        <h4>儲存編排</h4>
        <p>自動掛載所需的儲存系統（本地磁碟、NFS、雲端儲存），Pod 重新排程後資料仍可存取。</p>
      </div>
    </div>

    <h2>K8s Cluster 架構</h2>
    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>Control Plane（控制平面 — Master Node）</strong>
        <span>API Server（統一入口）、etcd（狀態儲存）、Scheduler（排程）、Controller Manager（控制器）</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>Worker Node 1</strong>
        <span>kubelet（節點代理）、kube-proxy（網路規則）、containerd（Container Runtime）、Pods</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>Worker Node 2</strong>
        <span>kubelet、kube-proxy、containerd、Pods</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>Worker Node N（可橫向無限擴展）</strong>
        <span>每個節點可執行多個 Pod，由 Scheduler 根據資源需求決定排程位置</span>
      </div>
    </div>

    <h2>Control Plane 組件</h2>
    <table>
      <thead>
        <tr><th>組件</th><th>職責</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>API Server</strong></td><td>K8s 的統一入口，所有操作（kubectl、內部組件）都透過 REST API 與之互動</td></tr>
        <tr><td><strong>etcd</strong></td><td>分散式鍵值資料庫，儲存整個 Cluster 的狀態（唯一的真實狀態來源）</td></tr>
        <tr><td><strong>Scheduler</strong></td><td>監看未排程的 Pod，根據資源需求、節點親和性等規則決定 Pod 應在哪個節點執行</td></tr>
        <tr><td><strong>Controller Manager</strong></td><td>執行各種控制器（Deployment、ReplicaSet、Node 等），持續確保實際狀態符合期望狀態</td></tr>
      </tbody>
    </table>

    <h2>Worker Node 組件</h2>
    <table>
      <thead>
        <tr><th>組件</th><th>職責</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>kubelet</strong></td><td>節點上的代理，接收 PodSpec，確保容器按規格執行，回報節點和 Pod 狀態給 API Server</td></tr>
        <tr><td><strong>kube-proxy</strong></td><td>維護節點上的網路規則（iptables/IPVS），實現 Service 的負載均衡和網路轉發</td></tr>
        <tr><td><strong>Container Runtime</strong></td><td>實際執行容器（預設為 containerd，也可用 CRI-O）</td></tr>
      </tbody>
    </table>

    <h2>Docker Compose vs Kubernetes</h2>
    <table>
      <thead>
        <tr><th>特性</th><th>Docker Compose</th><th>Kubernetes</th></tr>
      </thead>
      <tbody>
        <tr><td>適用場景</td><td>本地開發、單機部署</td><td>生產環境、多節點叢集</td></tr>
        <tr><td>自動自我修復</td><td>基本（restart policy，僅單機）</td><td>完整（跨節點重新排程）</td></tr>
        <tr><td>水平擴展</td><td>手動（deploy.replicas）</td><td>自動（HPA）</td></tr>
        <tr><td>滾動更新</td><td>不支援（需停機重啟）</td><td>原生支援，自動回滾</td></tr>
        <tr><td>負載均衡</td><td>簡單（僅限單主機）</td><td>多層次（Service / Ingress）</td></tr>
        <tr><td>設定管理</td><td>環境變數 / .env 檔案</td><td>ConfigMap / Secret</td></tr>
        <tr><td>學習曲線</td><td>低（數小時上手）</td><td>高（數週到數月）</td></tr>
        <tr><td>基礎設施需求</td><td>任何 Docker 主機</td><td>需要 Cluster（本地可用 Docker Desktop）</td></tr>
      </tbody>
    </table>

    <h2>kubectl 基礎指令</h2>
    <CodeBlock lang="bash" filename="kubectl 常用指令" :code="`
# 查看資源
kubectl get pods                          # 列出 default namespace 的 Pod
kubectl get pods -n production            # 列出指定 Namespace 的 Pod
kubectl get all                           # 列出所有資源
kubectl get pods -w                       # 持續監看 Pod 狀態變化

# 詳細資訊
kubectl describe pod myapp-api-xxxxx      # Pod 詳情（事件、日誌）
kubectl describe deployment myapp-api     # Deployment 詳情

# 日誌
kubectl logs myapp-api-xxxxx              # 查看 Pod 日誌
kubectl logs myapp-api-xxxxx -f           # 即時追蹤
kubectl logs myapp-api-xxxxx --previous   # 上一次執行的日誌（Crash 後）

# 套用 / 刪除設定
kubectl apply -f deployment.yaml          # 建立或更新資源
kubectl delete -f deployment.yaml         # 刪除資源
kubectl apply -f k8s/                     # 套用目錄下所有 YAML

# 互動
kubectl exec -it myapp-api-xxxxx -- bash  # 進入容器

# 擴展
kubectl scale deployment myapp-api --replicas=5

# 多 Cluster 管理
kubectl config get-contexts               # 列出所有上下文
kubectl config use-context my-cluster     # 切換 Cluster
`" />

    <h2>本地 K8s 開發環境</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ 推薦本地開發工具</div>
      <p>
        <strong>Docker Desktop</strong>：內建 K8s，最簡單。Settings → Kubernetes → Enable Kubernetes 啟用。<br>
        <strong>minikube</strong>：跨平台，<code>minikube start</code> 即可，支援多種 Driver。<br>
        <strong>kind（Kubernetes in Docker）</strong>：在 Docker 容器中執行 K8s 節點，CI 環境常用。<br>
        <strong>k3s</strong>：輕量級 K8s，適合資源有限的環境。
      </p>
    </div>

    <PageNav
      :prev="{ path: '/infra/docker/compose', label: 'Docker Compose 與實戰' }"
      :next="{ path: '/infra/k8s/concepts', label: '核心概念' }"
    />
  </div>
</template>
