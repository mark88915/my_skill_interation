<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>環境設定</h1>
    <p class="page-subtitle">安裝 EF Core 並連線 SQL Server</p>

    <h2>安裝 NuGet 套件</h2>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 核心套件
dotnet add package Microsoft.EntityFrameworkCore

# SQL Server Provider
dotnet add package Microsoft.EntityFrameworkCore.SqlServer

# 開發工具（Migration 等）
dotnet add package Microsoft.EntityFrameworkCore.Tools

# CLI 工具（全域安裝，只需一次）
dotnet tool install --global dotnet-ef`" />

    <h2>SQL Server 連線選項</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">💻</div>
        <h4>LocalDB</h4>
        <p>Visual Studio 內建，輕量無需額外安裝，適合開發。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>SQL Server Express</h4>
        <p>免費版本，功能完整但有容量限制。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🐳</div>
        <h4>Docker</h4>
        <p>跨平台最佳選擇，macOS / Linux 開發必備。</p>
      </div>
    </div>

    <h3>Docker 啟動 SQL Server</h3>
    <CodeBlock lang="bash" filename="Terminal" :code="`
# 啟動 SQL Server 2022 容器
docker run -e 'ACCEPT_EULA=Y' \\
  -e 'MSSQL_SA_PASSWORD=YourStrong@Password123' \\
  -p 1433:1433 \\
  --name sql-server \\
  -d mcr.microsoft.com/mssql/server:2022-latest`" />

    <h2>設定連線字串</h2>
    <CodeBlock lang="json" filename="appsettings.json" :code="`
{
  &quot;ConnectionStrings&quot;: {
    // LocalDB（Windows Visual Studio）
    &quot;LocalDb&quot;: &quot;Server=(localdb)\\\\mssqllocaldb;Database=EShopDb;Trusted_Connection=True;TrustServerCertificate=True&quot;,

    // SQL Server Express
    &quot;Express&quot;: &quot;Server=.\\\\SQLEXPRESS;Database=EShopDb;Trusted_Connection=True;TrustServerCertificate=True&quot;,

    // Docker（macOS / Linux）
    &quot;Docker&quot;: &quot;Server=localhost,1433;Database=EShopDb;User Id=sa;Password=YourStrong@Password123;TrustServerCertificate=True&quot;
  }
}`" />

    <h2>建立 DbContext</h2>
    <CodeBlock lang="csharp" filename="Infrastructure/Persistence/AppDbContext.cs" :code="`
using Microsoft.EntityFrameworkCore;

namespace EShop.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Product> Products => Set<Product>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 自動載入同一 Assembly 中所有 IEntityTypeConfiguration
        modelBuilder.ApplyConfigurationsFromAssembly(
            typeof(AppDbContext).Assembly);
    }

    // 覆寫 SaveChanges 自動設定審計欄位
    public override Task<int> SaveChangesAsync(
        CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<IAuditable>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

// 審計介面
public interface IAuditable
{
    DateTime CreatedAt { get; set; }
    DateTime? UpdatedAt { get; set; }
}`" />

    <h2>在 Program.cs 註冊</h2>
    <CodeBlock lang="csharp" filename="WebApi/Program.cs" :code="`
var builder = WebApplication.CreateBuilder(args);

// 註冊 DbContext + SQL Server
builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(&quot;DefaultConnection&quot;),
        sqlOptions =>
        {
            // Migration 所在的 Assembly
            sqlOptions.MigrationsAssembly(
                typeof(AppDbContext).Assembly.FullName);

            // 啟用自動重試（連線暫時失敗時）
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 3,
                maxRetryDelay: TimeSpan.FromSeconds(10),
                errorNumbersToAdd: null);
        });

    // 開發環境啟用詳細錯誤與敏感資料記錄
    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ 安全注意</div>
      <p><code>EnableSensitiveDataLogging</code> 會在 Log 中顯示查詢參數值，請只在開發環境使用，絕不可用於正式環境。</p>
    </div>

    <h2>驗證連線</h2>
    <CodeBlock lang="csharp" filename="驗證資料庫連線" :code="`
// 在 Program.cs 中加入健康檢查
builder.Services.AddHealthChecks()
    .AddSqlServer(
        builder.Configuration.GetConnectionString(&quot;DefaultConnection&quot;)!,
        name: &quot;sqlserver&quot;);

var app = builder.Build();

app.MapHealthChecks(&quot;/health&quot;);

// 或者在啟動時測試連線
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    if (await db.Database.CanConnectAsync())
        Console.WriteLine(&quot;✅ 資料庫連線成功！&quot;);
    else
        Console.WriteLine(&quot;❌ 資料庫連線失敗&quot;);
}`" />

    <PageNav
      :prev="{ path: '/csharp/efcore/intro', label: 'EF Core 概述' }"
      :next="{ path: '/csharp/efcore/model', label: '模型設定' }"
    />
  </div>
</template>
