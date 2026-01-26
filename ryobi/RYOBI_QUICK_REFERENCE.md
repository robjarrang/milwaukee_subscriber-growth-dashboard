# Ryobi Dashboard Quick Reference

A quick reference guide for the Ryobi Subscriber Growth Dashboard setup.

---

## Key Differences from Milwaukee

| Aspect | Milwaukee | Ryobi |
|--------|-----------|-------|
| **Naming Conventions** | Consistent region codes in Journey/Email names | No consistent naming convention |
| **Regional Email Metrics** | Tracked per region via name parsing | Not tracked (overall metrics only) |
| **Subscriber Structure** | Single MasterSubscribers DE with region field | 19 separate AllSubscribers_XX DEs per country |
| **Preference Tracking** | Trade preferences tracked | Product/marketing preferences tracked |
| **Countries Tracked** | 30+ regions/culture codes | 19 countries |
| **Primary Focus** | Regional email performance | Overall email + regional subscriber growth |

---

## Countries Covered

Ryobi operates in **19 European countries**:

🇬🇧 UK | 🇸🇪 SE | 🇷🇴 RO | 🇵🇹 PT | 🇵🇱 PL | 🇳🇴 NO | 🇳🇱 NL | 🇱🇹 LT | 🇱🇻 LV | 🇭🇺 HU  
🇮🇹 IT | 🇫🇷 FR | 🇫🇮 FI | 🇪🇸 ES | 🇪🇪 EE | 🇩🇰 DK | 🇧🇪 BE | 🇩🇪 DE | 🇨🇿 CZ

---

## Data Extensions Summary

### Email Performance Tracking

| Data Extension | Purpose | Refresh | Records |
|----------------|---------|---------|---------|
| **Monthly_Metrics_Staging_DE** | Subscriber-level send events (current month) | Daily | ~Millions |
| **Monthly_Metrics_Final_DE** | Aggregated monthly email metrics | Daily | ~12/year |
| **Campaign_Metrics_DE** | Individual campaign performance | Daily | ~Hundreds |

### Subscriber & Preference Tracking

| Data Extension | Purpose | Refresh | Records |
|----------------|---------|---------|---------|
| **SubscriberCount_Log_Daily** | Daily subscriber counts per country | Daily | 19/day |
| **PreferenceCount_Log_Daily** | Daily preference distributions per country | Daily | 209/day (19 × 11) |
| **AllSubscribers_XX** (×19) | Source subscriber data per country | Real-time | Varies by country |

---

## Tracked Preferences (11 Types)

### Marketing Opt-Ins
- ✉️ **New Product Launches** - `RYOBI_New_Product_Launches_Information__c`
- 🎁 **Exclusive Offers & Promotions** - `RYOBI_Exclusive_Offers_Promotions__c`
- 🏆 **Competitions & Giveaways** - `RYOBI_Competitions_Giveaways__c`

### Product Categories
- 🔋 **RYOBI One+** - `RYOBI_One__c`
- ⚡ **MAXPOWER** - `RYOBI_MAXPOWER__c`
- 🔌 **USB Lithium** - `RYOBI_USB_Lithium__c`

### Interest Categories
- 🎨 **Crafting** - `RYOBI_Crafting__c`
- 🚗 **Automotive** - `RYOBI_Automotive__c`
- 🏕️ **Camping** - `RYOBI_Camping__c`
- 🧹 **Cleaning** - `RYOBI_Cleaning__c`
- 🌱 **Gardening** - `RYOBI_Gardening__c`

---

## Automation Schedule

| Time | Automation | Duration | Purpose |
|------|------------|----------|---------|
| 2:00 AM | Monthly Email Metrics | ~15-30 min | Aggregate send/open/click/bounce data |
| 3:00 AM | Daily Subscriber & Preference Counts | ~5-10 min | Log subscriber growth & preferences |
| 4:00 AM | Campaign Metrics Collection | ~10-15 min | Individual campaign performance |

**Total Daily Runtime:** ~30-55 minutes

---

## Email Metrics Tracked

