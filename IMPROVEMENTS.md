# Dashboard Improvement Backlog — Page-Only Changes

> **STATUS: IMPLEMENTED — 7 July 2026.** All nine items are live in the Round 3 build (`@assetVersion 20260707.1`). Two deviations from this spec, both discovered during implementation: item 5 shipped as search-only because the dropdown header already provides Select All/Clear All buttons; item 9 needed only one `no-print` class because the nav bars are `<nav>` elements and the filter blocks already carry targetable classes. See `DEPLOYMENT_NOTES.md` → Round 3.

**Scope:** improvements to the CloudPage itself only. Nothing here requires new data, changes to Data Extensions, or changes to Automations. All items are implemented in `dashboard-app.js` (JavaScript Code Resource), `dashboard-styles.css` (CSS Code Resource) and/or `subscriber-growth-dashboard-new.html` (the dashboard CloudPage).

## Ground rules for the implementing agent

1. **Files you may edit:** `dashboard-app.js`, `dashboard-styles.css`, `subscriber-growth-dashboard-new.html`. Do not touch `subscriber-growth-loader.html`, any SSJS (`<script runat="server">`) block, any Data Extension, or any Automation.
2. **After editing the JS or CSS**, republish the corresponding Code Resource **and bump `@assetVersion`** in the AMPscript config block of **both** the dashboard page and the loader page (they must match), otherwise browsers keep serving the cached old files.
3. **Never derive a date key with `.toISOString()`.** Always use the existing helpers `toLocalDateKey(date)` and `parseLocalDateKey(key)` — a timezone bug caused by `.toISOString()` was fixed on 6 July 2026 and must not be reintroduced.
4. **Reuse existing helpers** rather than writing new ones: `escapeHtml()` (HTML/attribute escaping), `formatStatComparison(current, previous, periodDescription)` (delta badges), `parseDate()` (string → Date), `log()` (debug-gated logging), `updateRegionFilterLabel(context)`, `getSelectedRegions(context)`.
5. **Use `sessionStorage`, never `localStorage`**, and always wrap storage access in `try/catch` (private-browsing modes can throw).
6. New functions go at the same top-level scope as the existing functions in `dashboard-app.js` (inside the file, indented to match — the file has no module wrapper). New functions referenced from HTML `onclick`/`oninput` attributes **must** be `function name() {}` declarations, not `const` arrow functions inside other functions.
7. After every change: confirm the JS still parses (`node --check dashboard-app.js` or equivalent), then run the acceptance checks listed under the item.

## Priority order

| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | Persist global filters across tabs | High — fixes confusing behaviour | ~1–2 h |
| 2 | CSV export of filtered tables | High — most-requested reporting feature | ~1–2 h |
| 3 | "Data as of" date + 7-day delta on Overview | High — trust and insight | ~1–2 h |
| 4 | Fix double-highlighted chart grouping buttons | Visible defect, 5-minute fix | ~5 min |
| 5 | Region dropdown: search + select all / clear | Medium-high — 40 regions is unwieldy | ~1–2 h |
| 6 | Growth chart PNG download | Medium — feeds client decks | ~30 min |
| 7 | "Clear filters" action in empty-table states | Medium — recoverability | ~30 min |
| 8 | Sticky table headers | Medium — long-table readability | ~30 min |
| 9 | Print stylesheet | Low-medium — printable reports | ~1 h |

---

## 1. Persist global filters across tabs

**Why:** every tab is a separate iframe, so the "global" filter bar (Date From/To, Regions, Primary Trade) silently resets each time the user opens a different tab. A user who sets *EN-GB, last 30 days* on Overview and clicks Growth sees unfiltered data with no explanation. Persisting the state in `sessionStorage` (shared across same-origin iframes within the browser tab) makes the global bar behave the way its name promises. State dies with the browser tab, which is the right lifetime.

**Where:** `dashboard-app.js` only. Anchors: `applyGlobalFilters()` (the live filter function) and `initializeGlobalFilters()` (runs on every page load, currently calls `initializeRegionFilter('global')` then `populateGlobalTradeDropdown()`).

