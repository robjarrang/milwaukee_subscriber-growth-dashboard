# Automation Studio Tasks Documentation

This document details all SQL Query Activities and Automation configurations for the Milwaukee Subscriber Growth Dashboard data pipeline.

---

## Overview

The data pipeline consists of multiple SQL Query Activities that extract, transform, and aggregate email performance data from Salesforce Marketing Cloud System Data Views. These activities run on scheduled automations to populate Data Extensions used by the dashboard.

---

## Task 1: Populate Regional Monthly Metrics Staging

**Automation:** `Reporting_MonthlyRegionalMetrics`

**Activity Name:** `Reporting_RegionalMetrics_1`

**Activity Type:** SQL Query Activity

**Purpose:** Extract subscriber-level email event data with regional information for staging.

**Source:** System Data Views

**Target Data Extension:** `Regional_Monthly_Metrics_Staging_DE`

**Action:** Overwrite (clears existing data and repopulates)

**Schedule:** Daily at 2:00 AM

**SQL Query:**
```sql
/*
 * Task 1: Populate Regional Monthly Metrics Staging
 * 
 * UPDATED: December 2025
 * - Added fallback to EmailName when JourneyName doesn't contain region
 * - Added support for " - XX" suffix patterns (e.g., Re-engagement emails)
 * - Added support for " - XXXX" compound patterns (e.g., DEAT, FRBE, NLBE)
 * - Excludes dynamic/transactional emails (DOI, Confirmation, Password Reset, etc.)
 * - Excludes test sends and single-recipient jobs
 */

SELECT DISTINCT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID, 
    /* Region extraction with fallback: JourneyName -> EmailName */
    CASE 
        /* ===== Standard XX-XX patterns in JourneyName ===== */
        WHEN LOWER(jn.JourneyName) LIKE '%fr-be%' OR LOWER(jn.JourneyName) LIKE '%be-fr%' THEN 'FR-BE'
        WHEN LOWER(jn.JourneyName) LIKE '%nl-be%' OR LOWER(jn.JourneyName) LIKE '%be-nl%' OR LOWER(jn.JourneyName) LIKE '%benl%' THEN 'NL-BE'
        WHEN LOWER(jn.JourneyName) LIKE '%de-ch%' OR LOWER(jn.JourneyName) LIKE '%ch-de%' THEN 'DE-CH'
        WHEN LOWER(jn.JourneyName) LIKE '%fr-ch%' OR LOWER(jn.JourneyName) LIKE '%ch-fr%' THEN 'FR-CH'
        WHEN LOWER(jn.JourneyName) LIKE '%fr-lu%' OR LOWER(jn.JourneyName) LIKE '%lu-fr%' THEN 'FR-LU'
        WHEN LOWER(jn.JourneyName) LIKE '%ae-en%' OR LOWER(jn.JourneyName) LIKE '%en-ae%' THEN 'EN-AE'
        WHEN LOWER(jn.JourneyName) LIKE '%ar-ae%' THEN 'AR-AE'
        WHEN LOWER(jn.JourneyName) LIKE '%bg-bg%' THEN 'BG-BG'
        WHEN LOWER(jn.JourneyName) LIKE '%cs-cz%' THEN 'CS-CZ'
        WHEN LOWER(jn.JourneyName) LIKE '%da-dk%' THEN 'DA-DK'
        WHEN LOWER(jn.JourneyName) LIKE '%de-at%' THEN 'DE-AT'
        WHEN LOWER(jn.JourneyName) LIKE '%de-de%' THEN 'DE-DE'
        WHEN LOWER(jn.JourneyName) LIKE '%en-gb%' THEN 'EN-GB'
        WHEN LOWER(jn.JourneyName) LIKE '%en-za%' THEN 'EN-ZA'
        WHEN LOWER(jn.JourneyName) LIKE '%es-es%' THEN 'ES-ES'
        WHEN LOWER(jn.JourneyName) LIKE '%et-ee%' THEN 'ET-EE'
        WHEN LOWER(jn.JourneyName) LIKE '%fi-fi%' THEN 'FI-FI'
        WHEN LOWER(jn.JourneyName) LIKE '%fr-fr%' THEN 'FR-FR'
        WHEN LOWER(jn.JourneyName) LIKE '%hr-hr%' THEN 'HR-HR'
        WHEN LOWER(jn.JourneyName) LIKE '%hu-hu%' THEN 'HU-HU'
        WHEN LOWER(jn.JourneyName) LIKE '%it-it%' THEN 'IT-IT'
        WHEN LOWER(jn.JourneyName) LIKE '%lt-lt%' THEN 'LT-LT'
        WHEN LOWER(jn.JourneyName) LIKE '%lv-lv%' THEN 'LV-LV'
        WHEN LOWER(jn.JourneyName) LIKE '%nl-nl%' THEN 'NL-NL'
        WHEN LOWER(jn.JourneyName) LIKE '%nn-no%' OR LOWER(jn.JourneyName) LIKE '%no-no%' THEN 'NO-NO'
        WHEN LOWER(jn.JourneyName) LIKE '%pl-pl%' THEN 'PL-PL'
        WHEN LOWER(jn.JourneyName) LIKE '%pt-pt%' THEN 'PT-PT'
        WHEN LOWER(jn.JourneyName) LIKE '%ro-ro%' THEN 'RO-RO'
        WHEN LOWER(jn.JourneyName) LIKE '%sk-sk%' THEN 'SK-SK'
        WHEN LOWER(jn.JourneyName) LIKE '%sl-si%' THEN 'SL-SI'
        WHEN LOWER(jn.JourneyName) LIKE '%sv-se%' THEN 'SV-SE'
        WHEN LOWER(jn.JourneyName) LIKE '%tr-tr%' THEN 'TR-TR'
        
        /* ===== Fallback: Standard XX-XX patterns in EmailName ===== */
        WHEN LOWER(j.EmailName) LIKE '%fr-be%' OR LOWER(j.EmailName) LIKE '%be-fr%' THEN 'FR-BE'
        WHEN LOWER(j.EmailName) LIKE '%nl-be%' OR LOWER(j.EmailName) LIKE '%be-nl%' THEN 'NL-BE'
        WHEN LOWER(j.EmailName) LIKE '%de-ch%' OR LOWER(j.EmailName) LIKE '%ch-de%' THEN 'DE-CH'
        WHEN LOWER(j.EmailName) LIKE '%fr-ch%' OR LOWER(j.EmailName) LIKE '%ch-fr%' THEN 'FR-CH'
        WHEN LOWER(j.EmailName) LIKE '%fr-lu%' OR LOWER(j.EmailName) LIKE '%lu-fr%' THEN 'FR-LU'
        WHEN LOWER(j.EmailName) LIKE '%ae-en%' OR LOWER(j.EmailName) LIKE '%en-ae%' THEN 'EN-AE'
        WHEN LOWER(j.EmailName) LIKE '%ar-ae%' THEN 'AR-AE'
        WHEN LOWER(j.EmailName) LIKE '%bg-bg%' THEN 'BG-BG'
        WHEN LOWER(j.EmailName) LIKE '%cs-cz%' THEN 'CS-CZ'
        WHEN LOWER(j.EmailName) LIKE '%da-dk%' THEN 'DA-DK'
        WHEN LOWER(j.EmailName) LIKE '%de-at%' THEN 'DE-AT'
        WHEN LOWER(j.EmailName) LIKE '%de-de%' THEN 'DE-DE'
        WHEN LOWER(j.EmailName) LIKE '%en-gb%' THEN 'EN-GB'
        WHEN LOWER(j.EmailName) LIKE '%en-za%' THEN 'EN-ZA'
        WHEN LOWER(j.EmailName) LIKE '%es-es%' THEN 'ES-ES'
        WHEN LOWER(j.EmailName) LIKE '%et-ee%' THEN 'ET-EE'
        WHEN LOWER(j.EmailName) LIKE '%fi-fi%' THEN 'FI-FI'
        WHEN LOWER(j.EmailName) LIKE '%fr-fr%' THEN 'FR-FR'
        WHEN LOWER(j.EmailName) LIKE '%hr-hr%' THEN 'HR-HR'
        WHEN LOWER(j.EmailName) LIKE '%hu-hu%' THEN 'HU-HU'
        WHEN LOWER(j.EmailName) LIKE '%it-it%' THEN 'IT-IT'
        WHEN LOWER(j.EmailName) LIKE '%lt-lt%' THEN 'LT-LT'
        WHEN LOWER(j.EmailName) LIKE '%lv-lv%' THEN 'LV-LV'
        WHEN LOWER(j.EmailName) LIKE '%nl-nl%' THEN 'NL-NL'
        WHEN LOWER(j.EmailName) LIKE '%nn-no%' OR LOWER(j.EmailName) LIKE '%no-no%' THEN 'NO-NO'
        WHEN LOWER(j.EmailName) LIKE '%pl-pl%' THEN 'PL-PL'
        WHEN LOWER(j.EmailName) LIKE '%pt-pt%' THEN 'PT-PT'
        WHEN LOWER(j.EmailName) LIKE '%ro-ro%' THEN 'RO-RO'
        WHEN LOWER(j.EmailName) LIKE '%sk-sk%' THEN 'SK-SK'
        WHEN LOWER(j.EmailName) LIKE '%sl-si%' THEN 'SL-SI'
        WHEN LOWER(j.EmailName) LIKE '%sv-se%' THEN 'SV-SE'
        WHEN LOWER(j.EmailName) LIKE '%tr-tr%' THEN 'TR-TR'
        
        /* ===== " - XX" suffix patterns (Re-engagement emails) ===== */
        /* These patterns match emails like "Re-engagement - Email 2 - CZ" */
        WHEN LOWER(j.EmailName) LIKE '% - ae' THEN 'EN-AE'
        WHEN LOWER(j.EmailName) LIKE '% - cz' THEN 'CS-CZ'
        WHEN LOWER(j.EmailName) LIKE '% - de' THEN 'DE-DE'
        WHEN LOWER(j.EmailName) LIKE '% - dk' THEN 'DA-DK'
        WHEN LOWER(j.EmailName) LIKE '% - ee' THEN 'ET-EE'
        WHEN LOWER(j.EmailName) LIKE '% - es' THEN 'ES-ES'
        WHEN LOWER(j.EmailName) LIKE '% - fi' THEN 'FI-FI'
        WHEN LOWER(j.EmailName) LIKE '% - fr' THEN 'FR-FR'
        WHEN LOWER(j.EmailName) LIKE '% - hu' THEN 'HU-HU'
        WHEN LOWER(j.EmailName) LIKE '% - it' THEN 'IT-IT'
        WHEN LOWER(j.EmailName) LIKE '% - lt' THEN 'LT-LT'
        WHEN LOWER(j.EmailName) LIKE '% - lv' THEN 'LV-LV'
        WHEN LOWER(j.EmailName) LIKE '% - nl' THEN 'NL-NL'
        WHEN LOWER(j.EmailName) LIKE '% - no' THEN 'NO-NO'
        WHEN LOWER(j.EmailName) LIKE '% - pl' THEN 'PL-PL'
        WHEN LOWER(j.EmailName) LIKE '% - pt' THEN 'PT-PT'
        WHEN LOWER(j.EmailName) LIKE '% - ro' THEN 'RO-RO'
        WHEN LOWER(j.EmailName) LIKE '% - se' THEN 'SV-SE'
        WHEN LOWER(j.EmailName) LIKE '% - sk' THEN 'SK-SK'
        WHEN LOWER(j.EmailName) LIKE '% - za' THEN 'EN-ZA'
        
        /* ===== " - XXXX" compound suffix patterns ===== */
        /* These patterns match emails like "Re-engagement - Email 3 - DEAT" */
        WHEN LOWER(j.EmailName) LIKE '% - deat' THEN 'DE-AT'
        WHEN LOWER(j.EmailName) LIKE '% - dech' THEN 'DE-CH'
        WHEN LOWER(j.EmailName) LIKE '% - frbe' THEN 'FR-BE'
        WHEN LOWER(j.EmailName) LIKE '% - nlbe' THEN 'NL-BE'
        WHEN LOWER(j.EmailName) LIKE '% - frch' THEN 'FR-CH'
        WHEN LOWER(j.EmailName) LIKE '% - frlu' THEN 'FR-LU'
        
        /* ===== Global/Non-Regional patterns ===== */
        WHEN jn.JourneyName LIKE '202[4-9]%' THEN 'Global / Non-Regional'
        
        ELSE 'Region Not Found'
    END AS Region
FROM _Sent s 
INNER JOIN _Job j ON s.JobID = j.JobID
INNER JOIN _JourneyActivity ja ON j.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
INNER JOIN _Journey jn ON ja.VersionID = jn.VersionID
WHERE s.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND s.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
    AND j.SendClassificationType = 'Default Commercial'
    AND LOWER(jn.JourneyName) NOT LIKE '%test%'
    AND (j.Category IS NULL OR j.Category != 'Test Send Emails')
    AND j.EmailSubject NOT LIKE '[[]Test]%'
```

