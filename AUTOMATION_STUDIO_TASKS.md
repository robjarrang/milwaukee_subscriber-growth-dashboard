# Automation Studio Tasks Documentation

This document details all SQL Query Activities and Automation configurations for the Milwaukee Subscriber Growth Dashboard data pipeline.

---

## Overview

The data pipeline consists of multiple SQL Query Activities that extract, transform, and aggregate email performance data from Salesforce Marketing Cloud System Data Views. These activities run on scheduled automations to populate Data Extensions used by the dashboard.

---

## Task 1: Populate Regional Monthly Metrics Staging

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
        WHEN LOWER(jn.JourneyName) LIKE '%sl-sl%' THEN 'SL-SL'
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
        WHEN LOWER(j.EmailName) LIKE '%sl-sl%' THEN 'SL-SL'
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
    /* Exclude dynamic/transactional emails that serve all regions */
    AND jn.JourneyName NOT LIKE '%DOI%'
    AND jn.JourneyName NOT LIKE '%Confirmation%'
    AND jn.JourneyName NOT LIKE '%Summary Email%'
    AND jn.JourneyName NOT LIKE '%Proof%'
    AND jn.JourneyName NOT LIKE '%Password Reset%'
    AND jn.JourneyName NOT LIKE '%Account Created%'
    AND jn.JourneyName NOT LIKE '%Project Status%'
    AND jn.JourneyName NOT LIKE '%Customisation Summary%'
    AND LOWER(jn.JourneyName) NOT LIKE '%test%'
    AND jn.JourneyName NOT LIKE '%_202_______%'
    /* Exclude test send category */
    AND (j.Category IS NULL OR j.Category != 'Test Send Emails')
    AND j.EmailSubject NOT LIKE '[Test]%'
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
    c.JobID, 
    c.ListID, 
    c.BatchID, 
    c.SubscriberID, 
    COUNT(*) AS TotalClicks 
FROM _Click c 
INNER JOIN Regional_Monthly_Metrics_Staging_DE s 
    ON c.JobID = s.JobID 
    AND c.ListID = s.ListID 
    AND c.BatchID = s.BatchID 
    AND c.SubscriberID = s.SubscriberID 
WHERE c.EventDate >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) 
    AND c.EventDate < DATEADD(MONTH, 1, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
GROUP BY c.JobID, c.ListID, c.BatchID, c.SubscriberID
```

### Task 1e: Update Staging with Unsubscribe Events

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
- Central/Eastern Europe: PL-PL, CS-CZ, SK-SK, HU-HU, RO-RO, BG-BG
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

The tasks should be organized into one or more Automations with the following dependency structure:

### Automation 1: Daily Metrics Collection (Runs at 2:00 AM)

1. **Task 1:** Populate Regional Monthly Metrics Staging
2. **Task 2:** Populate Monthly Metrics Staging (Non-Regional)
3. **Task 5:** Capture Campaign-Level Email Metrics

*These tasks run in parallel as they have no dependencies on each other*

### Automation 2: Daily Metrics Aggregation (Runs at 3:00 AM)

1. **Task 3:** Aggregate Regional Monthly Metrics
2. **Task 4:** Aggregate Overall Monthly Metrics
3. **Task 6:** Populate L1 Trade Daily Snapshot

*These tasks run after the staging tasks complete*

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

---

## Task 7: Aggregate DOI Pending Contacts by Region

**Activity Type:** SQL Query Activity

**Purpose:** Aggregate counts of contacts currently pending Double Opt-In (DOI) confirmation from the shared DOI journey Data Extensions. This provides the dashboard with pre-aggregated regional counts to avoid CloudPage request limits.

**Source Data Extensions (Shared):**
- `ENT.DOI Generic Journey` - General signup flow
- `ENT.DOI PEM Journey` - Prize Every Month signup flow

**Target Data Extension:** `DOI_Pending_Contacts_Aggregated`

**Action:** Overwrite (clears existing data and repopulates daily)

**Schedule:** Daily at 6:00 AM (after DOI journeys have processed overnight signups)

**SQL Query:**
```sql
/*
 * Task 7: Aggregate DOI Pending Contacts by Region
 * 
 * Created: January 2026
 * Purpose: Provide aggregated pending DOI counts for dashboard display
 * 
 * Filter Criteria:
 * - OptinStatus = 'Double Opt-In Pending' (only pending confirmations)
 * - IsLatest = 'True' (only most recent record per contact)
 * - TokenDate within last 3 days (confirmation link validity period)
 * 
 * Notes:
 * - Uses UNION ALL to combine both DOI journey sources
 * - Groups by UserCulture (region) for regional breakdown
 * - Tracks oldest and newest pending dates for monitoring
 */

SELECT 
    CONVERT(DATE, GETDATE()) AS SnapshotDate,
    UPPER(UserCulture) AS Region,
    'Generic' AS JourneyType,
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
GROUP BY UPPER(UserCulture)

UNION ALL

SELECT 
    CONVERT(DATE, GETDATE()) AS SnapshotDate,
    UPPER(UserCulture) AS Region,
    'PEM' AS JourneyType,
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
GROUP BY UPPER(UserCulture)
```

**Key Features:**
- Filters only contacts with `OptinStatus = 'Double Opt-In Pending'`
- Ensures `IsLatest = 'True'` to avoid counting duplicate records for same contact
- Only counts contacts within the 3-day confirmation window (token validity period)
- Separates counts by journey type (Generic vs PEM) for detailed analysis
- Tracks oldest and newest pending dates to monitor confirmation delays
- Converts UserCulture to uppercase for consistent region codes

**Expected Output:**
| SnapshotDate | Region | JourneyType | PendingCount | OldestPendingDate | NewestPendingDate |
|--------------|--------|-------------|--------------|-------------------|-------------------|
| 2026-01-26 | DE-DE | Generic | 145 | 2026-01-23 | 2026-01-26 |
| 2026-01-26 | DE-DE | PEM | 23 | 2026-01-24 | 2026-01-26 |
| 2026-01-26 | EN-GB | Generic | 89 | 2026-01-23 | 2026-01-26 |
| 2026-01-26 | FR-FR | Generic | 67 | 2026-01-24 | 2026-01-25 |
| ... | ... | ... | ... | ... | ... |

**Data Extension Creation:**
```sql
/* Create DOI_Pending_Contacts_Aggregated Data Extension */

-- Primary Key: SnapshotDate, Region, JourneyType (composite)
-- Fields:
-- SnapshotDate (Date, PK, Not Nullable)
-- Region (Text 50, PK, Not Nullable)
-- JourneyType (Text 50, PK, Not Nullable)
-- PendingCount (Number, Not Nullable, Default 0)
-- OldestPendingDate (Date, Nullable)
-- NewestPendingDate (Date, Nullable)
-- InsertedDate (Date, Not Nullable, Default GETDATE())
```

**Verification Query:**
```sql
-- Verify totals by journey type
SELECT 
    JourneyType,
    SUM(PendingCount) AS TotalPending,
    COUNT(DISTINCT Region) AS RegionsWithPending
FROM DOI_Pending_Contacts_Aggregated
WHERE SnapshotDate = CONVERT(DATE, GETDATE())
GROUP BY JourneyType

-- Check for data freshness
SELECT 
    MAX(InsertedDate) AS LastUpdated,
    SUM(PendingCount) AS TotalPendingContacts
FROM DOI_Pending_Contacts_Aggregated
```

---

*Last Updated: January 2026*
