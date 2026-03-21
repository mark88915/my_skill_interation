<script setup>
import CodeBlock from '../../components/CodeBlock.vue'
import PageNav from '../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>Migration</h1>
    <p class="page-subtitle">使用 EF Core Migration 管理資料庫結構版本</p>

    <h2>什麼是 Migration？</h2>
    <p>
      Migration 是 EF Core 提供的資料庫版本控制機制。當你的 Entity 或 Configuration 變更時，
      Migration 會自動計算差異並生成對應的 SQL 異動腳本。
    </p>

    <div class="arch-diagram">
      <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; align-items: center;">
        <div class="arch-layer domain" style="max-width: 180px; flex: 1;">
          <strong>C# Model 變更</strong>
        </div>
        <div class="arch-arrow" style="margin: 0;">→</div>
        <div class="arch-layer application" style="max-width: 180px; flex: 1;">
          <strong>Migration 檔案</strong>
        </div>
        <div class="arch-arrow" style="margin: 0;">→</div>
        <div class="arch-layer infrastructure" style="max-width: 180px; flex: 1;">
          <strong>SQL Server 更新</strong>
        </div>
      </div>
    </div>

    <h2>基本指令</h2>
    <CodeBlock lang="bash" filename="Terminal (dotnet-ef CLI)" :code="`
# 建立初始 Migration
dotnet ef migrations add InitialCreate \\
  --project src/EShop.Infrastructure \\
  --startup-project src/EShop.WebApi

# 套用 Migration 到資料庫
dotnet ef database update \\
  --project src/EShop.Infrastructure \\
  --startup-project src/EShop.WebApi

# 查看所有 Migration 狀態
dotnet ef migrations list \\
  --project src/EShop.Infrastructure \\
  --startup-project src/EShop.WebApi

# 移除最後一個尚未套用的 Migration
dotnet ef migrations remove \\
  --project src/EShop.Infrastructure \\
  --startup-project src/EShop.WebApi

# 產生 SQL 腳本（適合正式環境）
dotnet ef migrations script \\
  --project src/EShop.Infrastructure \\
  --startup-project src/EShop.WebApi \\
  --output migration.sql`" />

    <div class="info-box warning">
      <div class="info-box-title">⚠️ Package Manager Console (Visual Studio)</div>
      <p>
        如果使用 Visual Studio 的 PMC，指令格式不同：<br>
        <code>Add-Migration InitialCreate</code><br>
        <code>Update-Database</code><br>
        <code>Remove-Migration</code>
      </p>
    </div>

    <h2>Migration 檔案解析</h2>
    <CodeBlock lang="csharp" filename="Migrations/20240101_InitialCreate.cs" :code="`
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: &quot;Orders&quot;,
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                CustomerId = table.Column<Guid>(nullable: false),
                Status = table.Column<string>(
                    maxLength: 20, nullable: false),
                TotalAmount = table.Column<decimal>(
                    type: &quot;decimal(18,2)&quot;, nullable: false),
                CurrencyCode = table.Column<string>(
                    maxLength: 3, nullable: false),
                CreatedAt = table.Column<DateTime>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey(&quot;PK_Orders&quot;, x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: &quot;OrderItems&quot;,
            columns: table => new
            {
                Id = table.Column<Guid>(nullable: false),
                OrderId = table.Column<Guid>(nullable: false),
                ProductName = table.Column<string>(
                    maxLength: 200, nullable: false),
                UnitPrice = table.Column<decimal>(
                    type: &quot;decimal(18,2)&quot;, nullable: false),
                Quantity = table.Column<int>(nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey(&quot;PK_OrderItems&quot;, x => x.Id);
                table.ForeignKey(
                    name: &quot;FK_OrderItems_Orders_OrderId&quot;,
                    column: x => x.OrderId,
                    principalTable: &quot;Orders&quot;,
                    principalColumn: &quot;Id&quot;,
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: &quot;IX_OrderItems_OrderId&quot;,
            table: &quot;OrderItems&quot;,
            column: &quot;OrderId&quot;);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: &quot;OrderItems&quot;);
        migrationBuilder.DropTable(name: &quot;Orders&quot;);
    }
}`" />

    <h2>常見 Migration 操作</h2>

    <h3>新增欄位</h3>
    <CodeBlock lang="csharp" filename="新增欄位的 Migration" :code="`