**Key Features:**
- Extracts region from JourneyName first, then falls back to EmailName
- Supports three naming patterns:
  - Standard `XX-XX` format (e.g., `_DE-DE`, `-EN-GB`)
  - Two-letter suffix ` - XX` format (e.g., `Re-engagement - Email 2 - CZ`)
  - Compound suffix ` - XXXX` format (e.g., `Re-engagement - Email 3 - DEAT`)
- Filters out dynamic/transactional emails that serve all regions:
  - DOI (Double Opt-In) confirmations
  - Subscription confirmations
  - Password reset emails
  - Account created notifications
  - Project status changes
  - Customisation summaries
- Excludes test sends (Category = 'Test Send Emails' or Subject starts with '[Test]')
- Captures current month data only

**Region Patterns Supported:**
| Pattern Type | Example EmailName | Detected Region |
|--------------|-------------------|-----------------|
| Standard `_XX-XX` | `M18 Jumpstarter_All_BE-NL` | NL-BE |
| Standard `-XX-XX` | `Circular Saw Range-Carpentry-DA-DK` | DA-DK |
| Suffix ` - XX` | `Re-engagement - Email 2 - CZ` | CS-CZ |
| Suffix ` - XX` | `Re-engagement - Email 1_A - SE` | SV-SE |
| Compound ` - XXXX` | `Re-engagement - Email 3 - DEAT` | DE-AT |
| Compound ` - XXXX` | `Re-engagement - Email 3 - FRBE` | FR-BE |

### Task 1b: Update Staging with Bounce Events

**Activity Name:** `Reporting_RegionalMetrics_2`

**Target Data Extension:** `Regional_Monthly_Metrics_Staging_DE`

**Action:** Update

```sql
SELECT 
    b.JobID, 
    b.ListID, 
    b.BatchID, 
    b.SubscriberID, 
    1 AS IsBounced 
FROM _Bounce b 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON b.JobID = s.JobID 
    AND b.ListID = s.ListID 
    AND b.BatchID = s.BatchID 
    AND b.SubscriberID = s.SubscriberID 
WHERE b.IsUnique = 1 
    AND b.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND b.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

### Task 1c: Update Staging with Open Events

**Activity Names:** `Reporting_RegionalMetrics_3` (Unique Opens) and `Reporting_RegionalMetrics_3b` (Total Opens)

**Target Data Extension:** `Regional_Monthly_Metrics_Staging_DE`

**Action:** Update

```sql
-- Unique Opens
SELECT 
    o.JobID, 
    o.ListID, 
    o.BatchID, 
    o.SubscriberID, 
    1 AS IsOpened 
FROM _Open o 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON o.JobID = s.JobID 
    AND o.ListID = s.ListID 
    AND o.BatchID = s.BatchID 
    AND o.SubscriberID = s.SubscriberID 
WHERE o.IsUnique = 1 
    AND o.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND o.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))

-- Total Opens (not just unique)
SELECT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID, 
    COUNT(*) AS TotalOpens 
FROM _Open o 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON o.JobID = s.JobID 
    AND o.ListID = s.ListID 
    AND o.BatchID = s.BatchID 
    AND o.SubscriberID = s.SubscriberID 
WHERE o.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND o.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY s.JobID, s.ListID, s.BatchID, s.SubscriberID
```

### Task 1d: Update Staging with Click Events

**Activity Names:** `Reporting_RegionalMetrics_4` (Unique Clicks) and `Reporting_RegionalMetrics_4b` (Total Clicks)

**Target Data Extension:** `Regional_Monthly_Metrics_Staging_DE`

**Action:** Update

```sql
-- Unique Clicks
SELECT 
    c.JobID, 
    c.ListID, 
    c.BatchID, 
    c.SubscriberID, 
    1 AS IsClicked 
FROM _Click c 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON c.JobID = s.JobID 
    AND c.ListID = s.ListID 
    AND c.BatchID = s.BatchID 
    AND c.SubscriberID = s.SubscriberID 
WHERE c.IsUnique = 1 
    AND c.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND c.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))

-- Total Clicks (not just unique)
SELECT 
    s.JobID, 
    s.ListID, 
    s.BatchID, 
    s.SubscriberID, 
    COUNT(*) AS TotalClicks 
FROM _Click c 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON c.JobID = s.JobID 
    AND c.ListID = s.ListID 
    AND c.BatchID = s.BatchID 
    AND c.SubscriberID = s.SubscriberID 
WHERE c.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND c.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY s.JobID, s.ListID, s.BatchID, s.SubscriberID
```

### Task 1e: Update Staging with Unsubscribe Events

**Activity Name:** `Reporting_RegionalMetrics_5`

**Target Data Extension:** `Regional_Monthly_Metrics_Staging_DE`

**Action:** Update

```sql
SELECT 
    u.JobID, 
    u.ListID, 
    u.BatchID, 
    u.SubscriberID, 
    1 AS IsUnsubscribed 
FROM _Unsubscribe u 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON u.JobID = s.JobID 
    AND u.ListID = s.ListID 
    AND u.BatchID = s.BatchID 
    AND u.SubscriberID = s.SubscriberID 
WHERE u.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND u.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
```

---

## Task 2: Populate Monthly Metrics Staging (Non-Regional)

**Activity Type:** SQL Query Activity

**Purpose:** Extract subscriber-level email event data without regional breakdown for overall metrics staging.

**Source:** System Data Views

**Target Data Extension:** `Monthly_Metrics_Staging_DE`

**Action:** Overwrite (clears existing data and repopulates)

**Schedule:** Daily at 2:00 AM

**SQL Query:** *(Details to be added based on existing implementation)*

---

## Task 3: Aggregate Regional Monthly Metrics

**Automation:** `Reporting_MonthlyRegionalMetrics`

**Activity Name:** `Reporting_RegionalMetrics_6`

**Activity Type:** SQL Query Activity

**Purpose:** Aggregate regional staging data into monthly metrics by year, month, and region.

**Source:** `Regional_Monthly_Metrics_Staging_DE`

**Target Data Extension:** `Regional_Monthly_Metrics_Final_DE`

**Action:** Update (inserts new records, updates existing)

**Schedule:** Daily at 3:00 AM (runs after staging population)

**SQL Query:**
```sql
SELECT
    YEAR(GETDATE()) AS YearNumber,
    MONTH(GETDATE()) AS MonthNumber,
    s.Region,
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
FROM
    Regional_Monthly_Metrics_Staging_DE s
GROUP BY
    s.Region
```

**Key Features:**
- Aggregates all subscriber-level metrics by region
- Calculates percentage rates for delivery, open, click, and unsubscribe
- Uses ISNULL to handle missing event data

---

## Task 4: Aggregate Overall Monthly Metrics

**Activity Type:** SQL Query Activity

**Purpose:** Aggregate non-regional staging data into monthly metrics by year and month.

**Source:** `Monthly_Metrics_Staging_DE`

**Target Data Extension:** `SendCount`

**Action:** Update (inserts new records, updates existing)

**Schedule:** Daily at 3:00 AM (runs after staging population)

**SQL Query:**
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
FROM
    Monthly_Metrics_Staging_DE s
```

**Key Features:**
- Similar to Task 3 but without regional grouping
- Provides overall (global) email performance metrics

---

## Task 5: Capture Campaign-Level Email Metrics

**Activity Type:** SQL Query Activity

**Purpose:** Capture individual campaign performance metrics for each email send, enabling campaign-specific analysis and historical tracking.

**Source:** System Data Views

**Target Data Extension:** `Campaign_Metrics_DE`

**Action:** Overwrite (clears existing data and repopulates)

**Schedule:** Daily at 2:00 AM

