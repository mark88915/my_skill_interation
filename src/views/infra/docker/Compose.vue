<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

// ${...} inside Vue template backtick bindings causes compiler errors,
// so code strings containing ${} must be defined here in script setup.
const composeYaml = `name: myapp

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: myapp-api
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
    restart: unless-stopped

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: myapp-sqlserver
    ports:
      - '1433:1433'
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=\${SA_PASSWORD}
      - MSSQL_PID=Developer
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
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: myapp-redis
    ports:
      - '6379:6379'
    command: redis-server --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    networks:
      - app-network
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 3s
      retries: 5
    restart: unless-stopped

networks:
  app-network:
    driver: bridge

volumes:
  sqlserver-data:
  redis-data:`
</script>

<template>
  <div class="content-wrapper">
    <h1>Docker Compose</h1>
    <p class="page-subtitle">用單一 YAML 定義多容器應用，一鍵啟動完整開發環境</p>

    <h2>什麼是 Docker Compose？</h2>
    <p>
      Docker Compose 讓你用一個 <code>compose.yaml</code> 檔案定義整個應用程式的多個服務（API、資料庫、快取等），
      並以單一指令啟動、停止或重建所有服務。是本地開發和測試環境的標準工具。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>Services（服務）</h4>
        <p>每個容器對應一個 Service，可指定 Image、Build、Port、環境變數、Volume、依賴關係。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🌐</div>
        <h4>Networks（網路）</h4>
        <p>預設建立獨立 bridge 網路，同 Compose 內的服務可直接用服務名稱互呼（如 <code>Server=sqlserver</code>）。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💾</div>
        <h4>Volumes（磁碟區）</h4>
        <p>宣告具名 Volume，在容器重建後保留資料。適合 SQL Server、Redis 等需要持久化的服務。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔗</div>
        <h4>depends_on + healthcheck</h4>
        <p>控制啟動順序，搭配 <code>condition: service_healthy</code> 確保依賴服務真正就緒後才啟動 API。</p>
      </div>
    </div>

    <h2>完整範例：ASP.NET Core + SQL Server + Redis</h2>

    <CodeBlock lang="yaml" filename="compose.yaml" :code="composeYaml" />

    <h2>環境變數管理（.env 檔案）</h2>
    <p>敏感資訊（密碼、金鑰）不應寫死在 compose.yaml，改用 <code>.env</code> 檔案管理。</p>

    <CodeBlock lang="bash" filename=".env（加入 .gitignore！）" :code="`SA_PASSWORD=YourStrong!Password123`" />

    <CodeBlock lang="bash" filename=".env.example（提交到 Git 作為範本）" :code="`SA_PASSWORD=change_me`" />

    <h2>Override：開發與生產環境分離</h2>

    <CodeBlock lang="yaml" filename="compose.override.yaml（僅本地開發，自動合併）" :code="`
services:
  api:
    volumes:
      # 掛載原始碼，搭配 dotnet watch 實現 hot reload
      - ./src:/src
    environment:
      - DOTNET_WATCH_RESTART_ON_RUDE_EDIT=true`" />

    <CodeBlock lang="yaml" filename="compose.prod.yaml（生產環境）" :code="`
services:
  api:
    image: myregistry.io/myapp:1.0   # 使用預先建構的 Image
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M`" />

    <CodeBlock lang="bash" filename="使用 override 組合" :code="`
# 開發：自動合併 compose.yaml + compose.override.yaml
docker compose up -d

# 生產：指定特定組合
docker compose -f compose.yaml -f compose.prod.yaml up -d`" />

    <h2>常用 Compose 指令</h2>
    <table>
      <thead>
        <tr><th>指令</th><th>說明</th></tr>
      </thead>
      <tbody>
        <tr><td><code>docker compose up -d</code></td><td>背景啟動所有服務</td></tr>
        <tr><td><code>docker compose up --build</code></td><td>重新建構 Image 後啟動</td></tr>
        <tr><td><code>docker compose down</code></td><td>停止並移除容器、網路</td></tr>
        <tr><td><code>docker compose down -v</code></td><td>同上，並刪除 Volume（⚠️ 資料消失）</td></tr>
        <tr><td><code>docker compose ps</code></td><td>列出所有服務狀態（含健康狀態）</td></tr>
        <tr><td><code>docker compose logs -f api</code></td><td>即時追蹤 api 服務日誌</td></tr>
        <tr><td><code>docker compose exec api bash</code></td><td>進入 api 容器互動式 Shell</td></tr>
        <tr><td><code>docker compose restart api</code></td><td>重啟單一服務</td></tr>
        <tr><td><code>docker compose pull</code></td><td>更新所有服務的 Image</td></tr>
        <tr><td><code>docker compose config</code></td><td>驗證並輸出合併後的設定</td></tr>
      </tbody>
    </table>

    <h2>Profiles：選擇性啟動服務</h2>
    <CodeBlock lang="yaml" filename="使用 profiles 管理可選服務" :code="`
services:
  api:
    build: .
    # 無 profile：預設啟動

  sqlserver:
    image: mcr.microsoft.com/mssql/server:2022-latest
    # 無 profile：預設啟動

  seq:
    # 僅在 dev profile 時啟動（結構化日誌 UI）
    image: datalust/seq:latest
    profiles: [dev]
    ports:
      - '5341:80'`" />

    <CodeBlock lang="bash" filename="啟動指定 Profile" :code="`
# 啟動預設服務（不含 dev profile）
docker compose up -d

# 啟動包含 dev profile 的服務
docker compose --profile dev up -d`" />

    <PageNav
      :prev="{ path: '/infra/docker/dockerfile', label: 'Dockerfile 撰寫' }"
      :next="{ path: '/infra/docker/practice', label: 'Docker 實戰' }"
    />
  </div>
</template>
