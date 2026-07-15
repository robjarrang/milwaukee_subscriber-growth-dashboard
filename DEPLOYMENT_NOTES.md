# Deployment Notes — Dashboard Performance & Security Update

**Date:** 6 July 2026
**Files in this package:**

| File | What it is |
|---|---|
| `subscriber-growth-dashboard-new.html` | Updated dashboard CloudPage (SSJS + markup only — CSS/JS extracted) |
| `subscriber-growth-loader.html` | Updated loader CloudPage |
| `dashboard-styles.css` | New **CSS Code Resource** content |
| `dashboard-app.js` | New **JavaScript Code Resource** content |

---

## What changed (mapped to the review)

| Ref | Change | Functional impact |
|---|---|---|
| S1 | Encryption IV/salt/password replaced with freshly generated random values (both pages, matching) | Live sessions invalidate at deploy — users simply re-authenticate once |
| S2 | Comment flag on the client secret — **rotate it in the Installed Package** (old value was shared in plain text) | None until you rotate; then update both pages |
| S3 | `safeScriptJSON()`/`safeScriptString()` guard every injected data `Write()` — a campaign name containing `</script>` can no longer break the page; string values now serialised via `Stringify()` (quotes **and** backslashes escaped) | None |
| P1 | ~107 KB inline CSS and ~390 KB inline JS extracted to two Code Resources, referenced with `?v=%%=v(@assetVersion)=%%`; loader preloads them | None — cached across all tab iframes |
| P2 | Dead culture-view subsystem deleted: 21 unreachable functions (~45 KB), the 183-line `cultureView` HTML block, 32 orphaned CSS rules, dead globals and DOM-cache entries. Verified: every removed identifier has zero remaining references; every `on*` handler in the HTML resolves; CSS rule-inventory diff shows only culture rules removed | None — the code was unreachable (`showViewConsolidated` had no callers; `sidebarCultureSelect` didn't exist in the DOM) |
| P3 | `bootstrap.bundle.min.js` removed from the dashboard and from the loader's preloads (its only consumers were inside the deleted culture view). Bootstrap **CSS** is retained | None |
| P4 | Snapshot lookback is now per-tab: **Overview defaults to 60 days**, Growth keeps 200. `?snapshotDays=N` override unchanged. Unused columns pruned from the snapshot retrievals (`TotalWithL1Trade`, `TotalWithL2Trade`, `TotalWithNoTrade`, `InsertedDate`) | **One visible change:** Overview's date filter now reaches back 60 days instead of 200 — worth a nod from Milwaukee. Growth is unaffected |
| C1 | Search inputs (campaigns, signups) debounced at 250 ms via the existing `debounce()` utility | Filtering fires on typing pause instead of every keystroke |
| C2 | Campaign send dates parsed once at load (`sendDateISO`) instead of per row per filter/render | None |
| C3 | 27 `console.log` calls gated behind `?debug`; `console.warn`/`console.error` untouched | Console is quiet unless `?debug` is on the URL |
| J1 | `retrieveRegionalMonthlyMetrics`, `retrieveSignupPerformanceData`, `retrieveDOIPendingContacts` rewritten WSProxy-first with batching (removing the `LookupRows` 2,000-row silent-truncation risk and the double DE-name probe on the Email tab) | Email tab no longer at risk of quietly dropping the oldest months as history grows |
| J2 | Signup snapshot-date discovery now reads a one-row **local** `Dashboard_Config` DE first (your BU — the Shared DE is only ever read, never modified), then runs a single freshness probe; **falls back to the existing probe** if the DE/row doesn't exist, so it's safe to deploy before — or without — the automation change | None until Task 10 lands; then up to 14 lookup calls collapse to 2 |
| J3 | Shared `mapRow()` + `wsProxyRetrieveAll()` helpers added; used by the three rewritten functions | None |

Incidental fix: a pre-existing broken CSS fragment (`opacity: 0.9; }` orphaned at original lines 3138–3139) was removed — browsers were already ignoring it.

## Size impact

| | Before | After |
|---|---|---|
| Dashboard CloudPage source | 648,792 B | 130,056 B |
| Approx. HTML served per tab (excl. injected JSON) | ~560 KB | ~58 KB |
| Static CSS+JS per additional tab | re-downloaded every tab (~500 KB) | browser cache (0 B) |
| Overview inline JSON | ~1.5 MB (200 days) | ~450 KB (60 days) + ~45% smaller rows |

---

## Deploy order (matters!)

1. **Create the two Code Resources** (CloudPages → Create Resource):
   - Type **CSS**, suggested URL key `dashboard-styles` → paste `dashboard-styles.css`, publish.
   - Type **JavaScript**, suggested URL key `dashboard-app` → paste `dashboard-app.js`, publish.
   - If SFMC assigns different URLs than `https://cloud.mail.milwaukeetool.eu/dashboard-styles` / `/dashboard-app`, update the `<link>`/`<script src>` tags in the dashboard page and the two `<link rel="preload">` tags in the loader to match.
2. **Rotate the Installed Package client secret** (Setup → Installed Packages), then paste the new value into `@clientsecret` on **both** pages.
3. **Publish the dashboard page**, then **the loader**. The new encryption keys must ship on both together (they already match in this package). Anyone mid-session will be bounced to SSO once — expected.
4. **Verify** using the checklist below.
5. *(Any time after, and entirely optional)* **Task 10** below to activate the J2 fast path — it lives wholly in your BU, and the page works fine without it.

On every future CSS/JS deploy: update the Code Resource content **and bump `@assetVersion` on both pages** (e.g. `20260713.1`) so browsers fetch the new files.

---

## Task 10 — Dashboard_Config aggregation (activates J2's fast path)

**Ownership, to be explicit:** everything in this task lives in **your own BU**. The Shared DE `SignupIdentifier_Performance_Milwaukee` is only ever **read** — no fields are added or changed on it, and the parent BU's pipeline is untouched. `SignupIdPerf_LatestSnapshot` is not a field or a DE: it's simply the `ConfigKey` value of the one row your automation writes into the new local `Dashboard_Config` DE.

**Task 10 is optional.** The dashboard already works without it — the page falls back to the existing probe when the config row is absent. What it buys you: the Signups tab's snapshot-date discovery drops from up to 14 lookup calls (worst case, when `LookupOrderedRows` misbehaves on the Shared DE) to 1 config lookup + 1 freshness probe.

**New local Data Extension** `Dashboard_Config` (your BU, standard folder):

| Field | Type | Length | PK | Nullable |
|---|---|---|---|---|
| ConfigKey | Text | 100 | ✓ | No |
| ConfigValue | Text | 500 | No | Yes |
| UpdatedDate | Date (default `GETDATE()`) | — | No | Yes |

**SQL Query Activity** (target: `Dashboard_Config`, data action: **Update**). Ordering by the `SnapshotDate` Date PK and taking the matching text value — rather than `MAX()` on the text field — means correctness doesn't depend on the text format being lexicographically sortable. This mirrors exactly what the page's `LookupOrderedRows` probe does (`SnapshotDate DESC`, read `SnapshotDate_as_text`):

```sql
SELECT TOP 1
    'SignupIdPerf_LatestSnapshot' AS ConfigKey,
    SnapshotDate_as_text          AS ConfigValue,
    GETDATE()                     AS UpdatedDate
FROM [SignupIdentifier_Performance_Milwaukee]
ORDER BY SnapshotDate DESC
```

**Where to schedule it:** append as a final step to one of **your** existing daily automations (`MYACCOUNT_DASHBOARD_AGGREGATION_DAILY` is a natural fit) or a small new one. Timing is deliberately non-critical: the page performs a one-row freshness probe after reading the config, so if the parent BU refreshes the Shared DE after your automation has run, the page still picks up the newer snapshot immediately. Worst case (probe unavailable *and* config stale) the tab shows the previous snapshot until your next run — never an error.

**Contingencies:**

- *Query Activity won't validate against the Shared DE from this BU* (sharing rights can permit AMPscript lookups but not SQL — reference it by name in SQL; the `ENT.` prefix is an AMPscript/SSJS convention, not SQL): swap the Query Activity for an **SSJS Script Activity** doing the same discovery the page's probe does, off-page where execution limits are roomier:

```javascript
<script runat="server">
Platform.Load("Core", "1.1.1");
var probeCultures = ["EN-GB", "DE-DE", "FR-FR", "ES-ES", "IT-IT", "PL-PL", "EN-AU"];
var latest = "";
for (var p = 0; latest === "" && p < probeCultures.length; p++) {
    try {
        var rows = Platform.Function.LookupOrderedRows(
            "ENT.SignupIdentifier_Performance_Milwaukee", 1, "SnapshotDate DESC",
            "UserCulture", probeCultures[p]);
        if (rows && rows.length > 0) latest = rows[0].SnapshotDate_as_text || "";
    } catch (e) { /* try next culture */ }
}
if (latest !== "") {
    Platform.Function.UpsertData("Dashboard_Config",
        ["ConfigKey"], ["SignupIdPerf_LatestSnapshot"],
        ["ConfigValue", "UpdatedDate"], [latest, Platform.Function.Now()]);
}
</script>
```

- *Neither is practical*: skip Task 10 entirely. The page's probe path continues exactly as before — J2 degrades gracefully to the pre-existing behaviour.

---

## Testing checklist

Work through with `?debug` on the URL to see the gated logging and `debugInfo` output.

1. **Auth**: open the loader URL fresh (incognito) → SSO round-trip → dashboard loads. Confirm the URL is cleaned of `?code=`.
2. **Overview**: KPI cards populate; snapshot charts render; DOI pending section renders; date filter works within its (new) 60-day window; `?snapshotDays=200` still widens it.
3. **Growth**: 200-day trend charts render; grouping toggles (day/week/month) work.
4. **Email**: monthly metrics table/chart render; `debugInfo` shows `Regional_Metrics via WSProxy: N records` (J1a path).
5. **Campaigns**: table paginates; typing in search only filters after a pause (C1); date filters behave; `[Test]`/single-recipient hiding works.
6. **Signups**: table + charts render; `debugInfo` shows the probe path, or (post-Task 10) `SignupIdPerf config: latestDate=…` plus, if the parent BU refreshed since your automation ran, `freshness probe superseded config`; click through to a signup-detail sub-page and back.
7. **MyAccount**: summary cards, region and trade breakdowns render; culture filter works.
8. **Tab caching**: revisit a previously opened tab → instant switch, no skeleton; Network tab shows `dashboard-styles`/`dashboard-app` served from cache on second and later tabs.
9. **Console**: quiet without `?debug`; chatty with it.

## Rollback

The original files are untouched in source control / the previous CloudPage versions. Republishing the previous dashboard + loader versions fully reverts (the Code Resources can simply be left in place, unreferenced). Note the old pages carry the old encryption keys, so a rollback also restores the S1 vulnerability — treat as temporary only.

## Docs to update when convenient

`QUICK_REFERENCE.md` still lists the removed `DOM.culture*` cache entries and describes debounce as already wired; `DATA_EXTENSION_SCHEMA.md` gains the `Dashboard_Config` DE; `AUTOMATION_STUDIO_TASKS.md` gains Task 10 (SQL above).

---

## Round 2 — UX bug fixes (6 July 2026)

Systematic sweep of charts, tables, search and filters. Ordered by impact; all fixes live in `dashboard-app.js` only, so redeploying the **JavaScript Code Resource** (and bumping `@assetVersion` on both pages) ships the lot.

**B1 — Timezone shift in every date key (charts, bucketing, month presets).** `parseDate()` deliberately builds *local* midnight, but thirteen call sites then derived keys via `.toISOString().split('T')[0]`, which converts to *UTC*. For any user east of UTC — the entire EMEA audience during BST/CEST, i.e. right now — every daily chart label was one day early, 1st-of-month data points were bucketed into the previous month, Monday data fell into the previous week, and the Email tab's "Current month" preset set From = last day of the *previous* month while cutting off the month's final day. Fixed with `toLocalDateKey()`/`parseLocalDateKey()` helpers across all sites, including the email period presets and the campaign 30-day default range. Verified by unit test under `TZ=Europe/London`, `TZ=America/Chicago` and `TZ=UTC` (the London run reproduces the old off-by-one before the fix).

**B2 — Campaigns "Clear Filters" button threw and did nothing.** It assigned to `#campaignRegionFilter`, an element that no longer exists (replaced by the checkbox multi-select), so a TypeError stopped execution after clearing the search box: dates stayed applied, regions stayed ticked, and the table never re-filtered. Now clears the multi-select (and its label/badge), the date inputs, restores the Hide-test-sends default (checked) and re-runs the filter.

**B3 — Duplicate `getMetricClass` definitions collided.** The campaign version (percentage-point thresholds, `campaign-metric-*` classes) was silently overridden by the later signup version (fraction thresholds, `signup-metric-*` classes), so every campaign metric cell carried the wrong class family and lost its `.campaign-metric` base styling year-round. Renamed to `getCampaignMetricClass` / `getSignupMetricClass` with call sites updated.

**B4 — Snapshot rows were never region-sorted.** In `getLatestSnapshot`, the sort sat *after* a duplicate `return` and was unreachable; results (and the cache) now sort alphabetically by region before returning.

**B5 — Double quotes in campaign names/subjects broke `title="…"` attributes.** `escapeHtml()` now also encodes `"` as `&quot;`; single quotes are deliberately untouched so the signup detail link's existing onclick escaping keeps working.

**B6 — Latent ReferenceError in legacy filter removed.** The dead `applyOverviewFilters()` referenced an undefined `region` variable in its empty-results branch; the whole unreachable function is gone.

**B7 — Zero-count days vanished from charts.** Truthiness checks (`item.count`) dropped rows where a count was legitimately `0`, which could remove whole dates from the x-axis under a trade filter; now `item.count != null`.

**B8 — Pending-contacts "Last updated" hardened.** The hard-coded +6h server-clock adjustment is now skipped when the timestamp carries an explicit offset/Z, so a zoned string can't be double-shifted.

**B9 — Empty campaign table read "Showing 1-0 of 0".** Now shows 0-0.

Also inspected and found sound: filter functions reset pagination correctly; campaign/signup sorting and page-change clamping; the region multi-select and its outside-click close; no duplicate element IDs across tab panes; the chart event-annotation index mapping (consistent once keys went local); email period buttons' null-target guard; `sendFactLookbackDate` format vs input comparisons; and the campaign date filter's string comparisons (timezone-free by design after the `sendDateISO` change).

---

## Round 3 — UX improvements implemented (7 July 2026)

All nine items from `IMPROVEMENTS.md` are now implemented. Changes touch `dashboard-app.js`, `dashboard-styles.css` and the dashboard page; the loader is unchanged apart from the `@assetVersion` bump. **Deploy:** republish both Code Resources, then both pages (`@assetVersion` is now `20260707.1` on each).

1. **Global filters persist across tabs** — saved to `sessionStorage` on every `applyGlobalFilters()` and restored at the end of `initializeGlobalFilters()`. The trade value is preserved when saving from tabs whose trade dropdown is unpopulated. Verified with a stubbed-DOM harness: save, cross-tab preservation, restore, and the empty-storage path.
2. **CSV export** — `Export CSV` buttons on the Campaigns and Signups tabs export the *filtered, sorted* datasets (all pages) with Excel-safe quoting, a UTF-8 BOM and CRLF endings; filenames are date-stamped. Escaping verified in the harness (commas, doubled quotes, embedded newlines).
3. **Overview headline context** — the Total Subscribers card now shows "as of <date>" plus a coloured delta versus ~7 days earlier, reusing `formatStatComparison` and the existing `.stat-comparison` styling. The comparison helper skips gaps correctly and returns no badge when the filtered window is shorter than 7 days (harness-tested under BST, CDT and UTC).
4. **Double-highlighted grouping buttons fixed** — the init block that force-activated "Daily" is deleted; the HTML's default `active` classes (Line + Weekly) match the JS defaults.
5. **Region dropdown search** — a sticky type-to-filter box now sits above the region groups in both the global and campaign dropdowns; matching groups auto-expand while searching. *Amendment to the spec:* the planned Select all/Clear links were **not** added — the dropdown header already provides Select All/Clear All buttons (`selectAllRegions`/`clearAllRegions`, which also handle indeterminate group states), so duplicating them would have cluttered the control.
6. **Growth chart PNG download** — a `Download PNG` button in the chart controls exports the current chart onto a white background, filename stamped with grouping and date.
7. **Empty-state recovery** — both tables' "no results" rows now include a working *clear filters* link; a new `clearSignupFilters()` resets the signup search and min-sends controls.
8. **Sticky table headers** — the campaign and signup table wrappers are capped at `70vh` with vertical scrolling so the Milwaukee-grey header rows pin while scrolling. Print CSS removes the cap so nothing is clipped on paper.
9. **Print stylesheet** — *simplification to the spec:* both the navbar and tab bar are `<nav>` elements and the filter blocks already carry classes (`.global-filters`, `.campaign-filters`, `.signup-filters`), so printing is handled almost entirely by CSS selectors; only the test-sends toggle row needed a `no-print` class. Print output hides all interactive chrome, unclips tables, and keeps stat cards/charts from splitting across pages.

**Post-deploy checks:** set filters on Overview → open Growth (filters persist); Campaigns → Export CSV with a filter and sort applied → open in Excel; Overview headline shows the as-of date and a delta badge; Growth tab loads with exactly one grouping button lit; type in the region dropdown search; download the growth chart PNG; empty a table via search and use the clear-filters link; scroll a long table (header pins); Ctrl+P on Campaigns.

---

## Round 4 — Campaigns filter consolidation (7 July 2026)

**Finding:** the Campaigns tab carried its own date range and region multi-select alongside the global filter bar — and the bar's date/region settings had *no effect* on the campaigns table at all. The bridging variable (`campaignDataAfterGlobalFilters`) was declared and read but never populated by `applyGlobalFilters()`, so the black bar sat above the table implying control it didn't have, while the tab-local set did the actual filtering. Had the bridge been wired, the two sets would have compounded (two intersecting date ranges) — confusing either way.

**Change:** the global filter bar is now the single source of date and region filtering for campaigns. `filterCampaigns()` reads `global-date-from`/`global-date-to` and `getSelectedRegions('global')` directly; the tab keeps only its genuinely campaign-specific controls — the search box and the hide-test-sends toggle (renamed button: "Clear Search"). The duplicate region dropdown and date inputs are removed from the markup, along with the vestigial bridge variable, the dead legacy `#campaignRegionFilter` population block, and the `initializeRegionFilter('campaign')` call. A muted hint ("Dates & regions are set in the filter bar above") marks where the old controls were, and the lookback warning banner now names the global *Date From* control.

**New: global Reset button.** With the bar carrying real weight, it needed a one-click reset — previously there was no way to clear it. `resetGlobalFilters()` clears the persisted sessionStorage state first (so the cross-tab trade-preservation rule can't resurrect an old trade), empties both dates and the trade select, then reuses `clearAllRegions('global')`, which updates the label and auto-applies.

**Behavioural changes to flag to Milwaukee:**
1. The campaigns table no longer defaults to a 30-day view — it shows the full loaded window (`?campaignDays`, default 90 days) unless the global dates narrow it. Pagination absorbs the extra rows.
2. Global date/region filters now genuinely filter the campaigns table (they previously did nothing there), and via Round 3's persistence they follow the user across tabs.

**Verification:** zero leftover references to the removed controls (the two remaining name matches are explanatory comments); all handlers resolve; no duplicate functions; syntax clean; and a stubbed-DOM harness runs the real rewired `filterCampaigns()` end-to-end — search + global region + global dates + test-toggle intersecting to the correct row, page reset, and the empty-filter case.

**Post-deploy checks:** set global dates/region on Overview → open Campaigns (table reflects them); search within that subset; Clear Search restores the subset, not the whole table; Reset in the bar clears everything on every tab; the lookback banner appears when global Date From predates the loaded window.

---

## Round 5 — Stale-tab filter resurrection fix (7 July 2026)

**Reported:** set filters → switch tab → Reset → return to a previously visited tab → the old filters reappear.

**Cause:** previously visited tabs are live iframes held in the loader's pool. Their filter controls sat frozen with the old values — nothing told them a sibling iframe had changed the shared sessionStorage state — and any interaction on the stale tab re-ran `applyGlobalFilters()`, which saved those stale DOM values straight back over the user's reset.

**Fix:** cross-iframe synchronisation via the browser's `storage` event, which fires in every same-origin context *except* the one that made the change — so hidden pool iframes reconcile the instant a sibling saves or resets. `handleGlobalFilterStorageEvent()` parses the new state (a removed key or malformed value counts as a reset), runs the new `syncGlobalFilterControls()` — a full reconcile that also *unticks* regions no longer in the state and recomputes group-header checked/indeterminate states — then re-applies with a new `skipSave` flag on `applyGlobalFilters()` so frames can't echo events at each other (identical `setItem` writes also fire no event, a second guard). `restoreGlobalFilterState()` was refactored onto the same reconciler, which incidentally fixes Round 3's noted cosmetic limitation: group-header checkboxes now reflect restored selections at init.

**Verification:** sixteen harness assertions against the real extracted functions, including the reported scenario step by step — save on tab A, reset event from tab B, stale date/region/trade/group all cleared, re-apply with `skipSave=true`, and a subsequent save from tab A writing clean state (no resurrection). Update propagation, irrelevant-key and malformed-JSON robustness, and the restore paths are also covered. Structural checks clean; `@assetVersion` is `20260707.3`.

**Post-deploy checks:** set filters on Overview → open Growth → Reset → return to Overview (controls clear, data unfiltered); change a filter on Growth → return to Overview (controls match); after returning to a synced tab, confirm charts are sized correctly (they re-render while the iframe is hidden; Chart.js's responsive resize should handle it — flag if not).

---

## Round 6 — Loader & skeleton UX (7 July 2026)

Loader-only changes (`subscriber-growth-loader.html`); the dashboard page and Code Resources are untouched, so **no `@assetVersion` bump is needed** — just republish the loader CloudPage. The existing loader was already strong (content-shaped skeleton, per-switch skeletons with synced tab indicators, 45s timeout with retry, `history.replaceState` URL tracking), so this round targets the genuine gaps:

1. **Idle prefetch of likely-next tabs.** After the initial tab loads and the browser is idle, the loader quietly fetches the tabs in `PREFETCH_TABS` (default `['growth', 'campaigns']`) one at a time — serialised, so at most one extra server-side render is in flight, each spaced by 500ms. A prefetched tab's first visit is instant instead of a 2–6s skeleton. **Trade-off to monitor:** up to two extra SSJS renders per session; set `PREFETCH_TABS = []` to disable, or reorder to match real usage.
2. **Pool-registration fix (latent bug).** `attachLoadHandler` only registered a frame into the cache when it was the currently awaited tab — prefetched frames would have been orphaned and duplicated on later switches. Frames now always register on load.
3. **Prefetch adoption.** Switching to a tab whose prefetch is still in flight adopts the existing iframe (skeleton shows until its load event) rather than creating a duplicate; the `tabReload` path evicts in-flight frames too.
4. **LRU pool cap (`MAX_POOL = 5`).** Registering a frame beyond the cap evicts the least-recently-viewed hidden tab (never the active or pending one), bounding memory across long sessions. Decision logic covered by a three-case harness.
5. **"Loading <tab>…" label** in the skeleton, set for the initial load and every switch/reload, hidden in the error state and restored on retry.
6. **Session-expiry warning.** A dismissible banner appears 5 minutes before the 1-hour session key lapses (`SESSION_TTL_MS` mirrors the AMPscript `DateAdd(Now(), 1, "H")` — keep them in step if the TTL ever changes), telling the user the next tab they open will sign them back in.
7. **`prefers-reduced-motion` support:** skeleton pulse, progress bar and fades are disabled for users with that preference set.

**Verification:** the main IIFE parses cleanly; zero un-labelled `showSkeleton()` calls remain; AMPscript block balance unchanged (27/27); LRU decision harness passes (evicts least-recently-viewed, never active/pending, treats missing timestamps as oldest).

**Post-deploy checks:** load the dashboard, wait a few seconds idle, then click Growth — it should appear instantly (prefetched) with correctly sized charts; click Campaigns mid-load of another tab and confirm no duplicate frames (DevTools: one iframe per `data-tab`); leave the dashboard open 55 minutes and confirm the banner appears and dismisses; enable reduced motion in the OS and confirm the skeleton is static.

---

## Round 6 — Loader/skeleton UX audit and improvements (7 July 2026)

**Audit finding first:** the loader was already in strong shape — LRU iframe-pool eviction (`MAX_POOL = 5`), serialised idle prefetch of Growth and Campaigns, per-tab skeletons with named "Loading Growth Trends…" labels, a 45-second load watchdog with retry, `prefers-reduced-motion` handling on the shimmer, and URL/history sync all existed. Five genuine gaps were found and closed (one of them an outright bug):

1. **Graceful session-expiry handling.** Previously, opening a not-yet-cached tab after the 1-hour key lapsed created a doomed iframe whose buster yanked the whole window to sign-in with the tab context lost. Now `sessionExpired()` (treated 60 s early to cover clock skew and in-flight requests) guards all three fresh-load paths (`tabReload`, `signup-detail`, first-visit); instead of the doomed iframe, `refreshSession(tab)` performs a clean top-level navigation to the loader with `?tab=` preserved (stripping any stale `code`/`source` params), so SSO runs and the user lands back on the tab they wanted. Cached tabs remain usable after expiry (no server call needed), and an adopted in-flight prefetch is left alone (its request began pre-expiry). The 55-minute warning banner gains a **Sign back in now** button and truthful copy.
2. **Chart-resize nudge on cached-tab re-show — closes Round 5's caveat.** `showCachedTab()` now posts `{ type: 'tabShown' }` into the re-shown iframe; the dashboard listens (with an origin check) and dispatches a window `resize`, so charts re-rendered while hidden by the cross-tab filter sync recalculate their dimensions the moment the tab is visible.
3. **Retry-path bug fixed.** A frame that never fired its load event was never registered in `loadedTabs`, so `retryLoad()` missed it and reloaded the *initial* frame instead — with `pendingTab` still pointing at the failed tab, the skeleton could never dismiss and the error simply recurred. Retry now targets the failed frame via `frameForTab()`, which finds loading frames too.
4. **Window title reflects the active tab** ("Growth Trends – Milwaukee Subscriber Dashboard") for history entries, bookmarks and multi-window use.
5. **postMessage hardening.** The dashboard's three `tabSwitch` posts now target `window.location.origin` instead of `'*'`, and the new `tabShown` listener checks `e.origin`.

**Verification:** every loader script block parses (the 437-line main IIFE included); eight harness assertions cover the session helpers — the 60-second early-expiry boundary, tab preservation, spent-`code`/`source` stripping, path stability, and the banner's no-argument fallback to the active tab. Dashboard checks clean; zero `'*'` message targets remain. `@assetVersion` is `20260707.4` — republish the JS Code Resource and both pages (the loader itself changed this round).

**Post-deploy checks:** leave the dashboard idle ~55 min → banner appears; **Sign back in now** returns to the same tab after SSO; after 1 h, clicking an unvisited tab re-authenticates and lands on that tab (no jarring bust); change filters on one tab, return to a cached tab → charts correctly sized; kill the connection and open a new tab → error state → Retry reloads *that* tab; browser title follows the active tab.

---

## Round 7 — Skeleton and tab-reveal rework (7 July 2026)

**Reported:** loading feels clunky — skeleton animations apparently gone, and each tab shows a flash of a mis-shapen table before the correct content appears.

**Root cause, honestly:** pooled and prefetched iframes were hidden with `display:none`, which gives them **zero dimensions** — so charts and layout rendered inside them (prefetch loads, and Round 5's cross-tab filter re-renders) were built at 0×0 and visibly snapped into shape at the instant the tab was swapped in. Two of this week's changes amplified a latent issue: Round 5 made hidden re-renders routine, and the Round 1 Code Resource extraction made iframe `load` fire much earlier (fewer bytes), letting the reveal race the dashboard's internal 100 ms chart-init timers on first loads too. The "skeleton removed" perception has two parts: prefetch means Growth/Campaigns now swap in instantly with no skeleton *by design* (previously janky, now correct), and under OS **Reduce Motion** the old CSS set `animation: none` on both the shimmer and the progress bar — a completely static grey page, indistinguishable from a hang. *(Worth checking whether Reduce Motion is enabled on the machine that felt broken.)*

**Fixes (skeleton best practice applied):**
1. **Visibility-stacked frames.** Pooled iframes are now absolutely stacked and hidden with `visibility: hidden` instead of `display: none`, so hidden frames keep full layout and every background render is pixel-correct before it's shown. Cached/prefetched swaps are instant *and* correct — the flash is gone at the root.
2. **Content-driven reveal.** The dashboard posts `tabReady` once its initial render settles (180 ms after init, clearing the internal chart timers); the loader reveals on that signal rather than the raw iframe `load` event, with a 1.5 s post-load fallback (older cached app JS, script errors) and the 45 s watchdog unchanged. A half-initialised page can never be shown.
3. **Minimum skeleton time.** `MIN_SKELETON_MS = 400` prevents sub-100 ms skeleton flickers on fast loads; the reveal defers by the residual. Reveal sequencing is guarded against double signals (tabReady + fallback racing).
4. **Reveal-time resize nudge.** The initial frame still loads while the whole container is `display:none`, so `showDashboard()` posts `tabShown` to the revealed frame — any residual chart correction lands under cover of the 300 ms skeleton crossfade.
5. **Reduced motion now reduces rather than removes.** A vestibular-safe `gentlePulse` opacity breathe replaces the shimmer and progress-bar animation under `prefers-reduced-motion`, so loading feedback stays alive without translation or background sweep.
6. Loader message listener gained an origin check covering all message types.

**Verification:** all loader script blocks parse (main IIFE now 497 lines); ten harness assertions on the real reveal machinery — delay maths, single-reveal guarantee, fallback clearing, late-duplicate no-op, minimum-time enforcement, and the tabReady/fallback race. Structural checks: zero `display` toggles left in the pool code, sender/receiver pairs present, origin checks on both sides. `@assetVersion` is `20260707.5` — republish the JS Code Resource and **both pages** (the loader changed).

**Post-deploy checks:** first load shows the animated skeleton for at least ~400 ms and crossfades to a fully formed page (no chart snap); switching to a prefetched tab (Growth/Campaigns) is instant with correctly sized charts; change a filter, visit another cached tab → correct immediately; with OS Reduce Motion enabled, the skeleton gently pulses rather than sitting static; throttle the network → skeleton persists with the named label, error state at 45 s, Retry recovers the same tab.