**SQL Query:**
```sql
SELECT 
    j.JobID,
    j.EmailName,
    j.EmailSubject,
    CONVERT(DATE, j.DeliveredTime) AS SendDate,
    COALESCE(jr.Region, er.ExtractedRegion, 'Unknown') AS Region,
    
    COUNT(DISTINCT s.SubscriberID) AS TotalSent,
    SUM(CASE WHEN b.SubscriberID IS NOT NULL THEN 1 ELSE 0 END) AS TotalBounced,
    COUNT(DISTINCT CASE WHEN b.SubscriberID IS NULL THEN s.SubscriberID END) AS TotalDelivered,
    COUNT(DISTINCT o.SubscriberID) AS TotalOpened,
    COUNT(DISTINCT c.SubscriberID) AS TotalClicked,
    COUNT(DISTINCT u.SubscriberID) AS TotalUnsubscribed,
    
    CAST(
        (COUNT(DISTINCT CASE WHEN b.SubscriberID IS NULL THEN s.SubscriberID END) * 100.0) 
        / NULLIF(COUNT(DISTINCT s.SubscriberID), 0) 
        AS DECIMAL(6,2)
    ) AS DeliveryRate,
    
    CAST(
        (COUNT(DISTINCT o.SubscriberID) * 100.0) 
        / NULLIF(COUNT(DISTINCT CASE WHEN b.SubscriberID IS NULL THEN s.SubscriberID END), 0) 
        AS DECIMAL(6,2)
    ) AS OpenRate,
    
    CAST(
        (COUNT(DISTINCT c.SubscriberID) * 100.0) 
        / NULLIF(COUNT(DISTINCT CASE WHEN b.SubscriberID IS NULL THEN s.SubscriberID END), 0) 
        AS DECIMAL(6,2)
    ) AS ClickRate,
    
    CAST(
        (COUNT(DISTINCT c.SubscriberID) * 100.0) 
        / NULLIF(COUNT(DISTINCT o.SubscriberID), 0) 
        AS DECIMAL(6,2)
    ) AS ClickToOpenRate,
    
    CAST(
        (COUNT(DISTINCT u.SubscriberID) * 100.0) 
        / NULLIF(COUNT(DISTINCT CASE WHEN b.SubscriberID IS NULL THEN s.SubscriberID END), 0) 
        AS DECIMAL(6,2)
    ) AS UnsubscribeRate,
    
    COALESCE(jn.JourneyName, j.EmailName) AS JourneyName

FROM _Job j

INNER JOIN _Sent s ON j.JobID = s.JobID

LEFT JOIN _JourneyActivity ja ON j.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
LEFT JOIN _Journey jn ON ja.VersionID = jn.VersionID

LEFT JOIN (
    SELECT DISTINCT
        VersionID,
        CASE 
            WHEN LOWER(JourneyName) LIKE '%fr-be%' OR LOWER(JourneyName) LIKE '%be-fr%' THEN 'FR-BE'
            WHEN LOWER(JourneyName) LIKE '%nl-be%' OR LOWER(JourneyName) LIKE '%be-nl%' THEN 'NL-BE'
            WHEN LOWER(JourneyName) LIKE '%en-gb%' OR LOWER(JourneyName) LIKE '%gb-en%' THEN 'EN-GB'
            WHEN LOWER(JourneyName) LIKE '%en-us%' OR LOWER(JourneyName) LIKE '%us-en%' THEN 'EN-US'
            WHEN LOWER(JourneyName) LIKE '%de-de%' THEN 'DE-DE'
            WHEN LOWER(JourneyName) LIKE '%fr-fr%' THEN 'FR-FR'
            WHEN LOWER(JourneyName) LIKE '%es-es%' THEN 'ES-ES'
            WHEN LOWER(JourneyName) LIKE '%it-it%' THEN 'IT-IT'
            WHEN LOWER(JourneyName) LIKE '%nl-nl%' THEN 'NL-NL'
            WHEN LOWER(JourneyName) LIKE '%de-ch%' THEN 'DE-CH'
            WHEN LOWER(JourneyName) LIKE '%fr-ch%' OR LOWER(JourneyName) LIKE '%fr0ch%' THEN 'FR-CH'
            WHEN LOWER(JourneyName) LIKE '%it-ch%' THEN 'IT-CH'
            WHEN LOWER(JourneyName) LIKE '%de-at%' THEN 'DE-AT'
            WHEN LOWER(JourneyName) LIKE '%da-dk%' THEN 'DA-DK'
            WHEN LOWER(JourneyName) LIKE '%sv-se%' THEN 'SV-SE'
            WHEN LOWER(JourneyName) LIKE '%nb-no%' OR LOWER(JourneyName) LIKE '%no-no%' THEN 'NB-NO'
            WHEN LOWER(JourneyName) LIKE '%fi-fi%' THEN 'FI-FI'
            WHEN LOWER(JourneyName) LIKE '%pl-pl%' THEN 'PL-PL'
            WHEN LOWER(JourneyName) LIKE '%cs-cz%' THEN 'CS-CZ'
            WHEN LOWER(JourneyName) LIKE '%sk-sk%' THEN 'SK-SK'
            WHEN LOWER(JourneyName) LIKE '%hu-hu%' THEN 'HU-HU'
            WHEN LOWER(JourneyName) LIKE '%ro-ro%' THEN 'RO-RO'
            WHEN LOWER(JourneyName) LIKE '%bg-bg%' THEN 'BG-BG'
            WHEN LOWER(JourneyName) LIKE '%sl-si%' THEN 'SL-SI'
            WHEN LOWER(JourneyName) LIKE '%hr-hr%' THEN 'HR-HR'
            WHEN LOWER(JourneyName) LIKE '%pt-pt%' THEN 'PT-PT'
            WHEN LOWER(JourneyName) LIKE '%lb-lu%' OR LOWER(JourneyName) LIKE '%fr-lu%' THEN 'FR-LU'
            WHEN LOWER(JourneyName) LIKE '%et-ee%' THEN 'ET-EE'
            WHEN LOWER(JourneyName) LIKE '%lv-lv%' THEN 'LV-LV'
            WHEN LOWER(JourneyName) LIKE '%lt-lt%' THEN 'LT-LT'
            WHEN LOWER(JourneyName) LIKE '%en-za%' THEN 'EN-ZA'
            WHEN LOWER(JourneyName) LIKE '%ar-ae%' THEN 'AR-AE'
            WHEN LOWER(JourneyName) LIKE '%tr-tr%' THEN 'TR-TR'
            ELSE 'Unknown'
        END AS Region
    FROM _Journey
    WHERE JourneyName NOT LIKE '%Confirmation%' 
        AND JourneyName NOT LIKE '%Summary Email%'
        AND JourneyName NOT LIKE '%Proof%'
        AND LOWER(JourneyName) NOT LIKE '%test%'
) jr ON jn.VersionID = jr.VersionID

LEFT JOIN (
    SELECT DISTINCT
        j2.JobID,
        CASE 
            WHEN LOWER(j2.EmailName) LIKE '%fr-be%' OR LOWER(j2.EmailName) LIKE '%be-fr%' THEN 'FR-BE'
            WHEN LOWER(j2.EmailName) LIKE '%nl-be%' OR LOWER(j2.EmailName) LIKE '%be-nl%' THEN 'NL-BE'
            WHEN LOWER(j2.EmailName) LIKE '%en-gb%' OR LOWER(j2.EmailName) LIKE '%gb-en%' THEN 'EN-GB'
            WHEN LOWER(j2.EmailName) LIKE '%en-us%' OR LOWER(j2.EmailName) LIKE '%us-en%' THEN 'EN-US'
            WHEN LOWER(j2.EmailName) LIKE '%de-de%' THEN 'DE-DE'
            WHEN LOWER(j2.EmailName) LIKE '%fr-fr%' THEN 'FR-FR'
            WHEN LOWER(j2.EmailName) LIKE '%es-es%' THEN 'ES-ES'
            WHEN LOWER(j2.EmailName) LIKE '%it-it%' THEN 'IT-IT'
            WHEN LOWER(j2.EmailName) LIKE '%nl-nl%' THEN 'NL-NL'
            WHEN LOWER(j2.EmailName) LIKE '%de-ch%' THEN 'DE-CH'
            WHEN LOWER(j2.EmailName) LIKE '%fr-ch%' OR LOWER(j2.EmailName) LIKE '%fr0ch%' THEN 'FR-CH'
            WHEN LOWER(j2.EmailName) LIKE '%it-ch%' THEN 'IT-CH'
            WHEN LOWER(j2.EmailName) LIKE '%de-at%' THEN 'DE-AT'
            WHEN LOWER(j2.EmailName) LIKE '%da-dk%' THEN 'DA-DK'
            WHEN LOWER(j2.EmailName) LIKE '%sv-se%' THEN 'SV-SE'
            WHEN LOWER(j2.EmailName) LIKE '%nb-no%' OR LOWER(j2.EmailName) LIKE '%no-no%' THEN 'NB-NO'
            WHEN LOWER(j2.EmailName) LIKE '%fi-fi%' THEN 'FI-FI'
            WHEN LOWER(j2.EmailName) LIKE '%pl-pl%' THEN 'PL-PL'
            WHEN LOWER(j2.EmailName) LIKE '%cs-cz%' THEN 'CS-CZ'
            WHEN LOWER(j2.EmailName) LIKE '%sk-sk%' THEN 'SK-SK'
            WHEN LOWER(j2.EmailName) LIKE '%hu-hu%' THEN 'HU-HU'
            WHEN LOWER(j2.EmailName) LIKE '%ro-ro%' THEN 'RO-RO'
            WHEN LOWER(j2.EmailName) LIKE '%bg-bg%' THEN 'BG-BG'
            WHEN LOWER(j2.EmailName) LIKE '%sl-si%' THEN 'SL-SI'
            WHEN LOWER(j2.EmailName) LIKE '%hr-hr%' THEN 'HR-HR'
            WHEN LOWER(j2.EmailName) LIKE '%pt-pt%' THEN 'PT-PT'
            WHEN LOWER(j2.EmailName) LIKE '%lb-lu%' OR LOWER(j2.EmailName) LIKE '%fr-lu%' THEN 'FR-LU'
            WHEN LOWER(j2.EmailName) LIKE '%et-ee%' THEN 'ET-EE'
            WHEN LOWER(j2.EmailName) LIKE '%lv-lv%' THEN 'LV-LV'
            WHEN LOWER(j2.EmailName) LIKE '%lt-lt%' THEN 'LT-LT'
            WHEN LOWER(j2.EmailName) LIKE '%en-za%' THEN 'EN-ZA'
            WHEN LOWER(j2.EmailName) LIKE '%ar-ae%' THEN 'AR-AE'
            WHEN LOWER(j2.EmailName) LIKE '%tr-tr%' THEN 'TR-TR'
            ELSE 'Unknown'
        END AS ExtractedRegion
    FROM _Job j2
) er ON j.JobID = er.JobID

LEFT JOIN _Bounce b ON s.JobID = b.JobID 
    AND s.ListID = b.ListID 
    AND s.BatchID = b.BatchID 
    AND s.SubscriberID = b.SubscriberID
    AND b.IsUnique = 1

LEFT JOIN _Open o ON s.JobID = o.JobID 
    AND s.ListID = o.ListID 
    AND s.BatchID = o.BatchID 
    AND s.SubscriberID = o.SubscriberID
    AND o.IsUnique = 1

LEFT JOIN _Click c ON s.JobID = c.JobID 
    AND s.ListID = c.ListID 
    AND s.BatchID = c.BatchID 
    AND s.SubscriberID = c.SubscriberID
    AND c.IsUnique = 1

LEFT JOIN _Unsubscribe u ON s.JobID = u.JobID 
    AND s.ListID = u.ListID 
    AND s.BatchID = u.BatchID 
    AND s.SubscriberID = u.SubscriberID

WHERE j.DeliveredTime >= DATEADD(MONTH, -1, GETDATE())

GROUP BY 
    j.JobID,
    j.EmailName,
    j.EmailSubject,
    CONVERT(DATE, j.DeliveredTime),
    COALESCE(jr.Region, er.ExtractedRegion, 'Unknown'),
    COALESCE(jn.JourneyName, j.EmailName)

HAVING COALESCE(jr.Region, er.ExtractedRegion, 'Unknown') != 'Unknown'
    AND COUNT(DISTINCT s.SubscriberID) > 1
```

**Key Features:**
- **Dual Region Extraction:** First attempts to extract region from Journey name, falls back to Email name for non-Journey sends
- **Comprehensive Coverage:** Captures Journey Builder, Automation Studio, and Guided Send campaigns
- **Date Filtering:** Captures last 1 month of campaigns (adjustable via `DATEADD(MONTH, -1, GETDATE())`)
- **Quality Filter:** Excludes campaigns with ≤1 send (test sends)
- **Unknown Exclusion:** Filters out campaigns where region cannot be determined
- **All Send Types:** No dependency on `TriggererSendDefinitionObjectID`, captures all send methods

