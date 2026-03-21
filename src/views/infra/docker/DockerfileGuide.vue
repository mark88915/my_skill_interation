<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Dockerfile 撰寫</h1>
    <p class="page-subtitle">撰寫高效能、安全的 Dockerfile，搭配 ASP.NET Core 多階段建構</p>

    <h2>Dockerfile 常用指令</h2>
    <table>
      <thead>
        <tr><th>指令</th><th>說明</th><th>範例</th></tr>
      </thead>
      <tbody>
        <tr><td><code>FROM</code></td><td>指定基底 Image</td><td><code>FROM mcr.microsoft.com/dotnet/aspnet:9.0</code></td></tr>
        <tr><td><code>WORKDIR</code></td><td>設定工作目錄（不存在時自動建立）</td><td><code>WORKDIR /app</code></td></tr>
        <tr><td><code>COPY</code></td><td>從建構上下文複製檔案到 Image</td><td><code>COPY src/ ./src/</code></td></tr>
        <tr><td><code>RUN</code></td><td>建構階段執行命令（每個 RUN 產生一個 Layer）</td><td><code>RUN dotnet restore</code></td></tr>
        <tr><td><code>EXPOSE</code></td><td>宣告容器監聽的 Port（文件用途）</td><td><code>EXPOSE 8080</code></td></tr>
        <tr><td><code>ENV</code></td><td>設定環境變數</td><td><code>ENV ASPNETCORE_HTTP_PORTS=8080</code></td></tr>
        <tr><td><code>ARG</code></td><td>建構時傳入的變數（不保留在最終 Image）</td><td><code>ARG BUILD_VERSION=1.0</code></td></tr>
        <tr><td><code>ENTRYPOINT</code></td><td>容器啟動的主程式（不易被覆蓋）</td><td><code>ENTRYPOINT ["dotnet", "MyApp.dll"]</code></td></tr>
        <tr><td><code>CMD</code></td><td>預設命令或 ENTRYPOINT 的預設參數（可被覆蓋）</td><td><code>CMD ["--environment", "Production"]</code></td></tr>
        <tr><td><code>HEALTHCHECK</code></td><td>定義容器健康檢查</td><td><code>HEALTHCHECK CMD curl -f http://localhost/health</code></td></tr>
        <tr><td><code>USER</code></td><td>切換執行使用者（安全最佳實踐）</td><td><code>USER app</code></td></tr>
      </tbody>
    </table>

    <h2>ENTRYPOINT vs CMD</h2>
    <div class="info-box info">
      <div class="info-box-title">📌 使用原則</div>
      <p>
        <strong>ENTRYPOINT</strong>：定義容器的主程式，幾乎不變。<br>
        <strong>CMD</strong>：提供預設參數，<code>docker run</code> 時可覆蓋。<br>
        組合使用：<code>ENTRYPOINT ["dotnet", "MyApp.dll"]</code> + <code>CMD ["--urls", "http://+:8080"]</code>
      </p>
    </div>

    <h2>ASP.NET Core 多階段建構（推薦）</h2>
    <p>
      多階段建構（Multi-stage build）讓 SDK 只用於建構，最終 Image 只包含 Runtime，
      大幅縮小 Image 體積（從 ~800MB 降至 ~220MB）。
    </p>

    <CodeBlock lang="dockerfile" filename="Dockerfile — ASP.NET Core 多階段建構" :code="`
# Stage 1: 還原依賴（利用 Layer 快取）
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS restore
WORKDIR /src

# 先複製所有 .csproj，只有 .csproj 改變時才重新 restore
COPY MyApp.sln .
COPY src/MyApp.Api/MyApp.Api.csproj              src/MyApp.Api/
COPY src/MyApp.Application/MyApp.Application.csproj  src/MyApp.Application/
COPY src/MyApp.Domain/MyApp.Domain.csproj        src/MyApp.Domain/
COPY src/MyApp.Infrastructure/MyApp.Infrastructure.csproj src/MyApp.Infrastructure/
RUN dotnet restore

