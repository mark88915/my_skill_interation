<script setup>
import CodeBlock from '../../../components/CodeBlock.vue'
import PageNav from '../../../components/PageNav.vue'
</script>

<template>
  <div class="content-wrapper">
    <h1>實戰案例</h1>
    <p class="page-subtitle">完整案例：用 SDD + Claude Code 開發優惠券系統</p>

    <h2>案例背景</h2>
    <p>
      我們要為電商平台開發優惠券（Coupon）系統。支援百分比折扣和固定金額折扣，
      每張優惠券有使用期限和使用次數限制。
    </p>

    <h2>Phase 1：需求分析與規格撰寫</h2>
    <CodeBlock lang="bash" filename="specs/coupon-system.md" :code="`
# Feature: 優惠券系統

## 概述
客戶在結帳時可以輸入優惠券代碼，系統驗證並套用折扣。

## 術語
- 優惠券（Coupon）：包含折扣規則的可重複使用票券
- 優惠券代碼（Code）：客戶輸入的唯一識別碼，格式為大寫英數字 6-12 碼
- 折扣類型：百分比折扣（Percentage）、固定金額折扣（FixedAmount）

## 業務規則

### Coupon 建立規則
- Code 必須唯一，6-12 碼大寫英數字
- Percentage 折扣範圍：1% - 50%
- FixedAmount 折扣範圍：1 元 - 10,000 元
- MaxUsageCount：最大使用次數（0 = 無限制）
- ValidFrom / ValidUntil：有效期間

### 套用優惠券

GIVEN 一張有效的百分比優惠券（20% off, 有效期內, 尚有使用次數）
AND 一筆金額為 NT$1,000 的訂單
WHEN 客戶套用此優惠券
THEN 折扣金額 = NT$200，訂單應付金額 = NT$800

GIVEN 一張有效的固定金額優惠券（NT$150 off）
AND 一筆金額為 NT$1,000 的訂單
WHEN 客戶套用此優惠券
THEN 折扣金額 = NT$150，訂單應付金額 = NT$850

GIVEN 一張固定金額優惠券（NT$500 off）
AND 一筆金額為 NT$300 的訂單
WHEN 客戶套用此優惠券
THEN 折扣金額 = NT$300（不超過訂單金額），訂單應付金額 = NT$0

### 錯誤情境

GIVEN 一張已過期的優惠券
WHEN 客戶套用
THEN 拒絕，回傳 &quot;優惠券已過期&quot;

GIVEN 一張已達使用上限的優惠券
WHEN 客戶套用
THEN 拒絕，回傳 &quot;優惠券已達使用上限&quot;

GIVEN 不存在的優惠券代碼
WHEN 客戶套用
THEN 拒絕，回傳 &quot;無效的優惠券代碼&quot;`" />

    <h2>Phase 2：規格轉測試</h2>
    <CodeBlock lang="csharp" filename="Tests/CouponTests.cs" :code="`
public class CouponTests
{
    private static readonly DateTime Now = new(2024, 6, 15);

    private Coupon CreateValidPercentageCoupon(
        int percentage = 20, int maxUsage = 100)
    {
        return Coupon.CreatePercentage(
            code: &quot;SAVE20&quot;,
            percentage: percentage,
            validFrom: Now.AddDays(-10),
            validUntil: Now.AddDays(10),
            maxUsageCount: maxUsage);
    }

    private Coupon CreateValidFixedAmountCoupon(
        decimal amount = 150, int maxUsage = 100)
    {
        return Coupon.CreateFixedAmount(
            code: &quot;FLAT150&quot;,
            amount: new Money(amount, Currency.TWD),
            validFrom: Now.AddDays(-10),
            validUntil: Now.AddDays(10),
            maxUsageCount: maxUsage);
    }

    // === 建立規則 ===

