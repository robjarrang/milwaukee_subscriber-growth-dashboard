# Data Extension Schema Documentation

This document details the schema for all Data Extensions used in the Milwaukee Subscriber Growth Dashboard (`subscriber-growth-dashboard-new.html`).

The dashboard queries Data Extensions in two categories:
1. **Dashboard Data Sources** - DEs queried directly by the CloudPage (Section A)
2. **Automation Pipeline DEs** - Staging and aggregation tables populated by Automation Studio (Section B)

---

# Section A: Dashboard Data Sources

These are the Data Extensions queried by the dashboard's SSJS code.

---

## A.1 Audience_Daily_Snapshot_Milwaukee

**Purpose:** Daily subscriber counts by region. Primary data source for subscriber growth analytics.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| SnapshotDate | Date | - | ✓ | No | Date of the snapshot |
| Region | Text | 50 | ✓ | No | Geographic region/culture code (e.g., EN-GB, DE-AT) |
| SubscriberCount | Number | - | No | Yes | Total marketable subscribers for this region |

**Primary Key:** Composite key of (SnapshotDate, Region)

**Dashboard Usage:**
- Overview tab: Total subscriber counts
- Growth Trends tab: Subscriber growth charts
- Culture View: Region-specific subscriber analytics

---

## A.2 L1_Trade_Daily_Snapshot_Milwaukee

**Purpose:** Daily trade (profession) distribution by region. Shows which trades subscribers belong to.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| SnapshotDate | Date | - | ✓ | No | Date of the snapshot |
| Region | Text | 50 | ✓ | No | Geographic region/culture code |
| L1Trade | Text | 100 | ✓ | No | Level 1 trade category (e.g., Electrical, Plumbing) |
| SubscriberCount | Number | - | No | Yes | Subscribers in this trade for this region |

**Primary Key:** Composite key of (SnapshotDate, Region, L1Trade)

**Dashboard Usage:**
- Overview tab: Trade distribution pie/bar charts
- Growth Trends tab: Trade breakdown over time
- Culture View: Region-specific trade analytics

---

## A.3 Regional_Email_Metrics_Milwaukee

**Purpose:** Aggregated email performance metrics by region. Used for email analytics in the dashboard.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| YearNumber | Number | - | ✓ | No | Year of the metrics (e.g., 2025) |
| MonthNumber | Number | - | ✓ | No | Month of the metrics (1-12) |
| Region | Text | 50 | ✓ | No | Geographic region/culture code |
| TotalSent | Number | - | No | Yes | Total emails sent to this region |
| TotalDelivered | Number | - | No | Yes | Total emails successfully delivered |
| TotalOpenUnique | Number | - | No | Yes | Unique count of subscribers who opened |
| TotalClickUnique | Number | - | No | Yes | Unique count of subscribers who clicked |
| TotalUnsubscribedUnique | Number | - | No | Yes | Unique count of unsubscribes |
| DeliveryRatePct | Decimal | 6,2 | No | Yes | Delivery rate percentage |
| OpenRatePct | Decimal | 6,2 | No | Yes | Open rate percentage |
| ClickThroughRatePct | Decimal | 6,2 | No | Yes | Click-through rate percentage |
| ClickToOpenRatePct | Decimal | 6,2 | No | Yes | Click-to-open rate percentage |

**Primary Key:** Composite key of (YearNumber, MonthNumber, Region)

**Dashboard Usage:**
- Email tab: Regional email performance analytics
- Culture View: Region-specific email metrics

---

## A.4 SendFact_Milwaukee

**Purpose:** Individual email send records with campaign-level metrics. Powers the Campaigns tab.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| JobID | Number | - | ✓ | No | Unique email send job identifier |
| EmailName | Text | 200 | No | Yes | Name of the email |
| EmailSubject | Text | 200 | No | Yes | Subject line of the email |
| SendDate | Date | - | No | Yes | Date the email was sent |
| Region | Text | 50 | No | Yes | Geographic region/culture code |
| TotalSent | Number | - | No | Yes | Total emails sent for this campaign |
| TotalDelivered | Number | - | No | Yes | Emails successfully delivered |
| TotalOpened | Number | - | No | Yes | Unique opens |
| TotalClicked | Number | - | No | Yes | Unique clicks |
| DeliveryRate | Decimal | 6,2 | No | Yes | Delivery rate percentage |
| OpenRate | Decimal | 6,2 | No | Yes | Open rate percentage |
| ClickRate | Decimal | 6,2 | No | Yes | Click-through rate percentage |
| ClickToOpenRate | Decimal | 6,2 | No | Yes | Click-to-open rate percentage |
| JourneyName | Text | 200 | No | Yes | Journey name (if from Journey Builder) |