// 1. 在 Entity 新增屬性
public class Order
{
    // ... 既有屬性
    public string? Note { get; private set; }  // 新增備註欄位
}

// 2. 在 Configuration 設定
builder.Property(o => o.Note).HasMaxLength(500);

// 3. 執行 dotnet ef migrations add AddOrderNote
// 自動產生：
protected override void Up(MigrationBuilder migrationBuilder)
{
    migrationBuilder.AddColumn<string>(
        name: &quot;Note&quot;,
        table: &quot;Orders&quot;,
        type: &quot;nvarchar(500)&quot;,
        maxLength: 500,
        nullable: true);
}`" />

    <h3>新增索引</h3>
    <CodeBlock lang="csharp" filename="新增索引" :code="`
// 在 Configuration 中加入
builder.HasIndex(o => o.CustomerId);
builder.HasIndex(o => o.CreatedAt);
builder.HasIndex(o => new { o.CustomerId, o.Status }); // 複合索引

// Migration 產生：
migrationBuilder.CreateIndex(
    name: &quot;IX_Orders_CustomerId_Status&quot;,
    table: &quot;Orders&quot;,
    columns: new[] { &quot;CustomerId&quot;, &quot;Status&quot; });`" />

    <h3>手動修改 Migration（Seed Data）</h3>
    <CodeBlock lang="csharp" filename="在 Migration 中加入種子資料" :code="`
protected override void Up(MigrationBuilder migrationBuilder)
{
    // 自動產生的結構變更...

    // 手動加入種子資料
    migrationBuilder.InsertData(
        table: &quot;Products&quot;,
        columns: new[] { &quot;Id&quot;, &quot;Name&quot;, &quot;Price&quot;, &quot;IsActive&quot; },
        values: new object[,]
        {
            { Guid.NewGuid(), &quot;範例商品 A&quot;, 100m, true },
            { Guid.NewGuid(), &quot;範例商品 B&quot;, 200m, true }
        });

    // 或執行原生 SQL
    migrationBuilder.Sql(
        &quot;INSERT INTO [Settings] (Id, [Key], Value) &quot; +
        &quot;VALUES (NEWID(), 'SiteName', 'EShop')&quot;);
}`" />

    <h2>正式環境部署策略</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">📝</div>
        <h4>SQL Script</h4>
        <p>使用 <code>dotnet ef migrations script</code> 產生 SQL 檔案，由 DBA 審查後執行。最安全。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🚀</div>
        <h4>CI/CD 自動套用</h4>
        <p>在部署 Pipeline 中呼叫 <code>dotnet ef database update</code>。適合小型團隊。</p>
      </div>
      <div class="concept-card">
        <div class="icon">⚙️</div>
        <h4>程式啟動時套用</h4>
        <p>呼叫 <code>Database.MigrateAsync()</code>。最方便但風險最高。</p>
      </div>
    </div>

    <CodeBlock lang="csharp" filename="程式啟動時自動 Migrate（僅限開發環境）" :code="`
var app = builder.Build();

// 僅開發環境自動 Migrate
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.MigrateAsync();
}`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 Migration 最佳實踐</div>
      <p>
        ・每次 Migration 命名清楚（AddOrderNote、CreateProductIndex）<br>
        ・Migration 檔案應納入版本控制（Git）<br>
        ・正式環境推薦使用 SQL Script 方式部署<br>
        ・避免在 Migration 中放入大量資料操作，用 Seed 功能或獨立腳本
      </p>
    </div>

    <PageNav
      :prev="{ path: '/csharp/efcore/relations', label: '關聯設定' }"
      :next="{ path: '/csharp/efcore/advanced', label: '進階查詢' }"
    />
  </div>
</template>
