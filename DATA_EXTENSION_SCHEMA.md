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

## A.6 My Account

**Purpose:** MyAccount registration data for registered users. Contains user account information, trade preferences, and marketing consent status. Used for MyAccount analytics tab.

**Note:** This is a local Data Extension (no `ENT.` prefix required). Data is currently updated manually/weekly.

| Field Name | Data Type | Length | Primary Key | Nullable | Description |
|------------|-----------|--------|-------------|----------|-------------|
| Id | Text | 50 | ✓ | No | Unique account identifier (Salesforce ID format) |
| IndividualId | Text | 50 | No | No | Individual record identifier |
| ContactId | Text | 50 | No | No | Contact record identifier (shared across regions for multi-region users) |
| RegistrationDate | Date | - | No | No | Date the user registered their MyAccount |
| UserCulture | Text | 50 | No | No | User's culture/region code (e.g., 'EN-GB', 'DE-DE', 'IT-IT') |
| PrimaryTrade | Text | 50 | No | Yes | User's primary trade/profession (nullable - may be blank or 'marketingapp.trades.none') |
| ConsentStatus | Text | 50 | No | No | Marketing consent status (see mapping below) |
| Email | Text | 254 | No | No | User's email address |

**Primary Key:** Id

**ConsentStatus Values and Dashboard Mapping:**

| ConsentStatus Value | Dashboard Category | Description |
|---------------------|-------------------|-------------|
| `Double Opt-In Verified` | Opted-In | User completed double opt-in verification |
| `Single Opt-In` | Opted-In | User opted in via single opt-in |
| `Not Opted-In` | Not Opted-In | User has not opted in to marketing |
| `Withdrawn` | Not Opted-In | User previously opted in but has withdrawn consent |
| *(other/blank)* | Not Opted-In | Any other value treated as not opted in |

**Important Notes:**
- `ContactId` is the same for users who have registered across multiple regions. Use this to calculate unique contacts vs total accounts.
- `PrimaryTrade` may be blank, empty, or contain `marketingapp.trades.none` for users who haven't specified a trade. The dashboard normalizes these to "Not Specified".
- Email addresses are masked in the dashboard display for privacy (shows first 3 characters + domain).

**Dashboard Usage:**
- MyAccount tab: Total accounts, opt-in rates, trade distribution, region breakdown
- Supports filtering by date range and culture/region
- Shows both Total Accounts (all records) and Unique Contacts (by ContactId)

---

## A.7 Signup_Identifier_Performance_Lifetime_v2

**Purpose:** Lifetime engagement performance per signup identifier (source/form), rebuilt daily by the v2 Automation Studio pipeline (see `AUTOMATION_STUDIO_TASKS.md` — Task 11). Replaces the deprecated `Signup_Identifier_Performance_Lifetime` (v1) DE, which used a monthly-accumulator pattern that double-counted sends across runs and inflated totals (e.g. `MonthsActive` values far exceeding the real span of activity).