**How:**

Step 1 — add these two functions at top level, near `initializeGlobalFilters`:

```javascript
const GLOBAL_FILTER_STORAGE_KEY = 'mkeDashboardGlobalFilters';

// Reads the global filter controls straight from the DOM and saves them.
// Reading the DOM (rather than taking parameters) keeps this independent
// of variable names inside applyGlobalFilters.
function saveGlobalFilterState() {
    try {
        let previous = {};
        try { previous = JSON.parse(sessionStorage.getItem(GLOBAL_FILTER_STORAGE_KEY)) || {}; } catch (e) {}
        const tradeSelect = document.getElementById('global-trade');
        // The trade dropdown is only populated on tabs that load trade data
        // (Overview/Growth). On other tabs it contains just "All Trades", so
        // saving its empty value would wipe a trade chosen on Overview -
        // preserve the previously saved trade instead.
        const tradeValue = (tradeSelect && tradeSelect.options.length > 1)
            ? tradeSelect.value
            : (previous.trade || '');
        const state = {
            dateFrom: document.getElementById('global-date-from')?.value || '',
            dateTo: document.getElementById('global-date-to')?.value || '',
            regions: getSelectedRegions('global'),
            trade: tradeValue
        };
        sessionStorage.setItem(GLOBAL_FILTER_STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage unavailable - filters simply won't persist */ }
}

// Restores saved state into the controls. Returns true if anything was restored.
function restoreGlobalFilterState() {
    try {
        const raw = sessionStorage.getItem(GLOBAL_FILTER_STORAGE_KEY);
        if (!raw) return false;
        const state = JSON.parse(raw) || {};
        let restored = false;
        const fromInput = document.getElementById('global-date-from');
        const toInput = document.getElementById('global-date-to');
        if (fromInput && state.dateFrom) { fromInput.value = state.dateFrom; restored = true; }
        if (toInput && state.dateTo) { toInput.value = state.dateTo; restored = true; }
        if (Array.isArray(state.regions) && state.regions.length > 0) {
            state.regions.forEach(code => {
                const cb = document.querySelector(`.global-region-checkbox[value="${code}"]`);
                if (cb) { cb.checked = true; restored = true; }
            });
            updateRegionFilterLabel('global');
        }
        const tradeSelect = document.getElementById('global-trade');
        if (tradeSelect && state.trade) {
            const hasOption = Array.from(tradeSelect.options).some(o => o.value === state.trade);
            if (hasOption) { tradeSelect.value = state.trade; restored = true; }
        }
        return restored;
    } catch (e) { return false; }
}
```

Step 2 — make `applyGlobalFilters()` save on every run. Insert as the **first line inside** the function body:

```javascript
        function applyGlobalFilters() {
            saveGlobalFilterState();
            // ... existing body unchanged ...
```

Step 3 — restore on load. Change `initializeGlobalFilters()` to:

```javascript
        function initializeGlobalFilters() {
            // Initialize the region filter dropdown
            initializeRegionFilter('global');
            
            // Populate the trade dropdown
            populateGlobalTradeDropdown();

            // Restore any filters set on another tab this session, then apply
            // them so the initial render matches what the user last chose.
            if (restoreGlobalFilterState()) {
                applyGlobalFilters();
            }
        }
```

**Acceptance criteria:** set a date range + a region on Overview → open Growth → the filter bar shows the same values and the charts reflect them. Set a trade on Overview → open Campaigns (which has no trade data) → return to Overview → the trade is still selected. Close the browser tab, reopen the dashboard → filters are back to defaults. No console errors in a private-browsing window.

**Gotchas:** the group-header checkboxes in the region dropdown may not show ticked after a restore even when all their child regions are ticked — cosmetic only, acceptable. Do not call `applyGlobalFilters()` when nothing was restored (the `if` guard matters: it avoids a wasted duplicate render on first-ever load).

---