**Primary Key:** JobID

**Dashboard Usage:**
- Campaigns tab: Individual email campaign performance table
- Email tab: Campaign-level drill-down

---

## A.5 SignupIdentifier_Performance_Milwaukee (Shared DE)

**Purpose:** Signup source performance metrics. Tracks which signup forms/identifiers drive the most subscribers and engagement.

**Note:** This is a Shared Data Extension from the parent BU, accessed with `ENT.` prefix.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| SnapshotDate | Date | - | ✓ | No | Date of the performance snapshot |
| SignupIdentifier | Text | 100 | ✓ | No | Unique identifier for the signup source |
| Region | Text | 50 | ✓ | No | Geographic region/culture code |
| TotalSignups | Number | - | No | Yes | Total signups from this source |
| TotalLifetimeSends | Number | - | No | Yes | Lifetime emails sent to these subscribers |
| TotalLifetimeOpens | Number | - | No | Yes | Lifetime opens from these subscribers |
| TotalLifetimeClicks | Number | - | No | Yes | Lifetime clicks from these subscribers |
| LifetimeOpenRate | Decimal | 6,2 | No | Yes | Lifetime open rate |
| LifetimeClickRate | Decimal | 6,2 | No | Yes | Lifetime click rate |

**Primary Key:** Composite key of (SnapshotDate, SignupIdentifier, Region)

**Dashboard Usage:**
- Signups tab: Signup source performance table and charts

---

# Section B: Automation Pipeline Data Extensions

These Data Extensions are used by Automation Studio SQL Query Activities to aggregate email metrics. See `AUTOMATION_STUDIO_TASKS.md` for the SQL queries.

---

## B.1 Regional_Monthly_Metrics_Staging_DE

**Purpose:** Staging table for regional email metrics at the subscriber level. Used to collect raw event data before aggregation.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| JobID | Number | - | ✓ | No | - | Email send job identifier |
| ListID | Number | - | ✓ | No | - | List identifier |
| BatchID | Number | - | ✓ | No | - | Batch identifier for the send |
| SubscriberID | Number | - | ✓ | No | - | Unique subscriber identifier |
| Region | Text | 50 | No | Yes | - | Geographic region/culture code (e.g., EN-GB, DE-AT) |
| IsBounced | Number | - | No | Yes | 0 | Boolean flag: 1 if bounced, 0 otherwise |
| IsOpened | Number | - | No | Yes | 0 | Boolean flag: 1 if opened (unique), 0 otherwise |
| IsClicked | Number | - | No | Yes | 0 | Boolean flag: 1 if clicked (unique), 0 otherwise |
| IsUnsubscribed | Number | - | No | Yes | 0 | Boolean flag: 1 if unsubscribed, 0 otherwise |
| TotalOpens | Number | - | No | Yes | 0 | Total number of opens (including repeats) |
| TotalClicks | Number | - | No | Yes | 0 | Total number of clicks (including repeats) |

**Primary Key:** Composite key of (JobID, ListID, BatchID, SubscriberID)

---

## B.2 Monthly_Metrics_Staging_DE

**Purpose:** Staging table for overall (non-regional) email metrics at the subscriber level. Used to collect raw event data before aggregation.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| JobID | Number | - | ✓ | No | - | Email send job identifier |
| ListID | Number | - | ✓ | No | - | List identifier |
| BatchID | Number | - | ✓ | No | - | Batch identifier for the send |
| SubscriberID | Number | - | ✓ | No | - | Unique subscriber identifier |
| IsBounced | Number | - | No | Yes | 0 | Boolean flag: 1 if bounced, 0 otherwise |
| IsOpened | Number | - | No | Yes | 0 | Boolean flag: 1 if opened (unique), 0 otherwise |
| IsClicked | Number | - | No | Yes | 0 | Boolean flag: 1 if clicked (unique), 0 otherwise |
| IsUnsubscribed | Number | - | No | Yes | 0 | Boolean flag: 1 if unsubscribed, 0 otherwise |