**Performance Metrics Calculated:**
- **Delivery Rate:** Percentage of emails successfully delivered
- **Open Rate:** Percentage of delivered emails that were opened
- **Click Rate (CTR):** Percentage of delivered emails that were clicked
- **Click-to-Open Rate (CTOR):** Percentage of opens that resulted in clicks
- **Unsubscribe Rate:** Percentage of delivered emails that resulted in unsubscribes

**Region Coverage:** Supports 30+ regions across Europe, US, Middle East, and Africa including:
- Western Europe: EN-GB, DE-DE, FR-FR, ES-ES, IT-IT, NL-NL, PT-PT
- DACH: DE-AT, DE-CH, FR-CH, IT-CH
- Nordics: DA-DK, SV-SE, NB-NO, FI-FI
- Eastern Europe (EE): PL-PL, CS-CZ, SK-SK, HU-HU, RO-RO
- IRIS: BG-BG, SL-SI, HR-HR
- Benelux: FR-BE, NL-BE, FR-LU
- Baltics: ET-EE, LV-LV, LT-LT
- Other: EN-US, EN-ZA, AR-AE, TR-TR

**Dependencies:**
- System Data Views: `_Job`, `_Sent`, `_Bounce`, `_Open`, `_Click`, `_Unsubscribe`, `_Journey`, `_JourneyActivity`
- These views are maintained by Salesforce Marketing Cloud and typically retain data for 6 months

**Notes:**
- Uses `LEFT JOIN` for Journey data to ensure non-Journey sends (Automation Studio, Guided Sends) are captured
- Employs `COALESCE` to prioritize Journey region extraction over Email name extraction
- The 1-month lookback can be adjusted via the `DATEADD(MONTH, -1, GETDATE())` parameter
  - For longer retention: `DATEADD(MONTH, -3, GETDATE())` for 3 months
  - For shorter windows: `DATEADD(DAY, -7, GETDATE())` for 1 week
- Expected row count: ~400-500+ campaigns per month depending on email volume

---

## Task 6: Populate L1 Trade Daily Snapshot

**Activity Type:** SQL Query Activity

**Purpose:** Capture daily trade (profession) distribution by region for subscriber analytics. This powers the trade distribution charts in the dashboard.

**Source:** `ENT.Pivot_MarketingEmailOptIns_Milwaukee` (Shared Data Extension)

**Target Data Extension:** `L1_Trade_Daily_Snapshot_Milwaukee`

**Action:** Update (appends daily snapshot)

**Schedule:** Daily at 3:00 AM

**SQL Query:**
```sql
SELECT
      CONVERT(DATE, GETDATE()) AS SnapshotDate
    , COALESCE(UPPER(UserCulture), 'UNKNOWN') AS Region
    , L1Trade
    , COUNT(DISTINCT SubscriberKey) AS SubscriberCount
    , CONVERT(DATE, GETDATE()) AS InsertedDate
FROM (
    SELECT SubscriberKey, UserCulture, 'Carpentry & Joinery' AS L1Trade
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Carpentry & Joinery', 'Carpentry', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Construction & Civil Engineering'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Construction/Civil Engineering', 'Construction', 'Civil Engineering', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Demolition'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Demolition', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Drain Cleaning & Inspection'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Drain Cleaning & Inspection', 'Drain Cleaning / Inspection', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Drywall, Ceiling & Partitioning'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Drywall/Ceiling & Partitioning', 'Drywall, Ceiling and Partitioning', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Electrical'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Electrical', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Fire & Rescue'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Fire & Rescue', 'Fire and Rescue', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Hire'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Hire', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Maintenance & Repair'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Maintenance & Repair', 'Maintenance, Repair and Operations', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Manufacturing & Industrial'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Manufacturing & Industrial', 'Manufacturing', 'Industrial Production', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Mechanical, HVAC & Plumbing'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Mechanical, HVAC & Plumbing', 'HVAC', 'Plumbing', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Outdoor Landscape & Agriculture'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Outdoor Landscape/Agriculture', 'Landscaping and Horticultural', 'Agricultural', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Metalworking & Engineering'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Metalworking & Engineering', 'Metalworking', 'Engineering', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Other / DIY'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Other/DIY', 'Other', 'DIY', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Transportation'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Transportation', 'Automotive / Transportation', 'All')

    UNION ALL

    SELECT SubscriberKey, UserCulture, 'Utilities'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Utilities', 'All')
) AS x
GROUP BY
      COALESCE(UPPER(UserCulture), 'UNKNOWN')
    , L1Trade

UNION ALL

-- Global totals (across all regions)
SELECT
      CONVERT(DATE, GETDATE()) AS SnapshotDate
    , 'GLOBAL' AS Region
    , L1Trade
    , COUNT(DISTINCT SubscriberKey) AS SubscriberCount
    , CONVERT(DATE, GETDATE()) AS InsertedDate
FROM (
    SELECT SubscriberKey, 'Carpentry & Joinery' AS L1Trade
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Carpentry & Joinery', 'Carpentry', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Construction & Civil Engineering'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Construction/Civil Engineering', 'Construction', 'Civil Engineering', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Demolition'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Demolition', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Drain Cleaning & Inspection'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Drain Cleaning & Inspection', 'Drain Cleaning / Inspection', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Drywall, Ceiling & Partitioning'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Drywall/Ceiling & Partitioning', 'Drywall, Ceiling and Partitioning', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Electrical'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Electrical', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Fire & Rescue'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Fire & Rescue', 'Fire and Rescue', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Hire'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Hire', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Maintenance & Repair'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Maintenance & Repair', 'Maintenance, Repair and Operations', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Manufacturing & Industrial'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Manufacturing & Industrial', 'Manufacturing', 'Industrial Production', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Mechanical, HVAC & Plumbing'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Mechanical, HVAC & Plumbing', 'HVAC', 'Plumbing', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Outdoor Landscape & Agriculture'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Outdoor Landscape/Agriculture', 'Landscaping and Horticultural', 'Agricultural', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Metalworking & Engineering'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Metalworking & Engineering', 'Metalworking', 'Engineering', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Other / DIY'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Other/DIY', 'Other', 'DIY', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Transportation'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Transportation', 'Automotive / Transportation', 'All')

    UNION ALL

    SELECT SubscriberKey, 'Utilities'
    FROM ENT.Pivot_MarketingEmailOptIns_Milwaukee
    WHERE Marketable__c = 1 AND Trade__c IN ('Utilities', 'All')
) AS x
GROUP BY
    L1Trade
```

**Key Features:**
- Normalizes varied trade naming conventions to consistent L1 trade categories
- Handles 16 trade categories covering all Milwaukee professional segments
- Includes both regional breakdown and GLOBAL totals
- Uses UNION ALL for trade mapping to handle multiple source trade names
- Only counts marketable subscribers (`Marketable__c = 1`)

**Trade Categories (16 total):**
1. Carpentry & Joinery
2. Construction & Civil Engineering
3. Demolition
4. Drain Cleaning & Inspection
5. Drywall, Ceiling & Partitioning
6. Electrical
7. Fire & Rescue
8. Hire
9. Maintenance & Repair
10. Manufacturing & Industrial
11. Mechanical, HVAC & Plumbing
12. Metalworking & Engineering
13. Other / DIY
14. Outdoor Landscape & Agriculture
15. Transportation
16. Utilities

---

## Automation Sequence

The tasks are organized into the following Automations.

### Automation: `Reporting_MonthlyRegionalMetrics`

Runs all Task 1 activities (staging population + event updates) followed by the regional aggregation (Task 3):

1. `Reporting_RegionalMetrics_1` — Task 1: Populate Regional Monthly Metrics Staging
2. `Reporting_RegionalMetrics_2` — Task 1b: Update Staging with Bounce Events
3. `Reporting_RegionalMetrics_3` — Task 1c: Update Staging with Unique Opens
4. `Reporting_RegionalMetrics_3b` — Task 1c: Update Staging with Total Opens
5. `Reporting_RegionalMetrics_4` — Task 1d: Update Staging with Unique Clicks
6. `Reporting_RegionalMetrics_4b` — Task 1d: Update Staging with Total Clicks
7. `Reporting_RegionalMetrics_5` — Task 1e: Update Staging with Unsubscribe Events
8. `Reporting_RegionalMetrics_6` — Task 3: Aggregate Regional Monthly Metrics into `Regional_Monthly_Metrics_Final_DE`

*Activities run sequentially because each event-update step depends on the staging populated by step 1.*

### Other Automations

- **Task 2** (Populate Monthly Metrics Staging — non-regional) and **Task 4** (Aggregate Overall Monthly Metrics) — separate automation for global/non-regional metrics.
- **Task 5** (Capture Campaign-Level Email Metrics) — separate automation populating `Campaign_Metrics_DE`.
- **Task 6** (Populate L1 Trade Daily Snapshot) — separate automation populating `L1_Trade_Daily_Snapshot_Milwaukee`.
- **Task 7** (DOI Pending Contacts Aggregation) — separate automation, runs daily at 6:00 AM.
- **Task 8** (`MYACCOUNT_DASHBOARD_AGGREGATION_DAILY`) — MyAccount aggregation automation.
- **Task 9** (`Daily_Send_Metrics_Aggregation`) — 8-step automation populating `Send_JobID_Staging`, `Send_Engagement_Staging`, and `Send_Fact` for the last 7 days of sends.

---

## Verification Steps

After each automation run, verify the following:

### Post-Staging Verification (after 2:00 AM automation)
1. Check row counts in `Regional_Monthly_Metrics_Staging_DE` - should contain subscriber-level records
2. Check row counts in `Monthly_Metrics_Staging_DE` - should contain subscriber-level records
3. Check row counts in `Campaign_Metrics_DE` - should contain one row per campaign
4. Verify no `NULL` regions in `Campaign_Metrics_DE` (all should have valid region codes)

### Post-Aggregation Verification (after 3:00 AM automation)
1. Check `Regional_Monthly_Metrics_Final_DE` - should have one row per Year/Month/Region combination
2. Check `SendCount` - should have one row per Year/Month combination
3. Verify that percentage fields are calculated correctly (values between 0 and 100)
4. Compare totals between regional and overall metrics for consistency

### Campaign Metrics Specific Verification
```sql
-- Check campaign count by region
SELECT Region, COUNT(*) as CampaignCount
FROM Campaign_Metrics_DE
GROUP BY Region
ORDER BY CampaignCount DESC

-- Check date range captured
SELECT MIN(SendDate) as OldestCampaign, MAX(SendDate) as NewestCampaign
FROM Campaign_Metrics_DE

-- Verify no Unknown regions
SELECT COUNT(*) as UnknownRegionCount
FROM Campaign_Metrics_DE
WHERE Region = 'Unknown' OR Region IS NULL

-- Check average campaign performance
SELECT 
    AVG(DeliveryRate) as AvgDeliveryRate,
    AVG(OpenRate) as AvgOpenRate,
    AVG(ClickRate) as AvgClickRate,
    AVG(ClickToOpenRate) as AvgClickToOpenRate
FROM Campaign_Metrics_DE
```