## 2. CSV export of the filtered Campaigns and Signups tables

**Why:** this is a reporting tool; the first thing a stakeholder asks of any table is "can I have that in Excel". Exporting exactly what's on screen (current filters **and** current sort order, all pages — not just the visible 25 rows) makes the dashboard the source rather than a screenshot factory.

**Where:** `dashboard-app.js` (helper + two export functions) and `subscriber-growth-dashboard-new.html` (two buttons).

**How:**

Step 1 — add a generic helper at top level in `dashboard-app.js`:

```javascript
// Generic CSV download. columns = [{ header: 'Send Date', value: row => row.sendDateISO }, ...]
function exportRowsToCsv(rows, columns, filenamePrefix) {
    const escapeCell = (v) => {
        const s = String(v == null ? '' : v);
        return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const lines = [columns.map(c => escapeCell(c.header)).join(',')];
    rows.forEach(row => {
        lines.push(columns.map(c => escapeCell(c.value(row))).join(','));
    });
    // \uFEFF BOM so Excel opens UTF-8 correctly; CRLF line endings for Excel.
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filenamePrefix}-${toLocalDateKey(new Date())}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
}

function exportCampaignsCsv() {
    exportRowsToCsv(filteredCampaignData, [
        { header: 'Send Date', value: r => r.sendDateISO },
        { header: 'Email Name', value: r => r.emailName },
        { header: 'Subject', value: r => r.emailSubject },
        { header: 'Region', value: r => r.region },
        { header: 'Total Sent', value: r => r.totalSent },
        { header: 'Delivery %', value: r => r.deliveryRate.toFixed(2) },
        { header: 'Open %', value: r => r.openRate.toFixed(2) },
        { header: 'Click %', value: r => r.clickRate.toFixed(2) },
        { header: 'CTOR %', value: r => r.clickToOpenRate.toFixed(2) },
        { header: 'Unsub %', value: r => r.unsubscribeRate.toFixed(2) }
    ], 'milwaukee-campaigns');
}

function exportSignupsCsv() {
    exportRowsToCsv(filteredSignupPerformanceData, [
        { header: 'Signup Identifier', value: r => r.signupIdentifier },
        { header: 'New Subscribers', value: r => r.totalNewSubscribers || 0 },
        { header: 'Sends', value: r => r.totalLifetimeSends },
        { header: 'Delivered', value: r => r.totalLifetimeDelivered },
        { header: 'Delivery %', value: r => formatPercentage(r.lifetimeAvgDeliveryRate) },
        { header: 'Open %', value: r => formatPercentage(r.lifetimeAvgOpenRate) },
        { header: 'CTR %', value: r => formatPercentage(r.lifetimeAvgCTR) },
        { header: 'CTOR %', value: r => formatPercentage(r.lifetimeAvgCTOR) },
        { header: 'Bounce %', value: r => formatPercentage(r.lifetimeAvgBounceRate) },
        { header: 'Unsub %', value: r => formatPercentage(r.lifetimeAvgUnsubscribeRate) },
        { header: 'Months Active', value: r => r.monthsActive }
    ], 'milwaukee-signup-sources');
}
```

Step 2 — buttons in `subscriber-growth-dashboard-new.html`.

Campaigns: directly **after** the `.campaign-filter-group` containing the Clear Filters button, add a sibling group:

```html
                            <div class="campaign-filter-group">
                                <label>&nbsp;</label>
                                <button class="btn btn-outline-primary" onclick="exportCampaignsCsv()">Export CSV</button>
                            </div>
```

Signups: inside `<div class="signup-filters">`, after the Min Sends `.signup-filter-group`, add:

```html
                            <div class="signup-filter-group">
                                <label>&nbsp;</label>
                                <button class="btn btn-outline-primary" onclick="exportSignupsCsv()">Export CSV</button>
                            </div>
```

**Acceptance criteria:** with filters applied and a column sorted, Export downloads a `.csv` whose row set and order match the on-screen table across all pages; a campaign name containing a comma and a double quote round-trips intact when opened in Excel; the filename ends with today's date.