**Note:** This is a local Data Extension (no `ENT.` prefix). Not to be confused with the Shared DE `ENT.SignupIdentifier_Performance_Milwaukee` (see A.5), which tracks a different metric (attributed new-subscriber counts by region) and is queried separately.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| SignupIdentifier | Text | 255 | ✓ | No | - | Unique identifier for the signup source/form |
| ConsentStatus | Text | 100 | No | Yes | - | Most recent consent status observed for this identifier |
| OriginalCaptureSource | Text | 1000 | No | Yes | - | Earliest capture source string recorded for this identifier |
| LatestCaptureSource | Text | 1000 | No | Yes | - | Most recent capture source string recorded for this identifier |
| TotalLifetimeSends | Number | - | No | Yes | 0 | Sum of all daily sends since the pipeline began tracking (bounded by System Data View retention, ~6 months) |
| TotalLifetimeDelivered | Number | - | No | Yes | 0 | Sum of all daily delivered (sent minus bounced) |
| TotalLifetimeBounced | Number | - | No | Yes | 0 | Sum of all daily bounces |
| TotalLifetimeOpens | Number | - | No | Yes | 0 | Sum of all daily unique opens |
| TotalLifetimeClicks | Number | - | No | Yes | 0 | Sum of all daily unique clicks |
| TotalLifetimeUnsubscribes | Number | - | No | Yes | 0 | Sum of all daily unsubscribes |
| TotalLifetimeComplaints | Number | - | No | Yes | 0 | Sum of all daily complaints |
| LifetimeAvgDeliveryRate | Decimal | 6,4 | No | Yes | - | TotalLifetimeDelivered / TotalLifetimeSends |
| LifetimeAvgBounceRate | Decimal | 6,4 | No | Yes | - | TotalLifetimeBounced / TotalLifetimeSends |
| LifetimeAvgOpenRate | Decimal | 6,4 | No | Yes | - | TotalLifetimeOpens / TotalLifetimeDelivered |
| LifetimeAvgCTR | Decimal | 6,4 | No | Yes | - | TotalLifetimeClicks / TotalLifetimeDelivered |
| LifetimeAvgCTOR | Decimal | 6,4 | No | Yes | - | TotalLifetimeClicks / TotalLifetimeOpens |
| LifetimeAvgUnsubscribeRate | Decimal | 6,4 | No | Yes | - | TotalLifetimeUnsubscribes / TotalLifetimeDelivered |
| LifetimeAvgComplaintRate | Decimal | 6,4 | No | Yes | - | TotalLifetimeComplaints / TotalLifetimeDelivered |
| FirstActivityMonth | Date | - | No | Yes | - | First calendar month with any recorded daily activity |
| LastActivityMonth | Date | - | No | Yes | - | Most recent calendar month with recorded daily activity |
| LastActivityDate | Date | - | No | Yes | - | Most recent individual day (from `Signup_Identifier_Daily_Facts_v2`) with recorded activity |
| MonthsActive | Number | - | No | Yes | - | Count of distinct calendar months between FirstActivityMonth and LastActivityMonth |
| InsertedDate | Date | - | No | No | GETDATE() | Timestamp when the row was first created |
| ModifiedDate | Date | - | No | No | GETDATE() | Timestamp of the most recent rebuild |

**Primary Key:** SignupIdentifier

**Populated By:** Task 11, Step 9 (`Reporting_IdentifierPerformanceUpdate9_v2`) — **Overwrite**, rebuilt daily by summing the entire history in `Signup_Identifier_Daily_Facts_v2`.

**Dashboard Usage:**
- Signups tab: lifetime engagement metrics per signup identifier (`retrieveSignupPerformanceData()`, via WSProxy)
- Signup-detail sub-page: single-identifier lookup (`retrieveSignupSourceDetail()`, via `Platform.Function.LookupRows()`)

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

7. **Shared Data Extensions:** `SignupIdentifier_Performance_Milwaukee` is a Shared DE from the parent BU. For LookupRows, it is accessed via the `ENT.` prefix. WSProxy can also access Shared DEs by using their **CustomerKey (External Key)** instead of the DE name — e.g., `DataExtensionObject[C8B39EB9-5628-41FE-ADEB-D18772F6FBDF]`. The dashboard uses WSProxy with batched pagination as the primary retrieval method (to avoid the 2,000 row LookupRows cap), with LookupRows as a fallback.

---

## B.6 DOI_Pending_Contacts_Aggregated

