<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'

const practiceCompose = `name: myapp

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
</script>

<template>
  <div class="content-wrapper">
    <h1>Docker 實戰</h1>
    <p class="page-subtitle">將 ASP.NET Core Web API 完整容器化，含健康檢查、環境設定與自動 Migration</p>

    <h2>實戰目標</h2>
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

    <h2>Step 1：加入健康檢查 NuGet 套件</h2>
    <CodeBlock lang="bash" filename="安裝套件" :code="`
dotnet add package Microsoft.Extensions.Diagnostics.HealthChecks.EntityFrameworkCore
dotnet add package AspNetCore.HealthChecks.Redis
dotnet add package AspNetCore.HealthChecks.SqlServer
dotnet add package AspNetCore.HealthChecks.UI.Client`" />

    <h2>Step 2：Program.cs 加入健康檢查與 Migration</h2>
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

    <h2>Step 3：環境變數驅動設定</h2>
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

    <h2>Step 4：完整 Dockerfile</h2>
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

    <h2>Step 5：compose.yaml 整合</h2>
    <CodeBlock lang="yaml" filename="compose.yaml" :code="practiceCompose" />

    <h2>Step 6：啟動與驗證</h2>
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
      :prev="{ path: '/infra/docker/compose', label: 'Docker Compose' }"
      :next="{ path: '/infra/k8s/intro', label: 'Kubernetes 概述' }"
    />
  </div>
</template>