**Gotchas:** export the **filtered** arrays (`filteredCampaignData`, `filteredSignupPerformanceData`), not the raw ones. Do not export the paginated slice.

---

## 3. "Data as of" date and a 7-day delta on the Overview headline

**Why:** the Overview KPI cards show bare numbers with no indication of *which day* they represent or *which way they're moving*. Both facts are already in the browser (the Overview payload carries 60 days of snapshots), and the Email tab already has the delta-badge helper and CSS — this wires the same treatment onto the headline card, turning a static number into "12,345 · as of 5 Jul 2026 · ▲ +1.2% vs 7 days ago".

**Where:** `dashboard-app.js` (`updateOverviewStats()`) and one HTML insertion.

**How:**

Step 1 — in `subscriber-growth-dashboard-new.html`, find this exact line (first stat card):

```html
                            <div class="stat-value" id="totalSubscribers">0</div>
```

and insert **immediately after it**:

```html
                            <div id="totalSubscribersComparison"></div>
                            <div class="data-as-of" id="overviewDataAsOf"></div>
```

Step 2 — add supporting CSS to `dashboard-styles.css`:

```css
        .data-as-of {
            font-size: 12px;
            color: #888;
            margin-top: 4px;
        }
```

Step 3 — add a helper at top level in `dashboard-app.js`:

```javascript
// Sums each snapshot day's total (non-GLOBAL regions) and returns the latest
// day plus the nearest day at least `daysBack` days earlier, for comparisons.
function computeSnapshotComparison(data, daysBack) {
    const totalsByKey = {};
    data.forEach(item => {
        if (!item || !item.date || item.region === 'GLOBAL') return;
        const key = toLocalDateKey(parseDate(item.date));
        if (!totalsByKey[key]) totalsByKey[key] = {};
        const region = item.region || '';
        const count = item.count || 0;
        if (!totalsByKey[key][region] || count > totalsByKey[key][region]) {
            totalsByKey[key][region] = count;
        }
    });
    const keys = Object.keys(totalsByKey).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
    if (keys.length === 0) return null;
    const sum = key => Object.values(totalsByKey[key]).reduce((s, c) => s + c, 0);
    const latestKey = keys[0];
    const targetDate = parseLocalDateKey(latestKey);
    targetDate.setDate(targetDate.getDate() - daysBack);
    const targetKey = toLocalDateKey(targetDate);
    const previousKey = keys.find(k => k <= targetKey);
    if (!previousKey) return { latestKey, latestTotal: sum(latestKey), previousKey: null };
    const daysBetween = Math.round((parseLocalDateKey(latestKey) - parseLocalDateKey(previousKey)) / 86400000);
    return { latestKey, latestTotal: sum(latestKey), previousKey, previousTotal: sum(previousKey), daysBetween };
}
```

Step 4 — inside `updateOverviewStats()`, immediately **after** the line that sets the headline number (`if (totalSubsEl) totalSubsEl.textContent = totalSubscribers.toLocaleString();`), add:

```javascript
            // "Data as of" caption + 7-day movement on the headline card
            const comparison = computeSnapshotComparison(filteredSubscriberData, 7);
            const asOfEl = document.getElementById('overviewDataAsOf');
            if (asOfEl) {
                asOfEl.textContent = comparison
                    ? 'as of ' + parseLocalDateKey(comparison.latestKey).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '';
            }
            const comparisonEl = document.getElementById('totalSubscribersComparison');
            if (comparisonEl) {
                comparisonEl.innerHTML = (comparison && comparison.previousKey)
                    ? formatStatComparison(comparison.latestTotal, comparison.previousTotal, comparison.daysBetween + ' days')
                    : '';
            }
```

**Acceptance criteria:** Overview's first card shows the as-of date matching the latest snapshot and a coloured ▲/▼ percentage versus ~7 days prior, both updating when global date filters change; when the filtered window is under 7 days, the delta badge is simply absent (no errors).

