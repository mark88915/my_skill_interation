<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Docker 概述</h1>
    <p class="page-subtitle">容器化技術的核心概念、架構與日常工作流程</p>

    <h2>什麼是 Docker？</h2>
    <p>
      Docker 是一個開源的容器化平台，讓開發者能將應用程式與其所有依賴（runtime、函式庫、設定）打包成一個獨立的
      <strong>Container（容器）</strong>。容器可在任何支援 Docker 的環境中以完全一致的方式執行，
      徹底解決「在我機器上沒問題」的困境。
    </p>

    <h2>容器 vs 虛擬機器（VM）</h2>
    <table>
      <thead>
        <tr><th>特性</th><th>Container</th><th>虛擬機器 (VM)</th></tr>
      </thead>
      <tbody>
        <tr><td>啟動時間</td><td>毫秒級</td><td>分鐘級</td></tr>
        <tr><td>資源佔用</td><td>極輕量（共用 OS Kernel）</td><td>重量（含完整 Guest OS）</td></tr>
        <tr><td>隔離層級</td><td>Process 層級</td><td>硬體層級</td></tr>
        <tr><td>可攜性</td><td>極高（Image 跨平台執行）</td><td>較低（格式差異大）</td></tr>
        <tr><td>密度</td><td>同主機可跑數十至數百個</td><td>同主機通常數個</td></tr>
        <tr><td>安全隔離</td><td>共用 Kernel，需額外設定</td><td>完全隔離</td></tr>
      </tbody>
    </table>

    <h2>Docker 核心概念</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>Image（映像檔）</h4>
        <p>唯讀的應用程式模板，包含程式碼、runtime、函式庫。由 Dockerfile 建構，可推送至 Registry 共享。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏃</div>
        <h4>Container（容器）</h4>
        <p>Image 的執行實例。可啟動、停止、刪除。容器是隔離的 Process，共用宿主機 Kernel。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🗄️</div>
        <h4>Registry（倉庫）</h4>
        <p>存放和分發 Image 的服務。Docker Hub 是公開倉庫；企業常用 Azure Container Registry 或 AWS ECR。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💾</div>
        <h4>Volume（儲存卷）</h4>
        <p>持久化儲存機制。容器刪除後資料仍保留，常用於資料庫、日誌等需要持久化的場景。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>Network（網路）</h4>
        <p>容器間的通訊機制。預設有 bridge、host、none 三種驅動，Docker Compose 自動建立隔離網路。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📝</div>
        <h4>Dockerfile</h4>
        <p>定義 Image 建構步驟的文字檔，每一行指令對應一個 Layer，支援多階段建構大幅縮小 Image 體積。</p>
      </div>
    </div>

    <h2>Docker 架構</h2>
    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>Docker CLI / Docker Desktop</strong>
        <span>使用者介面層 — docker build / run / push / pull</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>Docker Daemon（dockerd）</strong>
        <span>核心服務 — 接收 API 請求，管理 Image / Container / Network / Volume</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>containerd</strong>
        <span>Container Runtime — 負責實際的容器生命週期管理</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>runc / OCI Runtime</strong>
        <span>底層 — 與 Linux Kernel（Namespaces + cgroups）互動，建立隔離環境</span>
      </div>
    </div>

    <h2>常用 Docker 指令</h2>
    <table>
      <thead>
        <tr><th>指令</th><th>說明</th></tr>
      </thead>
      <tbody>
        <tr><td><code>docker build -t myapp:1.0 .</code></td><td>依據當前目錄 Dockerfile 建構 Image</td></tr>
        <tr><td><code>docker run -d -p 8080:80 myapp:1.0</code></td><td>背景執行容器，主機 8080 → 容器 80</td></tr>
        <tr><td><code>docker ps</code></td><td>列出執行中的容器</td></tr>
        <tr><td><code>docker logs -f &lt;id&gt;</code></td><td>即時追蹤容器日誌</td></tr>
        <tr><td><code>docker exec -it &lt;id&gt; bash</code></td><td>進入容器互動式 Shell</td></tr>
        <tr><td><code>docker stop / rm &lt;id&gt;</code></td><td>停止 / 刪除容器</td></tr>
        <tr><td><code>docker images</code></td><td>列出本地所有 Image</td></tr>
        <tr><td><code>docker pull mcr.microsoft.com/dotnet/aspnet:9.0</code></td><td>從 Registry 拉取 Image</td></tr>
        <tr><td><code>docker push myregistry.io/myapp:1.0</code></td><td>推送 Image 至 Registry</td></tr>
        <tr><td><code>docker volume ls</code></td><td>列出所有 Volume</td></tr>
        <tr><td><code>docker network ls</code></td><td>列出 Docker 網路</td></tr>
        <tr><td><code>docker system prune -a</code></td><td>清除所有未使用的資源</td></tr>
      </tbody>
    </table>

    <h2>Docker 解決的核心問題</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ Docker 帶來的核心價值</div>
      <p>
        <strong>一致性</strong>：開發、測試、生產環境使用相同 Image，消除環境差異。<br>
        <strong>隔離性</strong>：每個服務獨立容器，依賴版本不互相衝突。<br>
        <strong>可攜性</strong>：Image 一次建構，任何 Docker 環境皆可執行。<br>
        <strong>快速部署</strong>：容器啟動毫秒級，支援快速水平擴展。<br>
        <strong>版本控制</strong>：Image 有 Tag，任何時間點可回滾到指定版本。<br>
        <strong>CI/CD 整合</strong>：Pipeline 中 build image、測試、推送，完全自動化。
      </p>
    </div>

    <PageNav
      :next="{ path: '/infra/docker/dockerfile', label: 'Dockerfile 撰寫' }"
    />
  </div>
</template>
