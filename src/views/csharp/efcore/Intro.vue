<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>EF Core 概述</h1>
    <p class="page-subtitle">認識 Entity Framework Core — .NET 的現代 ORM</p>

    <h2>什麼是 EF Core？</h2>
    <p>
      <strong>Entity Framework Core</strong> 是 Microsoft 官方的開源 ORM（Object-Relational Mapper），
      讓開發者用 C# 物件操作資料庫，不需要手寫大量 SQL。它支援多種資料庫，本教學以 <strong>SQL Server</strong> 為主。
    </p>

    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🔄</div>
        <h4>物件關聯映射</h4>
        <p>將 C# 類別自動對應到資料庫表格，屬性對應欄位。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📝</div>
        <h4>LINQ 查詢</h4>
        <p>使用 C# 的 LINQ 語法查詢資料庫，型別安全且可組合。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔍</div>
        <h4>變更追蹤</h4>
        <p>自動追蹤物件的修改，SaveChanges 時產生對應的 SQL。</p>
      </div>
      <div class="concept-card">
        <div class="icon">📦</div>
        <h4>Migration</h4>
        <p>將模型變更轉為資料庫結構異動腳本，支援版本控制。</p>
      </div>
    </div>

    <h2>EF Core 的運作原理</h2>
    <div class="arch-diagram">
      <div class="arch-layer presentation" style="max-width: 400px;">
        <strong>你的 C# 程式碼</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">LINQ 查詢、新增/修改/刪除物件</div>
      </div>
      <div class="arch-arrow">⬇️ ⬆️</div>
      <div class="arch-layer domain" style="max-width: 400px;">
        <strong>DbContext + Change Tracker</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">追蹤物件狀態、產生 SQL</div>
      </div>
      <div class="arch-arrow">⬇️ ⬆️</div>
      <div class="arch-layer infrastructure" style="max-width: 400px;">
        <strong>SQL Server Database</strong>
        <div style="font-size: 12px; margin-top: 4px; font-weight: 400;">實際的資料儲存與查詢</div>
      </div>
    </div>

    <h2>Code First vs. Database First</h2>
    <table>
      <thead>
        <tr>
          <th></th>
          <th>Code First</th>
          <th>Database First</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>起點</strong></td>
          <td>先寫 C# 類別，再生成資料庫</td>
          <td>先有資料庫，再生成 C# 類別</td>
        </tr>
        <tr>
          <td><strong>適用</strong></td>
          <td>新專案、DDD 開發</td>
          <td>已有資料庫的遺留系統</td>
        </tr>
        <tr>
          <td><strong>管理</strong></td>
          <td>使用 Migration 管理結構變更</td>
          <td>使用 Scaffold-DbContext 反向工程</td>
        </tr>
        <tr>
          <td><strong>DDD 適配</strong></td>
          <td>⭐ 非常適合</td>
          <td>需要額外的映射層</td>
        </tr>
      </tbody>
    </table>

    <div class="info-box tip">
      <div class="info-box-title">💡 本教學採用 Code First</div>
      <p>Code First 與 DDD 天然契合——我們先設計 Domain Model，再透過 EF Core 的設定將其映射到 SQL Server。</p>
    </div>

    <h2>快速體驗</h2>
    <CodeBlock lang="csharp" filename="QuickStart.cs" :code="`
// 1. 定義 Entity
public class Blog
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Url { get; set; } = string.Empty;
    public List<Post> Posts { get; set; } = new();
}

public class Post
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public int BlogId { get; set; }
    public Blog Blog { get; set; } = null!;
}

// 2. 定義 DbContext
public class BlogDbContext : DbContext
{
    public DbSet<Blog> Blogs => Set<Blog>();
    public DbSet<Post> Posts => Set<Post>();

    protected override void OnConfiguring(
        DbContextOptionsBuilder options)
    {
        options.UseSqlServer(
            &quot;Server=(localdb)\\\\mssqllocaldb;Database=BlogDb;&quot; +
            &quot;Trusted_Connection=True;&quot;);
    }
}

// 3. 使用
await using var db = new BlogDbContext();

// 新增
db.Blogs.Add(new Blog
{
    Title = &quot;我的部落格&quot;,
    Url = &quot;https://myblog.com&quot;
});
await db.SaveChangesAsync();

// 查詢
var blogs = await db.Blogs
    .Where(b => b.Title.Contains(&quot;部落格&quot;))
    .Include(b => b.Posts)
    .ToListAsync();`" />

    <PageNav
      :prev="{ path: '/csharp/ddd/advanced', label: 'DDD 進階主題' }"
      :next="{ path: '/csharp/efcore/setup', label: '環境設定' }"
    />
  </div>
</template>