---

## Troubleshooting

### Issue: No campaigns captured in Campaign_Metrics_DE

**Possible Causes:**
1. System Data Views are not accessible (permissions issue)
2. Date filter is too restrictive
3. All campaigns are being filtered out by region extraction logic

**Solutions:**
1. Verify user has read access to all System Data Views
2. Temporarily remove the `WHERE j.DeliveredTime >= DATEADD(MONTH, -1, GETDATE())` filter to test
3. Check if `JourneyName` and `EmailName` follow expected naming conventions

### Issue: Campaign_Metrics_DE shows "Unknown" region

**Possible Causes:**
1. Journey or Email names don't contain region codes in expected format
2. Region codes are in different case than expected (e.g., "en-gb" instead of "EN-GB")

**Solutions:**
1. Review actual Journey/Email naming patterns
2. Add additional CASE statements to handle new patterns
3. Verify that region codes are included in naming conventions

### Issue: Metrics don't match expected values

**Possible Causes:**
1. System Data Views have data latency
2. Duplicate JobIDs due to resends
3. IsUnique flag not properly set in engagement tables

**Solutions:**
1. Run verification queries to compare with System Data View raw counts
2. Check for duplicate JobIDs in results
3. Verify JOIN conditions are correctly using IsUnique = 1

### Issue: Query times out or runs slowly

**Possible Causes:**
1. Date range is too large (e.g., querying 6 months of data)
2. System Data Views are not indexed efficiently
3. Multiple LEFT JOINs causing performance degradation

**Solutions:**
1. Reduce date range to 1-2 weeks for testing
2. Consider breaking query into multiple steps with intermediate Data Extensions
3. Add indexes to System Data Views (if possible in SFMC)
4. Run query during off-peak hours

---

## Data Retention Considerations

### System Data Views Retention
- **Default:** 6 months
- **Impact:** Campaign_Metrics_DE can only look back 6 months maximum
- **Recommendation:** Run daily to ensure continuous historical data capture

### Campaign_Metrics_DE Retention
- **Current:** Overwrites daily (retains only last 1 month of campaigns)
- **Recommendation for Historical Analysis:** 
  - Change action from "Overwrite" to "Update"
  - Add a Data Retention Policy to keep last 12 months
  - Modify SQL to use UPSERT logic: `MERGE` or separate INSERT/UPDATE steps

**Example for Retention:**
```sql
-- Instead of Overwrite, use Update action with this pattern:
-- This requires Campaign_Metrics_DE to NOT have action set to "Overwrite"

-- First, delete old records (older than 12 months)
DELETE FROM Campaign_Metrics_DE
WHERE SendDate < DATEADD(MONTH, -12, GETDATE())

-- Then insert/update with the main query
-- (Use the main SELECT query from Task 5)
```

---

## Best Practices

1. **Monitoring:** Set up alerts for automation failures
2. **Logging:** Keep a log of row counts after each run to track trends
3. **Testing:** Test SQL queries in Query Studio before deploying to Automation
4. **Documentation:** Update this document when making changes to queries or schedules
5. **Backup:** Keep backup copies of working queries before making modifications
6. **Region Patterns:** Maintain a centralized list of region extraction patterns to ensure consistency across all queries
7. **Performance:** Monitor query execution times and optimize if exceeding 10 minutes

---

## Modification History

| Date | Modified By | Changes Made |
|------|-------------|--------------|
| 2025-01-XX | Initial | Created documentation with Tasks 1-5 |
| 2025-12-15 | Investigation | **Task 1 Updated:** Fixed "Region Not Found" issue (was showing 27,119 when actual undetectable was ~7,400). Added EmailName fallback patterns, " - XX" suffix support for Re-engagement emails, compound suffix patterns (DEAT, FRBE, etc.), and additional transactional email exclusions. |
| 2026-01-26 | Enhancement | **Task 7 Added:** DOI Pending Contacts Aggregation for dashboard pending contacts monitoring feature. |
| 2026-01-27 | Enhancement | **Task 7 Updated:** Added SignupIdentifier grouping to support dual views (by Region and by Signup Identifier) in the dashboard. |
| 2026-05-07 | Enhancement | **Task 8 Added:** MyAccount dashboard aggregation automation. Added staging and summary SQL activities to replace raw CloudPage retrieval of My Account rows, support full account counts, and improve MyAccount tab performance. |

---

## Task 7: Aggregate DOI Pending Contacts by Region and Signup Identifier

**Activity Type:** SQL Query Activity

**Purpose:** Aggregate counts of contacts currently pending Double Opt-In (DOI) confirmation from the shared DOI journey Data Extensions. This provides the dashboard with pre-aggregated counts by region AND signup identifier to avoid CloudPage request limits, enabling two distinct views of pending contacts.

**Source Data Extensions (Shared):**
- `ENT.DOI Generic Journey` - General signup flow
- `ENT.DOI PEM Journey` - Prize Every Month signup flow

**Target Data Extension:** `DOI_Pending_Contacts_Aggregated`

**Action:** Overwrite (clears existing data and repopulates daily)

**Schedule:** Daily at 6:00 AM (after DOI journeys have processed overnight signups)

**SQL Query:**
```sql
/*
 * Task 7: Aggregate DOI Pending Contacts by Region and Signup Identifier
 * 
 * Created: January 2026
 * Updated: January 2026 - Added SignupIdentifier grouping
 * 
 * Purpose: Provide aggregated pending DOI counts for dashboard display
 *          Supports two views: by Region and by SignupIdentifier
 * 
 * Filter Criteria:
 * - OptinStatus = 'Double Opt-In Pending' (only pending confirmations)
 * - IsLatest = 'True' (only most recent record per contact)
 * - TokenDate within last 3 days (confirmation link validity period)
 * 
 * Notes:
 * - Uses UNION ALL to combine both DOI journey sources
 * - Groups by UserCulture (region) AND SignupIdentifier for granular breakdown
 * - Dashboard aggregates client-side for regional or identifier views
 * - Tracks oldest and newest pending dates for monitoring
 */

SELECT 
    CONVERT(DATE, GETDATE()) AS SnapshotDate,
    UPPER(UserCulture) AS Region,
    'Generic' AS JourneyType,
    COALESCE(NULLIF(SignupIdentifier, ''), 'Unknown') AS SignupIdentifier,
    COUNT(*) AS PendingCount,
    MIN(TokenDate) AS OldestPendingDate,
    MAX(TokenDate) AS NewestPendingDate,
    GETDATE() AS InsertedDate
FROM [ENT.DOI Generic Journey]
WHERE OptinStatus = 'Double Opt-In Pending'
    AND IsLatest = 'True'
    AND TokenDate >= DATEADD(DAY, -3, GETDATE())
    AND UserCulture IS NOT NULL
    AND UserCulture != ''
GROUP BY UPPER(UserCulture), COALESCE(NULLIF(SignupIdentifier, ''), 'Unknown')

UNION ALL

SELECT 
    CONVERT(DATE, GETDATE()) AS SnapshotDate,
    UPPER(UserCulture) AS Region,
    'PEM' AS JourneyType,
    COALESCE(NULLIF(SignupIdentifier, ''), 'Unknown') AS SignupIdentifier,
    COUNT(*) AS PendingCount,
    MIN(TokenDate) AS OldestPendingDate,
    MAX(TokenDate) AS NewestPendingDate,
    GETDATE() AS InsertedDate
FROM [ENT.DOI PEM Journey]
WHERE OptinStatus = 'Double Opt-In Pending'
    AND IsLatest = 'True'
    AND TokenDate >= DATEADD(DAY, -3, GETDATE())
    AND UserCulture IS NOT NULL
    AND UserCulture != ''
GROUP BY UPPER(UserCulture), COALESCE(NULLIF(SignupIdentifier, ''), 'Unknown')
```

**Key Features:**
- Filters only contacts with `OptinStatus = 'Double Opt-In Pending'`
- Ensures `IsLatest = 'True'` to avoid counting duplicate records for same contact
- Only counts contacts within the 3-day confirmation window (token validity period)
- Groups by BOTH Region AND SignupIdentifier for maximum flexibility
- Separates counts by journey type (Generic vs PEM) for detailed analysis
- Handles empty/null SignupIdentifier values with 'Unknown' fallback
- Tracks oldest and newest pending dates to monitor confirmation delays
- Converts UserCulture to uppercase for consistent region codes

**Dashboard Aggregation:**
The dashboard performs client-side aggregation to provide two distinct views:
1. **By Region:** Sums PendingCount across all SignupIdentifiers per region
2. **By SignupIdentifier:** Sums PendingCount across all regions per identifier

**Expected Output:**
| SnapshotDate | Region | JourneyType | SignupIdentifier | PendingCount | OldestPendingDate | NewestPendingDate |
|--------------|--------|-------------|------------------|--------------|-------------------|-------------------|
| 2026-01-27 | DE-DE | Generic | website_footer | 45 | 2026-01-24 | 2026-01-27 |
| 2026-01-27 | DE-DE | Generic | campaign_jan2026 | 67 | 2026-01-25 | 2026-01-27 |
| 2026-01-27 | DE-DE | Generic | Unknown | 12 | 2026-01-24 | 2026-01-26 |
| 2026-01-27 | DE-DE | PEM | prize_landing | 23 | 2026-01-24 | 2026-01-27 |
| 2026-01-27 | EN-GB | Generic | website_footer | 34 | 2026-01-24 | 2026-01-27 |
| 2026-01-27 | FR-FR | Generic | campaign_jan2026 | 28 | 2026-01-25 | 2026-01-26 |
| ... | ... | ... | ... | ... | ... | ... |

**Data Extension Creation:**
```sql
/* Create DOI_Pending_Contacts_Aggregated Data Extension */

-- Primary Key: SnapshotDate, Region, JourneyType, SignupIdentifier (composite)
-- Fields:
-- SnapshotDate (Date, PK, Not Nullable)
-- Region (Text 50, PK, Not Nullable)
-- JourneyType (Text 50, PK, Not Nullable)
-- SignupIdentifier (Text 200, PK, Not Nullable)
-- PendingCount (Number, Not Nullable, Default 0)
-- OldestPendingDate (Date, Nullable)
-- NewestPendingDate (Date, Nullable)
-- InsertedDate (Date, Not Nullable, Default GETDATE())
```

**Verification Queries:**
```sql
-- Verify totals by journey type
SELECT 
    JourneyType,
    SUM(PendingCount) AS TotalPending,
    COUNT(DISTINCT Region) AS RegionsWithPending,
    COUNT(DISTINCT SignupIdentifier) AS IdentifiersWithPending
FROM DOI_Pending_Contacts_Aggregated
WHERE SnapshotDate = CONVERT(DATE, GETDATE())
GROUP BY JourneyType

-- Check totals by region (aggregated across identifiers)
SELECT 
    Region,
    SUM(PendingCount) AS TotalPending,
    COUNT(DISTINCT SignupIdentifier) AS UniqueIdentifiers
FROM DOI_Pending_Contacts_Aggregated
WHERE SnapshotDate = CONVERT(DATE, GETDATE())
GROUP BY Region
ORDER BY TotalPending DESC

-- Check totals by signup identifier (aggregated across regions)
SELECT 
    SignupIdentifier,
    SUM(PendingCount) AS TotalPending,
    COUNT(DISTINCT Region) AS RegionsAffected
FROM DOI_Pending_Contacts_Aggregated
WHERE SnapshotDate = CONVERT(DATE, GETDATE())
GROUP BY SignupIdentifier
ORDER BY TotalPending DESC

-- Check for data freshness
SELECT 
    MAX(InsertedDate) AS LastUpdated,
    SUM(PendingCount) AS TotalPendingContacts,
    COUNT(DISTINCT Region) AS TotalRegions,
    COUNT(DISTINCT SignupIdentifier) AS TotalIdentifiers
FROM DOI_Pending_Contacts_Aggregated
```

