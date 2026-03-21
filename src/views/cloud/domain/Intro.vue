<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>網域管理概述</h1>
    <p class="page-subtitle">網域名稱、DNS 記錄類型、主流網域商比較（GoDaddy、Namecheap、Cloudflare Registrar）</p>

    <h2>網域名稱是什麼？</h2>
    <p>
      網域名稱（Domain Name）是網路上資源的人類可讀地址，如 <code>myapp.com</code>。
      網域系統（DNS）負責將這個名稱解析為 IP 位址，讓瀏覽器找到正確的伺服器。
      購買網域的商家稱為「網域商（Domain Registrar）」，需透過 ICANN 認可的服務商進行註冊。
    </p>

    <div class="arch-layers">
      <div class="arch-layer layer-app">
        <strong>使用者輸入 myapp.com</strong>
        <span>瀏覽器查詢本地 DNS 快取 → 作業系統 DNS → 上游 DNS</span>
      </div>
      <div class="arch-layer layer-app-service">
        <strong>遞迴 DNS 解析</strong>
        <span>根 DNS → .com TLD DNS → 負責 myapp.com 的 Authoritative DNS</span>
      </div>
      <div class="arch-layer layer-domain">
        <strong>Authoritative DNS（Cloudflare / GoDaddy）</strong>
        <span>回傳 A Record：myapp.com → 34.102.x.x</span>
      </div>
      <div class="arch-layer layer-infra">
        <strong>瀏覽器連線到 34.102.x.x</strong>
        <span>建立 TCP 連線 → TLS 握手 → HTTP 請求</span>
      </div>
    </div>

    <h2>網域架構術語</h2>
    <table>
      <thead>
        <tr><th>術語</th><th>說明</th><th>範例</th></tr>
      </thead>
      <tbody>
        <tr><td>根域名（Root Domain）</td><td>頂層網域，由網域商購買</td><td>myapp.com</td></tr>
        <tr><td>子域名（Subdomain）</td><td>根域名的前綴，可自由設定</td><td>api.myapp.com、www.myapp.com</td></tr>
        <tr><td>TLD</td><td>頂級域名（Top-Level Domain）</td><td>.com、.tw、.io、.dev</td></tr>
        <tr><td>Nameserver（NS）</td><td>負責解析此域名的 DNS 伺服器</td><td>aria.ns.cloudflare.com</td></tr>
        <tr><td>WHOIS</td><td>查詢域名所有者與到期日的公開資料庫</td><td>whois myapp.com</td></tr>
        <tr><td>TTL</td><td>Time-To-Live，DNS 記錄快取時間（秒）</td><td>3600 = 1 小時</td></tr>
      </tbody>
    </table>

    <h2>DNS 記錄類型</h2>
    <table>
      <thead>
        <tr><th>類型</th><th>用途</th><th>範例</th></tr>
      </thead>
      <tbody>
        <tr><td><strong>A</strong></td><td>將域名指向 IPv4 地址</td><td>myapp.com → 34.102.x.x</td></tr>
        <tr><td><strong>AAAA</strong></td><td>將域名指向 IPv6 地址</td><td>myapp.com → 2001:db8::1</td></tr>
        <tr><td><strong>CNAME</strong></td><td>將域名指向另一個域名（別名）</td><td>www.myapp.com → myapp.com</td></tr>
        <tr><td><strong>MX</strong></td><td>郵件交換器（收件伺服器）</td><td>myapp.com → mail.myapp.com (Priority 10)</td></tr>
        <tr><td><strong>TXT</strong></td><td>文字記錄，用於 SPF、DKIM、域名驗證</td><td>v=spf1 include:_spf.google.com ~all</td></tr>
        <tr><td><strong>NS</strong></td><td>指定域名的 Nameserver</td><td>aria.ns.cloudflare.com</td></tr>
        <tr><td><strong>CAA</strong></td><td>指定允許簽發 SSL 憑證的 CA</td><td>0 issue "letsencrypt.org"</td></tr>
        <tr><td><strong>SRV</strong></td><td>服務位置（VOIP、SIP 等）</td><td>_sip._tcp.myapp.com</td></tr>
      </tbody>
    </table>

    <h2>主流網域商比較</h2>
    <div class="concept-grid">
      <div class="concept-card">
        <div class="icon">🏪</div>
        <h4>GoDaddy</h4>
        <p>全球最大網域商，市場份額超過 20%。介面複雜，會推銷附加服務，首年優惠後續費用較高。支援台灣繁體中文。</p>
      </div>
      <div class="concept-card">
        <div class="icon">💰</div>
        <h4>Namecheap</h4>
        <p>價格透明、不推銷垃圾服務。.com 約 $9/年，免費 WhoisGuard 隱私保護。深受開發者社群喜愛。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🟠</div>
        <h4>Cloudflare Registrar</h4>
        <p>以成本價銷售網域（無利潤加成），.com 約 $9.15/年。強制與 Cloudflare DNS 整合，最適合已用 Cloudflare 的使用者。</p>
      </div>
      <div class="concept-card">
        <div class="icon">🔧</div>
        <h4>Google Domains（已停售）</h4>
        <p>已於 2023 年賣給 Squarespace。現有客戶自動遷移到 Squarespace Domains，功能類似但介面改變。</p>
      </div>
    </div>

    <h2>網域商功能對照</h2>
    <table>
      <thead>
        <tr><th>功能</th><th>GoDaddy</th><th>Namecheap</th><th>Cloudflare Registrar</th></tr>
      </thead>
      <tbody>
        <tr><td>.com 年費</td><td>首年 $1.99，續約 $22+</td><td>~$9/年</td><td>~$9.15/年（成本價）</td></tr>
        <tr><td>WHOIS 隱私</td><td>付費（$8-15/年）</td><td>免費（WhoisGuard）</td><td>免費（自動）</td></tr>
        <tr><td>DNS 管理</td><td>基本，功能有限</td><td>基本到進階</td><td>需用 Cloudflare DNS（功能最強）</td></tr>
        <tr><td>兩步驟驗證</td><td>✅</td><td>✅</td><td>✅</td></tr>
        <tr><td>域名轉移</td><td>60天鎖定，流程繁瑣</td><td>流程簡單</td><td>支援但有限制</td></tr>
        <tr><td>API 支援</td><td>✅</td><td>✅</td><td>✅（Cloudflare API）</td></tr>
        <tr><td>自動續約</td><td>✅（預設開啟）</td><td>✅</td><td>✅</td></tr>
        <tr><td>推薦對象</td><td>一般大眾</td><td>開發者、節省預算</td><td>已用 Cloudflare 者</td></tr>
      </tbody>
    </table>

    <h2>DNS 傳播與 TTL 管理</h2>
    <div class="info-box tip">
      <div class="info-box-title">✅ DNS 遷移最佳實踐</div>
      <p>
        在遷移 DNS 前，先將 TTL 調低到 <code>300</code>（5 分鐘）並等待舊 TTL 時間過去。
        這樣遷移後，所有客戶端的快取很快就會失效，減少遷移期間的服務中斷時間。<br><br>
        遷移完成且確認無誤後，再將 TTL 調高到 <code>3600</code>（1 小時）或更長，以減少 DNS 查詢量。
      </p>
    </div>

    <CodeBlock lang="bash" filename="DNS 傳播驗證工具" :code="`
