# Ryobi Automation Studio Tasks

This document outlines the SQL queries and automation steps for the Ryobi Subscriber Growth Dashboard.

**Key Differences from Milwaukee:**
- No region extraction from Journey/Email names (inconsistent naming conventions)
- Simplified to overall metrics only for email sends
- Added subscriber and preference tracking per country
- Uses 19 separate AllSubscribers_XX data extensions

---

## Automation 1: Monthly Email Metrics

**Schedule:** Daily at 2:00 AM  
**Purpose:** Collect and aggregate email send metrics for the current month

### Step 1: Populate Staging Table with Sent Events

```sql
SELECT DISTINCT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID
FROM _Sent s 
INNER JOIN _Job j ON s.JobID = j.JobID
WHERE s.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND s.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Overwrite

**Notes:**
- Captures all sent events for the current month
- Does not attempt region extraction due to inconsistent naming
- Uses composite key (JobID, ListID, BatchID, SubscriberID)

---

### Step 2: Update Staging with Bounce Events

```sql
SELECT 
    b.JobID, 
    b.ListID, 
    b.BatchID, 
    b.SubscriberID, 
    1 AS IsBounced 
FROM _Bounce b 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON b.JobID = s.JobID 
    AND b.ListID = s.ListID 
    AND b.BatchID = s.BatchID 
    AND b.SubscriberID = s.SubscriberID 
WHERE b.IsUnique = 1 
    AND b.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND b.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 3: Update Staging with Unique Open Events

```sql
SELECT 
    o.JobID, 
    o.ListID, 
    o.BatchID, 
    o.SubscriberID, 
    1 AS IsOpened 
FROM _Open o 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON o.JobID = s.JobID 
    AND o.ListID = s.ListID 
    AND o.BatchID = s.BatchID 
    AND o.SubscriberID = s.SubscriberID 
WHERE o.IsUnique = 1 
    AND o.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND o.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 3b: Update Staging with Total Opens

```sql
SELECT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID, 
    COUNT(*) AS TotalOpens 
FROM _Open o 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON o.JobID = s.JobID 
    AND o.ListID = s.ListID 
    AND o.BatchID = s.BatchID 
    AND o.SubscriberID = s.SubscriberID 
WHERE o.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND o.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY s.JobID, s.ListID, s.BatchID, s.SubscriberID
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 4: Update Staging with Unique Click Events

```sql
SELECT 
    c.JobID, 
    c.ListID, 
    c.BatchID, 
    c.SubscriberID, 
    1 AS IsClicked 
FROM _Click c 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON c.JobID = s.JobID 
    AND c.ListID = s.ListID 
    AND c.BatchID = s.BatchID 
    AND c.SubscriberID = s.SubscriberID 
WHERE c.IsUnique = 1 
    AND c.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND c.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 4b: Update Staging with Total Clicks

```sql
SELECT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID, 
    COUNT(*) AS TotalClicks 
FROM _Click c 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON c.JobID = s.JobID 
    AND c.ListID = s.ListID 
    AND c.BatchID = s.BatchID 
    AND c.SubscriberID = s.SubscriberID 
WHERE c.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND c.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY s.JobID, s.ListID, s.BatchID, s.SubscriberID
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 5: Update Staging with Unsubscribe Events

```sql
SELECT 
    u.JobID, 
    u.ListID, 
    u.BatchID, 
    u.SubscriberID, 
    1 AS IsUnsubscribed 
FROM _Unsubscribe u 
INNER JOIN Monthly_Metrics_Staging_DE s 
    ON u.JobID = s.JobID 
    AND u.ListID = s.ListID 
    AND u.BatchID = s.BatchID 
    AND u.SubscriberID = s.SubscriberID 
WHERE u.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND u.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

**Target Data Extension:** `Monthly_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID, ListID, BatchID, SubscriberID

---

### Step 6: Aggregate to Final Metrics Table