---

## Task 8: Aggregate MyAccount Registration Data for Dashboard

**Activity Type:** SQL Query Activities

**Purpose:** Aggregate MyAccount registration data into dashboard-ready Data Extensions so the CloudPage no longer needs to retrieve every raw `My Account` row via SSJS/WSProxy. This resolves raw-row retrieval limits, improves MyAccount tab load time, and ensures the dashboard can report against the full MyAccount data set.

**Source Data Extension:** `My Account` local Data Extension

**Automation Name:** `MYACCOUNT_DASHBOARD_AGGREGATION_DAILY`

**Recommended Schedule:** Daily, after the `My Account` Data Extension has been refreshed

**Important:** Create the target Data Extension fields in the exact order shown below. SFMC Query Activities map selected columns to target fields by field order as well as name, and mismatched order can cause errors such as `Could not convert date and/or time from string data type`.

### Source Fields Used

| Source Field | Purpose |
|--------------|---------|
| `Id` | Account-level unique identifier |
| `ContactId` | Used for unique contact counts |
| `RegistrationDate` | Used for date filtering and daily aggregation |
| `UserCulture` | Used for region/culture filtering and breakdowns |
| `PrimaryTrade` | Used for trade filtering and trade breakdowns |
| `ConsentStatus` | Used for opted-in/not opted-in classification |

### Consent Status Mapping

| ConsentStatus Value | Dashboard Category |
|---------------------|-------------------|
| `Double Opt-In Verified` | Opted-In |
| `Single Opt-In` | Opted-In |
| `Not Opted-In` | Not Opted-In |
| `Withdrawn` | Not Opted-In |
| Other or blank | Not Opted-In |

### Primary Trade Normalisation

Blank, empty, null, or `marketingapp.trades.none` values are normalised to `Not Specified`.

---

### Target Data Extension: `MyAccount_Normalised_Staging`

**Purpose:** Cleaned account-level staging table used by all summary queries.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `Id` | Text | 50 | Yes | No |
| `ContactId` | Text | 50 | No | Yes |
| `RegistrationDate` | Date | - | No | No |
| `RegistrationDateOnly` | Date | - | No | No |
| `UserCulture` | Text | 50 | No | No |
| `PrimaryTradeRaw` | Text | 100 | No | Yes |
| `PrimaryTradeNormalised` | Text | 100 | No | No |
| `ConsentStatus` | Text | 50 | No | No |
| `ConsentCategory` | Text | 20 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Target Data Extension: `MyAccount_Daily_Summary`

**Purpose:** Daily headline totals for the MyAccount tab.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `RegistrationDateOnly` | Date | - | Yes | No |
| `TotalAccounts` | Number | - | No | No |
| `UniqueContacts` | Number | - | No | No |
| `MarketingOptedIn` | Number | - | No | No |
| `MarketingNotOptedIn` | Number | - | No | No |
| `ActiveRegions` | Number | - | No | No |
| `TradeCategories` | Number | - | No | No |
| `OptInRatePct` | Decimal | 6,2 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Target Data Extension: `MyAccount_Daily_Region_Summary`

**Purpose:** Daily account and opt-in totals by culture/region.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `RegistrationDateOnly` | Date | - | Yes | No |
| `UserCulture` | Text | 50 | Yes | No |
| `TotalAccounts` | Number | - | No | No |
| `UniqueContacts` | Number | - | No | No |
| `MarketingOptedIn` | Number | - | No | No |
| `MarketingNotOptedIn` | Number | - | No | No |
| `OptInRatePct` | Decimal | 6,2 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Target Data Extension: `MyAccount_Daily_Trade_Summary`

**Purpose:** Daily account and opt-in totals by primary trade.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `RegistrationDateOnly` | Date | - | Yes | No |
| `PrimaryTradeNormalised` | Text | 100 | Yes | No |
| `TotalAccounts` | Number | - | No | No |
| `MarketingOptedIn` | Number | - | No | No |
| `MarketingNotOptedIn` | Number | - | No | No |
| `OptInRatePct` | Decimal | 6,2 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Target Data Extension: `MyAccount_Daily_Region_Trade_Summary`

**Purpose:** Supports combined date, culture and trade filtering.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `RegistrationDateOnly` | Date | - | Yes | No |
| `UserCulture` | Text | 50 | Yes | No |
| `PrimaryTradeNormalised` | Text | 100 | Yes | No |
| `TotalAccounts` | Number | - | No | No |
| `UniqueContacts` | Number | - | No | No |
| `MarketingOptedIn` | Number | - | No | No |
| `MarketingNotOptedIn` | Number | - | No | No |
| `OptInRatePct` | Decimal | 6,2 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Target Data Extension: `MyAccount_Daily_Consent_Summary`

**Purpose:** Daily consent status breakdown.

**Sendable:** No

**Action:** Overwrite

| Field Name | Data Type | Length / Scale | Primary Key | Nullable |
|------------|-----------|----------------|-------------|----------|
| `RegistrationDateOnly` | Date | - | Yes | No |
| `ConsentStatus` | Text | 50 | Yes | No |
| `ConsentCategory` | Text | 20 | Yes | No |
| `TotalAccounts` | Number | - | No | No |
| `PercentOfTotal` | Decimal | 6,2 | No | No |
| `InsertedDate` | Date | - | No | No |

---

### Task 8a: Build MyAccount Normalised Staging

**Activity Name:** `01 - Build MyAccount Normalised Staging`

**Target Data Extension:** `MyAccount_Normalised_Staging`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    Id,
    ContactId,
    RegistrationDate,
    CONVERT(DATE, RegistrationDate) AS RegistrationDateOnly,

    CASE
        WHEN UserCulture IS NULL OR LTRIM(RTRIM(UserCulture)) = ''
        THEN 'UNKNOWN'
        ELSE UPPER(LTRIM(RTRIM(UserCulture)))
    END AS UserCulture,

    PrimaryTrade AS PrimaryTradeRaw,

    CASE
        WHEN PrimaryTrade IS NULL
          OR LTRIM(RTRIM(PrimaryTrade)) = ''
          OR LOWER(LTRIM(RTRIM(PrimaryTrade))) = 'marketingapp.trades.none'
        THEN 'Not Specified'
        ELSE LTRIM(RTRIM(PrimaryTrade))
    END AS PrimaryTradeNormalised,

    CASE
        WHEN ConsentStatus IS NULL OR LTRIM(RTRIM(ConsentStatus)) = ''
        THEN 'Unknown'
        ELSE LTRIM(RTRIM(ConsentStatus))
    END AS ConsentStatus,

    CASE
        WHEN LTRIM(RTRIM(ConsentStatus)) IN ('Double Opt-In Verified', 'Single Opt-In')
        THEN 'Opted-In'
        ELSE 'Not Opted-In'
    END AS ConsentCategory,

    GETDATE() AS InsertedDate

FROM [My Account]

WHERE Id IS NOT NULL
  AND LTRIM(RTRIM(Id)) <> ''
  AND RegistrationDate IS NOT NULL
```

**Key Features:**
- Converts `RegistrationDate` into a date-only value for filtering and grouping
- Normalises `UserCulture` to uppercase
- Normalises blank or invalid `PrimaryTrade` values to `Not Specified`
- Maps consent statuses into `Opted-In` and `Not Opted-In`
- Creates a clean staging table used by all downstream summary queries

---

### Task 8b: Build MyAccount Daily Summary

**Activity Name:** `02 - Build MyAccount Daily Summary`

**Target Data Extension:** `MyAccount_Daily_Summary`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    RegistrationDateOnly,

    COUNT(*) AS TotalAccounts,

    COUNT(DISTINCT
        CASE
            WHEN ContactId IS NOT NULL
             AND LTRIM(RTRIM(ContactId)) <> ''
            THEN ContactId
            ELSE NULL
        END
    ) AS UniqueContacts,

    SUM(
        CASE
            WHEN ConsentCategory = 'Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingOptedIn,

    SUM(
        CASE
            WHEN ConsentCategory = 'Not Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingNotOptedIn,

    COUNT(DISTINCT UserCulture) AS ActiveRegions,

    COUNT(DISTINCT
        CASE
            WHEN PrimaryTradeNormalised <> 'Not Specified'
            THEN PrimaryTradeNormalised
            ELSE NULL
        END
    ) AS TradeCategories,

    CAST(
        CASE
            WHEN COUNT(*) > 0
            THEN
                SUM(
                    CASE
                        WHEN ConsentCategory = 'Opted-In'
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(*)
            ELSE 0
        END
        AS DECIMAL(6,2)
    ) AS OptInRatePct,

    GETDATE() AS InsertedDate

FROM MyAccount_Normalised_Staging

GROUP BY
    RegistrationDateOnly
```

**Key Features:**
- Provides daily total account counts
- Calculates unique contacts using `ContactId`
- Calculates opted-in and not opted-in account counts
- Provides active region and trade category counts for headline cards

---

### Task 8c: Build MyAccount Daily Region Summary

**Activity Name:** `03 - Build MyAccount Daily Region Summary`

