# Ryobi Data Extension Schema Documentation

This document details the schema for all Data Extensions used in the Ryobi Subscriber Growth Dashboard.

---

## Key Differences from Milwaukee

1. **No Region Extraction from Names**: Ryobi does not have consistent naming conventions for Journeys or Emails, so region identification relies on subscriber data extensions
2. **Country-Specific Subscriber DEs**: Uses separate AllSubscribers_XX data extensions per country
3. **Preference Tracking**: Includes boolean preference fields that are tracked daily
4. **Simplified Regional Tracking**: Region is determined by which AllSubscribers_XX DE the subscriber exists in

---

## 1. Monthly_Metrics_Staging_DE

**Purpose:** Staging table for overall email metrics at the subscriber level. Used to collect raw event data before aggregation. Does not include regional breakdown due to lack of naming conventions.

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
| TotalOpens | Number | - | No | Yes | 0 | Total number of opens (including repeats) |
| TotalClicks | Number | - | No | Yes | 0 | Total number of clicks (including repeats) |

**Primary Key:** Composite key of (JobID, ListID, BatchID, SubscriberID)

**Note:** Regional tracking for sends is not included due to lack of consistent naming conventions. Regional subscriber counts are tracked separately via AllSubscribers_XX data extensions.

---

## 2. Monthly_Metrics_Final_DE

**Purpose:** Final aggregated email metrics by year and month (across all regions). This is the primary data source for combined/global email analytics in the dashboard.

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
| TotalOpens | Number | - | No | Yes | - | Total opens including repeats (non-unique) |
| TotalClicks | Number | - | No | Yes | - | Total clicks including repeats (non-unique) |
| DeliveryRatePct | Decimal | 6,2 | No | Yes | - | Percentage of emails delivered (Delivered/Sent × 100) |
| BounceRatePct | Decimal | 6,2 | No | Yes | - | Bounce rate (Bounced/Sent × 100) |
| OpenRatePct | Decimal | 6,2 | No | Yes | - | Percentage of delivered emails opened (Unique Opens/Delivered × 100) |
| ClickThroughRatePct | Decimal | 6,2 | No | Yes | - | Click-through rate (Unique Clicks/Delivered × 100) |
| ClickToOpenRatePct | Decimal | 6,2 | No | Yes | - | Click-to-open rate (Unique Clicks/Unique Opens × 100) |
| UnsubscribeRatePct | Decimal | 6,2 | No | Yes | - | Unsubscribe rate (Unique Unsubs/Delivered × 100) |

**Primary Key:** Composite key of (YearNumber, MonthNumber)

**Dashboard Usage:**
- Used for combined/global email analytics
- Powers the Email Campaign Performance section
- Does not include regional breakdowns for sends

---

## 3. SubscriberCount_Log_Daily

**Purpose:** Daily subscriber counts per country. Tracks growth/decline of subscriber base over time.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| LogDate | Date | - | ✓ | No | - | Date of the count |
| CountryCode | Text | 2 | ✓ | No | - | ISO country code (UK, SE, RO, PT, PL, NO, NL, LT, LV, HU, IT, FR, FI, ES, EE, DK, BE, DE, CZ) |
| SubscriberCount | Number | - | No | Yes | 0 | Total count of subscribers in the AllSubscribers_XX DE for this country |

**Primary Key:** Composite key of (LogDate, CountryCode)

**Data Source:** Queries each AllSubscribers_XX data extension daily

**Dashboard Usage:**
- Subscriber growth trends by country
- Overall subscriber count tracking
- Regional subscriber distribution

---

## 4. PreferenceCount_Log_Daily

**Purpose:** Daily counts of subscriber preferences per country. Tracks changes in subscriber interests and marketing opt-ins over time.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| LogDate | Date | - | ✓ | No | - | Date of the count |
| CountryCode | Text | 2 | ✓ | No | - | ISO country code (UK, SE, RO, PT, PL, NO, NL, LT, LV, HU, IT, FR, FI, ES, EE, DK, BE, DE, CZ) |
| PreferenceType | Text | 100 | ✓ | No | - | Name of the preference field being tracked |
| PreferenceCount | Number | - | No | Yes | 0 | Count of subscribers with this preference set to TRUE |
| TotalSubscribers | Number | - | No | Yes | 0 | Total subscriber count for this country (for percentage calculation) |
| PreferencePercentage | Decimal | 6,2 | No | Yes | - | Percentage of subscribers with this preference (Count/Total × 100) |

**Primary Key:** Composite key of (LogDate, CountryCode, PreferenceType)

**Tracked Preferences:**
- RYOBI_New_Product_Launches_Information__c
- RYOBI_Exclusive_Offers_Promotions__c
- RYOBI_Competitions_Giveaways__c
- RYOBI_One__c
- RYOBI_MAXPOWER__c
- RYOBI_USB_Lithium__c
- RYOBI_Crafting__c
- RYOBI_Automotive__c
- RYOBI_Camping__c
- RYOBI_Cleaning__c
- RYOBI_Gardening__c

**Dashboard Usage:**
- Track preference trends over time by country
- Identify popular product categories
- Monitor opt-in rates for different marketing types
- Regional preference comparisons

---

## 5. Campaign_Metrics_DE

**Purpose:** Individual campaign-level email metrics for each send. Captures performance data for every email send to enable campaign-specific analysis.