```sql
SELECT
    YEAR(GETDATE()) AS YearNumber,
    MONTH(GETDATE()) AS MonthNumber,
    COUNT(s.SubscriberID) AS TotalSent,
    SUM(ISNULL(s.IsBounced, 0)) AS TotalBouncedUnique,
    (COUNT(s.SubscriberID) - SUM(ISNULL(s.IsBounced, 0))) AS TotalDelivered,
    SUM(ISNULL(s.IsOpened, 0)) AS TotalOpenUnique,
    SUM(ISNULL(s.TotalOpens, 0)) AS TotalOpens,
    SUM(ISNULL(s.IsClicked, 0)) AS TotalClickUnique,
    SUM(ISNULL(s.TotalClicks, 0)) AS TotalClicks,
    SUM(ISNULL(s.IsUnsubscribed, 0)) AS TotalUnsubscribedUnique,
    CAST((COUNT(s.SubscriberID) - SUM(ISNULL(s.IsBounced, 0))) * 100.0 / NULLIF(COUNT(s.SubscriberID), 0) AS DECIMAL(6,2)) AS DeliveryRatePct,
    CAST(SUM(ISNULL(s.IsBounced, 0)) * 100.0 / NULLIF(COUNT(s.SubscriberID), 0) AS DECIMAL(6,2)) AS BounceRatePct,
    CAST(SUM(ISNULL(s.IsOpened, 0)) * 100.0 / NULLIF((COUNT(s.SubscriberID) - SUM(ISNULL(s.IsBounced, 0))), 0) AS DECIMAL(6,2)) AS OpenRatePct,
    CAST(SUM(ISNULL(s.IsClicked, 0)) * 100.0 / NULLIF((COUNT(s.SubscriberID) - SUM(ISNULL(s.IsBounced, 0))), 0) AS DECIMAL(6,2)) AS ClickThroughRatePct,
    CAST(SUM(ISNULL(s.IsClicked, 0)) * 100.0 / NULLIF(SUM(ISNULL(s.IsOpened, 0)), 0) AS DECIMAL(6,2)) AS ClickToOpenRatePct,
    CAST(SUM(ISNULL(s.IsUnsubscribed, 0)) * 100.0 / NULLIF((COUNT(s.SubscriberID) - SUM(ISNULL(s.IsBounced, 0))), 0) AS DECIMAL(6,2)) AS UnsubscribeRatePct
FROM Monthly_Metrics_Staging_DE s
```