# 查詢特定 DNS 伺服器的解析結果
dig @8.8.8.8 myapp.com A        # 查 Google DNS
dig @1.1.1.1 myapp.com A        # 查 Cloudflare DNS

# 查詢所有類型記錄
dig myapp.com ANY

# 查詢 MX 記錄
dig myapp.com MX

# 查詢 NS 記錄（確認 Nameserver 已更新）
dig myapp.com NS

# 使用 nslookup
nslookup myapp.com 8.8.8.8

# 檢查全球 DNS 傳播狀態
# 可使用線上工具：https://dnschecker.org/`" />

    <h2>常見 DNS 設定情境</h2>

    <CodeBlock lang="bash" filename="情境 1：根域名 + www 同時指向同一服務" :code="`
# A Record（根域名 → IP）
@    A      34.102.x.x    TTL: 300

# CNAME（www → 根域名，Cloudflare 特有的 CNAME Flattening）
www  CNAME  myapp.com     TTL: 300`" />

    <CodeBlock lang="bash" filename="情境 2：根域名指向 Cloud Run（CNAME 無法用於根域名的問題）" :code="`
# 問題：根域名無法設 CNAME（DNS 標準限制）
# Cloud Run 提供的是域名，不是固定 IP

# 解法 1：使用 Cloudflare（支援 CNAME Flattening）
@    CNAME  myapp-xxx.a.run.app    # Cloudflare 會在根域名層展開 CNAME

# 解法 2：使用 GCP Cloud Run 的 Custom Domain 功能
# GCP 會給你 A Record IP，再設 A Record
@    A      34.x.x.x`" />

    <CodeBlock lang="bash" filename="情境 3：郵件服務設定（Google Workspace）" :code="`
# MX Records（優先序低的先嘗試）
@    MX     1   aspmx.l.google.com
@    MX     5   alt1.aspmx.l.google.com
@    MX     5   alt2.aspmx.l.google.com
@    MX     10  alt3.aspmx.l.google.com
@    MX     10  alt4.aspmx.l.google.com

# SPF Record（防止偽造寄件人）
@    TXT    v=spf1 include:_spf.google.com ~all

# DMARC Record（郵件政策）
_dmarc    TXT    v=DMARC1; p=quarantine; rua=mailto:dmarc@myapp.com`" />

    <PageNav
      :prev="{ path: '/cloud/cloudflare/practice', label: 'Cloudflare 實戰' }"
      :next="{ path: '/cloud/combined/practice', label: '全流程整合實戰' }"
    />
  </div>
</template>