### Volume Metrics
- Total Sent
- Total Delivered
- Total Bounced (Unique)
- Total Opens (Unique + Total)
- Total Clicks (Unique + Total)
- Total Unsubscribes (Unique)

### Performance Rates
- **Delivery Rate** = Delivered / Sent × 100
- **Bounce Rate** = Bounced / Sent × 100
- **Open Rate** = Unique Opens / Delivered × 100
- **Click-Through Rate (CTR)** = Unique Clicks / Delivered × 100
- **Click-to-Open Rate (CTOR)** = Unique Clicks / Unique Opens × 100
- **Unsubscribe Rate** = Unique Unsubs / Delivered × 100

---

## Dashboard Capabilities

### ✅ What's Tracked

- **Overall Email Performance** - Monthly aggregated metrics across all countries
- **Individual Campaign Performance** - Per-campaign metrics for last 7 days (configurable)
- **Subscriber Growth by Country** - Daily subscriber counts per country
- **Preference Trends by Country** - Daily distribution of 11 preference types per country
- **Historical Trends** - All metrics retained for time-series analysis

### ❌ What's NOT Tracked

- **Regional Email Performance** - Cannot extract region from Journey/Email names due to inconsistent naming
- **Regional Bounce/Open/Click Breakdown** - Overall metrics only
- **Per-Region Campaign Performance** - Campaign metrics are not regionalized

---

## Data Flow Diagram

```
┌─────────────────────┐
│   Email Sends       │
│ (Journey Builder,   │
│ Automation Studio)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────┐
│ _Sent, _Bounce, _Open,     │
│ _Click, _Unsubscribe        │
│ (System Data Views)         │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Monthly_Metrics_Staging_DE  │
│ (Current month, daily       │
│  refresh)                   │
└──────────┬──────────────────┘
           │
           ▼
┌─────────────────────────────┐
│ Monthly_Metrics_Final_DE    │
│ (Historical monthly         │
│  aggregates)                │
└─────────────────────────────┘


┌──────────────────────────────────┐
│ AllSubscribers_XX (×19)          │
│ (Real-time subscriber data)      │
└──────────┬───────────────────────┘
           │
           ├──────────────────┐
           │                  │
           ▼                  ▼
┌───────────────────┐  ┌─────────────────────┐
│ SubscriberCount_  │  │ PreferenceCount_    │
│ Log_Daily         │  │ Log_Daily           │
│ (Daily counts     │  │ (Daily preference   │
│  per country)     │  │  distributions)     │
└───────────────────┘  └─────────────────────┘
```

---

## Field Naming Conventions

### Subscriber Data Extensions (AllSubscribers_XX)

| Field Name | Type | Length | Description |
|------------|------|--------|-------------|
| SubscriberKey | Text | 20 | Primary key |
| uid | Text | 50 | Unique identifier |
| EmailAddress | EmailAddress | 254 | Email address |
| CountryCode | Text | 2 | ISO country code |
| FirstName | Text | 50 | First name |
| LastName | Text | 80 | Last name |
| User_Culture__c | Text | 255 | User culture/language |
| RYOBI_[Preference]__c | Boolean | - | Preference flag |

### Metrics Data Extensions

- **YearNumber** - 4-digit year (e.g., 2025)
- **MonthNumber** - Month 1-12
- **CountryCode** - 2-character ISO code
- **Total[Metric]** - Raw count
- **Total[Metric]Unique** - Deduplicated count
- **[Metric]RatePct** - Percentage (Decimal 6,2)

---

## Common Queries

### Check Latest Subscriber Counts

```sql
SELECT 
    CountryCode,
    SubscriberCount,
    LogDate
FROM SubscriberCount_Log_Daily
WHERE LogDate = (SELECT MAX(LogDate) FROM SubscriberCount_Log_Daily)
ORDER BY SubscriberCount DESC
```

### Top Preferences by Country

```sql
SELECT 
    CountryCode,
    PreferenceType,
    PreferencePercentage
FROM PreferenceCount_Log_Daily
WHERE LogDate = (SELECT MAX(LogDate) FROM PreferenceCount_Log_Daily)
ORDER BY CountryCode, PreferencePercentage DESC
```