| Field Name | Data Type | Length | Primary Key | Nullable | Default Value | Description |
|------------|-----------|--------|-------------|----------|---------------|-------------|
| JobID | Number | - | ✓ | No | - | Unique email send job identifier |
| EmailName | Text | 200 | No | Yes | - | Name of the email as it appears in SFMC |
| EmailSubject | Text | 200 | No | Yes | - | Subject line of the email (may contain AMPscript) |
| SendDate | Date | - | No | Yes | - | Date the email was sent (time component removed) |
| TotalSent | Number | - | No | Yes | 0 | Total number of emails sent for this campaign |
| TotalBounced | Number | - | No | Yes | 0 | Unique count of bounced emails |
| TotalDelivered | Number | - | No | Yes | 0 | Total emails successfully delivered |
| TotalOpened | Number | - | No | Yes | 0 | Unique count of subscribers who opened |
| TotalClicked | Number | - | No | Yes | 0 | Unique count of subscribers who clicked |
| TotalUnsubscribed | Number | - | No | Yes | 0 | Unique count of subscribers who unsubscribed |
| DeliveryRate | Decimal | 6,2 | No | Yes | - | Percentage of emails delivered (Delivered/Sent × 100) |
| BounceRate | Decimal | 6,2 | No | Yes | - | Bounce rate (Bounced/Sent × 100) |
| OpenRate | Decimal | 6,2 | No | Yes | - | Percentage of delivered emails opened (Opens/Delivered × 100) |
| ClickRate | Decimal | 6,2 | No | Yes | - | Click-through rate (Clicks/Delivered × 100) |
| ClickToOpenRate | Decimal | 6,2 | No | Yes | - | Click-to-open rate (Clicks/Opens × 100) |
| UnsubscribeRate | Decimal | 6,2 | No | Yes | - | Unsubscribe rate (Unsubs/Delivered × 100) |
| JourneyName | Text | 200 | No | Yes | - | Name of the Journey (if sent via Journey Builder) or Email Name (if sent via other methods) |

**Primary Key:** JobID

**Data Source:** System Data Views (`_Job`, `_Sent`, `_Bounce`, `_Open`, `_Click`, `_Unsubscribe`, `_Journey`, `_JourneyActivity`)

**Note:** Does not include Region field due to lack of consistent naming conventions

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Email Send Events                         │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
                ┌──────────────────────────────┐
                │  Monthly_Metrics_Staging_DE  │
                │  (Subscriber-level data)     │
                └──────────────────────────────┘
                                 │
                                 │ Aggregation
                                 │ by Year/Month
                                 ▼
                ┌──────────────────────────────┐
                │  Monthly_Metrics_Final_DE    │
                │  (Overall metrics by         │
                │      Year/Month)             │
                └──────────────────────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Dashboard Display    │
                    │  - Combined View      │
                    │  - Campaign View      │
                    └───────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              AllSubscribers_XX Data Extensions                   │
│  (UK, SE, RO, PT, PL, NO, NL, LT, LV, HU, IT, FR, FI, ES,      │
│   EE, DK, BE, DE, CZ)                                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
    ┌──────────────────────────┐ ┌──────────────────────────┐
    │ SubscriberCount_Log_Daily│ │PreferenceCount_Log_Daily │
    │  (Daily subscriber counts│ │ (Daily preference counts │
    │       by country)        │ │   by country & type)     │
    └──────────────────────────┘ └──────────────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌───────────────────────┐
                    │  Dashboard Display    │
                    │  - Subscriber Growth  │
                    │  - Preference Trends  │
                    └───────────────────────┘
```

---

## Country Codes

Ryobi tracks subscribers across 19 countries:

| Country Code | Country Name | AllSubscribers DE |
|--------------|--------------|-------------------|
| UK | United Kingdom | AllSubscribers_UK |
| SE | Sweden | AllSubscribers_SE |
| RO | Romania | AllSubscribers_RO |
| PT | Portugal | AllSubscribers_PT |
| PL | Poland | AllSubscribers_PL |
| NO | Norway | AllSubscribers_NO |
| NL | Netherlands | AllSubscribers_NL |
| LT | Lithuania | AllSubscribers_LT |
| LV | Latvia | AllSubscribers_LV |
| HU | Hungary | AllSubscribers_HU |
| IT | Italy | AllSubscribers_IT |
| FR | France | AllSubscribers_FR |
| FI | Finland | AllSubscribers_FI |
| ES | Spain | AllSubscribers_ES |
| EE | Estonia | AllSubscribers_EE |
| DK | Denmark | AllSubscribers_DK |
| BE | Belgium | AllSubscribers_BE |
| DE | Germany | AllSubscribers_DE |
| CZ | Czech Republic | AllSubscribers_CZ |

---

## Metric Calculations

### Delivery Rate %
```
DeliveryRatePct = (TotalDelivered / TotalSent) × 100
```

### Bounce Rate %
```
BounceRatePct = (TotalBouncedUnique / TotalSent) × 100
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

### Preference Percentage
```
PreferencePercentage = (PreferenceCount / TotalSubscribers) × 100
```

---

## Notes

1. **No Regional Email Tracking:** Due to lack of consistent naming conventions in Journeys and Emails, regional breakdown of email metrics is not tracked. Only overall metrics are captured.

2. **Regional Subscriber Tracking:** While email metrics are not regional, subscriber counts and preferences are tracked per country via the separate AllSubscribers_XX data extensions.

3. **Preference Tracking:** All boolean preference fields are tracked daily to identify trends in subscriber interests over time.

4. **Unique vs Total Counts:** 
   - "Unique" fields (e.g., `TotalOpenUnique`) count each subscriber only once
   - "Total" fields (e.g., `TotalOpens`) include repeat actions by the same subscriber

5. **Percentage Fields:** All percentage fields are stored as `Decimal(6,2)`, allowing values from 0.00 to 9999.99.

---

*Last Updated: November 18, 2025*