**Primary Key:** Composite key of (JobID, ListID, BatchID, SubscriberID)

**Note:** This table does not include a Region field, as it aggregates metrics across all regions.

---

## B.3 Regional_Monthly_Metrics_Final_DE

**Purpose:** Final aggregated regional email metrics by year, month, and region. This is the primary data source for regional email analytics in the dashboard.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| YearNumber | Number | - | ✓ | No | - | Year of the metrics (e.g., 2025) |
| MonthNumber | Number | - | ✓ | No | - | Month of the metrics (1-12) |
| Region | Text | 50 | ✓ | No | - | Geographic region/culture code (e.g., EN-GB, DE-AT) |
| TotalSent | Number | - | No | Yes | - | Total emails sent to this region |
| TotalBouncedUnique | Number | - | No | Yes | - | Unique count of bounced emails |
| TotalDelivered | Number | - | No | Yes | - | Total emails successfully delivered |
| TotalOpenUnique | Number | - | No | Yes | - | Unique count of subscribers who opened |
| TotalClickUnique | Number | - | No | Yes | - | Unique count of subscribers who clicked |
| TotalUnsubscribedUnique | Number | - | No | Yes | - | Unique count of subscribers who unsubscribed |
| DeliveryRatePct | Decimal | 6,2 | No | Yes | - | Percentage of emails delivered (Delivered/Sent × 100) |
| OpenRatePct | Decimal | 6,2 | No | Yes | - | Percentage of delivered emails opened (Unique Opens/Delivered × 100) |
| ClickThroughRatePct | Decimal | 6,2 | No | Yes | - | Click-through rate (Unique Clicks/Delivered × 100) |
| ClickToOpenRatePct | Decimal | 6,2 | No | Yes | - | Click-to-open rate (Unique Clicks/Unique Opens × 100) |
| UnsubscribeRatePct | Decimal | 6,2 | No | Yes | - | Unsubscribe rate (Unique Unsubs/Delivered × 100) |
| TotalOpens | Number | - | No | Yes | - | Total opens including repeats (non-unique) |
| TotalClicks | Number | - | No | Yes | - | Total clicks including repeats (non-unique) |
| BounceRatePct | Decimal | 6,2 | No | Yes | - | Bounce rate (Bounced/Sent × 100) |

**Primary Key:** Composite key of (YearNumber, MonthNumber, Region)

**Dashboard Usage:**
- Used for culture-specific email analytics
- Powers the Email Campaign Performance section in regional views
- Displayed in the Combined view when filtered by region

---

## B.4 SendCount

**Purpose:** Final aggregated overall email metrics by year and month (across all regions). This is the primary data source for combined/global email analytics in the dashboard.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| YearNumber | Number | - | ✓ | No | - | Year of the metrics (e.g., 2025) |
| MonthNumber | Number | - | ✓ | No | - | Month of the metrics (1-12) |
| TotalSent | Number | - | No | Yes | - | Total emails sent across all regions |
| TotalBouncedUnique | Number | - | No | Yes | - | Unique count of bounced emails |
| TotalDelivered | Number | - | No | Yes | - | Total emails successfully delivered |
| TotalOpenUnique | Number | - | No | Yes | - | Unique count of subscribers who opened |
| TotalClickUnique | Number | - | No | Yes | - | Unique count of subscribers who clicked |
| TotalUnsubscribedUnique | Number | - | No | Yes | - | Unique count of subscribers who unsubscribed |
| DeliveryRatePct | Decimal | 6,2 | No | Yes | - | Percentage of emails delivered (Delivered/Sent × 100) |
| OpenRatePct | Decimal | 6,2 | No | Yes | - | Percentage of delivered emails opened (Unique Opens/Delivered × 100) |
| ClickThroughRatePct | Decimal | 6,2 | No | Yes | - | Click-through rate (Unique Clicks/Delivered × 100) |
| ClickToOpenRatePct | Decimal | 6,2 | No | Yes | - | Click-to-open rate (Unique Clicks/Unique Opens × 100) |
| UnsubscribeRatePct | Decimal | 6,2 | No | Yes | - | Unsubscribe rate (Unique Unsubs/Delivered × 100) |
| TotalOpens | Number | - | No | Yes | - | Total opens including repeats (non-unique) |
| TotalClicks | Number | - | No | Yes | - | Total clicks including repeats (non-unique) |
| BounceRatePct | Decimal | 6,2 | No | Yes | - | Bounce rate (Bounced/Sent × 100) |