# Stage 2: 建構與發布
FROM restore AS publish
COPY . .
RUN dotnet publish src/MyApp.Api/MyApp.Api.csproj \\
    -c Release \\
    -o /app/publish \\
    --no-restore

# Stage 3: 最終 Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final

# 安全：使用非 root 使用者（aspnet:9.0 內建 app 使用者）
USER app
WORKDIR /app

# 複製發布產物
COPY --from=publish --chown=app /app/publish .

# ASP.NET Core 9 使用 HTTP_PORTS 取代 URLS
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

# 容器健康檢查
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

ENTRYPOINT [&quot;dotnet&quot;, &quot;MyApp.Api.dll&quot;]
`" />

    <h2>.dockerignore — 排除不必要的檔案</h2>
    <p><code>.dockerignore</code> 排除不需複製到建構上下文的檔案，加速建構並縮小 Image。</p>

    <CodeBlock lang="bash" filename=".dockerignore" :code="`
# 建構輸出
**/bin/
**/obj/

# 測試結果
**/TestResults/

# 開發設定（不應進 Image）
**/.env
**/appsettings.Development.json
**/appsettings.Local.json

# IDE 檔案
.vs/
.vscode/
*.user

# Git
.git/
.gitignore

# Docker 自身
Dockerfile*
docker-compose*.yml
.dockerignore

# 文件
README.md
docs/
`" />

    <h2>Layer 快取最佳化原則</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">⚡</div>
        <h4>先複製 .csproj，再 restore</h4>
        <p>只有 .csproj 改變時才重新 restore，程式碼修改不影響依賴快取層，大幅加速 CI/CD Pipeline。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>合併相關 RUN 指令</h4>
        <p>將相關的 RUN 指令合併為一行（用 &amp;&amp; 連接），減少 Layer 數量和 Image 大小。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔒</div>
        <h4>非 root 執行</h4>
        <p>ASP.NET Core 9 基底 Image 內建 <code>app</code> 使用者，使用 <code>USER app</code> 提升安全性。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🏷️</div>
        <h4>固定基底 Image 版本</h4>
        <p>使用 <code>mcr.microsoft.com/dotnet/aspnet:9.0</code> 而非 <code>:latest</code>，確保建構可重現。</p>
      </div>
    </div>

    <h2>常見 .NET Image 選擇</h2>
    <table>
      <thead>
        <tr><th>Image</th><th>用途</th><th>大小</th></tr>
      </thead>
      <tbody>
        <tr><td><code>mcr.microsoft.com/dotnet/sdk:9.0</code></td><td>建構用（含 dotnet CLI、編譯器）</td><td>~800 MB</td></tr>
        <tr><td><code>mcr.microsoft.com/dotnet/aspnet:9.0</code></td><td>ASP.NET Core 執行時期</td><td>~220 MB</td></tr>
        <tr><td><code>mcr.microsoft.com/dotnet/runtime:9.0</code></td><td>非 Web 的 .NET 應用（Console / Worker）</td><td>~190 MB</td></tr>
        <tr><td><code>mcr.microsoft.com/dotnet/aspnet:9.0-alpine</code></td><td>Alpine Linux 基底，最小化 Image</td><td>~110 MB</td></tr>
      </tbody>
    </table>

    <h2>建構與執行指令</h2>
    <CodeBlock lang="bash" filename="建構與執行" :code="`
# 建構 Image
docker build -t myapp:1.0 .

# 傳入建構參數
docker build --build-arg BUILD_VERSION=2.0 -t myapp:2.0 .

# 執行容器（注入環境變數）
docker run -d \\
  --name myapp \\
  -p 8080:8080 \\
  -e ConnectionStrings__Default='Server=localhost;...' \\
  myapp:1.0

# 查看容器健康狀態
docker inspect --format='{{.State.Health.Status}}' myapp

# 進入容器除錯
docker exec -it myapp bash
`" />

    <PageNav
      :prev="{ path: '/infra/docker/intro', label: 'Docker 概述' }"
      :next="{ path: '/infra/docker/compose', label: 'Docker Compose' }"
    />
  </div>
</template>