    [Theory]
    [InlineData(0)]
    [InlineData(51)]
    [InlineData(-5)]
    public void CreatePercentage_InvalidRate_ShouldFail(int pct)
    {
        Assert.Throws<DomainException>(() =>
            Coupon.CreatePercentage(&quot;TEST&quot;, pct,
                Now, Now.AddDays(1), 100));
    }

    [Fact]
    public void CreateFixedAmount_ExceedsLimit_ShouldFail()
    {
        Assert.Throws<DomainException>(() =>
            Coupon.CreateFixedAmount(&quot;TEST&quot;,
                new Money(10001, Currency.TWD),
                Now, Now.AddDays(1), 100));
    }

    // === 套用折扣 ===

    [Fact]
    public void ApplyPercentage_ShouldCalculateCorrectDiscount()
    {
        var coupon = CreateValidPercentageCoupon(20);
        var orderAmount = new Money(1000, Currency.TWD);

        var discount = coupon.CalculateDiscount(orderAmount, Now);

        Assert.Equal(200m, discount.Amount);
    }

    [Fact]
    public void ApplyFixedAmount_ShouldReturnFixedDiscount()
    {
        var coupon = CreateValidFixedAmountCoupon(150);
        var orderAmount = new Money(1000, Currency.TWD);

        var discount = coupon.CalculateDiscount(orderAmount, Now);

        Assert.Equal(150m, discount.Amount);
    }

    [Fact]
    public void ApplyFixedAmount_ExceedsOrder_ShouldCapAtOrderAmount()
    {
        var coupon = CreateValidFixedAmountCoupon(500);
        var orderAmount = new Money(300, Currency.TWD);

        var discount = coupon.CalculateDiscount(orderAmount, Now);

        Assert.Equal(300m, discount.Amount);
    }

    // === 錯誤情境 ===

    [Fact]
    public void Apply_ExpiredCoupon_ShouldThrow()
    {
        var coupon = CreateValidPercentageCoupon();
        var futureDate = Now.AddDays(20); // 超過有效期

        var ex = Assert.Throws<DomainException>(() =>
            coupon.CalculateDiscount(
                new Money(1000, Currency.TWD), futureDate));

        Assert.Equal(&quot;優惠券已過期&quot;, ex.Message);
    }

    [Fact]
    public void Apply_MaxUsageReached_ShouldThrow()
    {
        var coupon = CreateValidPercentageCoupon(20, maxUsage: 1);
        coupon.RecordUsage(); // 使用一次

        var ex = Assert.Throws<DomainException>(() =>
            coupon.CalculateDiscount(
                new Money(1000, Currency.TWD), Now));

        Assert.Equal(&quot;優惠券已達使用上限&quot;, ex.Message);
    }
}`" />

    <h2>Phase 3：交給 Claude Code 實作</h2>
    <CodeBlock lang="bash" filename="Claude Code 對話" :code="`
> 請閱讀 @specs/coupon-system.md 規格和 @Tests/CouponTests.cs 測試。
> 實作 Coupon aggregate，讓所有測試通過。
> 遵循專案的 DDD 架構：
> - Coupon 放在 Domain/Aggregates/Coupons/
> - 使用 Strongly Typed ID (CouponId)
> - EF Core Configuration 放在 Infrastructure/Configurations/
> - 建立 ICouponRepository 介面
>
> 先實作 Domain 層，跑測試通過後再做 Infrastructure 和 API。`" />

    <h2>Phase 4：AI 實作產出</h2>
    <CodeBlock lang="csharp" filename="Domain/Aggregates/Coupons/Coupon.cs (AI 產出)" :code="`
public class Coupon : AggregateRoot<CouponId>
{
    public string Code { get; private set; }
    public CouponType Type { get; private set; }
    public int? Percentage { get; private set; }
    public Money? FixedAmount { get; private set; }
    public DateTime ValidFrom { get; private set; }
    public DateTime ValidUntil { get; private set; }
    public int MaxUsageCount { get; private set; }
    public int CurrentUsageCount { get; private set; }

    private Coupon() { }