**Gotchas:** reuse `formatStatComparison` and the existing `.stat-comparison` CSS — do not write new badge markup. Use `toLocalDateKey`/`parseLocalDateKey` exactly as shown (see ground rule 3).

---

## 4. Fix the double-highlighted chart grouping buttons (quick win)

**Why:** on the Growth tab, the chart loads grouped **weekly** (`currentGrouping = 'week'` in the JS, and the HTML pre-marks the Weekly button `active`) — but the `DOMContentLoaded` handler then *also* adds `active` to the **Daily** button. The user sees two grouping buttons lit at once, and the lit "Daily" one doesn't match the chart. Clicking any grouping button fixes it, because `toggleChartGrouping()` manages the classes correctly — the defect is purely the init code.

**Where:** `dashboard-app.js`, inside the `DOMContentLoaded` handler.

**How:** delete this block (it appears verbatim in the `DOMContentLoaded` listener):

```javascript
            // Set default active button for grouping
            document.querySelectorAll('.chart-toggle').forEach(btn => {
                if (btn.textContent.toLowerCase().includes('daily')) {
                    btn.classList.add('active');
                }
            });
```

The HTML already carries the correct default `active` classes ("Line Chart" and "Weekly"), matching the JS defaults `currentChartType = 'line'` and `currentGrouping = 'week'`.

**Acceptance criteria:** load the Growth tab fresh — exactly one chart-type button (Line) and one grouping button (Weekly) are highlighted, and the highlighted grouping matches the rendered chart. Toggling still works.

**Gotchas:** delete only this block; do not touch `toggleChartGrouping`/`toggleChartType`.

---

## 5. Region dropdown: search box + Select all / Clear

**Why:** the region multi-select contains ~40 regions across collapsed groups. Finding "PL-PL" means expanding groups and scanning; selecting "everything except one region" means ~39 clicks. A type-to-filter box and Select all/Clear links make the control usable at its actual size.

**Where:** `dashboard-app.js`, `initializeRegionFilter(context)` (it builds the dropdown into the `${context}-region-groups` container) plus a little CSS.

**How:**

Step 1 — at the **end** of `initializeRegionFilter(context)` (after the `Object.keys(regionGroups).forEach(...)` loop finishes building the groups), add:

```javascript
            // --- Search + bulk-select controls (prepended above the groups) ---
            const controls = document.createElement('div');
            controls.className = 'region-filter-tools';
            controls.innerHTML = `
                <input type="text" class="region-filter-search" placeholder="Search regions..."
                       oninput="filterRegionDropdown('${context}', this.value)">
                <div class="region-filter-bulk">
                    <a href="#" onclick="setAllRegions('${context}', true); return false;">Select all</a>
                    <a href="#" onclick="setAllRegions('${context}', false); return false;">Clear</a>
                </div>`;
            container.insertBefore(controls, container.firstChild);
```

Step 2 — add the two functions at top level:

```javascript
function filterRegionDropdown(context, term) {
    const needle = (term || '').trim().toLowerCase();
    const container = document.getElementById(`${context}-region-groups`);
    if (!container) return;
    container.querySelectorAll('.region-group').forEach(group => {
        let groupHasMatch = false;
        group.querySelectorAll(`input.${context}-region-checkbox`).forEach(cb => {
            // The checkbox's wrapping div carries the visible label text
            const item = cb.closest('div');
            const matches = !needle || item.textContent.toLowerCase().includes(needle);
            item.style.display = matches ? '' : 'none';
            if (matches) groupHasMatch = true;
        });
        group.style.display = groupHasMatch ? '' : 'none';
        // While searching, expand groups so matches are visible
        const items = group.querySelector('.region-group-items');
        if (items && needle) items.classList.add('expanded');
    });
}

function setAllRegions(context, checked) {
    document.querySelectorAll(`input.${context}-region-checkbox`).forEach(cb => { cb.checked = checked; });
    document.querySelectorAll(`#${context}-region-groups .region-group-checkbox`).forEach(cb => { cb.checked = checked; });
    updateRegionFilterLabel(context);
    // Mirror the apply pattern the existing checkboxes use
    if (context === 'global') applyGlobalFiltersDebounced();
    if (context === 'campaign') filterCampaigns();
}
```

Step 3 — CSS in `dashboard-styles.css`:

```css
        .region-filter-tools {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            border-bottom: 1px solid #e8e8e8;
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 2;
        }
        .region-filter-search {
            flex: 1;
            padding: 4px 8px;
            font-size: 13px;
            border: 1px solid #ccc;
            border-radius: 4px;
        }
        .region-filter-bulk a {
            font-size: 12px;
            margin-left: 8px;
            color: #DB021D;
            text-decoration: none;
        }
