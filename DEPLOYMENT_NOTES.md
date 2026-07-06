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