**Target Data Extension:** `MyAccount_Daily_Region_Summary`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    CAST(RegistrationDateOnly AS DATE) AS RegistrationDateOnly,
    UserCulture,

    COUNT(*) AS TotalAccounts,

    COUNT(DISTINCT
        CASE
            WHEN ContactId IS NOT NULL
             AND LTRIM(RTRIM(ContactId)) <> ''
            THEN ContactId
            ELSE NULL
        END
    ) AS UniqueContacts,

    SUM(
        CASE
            WHEN ConsentCategory = 'Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingOptedIn,

    SUM(
        CASE
            WHEN ConsentCategory = 'Not Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingNotOptedIn,

    CAST(
        CASE
            WHEN COUNT(*) > 0
            THEN
                SUM(
                    CASE
                        WHEN ConsentCategory = 'Opted-In'
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(*)
            ELSE 0
        END
        AS DECIMAL(6,2)
    ) AS OptInRatePct,

    GETDATE() AS InsertedDate

FROM MyAccount_Normalised_Staging

WHERE RegistrationDateOnly IS NOT NULL
  AND UserCulture IS NOT NULL
  AND LTRIM(RTRIM(UserCulture)) <> ''

GROUP BY
    CAST(RegistrationDateOnly AS DATE),
    UserCulture
```

**Key Features:**
- Powers the region breakdown and regional opt-in table
- Supports date and culture filtering
- Includes a safer date cast in the SELECT and GROUP BY
- Requires target DE field order to start with `RegistrationDateOnly`, then `UserCulture`

---

### Task 8d: Build MyAccount Daily Trade Summary

**Activity Name:** `04 - Build MyAccount Daily Trade Summary`

**Target Data Extension:** `MyAccount_Daily_Trade_Summary`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    RegistrationDateOnly,
    PrimaryTradeNormalised,

    COUNT(*) AS TotalAccounts,

    SUM(
        CASE
            WHEN ConsentCategory = 'Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingOptedIn,

    SUM(
        CASE
            WHEN ConsentCategory = 'Not Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingNotOptedIn,

    CAST(
        CASE
            WHEN COUNT(*) > 0
            THEN
                SUM(
                    CASE
                        WHEN ConsentCategory = 'Opted-In'
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(*)
            ELSE 0
        END
        AS DECIMAL(6,2)
    ) AS OptInRatePct,

    GETDATE() AS InsertedDate

FROM MyAccount_Normalised_Staging

GROUP BY
    RegistrationDateOnly,
    PrimaryTradeNormalised
```

**Key Features:**
- Powers the primary trade breakdown
- Includes `Not Specified` trade records for complete account totals
- Calculates trade-level opt-in rates

---

### Task 8e: Build MyAccount Daily Region Trade Summary

**Activity Name:** `05 - Build MyAccount Daily Region Trade Summary`

**Target Data Extension:** `MyAccount_Daily_Region_Trade_Summary`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    RegistrationDateOnly,
    UserCulture,
    PrimaryTradeNormalised,

    COUNT(*) AS TotalAccounts,

    COUNT(DISTINCT
        CASE
            WHEN ContactId IS NOT NULL
             AND LTRIM(RTRIM(ContactId)) <> ''
            THEN ContactId
            ELSE NULL
        END
    ) AS UniqueContacts,

    SUM(
        CASE
            WHEN ConsentCategory = 'Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingOptedIn,

    SUM(
        CASE
            WHEN ConsentCategory = 'Not Opted-In'
            THEN 1
            ELSE 0
        END
    ) AS MarketingNotOptedIn,

    CAST(
        CASE
            WHEN COUNT(*) > 0
            THEN
                SUM(
                    CASE
                        WHEN ConsentCategory = 'Opted-In'
                        THEN 1
                        ELSE 0
                    END
                ) * 100.0 / COUNT(*)
            ELSE 0
        END
        AS DECIMAL(6,2)
    ) AS OptInRatePct,

    GETDATE() AS InsertedDate

FROM MyAccount_Normalised_Staging

GROUP BY
    RegistrationDateOnly,
    UserCulture,
    PrimaryTradeNormalised
```

**Key Features:**
- Supports combined culture and trade filtering
- Prevents the CloudPage from needing raw account-level records for filtered views
- Includes unique contact counts at region/trade grain

---

### Task 8f: Build MyAccount Daily Consent Summary

**Activity Name:** `06 - Build MyAccount Daily Consent Summary`

**Target Data Extension:** `MyAccount_Daily_Consent_Summary`

**Action:** Overwrite

**SQL Query:**
```sql
SELECT
    s.RegistrationDateOnly,
    s.ConsentStatus,
    s.ConsentCategory,

    COUNT(*) AS TotalAccounts,

    CAST(
        CASE
            WHEN d.TotalAccounts > 0
            THEN COUNT(*) * 100.0 / d.TotalAccounts
            ELSE 0
        END
        AS DECIMAL(6,2)
    ) AS PercentOfTotal,

    GETDATE() AS InsertedDate

FROM MyAccount_Normalised_Staging s

INNER JOIN (
    SELECT
        RegistrationDateOnly,
        COUNT(*) AS TotalAccounts
    FROM MyAccount_Normalised_Staging
    GROUP BY RegistrationDateOnly
) d
    ON s.RegistrationDateOnly = d.RegistrationDateOnly

GROUP BY
    s.RegistrationDateOnly,
    s.ConsentStatus,
    s.ConsentCategory,
    d.TotalAccounts
```

**Key Features:**
- Provides breakdown by original `ConsentStatus`
- Preserves the dashboard's higher-level `Opted-In` vs `Not Opted-In` grouping
- Calculates status share of daily total accounts

---

### MyAccount Aggregation Output Usage

The CloudPage should retrieve these aggregated Data Extensions instead of retrieving raw rows from `My Account`.

| Dashboard Requirement | Recommended Data Source |
|-----------------------|-------------------------|
| Headline total accounts | `MyAccount_Daily_Summary` |
| Headline opted-in and not opted-in totals | `MyAccount_Daily_Summary` |
| Headline active regions | `MyAccount_Daily_Summary` |
| Headline trade categories | `MyAccount_Daily_Summary` |
| Region breakdown | `MyAccount_Daily_Region_Summary` |
| Trade breakdown | `MyAccount_Daily_Trade_Summary` |
| Combined culture and trade filtering | `MyAccount_Daily_Region_Trade_Summary` |
| Consent status breakdown | `MyAccount_Daily_Consent_Summary` |

**Important Unique Contacts Note:**
`UniqueContacts` should not be summed blindly across grouped rows, because a single `ContactId` can exist across multiple regions. Use the most appropriate summary grain for the current filter state.

---

### Verification Queries

```sql
-- Check staging row count against source My Account count
SELECT COUNT(*) AS StagingRows
FROM MyAccount_Normalised_Staging
```

```sql
-- Check total accounts from daily summary
SELECT SUM(TotalAccounts) AS TotalAccounts
FROM MyAccount_Daily_Summary
```

```sql
-- Check opted-in and not opted-in totals reconcile to total accounts
SELECT
    SUM(TotalAccounts) AS TotalAccounts,
    SUM(MarketingOptedIn) AS MarketingOptedIn,
    SUM(MarketingNotOptedIn) AS MarketingNotOptedIn,
    SUM(MarketingOptedIn) + SUM(MarketingNotOptedIn) AS ConsentTotal
FROM MyAccount_Daily_Summary
```

```sql
-- Check region totals reconcile to total accounts
SELECT
    SUM(TotalAccounts) AS RegionSummaryTotal
FROM MyAccount_Daily_Region_Summary
```

```sql
-- Check trade totals reconcile to total accounts
SELECT
    SUM(TotalAccounts) AS TradeSummaryTotal
FROM MyAccount_Daily_Trade_Summary
```

```sql
-- Check top regions by account volume
SELECT
    UserCulture,
    SUM(TotalAccounts) AS TotalAccounts,
    SUM(MarketingOptedIn) AS MarketingOptedIn,
    SUM(MarketingNotOptedIn) AS MarketingNotOptedIn
FROM MyAccount_Daily_Region_Summary
GROUP BY UserCulture
ORDER BY TotalAccounts DESC
```

```sql
-- Check top trades by account volume
SELECT
    PrimaryTradeNormalised,
    SUM(TotalAccounts) AS TotalAccounts,
    SUM(MarketingOptedIn) AS MarketingOptedIn,
    SUM(MarketingNotOptedIn) AS MarketingNotOptedIn
FROM MyAccount_Daily_Trade_Summary
GROUP BY PrimaryTradeNormalised
ORDER BY TotalAccounts DESC
```

```sql
-- Check latest automation run timestamp
SELECT
    MAX(InsertedDate) AS LastUpdated
FROM MyAccount_Daily_Summary
```

---

### Troubleshooting

#### Issue: Step 3 fails with `Could not convert date and/or time from string data type`

**Most likely cause:** The target Data Extension field order does not match the SELECT column order. For `MyAccount_Daily_Region_Summary`, the first field must be `RegistrationDateOnly` as Date and the second field must be `UserCulture` as Text.

**Fix:** Recreate `MyAccount_Daily_Region_Summary` with this exact field order:
1. `RegistrationDateOnly` - Date, Primary Key
2. `UserCulture` - Text 50, Primary Key
3. `TotalAccounts` - Number
4. `UniqueContacts` - Number
5. `MarketingOptedIn` - Number
6. `MarketingNotOptedIn` - Number
7. `OptInRatePct` - Decimal 6,2
8. `InsertedDate` - Date

#### Issue: Dashboard account total is lower than the My Account DE row count

**Possible Causes:**
1. Staging query excluded rows with blank `Id` or blank `RegistrationDate`
2. Automation has not run after the latest My Account refresh
3. CloudPage is still using the old raw `retrieveMyAccountData()` function instead of aggregate DE retrieval

**Solutions:**
1. Compare source and staging counts
2. Check the latest `InsertedDate` in the summary DEs
3. Update the CloudPage MyAccount tab to use the new aggregate DEs

#### Issue: Unique contact totals differ between tables

**Cause:** `UniqueContacts` is calculated at the table grain. A contact can exist in more than one region, so summed region-level unique contacts may be higher than headline unique contacts.

**Solution:** Use `MyAccount_Daily_Summary` for headline unique contact totals and use region/trade tables only for their specific breakdown grain.

---

### MyAccount Automation Sequence

1. **Task 8a:** Build MyAccount Normalised Staging
2. **Task 8b:** Build MyAccount Daily Summary
3. **Task 8c:** Build MyAccount Daily Region Summary
4. **Task 8d:** Build MyAccount Daily Trade Summary
5. **Task 8e:** Build MyAccount Daily Region Trade Summary
6. **Task 8f:** Build MyAccount Daily Consent Summary

Task 8a must run first. Tasks 8b-8f can run after Task 8a has completed successfully.


---

## Task 9: Daily Send Metrics Aggregation (Send_Fact)

**Automation:** `Daily_Send_Metrics_Aggregation`

**Purpose:** Build the per-send `Send_Fact` table that powers the dashboard's individual campaign send view. Captures send metadata (subject, preheader, campaign, journey, market) from `ENT.Sendlog_Email` joined with engagement counts (bounces, opens, clicks, unsubscribes, complaints) from the System Data Views for sends in the last 7 days.

**Source:** System Data Views (`_Sent`, `_Job`, `_Journey`, `_JourneyActivity`, `_Bounce`, `_Open`, `_Click`, `_Unsubscribe`, `_Complaint`) and Shared DE `ENT.Sendlog_Email` (MID `510007388`)

**Target Data Extensions:**
- `Send_JobID_Staging` (overwrite) — send metadata
- `Send_Engagement_Staging` (overwrite + updates) — per-JobID engagement counts
- `Send_Fact` (update) — final consolidated send fact table

**Lookback Window:** Last 7 full days (`EventDate >= DATEADD(DAY, -7, GETDATE())` AND `< CAST(GETDATE() AS DATE)`)

**Schedule:** Daily

### Step 1: `Daily_Send_Metrics_Aggregation_1` — Populate Send Metadata Staging

**Target Data Extension:** `Send_JobID_Staging`

**Action:** Overwrite

```sql
SELECT DISTINCT
    s.JobID
    , j.EmailID
    , j.EmailName
    , COALESCE(MAX(sl.Subject), MAX(j.EmailSubject)) AS SubjectLine
    , COALESCE(MAX(sl.Preheader), '') AS Preheader
    , MAX(sl.CampaignName) AS CampaignName
    , MAX(jn.JourneyID) AS JourneyID
    , MAX(jn.JourneyName) AS JourneyName
    , MAX(sl.UserCulture) AS UserCulture
    , MAX(sl.CountryCode) AS Market
    , MIN(s.EventDate) AS SentDateTime
FROM _Sent AS s
    JOIN _Job AS j 
        ON s.JobID = j.JobID
    LEFT JOIN _JourneyActivity AS ja 
        ON j.TriggererSendDefinitionObjectID = ja.JourneyActivityObjectID
    LEFT JOIN _Journey AS jn 
        ON ja.VersionID = jn.VersionID
    LEFT JOIN ENT.Sendlog_Email AS sl 
        ON s.JobID = sl.JobID 
        AND s.SubscriberKey = sl.SubscriberKey
        AND sl.MID = '510007388'
WHERE s.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
    AND s.EventDate < CAST(GETDATE() AS DATE)
    AND (j.Category IS NULL OR j.Category <> 'Test Send Emails')
    AND j.EmailSubject NOT LIKE '[[]Test]%'
    AND LOWER(j.EmailName) NOT LIKE '%test%'
GROUP BY s.JobID, j.EmailID, j.EmailName
```

**Key Features:**
- Pulls human-readable subject/preheader/campaign from `ENT.Sendlog_Email` (MID-filtered)
- Falls back to `_Job.EmailSubject` when no Sendlog row exists
- Excludes test/template sends by targeting genuine test markers (Category `Test Send Emails`, `[Test]`-prefixed subject, `test` in EmailName) instead of any `%` character — this preserves legitimate personalized subjects such as `%%First Name%%`
- Captures earliest send timestamp per JobID via `MIN(s.EventDate)`

### Step 2: `Daily_Send_Metrics_Aggregation_2` — Initialise Engagement Staging with TotalSent

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Overwrite

```sql
SELECT
    s.JobID
    , COUNT(DISTINCT s.SubscriberKey) AS TotalSent
    , CAST(NULL AS INT) AS TotalHardBounces
    , CAST(NULL AS INT) AS TotalSoftBounces
    , CAST(NULL AS INT) AS TotalBounced
    , CAST(NULL AS INT) AS TotalUniqueOpens
    , CAST(NULL AS INT) AS TotalOpens
    , CAST(NULL AS INT) AS TotalUniqueClicks
    , CAST(NULL AS INT) AS TotalClicks
    , CAST(NULL AS INT) AS TotalUnsubscribes
    , CAST(NULL AS INT) AS TotalComplaints
FROM _Sent AS s
WHERE s.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
    AND s.EventDate < CAST(GETDATE() AS DATE)
GROUP BY s.JobID
```

### Step 3: `Daily_Send_Metrics_Aggregation_3` — Update Bounces

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Update

```sql
SELECT
    stg.JobID
    , ISNULL(bounce_agg.TotalHardBounces, 0) AS TotalHardBounces
    , ISNULL(bounce_agg.TotalSoftBounces, 0) AS TotalSoftBounces
    , ISNULL(bounce_agg.TotalBounced, 0) AS TotalBounced
FROM Send_Engagement_Staging AS stg
    LEFT JOIN (
        SELECT
            b.JobID
            , COUNT(DISTINCT CASE WHEN b.BounceCategory = 'Hard bounce' THEN b.SubscriberKey END) AS TotalHardBounces
            , COUNT(DISTINCT CASE WHEN b.BounceCategory IN ('Soft bounce', 'Technical bounce') THEN b.SubscriberKey END) AS TotalSoftBounces
            , COUNT(DISTINCT b.SubscriberKey) AS TotalBounced
        FROM _Bounce AS b
        WHERE b.IsUnique = 1
            AND b.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            AND b.EventDate < CAST(GETDATE() AS DATE)
            AND b.JobID IN (SELECT JobID FROM Send_Engagement_Staging)
        GROUP BY b.JobID
    ) AS bounce_agg
        ON stg.JobID = bounce_agg.JobID
```

### Step 4: `Daily_Send_Metrics_Aggregation_4` — Update Opens

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Update

```sql
SELECT
    stg.JobID
    , ISNULL(open_agg.TotalUniqueOpens, 0) AS TotalUniqueOpens
    , ISNULL(open_agg.TotalOpens, 0) AS TotalOpens
FROM Send_Engagement_Staging AS stg
    LEFT JOIN (
        SELECT
            o.JobID
            , COUNT(DISTINCT CASE WHEN o.IsUnique = 1 THEN o.SubscriberKey END) AS TotalUniqueOpens
            , COUNT(o.SubscriberKey) AS TotalOpens
        FROM _Open AS o
        WHERE o.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            AND o.EventDate < CAST(GETDATE() AS DATE)
            AND o.JobID IN (SELECT JobID FROM Send_Engagement_Staging)
        GROUP BY o.JobID
    ) AS open_agg
        ON stg.JobID = open_agg.JobID
```

### Step 5: `Daily_Send_Metrics_Aggregation_5` — Update Clicks

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Update

```sql
SELECT
    stg.JobID
    , ISNULL(click_agg.TotalUniqueClicks, 0) AS TotalUniqueClicks
    , ISNULL(click_agg.TotalClicks, 0) AS TotalClicks
FROM Send_Engagement_Staging AS stg
    LEFT JOIN (
        SELECT
            c.JobID
            , COUNT(DISTINCT CASE WHEN c.IsUnique = 1 THEN c.SubscriberKey END) AS TotalUniqueClicks
            , COUNT(c.SubscriberKey) AS TotalClicks
        FROM _Click AS c
        WHERE c.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            AND c.EventDate < CAST(GETDATE() AS DATE)
            AND c.JobID IN (SELECT JobID FROM Send_Engagement_Staging)
        GROUP BY c.JobID
    ) AS click_agg
        ON stg.JobID = click_agg.JobID
```

### Step 6: `Daily_Send_Metrics_Aggregation_6` — Update Unsubscribes

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Update

```sql
SELECT
    stg.JobID
    , ISNULL(unsub_agg.TotalUnsubscribes, 0) AS TotalUnsubscribes
FROM Send_Engagement_Staging AS stg
    LEFT JOIN (
        SELECT
            u.JobID
            , COUNT(DISTINCT u.SubscriberKey) AS TotalUnsubscribes
        FROM _Unsubscribe AS u
        WHERE u.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            AND u.EventDate < CAST(GETDATE() AS DATE)
            AND u.JobID IN (SELECT JobID FROM Send_Engagement_Staging)
        GROUP BY u.JobID
    ) AS unsub_agg
        ON stg.JobID = unsub_agg.JobID
```

### Step 7: `Daily_Send_Metrics_Aggregation_7` — Update Complaints

**Target Data Extension:** `Send_Engagement_Staging`

**Action:** Update

```sql
SELECT
    stg.JobID
    , ISNULL(comp_agg.TotalComplaints, 0) AS TotalComplaints
FROM Send_Engagement_Staging AS stg
    LEFT JOIN (
        SELECT
            comp.JobID
            , COUNT(DISTINCT comp.SubscriberKey) AS TotalComplaints
        FROM _Complaint AS comp
        WHERE comp.EventDate >= DATEADD(DAY, -7, CAST(GETDATE() AS DATE))
            AND comp.EventDate < CAST(GETDATE() AS DATE)
            AND comp.JobID IN (SELECT JobID FROM Send_Engagement_Staging)
        GROUP BY comp.JobID
    ) AS comp_agg
        ON stg.JobID = comp_agg.JobID
```

### Step 8: `Daily_Send_Metrics_Aggregation_8` — Merge Into Send_Fact

**Target Data Extension:** `Send_Fact`

**Action:** Update

```sql
SELECT
    meta.JobID
    , NULL AS CampaignID
    , meta.SentDateTime
    , meta.CampaignName
    , meta.SubjectLine
    , meta.Preheader
    , meta.JourneyID
    , meta.JourneyName
    , meta.Market
    , meta.UserCulture
    , NULL AS Segment
    , eng.TotalSent
    , eng.TotalSent - ISNULL(eng.TotalBounced, 0) AS TotalDelivered
    , ISNULL(eng.TotalHardBounces, 0) AS TotalHardBounces
    , ISNULL(eng.TotalSoftBounces, 0) AS TotalSoftBounces
    , ISNULL(eng.TotalBounced, 0) AS TotalBounced
    , ISNULL(eng.TotalComplaints, 0) AS TotalComplaints
    , ISNULL(eng.TotalUniqueOpens, 0) AS TotalUniqueOpens
    , ISNULL(eng.TotalOpens, 0) AS TotalOpens
    , ISNULL(eng.TotalUniqueClicks, 0) AS TotalUniqueClicks
    , ISNULL(eng.TotalClicks, 0) AS TotalClicks
    , ISNULL(eng.TotalUnsubscribes, 0) AS TotalUnsubscribes
    , CAST(1.0 * (eng.TotalSent - ISNULL(eng.TotalBounced, 0)) / NULLIF(eng.TotalSent, 0) AS DECIMAL(6, 4)) AS DeliveryRate
    , CAST(1.0 * ISNULL(eng.TotalBounced, 0) / NULLIF(eng.TotalSent, 0) AS DECIMAL(6, 4)) AS BounceRate
    , CAST(1.0 * ISNULL(eng.TotalComplaints, 0) / NULLIF(eng.TotalSent - ISNULL(eng.TotalBounced, 0), 0) AS DECIMAL(6, 4)) AS ComplaintRate
    , CAST(1.0 * ISNULL(eng.TotalUniqueOpens, 0) / NULLIF(eng.TotalSent - ISNULL(eng.TotalBounced, 0), 0) AS DECIMAL(6, 4)) AS OpenRate
    , CAST(1.0 * ISNULL(eng.TotalUniqueClicks, 0) / NULLIF(eng.TotalSent - ISNULL(eng.TotalBounced, 0), 0) AS DECIMAL(6, 4)) AS CTR
    , CAST(1.0 * ISNULL(eng.TotalUniqueClicks, 0) / NULLIF(ISNULL(eng.TotalUniqueOpens, 0), 0) AS DECIMAL(6, 4)) AS CTOR
    , CAST(1.0 * ISNULL(eng.TotalUnsubscribes, 0) / NULLIF(eng.TotalSent - ISNULL(eng.TotalBounced, 0), 0) AS DECIMAL(6, 4)) AS UnsubscribeRate
    , CAST(GETDATE() AS DATE) AS InsertedDate
    , CAST(GETDATE() AS DATE) AS ModifiedDate
FROM Send_JobID_Staging AS meta
    INNER JOIN Send_Engagement_Staging AS eng
        ON meta.JobID = eng.JobID
```

**Key Features:**
- Joins metadata (`Send_JobID_Staging`) with engagement totals (`Send_Engagement_Staging`) on JobID
- Calculates derived rates (Delivery, Bounce, Complaint, Open, CTR, CTOR, Unsubscribe) as `DECIMAL(6,4)` (0.0000–1.0000)
- Update action upserts by `JobID` so existing rows are refreshed with the latest 7-day engagement counts
- `CampaignID` and `Segment` reserved (NULL) for future use

### Execution Order Notes

Steps 1 and 2 are independent of each other but Steps 3–7 all depend on Step 2 (they update `Send_Engagement_Staging`). Step 8 depends on both staging tables being fully populated. The current automation runs all 8 steps sequentially.

---

*Last Updated: 22 May 2026*
