# 🎯 Quick Reference: Performance Optimizations

> **Applies to:** `subscriber-growth-dashboard-new.html`  
> **Last Updated:** December 2024

This guide documents the performance patterns and best practices used in the Milwaukee Subscriber Analytics Dashboard. Follow these patterns when adding new features or modifying existing code.

## For Developers Adding New Features

---

## ✅ Use These Patterns

### 1. DOM Cache (Always Use!)
```javascript
// ❌ DON'T DO THIS (slow)
document.getElementById('myElement').textContent = 'value';

// ✅ DO THIS (fast)
const el = DOM.myElement || document.getElementById('myElement');
if (el) el.textContent = 'value';
```

**When adding new elements:** Add them to the DOM cache object first!

---

### 2. Data Memoization (For Expensive Calculations)
```javascript
// ❌ DON'T DO THIS (recalculates every time)
function processData(data) {
    // 10,000+ iterations every call
    data.forEach(item => { /* expensive operation */ });
    return result;
}

// ✅ DO THIS (cache the result)
function processData(data) {
    const dataHash = getDataHash(data);
    
    // Return cached result if valid
    if (isCacheValid(dataCache.myOperation, dataHash)) {
        return dataCache.myOperation.data;
    }
    
    // Calculate result
    const result = expensiveCalculation(data);
    
    // Store in cache
    dataCache.myOperation = {
        data: result,
        timestamp: Date.now(),
        dataHash: dataHash
    };
    
    return result;
}

// Clear cache when data changes
function applyFilters() {
    clearDataCache(); // Important!
    // ... rest of filter logic
}
```

**When to use:** Any function that iterates through large datasets (>1000 items)

---

### 3. DocumentFragment for Tables
```javascript
// ❌ DON'T DO THIS (causes multiple reflows)
data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = '...';
    tbody.appendChild(row); // Slow!
});

// ✅ DO THIS (single reflow)
const fragment = document.createDocumentFragment();
data.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = '...';
    fragment.appendChild(row);
});
tbody.appendChild(fragment); // Fast!
```

---

### 4. Debounce User Input
```javascript
// ❌ DON'T DO THIS (fires too often)
input.addEventListener('keyup', function() {
    expensiveOperation();
});

// ✅ DO THIS (fires only when user stops typing)
const debouncedSearch = debounce(expensiveOperation, 300);
input.addEventListener('keyup', debouncedSearch);
```

---

### 5. Passive Event Listeners
```javascript
// ❌ DON'T DO THIS (blocks scrolling)
window.addEventListener('scroll', handleScroll);

// ✅ DO THIS (smooth scrolling)
window.addEventListener('scroll', handleScroll, { passive: true });
```

---

## 🚫 Avoid These Anti-Patterns

### ❌ Repeated DOM Queries in Loops
```javascript
// BAD
for (let i = 0; i < 1000; i++) {
    document.getElementById('container').appendChild(item);
}

// GOOD
const container = document.getElementById('container');
const fragment = document.createDocumentFragment();
for (let i = 0; i < 1000; i++) {
    fragment.appendChild(item);
}
container.appendChild(fragment);
```

---

### ❌ Processing Data Without Caching
```javascript
// BAD - recalculates on every filter change
function updateDisplay() {
    const latest = getLatestSnapshot(data); // Expensive!
    const grouped = groupByCountry(latest); // Expensive!
    render(grouped);
}

// GOOD - uses memoization
function updateDisplay() {
    const latest = getLatestSnapshot(data, 'subscriber'); // Cached!
    const grouped = groupDataByCountry(latest); // Cached!
    render(grouped);
}
// Cache automatically invalidates when data changes
```

---

### ❌ String Concatenation in Loops
```javascript
// BAD
let html = '';
data.forEach(item => {
    html += '<tr>' + item.name + '</tr>'; // Creates new string each time
});
tbody.innerHTML = html;

// GOOD
const rows = data.map(item => `<tr>${item.name}</tr>`);
tbody.innerHTML = rows.join(''); // Single concatenation
```

---

### ❌ Inline Styles in JavaScript
```javascript
// BAD
element.style.color = 'red';
element.style.fontSize = '16px';
element.style.fontWeight = 'bold';

// GOOD
element.classList.add('error-state'); // Use CSS class
```

---

## 📦 Available Utilities

### Debounce Function
```javascript
const debouncedFunc = debounce(yourFunction, delayMs);
```
**Use for:** Search inputs, resize events, scroll events

### Throttle Function
```javascript
const throttledFunc = throttle(yourFunction, limitMs);
```
**Use for:** Continuous events that need regular updates

### Data Hash Function
```javascript
const hash = getDataHash(dataArray);
```
**Use for:** Creating cache keys for memoization

### Cache Validation
```javascript
if (isCacheValid(dataCache.myKey, currentHash)) {
    return dataCache.myKey.data;
}
```
**Use for:** Checking if cached data is still valid

### Clear Cache
```javascript
clearDataCache();
```
**Use when:** Filters change, view changes, or data refreshes

---

## 🎨 DOM Cache Elements Available