### Latest Monthly Email Performance

```sql
SELECT 
    YearNumber,
    MonthNumber,
    TotalSent,
    DeliveryRatePct,
    OpenRatePct,
    ClickThroughRatePct
FROM Monthly_Metrics_Final_DE
ORDER BY YearNumber DESC, MonthNumber DESC
```

### Top Performing Campaigns

```sql
SELECT TOP 10
    EmailName,
    SendDate,
    TotalSent,
    OpenRate,
    ClickRate
FROM Campaign_Metrics_DE
ORDER BY SendDate DESC, OpenRate DESC
```

---

## Implementation Checklist

### Phase 1: Data Extension Setup
- [ ] Create `Monthly_Metrics_Staging_DE`
- [ ] Create `Monthly_Metrics_Final_DE`
- [ ] Create `SubscriberCount_Log_Daily`
- [ ] Create `PreferenceCount_Log_Daily`
- [ ] Create `Campaign_Metrics_DE`

### Phase 2: Automation Setup
- [ ] Create "Monthly Email Metrics" automation (Steps 1-6)
- [ ] Create "Daily Subscriber & Preference Counts" automation (19 countries × 2 steps)
- [ ] Create "Campaign Metrics Collection" automation
- [ ] Test all automations with sample data
- [ ] Schedule automations (2:00 AM, 3:00 AM, 4:00 AM)

### Phase 3: Dashboard Setup
- [ ] Create email performance dashboard
- [ ] Create subscriber growth dashboard
- [ ] Create preference trends dashboard
- [ ] Add filters and drill-downs
- [ ] Test with historical data

### Phase 4: Validation
- [ ] Verify data accuracy against SFMC UI
- [ ] Check for missing countries in logs
- [ ] Validate percentage calculations
- [ ] Test date range filters
- [ ] Review dashboard performance

---

## Troubleshooting

### Missing Subscriber Counts for a Country

**Check:** 
- AllSubscribers_XX data extension exists
- Data extension is not empty
- Query uses correct DE name
- WHERE clause includes `EmailAddress IS NOT NULL`

### Low Preference Percentages

**Possible Causes:**
- Boolean fields may be NULL instead of FALSE
- Subscribers haven't updated preferences
- Recent data migration or field additions

**Solution:** Update queries to handle NULL values:
```sql
SUM(CASE WHEN ISNULL(RYOBI_Gardening__c, 0) = 1 THEN 1 ELSE 0 END)
```

### Email Metrics Not Updating

**Check:**
- System Data Views are accessible
- Date range filters are correct
- Staging DE is populating (Step 1)
- No query timeout errors in Automation Studio

### Missing Campaigns in Campaign_Metrics_DE

**Check:**
- DeliveredTime filter (currently last 7 days)
- Test email exclusion (may be too aggressive)
- JobID exists in _Job table
- Campaign actually sent emails

---

## Best Practices

1. **Backup Before Changes** - Export data extensions before modifying queries
2. **Test with Small Date Ranges** - Start with 1-2 days when testing new queries
3. **Monitor Automation Runtime** - Set up alerts for failed or long-running automations
4. **Document Custom Changes** - Keep track of any modifications to queries
5. **Regular Data Validation** - Spot-check metrics against SFMC UI monthly
6. **Archive Old Data** - Consider archiving data older than 2 years to separate DEs
7. **Index Key Fields** - Ensure primary keys are set on all data extensions

---

## Support & Maintenance

### Monthly Tasks
- Review automation success rates
- Validate data accuracy
- Check for new countries added
- Review preference trends

### Quarterly Tasks
- Audit data extension storage usage
- Review dashboard usage and feedback
- Optimize slow-running queries
- Update documentation with changes

### Annual Tasks
- Archive historical data (>2 years old)
- Review and update preference categories
- Assess new dashboard requirements
- Performance optimization review

---

*Last Updated: November 18, 2025*