**Purpose:** Aggregated counts of contacts currently pending Double Opt-In (DOI) confirmation, grouped by region and signup identifier. This DE is populated daily by an Automation Studio SQL Query Activity that queries the shared `DOI Generic Journey` and `DOI PEM Journey` Data Extensions.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| SnapshotDate | Date | - | ✓ | No | - | Date of the snapshot (GETDATE()) |
| Region | Text | 50 | ✓ | No | - | Geographic region/culture code from UserCulture field |
| JourneyType | Text | 50 | ✓ | No | - | Source journey: 'Generic' or 'PEM' |
| SignupIdentifier | Text | 200 | ✓ | No | - | Source/form identifier for the signup (e.g., 'website_footer', 'campaign_landing') |
| PendingCount | Number | - | No | No | 0 | Count of contacts with pending DOI status |
| OldestPendingDate | Date | - | No | Yes | - | Oldest TokenDate among pending contacts for this combination |
| NewestPendingDate | Date | - | No | Yes | - | Most recent TokenDate among pending contacts for this combination |
| InsertedDate | Date | - | No | No | GETDATE() | Timestamp when record was inserted |

**Primary Key:** Composite key of (SnapshotDate, Region, JourneyType, SignupIdentifier)

**Source Data Extensions (Shared):**
- `ENT.DOI Generic Journey` - General signup flow pending contacts
- `ENT.DOI PEM Journey` - Prize Every Month signup flow pending contacts

**Filter Criteria:**
- `OptinStatus = 'Double Opt-In Pending'` - Only pending confirmations
- `IsLatest = 'True'` - Only the most recent record per contact
- `TokenDate >= DATEADD(DAY, -3, GETDATE())` - Only within 3-day confirmation window

**Dashboard Usage:**
- Overview tab: Pending DOI contacts summary cards
- Regional breakdown of pending confirmations (aggregated across identifiers)
- Signup identifier breakdown (aggregated across regions)
- Monitoring DOI confirmation pipeline health by source

**Notes:**
- This aggregated DE exists to avoid CloudPage request limits when querying large shared DEs
- Read-only from the CloudPage perspective (populated by Automation Studio only)
- Contacts older than 3 days are not counted as the confirmation link expires
- Dashboard aggregates data client-side to show both regional and identifier views

---

## B.7 Signup_Identifier_Staging_v2

**Purpose:** Daily-refreshed lookup mapping each subscriber to their current signup identifier, consent status, and capture source. Rebuilt from scratch every run so it always reflects the latest consent record per subscriber; used as the join target for Step 2 of Task 11.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| SubscriberKey | Text | 254 | ✓ | No | - | Subscriber key |
| EmailAddress | EmailAddress | 254 | No | Yes | - | Subscriber's email address |
| SignupIdentifier | Text | 255 | No | Yes | - | Current signup source/form identifier |
| ConsentStatus | Text | 100 | No | Yes | - | Current consent status |
| OriginalCaptureSource | Text | 1000 | No | Yes | - | Earliest capture source string on record (widened to 1000 chars — some capture source values exceed 255 chars and were truncating) |
| LatestCaptureSource | Text | 1000 | No | Yes | - | Most recent capture source string on record |

**Primary Key:** SubscriberKey

**Populated By:** Task 11, Step 1 (`Reporting_IdentifierPerformanceUpdate1_v2`) — Overwrite, sourced from `ENT.Pivot_MarketingEmailOptIns_Milwaukee` and `ENT.ContactPointConsentExtended_Milwaukee`.

**Dashboard Usage:** None — automation pipeline only, not queried by the CloudPage.

---

## B.8 Signup_Identifier_Day_Staging_v2