```javascript
DOM.subscriberTableBody
DOM.tradeTableBody
DOM.emailTableBody
DOM.campaignTableBody
DOM.cultureEmailTableBody
DOM.cultureSubscriberTableBody
DOM.cultureTradeTableBody
DOM.cultureCampaignTableBody

DOM.totalSubscribers
DOM.totalRegions
DOM.totalTrades
DOM.avgSubscribers

DOM.combinedView
DOM.cultureView

DOM.sidebarNav
DOM.sidebarMenu
DOM.sidebarCultureSelect

// ... and more!
```

**Adding new cached elements:**
1. Add to DOM object definition
2. Add to initializeDOMCache() function
3. Use throughout your code

---

## 🧪 Before Committing

### Checklist:
- [ ] Used DOM cache for all element access?
- [ ] Used DocumentFragment for table/list rendering?
- [ ] Added debouncing to input events?
- [ ] Avoided inline styles?
- [ ] Tested on actual data?
- [ ] Checked console for errors?
- [ ] Added `// (PERFORMANCE OPTIMIZATION)` comment?

---

## 📊 Performance Targets

- **Table render:** < 200ms for 100 rows
- **Filter update:** < 150ms
- **Scroll FPS:** 60fps maintained
- **DOM queries:** < 5 per render
- **Reflows:** 1 per render cycle

---

## 🆘 Troubleshooting

**Problem:** Table not rendering  
**Check:** Is tbody in DOM cache? Did you clear it first?

**Problem:** Events not firing  
**Check:** Did you attach events before adding to fragment?

**Problem:** Scroll is janky  
**Check:** Is your scroll handler debounced? Using passive flag?

**Problem:** Performance worse  
**Check:** Are you querying DOM inside loops?

---

## 💡 Pro Tips

1. **Cache early, use often** - Get element reference once, use many times
2. **Batch DOM updates** - Build in memory, insert once
3. **Measure performance** - Use Chrome DevTools Performance tab
4. **Profile before optimizing** - Find the actual bottleneck first
5. **Test with real data** - 10 rows vs 10,000 rows = different story

---

## 📚 Learn More

- **PERFORMANCE_OPTIMIZATIONS.md** - Full technical documentation
- **OPTIMIZATION_SUMMARY.md** - Executive summary
- **DATA_EXTENSION_SCHEMA.md** - All Data Extension schemas
- **AUTOMATION_STUDIO_TASKS.md** - SQL Query Activities for automation
- Search code for `// (PERFORMANCE OPTIMIZATION)` to see examples

---

## 🔄 Feature: DOI Pending Contacts (January 2026)

The Overview tab now includes a "Pending DOI Confirmations" section that shows:
- Total contacts awaiting Double Opt-In confirmation
- Breakdown by journey type (Generic vs PEM)
- Regional breakdown with pending counts
- Oldest and newest pending dates per region

**Data Flow:**
1. Automation runs daily SQL query on shared DEs (`DOI Generic Journey`, `DOI PEM Journey`)
2. Aggregated data stored in `DOI_Pending_Contacts_Aggregated` DE
3. CloudPage reads from aggregated DE (read-only, no request limits)

**Key Files:**
- **DATA_EXTENSION_SCHEMA.md** - Section B.6 for DE schema
- **AUTOMATION_STUDIO_TASKS.md** - Task 7 for SQL query

**Filter Criteria:**
- `OptinStatus = 'Double Opt-In Pending'`
- `IsLatest = 'True'`
- `TokenDate` within last 3 days (confirmation link validity)

---

## 🔄 Feature: MyAccount Analytics (February 2026)

The MyAccount tab displays registration analytics from the 'My Account' Data Extension:

**Key Metrics:**
- Total Accounts vs Unique Contacts (by ContactId)
- Marketing Opt-In / Not Opted-In counts and percentages
- Active Regions count
- Trade Categories breakdown

**Data Processing:**
- Raw records are aggregated client-side into statistics
- ConsentStatus is mapped to opted-in/not opted-in categories
- PrimaryTrade normalizes blank/invalid values to "Not Specified"
- ContactId used to identify unique users across multiple regions

**ConsentStatus Mapping:**
```javascript
// Opted-In statuses:
'Double Opt-In Verified' -> Opted-In
'Single Opt-In' -> Opted-In

// Not Opted-In statuses:
'Not Opted-In' -> Not Opted-In
'Withdrawn' -> Not Opted-In
(any other value) -> Not Opted-In
```

**Key Functions:**
- `retrieveMyAccountData()` - SSJS function to retrieve DE records (read-only)
- `processMyAccountData()` - Client-side aggregation of raw records
- `isOptedIn()` - Helper to check consent status
- `normalizeTradeForDisplay()` - Normalizes blank/invalid trade values

**Data Source:**
- **DE Name:** `My Account` (local DE, no ENT. prefix)
- **Primary Key:** Id
- **Key Fields:** ContactId (for unique users), UserCulture, ConsentStatus, PrimaryTrade

---

**Remember:** Premature optimization is the root of all evil, but these patterns are proven winners! 🏆

*Last Updated: 2 February 2026*