    public static Coupon CreatePercentage(
        string code, int percentage,
        DateTime validFrom, DateTime validUntil,
        int maxUsageCount)
    {
        if (percentage < 1 || percentage > 50)
            throw new DomainException(
                &quot;百分比折扣範圍必須在 1% - 50% 之間&quot;);

        ValidateCommon(code, validFrom, validUntil, maxUsageCount);

        return new Coupon
        {
            Id = CouponId.NewId(),
            Code = code.ToUpperInvariant(),
            Type = CouponType.Percentage,
            Percentage = percentage,
            ValidFrom = validFrom,
            ValidUntil = validUntil,
            MaxUsageCount = maxUsageCount,
            CurrentUsageCount = 0
        };
    }

    public static Coupon CreateFixedAmount(
        string code, Money amount,
        DateTime validFrom, DateTime validUntil,
        int maxUsageCount)
    {
        if (amount.Amount < 1 || amount.Amount > 10000)
            throw new DomainException(
                &quot;固定金額折扣範圍必須在 1 - 10,000 之間&quot;);

        ValidateCommon(code, validFrom, validUntil, maxUsageCount);

        return new Coupon
        {
            Id = CouponId.NewId(),
            Code = code.ToUpperInvariant(),
            Type = CouponType.FixedAmount,
            FixedAmount = amount,
            ValidFrom = validFrom,
            ValidUntil = validUntil,
            MaxUsageCount = maxUsageCount,
            CurrentUsageCount = 0
        };
    }

    public Money CalculateDiscount(Money orderAmount, DateTime now)
    {
        if (now < ValidFrom || now > ValidUntil)
            throw new DomainException(&quot;優惠券已過期&quot;);

        if (MaxUsageCount > 0 && CurrentUsageCount >= MaxUsageCount)
            throw new DomainException(&quot;優惠券已達使用上限&quot;);

        return Type switch
        {
            CouponType.Percentage =>
                new Money(
                    orderAmount.Amount * Percentage!.Value / 100m,
                    orderAmount.Currency),

            CouponType.FixedAmount =>
                new Money(
                    Math.Min(FixedAmount!.Amount, orderAmount.Amount),
                    orderAmount.Currency),

            _ => throw new DomainException(&quot;未知的折扣類型&quot;)
        };
    }

    public void RecordUsage()
    {
        CurrentUsageCount++;
    }

    private static void ValidateCommon(
        string code, DateTime validFrom,
        DateTime validUntil, int maxUsageCount)
    {
        if (string.IsNullOrWhiteSpace(code) ||
            code.Length < 6 || code.Length > 12)
            throw new DomainException(
                &quot;優惠券代碼必須為 6-12 碼&quot;);

        if (validFrom >= validUntil)
            throw new DomainException(
                &quot;有效期間設定錯誤&quot;);
    }
}`" />

    <h2>Phase 5：驗證結果</h2>
    <CodeBlock lang="bash" filename="測試結果" :code="`
$ dotnet test --filter CouponTests

Passed!  - Failed:  0, Passed: 7, Skipped: 0, Total: 7
Duration: 0.8s

✅ 所有測試通過，實作符合規格！`" />

    <div class="info-box tip">
      <div class="info-box-title">💡 案例總結</div>
      <p>
        整個開發過程中，人類的工作是：<br>
        1. 撰寫規格文件（思考業務邏輯）<br>
        2. 審查測試案例（確保覆蓋完整）<br>
        3. 審查 AI 產出的程式碼（確保品質）<br><br>
        AI 的工作是：<br>
        1. 根據規格生成測試案例<br>
        2. 實作程式碼讓測試通過<br>
        3. 自動修正測試失敗的問題<br><br>
        <strong>人類專注「What & Why」，AI 處理「How」。</strong>
      </p>
    </div>

    <PageNav
      :prev="{ path: '/ai/sdd/with-claude', label: '搭配 AI 實作' }"
    />
  </div>
</template>
