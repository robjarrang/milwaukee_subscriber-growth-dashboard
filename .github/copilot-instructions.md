# Copilot Instructions for Milwaukee Subscriber Growth Dashboard

## Repository Overview

This repository contains a **Salesforce Marketing Cloud (SFMC) CloudPage dashboard** for Milwaukee Power Tools subscriber analytics. The dashboard displays email performance, subscriber growth, trade distribution, and signup source metrics across 30 global cultures/regions.

### Key Facts
- **Single-file application**: The entire dashboard is contained in `subscriber-growth-dashboard-new.html` (~13,000 lines)
- **No build system**: No package.json, webpack, or CI/CD pipeline
- **Deployment**: Manual copy-paste to SFMC CloudPages
- **Server-side**: SSJS (Server-Side JavaScript) + AMPscript
- **Client-side**: Vanilla JavaScript, Chart.js 3.9.1, Bootstrap 5.3.2

---

## Architecture Overview

### Three-Layer Structure in `subscriber-growth-dashboard-new.html`

```
Lines 1-100:      AMPscript OAuth authentication
Lines 100-1100:   SSJS data retrieval functions and conditional loading
Lines 1100-5800:  HTML structure (Bootstrap layout, tabs, modals)
Lines 5800-13000: Client-side JavaScript (rendering, filtering, charts)
```

### Critical Pattern: Conditional Tab-Based Data Loading

**IMPORTANT**: Data is loaded conditionally based on the `tab` URL parameter to avoid CloudPage request limits. Each tab only loads the data it needs.

```javascript
// Server-side SSJS (lines 140-220)
if (activeTab == "overview") {
    // Loads: dailySnapshotData, l1TradeData, pendingContactsData
} else if (activeTab == "signups") {
    // Loads: signupPerformanceData, signupIdentifierPerformanceData, pendingContactsData
} else if (activeTab == "email") {
    // Loads: regionalMetricsData
} else if (activeTab == "myaccount") {
    // Loads: myAccountData (from 'My Account' DE)
} // ... etc
```

**When adding features that need data on multiple tabs**, ensure you add the data retrieval call to ALL relevant tab conditions.

---

## File Structure

```
├── subscriber-growth-dashboard-new.html   # Main CloudPage (THE code file)
├── README.md                              # Feature overview, 30 cultures
├── DATA_EXTENSION_SCHEMA.md               # Complete DE field schemas
├── AUTOMATION_STUDIO_TASKS.md             # SQL Query Activities (Tasks 1-7)
├── QUICK_REFERENCE.md                     # Performance patterns, helper functions
└── ryobi/                                 # RYOBI brand variant documentation
    ├── RYOBI_AUTOMATION_STUDIO_TASKS.md
    ├── RYOBI_DATA_EXTENSION_SCHEMA.md
    └── RYOBI_QUICK_REFERENCE.md
```

### Documentation Reference Guide

| Need to understand... | Read this file |
|----------------------|----------------|
| Data Extension fields and types | `DATA_EXTENSION_SCHEMA.md` |
| SQL queries that populate DEs | `AUTOMATION_STUDIO_TASKS.md` |
| Code patterns, helper functions | `QUICK_REFERENCE.md` |
| Supported regions/cultures | `README.md` |
| RYOBI brand differences | `ryobi/RYOBI_*.md` files |

---

## Data Extensions

### Section A: Dashboard Data Sources (Local DEs)
- **A.1** `Audience_Daily_Snapshot` - Daily subscriber counts by region
- **A.2** `Audience_L1_Trade_Snapshot` - Trade distribution by region
- **A.3** `Regional_Email_Metrics` - Monthly aggregated email performance
- **A.4** `SendFact` - Individual campaign send data
- **A.5** `Signup_Performance` - Regional signup metrics
- **A.6** `My Account` - MyAccount registration data (accounts, trades, consent status)

### Section B: Automation Pipeline (Staging/Aggregation)
- **B.1-B.5** Staging tables for ETL pipeline
- **B.6** `DOI_Pending_Contacts_Aggregated` - Pending DOI counts by region/SignupIdentifier

### Shared Data Extensions (use `ENT.` prefix)
- `ENT.SignupIdentifier_Performance_Milwaukee`
- `ENT.DOI Generic Journey`
- `ENT.DOI PEM Journey`

---

## Key Code Patterns

### 1. SSJS Data Retrieval with WSProxy
All data retrieval uses SFMC's WSProxy for batched pagination:

```javascript
function retrieveAudienceDailySnapshot() {
    var prox = new Script.Util.WSProxy();
    var cols = ["SnapshotDate", "Region", "TotalSubscribers", ...];
    var opts = { BatchSize: 2500 };
    var maxBatches = 3; // Prevent timeout
    // ... pagination loop with data.HasMoreRows
}
```

### 2. DocumentFragment for DOM Performance
Always use DocumentFragment for batch DOM insertions:

```javascript
// CORRECT - batch DOM insertion
const fragment = document.createDocumentFragment();
data.forEach(item => {
    const row = document.createElement('tr');
    // ... build row
    fragment.appendChild(row);
});
tableBody.appendChild(fragment);

// WRONG - individual DOM insertions (causes reflow)
data.forEach(item => tableBody.innerHTML += '<tr>...</tr>');
```

### 3. Debounced Filter Updates
Filter changes use debouncing to prevent excessive re-renders:

```javascript
var globalFilterDebounceTimer = null;
function applyGlobalFiltersDebounced() {
    if (globalFilterDebounceTimer) clearTimeout(globalFilterDebounceTimer);
    globalFilterDebounceTimer = setTimeout(applyGlobalFilters, 300);
}
```

### 4. Region Code Normalization
Always uppercase region codes for consistency:

```javascript
// Server-side
obj.region = (prop.Value || "").toUpperCase();

// Client-side comparison
if (item.region.toUpperCase() === filterRegion.toUpperCase())
```

---

## Common Tasks

### Adding a New Data Field

1. **Add to DE schema** in `DATA_EXTENSION_SCHEMA.md`
2. **Update SQL** in `AUTOMATION_STUDIO_TASKS.md` if field needs aggregation
3. **Add to SSJS retrieval** function (add to `cols` array and mapping)
4. **Add to client-side** rendering function

### Adding Data to a New Tab

1. Locate the SSJS conditional loading block (lines 140-220)
2. Add your `retrieve*()` call to the appropriate tab condition
3. **If data is needed on multiple tabs, add to ALL relevant conditions**

### Adding a New Chart

1. Add canvas element in HTML section
2. Create render function in JavaScript section (lines 5800+)
3. Use existing chart patterns from `renderSubscriberSnapshotChart()` or similar
4. Charts use Chart.js 3.9.1 - reference their docs for options

---

## Validation & Testing

### No Automated Testing
- No unit tests, linting, or CI/CD
- Validation is manual testing in SFMC CloudPages
- After changes, copy file to SFMC and test each affected tab

### Manual Validation Checklist
1. Check browser console for JavaScript errors
2. Verify data displays correctly on affected tabs
3. Test with date filters and region filters
4. Verify charts render without errors
5. Check responsive behavior on mobile viewport

### SSJS Debugging
Add debug info to the `debugInfo` variable (visible in page source):
```javascript
debugInfo += "MyFunction: " + myVariable + ". ";
```

### Client-Side Debugging
Use console.log, but **remove before committing**:
```javascript
console.log('pendingContactsData:', pendingContactsData);
```

---

## Known Limitations & Gotchas

### 1. CloudPage Request Limits
- Max ~2500 records per WSProxy retrieve call
- Solution: Batch with pagination (see `maxBatches` pattern)
- Pre-aggregate data in SQL when possible

### 2. SSJS Has No ES6
Server-side code must use ES5:
```javascript
// WRONG (ES6)
const data = items.map(i => i.value);

// CORRECT (ES5)
var data = [];
for (var i = 0; i < items.length; i++) {
    data.push(items[i].value);
}
```

### 3. Timezone Handling
- SFMC stores dates in Central Time (US)
- Dashboard applies +6 hour offset client-side for display
- See timezone offset code in pending contacts rendering

### 4. Single Large File
- The entire app is one ~13,000 line file
- Use search/grep to navigate efficiently
- SSJS functions: lines 228-1100
- Client-side JS: lines 5800-13000

### 5. Shared vs Local Data Extensions
- Shared DEs use `ENT.` prefix: `[ENT.DOI Generic Journey]`
- Local DEs have no prefix: `[Audience_Daily_Snapshot]`

---

## Modification History

Recent significant changes:
- **2026-02-02**: Added MyAccount tab with live data from 'My Account' DE (accounts, trades, consent status)
- **2026-02-02**: Implemented ConsentStatus mapping (Double Opt-In Verified, Single Opt-In → Opted-In; others → Not Opted-In)
- **2026-01-27**: Added DOI Pending Contacts feature (Task 7 SQL, aggregated data)
- **2026-01-27**: Added Pending DOI column to Signup Sources regional breakdown
- **2026-01-27**: Fixed conditional data loading for signups tab

---

## Quick Reference Links

- **Chart.js Docs**: https://www.chartjs.org/docs/3.9.1/
- **Bootstrap 5.3**: https://getbootstrap.com/docs/5.3/
- **SFMC WSProxy**: Search "WSProxy SFMC" for batched retrieval patterns
- **SFMC SSJS**: Platform functions via `Platform.Load("core", "1.1.1")`

---

## Support Contacts

For questions about:
- **Data Extensions / SQL**: Check `AUTOMATION_STUDIO_TASKS.md`
- **Field definitions**: Check `DATA_EXTENSION_SCHEMA.md`
- **Code patterns**: Check `QUICK_REFERENCE.md`
- **RYOBI brand specifics**: Check `ryobi/` directory