```

**Acceptance criteria:** typing "PL" collapses the dropdown to matching regions with their groups auto-expanded; clearing the search restores everything; Select all ticks every region (and group headers), updates the button label to "N Regions Selected", and re-filters the data; Clear unticks everything and shows "All Regions". Works identically in both the global bar and the Campaigns tab dropdown.

**Gotchas:** before relying on `cb.closest('div')`, open `initializeRegionFilter` and confirm each region checkbox is wrapped in its own `div` (it is created as `document.createElement('div')` per region). Keep the `onclick` functions as top-level `function` declarations (ground rule 6).

---

## 6. Growth chart PNG download

**Why:** the growth chart is the artefact people paste into decks and monthly reports. Screenshots crop badly and inherit page chrome; a one-click PNG with a white background exports clean.

**Where:** `dashboard-app.js` (one function) and one button in the HTML.

**How:**

Step 1 — add at top level in `dashboard-app.js`:

```javascript
function downloadGrowthChartPng() {
    const chartCanvas = document.getElementById('growthChart');
    if (!chartCanvas || !growthChart) return;
    // Copy onto a white-filled canvas: the chart canvas itself is transparent,
    // which turns black in many image viewers.
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = chartCanvas.width;
    exportCanvas.height = chartCanvas.height;
    const ctx = exportCanvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.drawImage(chartCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = `subscriber-growth-${currentGrouping}-${toLocalDateKey(new Date())}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
}
```

Step 2 — in the HTML, inside `<div class="chart-controls">` (the Line/Bar/Daily/Weekly/Monthly button row), add as the last button:

```html
                            <button class="chart-toggle" onclick="downloadGrowthChartPng()" title="Download chart as PNG">Download PNG</button>
```

**Acceptance criteria:** clicking Download PNG saves an image matching the currently displayed chart (type, grouping, filters) on a white background, named e.g. `subscriber-growth-week-2026-07-06.png`.

**Gotchas:** confirm the chart instance variable is `growthChart` (it is the global set by `updateChart()`); if the button appears on tabs where the chart is empty, the `!growthChart` guard makes it a no-op rather than an error. Do not give the button the `active` class.

---

## 7. "Clear filters" action inside empty-table states

**Why:** when filters match nothing, the tables say "No campaigns found matching your criteria" and stop. The user's next action is always the same — loosen the filters — so put that action in the message. The Signups tab currently has no clear function at all.

**Where:** `dashboard-app.js`: the empty branches of `renderCampaignTable()` and `renderSignupPerformanceTable()`, plus one new function.

**How:**

Step 1 — in `renderCampaignTable()`, replace the empty-state line:

```javascript
tbody.innerHTML = '<tr><td colspan="10" class="campaign-no-data">No campaigns found matching your criteria</td></tr>';
```

with:

```javascript
tbody.innerHTML = '<tr><td colspan="10" class="campaign-no-data">No campaigns found matching your criteria &mdash; <a href="#" onclick="clearCampaignFilters(); return false;">clear filters</a></td></tr>';
```

Step 2 — add a signup clear function at top level (there isn't one):

```javascript
function clearSignupFilters() {
    const search = document.getElementById('signupSearchInput');
    if (search) search.value = '';
    const minSends = document.getElementById('signupMinSends');
    if (minSends) minSends.value = 0;
    filterSignupPerformance();
}
```

Step 3 — in `renderSignupPerformanceTable()`, replace:

```javascript
tbody.innerHTML = '<tr><td colspan="11" class="campaign-no-data">No signup sources match the current filters</td></tr>';
```

with:

```javascript
tbody.innerHTML = '<tr><td colspan="11" class="campaign-no-data">No signup sources match the current filters &mdash; <a href="#" onclick="clearSignupFilters(); return false;">clear filters</a></td></tr>';
```

**Acceptance criteria:** type gibberish into either search box → the empty row appears with a working "clear filters" link that restores the full table (and on Campaigns also resets dates, regions and the test-send toggle to default).

**Gotchas:** none — but keep the single-quoted JS strings with double-quoted HTML attributes exactly as shown to avoid quote clashes.

---

## 8. Sticky table headers

**Why:** the campaign and signup tables run to hundreds of rows across pages of 25/50; even one page scrolls the header off-screen, and ten columns of percentages are unreadable without it.

**Where:** `dashboard-styles.css` only. Honest constraint first: the table wrappers (`.campaign-table-container`, `.signup-table-container`) use `overflow-x: auto`, which creates a scroll container — `position: sticky` headers only stick **within a scrolling ancestor**, so the wrapper must also get a bounded height with vertical scrolling. That changes the interaction slightly (the table scrolls inside its own panel), which is the standard dashboard pattern.

**How:** add to `dashboard-styles.css`:

```css
        .campaign-table-container,
        .signup-table-container {
            max-height: 70vh;
            overflow-y: auto;
        }
        .campaign-table-container thead th,
        .signup-table-container thead th {
            position: sticky;
            top: 0;
            background: #fff;
            z-index: 3;
            box-shadow: 0 1px 0 #e8e8e8; /* keeps the header/body divider visible while stuck */
        }
```

**Acceptance criteria:** scrolling a long campaign or signup table keeps the header row pinned and legible, with sorting clicks still working on the stuck header; horizontal scrolling still works on narrow screens.

**Gotchas:** if header cells have their own background colour in the existing theme, replace `#fff` with that colour so rows don't show through. If column-resize handles behave oddly with sticky, raise `z-index` on `.resize-handle`.

---

## 9. Print stylesheet

**Why:** stakeholders print or save-to-PDF dashboard tabs for meetings. Right now that captures filter bars, buttons and truncated scroll containers. A print stylesheet turns any tab into a clean one-click report — no new features, just presentable output.

**Where:** `dashboard-styles.css` (one block) and `subscriber-growth-dashboard-new.html` (add a class to interactive containers).

**How:**

Step 1 — in the HTML, add the class `no-print` to each of these containers (find by the IDs/elements inside them): the global filter bar (the container holding `#global-date-from`), the tab navigation bar, the campaign filters block (container of `#campaignSearchInput`), the hide-test-sends row, the signup filters block (`.signup-filters`), and every `.chart-controls` div.

Step 2 — append to `dashboard-styles.css`:

```css
        @media print {
            .no-print, button, .region-filter-container, #infoBox { display: none !important; }
            body { background: #fff !important; }
            .campaign-table-container, .signup-table-container,
            .table-container, .email-table-container {
                max-height: none !important;
                overflow: visible !important;
            }
            table { font-size: 11px; }
            tr, .stat-card, .chart-section { break-inside: avoid; }
            .chart-section canvas { max-width: 100% !important; }
        }
```

**Acceptance criteria:** Ctrl+P on the Campaigns tab shows the full filtered table (all rows of the current page, no scroll clipping), no buttons or filter controls, white background; the Overview stat cards and charts don't split across page breaks.

**Gotchas:** pagination still limits printed rows to the current page — acceptable for v1; if full-table printing is requested later, temporarily raising `campaignsPerPage` before print is a follow-up, not part of this item. Canvas charts print at screen resolution; that is expected.