**Purpose:** Rolling 7-day window of per-subscriber, per-send-day engagement flags, joined against `Signup_Identifier_Staging_v2` to attribute each day's activity to a signup identifier. This is the per-event staging layer that Step 8 aggregates into daily facts.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| JobID | Number | - | ✓ | No | - | Email send job identifier |
| SubscriberKey | Text | 254 | ✓ | No | - | Subscriber key |
| SignupIdentifier | Text | 255 | No | Yes | - | Signup source/form identifier (from Staging_v2) |
| ConsentStatus | Text | 100 | No | Yes | - | Consent status (from Staging_v2) |
| OriginalCaptureSource | Text | 1000 | No | Yes | - | Earliest capture source (from Staging_v2) |
| LatestCaptureSource | Text | 1000 | No | Yes | - | Latest capture source (from Staging_v2) |
| ActivityDate | Date | - | No | **Yes** | - | Calendar date of the send (nullable — some sends can resolve without a matching event date; see Step 3 validation fix below) |
| IsBounced | Number | - | No | Yes | - | 1 if bounced, 0/blank otherwise |
| IsOpened | Number | - | No | Yes | - | 1 if opened (unique), 0/blank otherwise |
| IsClicked | Number | - | No | Yes | - | 1 if clicked (unique), 0/blank otherwise |
| IsUnsubscribed | Number | - | No | Yes | - | 1 if unsubscribed, 0/blank otherwise |
| IsComplaint | Number | - | No | Yes | - | 1 if complained, 0/blank otherwise |

**Primary Key:** Composite key of (JobID, SubscriberKey)

**Populated By:** Task 11, Step 2 (Overwrite — rolling 7-day window from `_Sent`), Steps 3–7 (Update — Bounces, Opens, Clicks, Unsubscribes, Complaints from their respective System Data Views).

**Notes:**
- `ActivityDate` was originally required (Nullable = No), which caused an SFMC validation error on Step 3 because bounce/open/click/unsubscribe/complaint updates don't always carry a date value for every row in the join. Changed to Nullable = Yes to resolve.

**Dashboard Usage:** None — automation pipeline only, not queried by the CloudPage.

---

## B.9 Signup_Identifier_Daily_Facts_v2

**Purpose:** Permanent, ever-growing daily-grain fact table — one row per (SignupIdentifier, ActivityDate) — accumulated via `Update` (never truncated/overwritten as a whole), so history is preserved even though the upstream System Data Views only retain ~6 months of raw events. This is the DE that Step 9 sums to rebuild the lifetime totals in `Signup_Identifier_Performance_Lifetime_v2` (A.7).

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| SignupIdentifier | Text | 255 | ✓ | No | - | Signup source/form identifier |
| ActivityDate | Date | - | ✓ | No | - | Calendar date these daily totals apply to |
| ConsentStatus | Text | 100 | No | Yes | - | Consent status as of this day's run |
| OriginalCaptureSource | Text | 1000 | No | Yes | - | Earliest capture source as of this day's run |
| LatestCaptureSource | Text | 1000 | No | Yes | - | Latest capture source as of this day's run |
| DailySends | Number | - | No | Yes | 0 | Sends for this identifier on this date |
| DailyDelivered | Number | - | No | Yes | 0 | Delivered (sent minus bounced) for this identifier on this date |
| DailyBounced | Number | - | No | Yes | 0 | Bounces for this identifier on this date |
| DailyOpens | Number | - | No | Yes | 0 | Unique opens for this identifier on this date |
| DailyClicks | Number | - | No | Yes | 0 | Unique clicks for this identifier on this date |
| DailyUnsubscribes | Number | - | No | Yes | 0 | Unsubscribes for this identifier on this date |
| DailyComplaints | Number | - | No | Yes | 0 | Complaints for this identifier on this date |
| ModifiedDate | Date | - | No | No | GETDATE() | Timestamp of the most recent update to this row |

**Primary Key:** Composite key of (SignupIdentifier, ActivityDate)

**Populated By:** Task 11, Step 8 (`Reporting_IdentifierPerformanceUpdate8_v2`) — **Update**, aggregating `Signup_Identifier_Day_Staging_v2` grouped by (SignupIdentifier, ActivityDate).

**Notes:**
- This table is the reason v2 is idempotent and safe to re-run daily: each day's slice is written exactly once per (SignupIdentifier, ActivityDate) via upsert, so re-processing the same 7-day window on subsequent runs does not double-count — unlike the deprecated v1 monthly-accumulator design.

**Dashboard Usage:** None — automation pipeline only, not queried by the CloudPage.

---

*Last Updated: January 2026*
*Applies to: subscriber-growth-dashboard-new.html*
