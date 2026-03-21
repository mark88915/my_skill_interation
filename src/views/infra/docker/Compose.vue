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
    <h1>Docker Compose 與實戰</h1>
    <p class="page-subtitle">用單一 YAML 定義多容器應用，並完整容器化 ASP.NET Core Web API</p>

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

    <!-- 實戰練習 -->
    <h2>實戰：完整容器化 ASP.NET Core Web API</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 本章實作內容</div>
      <p>
        將一個包含 DDD 分層架構的 ASP.NET Core Web API 完整容器化：<br>
        ✅ 多階段 Dockerfile — 最終 Image &lt; 250 MB<br>
        ✅ compose.yaml 一鍵啟動 API + SQL Server + Redis<br>
        ✅ 透過環境變數注入連線字串，不硬編碼任何設定<br>
        ✅ 加入 <code>/health</code> 端點，供 depends_on 健康檢查使用<br>
        ✅ 容器啟動時自動執行 EF Core Migration
      </p>
    </div>

    <h3>Step 1：加入健康檢查 NuGet 套件</h3>
    <CodeBlock lang="bash" filename="安裝套件" :code="`
dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore
dotnet add package AspNetCore.HealthChecks.Redis
dotnet add package AspNetCore.HealthChecks.SqlServer
dotnet add package AspNetCore.HealthChecks.UI.Client`" />

    <h3>Step 2：Program.cs 加入健康檢查與 Migration</h3>
    <CodeBlock lang="csharp" filename="Program.cs" :code="`
// 健康檢查
builder.Services.AddHealthChecks()
    .AddSqlServer(
        builder.Configuration.GetConnectionString(&quot;Default&quot;)!,
        name: &quot;sqlserver&quot;, tags: [&quot;db&quot;])
    .AddRedis(
        builder.Configuration.GetConnectionString(&quot;Redis&quot;)!,
        name: &quot;redis&quot;, tags: [&quot;cache&quot;]);

var app = builder.Build();

// 健康檢查端點（供 Docker/K8s 使用）
app.MapHealthChecks(&quot;/health&quot;, new HealthCheckOptions
{
    ResultStatusCodes =
    {
        [HealthStatus.Healthy]   = StatusCodes.Status200OK,
        [HealthStatus.Degraded]  = StatusCodes.Status200OK,
        [HealthStatus.Unhealthy] = StatusCodes.Status503ServiceUnavailable
    }
});

// 啟動時自動執行 Migration
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService&lt;AppDbContext&gt;();
    var logger = scope.ServiceProvider.GetRequiredService&lt;ILogger&lt;Program&gt;&gt;();
    try
    {
        logger.LogInformation(&quot;Applying EF Core migrations...&quot;);
        await db.Database.MigrateAsync();
        logger.LogInformation(&quot;Migrations applied successfully.&quot;);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, &quot;Migration failed — container will exit&quot;);
        throw;
    }
}

app.Run();`" />

    <h3>Step 3：環境變數驅動設定</h3>
    <div class="info-box tip">
      <div class="info-box-title">✅ ASP.NET Core 環境變數覆蓋規則</div>
      <p>
        冒號 <code>:</code> 用雙底線 <code>__</code> 取代即可覆蓋 appsettings.json 的任何設定：<br>
        <code>ConnectionStrings__Default=Server=sqlserver;...</code><br>
        → 覆蓋 <code>ConnectionStrings:Default</code>
      </p>
    </div>

    <CodeBlock lang="json" filename="appsettings.json — 本地開發預設值" :code="`
{
  &quot;ConnectionStrings&quot;: {
    &quot;Default&quot;: &quot;Server=localhost;Database=MyAppDb;User Id=sa;Password=dev_pass;TrustServerCertificate=True&quot;,
    &quot;Redis&quot;: &quot;localhost:6379&quot;
  }
}`" />

    <h3>Step 4：完整 Dockerfile</h3>
    <CodeBlock lang="dockerfile" filename="Dockerfile" :code="`
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS restore
WORKDIR /src
COPY MyApp.sln .
COPY src/MyApp.Api/MyApp.Api.csproj              src/MyApp.Api/
COPY src/MyApp.Application/MyApp.Application.csproj  src/MyApp.Application/
COPY src/MyApp.Domain/MyApp.Domain.csproj        src/MyApp.Domain/
COPY src/MyApp.Infrastructure/MyApp.Infrastructure.csproj src/MyApp.Infrastructure/
RUN dotnet restore

FROM restore AS publish
COPY . .
RUN dotnet publish src/MyApp.Api/MyApp.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
USER app
WORKDIR /app
COPY --from=publish --chown=app /app/publish .
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1
ENTRYPOINT [&quot;dotnet&quot;, &quot;MyApp.Api.dll&quot;]`" />

    <h3>Step 5：啟動與驗證</h3>
    <CodeBlock lang="bash" filename="啟動與驗證指令" :code="`
# 啟動（首次需 build）
docker compose up -d --build

# 查看所有服務狀態（含 healthy/unhealthy）
docker compose ps

# 追蹤 API 日誌（確認 Migration 成功）
docker compose logs -f api

# 測試健康檢查
curl http://localhost:8080/health

# 停止（保留資料）
docker compose down

# 完全清除（含 Volume 資料）
docker compose down -v`" />

    <h2>常見問題排查</h2>
    <table>
      <thead>
        <tr><th>問題</th><th>原因</th><th>解法</th></tr>
      </thead>
      <tbody>
        <tr><td>API 容器立即退出</td><td>應用程式崩潰或設定錯誤</td><td><code>docker compose logs api</code> 查看錯誤</td></tr>
        <tr><td>Migration 失敗</td><td>SQL Server 尚未完全就緒</td><td>增加 start_period，確認密碼正確</td></tr>
        <tr><td>健康檢查一直失敗</td><td>curl 未安裝或端點路徑錯誤</td><td>確認 <code>/health</code> 端點已正確註冊</td></tr>
        <tr><td>Port 衝突</td><td>宿主機已佔用 1433/6379</td><td>修改 ports 宿主端，如 <code>11433:1433</code></td></tr>
        <tr><td>Image 建構很慢</td><td>.dockerignore 未排除 bin/obj</td><td>確認包含 <code>**/bin/</code> 和 <code>**/obj/</code></td></tr>
      </tbody>
    </table>

    <PageNav
      :prev="{ path: '/infra/docker/dockerfile', label: 'Dockerfile 撰寫' }"
      :next="{ path: '/infra/k8s/intro', label: 'Kubernetes 概述' }"
    />
  </div>
</template>