**Target Data Extension:** `Monthly_Metrics_Final_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** YearNumber, MonthNumber

**Notes:**
- Aggregates all metrics to monthly summary
- No regional breakdown due to naming inconsistencies
- Calculates all percentage rates
- Updates existing month or adds new month

---

## Automation 2: Daily Subscriber & Preference Counts

**Schedule:** Daily at 3:00 AM  
**Purpose:** Track subscriber counts and preference distributions per country

### UK - Step 1: Count UK Subscribers

```sql
SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    COUNT(*) AS SubscriberCount
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL
```

**Target Data Extension:** `SubscriberCount_Log_Daily`  
**Action:** Add

---

### UK - Step 2: Count UK Preferences

```sql
SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'New_Product_Launches' AS PreferenceType,
    SUM(CASE WHEN RYOBI_New_Product_Launches_Information__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_New_Product_Launches_Information__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Exclusive_Offers' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Exclusive_Offers_Promotions__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Exclusive_Offers_Promotions__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Competitions_Giveaways' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Competitions_Giveaways__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Competitions_Giveaways__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'RYOBI_One' AS PreferenceType,
    SUM(CASE WHEN RYOBI_One__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_One__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'MAXPOWER' AS PreferenceType,
    SUM(CASE WHEN RYOBI_MAXPOWER__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_MAXPOWER__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'USB_Lithium' AS PreferenceType,
    SUM(CASE WHEN RYOBI_USB_Lithium__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_USB_Lithium__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Crafting' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Crafting__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Crafting__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Automotive' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Automotive__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Automotive__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Camping' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Camping__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Camping__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Cleaning' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Cleaning__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Cleaning__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL

UNION ALL

SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    'UK' AS CountryCode,
    'Gardening' AS PreferenceType,
    SUM(CASE WHEN RYOBI_Gardening__c = 1 THEN 1 ELSE 0 END) AS PreferenceCount,
    COUNT(*) AS TotalSubscribers,
    CAST(SUM(CASE WHEN RYOBI_Gardening__c = 1 THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0) AS DECIMAL(6,2)) AS PreferencePercentage
FROM AllSubscribers_UK
WHERE EmailAddress IS NOT NULL
```

**Target Data Extension:** `PreferenceCount_Log_Daily`  
**Action:** Add

---

### Repeat for All 19 Countries

**Note:** The above steps should be repeated for each of the following country codes:
- SE (Sweden)
- RO (Romania)
- PT (Portugal)
- PL (Poland)
- NO (Norway)
- NL (Netherlands)
- LT (Lithuania)
- LV (Latvia)
- HU (Hungary)
- IT (Italy)
- FR (France)
- FI (Finland)
- ES (Spain)
- EE (Estonia)
- DK (Denmark)
- BE (Belgium)
- DE (Germany)
- CZ (Czech Republic)

Each country requires:
1. A subscriber count query (Step 1 pattern)
2. A preference count query (Step 2 pattern)

Simply replace:
- `'UK'` with the appropriate country code
- `AllSubscribers_UK` with the appropriate data extension name (e.g., `AllSubscribers_SE`, `AllSubscribers_RO`, etc.)

---

## Automation 3: Campaign Metrics Collection

**Schedule:** Daily at 4:00 AM  
**Purpose:** Collect individual campaign performance metrics

**Note:** This automation uses a staging approach to avoid timeouts. Create a `Campaign_Metrics_Staging_DE` with the same schema as `Campaign_Metrics_DE`.

### Step 1: Create Campaign Base with Sent Counts

```sql
SELECT 
    j.JobID,
    j.EmailName,
    j.EmailSubject,
    CAST(j.DeliveredTime AS DATE) AS SendDate,
    COALESCE(jn.JourneyName, j.EmailName) AS JourneyName,
    COUNT(DISTINCT s.SubscriberID) AS TotalSent
FROM _Job j
INNER JOIN _Sent s ON j.JobID = s.JobID
LEFT JOIN _JourneyActivity ja ON j.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
LEFT JOIN _Journey jn ON ja.VersionID = jn.VersionID
WHERE s.EventDate >= DATEADD(DAY, -7, GETDATE())
    AND j.EmailName NOT LIKE '%test%'
    AND j.EmailName NOT LIKE '%Test%'
    AND j.EmailName NOT LIKE '%TEST%'
GROUP BY 
    j.JobID,
    j.EmailName,
    j.EmailSubject,
    CAST(j.DeliveredTime AS DATE),
    COALESCE(jn.JourneyName, j.EmailName)
```

**Target Data Extension:** `Campaign_Metrics_Staging_DE`  
**Action:** Overwrite

---

### Step 2: Update with Bounce Counts

```sql
SELECT 
    s.JobID,
    COUNT(DISTINCT b.SubscriberID) AS TotalBounced
FROM Campaign_Metrics_Staging_DE s
INNER JOIN _Bounce b ON s.JobID = b.JobID
WHERE b.IsUnique = 1
    AND b.EventDate >= DATEADD(DAY, -7, GETDATE())
GROUP BY s.JobID
```

**Target Data Extension:** `Campaign_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID

---

### Step 3: Update with Open Counts

```sql
SELECT 
    s.JobID,
    COUNT(DISTINCT o.SubscriberID) AS TotalOpened
FROM Campaign_Metrics_Staging_DE s
INNER JOIN _Open o ON s.JobID = o.JobID
WHERE o.IsUnique = 1
    AND o.EventDate >= DATEADD(DAY, -7, GETDATE())
GROUP BY s.JobID
```

**Target Data Extension:** `Campaign_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID

---

### Step 4: Update with Click Counts

```sql
SELECT 
    s.JobID,
    COUNT(DISTINCT c.SubscriberID) AS TotalClicked
FROM Campaign_Metrics_Staging_DE s
INNER JOIN _Click c ON s.JobID = c.JobID
WHERE c.IsUnique = 1
    AND c.EventDate >= DATEADD(DAY, -7, GETDATE())
GROUP BY s.JobID
```

**Target Data Extension:** `Campaign_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID

---

### Step 5: Update with Unsubscribe Counts

```sql
SELECT 
    s.JobID,
    COUNT(DISTINCT u.SubscriberID) AS TotalUnsubscribed
FROM Campaign_Metrics_Staging_DE s
INNER JOIN _Unsubscribe u ON s.JobID = u.JobID
WHERE u.EventDate >= DATEADD(DAY, -7, GETDATE())
GROUP BY s.JobID
```

**Target Data Extension:** `Campaign_Metrics_Staging_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID

---

### Step 6: Calculate Final Metrics

```sql
SELECT 
    JobID,
    EmailName,
    EmailSubject,
    SendDate,
    JourneyName,
    TotalSent,
    ISNULL(TotalBounced, 0) AS TotalBounced,
    TotalSent - ISNULL(TotalBounced, 0) AS TotalDelivered,
    ISNULL(TotalOpened, 0) AS TotalOpened,
    ISNULL(TotalClicked, 0) AS TotalClicked,
    ISNULL(TotalUnsubscribed, 0) AS TotalUnsubscribed,
    CAST((TotalSent - ISNULL(TotalBounced, 0)) * 100.0 / NULLIF(TotalSent, 0) AS DECIMAL(6,2)) AS DeliveryRate,
    CAST(ISNULL(TotalBounced, 0) * 100.0 / NULLIF(TotalSent, 0) AS DECIMAL(6,2)) AS BounceRate,
    CAST(ISNULL(TotalOpened, 0) * 100.0 / NULLIF((TotalSent - ISNULL(TotalBounced, 0)), 0) AS DECIMAL(6,2)) AS OpenRate,
    CAST(ISNULL(TotalClicked, 0) * 100.0 / NULLIF((TotalSent - ISNULL(TotalBounced, 0)), 0) AS DECIMAL(6,2)) AS ClickRate,
    CAST(ISNULL(TotalClicked, 0) * 100.0 / NULLIF(ISNULL(TotalOpened, 0), 0) AS DECIMAL(6,2)) AS ClickToOpenRate,
    CAST(ISNULL(TotalUnsubscribed, 0) * 100.0 / NULLIF((TotalSent - ISNULL(TotalBounced, 0)), 0) AS DECIMAL(6,2)) AS UnsubscribeRate
FROM Campaign_Metrics_Staging_DE
```

**Target Data Extension:** `Campaign_Metrics_DE`  
**Action:** Update  
**Update Type:** Add/Update  
**Match On:** JobID

**Notes:**
- Uses staging table to break down the heavy query into smaller chunks
- Each step processes only one event type at a time
- Significantly reduces query complexity and execution time
- Collects last 7 days of campaigns (adjustable in WHERE clauses)
- Excludes test emails
- Final step calculates all percentage metrics

---

## Implementation Notes

### Automation Dependencies

1. **Monthly Email Metrics** should run first (2:00 AM) - 6 steps
2. **Daily Subscriber & Preference Counts** should run second (3:00 AM) - 38 steps (2 per country)
3. **Campaign Metrics Collection** should run third (4:00 AM) - 6 steps

### Required Data Extensions

**Staging Tables:**
- `Monthly_Metrics_Staging_DE` (for Automation 1)
- `Campaign_Metrics_Staging_DE` (for Automation 3)

**Final Tables:**
- `Monthly_Metrics_Final_DE`
- `Campaign_Metrics_DE`

**Log Tables:**
- `SubscriberCount_Log_Daily`
- `PreferenceCount_Log_Daily`

### Data Retention

- **Staging Tables:** Can be overwritten (Monthly_Metrics retains current month, Campaign_Metrics retains last 7 days)
- **Final Tables:** Retain indefinitely for historical analysis
- **Log Tables:** Retain indefinitely for trend analysis

### Error Handling

- All queries use `ISNULL()` or `COALESCE()` to handle null values
- Division operations protected with `NULLIF()` to prevent divide-by-zero errors
- Date filtering ensures only valid date ranges are processed

### Performance Considerations

- All queries filtered by date range to limit data scanned
- Composite keys used for efficient joins
- Staging table approach reduces load on system data views

---

## SQL Query Template Generator

For the **19 country preference tracking queries**, here's a template you can use:

```sql
-- Replace {COUNTRY_CODE} with: SE, RO, PT, PL, NO, NL, LT, LV, HU, IT, FR, FI, ES, EE, DK, BE, DE, CZ

-- Step 1: Subscriber Count
SELECT 
    CAST(GETDATE() AS DATE) AS LogDate,
    '{COUNTRY_CODE}' AS CountryCode,
    COUNT(*) AS SubscriberCount
FROM AllSubscribers_{COUNTRY_CODE}
WHERE EmailAddress IS NOT NULL

-- Step 2: Preference Counts (use the UK query above as template)
-- Just replace 'UK' with '{COUNTRY_CODE}' and AllSubscribers_UK with AllSubscribers_{COUNTRY_CODE}
```

---

*Last Updated: November 18, 2025*