**Primary Key:** Composite key of (YearNumber, MonthNumber)

**Dashboard Usage:**
- Used for combined/global email analytics
- Powers the Email Campaign Performance section in the Combined view
- Does not include regional breakdowns

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Email Send Events                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │ Regional_Monthly_Metrics_ │ │  Monthly_Metrics_Staging_ │
    │        Staging_DE         │ │           DE              │
    │  (Subscriber-level data   │ │  (Subscriber-level data   │
    │     with Region field)    │ │    without Region field)  │
    └───────────────────────────┘ └───────────────────────────┘
                    │                         │
                    │ Aggregation             │ Aggregation
                    │ by Year/Month/Region    │ by Year/Month
                    ▼                         ▼
    ┌───────────────────────────┐ ┌───────────────────────────┐
    │Regional_Monthly_Metrics_  │ │       SendCount           │
    │        Final_DE           │ │  (Overall metrics by      │
    │  (Regional metrics by     │ │      Year/Month)          │
    │    Year/Month/Region)     │ │                           │
    └───────────────────────────┘ └───────────────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Dashboard Display    │
                    │  - Combined View      │
                    │  - Culture Views      │
                    └───────────────────────┘
```

---

## Metric Calculations

### Delivery Rate %
```
DeliveryRatePct = (TotalDelivered / TotalSent) × 100
```

### Open Rate %
```
OpenRatePct = (TotalOpenUnique / TotalDelivered) × 100
```

### Click-Through Rate %
```
ClickThroughRatePct = (TotalClickUnique / TotalDelivered) × 100
```

### Click-to-Open Rate %
```
ClickToOpenRatePct = (TotalClickUnique / TotalOpenUnique) × 100
```

### Unsubscribe Rate %
```
UnsubscribeRatePct = (TotalUnsubscribedUnique / TotalDelivered) × 100
```

### Bounce Rate %
```
BounceRatePct = (TotalBouncedUnique / TotalSent) × 100
```

---

## B.5 Campaign_Metrics_DE

**Purpose:** Individual campaign-level email metrics for each send. Captures performance data for every email send (Journey Builder, Automation Studio, or Guided Sends) to enable campaign-specific analysis.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| JobID | Number | - | ✓ | No | - | Unique email send job identifier |
| EmailName | Text | 200 | No | Yes | - | Name of the email as it appears in SFMC |
| EmailSubject | Text | 200 | No | Yes | - | Subject line of the email (may contain AMPscript) |
| SendDate | Date | - | No | Yes | - | Date the email was sent (time component removed) |
| Region | Text | 50 | No | Yes | - | Geographic region/culture code extracted from Journey or Email name |
| TotalSent | Number | - | No | Yes | 0 | Total number of emails sent for this campaign |
| TotalBounced | Number | - | No | Yes | 0 | Unique count of bounced emails |
| TotalDelivered | Number | - | No | Yes | 0 | Total emails successfully delivered |
| TotalOpened | Number | - | No | Yes | 0 | Unique count of subscribers who opened |
| TotalClicked | Number | - | No | Yes | 0 | Unique count of subscribers who clicked |
| TotalUnsubscribed | Number | - | No | Yes | 0 | Unique count of subscribers who unsubscribed |
| DeliveryRate | Decimal | 6,2 | No | Yes | - | Percentage of emails delivered (Delivered/Sent × 100) |
| OpenRate | Decimal | 6,2 | No | Yes | - | Percentage of delivered emails opened (Opens/Delivered × 100) |
| ClickRate | Decimal | 6,2 | No | Yes | - | Click-through rate (Clicks/Delivered × 100) |
| ClickToOpenRate | Decimal | 6,2 | No | Yes | - | Click-to-open rate (Clicks/Opens × 100) |
| UnsubscribeRate | Decimal | 6,2 | No | Yes | - | Unsubscribe rate (Unsubs/Delivered × 100) |
| JourneyName | Text | 200 | No | Yes | - | Name of the Journey (if sent via Journey Builder) or Email Name (if sent via other methods) |

**Primary Key:** JobID

**Data Source:** System Data Views (`_Job`, `_Sent`, `_Bounce`, `_Open`, `_Click`, `_Unsubscribe`, `_Journey`, `_JourneyActivity`)

**Refresh Schedule:** Daily via Automation Studio

**Dashboard Usage:**
- Campaign performance analysis
- Individual email send metrics
- Regional campaign comparison
- Time-series campaign analysis

**Region Extraction Logic:**
- First attempts to extract region from Journey name (for Journey Builder sends)
- Falls back to Email name extraction (for Automation Studio/Guided sends)
- Uses consistent pattern matching across all 30+ regions
- Excludes campaigns where region cannot be determined

---

## Notes

1. **Section A vs Section B:** Section A DEs are queried directly by the dashboard CloudPage. Section B DEs are used by the Automation Studio pipeline to aggregate metrics.

2. **Staging vs Final Tables:** Staging tables store raw subscriber-level events, while Final tables store aggregated monthly metrics.

3. **Regional vs Non-Regional:** `Regional_Email_Metrics_Milwaukee` includes region breakdowns, while `SendCount` provides overall metrics across all regions.

4. **Unique vs Total Counts:** 
   - "Unique" fields (e.g., `TotalOpenUnique`) count each subscriber only once
   - "Total" fields (e.g., `TotalOpens`) include repeat actions by the same subscriber

5. **Percentage Fields:** All percentage fields are stored as `Decimal(6,2)`, allowing values from 0.00 to 9999.99.

6. **Dashboard Deduplication:** The dashboard implements additional deduplication logic to handle cases where the same region code appears in multiple case variations (e.g., EN-GB vs en-GB).

7. **Shared Data Extensions:** `SignupIdentifier_Performance_Milwaukee` is a Shared DE from the parent BU, accessed via `ENT.` prefix. WSProxy cannot query Shared DEs, so LookupRows is used instead.

---

## B.6 DOI_Pending_Contacts_Aggregated

**Purpose:** Aggregated counts of contacts currently pending Double Opt-In (DOI) confirmation, grouped by region. This DE is populated daily by an Automation Studio SQL Query Activity that queries the shared `DOI Generic Journey` and `DOI PEM Journey` Data Extensions.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| SnapshotDate | Date | - | ✓ | No | - | Date of the snapshot (GETDATE()) |
| Region | Text | 50 | ✓ | No | - | Geographic region/culture code from UserCulture field |
| JourneyType | Text | 50 | ✓ | No | - | Source journey: 'Generic' or 'PEM' |
| PendingCount | Number | - | No | No | 0 | Count of contacts with pending DOI status |
| OldestPendingDate | Date | - | No | Yes | - | Oldest TokenDate among pending contacts for this region |
| NewestPendingDate | Date | - | No | Yes | - | Most recent TokenDate among pending contacts for this region |
| InsertedDate | Date | - | No | No | GETDATE() | Timestamp when record was inserted |

**Primary Key:** Composite key of (SnapshotDate, Region, JourneyType)

**Source Data Extensions (Shared):**
- `ENT.DOI Generic Journey` - General signup flow pending contacts
- `ENT.DOI PEM Journey` - Prize Every Month signup flow pending contacts

**Filter Criteria:**
- `OptinStatus = 'Double Opt-In Pending'` - Only pending confirmations
- `IsLatest = 'True'` - Only the most recent record per contact
- `TokenDate >= DATEADD(DAY, -3, GETDATE())` - Only within 3-day confirmation window

**Dashboard Usage:**
- Overview tab: Pending DOI contacts summary card
- Regional breakdown of pending confirmations
- Monitoring DOI confirmation pipeline health

**Notes:**
- This aggregated DE exists to avoid CloudPage request limits when querying large shared DEs
- Read-only from the CloudPage perspective (populated by Automation Studio only)
- Contacts older than 3 days are not counted as the confirmation link expires

---

*Last Updated: January 2026*
*Applies to: subscriber-growth-dashboard-new.html*
