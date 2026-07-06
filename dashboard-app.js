        // ==================================================================================
        // == DEBUG LOGGING (gated)                                                        ==
        // ==================================================================================
        // console.log output is suppressed unless the page is loaded with ?debug.
        // Genuine problems still surface via console.warn / console.error.
        const DEBUG_LOGGING = new URLSearchParams(window.location.search).has('debug');
        const log = DEBUG_LOGGING ? console.log.bind(console) : function() {};

        // ==================================================================================
        // == PERFORMANCE OPTIMIZATIONS: DOM CACHE & UTILITY FUNCTIONS                    ==
        // ==================================================================================
        
        // DOM Cache - Store frequently accessed elements to avoid repeated queries
        const DOM = {
            // Table bodies
            subscriberTableBody: null,
            tradeTableBody: null,
            emailTableBody: null,
            campaignTableBody: null,
            
            // Pagination elements
            subscriberPageInfo: null,
            subscriberPageControls: null,
            tradePageInfo: null,
            tradePageControls: null,
            subscriberPagination: null,
            tradePagination: null,
            
            // Stats elements
            totalSubscribers: null,
            totalRegions: null,
            totalTrades: null,
            avgSubscribers: null,
            subscribersComparison: null,
            regionsComparison: null,
            tradesComparison: null,
            avgComparison: null,
            
            // Filter elements
            startDate: null,
            endDate: null,
            
            // View containers
            
            // Chart canvases
            growthChart: null,
            emailChart: null,
            subscriberSnapshotChart: null,
            tradeSnapshotChart: null,

            // Snapshot containers
            subscriberSnapshotChartContainer: null,
            subscriberSnapshotEmptyState: null,
            subscriberTableContainer: null,
            tradeSnapshotChartContainer: null,
            tradeSnapshotEmptyState: null,
            tradeTableContainer: null
        };
        
        // Initialize DOM cache after page load
        function initializeDOMCache() {
            // Table bodies
            DOM.subscriberTableBody = document.getElementById('subscriberTableBody');
            DOM.tradeTableBody = document.getElementById('tradeTableBody');
            DOM.emailTableBody = document.getElementById('emailTableBody');
            DOM.campaignTableBody = document.getElementById('campaignTableBody');
            
            // Pagination
            DOM.subscriberPageInfo = document.getElementById('subscriberPageInfo');
            DOM.subscriberPageControls = document.getElementById('subscriberPageControls');
            DOM.tradePageInfo = document.getElementById('tradePageInfo');
            DOM.tradePageControls = document.getElementById('tradePageControls');
            DOM.subscriberPagination = document.getElementById('subscriberPagination');
            DOM.tradePagination = document.getElementById('tradePagination');
            
            // Stats
            DOM.totalSubscribers = document.getElementById('totalSubscribers');
            DOM.totalRegions = document.getElementById('totalRegions');
            DOM.totalTrades = document.getElementById('totalTrades');
            DOM.avgSubscribers = document.getElementById('avgSubscribers');
            DOM.subscribersComparison = document.getElementById('subscribersComparison');
            DOM.regionsComparison = document.getElementById('regionsComparison');
            DOM.tradesComparison = document.getElementById('tradesComparison');
            DOM.avgComparison = document.getElementById('avgComparison');
            
            // Filters
            DOM.startDate = document.getElementById('startDate');
            DOM.endDate = document.getElementById('endDate');
            
            // Views
            
            // Charts
            DOM.growthChart = document.getElementById('growthChart');
            DOM.emailChart = document.getElementById('emailChart');
            DOM.subscriberSnapshotChart = document.getElementById('subscriberSnapshotChart');
            DOM.subscriberSnapshotChartContainer = document.getElementById('subscriberSnapshotChartContainer');
            DOM.subscriberSnapshotEmptyState = document.getElementById('subscriberSnapshotChartEmpty');
            DOM.subscriberTableContainer = document.getElementById('subscriberTableContainer');
            DOM.tradeSnapshotChart = document.getElementById('tradeSnapshotChart');
            DOM.tradeSnapshotChartContainer = document.getElementById('tradeSnapshotChartContainer');
            DOM.tradeSnapshotEmptyState = document.getElementById('tradeSnapshotChartEmpty');
            DOM.tradeTableContainer = document.getElementById('tradeTableContainer');
        }
        
        // Debounce utility function - prevents excessive function calls
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func.apply(this, args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        // (PERFORMANCE OPTIMIZATION) Debounced search handlers.
        // The search inputs previously ran the full filter + table re-render
        // synchronously on every keystroke; these wrappers wait for a 250ms
        // pause in typing. Function declarations are hoisted, so referencing
        // filterCampaigns/filterSignupPerformance here is safe.
        const debouncedFilterCampaigns = debounce(function() { filterCampaigns(); }, 250);
        const debouncedFilterSignupPerformance = debounce(function() { filterSignupPerformance(); }, 250);

        // Throttle utility function - ensures function runs at most once per interval
        function throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
        
        // ==================================================================================
        // == DATA NORMALIZATION (SERVER ➜ UI) ==============================================
        // ==================================================================================

        const REGION_ALIAS_MAP = {
            'BE-FR': 'FR-BE',
            'BE-NL': 'NL-BE',
            'NN-NO': 'NO-NO',
            'FR0CH': 'FR-CH',
            'PL': 'PL-PL',
            'RO': 'RO-RO'
        };

        function normalizeRegionCode(code) {
            var normalized = (code || '').trim().toUpperCase().replace(/_/g, '-');
            if (!normalized) {
                return '';
            }
            if (REGION_ALIAS_MAP[normalized]) {
                return REGION_ALIAS_MAP[normalized];
            }
            return normalized;
        }

        function logRegionDiagnostics() {
            const summary = new Map();

            function track(source, records, regionAccessor) {
                if (!Array.isArray(records)) {
                    return;
                }
                records.forEach(item => {
                    if (!item) {
                        return;
                    }
                    const raw = regionAccessor(item);
                    const normalized = normalizeRegionCode(raw);
                    const key = normalized && normalized !== 'UNKNOWN' ? normalized : 'UNKNOWN';
                    if (!summary.has(key)) {
                        summary.set(key, {
                            region: key,
                            subscriberRecords: 0,
                            tradeRecords: 0,
                            regionalEmailRecords: 0,
                            campaignRecords: 0,
                            originals: new Set()
                        });
                    }
                    const entry = summary.get(key);
                    entry.originals.add(raw || '');
                    switch (source) {
                        case 'subscriber':
                            entry.subscriberRecords += 1;
                            break;
                        case 'tradeL1':
                            entry.tradeRecords += 1;
                            break;
                        case 'regional':
                            entry.regionalEmailRecords += 1;
                            break;
                        case 'campaign':
                            entry.campaignRecords += 1;
                            break;
                        default:
                            break;
                    }
                });
            }

            track('subscriber', subscriberData, item => item.region);
            track('tradeL1', tradeData, item => item.region);
            track('regional', regionalMetricsData, item => item.region);
            track('campaign', campaignMetricsData, item => item.region);

            const diagnostics = Array.from(summary.values()).map(entry => ({
                region: entry.region,
                subscriberRecords: entry.subscriberRecords,
                tradeL1Records: entry.tradeRecords,
                regionalEmailRecords: entry.regionalEmailRecords,
                campaignRecords: entry.campaignRecords,
                variants: Array.from(entry.originals).filter(Boolean).sort().join(', ')
            })).sort((a, b) => a.region.localeCompare(b.region));

            const subscriberRegions = new Set();
            const tradeRegions = new Set();
            const regionalEmailRegions = new Set();
            const campaignRegions = new Set();

            diagnostics.forEach(row => {
                if (row.region && row.region !== 'UNKNOWN') {
                    if (row.subscriberRecords > 0) subscriberRegions.add(row.region);
                    if (row.tradeL1Records > 0) tradeRegions.add(row.region);
                    if (row.regionalEmailRecords > 0) regionalEmailRegions.add(row.region);
                    if (row.campaignRecords > 0) campaignRegions.add(row.region);
                }
            });

            const uniqueRegionCount = diagnostics.filter(row => row.region !== 'UNKNOWN').length;

            try {
                console.groupCollapsed(`Region diagnostics (normalized unique regions across all sources: ${uniqueRegionCount})`);
                console.table(diagnostics);
                log('Distinct regions by source:', {
                    subscribers: subscriberRegions.size,
                    tradeL1: tradeRegions.size,
                    regionalEmail: regionalEmailRegions.size,
                    campaigns: campaignRegions.size
                });
                log('Latest subscriber snapshot regions:', Array.from(subscriberRegions).sort());
                console.groupEnd();
            } catch (diagnosticError) {
                console.warn('Region diagnostics logging issue:', diagnosticError);
            }

            return diagnostics;
        }

        function ensureNumber(value) {
            var parsed = parseFloat(value);
            return isNaN(parsed) ? 0 : parsed;
        }

        function normalizeRatePercent(value) {
            const numeric = ensureNumber(value);
            if (numeric === 0) {
                return 0;
            }
            if (numeric > 0 && numeric <= 1.2) {
                return numeric * 100;
            }
            return numeric;
        }

        // ========== CHART HELPER UTILITIES ==========
        // Centralized helper functions to reduce code duplication

        // Chart helpers
        function initChartDefaults() { Chart.defaults.color = '#e5e5e5'; Chart.defaults.borderColor = '#444444'; }
        function destroyChart(chart) { if (chart) chart.destroy(); return null; }
        function toggleChartVisibility(canvas, empty, hasData) { if (canvas) canvas.style.display = hasData ? 'block' : 'none'; if (empty) empty.style.display = hasData ? 'none' : 'block'; }
        function filterByRegions(data, regions, prop = 'region') { return !regions || regions.length === 0 ? data : data.filter(item => item && regions.includes(item[prop])); }
        function formatPercentage(rate, decimals = 2) { return (rate * 100).toFixed(decimals); }

        function createColorPalette(count) {
            const palette = [];
            for (let i = 0; i < count; i++) {
                const hue = (i * 137.508) % 360; // Use golden angle to distribute hues
                palette.push(`hsl(${Math.round(hue)}, 70%, 55%)`);
            }
            return palette;
        }

        function renderSubscriberSnapshotChart(snapshotData) {
            const chartCanvas = DOM.subscriberSnapshotChart || document.getElementById('subscriberSnapshotChart');
            const chartContainer = DOM.subscriberSnapshotChartContainer || document.getElementById('subscriberSnapshotChartContainer');
            const emptyState = DOM.subscriberSnapshotEmptyState || document.getElementById('subscriberSnapshotChartEmpty');

            if (!chartCanvas) {
                return;
            }

            const hasData = Array.isArray(snapshotData) && snapshotData.length > 0;

            if (!hasData) {
                subscriberSnapshotChart = destroyChart(subscriberSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            const sortedData = [...snapshotData]
                .filter(item => item && item.region && item.region !== 'UNKNOWN' && item.region !== 'GLOBAL')
                .sort((a, b) => (b.count || 0) - (a.count || 0));

            if (sortedData.length === 0) {
                subscriberSnapshotChart = destroyChart(subscriberSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            const MAX_VISIBLE_SLICES = 15;
            let chartData = sortedData;

            if (sortedData.length > MAX_VISIBLE_SLICES) {
                const primary = sortedData.slice(0, MAX_VISIBLE_SLICES - 1);
                const other = sortedData.slice(MAX_VISIBLE_SLICES - 1);
                const otherTotal = other.reduce((sum, item) => sum + ensureNumber(item.count), 0);
                chartData = [...primary, { region: 'Other', count: otherTotal }];
            }

            const labels = chartData.map(item => item.region);
            const values = chartData.map(item => ensureNumber(item.count));
            const total = values.reduce((sum, value) => sum + value, 0);
            const colors = createColorPalette(labels.length);

            subscriberSnapshotChart = destroyChart(subscriberSnapshotChart);
            toggleChartVisibility(chartCanvas, emptyState, true);
            initChartDefaults();

            // Determine chart type based on current display mode
            const isStacked = subscriberSnapshotDisplay === 'stacked';
            const isBarChart = subscriberSnapshotDisplay === 'bar';
            const chartType = isStacked ? 'bar' : (isBarChart ? 'bar' : 'doughnut');

            if (isStacked) {
                // Single stacked horizontal bar
                subscriberSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Subscribers'],
                        datasets: chartData.map((item, index) => ({
                            label: item.region,
                            data: [ensureNumber(item.count)],
                            backgroundColor: colors[index],
                            borderColor: '#ffffff',
                            borderWidth: 1
                        }))
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed.x;
                                        const share = total ? ((value / total) * 100).toFixed(1) : 0;
                                        const valueLabel = value.toLocaleString();
                                        return `${context.dataset.label}: ${valueLabel} (${share}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                stacked: true,
                                display: false
                            }
                        }
                    }
                });
            } else {
                subscriberSnapshotChart = new Chart(chartCanvas, {
                    type: chartType,
                    data: {
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: colors,
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        indexAxis: isBarChart ? 'y' : undefined,
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: isBarChart ? undefined : '55%',
                        plugins: {
                            legend: {
                                display: !isBarChart,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed.y || context.parsed;
                                        const share = total ? ((value / total) * 100).toFixed(1) : 0;
                                        const valueLabel = value.toLocaleString();
                                        return isBarChart 
                                            ? `${valueLabel} subscribers (${share}%)`
                                            : `${context.label}: ${valueLabel} (${share}%)`;
                                    }
                                }
                            }
                        },
                        scales: isBarChart ? {
                            x: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                ticks: {
                                    autoSkip: false
                                }
                            }
                        } : undefined
                    }
                });
            }
        }

        function toggleSubscriberSnapshotView(mode) {
            const chartContainer = DOM.subscriberSnapshotChartContainer || document.getElementById('subscriberSnapshotChartContainer');
            const tableContainer = DOM.subscriberTableContainer || document.getElementById('subscriberTableContainer');
            const buttons = document.querySelectorAll('#subscriberSnapshotsSection .view-btn[data-view]');

            buttons.forEach(btn => {
                const btnView = btn.getAttribute('data-view');
                if (!btnView) {
                    return;
                }
                if (btnView === mode) {
                    btn.classList.add('active');
                } else if (['chart', 'bar', 'stacked', 'table'].includes(btnView)) {
                    btn.classList.remove('active');
                }
            });

            subscriberSnapshotDisplay = mode;
            subscriberTableView = 'current';

            if (chartContainer) chartContainer.style.display = (mode === 'chart' || mode === 'bar' || mode === 'stacked') ? 'block' : 'none';
            if (tableContainer) {
                if (mode === 'table') {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');  // Remove d-none class
                } else {
                    tableContainer.style.display = 'none';
                }
            }

            if (mode === 'chart' || mode === 'bar' || mode === 'stacked') {
                // Re-render chart with current mode
                const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
                renderSubscriberSnapshotChart(latestSnapshotData);
            } else {
                toggleTableView('subscriber', 'current');
            }
        }

        function renderTradeSnapshotChart(snapshotData) {
            const chartCanvas = DOM.tradeSnapshotChart || document.getElementById('tradeSnapshotChart');
            const chartContainer = DOM.tradeSnapshotChartContainer || document.getElementById('tradeSnapshotChartContainer');
            const emptyState = DOM.tradeSnapshotEmptyState || document.getElementById('tradeSnapshotChartEmpty');

            if (!chartCanvas) {
                return;
            }

            const hasData = Array.isArray(snapshotData) && snapshotData.length > 0;

            if (!hasData) {
                tradeSnapshotChart = destroyChart(tradeSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            // Filter out UNKNOWN trades
            const validData = snapshotData.filter(item => item && item.trade && item.trade !== 'UNKNOWN');

            // Detect if a single trade filter is active
            const uniqueTrades = [...new Set(validData.map(item => item.trade))];
            const isSingleTradeFilter = uniqueTrades.length === 1;

            let sortedData;
            if (isSingleTradeFilter) {
                // Pivot to regional breakdown for this trade (exclude GLOBAL roll-up)
                const regionAggregates = {};
                validData.forEach(item => {
                    const region = item.region || 'Unknown';
                    if (region.toUpperCase() === 'GLOBAL') return;
                    if (!regionAggregates[region]) regionAggregates[region] = 0;
                    regionAggregates[region] += ensureNumber(item.count);
                });
                sortedData = Object.entries(regionAggregates)
                    .map(([region, count]) => ({ trade: region, count }))
                    .sort((a, b) => b.count - a.count);
            } else {
                // Aggregate trades across all regions (normal behaviour)
                const tradeAggregates = {};
                validData.forEach(item => {
                    const tradeName = item.trade.replace(/_/g, ' ');
                    if (!tradeAggregates[tradeName]) tradeAggregates[tradeName] = 0;
                    tradeAggregates[tradeName] += ensureNumber(item.count);
                });
                sortedData = Object.entries(tradeAggregates)
                    .map(([trade, count]) => ({ trade, count }))
                    .sort((a, b) => b.count - a.count);
            }

            if (sortedData.length === 0) {
                tradeSnapshotChart = destroyChart(tradeSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            // Update section title based on filter mode
            const titleEl = document.getElementById('tradeDistributionTitle');
            if (titleEl) {
                titleEl.textContent = isSingleTradeFilter
                    ? 'Regional Distribution: ' + uniqueTrades[0].replace(/_/g, ' ')
                    : 'Primary Trade Distribution';
            }

            const MAX_VISIBLE_SLICES = 15;
            let chartData = sortedData;

            if (sortedData.length > MAX_VISIBLE_SLICES) {
                const primary = sortedData.slice(0, MAX_VISIBLE_SLICES - 1);
                const other = sortedData.slice(MAX_VISIBLE_SLICES - 1);
                const otherTotal = other.reduce((sum, item) => sum + ensureNumber(item.count), 0);
                chartData = [...primary, { trade: 'Other', count: otherTotal }];
            }

            const labels = chartData.map(item => item.trade);
            const values = chartData.map(item => ensureNumber(item.count));
            const total = values.reduce((sum, value) => sum + value, 0);
            const colors = createColorPalette(labels.length);

            tradeSnapshotChart = destroyChart(tradeSnapshotChart);
            toggleChartVisibility(chartCanvas, emptyState, true);
            initChartDefaults();

            // Determine chart type based on current display mode
            const isStacked = tradeSnapshotDisplay === 'stacked';
            const isBarChart = tradeSnapshotDisplay === 'bar';
            const chartType = isStacked ? 'bar' : (isBarChart ? 'bar' : 'doughnut');

            if (isStacked) {
                // Single stacked horizontal bar
                tradeSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Trades'],
                        datasets: chartData.map((item, index) => ({
                            label: item.trade,
                            data: [ensureNumber(item.count)],
                            backgroundColor: colors[index],
                            borderColor: '#ffffff',
                            borderWidth: 1
                        }))
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed.x;
                                        const share = total ? ((value / total) * 100).toFixed(1) : 0;
                                        const valueLabel = value.toLocaleString();
                                        return `${context.dataset.label}: ${valueLabel} (${share}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                stacked: true,
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                stacked: true,
                                display: false
                            }
                        }
                    }
                });
            } else {
                tradeSnapshotChart = new Chart(chartCanvas, {
                    type: chartType,
                    data: {
                        labels,
                        datasets: [{
                            data: values,
                            backgroundColor: colors,
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }]
                    },
                    options: {
                        indexAxis: isBarChart ? 'y' : undefined,
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: isBarChart ? undefined : '55%',
                        plugins: {
                            legend: {
                                display: !isBarChart,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const value = context.parsed.y || context.parsed;
                                        const share = total ? ((value / total) * 100).toFixed(1) : 0;
                                        const valueLabel = value.toLocaleString();
                                        return isBarChart 
                                            ? `${valueLabel} subscribers (${share}%)`
                                            : `${context.label}: ${valueLabel} (${share}%)`;
                                    }
                                }
                            }
                        },
                        scales: isBarChart ? {
                            x: {
                                beginAtZero: true,
                                ticks: {
                                    callback: function(value) {
                                        return value.toLocaleString();
                                    }
                                }
                            },
                            y: {
                                ticks: {
                                    autoSkip: false
                                }
                            }
                        } : undefined
                    }
                });
            }
        }

        function toggleTradeSnapshotView(mode) {
            const chartContainer = DOM.tradeSnapshotChartContainer || document.getElementById('tradeSnapshotChartContainer');
            const tableContainer = DOM.tradeTableContainer || document.getElementById('tradeTableContainer');
            const buttons = document.querySelectorAll('#tradeDistributionSection .view-btn[data-view]');

            buttons.forEach(btn => {
                const btnView = btn.getAttribute('data-view');
                if (!btnView) {
                    return;
                }
                if (btnView === mode) {
                    btn.classList.add('active');
                } else if (['chart', 'bar', 'stacked', 'table', 'historical'].includes(btnView)) {
                    btn.classList.remove('active');
                }
            });

            // Show/hide Expand/Collapse buttons
            const expandBtns = document.querySelectorAll('#tradeDistributionSection .view-btn');
            expandBtns.forEach(btn => {
                if (btn.textContent.includes('Expand') || btn.textContent.includes('Collapse')) {
                    if (mode === 'historical') {
                        btn.style.display = 'block';
                        btn.classList.remove('d-none');
                    } else {
                        btn.style.display = 'none';
                        btn.classList.add('d-none');
                    }
                }
            });

            if (mode === 'historical') {
                tradeTableView = 'historical';
                if (chartContainer) chartContainer.style.display = 'none';
                if (tableContainer) {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');  // Remove d-none class
                }
                toggleTableView('trade', 'historical');
                return;
            }

            tradeSnapshotDisplay = mode;
            tradeTableView = 'current';

            if (chartContainer) chartContainer.style.display = (mode === 'chart' || mode === 'bar' || mode === 'stacked') ? 'block' : 'none';
            if (tableContainer) {
                if (mode === 'table') {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');  // Remove d-none class
                } else {
                    tableContainer.style.display = 'none';
                }
            }

            if (mode === 'chart' || mode === 'bar' || mode === 'stacked') {
                // Re-render chart with current mode
                const latestSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
                renderTradeSnapshotChart(latestSnapshotData);
            } else {
                toggleTableView('trade', 'current');
            }
        }



        // ==================================================
        // GROWTH TAB CHART WRAPPERS
        // These functions render the same charts to the Growth tab's unique canvas IDs
        // ==================================================
        
        let growthSubscriberSnapshotChart = null;
        let growthSubscriberSnapshotDisplay = 'stacked';
        let growthTradeSnapshotChart = null;
        let growthTradeSnapshotDisplay = 'chart';
        
        function renderGrowthSubscriberSnapshotChart(snapshotData) {
            const chartCanvas = document.getElementById('growthSubscriberSnapshotChart');
            const chartContainer = document.getElementById('growthSubscriberSnapshotChartContainer');
            const emptyState = document.getElementById('growthSubscriberSnapshotChartEmpty');

            if (!chartCanvas) return;

            const hasData = Array.isArray(snapshotData) && snapshotData.length > 0;

            if (!hasData) {
                growthSubscriberSnapshotChart = destroyChart(growthSubscriberSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            const sortedData = [...snapshotData]
                .filter(item => item && item.region && item.region !== 'UNKNOWN' && item.region !== 'GLOBAL')
                .sort((a, b) => (b.count || 0) - (a.count || 0));

            if (sortedData.length === 0) {
                growthSubscriberSnapshotChart = destroyChart(growthSubscriberSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            const MAX_VISIBLE_SLICES = 15;
            let chartData = sortedData;

            if (sortedData.length > MAX_VISIBLE_SLICES) {
                const primary = sortedData.slice(0, MAX_VISIBLE_SLICES - 1);
                const other = sortedData.slice(MAX_VISIBLE_SLICES - 1);
                const otherTotal = other.reduce((sum, item) => sum + ensureNumber(item.count), 0);
                chartData = [...primary, { region: 'Other', count: otherTotal }];
            }

            const labels = chartData.map(item => item.region);
            const values = chartData.map(item => ensureNumber(item.count));
            const total = values.reduce((sum, value) => sum + value, 0);
            const colors = createColorPalette(labels.length);

            growthSubscriberSnapshotChart = destroyChart(growthSubscriberSnapshotChart);
            toggleChartVisibility(chartCanvas, emptyState, true);
            initChartDefaults();

            const isStacked = growthSubscriberSnapshotDisplay === 'stacked';
            const isBarChart = growthSubscriberSnapshotDisplay === 'bar';
            const chartType = isStacked ? 'bar' : (isBarChart ? 'bar' : 'doughnut');

            if (isStacked) {
                growthSubscriberSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Subscribers'],
                        datasets: chartData.map((item, index) => ({
                            label: item.region,
                            data: [item.count],
                            backgroundColor: colors[index],
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }))
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.dataset.label}: ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { stacked: true, display: false }
                        }
                    }
                });
            } else if (isBarChart) {
                growthSubscriberSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: { labels, datasets: [{ label: 'Subscribers', data: values, backgroundColor: colors }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${value.toLocaleString()} subscribers (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (value) => value.toLocaleString() } }
                        }
                    }
                });
            } else {
                growthSubscriberSnapshotChart = new Chart(chartCanvas, {
                    type: 'doughnut',
                    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        function renderGrowthTradeSnapshotChart(snapshotData) {
            const chartCanvas = document.getElementById('growthTradeSnapshotChart');
            const chartContainer = document.getElementById('growthTradeSnapshotChartContainer');
            const emptyState = document.getElementById('growthTradeSnapshotChartEmpty');

            if (!chartCanvas) {
                return;
            }

            // Data is already filtered by global filters
            const hasData = Array.isArray(snapshotData) && snapshotData.length > 0;

            if (!hasData) {
                growthTradeSnapshotChart = destroyChart(growthTradeSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            const validData = [...snapshotData]
                .filter(item => item && item.trade && item.trade !== 'UNKNOWN' && item.trade !== 'NOT_SET');

            if (validData.length === 0) {
                growthTradeSnapshotChart = destroyChart(growthTradeSnapshotChart);
                toggleChartVisibility(chartCanvas, emptyState, false);
                return;
            }

            // Detect if a single trade filter is active
            const uniqueTrades = [...new Set(validData.map(item => item.trade))];
            const isSingleTradeFilter = uniqueTrades.length === 1;

            let sortedData;
            if (isSingleTradeFilter) {
                // Pivot to regional breakdown for this trade (exclude GLOBAL roll-up)
                const regionAggregates = {};
                validData.forEach(item => {
                    const region = item.region || 'Unknown';
                    if (region.toUpperCase() === 'GLOBAL') return;
                    if (!regionAggregates[region]) regionAggregates[region] = 0;
                    regionAggregates[region] += ensureNumber(item.count);
                });
                sortedData = Object.entries(regionAggregates)
                    .map(([region, count]) => ({ trade: region, count, region }))
                    .sort((a, b) => b.count - a.count);
            } else {
                // Aggregate by trade name across regions (normal behaviour)
                const tradeAggregates = {};
                validData.forEach(item => {
                    const tradeName = item.trade.replace(/_/g, ' ');
                    if (!tradeAggregates[tradeName]) tradeAggregates[tradeName] = 0;
                    tradeAggregates[tradeName] += ensureNumber(item.count);
                });
                sortedData = Object.entries(tradeAggregates)
                    .map(([trade, count]) => ({ trade, count }))
                    .sort((a, b) => b.count - a.count);
            }

            // Update section title based on filter mode
            const titleEl = document.getElementById('growthTradeDistributionTitle');
            if (titleEl) {
                titleEl.textContent = isSingleTradeFilter
                    ? 'Regional Distribution: ' + uniqueTrades[0].replace(/_/g, ' ')
                    : 'Primary Trade Distribution';
            }

            const MAX_VISIBLE_SLICES = 15;
            let chartData = sortedData;

            if (sortedData.length > MAX_VISIBLE_SLICES) {
                const primary = sortedData.slice(0, MAX_VISIBLE_SLICES - 1);
                const other = sortedData.slice(MAX_VISIBLE_SLICES - 1);
                const otherTotal = other.reduce((sum, item) => sum + ensureNumber(item.count), 0);
                chartData = [...primary, { trade: 'Other', count: otherTotal, region: 'Combined' }];
            }

            const labels = chartData.map(item => item.trade);
            const values = chartData.map(item => ensureNumber(item.count));
            const total = values.reduce((sum, value) => sum + value, 0);
            const colors = createColorPalette(labels.length);

            growthTradeSnapshotChart = destroyChart(growthTradeSnapshotChart);
            toggleChartVisibility(chartCanvas, emptyState, true);
            initChartDefaults();

            const isStacked = growthTradeSnapshotDisplay === 'stacked';
            const isBarChart = growthTradeSnapshotDisplay === 'bar';

            if (isStacked) {
                growthTradeSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: {
                        labels: ['Trades'],
                        datasets: chartData.map((item, index) => ({
                            label: item.trade,
                            data: [item.count],
                            backgroundColor: colors[index],
                            borderColor: '#ffffff',
                            borderWidth: 2
                        }))
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.dataset.label}: ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: { stacked: true, grid: { display: false } },
                            y: { stacked: true, display: false }
                        }
                    }
                });
            } else if (isBarChart) {
                growthTradeSnapshotChart = new Chart(chartCanvas, {
                    type: 'bar',
                    data: { labels, datasets: [{ label: 'Subscribers', data: values, backgroundColor: colors }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${value.toLocaleString()} subscribers (${percentage}%)`;
                                    }
                                }
                            }
                        },
                        scales: {
                            y: { beginAtZero: true, ticks: { callback: (value) => value.toLocaleString() } }
                        }
                    }
                });
            } else {
                growthTradeSnapshotChart = new Chart(chartCanvas, {
                    type: 'doughnut',
                    data: { labels, datasets: [{ data: values, backgroundColor: colors }] },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'right',
                                labels: {
                                    usePointStyle: true,
                                    boxWidth: 12,
                                    color: '#000000',
                                    font: {
                                        size: 12
                                    }
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: (context) => {
                                        const value = ensureNumber(context.raw);
                                        const percentage = ((value / total) * 100).toFixed(1);
                                        return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
            }
        }

        function toggleGrowthSubscriberSnapshotView(mode) {
            const chartContainer = document.getElementById('growthSubscriberSnapshotChartContainer');
            const tableContainer = document.getElementById('growthSubscriberTableContainer');
            const buttons = document.querySelectorAll('#growthSubscriberSnapshotsSection .view-btn[data-view]');

            buttons.forEach(btn => {
                const btnView = btn.getAttribute('data-view');
                if (!btnView) {
                    return;
                }
                if (btnView === mode) {
                    btn.classList.add('active');
                } else if (['chart', 'bar', 'stacked', 'table', 'historical'].includes(btnView)) {
                    btn.classList.remove('active');
                }
            });

            if (mode === 'historical') {
                if (chartContainer) chartContainer.style.display = 'none';
                if (tableContainer) {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');
                }
                toggleTableView('growthSubscriber', 'historical');
                return;
            }

            growthSubscriberSnapshotDisplay = mode;

            if (chartContainer) chartContainer.style.display = (mode === 'chart' || mode === 'bar' || mode === 'stacked') ? 'block' : 'none';
            if (tableContainer) {
                if (mode === 'table') {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');
                } else {
                    tableContainer.style.display = 'none';
                }
            }

            if (mode === 'chart' || mode === 'bar' || mode === 'stacked') {
                const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
                renderGrowthSubscriberSnapshotChart(latestSnapshotData);
            } else {
                toggleTableView('growthSubscriber', 'current');
            }
        }

        function toggleGrowthTradeSnapshotView(mode) {
            const chartContainer = document.getElementById('growthTradeSnapshotChartContainer');
            const tableContainer = document.getElementById('growthTradeTableContainer');
            const buttons = document.querySelectorAll('#growthTradeDistributionSection .view-btn[data-view]');

            buttons.forEach(btn => {
                const btnView = btn.getAttribute('data-view');
                if (!btnView) {
                    return;
                }
                if (btnView === mode) {
                    btn.classList.add('active');
                } else if (['chart', 'bar', 'stacked', 'table', 'historical'].includes(btnView)) {
                    btn.classList.remove('active');
                }
            });

            if (mode === 'historical') {
                if (chartContainer) chartContainer.style.display = 'none';
                if (tableContainer) {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');
                }
                toggleTableView('growthTrade', 'historical');
                return;
            }

            growthTradeSnapshotDisplay = mode;

            if (chartContainer) chartContainer.style.display = (mode === 'chart' || mode === 'bar' || mode === 'stacked') ? 'block' : 'none';
            if (tableContainer) {
                if (mode === 'table') {
                    tableContainer.style.display = 'block';
                    tableContainer.classList.remove('d-none');
                } else {
                    tableContainer.style.display = 'none';
                }
            }

            if (mode === 'chart' || mode === 'bar' || mode === 'stacked') {
                const latestSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
                renderGrowthTradeSnapshotChart(latestSnapshotData);
            } else {
                toggleTableView('growthTrade', 'current');
            }
        }

        function buildOverallEmailMetrics(records) {
            var aggregates = {};

            if (!Array.isArray(records)) {
                return [];
            }

            records.forEach(function(record) {
                if (!record || !record.sentDateTime) {
                    return;
                }

                var dateObj = new Date(record.sentDateTime);
                if (isNaN(dateObj)) {
                    return;
                }

                var year = dateObj.getFullYear();
                var month = dateObj.getMonth() + 1;
                var key = year + '-' + month;

                if (!aggregates[key]) {
                    aggregates[key] = {
                        year: year,
                        month: month,
                        totalSent: 0,
                        totalDelivered: 0,
                        totalBounced: 0,
                        totalOpens: 0,
                        totalUniqueOpens: 0,
                        totalClicks: 0,
                        totalUniqueClicks: 0,
                        totalUnsubscribes: 0
                    };
                }

                var bucket = aggregates[key];
                bucket.totalSent += ensureNumber(record.totalSent);
                bucket.totalDelivered += ensureNumber(record.totalDelivered);
                bucket.totalBounced += ensureNumber(record.totalBounced);
                bucket.totalOpens += ensureNumber(record.totalOpens);
                bucket.totalUniqueOpens += ensureNumber(record.totalUniqueOpens);
                bucket.totalClicks += ensureNumber(record.totalClicks);
                bucket.totalUniqueClicks += ensureNumber(record.totalUniqueClicks);
                bucket.totalUnsubscribes += ensureNumber(record.totalUnsubscribes);
            });

            return Object.keys(aggregates).map(function(key) {
                var bucket = aggregates[key];
                var deliveryRate = bucket.totalSent ? (bucket.totalDelivered / bucket.totalSent) * 100 : 0;
                var bounceRate = bucket.totalSent ? (bucket.totalBounced / bucket.totalSent) * 100 : 0;
                var openRate = bucket.totalSent ? (bucket.totalUniqueOpens / bucket.totalSent) * 100 : 0;
                var ctr = bucket.totalSent ? (bucket.totalUniqueClicks / bucket.totalSent) * 100 : 0;
                var ctor = bucket.totalUniqueOpens ? (bucket.totalUniqueClicks / bucket.totalUniqueOpens) * 100 : 0;
                var unsubscribeRate = bucket.totalSent ? (bucket.totalUnsubscribes / bucket.totalSent) * 100 : 0;

                return {
                    year: bucket.year,
                    month: bucket.month,
                    totalSent: bucket.totalSent,
                    totalDelivered: bucket.totalDelivered,
                    totalBouncedUnique: bucket.totalBounced,
                    totalOpenUnique: bucket.totalUniqueOpens,
                    totalOpens: bucket.totalOpens,
                    totalClickUnique: bucket.totalUniqueClicks,
                    totalClicks: bucket.totalClicks,
                    totalUnsubscribedUnique: bucket.totalUnsubscribes,
                    deliveryRatePct: deliveryRate,
                    bounceRatePct: bounceRate,
                    openRatePct: openRate,
                    clickThroughRatePct: ctr,
                    clickToOpenRatePct: ctor,
                    unsubscribeRatePct: unsubscribeRate
                };
            }).sort(function(a, b) {
                if (a.year !== b.year) {
                    return b.year - a.year;
                }
                return b.month - a.month;
            });
        }

        var subscriberData = (typeof dailySnapshotData !== 'undefined' && Array.isArray(dailySnapshotData))
            ? dailySnapshotData.map(function(record) {
                return {
                    // SnapshotDate is a non-nullable primary key on the DE, so no
                    // fallback is needed. Trade-split fields and InsertedDate were
                    // pruned server-side (never read by any renderer).
                    date: record.snapshotDate || null,
                    region: normalizeRegionCode(record.region),
                    count: ensureNumber(record.totalSubscribers),
                    totalSubscribers: ensureNumber(record.totalSubscribers)
                };
            })
            : [];

        var tradeData = (typeof l1TradeData !== 'undefined' && Array.isArray(l1TradeData))
            ? l1TradeData.map(function(record) {
                return {
                    date: record.snapshotDate || null,
                    region: normalizeRegionCode(record.region),
                    trade: record.l1Trade || '',
                    count: ensureNumber(record.subscriberCount),
                    level: 'L1'
                };
            })
            : [];

        // Note: l2TradeSnapshots removed - L2 data not displayed in UI

        if (typeof regionalMetricsData !== 'undefined' && Array.isArray(regionalMetricsData)) {
            regionalMetricsData = regionalMetricsData.map(function(record) {
                return {
                    year: ensureNumber(record.year),
                    month: ensureNumber(record.month),
                    region: normalizeRegionCode(record.region),
                    totalSent: ensureNumber(record.totalSent),
                    totalBouncedUnique: ensureNumber(record.totalBounced),
                    totalDelivered: ensureNumber(record.totalDelivered),
                    totalOpenUnique: ensureNumber(record.totalUniqueOpens),
                    totalOpens: ensureNumber(record.totalOpens),
                    totalClickUnique: ensureNumber(record.totalUniqueClicks),
                    totalClicks: ensureNumber(record.totalClicks),
                    totalUnsubscribedUnique: ensureNumber(record.totalUnsubscribes),
                    deliveryRatePct: normalizeRatePercent(record.deliveryRate),
                    bounceRatePct: normalizeRatePercent(record.bounceRate),
                    openRatePct: normalizeRatePercent(record.openRate),
                    clickThroughRatePct: normalizeRatePercent(record.ctr),
                    clickToOpenRatePct: normalizeRatePercent(record.ctor),
                    unsubscribeRatePct: normalizeRatePercent(record.unsubscribeRate),
                    complaintRatePct: normalizeRatePercent(record.complaintRate),
                    insertedDate: record.insertedDate || null
                };
            });
        } else {
            regionalMetricsData = [];
        }

        var sendCountData = (typeof sendFactData !== 'undefined' && Array.isArray(sendFactData))
            ? buildOverallEmailMetrics(sendFactData)
            : [];

        var campaignMetricsData = (typeof sendFactData !== 'undefined' && Array.isArray(sendFactData))
            ? sendFactData.map(function(record) {
                return {
                    jobId: record.jobId || 0,
                    emailName: record.campaignName || record.journeyName || 'Unnamed Campaign',
                    emailSubject: record.subjectLine || '',
                    sendDate: record.sentDateTime || '',
                    // (PERFORMANCE OPTIMIZATION) Parse once at load; filters and the
                    // table renderer compare/display this instead of re-parsing per row.
                    sendDateISO: parseCampaignDate(record.sentDateTime || ''),
                    region: normalizeRegionCode(record.userCulture || record.market || 'GLOBAL'),
                    totalSent: ensureNumber(record.totalSent),
                    totalBounced: ensureNumber(record.totalBounced),
                    totalDelivered: ensureNumber(record.totalDelivered),
                    totalOpened: ensureNumber(record.totalUniqueOpens),
                    totalClicked: ensureNumber(record.totalUniqueClicks),
                    totalUnsubscribed: ensureNumber(record.totalUnsubscribes),
                    deliveryRate: normalizeRatePercent(record.deliveryRate),
                    openRate: normalizeRatePercent(record.openRate),
                    clickRate: normalizeRatePercent(record.ctr),
                    clickToOpenRate: normalizeRatePercent(record.ctor),
                    unsubscribeRate: normalizeRatePercent(record.unsubscribeRate),
                    journeyName: record.journeyName || '',
                    journeyId: record.journeyId || '',
                    segment: record.segment || '',
                    market: record.market || '',
                    preheader: record.preheader || '',
                    campaignId: record.campaignId || '',
                    insertedDate: record.insertedDate || '',
                    modifiedDate: record.modifiedDate || ''
                };
            })
            : [];

        // ==================================================================================
        // == DATA INITIALIZATION                                                          ==
        // ==================================================================================
        
        // Memoization cache for expensive data operations (PERFORMANCE OPTIMIZATION)
        const dataCache = {
            // Cache structure: { key: { data: result, timestamp: Date.now(), dataHash: hash } }
            latestSnapshotSubscriber: null,
            latestSnapshotTrade: null,
            groupedByCountry: null,
            stats: null,
            lastClearTime: Date.now()
        };
        
        // Cache configuration
        const CACHE_TTL = 5000; // 5 seconds - cache invalidation time
        
        // Helper function to generate a simple hash of data for cache invalidation
        function getDataHash(data) {
            if (!data || !Array.isArray(data)) return '0';
            return `${data.length}_${data[0]?.date || ''}_${data[data.length - 1]?.date || ''}`;
        }
        
        // Helper function to check if cache is valid
        function isCacheValid(cacheEntry, currentDataHash) {
            if (!cacheEntry) return false;
            const age = Date.now() - cacheEntry.timestamp;
            const hashMatch = cacheEntry.dataHash === currentDataHash;
            return age < CACHE_TTL && hashMatch;
        }
        
        // Clear all caches (call when filters change)
        function clearDataCache() {
            dataCache.latestSnapshotSubscriber = null;
            dataCache.latestSnapshotTrade = null;
            dataCache.groupedByCountry = null;
            dataCache.stats = null;
            dataCache.lastClearTime = Date.now();
        }
        
        // Helper function to format stat comparison
        function formatStatComparison(current, previous, periodDescription = 'period') {
            if (previous === 0 || previous === null || previous === undefined) {
                return '';
            }
            
            const diff = current - previous;
            const percentChange = ((diff / previous) * 100).toFixed(1);
            const isPositive = diff > 0;
            const isNeutral = diff === 0;
            
            const className = isNeutral ? 'neutral' : (isPositive ? 'positive' : 'negative');
            const icon = isNeutral ? '=' : (isPositive ? '↑' : '↓');
            const sign = isPositive && !isNeutral ? '+' : '';
            
            return `<span class="stat-comparison ${className}"><span class="stat-comparison-icon">${icon}</span>${sign}${percentChange}% vs previous ${periodDescription}</span>`;
        }
        
        // Helper function to calculate period description from date range
        function getPeriodDescription(dateFrom, dateTo) {
            if (!dateFrom || !dateTo) return 'period';
            
            const fromDate = new Date(dateFrom);
            const toDate = new Date(dateTo);
            const diffTime = Math.abs(toDate - fromDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Single day
            if (diffDays === 1) {
                return 'day';
            }
            
            // Exact weeks (only use "week" for exact multiples of 7)
            if (diffDays % 7 === 0) {
                const weeks = diffDays / 7;
                return weeks === 1 ? 'week' : `${weeks} weeks`;
            }
            
            // Days (2-27 days that aren't exact weeks)
            if (diffDays <= 27) {
                return `${diffDays} days`;
            }
            
            // Approximate month (28-35 days)
            if (diffDays >= 28 && diffDays <= 35) {
                return 'month';
            }
            
            // Multiple months (36-395 days)
            if (diffDays <= 395) {
                const months = Math.round(diffDays / 30);
                return `${months} months`;
            }
            
            // Years
            const years = Math.round(diffDays / 365);
            return years === 1 ? 'year' : `${years} years`;
        }
        
        // PERFORMANCE: SessionStorage caching utilities
        function getCachedData(key) {
            try {
                const cached = sessionStorage.getItem('mwt_dashboard_' + key);
                if (cached) {
                    const data = JSON.parse(cached);
                    // Cache valid for 5 minutes
                    if (Date.now() - data.timestamp < 300000) {
                        return data.value;
                    }
                }
            } catch (e) {
                console.warn('Cache read failed:', e);
            }
            return null;
        }
        
        function setCachedData(key, value) {
            try {
                sessionStorage.setItem('mwt_dashboard_' + key, JSON.stringify({
                    value: value,
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('Cache write failed:', e);
            }
        }
        
        // Initialize data
    let filteredSubscriberData = [];
    let filteredTradeData = [];
    let filteredRegionalMetricsData = [];
    let filteredSendCountData = [];
        let growthChart = null;
        let emailChart = null;
        let currentChartType = 'line';
        let currentGrouping = 'week';
        let subscriberSnapshotChart = null;
        let subscriberSnapshotDisplay = 'stacked';
        let tradeSnapshotChart = null;
        let tradeSnapshotDisplay = 'chart';
        // Removed: selectedTradeRegion - now using multi-select filter via getSelectedRegions('trade')
        
        // Campaign details state
    let filteredCampaignData = [];
    let campaignDataAfterGlobalFilters = [];
        let currentCampaignPage = 1;
        let campaignsPerPage = 25;
        let campaignSortColumn = 'sendDate';
        let campaignSortDirection = 'desc';
        
        // Culture campaign details state
        
        // Signup performance state
        let filteredSignupPerformanceData = [];
        let signupCurrentPage = 1;
        let signupRowsPerPage = 20;
        let signupSortColumn = 'totalLifetimeSends';
        let signupSortDirection = 'desc';
        let signupNewSubscribersChart = null;
        
        // Table view states
        let subscriberTableView = 'current';
        let tradeTableView = 'current';
        let subscriberCurrentPage = 1;
        let tradeCurrentPage = 1;
        const rowsPerPage = 50;

        // Culture definitions with country codes and flags
        // Culture mapping - OPTIMIZED: Single entry per culture (no duplicates)
        // Use getCultureInfo() function for case-insensitive lookups
        const cultures = {
            'EN-GB': { name: 'English (UK)', country: 'United Kingdom', flag: '🇬🇧' },
            'EN-US': { name: 'English (US)', country: 'United States', flag: '🇺🇸' },
            'DE-DE': { name: 'German (Germany)', country: 'Germany', flag: '🇩🇪' },
            'FR-FR': { name: 'French (France)', country: 'France', flag: '🇫🇷' },
            'ES-ES': { name: 'Spanish (Spain)', country: 'Spain', flag: '🇪🇸' },
            'IT-IT': { name: 'Italian (Italy)', country: 'Italy', flag: '🇮🇹' },
            'NL-NL': { name: 'Dutch (Netherlands)', country: 'Netherlands', flag: '🇳🇱' },
            'NL-BE': { name: 'Dutch (Belgium)', country: 'Belgium', flag: '🇧🇪' },
            'FR-BE': { name: 'French (Belgium)', country: 'Belgium', flag: '🇧🇪' },
            'DE-CH': { name: 'German (Switzerland)', country: 'Switzerland', flag: '🇨🇭' },
            'FR-CH': { name: 'French (Switzerland)', country: 'Switzerland', flag: '🇨🇭' },
            'IT-CH': { name: 'Italian (Switzerland)', country: 'Switzerland', flag: '🇨🇭' },
            'DE-AT': { name: 'German (Austria)', country: 'Austria', flag: '🇦🇹' },
            'DA-DK': { name: 'Danish (Denmark)', country: 'Denmark', flag: '🇩🇰' },
            'SV-SE': { name: 'Swedish (Sweden)', country: 'Sweden', flag: '🇸🇪' },
            'NB-NO': { name: 'Norwegian (Norway)', country: 'Norway', flag: '🇳🇴' },
            'NO-NO': { name: 'Norwegian (Norway)', country: 'Norway', flag: '🇳🇴' },
            'NN-NO': { name: 'Norwegian (Norway)', country: 'Norway', flag: '🇳🇴' },
            'FI-FI': { name: 'Finnish (Finland)', country: 'Finland', flag: '🇫🇮' },
            'PL-PL': { name: 'Polish (Poland)', country: 'Poland', flag: '🇵🇱' },
            'CS-CZ': { name: 'Czech (Czech Republic)', country: 'Czech Republic', flag: '🇨🇿' },
            'SK-SK': { name: 'Slovak (Slovakia)', country: 'Slovakia', flag: '🇸🇰' },
            'HU-HU': { name: 'Hungarian (Hungary)', country: 'Hungary', flag: '🇭🇺' },
            'RO-RO': { name: 'Romanian (Romania)', country: 'Romania', flag: '🇷🇴' },
            'BG-BG': { name: 'Bulgarian (Bulgaria)', country: 'Bulgaria', flag: '🇧🇬' },
            'SL-SI': { name: 'Slovenian (Slovenia)', country: 'Slovenia', flag: '🇸🇮' },
            'HR-HR': { name: 'Croatian (Croatia)', country: 'Croatia', flag: '🇭🇷' },
            'PT-PT': { name: 'Portuguese (Portugal)', country: 'Portugal', flag: '🇵🇹' },
            'LB-LU': { name: 'Luxembourgish (Luxembourg)', country: 'Luxembourg', flag: '🇱🇺' },
            'FR-LU': { name: 'French (Luxembourg)', country: 'Luxembourg', flag: '🇱🇺' },
            'DE-LU': { name: 'German (Luxembourg)', country: 'Luxembourg', flag: '🇱🇺' },
            'ET-EE': { name: 'Estonian (Estonia)', country: 'Estonia', flag: '🇪🇪' },
            'LV-LV': { name: 'Latvian (Latvia)', country: 'Latvia', flag: '🇱🇻' },
            'LT-LT': { name: 'Lithuanian (Lithuania)', country: 'Lithuania', flag: '🇱🇹' },
            'EN-ZA': { name: 'English (South Africa)', country: 'South Africa', flag: '🇿🇦' },
            'AR-AE': { name: 'Arabic (UAE)', country: 'UAE', flag: '🇦🇪' },
            'TR-TR': { name: 'Turkish (Turkey)', country: 'Turkey', flag: '🇹🇷' },
            'EN-TT': { name: 'English (Trinidad and Tobago)', country: 'Trinidad and Tobago', flag: '🇹🇹' },
            // Special case: typo variant for French Switzerland
            'FR0CH': { name: 'French (Switzerland)', country: 'Switzerland', flag: '🇨🇭' }
        };
        
        // PERFORMANCE OPTIMIZATION: Case-insensitive culture lookup with fallback
        // Handles uppercase, lowercase, and mixed-case culture codes
        function getCultureInfo(code) {
            if (!code) {
                return { name: 'Unknown', country: 'Region', flag: '�' };
            }
            
            // Try original case first (fastest path)
            if (cultures[code]) {
                return cultures[code];
            }
            
            // Normalize to uppercase and try again
            const normalized = code.toUpperCase();
            if (cultures[normalized]) {
                return cultures[normalized];
            }
            
            // Fallback for unknown cultures
            return {
                name: code,
                country: 'Region',
                flag: '�'
            };
        }







        // Culture email chart rendering (for culture-specific view)




        // Store expanded state for tables
        
        // Store trade data pagination state







        // Display username
        if (currentUser) {
            document.getElementById('username').textContent = currentUser;
        }

        // Check if data is available
        if (typeof subscriberData !== 'undefined' && subscriberData) {
            filteredSubscriberData = [...subscriberData];
        } else {
            subscriberData = [];
        }

        if (typeof tradeData !== 'undefined' && tradeData) {
            filteredTradeData = [...tradeData];
        } else {
            tradeData = [];
        }

        if (typeof sendCountData !== 'undefined' && sendCountData) {
            filteredSendCountData = [...sendCountData];
        } else {
            sendCountData = [];
            filteredSendCountData = [];
        }

        if (typeof regionalMetricsData !== 'undefined' && regionalMetricsData) {
            filteredRegionalMetricsData = [...regionalMetricsData];
        } else {
            regionalMetricsData = [];
            filteredRegionalMetricsData = [];
        }

        if (typeof campaignMetricsData !== 'undefined' && campaignMetricsData) {
            // Sort by send date descending (most recent first) as default
            campaignMetricsData.sort((a, b) => {
                const dateA = new Date(a.sendDate);
                const dateB = new Date(b.sendDate);
                return dateB - dateA;
            });
            
            campaignDataAfterGlobalFilters = [...campaignMetricsData];
            filteredCampaignData = [...campaignMetricsData];
            
            // Warning visibility is now driven by the user's selected date filter
            // (see updateCampaignLookbackWarning, called from filterCampaigns).
        } else {
            campaignMetricsData = [];
            campaignDataAfterGlobalFilters = [];
            filteredCampaignData = [];
        }

        // Display status information
        function updateInfoBox() {
            const infoBox = document.getElementById('infoBox');
            if (!infoBox) {
                return;
            }

            infoBox.style.display = 'none';
            infoBox.textContent = '';

            // Include all data sources in the count (tab-based loading means only some will have data)
            const signupPerfCount = (typeof signupPerformanceData !== 'undefined' && Array.isArray(signupPerformanceData)) ? signupPerformanceData.length : 0;
            const signupIdPerfCount = (typeof signupIdentifierPerformanceData !== 'undefined' && Array.isArray(signupIdentifierPerformanceData)) ? signupIdentifierPerformanceData.length : 0;
            const totalRecords = subscriberData.length + tradeData.length + sendCountData.length + 
                                (regionalMetricsData ? regionalMetricsData.length : 0) + 
                                signupPerfCount + signupIdPerfCount;

            if (errorMsg) {
                infoBox.className = 'info-box error';
                infoBox.textContent = `✗ Error loading data: ${errorMsg}`;
                infoBox.style.display = 'block';
                return;
            }

            // Don't show "no data" message for tabs with their own data sources
            const currentTab = new URLSearchParams(window.location.search).get('tab') || 'overview';
            if (totalRecords === 0 && currentTab !== 'myaccount' && currentTab !== 'signup-detail') {
                infoBox.className = 'info-box';
                infoBox.textContent = 'ℹ No data found in data extensions';
                infoBox.style.display = 'block';
            }
        }

        // Email analytics state - Flag to control whether to use current month default
        var emailAnalyticsUseDefault = true;

        // NEW: Email campaign analytics functions
        function getMonthName(monthNumber) {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return months[monthNumber - 1] || '';
        }

        // Set email period and update analytics
        function setEmailPeriod(period, event) {
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            const today = new Date();
            
            // Remove active class from all period buttons
            document.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            if (event && event.target) {
                event.target.classList.add('active');
            }
            
            // User has made an explicit choice, don't use default anymore
            emailAnalyticsUseDefault = false;
            
            switch(period) {
                case 'current-month':
                    const firstDayCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                    const lastDayCurrentMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    dateFromInput.value = toLocalDateKey(firstDayCurrentMonth);
                    dateToInput.value = toLocalDateKey(lastDayCurrentMonth);
                    break;
                    
                case 'last-month':
                    const firstDayLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                    const lastDayLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    dateFromInput.value = toLocalDateKey(firstDayLastMonth);
                    dateToInput.value = toLocalDateKey(lastDayLastMonth);
                    break;
                    
                case 'last-3-months':
                    const threeMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 2, 1);
                    const lastDayCurrentMonth3 = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                    dateFromInput.value = toLocalDateKey(threeMonthsAgo);
                    dateToInput.value = toLocalDateKey(lastDayCurrentMonth3);
                    break;
                    
                case 'all-time':
                    // Clear date filters to show all time
                    dateFromInput.value = '';
                    dateToInput.value = '';
                    break;
            }
            
            // Re-render email analytics with new date range
            renderEmailAnalytics();
        }

        function renderEmailAnalytics() {
            // Get selected regions from global filter
            const selectedRegions = getSelectedRegions('global');
            
            const regionalDataSource = filteredRegionalMetricsData || [];
            const baseRegionalDataset = regionalMetricsData || [];

            let dataToUse, isRegionalView, fullDataset;

            if (selectedRegions.length > 0) {
                // Regional view with specific regions selected
                if (!regionalDataSource || regionalDataSource.length === 0) {
                    document.getElementById('emailStatsGrid').innerHTML = '<div class="no-data">No regional email metrics data available</div>';
                    document.getElementById('emailTableBody').innerHTML = '<tr><td colspan="12" class="no-data">No regional email metrics data available</td></tr>';
                    if (emailChart) {
                        emailChart.destroy();
                        emailChart = null;
                    }
                    return;
                }
                
                // Filter to include all selected regions
                dataToUse = regionalDataSource.filter(item => 
                    selectedRegions.includes(normalizeRegionCode(item.region))
                );
                fullDataset = baseRegionalDataset.filter(item => 
                    selectedRegions.includes(normalizeRegionCode(item.region))
                );
                isRegionalView = true;

                if (dataToUse.length === 0) {
                    const regionList = selectedRegions.join(', ');
                    document.getElementById('emailStatsGrid').innerHTML = `<div class="no-data">No email metrics found for ${regionList} within the selected filters</div>`;
                    document.getElementById('emailTableBody').innerHTML = '<tr><td colspan="12" class="no-data">No email metrics available for selected regions</td></tr>';
                    if (emailChart) {
                        emailChart.destroy();
                        emailChart = null;
                    }
                    return;
                }
            } else {
                // No regions selected - show ALL regional data
                if (!regionalDataSource || regionalDataSource.length === 0) {
                    document.getElementById('emailStatsGrid').innerHTML = '<div class="no-data">No regional email metrics data available</div>';
                    document.getElementById('emailTableBody').innerHTML = '<tr><td colspan="12" class="no-data">No regional email metrics data available</td></tr>';
                    if (emailChart) {
                        emailChart.destroy();
                        emailChart = null;
                    }
                    return;
                }
                // Show all regions when none are specifically selected
                dataToUse = regionalDataSource;
                fullDataset = baseRegionalDataset;
                isRegionalView = true;
            }

            // Get current date range from filters
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            let dateFrom = dateFromInput ? dateFromInput.value : null;
            let dateTo = dateToInput ? dateToInput.value : null;
            
            // Show all available data by default (no date filtering unless explicitly set)
            let isUsingDefaultDateRange = false;
            // Removed default current month filtering to show all historical data
            // Users can apply date filters if they want to narrow down the view
            
            // Sort and filter data by date range FOR METRICS AND TABLE
            let sortedData = [...dataToUse].sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
            
            // Keep a copy of ALL data for the chart (to show trends)
            let chartData = [...dataToUse].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });
            
            // Apply date filter to metrics/table data only (include months that overlap with the selected range)
            if (dateFrom && dateTo) {
                const fromDate = new Date(dateFrom);
                const toDate = new Date(dateTo);
                
                sortedData = sortedData.filter(item => {
                    const itemDate = new Date(item.year, item.month - 1, 1);
                    const itemMonthEnd = new Date(item.year, item.month, 0); // Last day of the month
                    
                    // Include month if it overlaps with the selected date range
                    return (itemDate <= toDate && itemMonthEnd >= fromDate);
                });
            }
            
            // Calculate period duration and previous period dates for comparison
            let previousPeriodData = [];
            let hasPreviousPeriod = false;
            
            if (dateFrom && dateTo) {
                const fromDate = new Date(dateFrom);
                const toDate = new Date(dateTo);
                const periodDuration = toDate - fromDate; // in milliseconds
                
                // Calculate previous period
                const previousPeriodTo = new Date(fromDate);
                previousPeriodTo.setDate(previousPeriodTo.getDate() - 1);
                const previousPeriodFrom = new Date(previousPeriodTo.getTime() - periodDuration);
                
                // Filter data for previous period
                // Since data is monthly, include any month that falls within the previous period range
                previousPeriodData = fullDataset.filter(item => {
                    const itemDate = new Date(item.year, item.month - 1, 1);
                    const itemMonthEnd = new Date(item.year, item.month, 0); // Last day of the month
                    
                    // Include month if it overlaps with the previous period range
                    return (itemDate <= previousPeriodTo && itemMonthEnd >= previousPeriodFrom);
                });
                
                // Filter by selected regions if in regional view
                if (selectedRegions.length > 0) {
                    previousPeriodData = previousPeriodData.filter(item => 
                        selectedRegions.includes(normalizeRegionCode(item.region))
                    );
                }
                
                hasPreviousPeriod = previousPeriodData.length > 0;
            }

            // Calculate CURRENT PERIOD totals and averages
            const totals = sortedData.reduce((acc, item) => {
                acc.totalSent += item.totalSent;
                acc.totalDelivered += item.totalDelivered;
                acc.totalOpens += item.totalOpenUnique;
                acc.totalClicks += item.totalClickUnique;
                acc.totalUnsubscribed += item.totalUnsubscribedUnique;
                acc.count += 1;
                return acc;
            }, {
                totalSent: 0,
                totalDelivered: 0,
                totalOpens: 0,
                totalClicks: 0,
                totalUnsubscribed: 0,
                count: 0
            });

            const avgDeliveryRate = sortedData.length > 0 
                ? parseFloat((sortedData.reduce((sum, item) => sum + item.deliveryRatePct, 0) / sortedData.length).toFixed(1))
                : 0;
            const avgOpenRate = sortedData.length > 0 
                ? parseFloat((sortedData.reduce((sum, item) => sum + item.openRatePct, 0) / sortedData.length).toFixed(1))
                : 0;
            const avgCTR = sortedData.length > 0 
                ? parseFloat((sortedData.reduce((sum, item) => sum + item.clickThroughRatePct, 0) / sortedData.length).toFixed(2))
                : 0;
            const avgCTOR = sortedData.length > 0 
                ? parseFloat((sortedData.reduce((sum, item) => sum + item.clickToOpenRatePct, 0) / sortedData.length).toFixed(1))
                : 0;
            const avgUnsubscribeRate = sortedData.length > 0 
                ? parseFloat((sortedData.reduce((sum, item) => sum + item.unsubscribeRatePct, 0) / sortedData.length).toFixed(2))
                : 0;
            
            // Calculate PREVIOUS PERIOD metrics if available
            let prevTotals = { totalSent: 0, totalClicks: 0 };
            let prevAvgDeliveryRate = 0;
            let prevAvgOpenRate = 0;
            let prevAvgCTR = 0;
            let prevAvgCTOR = 0;
            let prevAvgUnsubscribeRate = 0;
            
            if (hasPreviousPeriod && previousPeriodData.length > 0) {
                prevTotals = previousPeriodData.reduce((acc, item) => {
                    acc.totalSent += item.totalSent;
                    acc.totalClicks += item.totalClickUnique;
                    return acc;
                }, { totalSent: 0, totalClicks: 0 });
                
                prevAvgDeliveryRate = parseFloat((previousPeriodData.reduce((sum, item) => sum + item.deliveryRatePct, 0) / previousPeriodData.length).toFixed(1));
                prevAvgOpenRate = parseFloat((previousPeriodData.reduce((sum, item) => sum + item.openRatePct, 0) / previousPeriodData.length).toFixed(1));
                prevAvgCTR = parseFloat((previousPeriodData.reduce((sum, item) => sum + item.clickThroughRatePct, 0) / previousPeriodData.length).toFixed(2));
                prevAvgCTOR = parseFloat((previousPeriodData.reduce((sum, item) => sum + item.clickToOpenRatePct, 0) / previousPeriodData.length).toFixed(1));
                prevAvgUnsubscribeRate = parseFloat((previousPeriodData.reduce((sum, item) => sum + item.unsubscribeRatePct, 0) / previousPeriodData.length).toFixed(2));
            }

            // For regional view, show the selected regions, for overall view, get unique regions count
            let regionsDisplay;
            if (isRegionalView) {
                // Show selected regions as a comma-separated list
                regionsDisplay = selectedRegions.join(', ');
            } else {
                const consolidatedRegions = new Set();
                regionalDataSource
                    .filter(item => item.region && item.region !== 'Global / Non-Regional')
                    .forEach(item => {
                        consolidatedRegions.add(normalizeRegionCode(item.region));
                    });
                regionsDisplay = consolidatedRegions.size;
            }

            // Calculate period description and comparisons
            const periodDesc = getPeriodDescription(dateFrom, dateTo);
            const sentComparison = hasPreviousPeriod ? formatStatComparison(totals.totalSent, prevTotals.totalSent, periodDesc) : '';
            const deliveryComparison = hasPreviousPeriod ? formatStatComparison(avgDeliveryRate, prevAvgDeliveryRate, periodDesc) : '';
            const openComparison = hasPreviousPeriod ? formatStatComparison(avgOpenRate, prevAvgOpenRate, periodDesc) : '';
            const clickComparison = hasPreviousPeriod ? formatStatComparison(avgCTR, prevAvgCTR, periodDesc) : '';
            const ctorComparison = hasPreviousPeriod ? formatStatComparison(avgCTOR, prevAvgCTOR, periodDesc) : '';
            const clicksComparison = hasPreviousPeriod ? formatStatComparison(totals.totalClicks, prevTotals.totalClicks, periodDesc) : '';
            const unsubComparison = hasPreviousPeriod ? formatStatComparison(avgUnsubscribeRate, prevAvgUnsubscribeRate, periodDesc) : '';
            
            // Render stats cards with comparisons
            const statsGrid = document.getElementById('emailStatsGrid');
            statsGrid.innerHTML = `
                <div class="email-stat-card">
                    <div class="email-stat-value">${totals.totalSent.toLocaleString()}</div>
                    <div class="email-stat-label">Total Emails Sent</div>
                    <div class="stat-comparison">${sentComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${isRegionalView ? regionsDisplay : regionsDisplay}</div>
                    <div class="email-stat-label">${isRegionalView ? 'Selected Region' : 'Regions with Email Data'}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${avgDeliveryRate.toFixed(1)}%</div>
                    <div class="email-stat-label">Avg Delivery Rate</div>
                    <div class="stat-comparison">${deliveryComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${avgOpenRate.toFixed(1)}%</div>
                    <div class="email-stat-label">Avg Open Rate</div>
                    <div class="stat-comparison">${openComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${avgCTR.toFixed(2)}%</div>
                    <div class="email-stat-label">Avg Click Rate</div>
                    <div class="stat-comparison">${clickComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${avgCTOR.toFixed(1)}%</div>
                    <div class="email-stat-label">Avg Click-to-Open</div>
                    <div class="stat-comparison">${ctorComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${totals.totalClicks.toLocaleString()}</div>
                    <div class="email-stat-label">Total Clicks</div>
                    <div class="stat-comparison">${clicksComparison}</div>
                </div>
                <div class="email-stat-card">
                    <div class="email-stat-value">${avgUnsubscribeRate.toFixed(2)}%</div>
                    <div class="email-stat-label">Avg Unsubscribe Rate</div>
                    <div class="stat-comparison">${unsubComparison}</div>
                </div>
            `;

            // Render table using DocumentFragment (PERFORMANCE OPTIMIZATION)
            const tableBody = DOM.emailTableBody || document.getElementById('emailTableBody');
            tableBody.innerHTML = '';
            
            const fragment = document.createDocumentFragment();

            sortedData.forEach(item => {
                const row = document.createElement('tr');
                if (isRegionalView) {
                    // Regional view - show region column
                    row.innerHTML = `
                        <td class="email-month">${getMonthName(item.month)} ${item.year}</td>
                        <td><span class="region-badge">${item.region}</span></td>
                        <td class="email-number">${item.totalSent.toLocaleString()}</td>
                        <td class="email-number">${item.totalDelivered.toLocaleString()}</td>
                        <td class="email-percentage">${item.deliveryRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalOpenUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.openRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalClickUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.clickThroughRatePct.toFixed(2)}%</td>
                        <td class="email-percentage">${item.clickToOpenRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalUnsubscribedUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.unsubscribeRatePct.toFixed(2)}%</td>
                    `;
                } else {
                    // Overall view - show "Overall" in region column
                    row.innerHTML = `
                        <td class="email-month">${getMonthName(item.month)} ${item.year}</td>
                        <td><span class="region-badge" style="background: #666;">Overall</span></td>
                        <td class="email-number">${item.totalSent.toLocaleString()}</td>
                        <td class="email-number">${item.totalDelivered.toLocaleString()}</td>
                        <td class="email-percentage">${item.deliveryRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalOpenUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.openRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalClickUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.clickThroughRatePct.toFixed(2)}%</td>
                        <td class="email-percentage">${item.clickToOpenRatePct.toFixed(1)}%</td>
                        <td class="email-number">${item.totalUnsubscribedUnique.toLocaleString()}</td>
                        <td class="email-percentage">${item.unsubscribeRatePct.toFixed(2)}%</td>
                    `;
                }
                fragment.appendChild(row);
            });
            
            // Single DOM update (PERFORMANCE OPTIMIZATION)
            tableBody.appendChild(fragment);

            // Render chart with ALL data to show trends (not filtered by period)
            renderEmailChart(chartData, selectedRegions, isRegionalView);
        }

        function renderEmailChart(data, selectedRegions, isRegionalView) {
            const ctx = document.getElementById('emailChart');
            if (!ctx || data.length === 0) return;

            emailChart = destroyChart(emailChart);

            // Sort data by year/month (oldest first for chart)
            // Data is already sorted and contains ALL available data for trend visualization
            let sortedData = [...data].sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

            // For overall view (SendCount data), use data as-is
            // For regional view, filter out Global/Non-Regional if it exists
            let chartData;
            if (isRegionalView) {
                chartData = sortedData.filter(item => item.region !== 'Global / Non-Regional');
                
                // If multiple regions are selected OR no regions selected (all regions), aggregate by month
                if (selectedRegions.length !== 1) {
                    const monthlyAggregates = {};
                    
                    chartData.forEach(item => {
                        const key = `${item.year}-${item.month}`;
                        if (!monthlyAggregates[key]) {
                            monthlyAggregates[key] = {
                                year: item.year,
                                month: item.month,
                                totalSent: 0,
                                totalDelivered: 0,
                                totalOpenUnique: 0,
                                totalClickUnique: 0,
                                totalUnsubscribedUnique: 0,
                                count: 0
                            };
                        }
                        
                        const agg = monthlyAggregates[key];
                        agg.totalSent += item.totalSent || 0;
                        agg.totalDelivered += item.totalDelivered || 0;
                        agg.totalOpenUnique += item.totalOpenUnique || 0;
                        agg.totalClickUnique += item.totalClickUnique || 0;
                        agg.totalUnsubscribedUnique += item.totalUnsubscribedUnique || 0;
                        agg.count++;
                    });
                    
                    // Calculate aggregated rates
                    chartData = Object.values(monthlyAggregates).map(agg => ({
                        year: agg.year,
                        month: agg.month,
                        totalSent: agg.totalSent,
                        deliveryRatePct: agg.totalSent > 0 ? (agg.totalDelivered / agg.totalSent) * 100 : 0,
                        openRatePct: agg.totalSent > 0 ? (agg.totalOpenUnique / agg.totalSent) * 100 : 0,
                        clickThroughRatePct: agg.totalSent > 0 ? (agg.totalClickUnique / agg.totalSent) * 100 : 0,
                        unsubscribeRatePct: agg.totalSent > 0 ? (agg.totalUnsubscribedUnique / agg.totalSent) * 100 : 0
                    })).sort((a, b) => {
                        if (a.year !== b.year) return a.year - b.year;
                        return a.month - b.month;
                    });
                }
            } else {
                chartData = sortedData;
            }

            initChartDefaults();

            // Update chart title based on selection
            const chartTitle = selectedRegions.length === 0
                ? 'All Regions Combined'
                : (selectedRegions.length > 1 
                    ? `Combined Performance (${selectedRegions.length} regions)` 
                    : selectedRegions[0]);

            emailChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: chartData.map(item => `${getMonthName(item.month)} ${item.year}`),
                    datasets: [
                        {
                            label: 'Delivery Rate (%)',
                            data: chartData.map(item => item.deliveryRatePct),
                            borderColor: '#ee0000',
                            backgroundColor: 'rgba(238, 0, 0, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Open Rate (%)',
                            data: chartData.map(item => item.openRatePct),
                            borderColor: '#ffa500',
                            backgroundColor: 'rgba(255, 165, 0, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Click Rate (%)',
                            data: chartData.map(item => item.clickThroughRatePct),
                            borderColor: '#00cc44',
                            backgroundColor: 'rgba(0, 204, 68, 0.1)',
                            borderWidth: 3,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Unsubscribe Rate (%)',
                            data: chartData.map(item => item.unsubscribeRatePct),
                            borderColor: '#ff3333',
                            backgroundColor: 'rgba(255, 51, 51, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            yAxisID: 'y'
                        },
                        {
                            label: 'Total Sent (000s)',
                            data: chartData.map(item => Math.round(item.totalSent / 1000)),
                            borderColor: '#e5e5e5',
                            backgroundColor: 'rgba(229, 229, 229, 0.1)',
                            borderWidth: 2,
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#444444',
                                font: {
                                    weight: 600
                                }
                            }
                        },
                        title: {
                            display: selectedRegions.length > 0,
                            text: chartTitle,
                            color: '#DB021D',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333333',
                            bodyColor: '#555555',
                            borderColor: '#DB021D',
                            borderWidth: 1,
                            padding: 12
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: '#d1d1d1'
                            },
                            ticks: {
                                color: '#555555',
                                font: {
                                    weight: 600
                                }
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: '#d1d1d1'
                            },
                            ticks: {
                                color: '#555555',
                                font: {
                                    weight: 600
                                },
                                callback: function(value) {
                                    return value + '%';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Percentage (%)',
                                color: '#444444'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false
                            },
                            ticks: {
                                color: '#555555',
                                font: {
                                    weight: 600
                                },
                                callback: function(value) {
                                    return value + 'k';
                                }
                            },
                            title: {
                                display: true,
                                text: 'Volume (000s)',
                                color: '#444444'
                            }
                        }
                    }
                }
            });
        }

        // Set default date range to last month (e.g., Oct 17 → Sept 17 to Oct 17)
        function setDefaultDateRange() {
            const today = new Date();
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(today.getMonth() - 1);
            
            // Format dates as YYYY-MM-DD for date inputs
            const formatDate = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };
            
            const dateFromInput = document.getElementById('dateFrom');
            const dateToInput = document.getElementById('dateTo');
            
            if (dateFromInput) dateFromInput.value = formatDate(oneMonthAgo);
            if (dateToInput) dateToInput.value = formatDate(today);
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize DOM cache first (PERFORMANCE OPTIMIZATION)
            initializeDOMCache();
            
            updateInfoBox();
            
            // Initialize global filters
            initializeGlobalFilters();
            
            // Initialize multi-select region filter for campaigns tab
            initializeRegionFilter('campaign');
            
            // Check URL for tab parameter
            const urlParams = new URLSearchParams(window.location.search);
            let initialTab = urlParams.get('tab') || 'overview';
            
            // Initialize the requested tab
            switchTab(initialTab);
            
            // Initialize content based on active tab
            if (initialTab === 'email') {
                setTimeout(function() {
                    setEmailPeriod('current-month', { target: document.querySelector('.period-btn.active') });
                }, 100);
            }
            
            // Initialize campaign tables and filters when data is available
            if (campaignMetricsData && campaignMetricsData.length > 0) {
                initializeCampaignDetails();
            } else {
                renderCampaignTable();
            }
            
            // Initialize signup performance section
            if (signupPerformanceData && signupPerformanceData.length > 0) {
                initializeSignupPerformance();
            }
            
            // Set default active button for grouping
            document.querySelectorAll('.chart-toggle').forEach(btn => {
                if (btn.textContent.toLowerCase().includes('daily')) {
                    btn.classList.add('active');
                }
            });
            
            // PERFORMANCE: Clean up will-change after animations complete
            setTimeout(function() {
                document.querySelectorAll('.stat-card').forEach(card => {
                    card.classList.add('animation-complete');
                });
            }, 1500); // After all fadeInUp animations complete (0.8s + 0.4s delay + buffer)
            
            // Make date inputs fully clickable
            const dateInputs = document.querySelectorAll('input[type="date"]');
            dateInputs.forEach(input => {
                input.addEventListener('click', function() {
                    try {
                        this.showPicker();
                    } catch(e) {
                        // Fallback for browsers that don't support showPicker
                        this.focus();
                        this.click();
                    }
                });
            });
        });

        // (BUGFIX) Timezone-safe date-key helpers.
        // The previous pattern - parseDate() building LOCAL midnight, then
        // .toISOString().split('T')[0] converting to UTC - shifted every date
        // key one day earlier for users east of UTC (BST/CEST, i.e. the whole
        // EMEA audience in summer): chart labels, week/month bucketing and the
        // month-preset date ranges were all a day out for half the year.
        function toLocalDateKey(date) {
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        function parseLocalDateKey(key) {
            const [y, m, d] = String(key).split('-').map(Number);
            return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        }

        function parseDate(dateStr) {
            if (!dateStr) return new Date();
            
            // Try parsing MM/DD/YYYY format (SFMC date format) - normalize to midnight local time
            const mmddyyyyMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
            if (mmddyyyyMatch) {
                const month = parseInt(mmddyyyyMatch[1]) - 1; // Months are 0-indexed
                const day = parseInt(mmddyyyyMatch[2]);
                const year = parseInt(mmddyyyyMatch[3]);
                // Use local time to avoid timezone shifts
                return new Date(year, month, day, 0, 0, 0, 0);
            }
            
            // Try parsing "DD Month YYYY HH:MM" format
            const months = {
                'January': 0, 'February': 1, 'March': 2, 'April': 3,
                'May': 4, 'June': 5, 'July': 6, 'August': 7,
                'September': 8, 'October': 9, 'November': 10, 'December': 11
            };
            
            const parts = dateStr.split(' ');
            if (parts.length >= 4) {
                const day = parseInt(parts[0]);
                const month = months[parts[1]];
                const year = parseInt(parts[2]);
                const timeParts = parts[3].split(':');
                const hours = parseInt(timeParts[0]) || 0;
                const minutes = parseInt(timeParts[1]) || 0;
                
                if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                    return new Date(year, month, day, hours, minutes);
                }
            }
            
            // Fallback to standard parsing
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date;
            }
            
            return new Date();
        }

        function formatDate(dateStr) {
            try {
                const date = parseDate(dateStr);
                const options = { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                };
                return date.toLocaleDateString('en-GB', options);
            } catch(e) {
                return dateStr || '';
            }
        }

        function formatDateOnly(dateStr) {
            try {
                const date = parseDate(dateStr);
                const options = { 
                    day: '2-digit', 
                    month: 'short', 
                    year: 'numeric'
                };
                return date.toLocaleDateString('en-GB', options);
            } catch(e) {
                return dateStr || '';
            }
        }

        function prepareChartData() {
            // Detect if a trade filter is active
            const activeTrade = (window.globalFilters && window.globalFilters.trade) || '';
            const useTradeData = activeTrade !== '';

            // Choose source data: trade-level when filtered, subscriber-level otherwise
            const sourceData = useTradeData ? filteredTradeData : filteredSubscriberData;

            // First, group all data by date (ignoring time) to sum regions
            const dataByDate = {};
            
            // Filter out GLOBAL region to prevent double-counting (GLOBAL is an aggregate of all regions)
            const dataWithoutGlobal = sourceData.filter(item => item.region !== 'GLOBAL');
            
            dataWithoutGlobal.forEach(item => {
                if (item && item.date && item.count != null) {
                    const date = parseDate(item.date);
                    // Use LOCAL date (not UTC) as key - see toLocalDateKey note
                    const dateKey = toLocalDateKey(date);
                    
                    if (!dataByDate[dateKey]) {
                        dataByDate[dateKey] = {
                            date: date,
                            regions: {},
                            total: 0
                        };
                    }
                    
                    // Keep the maximum count for each region on this date
                    if (!dataByDate[dateKey].regions[item.region] || item.count > dataByDate[dateKey].regions[item.region]) {
                        dataByDate[dateKey].regions[item.region] = item.count;
                    }
                }
            });
            
            // Calculate totals for each date
            Object.values(dataByDate).forEach(dateData => {
                dateData.total = Object.values(dateData.regions).reduce((sum, count) => sum + count, 0);
            });
            
            // Now group these daily totals by the display period (day/week/month)
            const dataByPeriod = {};
            
            Object.entries(dataByDate).forEach(([dateKey, dateData]) => {
                let periodKey;
                
                if (currentGrouping === 'month') {
                    const date = parseLocalDateKey(dateKey);
                    periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                } else if (currentGrouping === 'week') {
                    // Get the Monday of the week
                    const date = parseLocalDateKey(dateKey);
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                    const weekStart = new Date(date);
                    weekStart.setDate(diff);
                    periodKey = toLocalDateKey(weekStart);
                } else {
                    // Daily view - use the date as is
                    periodKey = dateKey;
                }
                
                // Keep the latest total for each period
                if (!dataByPeriod[periodKey] || dateData.date > dataByPeriod[periodKey].date) {
                    dataByPeriod[periodKey] = {
                        date: dateData.date,
                        total: dateData.total
                    };
                }
            });
            
            // Sort periods and prepare arrays
            const sortedPeriods = Object.keys(dataByPeriod).sort();
            const labels = sortedPeriods.map(period => {
                if (currentGrouping === 'month') {
                    const [year, month] = period.split('-');
                    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                } else if (currentGrouping === 'week') {
                    const weekStart = parseLocalDateKey(period);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    return `${weekStart.toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} - ${weekEnd.toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year: 'numeric'})}`;
                } else {
                    return parseLocalDateKey(period).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                }
            });
            const data = sortedPeriods.map(period => dataByPeriod[period].total);
            
            return { labels, data, periods: sortedPeriods };
        }

        // Chart.js plugin: vertical dashed annotation line for key events
        var eventAnnotationPlugin = {
            id: 'eventAnnotation',
            afterDraw: function(chart) {
                const annotations = chart.options.plugins.eventAnnotation;
                if (!annotations || !annotations.events || !annotations.events.length) return;

                const ctx = chart.ctx;
                const xScale = chart.scales.x;
                const yScale = chart.scales.y;

                annotations.events.forEach(function(evt) {
                    const idx = evt._index;
                    if (idx == null || idx < 0 || idx >= xScale.ticks.length) return;

                    const x = xScale.getPixelForValue(idx);
                    const yTop = yScale.top;
                    const yBottom = yScale.bottom;

                    // Draw dashed vertical line
                    ctx.save();
                    ctx.beginPath();
                    ctx.setLineDash(evt.dash || [6, 4]);
                    ctx.lineWidth = evt.lineWidth || 2;
                    ctx.strokeStyle = evt.color || '#555555';
                    ctx.moveTo(x, yTop);
                    ctx.lineTo(x, yBottom);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Draw label above chart
                    if (evt.label) {
                        ctx.font = 'bold 11px Helvetica Neue, Helvetica, Arial, sans-serif';
                        ctx.fillStyle = evt.labelColor || '#333333';
                        ctx.textAlign = 'center';
                        ctx.fillText(evt.label, x, yTop - 8);
                    }
                    ctx.restore();
                });
            }
        };

        // Register the annotation plugin (deferred to first updateChart call)
        var eventAnnotationPluginRegistered = false;

        // Key events to mark on the growth chart
        var CHART_EVENTS = [
            { dateKey: '2026-01-11', label: 'Non-Openers Removed (~200k)', color: '#555555', labelColor: '#333333', dash: [6, 4], lineWidth: 2 }
        ];

        // Find the chart index for an event date within the sorted period keys
        function findEventIndex(periods, eventDateKey, grouping) {
            const eventDate = new Date(eventDateKey + 'T00:00:00');
            if (grouping === 'day') {
                // Compare as dates to avoid UTC offset mismatches
                for (let i = 0; i < periods.length; i++) {
                    const periodDate = new Date(periods[i] + 'T00:00:00');
                    if (periodDate.getFullYear() === eventDate.getFullYear() &&
                        periodDate.getMonth() === eventDate.getMonth() &&
                        periodDate.getDate() === eventDate.getDate()) {
                        return i;
                    }
                }
                return -1;
            } else if (grouping === 'week') {
                // Find the week that contains the event date
                const eventDate = new Date(eventDateKey);
                for (let i = 0; i < periods.length; i++) {
                    const weekStart = new Date(periods[i]);
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekEnd.getDate() + 6);
                    if (eventDate >= weekStart && eventDate <= weekEnd) return i;
                }
                return -1;
            } else if (grouping === 'month') {
                return periods.indexOf(eventDateKey.substring(0, 7));
            }
            return -1;
        }

        // Build annotation objects for events that fall within current chart data
        function buildChartEventAnnotations(periods) {
            if (!CHART_EVENTS || !CHART_EVENTS.length) return [];
            const events = [];
            CHART_EVENTS.forEach(function(evt) {
                const idx = findEventIndex(periods, evt.dateKey, currentGrouping);
                if (idx >= 0) {
                    events.push(Object.assign({ _index: idx }, evt));
                }
            });
            return events;
        }

        function updateChart() {
            const ctx = document.getElementById('growthChart');
            if (!ctx) return;

            // Register annotation plugin once (deferred until Chart.js is loaded)
            if (!eventAnnotationPluginRegistered && typeof Chart !== 'undefined') {
                Chart.register(eventAnnotationPlugin);
                eventAnnotationPluginRegistered = true;
            }
            
            const chartData = prepareChartData();

            // Update chart title and dataset label based on trade filter
            const activeTrade = (window.globalFilters && window.globalFilters.trade) || '';
            const chartTitle = activeTrade
                ? activeTrade.replace(/_/g, ' ') + ' Subscriber Count Over Time'
                : 'Total Subscriber Count Over Time';
            const datasetLabel = activeTrade
                ? activeTrade.replace(/_/g, ' ') + ' Subscribers'
                : 'Total Subscriber Count';
            const titleEl = document.getElementById('growthChartTitle');
            if (titleEl) titleEl.textContent = chartTitle;
            
            growthChart = destroyChart(growthChart);
            
            initChartDefaults();

            // Build event annotations for the current period keys
            const eventAnnotations = buildChartEventAnnotations(chartData.periods);
            
            growthChart = new Chart(ctx, {
                type: currentChartType,
                data: {
                    labels: chartData.labels,
                    datasets: [{
                        label: datasetLabel,
                        data: chartData.data,
                        borderColor: '#ee0000',
                        backgroundColor: currentChartType === 'line' ? 'rgba(238, 0, 0, 0.1)' : 'rgba(238, 0, 0, 0.8)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#ee0000',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointHoverBackgroundColor: '#ffffff',
                        pointHoverBorderColor: '#ee0000',
                        pointHoverBorderWidth: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 20
                        }
                    },
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            titleColor: '#333333',
                            bodyColor: '#555555',
                            borderColor: '#DB021D',
                            borderWidth: 1,
                            padding: 12,
                            displayColors: false,
                            callbacks: {
                                label: function(context) {
                                    return 'Total Subscribers: ' + context.parsed.y.toLocaleString();
                                }
                            }
                        },
                        eventAnnotation: {
                            events: eventAnnotations
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: '#d1d1d1',
                                borderColor: '#999999'
                            },
                            ticks: {
                                color: '#555555',
                                font: {
                                    weight: 600
                                },
                                maxRotation: 45,
                                minRotation: 0
                            }
                        },
                        y: {
                            grid: {
                                color: '#d1d1d1',
                                borderColor: '#999999'
                            },
                            ticks: {
                                color: '#555555',
                                font: {
                                    weight: 600
                                },
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });

            // Update insight cards whenever chart updates
            updateGrowthInsightCards(chartData);
        }

        // ===== GROWTH INSIGHT CARDS =====
        function updateGrowthInsightCards(chartData) {
            if (!chartData || !chartData.data || chartData.data.length === 0) {
                document.getElementById('growthCurrentTotal').textContent = '-';
                document.getElementById('growthNetChange').innerHTML = '-';
                document.getElementById('growthRate').innerHTML = '-';
                document.getElementById('growthAvgDaily').textContent = '-';
                return;
            }

            const dataArr = chartData.data;
            const periods = chartData.periods;
            const latestTotal = dataArr[dataArr.length - 1];
            const earliestTotal = dataArr[0];
            const netChange = latestTotal - earliestTotal;
            const growthRatePct = earliestTotal > 0 ? ((netChange / earliestTotal) * 100) : 0;

            // Calculate number of days spanned for avg daily growth
            let dayCount = 1;
            if (periods.length >= 2) {
                const firstDate = new Date(periods[0]);
                const lastDate = new Date(periods[periods.length - 1]);
                dayCount = Math.max(1, Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
            }
            const avgDailyGrowth = Math.round(netChange / dayCount);

            // Current Total
            document.getElementById('growthCurrentTotal').textContent = latestTotal.toLocaleString();

            // Net Change with delta indicator
            const netSign = netChange >= 0 ? '+' : '';
            const netCls = netChange >= 0 ? 'positive' : 'negative';
            const netArrow = netChange >= 0 ? '&#9650;' : '&#9660;';
            document.getElementById('growthNetChange').innerHTML = netSign + netChange.toLocaleString() +
                ' <span class="growth-insight-delta ' + netCls + '"><span class="delta-arrow">' + netArrow + '</span></span>';

            // Growth Rate %
            const rateSigned = growthRatePct >= 0 ? '+' : '';
            const rateCls = growthRatePct >= 0 ? 'positive' : 'negative';
            const rateArrow = growthRatePct >= 0 ? '&#9650;' : '&#9660;';
            document.getElementById('growthRate').innerHTML = rateSigned + growthRatePct.toFixed(1) + '%' +
                ' <span class="growth-insight-delta ' + rateCls + '"><span class="delta-arrow">' + rateArrow + '</span></span>';

            // Avg Daily Growth
            const avgSign = avgDailyGrowth >= 0 ? '+' : '';
            document.getElementById('growthAvgDaily').textContent = avgSign + avgDailyGrowth.toLocaleString() + '/day';
        }

        function toggleChartType(type) {
            currentChartType = type;
            
            // Update button states
            document.querySelectorAll('.chart-toggle').forEach(btn => {
                if (btn.textContent.toLowerCase().includes(type)) {
                    btn.classList.add('active');
                } else if (btn.textContent.toLowerCase().includes('line') || btn.textContent.toLowerCase().includes('bar')) {
                    btn.classList.remove('active');
                }
            });
            
            updateChart();
        }

        function toggleChartGrouping(grouping) {
            currentGrouping = grouping;
            
            // Update button states
            document.querySelectorAll('.chart-toggle').forEach(btn => {
                const text = btn.textContent.toLowerCase();
                if ((grouping === 'day' && text.includes('daily')) ||
                    (grouping === 'week' && text.includes('weekly')) ||
                    (grouping === 'month' && text.includes('monthly'))) {
                    btn.classList.add('active');
                } else if (text.includes('daily') || text.includes('weekly') || text.includes('monthly')) {
                    btn.classList.remove('active');
                }
            });
            
            updateChart();
        }

        function renderTables() {
            renderSubscriberTable();
            renderTradeTable();
        }

        function getLatestSnapshot(data, dataType = 'subscriber') {
            // Memoization check (PERFORMANCE OPTIMIZATION)
            const cacheKey = dataType === 'trade' ? 'latestSnapshotTrade' : 'latestSnapshotSubscriber';
            const currentDataHash = getDataHash(data);
            
            if (isCacheValid(dataCache[cacheKey], currentDataHash)) {
                return dataCache[cacheKey].data;
            }
            
            // Group by date (ignoring time) to get the latest snapshot
            const byDate = {};
            
            data.forEach(item => {
                if (item && item.date) {
                    const itemDate = parseDate(item.date);
                    // Use LOCAL date string as key (YYYY-MM-DD) - see toLocalDateKey note
                    const dateKey = toLocalDateKey(itemDate);
                    
                    if (!byDate[dateKey]) {
                        byDate[dateKey] = {
                            date: itemDate,
                            items: []
                        };
                    }
                    byDate[dateKey].items.push(item);
                }
            });
            
            // For trade data, we need to find the most recent COMPLETE date
            // A complete trade snapshot should have at least 10 unique trades (we expect 16)
            const MIN_COMPLETE_TRADES = 10;
            
            // Find the latest date (with completeness check for trade data)
            let latestDate = null;
            
            if (dataType === 'trade') {
                // Sort dates descending (most recent first)
                const sortedDateKeys = Object.keys(byDate).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
                
                for (const dateKey of sortedDateKeys) {
                    const dateData = byDate[dateKey];
                    // Count unique trades for this date
                    const uniqueTrades = new Set(dateData.items.map(item => item.trade).filter(Boolean));
                    
                    if (uniqueTrades.size >= MIN_COMPLETE_TRADES) {
                        latestDate = parseLocalDateKey(dateKey);
                        break;
                    }
                }
                
                // Fallback to absolute latest if no complete date found
                if (!latestDate && sortedDateKeys.length > 0) {
                    latestDate = parseLocalDateKey(sortedDateKeys[0]);
                }
            } else {
                // For subscriber data, find the most recent COMPLETE date.
                // A partial snapshot (e.g. an automation still mid-run, or a truncated
                // retrieve) can leave the newest date with only a fraction of regions,
                // which would make the "total subscribers" callout under-report badly.
                // Guard against this by requiring the chosen date to have a region count
                // close to the maximum region count seen across all snapshots.
                const sortedDateKeys = Object.keys(byDate).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

                // Count distinct, meaningful regions for a given date.
                const regionCountFor = function(dateKey) {
                    const regions = new Set();
                    byDate[dateKey].items.forEach(item => {
                        const r = (item.region || '').toUpperCase();
                        if (r && r !== 'UNKNOWN' && r !== 'GLOBAL') {
                            regions.add(r);
                        }
                    });
                    return regions.size;
                };

                // Establish the expected "complete" region count from the best day.
                let maxRegionCount = 0;
                sortedDateKeys.forEach(dateKey => {
                    const c = regionCountFor(dateKey);
                    if (c > maxRegionCount) maxRegionCount = c;
                });

                // Require the chosen date to have at least 90% of the max region count
                // (allows minor day-to-day variation while rejecting partial snapshots).
                const MIN_COMPLETE_REGIONS = Math.max(1, Math.floor(maxRegionCount * 0.9));

                for (const dateKey of sortedDateKeys) {
                    if (regionCountFor(dateKey) >= MIN_COMPLETE_REGIONS) {
                        latestDate = parseLocalDateKey(dateKey);
                        break;
                    }
                }

                // Fallback to absolute latest if no complete date found.
                if (!latestDate && sortedDateKeys.length > 0) {
                    latestDate = parseLocalDateKey(sortedDateKeys[0]);
                }
            }
            
            // Get all items from the latest date
            const latestDateKey = latestDate ? toLocalDateKey(latestDate) : null;
            let latestItems = latestDateKey && byDate[latestDateKey] ? byDate[latestDateKey].items : [];
            
            // Deduplicate items - create a unique key based on region and trade (if exists)
            const uniqueItems = new Map();
            latestItems.forEach(item => {
                const key = `${item.region || ''}_${item.trade || ''}`;
                // Keep the item with the highest count
                if (!uniqueItems.has(key) || (item.count || 0) > (uniqueItems.get(key).count || 0)) {
                    uniqueItems.set(key, item);
                }
            });
            
            latestItems = Array.from(uniqueItems.values());
            
            // (BUGFIX) The region sort previously sat AFTER a duplicate return
            // statement and never ran; sort before caching so consumers always
            // receive alphabetically ordered snapshot rows.
            latestItems.sort((a, b) => {
                return (a.region || '').localeCompare(b.region || '');
            });

            // Cache the result (PERFORMANCE OPTIMIZATION)
            dataCache[cacheKey] = {
                data: latestItems,
                timestamp: Date.now(),
                dataHash: currentDataHash
            };
            
            return latestItems;
        }

        function getCountryName(countryCode) {
            const countryNames = {
                'GB': 'Great Britain',
                'US': 'United States',
                'DE': 'Germany',
                'FR': 'France',
                'ES': 'Spain',
                'IT': 'Italy',
                'NL': 'Netherlands',
                'BE': 'Belgium',
                'CH': 'Switzerland',
                'AT': 'Austria',
                'DK': 'Denmark',
                'SE': 'Sweden',
                'NO': 'Norway',
                'FI': 'Finland',
                'PL': 'Poland',
                'CZ': 'Czech Republic',
                'SK': 'Slovakia',
                'HU': 'Hungary',
                'RO': 'Romania',
                'BG': 'Bulgaria',
                'PT': 'Portugal',
                'LU': 'Luxembourg',
                'EE': 'Estonia',
                'LV': 'Latvia',
                'LT': 'Lithuania',
                'ZA': 'South Africa',
                'AE': 'UAE',
                'TR': 'Turkey'
            };
            return countryNames[countryCode] || countryCode;
        }

        function groupDataByCountry(data) {
            // Memoization check (PERFORMANCE OPTIMIZATION)
            const currentDataHash = getDataHash(data);
            
            if (isCacheValid(dataCache.groupedByCountry, currentDataHash)) {
                return dataCache.groupedByCountry.data;
            }
            
            const grouped = {};
            
            data.forEach(item => {
                if (item && item.region) {
                    // Extract country code from region (e.g., EN-GB -> GB)
                    const parts = item.region.split('-');
                    const countryCode = parts.length > 1 ? parts[1] : item.region;
                    
                    if (!grouped[countryCode]) {
                        grouped[countryCode] = {
                            name: getCountryName(countryCode),
                            items: [],
                            total: 0,
                            regionCount: new Set()
                        };
                    }
                    
                    grouped[countryCode].items.push(item);
                    grouped[countryCode].total += item.count || 0;
                    grouped[countryCode].regionCount.add(item.region);
                }
            });
            
            // Convert region count sets to numbers
            Object.values(grouped).forEach(country => {
                country.regionCount = country.regionCount.size;
            });
            
            // Cache the result (PERFORMANCE OPTIMIZATION)
            dataCache.groupedByCountry = {
                data: grouped,
                timestamp: Date.now(),
                dataHash: currentDataHash
            };
            
            return grouped;
        }

        function toggleCountryGroup(countryCode, tableType) {
            const header = document.getElementById(`${tableType}-header-${countryCode}`);
            const content = document.getElementById(`${tableType}-content-${countryCode}`);
            
            if (header && content) {
                header.classList.toggle('expanded');
                content.classList.toggle('expanded');
            }
        }

        function toggleAllGroups(tableType, expand) {
            const headers = document.querySelectorAll(`[id^="${tableType}-header-"]`);
            const contents = document.querySelectorAll(`[id^="${tableType}-content-"]`);
            
            headers.forEach(header => {
                if (expand) {
                    header.classList.add('expanded');
                } else {
                    header.classList.remove('expanded');
                }
            });
            
            contents.forEach(content => {
                if (expand) {
                    content.classList.add('expanded');
                } else {
                    content.classList.remove('expanded');
                }
            });
        }

        function renderSubscriberTable() {
            // Use cached DOM element
            const tableBody = DOM.subscriberTableBody || document.getElementById('subscriberTableBody');
            const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            let dataToRender = [];
            
            if (subscriberTableView === 'current') {
                // Show only the latest snapshot without accordion grouping
                dataToRender = latestSnapshotData;
                const paginationEl = DOM.subscriberPagination || document.getElementById('subscriberPagination');
                if (paginationEl) {
                    paginationEl.style.display = 'none';
                    paginationEl.classList.add('d-none');
                }
                
                // Clear table
                tableBody.innerHTML = '';
                
                if (dataToRender.length === 0) {
                    tableBody.innerHTML = '<div class="no-data">No data available for selected filters</div>';
                    renderSubscriberSnapshotChart(latestSnapshotData);
                    return;
                }
                
                // For current snapshot, render a simple table without accordion
                const table = document.createElement('table');
                table.className = 'simple-table';
                
                // Create table structure
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Total Subscriber Count</th>
                    </tr>
                `;
                const tbody = document.createElement('tbody');
                
                // Sort by region for better readability
                dataToRender.sort((a, b) => (a.region || '').localeCompare(b.region || ''));
                
                // Use DocumentFragment for batch DOM insertion (PERFORMANCE OPTIMIZATION)
                const fragment = document.createDocumentFragment();
                
                dataToRender.forEach(item => {
                    if (item) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${formatDate(item.date)}</td>
                            <td><span class="region-badge">${item.region || ''}</span></td>
                            <td class="count-cell">${(item.count || 0).toLocaleString()}</td>
                        `;
                        fragment.appendChild(row);
                    }
                });
                
                // Single DOM update (PERFORMANCE OPTIMIZATION)
                tbody.appendChild(fragment);
                table.appendChild(thead);
                table.appendChild(tbody);
                tableBody.appendChild(table);
            }

            renderSubscriberSnapshotChart(latestSnapshotData);
        }

        function renderTradeTable() {
            // Use cached DOM element (PERFORMANCE OPTIMIZATION)
            const tableBody = DOM.tradeTableBody || document.getElementById('tradeTableBody');
            const latestSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
            let dataToRender = [];
            
            if (tradeTableView === 'current') {
                // Show only the latest snapshot - sorted by region then trade
                dataToRender = latestSnapshotData;
                const paginationEl = DOM.tradePagination || document.getElementById('tradePagination');
                if (paginationEl) {
                    paginationEl.style.display = 'none';
                    paginationEl.classList.add('d-none');
                }
            } else {
                // Show historical data with pagination
                // Filter by country group based on selected regions
                const selectedRegionsList = getSelectedRegions('trade');
                
                let historicalData = filterTradeDataByCountryGroup(filteredTradeData, selectedRegionsList);
                
                // If specific regions selected, further filter to just those regions
                if (selectedRegionsList.length > 0) {
                    historicalData = historicalData.filter(item => 
                        item && selectedRegionsList.includes(item.region)
                    );
                }
                
                // Sort by date descending (newest first)
                dataToRender = historicalData.sort((a, b) => {
                    const dateA = parseDate(a.date);
                    const dateB = parseDate(b.date);
                    return dateB - dateA; // Newest first
                });
                const paginationEl = DOM.tradePagination || document.getElementById('tradePagination');
                if (paginationEl) {
                    paginationEl.style.display = 'flex';
                    paginationEl.classList.remove('d-none');  // Remove d-none class
                }
                renderPagination('trade', dataToRender.length);
                
                // Apply pagination
                const startIndex = (tradeCurrentPage - 1) * rowsPerPage;
                const endIndex = startIndex + rowsPerPage;
                dataToRender = dataToRender.slice(startIndex, endIndex);
            }
            
            // Clear table
            tableBody.innerHTML = '';
            
            // Handle empty data
            if (dataToRender.length === 0) {
                tableBody.innerHTML = '<div class="no-data">No data available for selected filters.</div>';
                renderTradeSnapshotChart(latestSnapshotData);
                return;
            }
            
            // Group data by country
            const groupedData = {};
            
            dataToRender.forEach(item => {
                if (item && item.region) {
                    // Extract country code from region
                    const parts = item.region.split('-');
                    const countryCode = parts.length > 1 ? parts[1] : item.region;
                    
                    if (!groupedData[countryCode]) {
                        groupedData[countryCode] = {
                            name: getCountryName(countryCode),
                            items: [],
                            total: 0,
                            tradeCount: new Set()
                        };
                    }
                    
                    groupedData[countryCode].items.push(item);
                    groupedData[countryCode].total += item.count || 0;
                    if (item.trade) {
                        groupedData[countryCode].tradeCount.add(item.trade);
                    }
                }
            });
            
            // Convert trade count sets to numbers
            Object.values(groupedData).forEach(country => {
                country.tradeCount = country.tradeCount.size;
            });
            
            // Sort countries alphabetically
            const sortedCountries = Object.keys(groupedData).sort((a, b) => 
                groupedData[a].name.localeCompare(groupedData[b].name)
            );
            
            // Use DocumentFragment for batch DOM insertion (PERFORMANCE OPTIMIZATION)
            const mainFragment = document.createDocumentFragment();
            
            // Render each country group
            sortedCountries.forEach((countryCode, index) => {
                const country = groupedData[countryCode];
                const isExpanded = index === 0; // Expand first country by default
                
                // Create country group container
                const groupDiv = document.createElement('div');
                groupDiv.className = 'country-group';
                
                // Create header
                const headerDiv = document.createElement('div');
                headerDiv.className = 'country-header' + (isExpanded ? ' expanded' : '');
                headerDiv.id = `trade-header-${countryCode}`;
                headerDiv.onclick = () => toggleCountryGroup(countryCode, 'trade');
                
                headerDiv.innerHTML = `
                    <div class="country-info">
                        <span class="expand-icon">▶</span>
                        <span class="country-name">${country.name}</span>
                    </div>
                    <div class="country-stats">
                        <div class="country-stat">
                            <span class="country-stat-value">${country.total.toLocaleString()}</span>
                            <span class="country-stat-label">Total</span>
                        </div>
                        <div class="country-stat">
                            <span class="country-stat-value">${country.tradeCount}</span>
                            <span class="country-stat-label">Trades</span>
                        </div>
                    </div>
                `;
                
                // Create content container
                const contentDiv = document.createElement('div');
                contentDiv.className = 'country-content' + (isExpanded ? ' expanded' : '');
                contentDiv.id = `trade-content-${countryCode}`;
                
                // Create table for this country's trades
                const table = document.createElement('table');
                table.className = 'country-table';
                
                // Deduplicate items within this country
                const uniqueItems = new Map();
                country.items.forEach(item => {
                    const key = `${item.region || ''}_${item.trade || ''}`;
                    // Keep the item with the highest count
                    if (!uniqueItems.has(key) || (item.count || 0) > (uniqueItems.get(key).count || 0)) {
                        uniqueItems.set(key, item);
                    }
                });
                
                // Convert back to array and sort by region then trade
                const deduplicatedItems = Array.from(uniqueItems.values());
                deduplicatedItems.sort((a, b) => {
                    const regionCompare = (a.region || '').localeCompare(b.region || '');
                    if (regionCompare !== 0) return regionCompare;
                    return (a.trade || '').localeCompare(b.trade || '');
                });
                
                // Use DocumentFragment for table rows (PERFORMANCE OPTIMIZATION)
                const rowFragment = document.createDocumentFragment();
                
                deduplicatedItems.forEach(item => {
                    const row = document.createElement('tr');
                    const tradeName = item.trade ? item.trade.replace(/_/g, ' ') : '';
                    row.innerHTML = `
                        <td style="width: 25%;">${formatDate(item.date)}</td>
                        <td style="width: 25%;"><span class="region-badge">${item.region || ''}</span></td>
                        <td style="width: 30%;"><span class="trade-badge">${tradeName}</span></td>
                        <td style="width: 20%;" class="count-cell">${(item.count || 0).toLocaleString()}</td>
                    `;
                    rowFragment.appendChild(row);
                });
                
                table.appendChild(rowFragment);
                contentDiv.appendChild(table);
                groupDiv.appendChild(headerDiv);
                groupDiv.appendChild(contentDiv);
                mainFragment.appendChild(groupDiv);
            });
            
            // Single DOM update (PERFORMANCE OPTIMIZATION)
            tableBody.appendChild(mainFragment);
            renderTradeSnapshotChart(latestSnapshotData);
        }

        function renderPagination(tableType, totalRows) {
            const totalPages = Math.ceil(totalRows / rowsPerPage);
            const currentPage = tableType === 'subscriber' ? subscriberCurrentPage : tradeCurrentPage;
            
            // Update page info using cached DOM elements (PERFORMANCE OPTIMIZATION)
            const pageInfoEl = tableType === 'subscriber' 
                ? (DOM.subscriberPageInfo || document.getElementById('subscriberPageInfo'))
                : (DOM.tradePageInfo || document.getElementById('tradePageInfo'));
            
            if (pageInfoEl) {
                pageInfoEl.textContent = `Page ${currentPage} of ${totalPages} (${totalRows} rows)`;
            }
            
            // Generate page controls using cached DOM elements (PERFORMANCE OPTIMIZATION)
            const controlsContainer = tableType === 'subscriber'
                ? (DOM.subscriberPageControls || document.getElementById('subscriberPageControls'))
                : (DOM.tradePageControls || document.getElementById('tradePageControls'));
            
            if (!controlsContainer) return;
            
            controlsContainer.innerHTML = '';
            
            // Use DocumentFragment for batch DOM insertion (PERFORMANCE OPTIMIZATION)
            const fragment = document.createDocumentFragment();
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'page-btn';
            prevBtn.textContent = '←';
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => changePage(tableType, currentPage - 1);
            fragment.appendChild(prevBtn);
            
            // Page number buttons (show max 5 pages)
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'page-btn';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.onclick = () => changePage(tableType, i);
                fragment.appendChild(pageBtn);
            }
            
            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'page-btn';
            nextBtn.textContent = '→';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => changePage(tableType, currentPage + 1);
            fragment.appendChild(nextBtn);
            
            // Single DOM update (PERFORMANCE OPTIMIZATION)
            controlsContainer.appendChild(fragment);
        }

        function changePage(tableType, newPage) {
            if (tableType === 'subscriber') {
                subscriberCurrentPage = newPage;
                renderSubscriberTable();
            } else {
                tradeCurrentPage = newPage;
                renderTradeTable();
            }
        }

        // Growth tab render functions
        function renderGrowthSubscriberTable() {
            const tableBody = document.getElementById('growthSubscriberTableBody');
            if (!tableBody) return;
            
            const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            let dataToRender = [];
            
            if (subscriberTableView === 'current') {
                dataToRender = latestSnapshotData;
                const paginationEl = document.getElementById('growthSubscriberPagination');
                if (paginationEl) {
                    paginationEl.style.display = 'none';
                    paginationEl.classList.add('d-none');
                }
                
                tableBody.innerHTML = '';
                
                if (dataToRender.length === 0) {
                    tableBody.innerHTML = '<div class="no-data">No data available for selected filters</div>';
                    return;
                }
                
                const table = document.createElement('table');
                table.className = 'simple-table';
                
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Total Subscriber Count</th>
                    </tr>
                `;
                const tbody = document.createElement('tbody');
                
                dataToRender.sort((a, b) => (a.region || '').localeCompare(b.region || ''));
                
                const fragment = document.createDocumentFragment();
                
                dataToRender.forEach(item => {
                    if (item) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${formatDate(item.date)}</td>
                            <td><span class="region-badge">${item.region || ''}</span></td>
                            <td class="count-cell">${(item.count || 0).toLocaleString()}</td>
                        `;
                        fragment.appendChild(row);
                    }
                });
                
                tbody.appendChild(fragment);
                table.appendChild(thead);
                table.appendChild(tbody);
                tableBody.appendChild(table);
                
            } else {
                // Historical view - simplified version for Growth tab
                dataToRender = [...filteredSubscriberData].sort((a, b) => {
                    const dateA = parseDate(a.date);
                    const dateB = parseDate(b.date);
                    return dateB - dateA;
                });
                
                tableBody.innerHTML = '';
                
                if (dataToRender.length === 0) {
                    tableBody.innerHTML = '<div class="no-data">No data available for selected filters</div>';
                    return;
                }
                
                const table = document.createElement('table');
                table.className = 'simple-table';
                
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Total Subscriber Count</th>
                    </tr>
                `;
                const tbody = document.createElement('tbody');
                
                const fragment = document.createDocumentFragment();
                
                dataToRender.forEach(item => {
                    if (item) {
                        const row = document.createElement('tr');
                        row.innerHTML = `
                            <td>${formatDate(item.date)}</td>
                            <td><span class="region-badge">${item.region || ''}</span></td>
                            <td class="count-cell">${(item.count || 0).toLocaleString()}</td>
                        `;
                        fragment.appendChild(row);
                    }
                });
                
                tbody.appendChild(fragment);
                table.appendChild(thead);
                table.appendChild(tbody);
                tableBody.appendChild(table);
            }
        }

        function renderGrowthTradeTable() {
            const tableBody = document.getElementById('growthTradeTableBody');
            if (!tableBody) return;
            
            const latestSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
            
            // Filter by selected regions
            let filteredData = latestSnapshotData;
            const selectedRegions = getSelectedRegions('growthTrade');
            if (selectedRegions.length > 0) {
                filteredData = latestSnapshotData.filter(item => 
                    item && selectedRegions.includes(item.region)
                );
            }
            
            let dataToRender = [];
            
            if (tradeTableView === 'current') {
                dataToRender = filteredData;
                const paginationEl = document.getElementById('growthTradePagination');
                if (paginationEl) {
                    paginationEl.style.display = 'none';
                    paginationEl.classList.add('d-none');
                }
                
                tableBody.innerHTML = '';
                
                if (dataToRender.length === 0) {
                    tableBody.innerHTML = '<div class="no-data">No data available for selected filters</div>';
                    return;
                }
                
                const table = document.createElement('table');
                table.className = 'simple-table';
                
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Trade</th>
                        <th>Total Subscriber Count</th>
                    </tr>
                `;
                const tbody = document.createElement('tbody');
                
                dataToRender.sort((a, b) => {
                    const regionCompare = (a.region || '').localeCompare(b.region || '');
                    if (regionCompare !== 0) return regionCompare;
                    return (a.trade || '').localeCompare(b.trade || '');
                });
                
                const fragment = document.createDocumentFragment();
                
                dataToRender.forEach(item => {
                    if (item) {
                        const row = document.createElement('tr');
                        const tradeName = item.trade ? item.trade.replace(/_/g, ' ') : '';
                        row.innerHTML = `
                            <td>${formatDate(item.date)}</td>
                            <td><span class="region-badge">${item.region || ''}</span></td>
                            <td><span class="trade-badge">${tradeName}</span></td>
                            <td class="count-cell">${(item.count || 0).toLocaleString()}</td>
                        `;
                        fragment.appendChild(row);
                    }
                });
                
                tbody.appendChild(fragment);
                table.appendChild(thead);
                table.appendChild(tbody);
                tableBody.appendChild(table);
                
            } else {
                // Historical view - COUNTRY-SILOED: Filter by country group to reduce data volume
                const selectedRegionsList = getSelectedRegions('growthTrade');
                
                // Use country-group filtering for better performance
                let allTradeData = filterTradeDataByCountryGroup(filteredTradeData, selectedRegionsList);
                
                // If specific regions selected, further filter to just those regions
                if (selectedRegionsList.length > 0) {
                    allTradeData = allTradeData.filter(item => 
                        item && selectedRegionsList.includes(item.region)
                    );
                }
                
                dataToRender = allTradeData.sort((a, b) => {
                    const dateA = parseDate(a.date);
                    const dateB = parseDate(b.date);
                    return dateB - dateA;
                });
                
                tableBody.innerHTML = '';
                
                if (dataToRender.length === 0) {
                    tableBody.innerHTML = '<div class="no-data">No data available for selected filters. Try selecting a region to view historical trade data.</div>';
                    return;
                }
                
                const table = document.createElement('table');
                table.className = 'simple-table';
                
                const thead = document.createElement('thead');
                thead.innerHTML = `
                    <tr>
                        <th>Date</th>
                        <th>Region</th>
                        <th>Trade</th>
                        <th>Total Subscriber Count</th>
                    </tr>
                `;
                const tbody = document.createElement('tbody');
                
                const fragment = document.createDocumentFragment();
                
                dataToRender.forEach(item => {
                    if (item) {
                        const row = document.createElement('tr');
                        const tradeName = item.trade ? item.trade.replace(/_/g, ' ') : '';
                        row.innerHTML = `
                            <td>${formatDate(item.date)}</td>
                            <td><span class="region-badge">${item.region || ''}</span></td>
                            <td><span class="trade-badge">${tradeName}</span></td>
                            <td class="count-cell">${(item.count || 0).toLocaleString()}</td>
                        `;
                        fragment.appendChild(row);
                    }
                });
                
                tbody.appendChild(fragment);
                table.appendChild(thead);
                table.appendChild(tbody);
                tableBody.appendChild(table);
            }
        }

        // Note: Historical data sub-tabs functions removed (createHistorySubTabs, loadHistoryForGroup, 
        // checkPendingHistoryRequest, clearPendingHistoryRequest, cookie helpers). 
        // The dashboard now only shows 7-day recent data.

        function toggleTableView(tableType, view) {
            // Clear cache when view changes (PERFORMANCE OPTIMIZATION)
            clearDataCache();
            
            // Update view state
            if (tableType === 'subscriber' || tableType === 'growthSubscriber') {
                subscriberTableView = view;
                subscriberCurrentPage = 1; // Reset to first page
            } else {
                tradeTableView = view;
                tradeCurrentPage = 1; // Reset to first page
            }
            
            // Update button states - only for view toggle buttons
            const tableBody = document.getElementById(`${tableType}TableBody`);
            const container = tableBody ? tableBody.closest('.data-section') : null;
            const buttons = container ? container.querySelectorAll('.view-btn') : [];
            
            if (tableType === 'subscriber' || tableType === 'growthSubscriber') {
                buttons.forEach(btn => {
                    const btnView = btn.getAttribute('data-view');
                    if (!btnView) {
                        return;
                    }
                    if (btnView === 'historical') {
                        if (view === 'historical') {
                            btn.classList.add('active');
                        } else {
                            btn.classList.remove('active');
                        }
                    } else if (view === 'historical' && (btnView === 'chart' || btnView === 'table')) {
                        btn.classList.remove('active');
                    }
                });
            } else {
                buttons.forEach(btn => {
                    const btnText = btn.textContent.toLowerCase();
                    if ((view === 'current' && btnText.includes('current')) || 
                        (view === 'historical' && btnText.includes('historical'))) {
                        btn.classList.add('active');
                    } else if (btnText.includes('current') || btnText.includes('historical')) {
                        btn.classList.remove('active');
                    }
                    // Don't change active state for Expand/Collapse buttons
                });
            }
            
            // Show/hide Expand/Collapse buttons for subscriber table
            if (tableType === 'subscriber' || tableType === 'growthSubscriber') {
                const expandBtns = container ? container.querySelectorAll('.view-btn') : [];
                expandBtns.forEach(btn => {
                    if (btn.textContent.includes('Expand') || btn.textContent.includes('Collapse')) {
                        btn.style.display = view === 'current' ? 'none' : 'block';
                    }
                });
            }
            
            // Re-render the appropriate table
            if (tableType === 'subscriber') {
                renderSubscriberTable();
            } else if (tableType === 'growthSubscriber') {
                renderGrowthSubscriberTable();
            } else if (tableType === 'growthTrade') {
                renderGrowthTradeTable();
            } else {
                renderTradeTable();
            }
        }

        function updateStats() {
            // Memoization check (PERFORMANCE OPTIMIZATION)
            const subscriberHash = getDataHash(filteredSubscriberData);
            const tradeHash = getDataHash(filteredTradeData);
            const combinedHash = `${subscriberHash}_${tradeHash}`;
            
            if (isCacheValid(dataCache.stats, combinedHash)) {
                // Use cached values
                const cached = dataCache.stats.data;
                const totalSubsEl = DOM.totalSubscribers || document.getElementById('totalSubscribers');
                if (totalSubsEl) totalSubsEl.textContent = cached.totalSubscribers.toLocaleString();
                
                const totalRegionsEl = DOM.totalRegions || document.getElementById('totalRegions');
                if (totalRegionsEl) totalRegionsEl.textContent = cached.totalRegions;
                
                const totalTradesEl = DOM.totalTrades || document.getElementById('totalTrades');
                if (totalTradesEl) totalTradesEl.textContent = cached.totalTrades;
                
                const avgSubsEl = DOM.avgSubscribers || document.getElementById('avgSubscribers');
                if (avgSubsEl) avgSubsEl.textContent = cached.avgSubscribers.toLocaleString();
                
                return;
            }
            
            // Group all data by date (ignoring time) for CURRENT period
            const dataByDate = {};
            
            filteredSubscriberData.forEach(item => {
                if (item && item.date && item.count != null) {
                    const itemDate = parseDate(item.date);
                    const normalizedRegion = normalizeRegionCode(item.region);
                    if (!normalizedRegion || normalizedRegion === 'UNKNOWN' || normalizedRegion === 'GLOBAL') {
                        return;
                    }
                    const dateKey = toLocalDateKey(itemDate); // Local date only
                    
                    if (!dataByDate[dateKey]) {
                        dataByDate[dateKey] = {
                            date: itemDate,
                            regions: {},
                            total: 0
                        };
                    }
                    
                    // Keep the latest count for each region on this date
                    if (!dataByDate[dateKey].regions[normalizedRegion] || item.count > dataByDate[dateKey].regions[normalizedRegion]) {
                        dataByDate[dateKey].regions[normalizedRegion] = item.count;
                    }
                }
            });
            
            // Calculate totals for each date
            Object.values(dataByDate).forEach(dateData => {
                dateData.total = Object.values(dateData.regions).reduce((sum, count) => sum + count, 0);
            });
            
            // Find the most recent date in current period
            let latestSnapshot = null;
            Object.values(dataByDate).forEach(snapshot => {
                if (!latestSnapshot || snapshot.date > latestSnapshot.date) {
                    latestSnapshot = snapshot;
                }
            });
            
            // Use the total from the latest snapshot
            const totalSubscribers = latestSnapshot ? latestSnapshot.total : 0;
            const totalSubsEl = DOM.totalSubscribers || document.getElementById('totalSubscribers');
            if (totalSubsEl) totalSubsEl.textContent = totalSubscribers.toLocaleString();

            // Calculate unique regions across all data (case-insensitive to avoid double counting)
            // Exclude regions: 0, RU, WW
            const excludedRegions = ['0', 'RU', 'WW'];
            const uniqueRegions = new Set();
            filteredSubscriberData.forEach(item => {
                if (item && item.region) {
                    const normalized = normalizeRegionCode(item.region);
                    if (normalized && normalized !== 'UNKNOWN') {
                        // Check if region should be excluded
                        const isExcluded = excludedRegions.includes(normalized) || 
                                          excludedRegions.some(excluded => normalized.endsWith('-' + excluded));
                        if (!isExcluded) {
                            uniqueRegions.add(normalized);
                        }
                    }
                }
            });
            const latestRegions = latestSnapshot ? Object.keys(latestSnapshot.regions || {}).filter(region => {
                const isExcluded = excludedRegions.includes(region) || 
                                  excludedRegions.some(excluded => region.endsWith('-' + excluded));
                return !isExcluded;
            }) : [];
            const totalRegions = latestRegions.length > 0 ? latestRegions.length : uniqueRegions.size;
            const totalRegionsEl = DOM.totalRegions || document.getElementById('totalRegions');
            if (totalRegionsEl) totalRegionsEl.textContent = totalRegions;

            // Calculate unique trades
            const uniqueTrades = new Set();
            filteredTradeData.forEach(item => {
                if (item && item.trade) uniqueTrades.add(item.trade);
            });
            const totalTrades = uniqueTrades.size;
            const totalTradesEl = DOM.totalTrades || document.getElementById('totalTrades');
            if (totalTradesEl) totalTradesEl.textContent = totalTrades;

            // Calculate average per region using latest snapshot
            let avgSubscribers = 0;
            const avgSubsEl = DOM.avgSubscribers || document.getElementById('avgSubscribers');
            if (latestSnapshot && latestSnapshot.regions) {
                const regionCounts = Object.values(latestSnapshot.regions);
                avgSubscribers = regionCounts.length > 0 
                    ? Math.round(latestSnapshot.total / regionCounts.length)
                    : 0;
                if (avgSubsEl) avgSubsEl.textContent = avgSubscribers.toLocaleString();
            } else {
                if (avgSubsEl) avgSubsEl.textContent = '0';
            }
            
            // Cache the computed values (PERFORMANCE OPTIMIZATION)
            dataCache.stats = {
                data: {
                    totalSubscribers,
                    totalRegions,
                    totalTrades,
                    avgSubscribers
                },
                timestamp: Date.now(),
                dataHash: combinedHash
            };
        }

        // ==================================================================================
        // == STAT DETAILS POPUP FUNCTIONS                                                ==
        // ==================================================================================

        // Show stat details popup
        function showStatDetails(type) {
            log('showStatDetails called with type:', type);
            
            const overlay = document.getElementById('statDetailsOverlay');
            const popup = document.getElementById('statDetailsPopup');
            const title = document.getElementById('statDetailsTitle');
            const content = document.getElementById('statDetailsContent');
            
            if (!overlay || !popup || !title || !content) {
                console.error('Popup elements not found');
                return;
            }
            
            // Clear previous content
            content.innerHTML = '';
            
            if (type === 'regions') {
                title.textContent = 'Regions with Subscribers';
                const regionData = getRegionDetails();
                const excludedRegionData = getExcludedRegionDetails();
                
                if (regionData.length === 0 && excludedRegionData.length === 0) {
                    content.innerHTML = '<div style="text-align: center; color: #666; grid-column: 1/-1;">No region data available</div>';
                } else {
                    // Group regions by country
                    const groupedByCountry = {};
                    const excludedGroupedByCountry = {};
                    
                    regionData.forEach(item => {
                        const parts = item.region.split('-');
                        const countryCode = parts.length > 1 ? parts[1] : item.region;
                        const countryName = getCountryName(countryCode);
                        
                        if (!groupedByCountry[countryName]) {
                            groupedByCountry[countryName] = [];
                        }
                        groupedByCountry[countryName].push(item);
                    });
                    
                    excludedRegionData.forEach(item => {
                        const parts = item.region.split('-');
                        const countryCode = parts.length > 1 ? parts[1] : item.region;
                        const countryName = getCountryName(countryCode);
                        
                        if (!excludedGroupedByCountry[countryName]) {
                            excludedGroupedByCountry[countryName] = [];
                        }
                        excludedGroupedByCountry[countryName].push(item);
                    });
                    
                    // Sort countries and render active regions first
                    Object.keys(groupedByCountry).sort().forEach(country => {
                        const regions = groupedByCountry[country];
                        const totalCount = regions.reduce((sum, r) => sum + r.count, 0);
                        
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'stat-detail-item';
                        itemDiv.innerHTML = `
                            <strong>${country}</strong>
                            <span class="stat-detail-count">${regions.length} region${regions.length > 1 ? 's' : ''} • ${totalCount.toLocaleString()} subscribers</span>
                        `;
                        content.appendChild(itemDiv);
                    });
                    
                    // Then render excluded regions in grey
                    if (excludedRegionData.length > 0) {
                        Object.keys(excludedGroupedByCountry).sort().forEach(country => {
                            const regions = excludedGroupedByCountry[country];
                            const totalCount = regions.reduce((sum, r) => sum + r.count, 0);
                            
                            const itemDiv = document.createElement('div');
                            itemDiv.className = 'stat-detail-item';
                            itemDiv.style.opacity = '0.4';
                            itemDiv.style.borderLeftColor = '#999';
                            itemDiv.innerHTML = `
                                <strong>${country} (excluded)</strong>
                                <span class="stat-detail-count">${regions.length} region${regions.length > 1 ? 's' : ''} • ${totalCount.toLocaleString()} subscribers</span>
                            `;
                            content.appendChild(itemDiv);
                        });
                    }
                }
                
            } else if (type === 'trades') {
                title.textContent = 'Primary Trades';
                const tradeData = getTradeDetails();
                
                if (tradeData.length === 0) {
                    content.innerHTML = '<div style="text-align: center; color: #666; grid-column: 1/-1;">No trade data available</div>';
                } else {
                    // Sort trades by count descending
                    tradeData.sort((a, b) => b.count - a.count);
                    
                    tradeData.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'stat-detail-item';
                        const tradeName = item.trade.replace(/_/g, ' ');
                        itemDiv.innerHTML = `
                            <strong>${tradeName}</strong>
                            <span class="stat-detail-count">${item.count.toLocaleString()} subscribers</span>
                        `;
                        content.appendChild(itemDiv);
                    });
                }
            }
            
            // Show popup with animation
            overlay.classList.add('show');
            popup.classList.add('show');
            
            // Prevent body scroll when popup is open
            document.body.style.overflow = 'hidden';
        }
        
        // Hide stat details popup
        function hideStatDetails() {
            const overlay = document.getElementById('statDetailsOverlay');
            const popup = document.getElementById('statDetailsPopup');
            
            if (overlay) overlay.classList.remove('show');
            if (popup) popup.classList.remove('show');
            
            // Restore body scroll
            document.body.style.overflow = '';
        }
        
        // Get region details from latest snapshot
        function getRegionDetails() {
            const latestSnapshot = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            const regionMap = new Map();
            const excludedRegions = ['0', 'RU', 'WW'];
            
            latestSnapshot.forEach(item => {
                if (item && item.region && item.region !== 'UNKNOWN' && item.region !== 'GLOBAL') {
                    const normalized = normalizeRegionCode(item.region);
                    if (normalized && normalized !== 'UNKNOWN' && normalized !== 'GLOBAL') {
                        // Check if this is an excluded region
                        const isExcluded = excludedRegions.includes(normalized) || 
                                          excludedRegions.some(excluded => normalized.endsWith('-' + excluded));
                        
                        // Only include if NOT excluded
                        if (!isExcluded) {
                            const existing = regionMap.get(normalized) || 0;
                            regionMap.set(normalized, existing + (item.count || item.totalSubscribers || 0));
                        }
                    }
                }
            });
            
            return Array.from(regionMap.entries()).map(([region, count]) => ({
                region: region,
                count: count
            }));
        }
        
        // Get excluded region details (0, RU, WW) from latest snapshot
        function getExcludedRegionDetails() {
            const latestSnapshot = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            const regionMap = new Map();
            const excludedRegions = ['0', 'RU', 'WW'];
            
            latestSnapshot.forEach(item => {
                if (item && item.region) {
                    const normalized = normalizeRegionCode(item.region);
                    // Check if this is an excluded region or contains excluded country codes
                    const isExcluded = excludedRegions.includes(normalized) || 
                                      excludedRegions.some(excluded => normalized && normalized.endsWith('-' + excluded));
                    
                    if (isExcluded) {
                        const existing = regionMap.get(normalized) || 0;
                        regionMap.set(normalized, existing + (item.count || item.totalSubscribers || 0));
                    }
                }
            });
            
            return Array.from(regionMap.entries()).map(([region, count]) => ({
                region: region,
                count: count
            }));
        }
        
        // Get trade details from latest snapshot
        function getTradeDetails() {
            const latestSnapshot = getLatestSnapshot(filteredTradeData, 'trade');
            const tradeMap = new Map();
            
            latestSnapshot.forEach(item => {
                if (item && item.trade && item.trade !== 'UNKNOWN') {
                    const existing = tradeMap.get(item.trade) || 0;
                    tradeMap.set(item.trade, existing + (item.count || 0));
                }
            });
            
            return Array.from(tradeMap.entries()).map(([trade, count]) => ({
                trade: trade,
                count: count
            }));
        }
        
        // Add escape key handler for popup
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape') {
                hideStatDetails();
            }
        });

        // ==================================================================================
        // == CAMPAIGN DETAILS FUNCTIONS (Combined View)                                  ==
        // ==================================================================================

        // Helper function to parse campaign dates into YYYY-MM-DD format
        function parseCampaignDate(dateString) {
            if (!dateString) return '';
            
            // Try to parse the date
            let date;
            
            // Check if it's already in ISO format (YYYY-MM-DD or with time)
            if (dateString.includes('-')) {
                date = new Date(dateString);
            } else if (dateString.includes('/')) {
                // Handle MM/DD/YYYY or M/D/YYYY format (US format)
                date = new Date(dateString);
            } else {
                // Fallback: try to parse as-is
                date = new Date(dateString);
            }
            
            // Check if date is valid
            if (isNaN(date.getTime())) {
                console.warn('Invalid date:', dateString);
                return '';
            }
            
            // Return in YYYY-MM-DD format
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        }

        function initializeCampaignDetails() {
            // Populate region filter
            const regionFilter = document.getElementById('campaignRegionFilter');
            if (regionFilter) {
                const sourceData = campaignDataAfterGlobalFilters.length > 0 ? campaignDataAfterGlobalFilters : campaignMetricsData;
                const uniqueRegions = [...new Set(sourceData.map(c => c.region))].sort();
                regionFilter.innerHTML = '<option value="">All Regions</option>';
                uniqueRegions.forEach(region => {
                    const option = document.createElement('option');
                    option.value = region;
                    option.textContent = region;
                    regionFilter.appendChild(option);
                });
            }

            // Set default date range (last 30 days)
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(today.getDate() - 30);
            
            const startDateInput = document.getElementById('campaignStartDate');
            const endDateInput = document.getElementById('campaignEndDate');
            
            if (startDateInput) {
                startDateInput.value = toLocalDateKey(thirtyDaysAgo);
            }
            if (endDateInput) {
                endDateInput.value = toLocalDateKey(today);
            }

            // Initial render
            filterCampaigns();
            
            // Set initial sort indicator on Send Date column (descending)
            setTimeout(() => {
                const sendDateHeader = Array.from(document.querySelectorAll('#campaignTable th.sortable')).find(
                    th => th.textContent.includes('Send Date')
                );
                if (sendDateHeader) {
                    sendDateHeader.classList.add('sort-desc');
                }
            }, 0);
        }

        function filterCampaigns() {
            const searchTerm = document.getElementById('campaignSearchInput')?.value.toLowerCase() || '';
            const selectedRegions = getSelectedRegions('campaign'); // Changed from single region
            const startDate = document.getElementById('campaignStartDate')?.value || '';
            const endDate = document.getElementById('campaignEndDate')?.value || '';
            const hideTestSends = document.getElementById('hideTestSends')?.checked || false;

            const sourceData = Array.isArray(campaignDataAfterGlobalFilters)
                ? campaignDataAfterGlobalFilters
                : campaignMetricsData;

            filteredCampaignData = sourceData.filter(campaign => {
                // Search filter
                const matchesSearch = !searchTerm || 
                    campaign.emailName.toLowerCase().includes(searchTerm) || 
                    campaign.emailSubject.toLowerCase().includes(searchTerm);

                // Region filter - Changed: Check if campaign region is in selected regions array
                const matchesRegion = selectedRegions.length === 0 || selectedRegions.includes(campaign.region);

                // Date filter - uses the pre-parsed ISO date from the initial map
                const campaignDate = campaign.sendDateISO;
                const matchesStartDate = !startDate || campaignDate >= startDate;
                const matchesEndDate = !endDate || campaignDate <= endDate;

                // Test send filter - hide campaigns with [Test], [Draft] in name, or only 1 recipient
                let isNotTestSend = true;
                if (hideTestSends) {
                    const emailNameLower = (campaign.emailName || '').toLowerCase();
                    const hasTestKeyword = emailNameLower.includes('[test]') || 
                                          emailNameLower.includes('[draft]') ||
                                          emailNameLower.includes('test]') ||
                                          emailNameLower.includes('draft]');
                    const isSingleRecipient = campaign.totalSent === 1;
                    isNotTestSend = !hasTestKeyword && !isSingleRecipient;
                }

                return matchesSearch && matchesRegion && matchesStartDate && matchesEndDate && isNotTestSend;
            });

            currentCampaignPage = 1; // Reset to first page
            renderCampaignTable();
            updateCampaignLookbackWarning(startDate);
        }

        // Shows the "filter extends beyond loaded data" banner only when the
        // user's From Date is older than the server-side lookback window used
        // when retrieving Send_Fact records.
        function updateCampaignLookbackWarning(startDate) {
            const banner = document.getElementById('campaignLimitWarning');
            if (!banner) return;
            const cutoff = (typeof sendFactLookbackDate !== 'undefined') ? sendFactLookbackDate : '';
            const days = (typeof sendFactLookbackDays !== 'undefined') ? sendFactLookbackDays : 0;
            if (cutoff && startDate && startDate < cutoff) {
                const dateEl = document.getElementById('campaignLookbackDate');
                const daysEl = document.getElementById('campaignLookbackDays');
                if (dateEl) dateEl.textContent = cutoff;
                if (daysEl) daysEl.textContent = days;
                banner.style.display = 'block';
            } else {
                banner.style.display = 'none';
            }
        }

        function sortCampaigns(column) {
            // Toggle sort direction if same column, otherwise default to descending
            if (campaignSortColumn === column) {
                campaignSortDirection = campaignSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                campaignSortColumn = column;
                campaignSortDirection = column === 'sendDate' ? 'desc' : 'asc';
            }

            // Sort the filtered data
            filteredCampaignData.sort((a, b) => {
                let aVal = a[column];
                let bVal = b[column];

                // Special handling for date columns
                if (column === 'sendDate') {
                    aVal = new Date(aVal);
                    bVal = new Date(bVal);
                    // Date comparison
                    if (aVal < bVal) return campaignSortDirection === 'asc' ? -1 : 1;
                    if (aVal > bVal) return campaignSortDirection === 'asc' ? 1 : -1;
                    return 0;
                }

                // Handle string comparison
                if (typeof aVal === 'string') {
                    aVal = aVal.toLowerCase();
                    bVal = bVal.toLowerCase();
                }

                if (aVal < bVal) return campaignSortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return campaignSortDirection === 'asc' ? 1 : -1;
                return 0;
            });

            // Update column headers
            document.querySelectorAll('#campaignTable th.sortable').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            const sortedTh = Array.from(document.querySelectorAll('#campaignTable th.sortable')).find(
                th => th.textContent.includes(getColumnDisplayName(column))
            );
            if (sortedTh) {
                sortedTh.classList.add(`sort-${campaignSortDirection}`);
            }

            renderCampaignTable();
        }

        function getColumnDisplayName(column) {
            const displayNames = {
                'sendDate': 'Send Date',
                'emailName': 'Email Name',
                'emailSubject': 'Subject',
                'region': 'Region',
                'totalSent': 'Total Sent',
                'deliveryRate': 'Delivery %',
                'openRate': 'Open %',
                'clickRate': 'Click %',
                'clickToOpenRate': 'CTOR %',
                'unsubscribeRate': 'Unsub %'
            };
            return displayNames[column] || column;
        }

        function renderCampaignTable() {
            // Use cached DOM element (PERFORMANCE OPTIMIZATION)
            const tbody = DOM.campaignTableBody || document.getElementById('campaignTableBody');
            if (!tbody) return;

            // Calculate pagination
            const totalCampaigns = filteredCampaignData.length;
            const totalPages = Math.ceil(totalCampaigns / campaignsPerPage);
            const startIdx = (currentCampaignPage - 1) * campaignsPerPage;
            const endIdx = Math.min(startIdx + campaignsPerPage, totalCampaigns);
            const pageData = filteredCampaignData.slice(startIdx, endIdx);

            // Render table rows
            if (pageData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" class="campaign-no-data">No campaigns found matching your criteria</td></tr>';
            } else {
                // Use DocumentFragment for batch DOM insertion (PERFORMANCE OPTIMIZATION)
                const fragment = document.createDocumentFragment();
                
                pageData.forEach(campaign => {
                    const sendDate = campaign.sendDateISO;
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${sendDate}</td>
                        <td><div class="campaign-email-name" title="${escapeHtml(campaign.emailName)}">${escapeHtml(campaign.emailName)}</div></td>
                        <td><div class="campaign-email-subject" title="${escapeHtml(campaign.emailSubject)}">${escapeHtml(campaign.emailSubject)}</div></td>
                        <td>${campaign.region}</td>
                        <td>${campaign.totalSent.toLocaleString()}</td>
                        <td class="${getCampaignMetricClass(campaign.deliveryRate, 95, 90)}">${campaign.deliveryRate.toFixed(2)}%</td>
                        <td class="${getCampaignMetricClass(campaign.openRate, 25, 15)}">${campaign.openRate.toFixed(2)}%</td>
                        <td class="${getCampaignMetricClass(campaign.clickRate, 3, 1.5)}">${campaign.clickRate.toFixed(2)}%</td>
                        <td class="${getCampaignMetricClass(campaign.clickToOpenRate, 10, 5)}">${campaign.clickToOpenRate.toFixed(2)}%</td>
                        <td class="${getCampaignMetricClass(campaign.unsubscribeRate, 0.5, 1, true)}">${campaign.unsubscribeRate.toFixed(2)}%</td>
                    `;
                    fragment.appendChild(row);
                });
                
                // Single DOM update (PERFORMANCE OPTIMIZATION)
                tbody.innerHTML = '';
                tbody.appendChild(fragment);
            }

            // Update pagination info
            document.getElementById('campaignPaginationInfo').textContent = 
                `Showing ${totalCampaigns === 0 ? 0 : startIdx + 1}-${endIdx} of ${totalCampaigns} campaigns`;

            // Update pagination buttons
            document.getElementById('campaignPrevBtn').disabled = currentCampaignPage === 1;
            document.getElementById('campaignNextBtn').disabled = currentCampaignPage === totalPages || totalPages === 0;
        }

        function getCampaignMetricClass(value, goodThreshold, averageThreshold, inverse = false) {
            if (inverse) {
                // For metrics where lower is better (e.g., unsubscribe rate)
                if (value <= goodThreshold) return 'campaign-metric campaign-metric-good';
                if (value <= averageThreshold) return 'campaign-metric campaign-metric-average';
                return 'campaign-metric campaign-metric-poor';
            } else {
                // For metrics where higher is better
                if (value >= goodThreshold) return 'campaign-metric campaign-metric-good';
                if (value >= averageThreshold) return 'campaign-metric campaign-metric-average';
                return 'campaign-metric campaign-metric-poor';
            }
        }

        function changeCampaignPage(delta) {
            const totalPages = Math.ceil(filteredCampaignData.length / campaignsPerPage);
            currentCampaignPage = Math.max(1, Math.min(currentCampaignPage + delta, totalPages));
            renderCampaignTable();
        }

        function clearCampaignFilters() {
            // (BUGFIX) #campaignRegionFilter no longer exists (replaced by the
            // checkbox multi-select), so the old .value assignment threw a
            // TypeError and the button silently did nothing beyond clearing the
            // search box. Clear every live control and restore defaults instead.
            const searchInput = document.getElementById('campaignSearchInput');
            if (searchInput) searchInput.value = '';
            document.querySelectorAll('.campaign-region-checkbox:checked').forEach(cb => { cb.checked = false; });
            updateRegionFilterLabel('campaign');
            const startInput = document.getElementById('campaignStartDate');
            if (startInput) startInput.value = '';
            const endInput = document.getElementById('campaignEndDate');
            if (endInput) endInput.value = '';
            // Restore the default state of the test-send toggle (checked on load)
            const hideTests = document.getElementById('hideTestSends');
            if (hideTests) hideTests.checked = true;
            filterCampaigns();
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            // (BUGFIX) Also encode double quotes: this output is interpolated
            // into double-quoted attributes (title="..."), where a raw " in a
            // campaign name or subject line broke the attribute and leaked
            // markup. Single quotes are left alone - the signup onclick builder
            // already escapes those for its JS-string context.
            return div.innerHTML.replace(/"/g, '&quot;');
        }


        // ====================================================================================
        // == SIGNUP PERFORMANCE FUNCTIONS                                                   ==
        // ====================================================================================

        // Aggregate new-subscriber counts (TotalUniqueNewContacts, summed across all regions)
        // from the Shared DE dataset and attach a totalNewSubscribers field to each
        // signup source in the lifetime dataset (keyed on SignupIdentifier).
        function enrichSignupPerformanceWithNewSubscribers() {
            const newSubsById = {};
            if (typeof signupIdentifierPerformanceData !== 'undefined' && Array.isArray(signupIdentifierPerformanceData)) {
                signupIdentifierPerformanceData.forEach(function(rec) {
                    const id = rec.signupIdentifier || '';
                    if (!id) return;
                    if (!newSubsById[id]) newSubsById[id] = 0;
                    newSubsById[id] += (rec.totalUniqueNewContacts || 0);
                });
            }
            signupPerformanceData.forEach(function(item) {
                item.totalNewSubscribers = newSubsById[item.signupIdentifier] || 0;
            });
        }

        function initializeSignupPerformance() {
            if (!signupPerformanceData || signupPerformanceData.length === 0) {
                return;
            }
            
            enrichSignupPerformanceWithNewSubscribers();
            filteredSignupPerformanceData = [...signupPerformanceData];
            
            // Update snapshot date info
            const snapshotElement = document.getElementById('signupSnapshotDate');
            if (snapshotElement) {
                snapshotElement.textContent = 'Click a signup source name to view regional breakdown and detailed metrics.';
            }
            
            renderSignupPerformanceTable();
        }
        
        function formatSnapshotDate(dateString) {
            // Convert YYYY-MM-DD to readable format
            try {
                const parts = dateString.split('-');
                if (parts.length === 3) {
                    const year = parts[0];
                    const month = parts[1];
                    const day = parts[2];
                    const date = new Date(year, parseInt(month) - 1, day);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    return date.toLocaleDateString('en-US', options);
                }
            } catch(e) {
                return dateString;
            }
            return dateString;
        }

        function filterSignupPerformance() {
            const searchTerm = (document.getElementById('signupSearchInput').value || '').trim().toLowerCase();
            const minSends = parseInt(document.getElementById('signupMinSends').value, 10) || 0;
            
            filteredSignupPerformanceData = signupPerformanceData.filter(item => {
                const signupIdentifier = (item.signupIdentifier || '').toLowerCase();

                const matchesSearch = !searchTerm || signupIdentifier.includes(searchTerm);
                const matchesSends = item.totalLifetimeSends >= minSends;
                
                return matchesSearch && matchesSends;
            });
            
            signupCurrentPage = 1;
            renderSignupPerformanceTable();
        }

        function sortSignupTable(column) {
            if (signupSortColumn === column) {
                signupSortDirection = signupSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                signupSortColumn = column;
                signupSortDirection = 'desc';
            }
            
            filteredSignupPerformanceData.sort((a, b) => {
                let valA = a[column];
                let valB = b[column];
                
                if (typeof valA === 'string') {
                    valA = valA.toLowerCase();
                    valB = valB.toLowerCase();
                }
                
                if (signupSortDirection === 'asc') {
                    return valA > valB ? 1 : valA < valB ? -1 : 0;
                } else {
                    return valA < valB ? 1 : valA > valB ? -1 : 0;
                }
            });
            
            renderSignupPerformanceTable();
        }

        // Navigate to signup detail page (works correctly inside loader iframe)
        function navigateToSignupDetail(signupIdentifier) {
            // If inside the loader iframe, delegate to parent (iframe pool manager)
            if (window.parent !== window) {
                try {
                    window.parent.postMessage({ type: 'tabSwitch', tab: 'signup-detail', source: signupIdentifier }, '*');
                } catch(e) { /* Ignore cross-origin errors */ }
                return; // Parent handles navigation
            }
            // Standalone mode: navigate directly
            const url = new URL(window.location);
            url.searchParams.set('tab', 'signup-detail');
            url.searchParams.set('source', signupIdentifier);
            url.searchParams.set('sessionkey', sessionKey);
            url.searchParams.set('u', currentUser);
            window.location.href = url.toString();
        }

        // Navigate back from signup detail to signup sources list
        function navigateBackToSignups() {
            // If inside the loader iframe, delegate to parent (iframe pool manager)
            if (window.parent !== window) {
                try {
                    window.parent.postMessage({ type: 'tabSwitch', tab: 'signups' }, '*');
                } catch(e) { /* Ignore cross-origin errors */ }
                return; // Parent handles navigation
            }
            // Standalone mode: navigate directly
            const url = new URL(window.location);
            url.searchParams.set('tab', 'signups');
            url.searchParams.delete('source');
            url.searchParams.set('sessionkey', sessionKey);
            url.searchParams.set('u', currentUser);
            window.location.href = url.toString();
        }

        function renderSignupPerformanceTable() {
            const tbody = document.getElementById('signupPerformanceTableBody');
            const startIdx = (signupCurrentPage - 1) * signupRowsPerPage;
            const endIdx = startIdx + signupRowsPerPage;
            const pageData = filteredSignupPerformanceData.slice(startIdx, endIdx);
            
            renderSignupNewSubscribersChart();
            
            if (pageData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="11" class="campaign-no-data">No signup sources match the current filters</td></tr>';
                updateSignupPagination();
                return;
            }
            
            let html = '';
            pageData.forEach((item, index) => {
                const openRateClass = getSignupMetricClass(item.lifetimeAvgOpenRate, 0.2, 0.1);
                const ctrClass = getSignupMetricClass(item.lifetimeAvgCTR, 0.05, 0.02);
                const deliveryClass = getSignupMetricClass(item.lifetimeAvgDeliveryRate, 0.95, 0.9);
                const bounceClass = getSignupMetricClass(item.lifetimeAvgBounceRate, 0.02, 0.05, true);
                const unsubClass = getSignupMetricClass(item.lifetimeAvgUnsubscribeRate, 0.002, 0.005, true);
                
                // Escape the identifier for safe use in onclick attribute
                const escapedId = escapeHtml(item.signupIdentifier).replace(/'/g, "\\'");
                
                html += `
                    <tr>
                        <td class="signup-identifier-name">
                            <a href="#" onclick="navigateToSignupDetail('${escapedId}'); return false;" class="signup-identifier-link" title="${escapeHtml(item.signupIdentifier)}">${escapeHtml(item.signupIdentifier)}</a>
                        </td>
                        <td class="signup-metric fw-bold">${(item.totalNewSubscribers || 0).toLocaleString()}</td>
                        <td class="signup-metric">${item.totalLifetimeSends.toLocaleString()}</td>
                        <td class="signup-metric">${item.totalLifetimeDelivered.toLocaleString()}</td>
                        <td class="signup-metric ${deliveryClass}">${formatPercentage(item.lifetimeAvgDeliveryRate)}%</td>
                        <td class="signup-metric ${openRateClass}">${formatPercentage(item.lifetimeAvgOpenRate)}%</td>
                        <td class="signup-metric ${ctrClass}">${formatPercentage(item.lifetimeAvgCTR)}%</td>
                        <td class="signup-metric">${formatPercentage(item.lifetimeAvgCTOR)}%</td>
                        <td class="signup-metric ${bounceClass}">${formatPercentage(item.lifetimeAvgBounceRate)}%</td>
                        <td class="signup-metric ${unsubClass}">${formatPercentage(item.lifetimeAvgUnsubscribeRate)}%</td>
                        <td class="signup-metric">${item.monthsActive}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = html;
            updateSignupPagination();
            updateSignupTableHeaders();
        }

        function getSignupMetricClass(value, goodThreshold, avgThreshold, inverse = false) {
            if (inverse) {
                if (value <= goodThreshold) return 'signup-metric-good';
                if (value <= avgThreshold) return 'signup-metric-average';
                return 'signup-metric-poor';
            } else {
                if (value >= goodThreshold) return 'signup-metric-good';
                if (value >= avgThreshold) return 'signup-metric-average';
                return 'signup-metric-poor';
            }
        }

        function updateSignupTableHeaders() {
            document.querySelectorAll('.signup-table th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });
            
            const sortedHeader = Array.from(document.querySelectorAll('.signup-table th'))
                .find(th => th.textContent.toLowerCase().includes(signupSortColumn.toLowerCase()));
            
            if (sortedHeader) {
                sortedHeader.classList.add(signupSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        }

        // Column resize functionality for Signup Identifier column
        function initColumnResize(e) {
            e.stopPropagation(); // Prevent sorting when resizing
            e.preventDefault();
            
            const handle = e.target;
            const th = handle.parentElement;
            const table = th.closest('table');
            const startX = e.pageX;
            const startWidth = th.offsetWidth;
            
            handle.classList.add('resizing');
            table.classList.add('resizing');
            
            function onMouseMove(e) {
                const newWidth = startWidth + (e.pageX - startX);
                th.style.width = newWidth + 'px';
            }
            
            function onMouseUp() {
                handle.classList.remove('resizing');
                table.classList.remove('resizing');
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        function updateSignupPagination() {
            const total = filteredSignupPerformanceData.length;
            const totalPages = Math.ceil(total / signupRowsPerPage);
            const startIdx = (signupCurrentPage - 1) * signupRowsPerPage + 1;
            const endIdx = Math.min(signupCurrentPage * signupRowsPerPage, total);
            
            document.getElementById('signupPaginationInfo').textContent = 
                `Showing ${startIdx}-${endIdx} of ${total} signup sources`;
            
            document.getElementById('signupPrevBtn').disabled = signupCurrentPage === 1;
            document.getElementById('signupNextBtn').disabled = signupCurrentPage >= totalPages;
        }

        function changeSignupPage(direction) {
            signupCurrentPage += direction;
            renderSignupPerformanceTable();
            document.getElementById('signupPerformanceSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Horizontal bar chart of the top signup sources by attributed new subscribers.
        // Reflects the current filtered dataset (search / min sends), sorted most-first.
        function renderSignupNewSubscribersChart() {
            const canvas = document.getElementById('signupNewSubscribersChart');
            if (!canvas) return;
            const container = document.getElementById('signupNewSubscribersChartContainer');
            const ctx = canvas.getContext('2d');

            signupNewSubscribersChart = destroyChart(signupNewSubscribersChart);
            initChartDefaults();

            const topData = [...filteredSignupPerformanceData]
                .filter(function(item) { return (item.totalNewSubscribers || 0) > 0; })
                .sort(function(a, b) { return (b.totalNewSubscribers || 0) - (a.totalNewSubscribers || 0); })
                .slice(0, 15);

            // No attributable new-subscriber data: hide the chart entirely.
            if (topData.length === 0) {
                if (container) container.style.display = 'none';
                return;
            }
            if (container) container.style.display = '';

            const labels = topData.map(function(item) {
                const id = item.signupIdentifier || '';
                return id.length > 40 ? id.substring(0, 40) + '…' : id;
            });
            const values = topData.map(function(item) { return item.totalNewSubscribers || 0; });

            const chartHeight = Math.max(300, topData.length * 30);
            canvas.parentElement.style.height = chartHeight + 'px';

            signupNewSubscribersChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'New Subscribers',
                        data: values,
                        backgroundColor: 'rgba(40, 167, 69, 0.75)',
                        borderColor: '#28a745',
                        borderWidth: 1
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Top Signup Sources by New Subscribers',
                            font: { size: 16, weight: 'bold' },
                            color: '#DB021D'
                        },
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return 'New Subscribers: ' + context.parsed.x.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: { precision: 0, color: '#333333', font: { size: 11 } },
                            grid: { color: 'rgba(0,0,0,0.08)' }
                        },
                        y: {
                            ticks: { color: '#333333', font: { size: 11 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        function updateSignupChart() {
            const metric = document.getElementById('signupChartMetric').value;
            const view = document.getElementById('signupChartView').value;
            
            // Map metric + view combinations to chart types
            if (view === 'byConsent') {
                signupChartType = 'byConsent';
            } else {
                // For top10/bottom10 views, use the metric directly
                signupChartType = metric;
            }
            
            renderSignupChart();
        }

        function renderSignupChart() {
            const canvas = document.getElementById('signupPerformanceChart');
            const ctx = canvas.getContext('2d');
            
            signupPerformanceChart = destroyChart(signupPerformanceChart);
            initChartDefaults();
            
            let chartData, chartConfig;
            
            if (signupChartType === 'topOpenRate') {
                const topData = [...filteredSignupPerformanceData]
                    .sort((a, b) => b.lifetimeAvgOpenRate - a.lifetimeAvgOpenRate)
                    .slice(0, 10);
                
                chartData = {
                    labels: topData.map(item => item.signupIdentifier.substring(0, 30)),
                    datasets: [
                        {
                            label: 'Open Rate %',
                            data: topData.map(item => formatPercentage(item.lifetimeAvgOpenRate)),
                            backgroundColor: 'rgba(219, 2, 29, 0.7)',
                            borderColor: 'rgba(219, 2, 29, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Top 10 Signup Sources by Open Rate',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                },
                                title: {
                                    display: true,
                                    text: 'Open Rate (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            } else if (signupChartType === 'topCTR') {
                const topData = [...filteredSignupPerformanceData]
                    .sort((a, b) => b.lifetimeAvgCTR - a.lifetimeAvgCTR)
                    .slice(0, 10);
                
                chartData = {
                    labels: topData.map(item => item.signupIdentifier.substring(0, 30)),
                    datasets: [
                        {
                            label: 'CTR %',
                            data: topData.map(item => formatPercentage(item.lifetimeAvgCTR)),
                            backgroundColor: 'rgba(0, 204, 68, 0.7)',
                            borderColor: 'rgba(0, 204, 68, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Top 10 Signup Sources by CTR',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                suggestedMax: 15,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                },
                                title: {
                                    display: true,
                                    text: 'CTR (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            } else if (signupChartType === 'topDelivery') {
                const topData = [...filteredSignupPerformanceData]
                    .filter(item => item.totalLifetimeSends >= 10)
                    .sort((a, b) => b.lifetimeAvgDeliveryRate - a.lifetimeAvgDeliveryRate)
                    .slice(0, 10);
                
                chartData = {
                    labels: topData.map(item => item.signupIdentifier.substring(0, 30)),
                    datasets: [
                        {
                            label: 'Delivery Rate %',
                            data: topData.map(item => formatPercentage(item.lifetimeAvgDeliveryRate)),
                            backgroundColor: 'rgba(0, 102, 204, 0.7)',
                            borderColor: 'rgba(0, 102, 204, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Top 10 Signup Sources by Delivery Rate (min 10 sends)',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                },
                                title: {
                                    display: true,
                                    text: 'Delivery Rate (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            } else if (signupChartType === 'bottomUnsub') {
                const bottomData = [...filteredSignupPerformanceData]
                    .filter(item => item.totalLifetimeSends >= 10)
                    .sort((a, b) => a.lifetimeAvgUnsubscribeRate - b.lifetimeAvgUnsubscribeRate)
                    .slice(0, 10);
                
                const dataValues = bottomData.map(item => item.lifetimeAvgUnsubscribeRate * 100);
                const maxValue = Math.max(...dataValues);
                const dynamicMax = Math.ceil(maxValue * 1.2 * 100) / 100; // Add 20% padding and round to 2 decimals
                
                chartData = {
                    labels: bottomData.map(item => item.signupIdentifier.substring(0, 30)),
                    datasets: [
                        {
                            label: 'Unsubscribe Rate %',
                            data: dataValues.map(val => val.toFixed(2)),
                            backgroundColor: 'rgba(0, 204, 68, 0.7)',
                            borderColor: 'rgba(0, 204, 68, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Bottom 10 Signup Sources by Unsubscribe Rate (min 10 sends)',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                max: dynamicMax,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 },
                                    callback: function(value) {
                                        return value.toFixed(2) + '%';
                                    }
                                },
                                title: {
                                    display: true,
                                    text: 'Unsubscribe Rate (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            } else if (signupChartType === 'bottomBounce') {
                const bottomData = [...filteredSignupPerformanceData]
                    .filter(item => item.totalLifetimeSends >= 10)
                    .sort((a, b) => a.lifetimeAvgBounceRate - b.lifetimeAvgBounceRate)
                    .slice(0, 10);
                
                chartData = {
                    labels: bottomData.map(item => item.signupIdentifier.substring(0, 30)),
                    datasets: [
                        {
                            label: 'Bounce Rate %',
                            data: bottomData.map(item => formatPercentage(item.lifetimeAvgBounceRate)),
                            backgroundColor: 'rgba(255, 165, 0, 0.7)',
                            borderColor: 'rgba(255, 165, 0, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Bottom 10 Signup Sources by Bounce Rate (min 10 sends)',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                suggestedMax: 10,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                },
                                title: {
                                    display: true,
                                    text: 'Bounce Rate (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            } else if (signupChartType === 'byConsent') {
                const doubleOptIn = filteredSignupPerformanceData.filter(item => 
                    item.consentStatus.includes('Double'));
                const singleOptIn = filteredSignupPerformanceData.filter(item => 
                    item.consentStatus.includes('Single'));
                
                const doubleAvgOpen = doubleOptIn.reduce((sum, item) => sum + item.lifetimeAvgOpenRate, 0) / doubleOptIn.length || 0;
                const singleAvgOpen = singleOptIn.reduce((sum, item) => sum + item.lifetimeAvgOpenRate, 0) / singleOptIn.length || 0;
                const doubleAvgCTR = doubleOptIn.reduce((sum, item) => sum + item.lifetimeAvgCTR, 0) / doubleOptIn.length || 0;
                const singleAvgCTR = singleOptIn.reduce((sum, item) => sum + item.lifetimeAvgCTR, 0) / singleOptIn.length || 0;
                
                chartData = {
                    labels: ['Double Opt-In', 'Single Opt-In'],
                    datasets: [
                        {
                            label: 'Avg Open Rate %',
                            data: [(doubleAvgOpen * 100).toFixed(2), (singleAvgOpen * 100).toFixed(2)],
                            backgroundColor: 'rgba(219, 2, 29, 0.7)',
                            borderColor: 'rgba(219, 2, 29, 1)',
                            borderWidth: 2
                        },
                        {
                            label: 'Avg CTR %',
                            data: [(doubleAvgCTR * 100).toFixed(2), (singleAvgCTR * 100).toFixed(2)],
                            backgroundColor: 'rgba(0, 204, 68, 0.7)',
                            borderColor: 'rgba(0, 204, 68, 1)',
                            borderWidth: 2
                        }
                    ]
                };
                
                chartConfig = {
                    type: 'bar',
                    data: chartData,
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            title: {
                                display: true,
                                text: 'Performance Comparison by Consent Status',
                                font: { size: 16, weight: 'bold' },
                                color: '#DB021D'
                            },
                            legend: {
                                display: true,
                                position: 'top',
                                labels: {
                                    color: '#000000',
                                    font: { size: 12 }
                                }
                            }
                        },
                        scales: {
                            x: {
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                }
                            },
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    color: '#000000',
                                    font: { size: 11 }
                                },
                                title: {
                                    display: true,
                                    text: 'Percentage (%)',
                                    color: '#000000',
                                    font: { size: 12, weight: 'bold' }
                                }
                            }
                        }
                    }
                };
            }
            
            signupPerformanceChart = new Chart(ctx, chartConfig);
        }

        // ====================================================================================
        // == SIGNUP SOURCE DETAIL PAGE FUNCTIONS                                            ==
        // ====================================================================================

        var signupDetailChart = null;

        function renderSignupDetailPage() {
            const section = document.getElementById('signupDetailSection');
            if (!section) return;

            // Set up back link - use navigateBackToSignups() for proper skeleton loading
            const backLink = document.getElementById('signupDetailBackLink');
            if (backLink) {
                backLink.href = '#';
                backLink.onclick = function(e) {
                    e.preventDefault();
                    navigateBackToSignups();
                };
            }

            // Set title
            const titleEl = document.getElementById('signupDetailTitle');
            if (titleEl) {
                titleEl.textContent = signupDetailSource || 'Unknown Source';
            }

            // Check if we have data
            if (!signupSourceDetailData || signupSourceDetailData.length === 0) {
                document.getElementById('signupDetailMetrics').innerHTML = 
                    '<div class="signup-detail-no-data">No lifetime metrics found for this signup source.</div>';
                document.getElementById('signupDetailRegionalTableBody').innerHTML = 
                    '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No regional data available</td></tr>';
                document.getElementById('signupDetailRegionalStats').innerHTML = '';
                document.getElementById('signupDetailSnapshotDate').textContent = '';
                return;
            }

            const detail = signupSourceDetailData[0];

            // Render lifetime metrics cards
            renderSignupDetailMetrics(detail);

            // Render regional data
            renderSignupDetailRegional();

            // Render chart
            setTimeout(function() {
                renderSignupDetailChart();
            }, 200);
        }

        function renderSignupDetailMetrics(detail) {
            const container = document.getElementById('signupDetailMetrics');
            
            const deliveryClass = detail.lifetimeAvgDeliveryRate >= 0.95 ? 'metric-good' : 
                                  detail.lifetimeAvgDeliveryRate >= 0.9 ? 'metric-average' : 'metric-poor';
            const openClass = detail.lifetimeAvgOpenRate >= 0.2 ? 'metric-good' : 
                              detail.lifetimeAvgOpenRate >= 0.1 ? 'metric-average' : 'metric-poor';
            const ctrClass = detail.lifetimeAvgCTR >= 0.05 ? 'metric-good' : 
                             detail.lifetimeAvgCTR >= 0.02 ? 'metric-average' : 'metric-poor';
            const ctorClass = detail.lifetimeAvgCTOR >= 0.15 ? 'metric-good' : 
                              detail.lifetimeAvgCTOR >= 0.08 ? 'metric-average' : 'metric-poor';
            const bounceClass = detail.lifetimeAvgBounceRate <= 0.02 ? 'metric-good' : 
                                detail.lifetimeAvgBounceRate <= 0.05 ? 'metric-average' : 'metric-poor';
            const unsubClass = detail.lifetimeAvgUnsubscribeRate <= 0.002 ? 'metric-good' : 
                               detail.lifetimeAvgUnsubscribeRate <= 0.005 ? 'metric-average' : 'metric-poor';

            container.innerHTML = `
                <div class="signup-detail-metric-card">
                    <div class="signup-detail-metric-value">${detail.totalLifetimeSends.toLocaleString()}</div>
                    <div class="signup-detail-metric-label">Total Sends</div>
                </div>
                <div class="signup-detail-metric-card">
                    <div class="signup-detail-metric-value">${detail.totalLifetimeDelivered.toLocaleString()}</div>
                    <div class="signup-detail-metric-label">Delivered</div>
                </div>
                <div class="signup-detail-metric-card ${deliveryClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgDeliveryRate)}%</div>
                    <div class="signup-detail-metric-label">Delivery Rate</div>
                </div>
                <div class="signup-detail-metric-card ${openClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgOpenRate)}%</div>
                    <div class="signup-detail-metric-label">Open Rate</div>
                </div>
                <div class="signup-detail-metric-card ${ctrClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgCTR)}%</div>
                    <div class="signup-detail-metric-label">Click-Through Rate</div>
                </div>
                <div class="signup-detail-metric-card ${ctorClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgCTOR)}%</div>
                    <div class="signup-detail-metric-label">Click-to-Open Rate</div>
                </div>
                <div class="signup-detail-metric-card ${bounceClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgBounceRate)}%</div>
                    <div class="signup-detail-metric-label">Bounce Rate</div>
                </div>
                <div class="signup-detail-metric-card ${unsubClass}">
                    <div class="signup-detail-metric-value">${formatPercentage(detail.lifetimeAvgUnsubscribeRate)}%</div>
                    <div class="signup-detail-metric-label">Unsubscribe Rate</div>
                </div>
                <div class="signup-detail-metric-card">
                    <div class="signup-detail-metric-value">${detail.monthsActive}</div>
                    <div class="signup-detail-metric-label">Months Active</div>
                </div>
            `;
        }

        function renderSignupDetailRegional() {
            const regional = signupSourceRegionalData || [];
            const tbody = document.getElementById('signupDetailRegionalTableBody');
            const statsContainer = document.getElementById('signupDetailRegionalStats');
            const snapshotEl = document.getElementById('signupDetailSnapshotDate');

            if (regional.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:#999;">No regional data available for this signup source</td></tr>';
                statsContainer.innerHTML = '';
                if (snapshotEl) snapshotEl.textContent = 'No regional snapshot data available';
                return;
            }

            // Set snapshot date
            if (snapshotEl && regional[0].snapshotDateText) {
                const formattedDate = formatSnapshotDate(regional[0].snapshotDateText);
                snapshotEl.textContent = 'Regional data snapshot: ' + formattedDate;
            }

            // Calculate totals
            const totals = regional.reduce(function(acc, item) {
                acc.participants += item.totalUniqueParticipants;
                acc.newContacts += item.totalUniqueNewContacts;
                acc.pendingContacts += getPendingContactsForSignupRegion(signupDetailSource, item.userCulture);
                return acc;
            }, { participants: 0, newContacts: 0, pendingContacts: 0 });

            // Sort by participants descending
            const sortedData = [...regional].sort(function(a, b) {
                return b.totalUniqueParticipants - a.totalUniqueParticipants;
            });

            // Render summary stats
            statsContainer.innerHTML = `
                <div class="signup-regional-stat">
                    <div class="signup-regional-stat-value">${totals.participants.toLocaleString()}</div>
                    <div class="signup-regional-stat-label">Total Participants</div>
                </div>
                <div class="signup-regional-stat">
                    <div class="signup-regional-stat-value">${totals.pendingContacts.toLocaleString()}</div>
                    <div class="signup-regional-stat-label">Pending DOI</div>
                </div>
                <div class="signup-regional-stat">
                    <div class="signup-regional-stat-value">${totals.newContacts.toLocaleString()}</div>
                    <div class="signup-regional-stat-label">Total New Contacts</div>
                </div>
                <div class="signup-regional-stat">
                    <div class="signup-regional-stat-value">${sortedData.length}</div>
                    <div class="signup-regional-stat-label">Regions</div>
                </div>
                <div class="signup-regional-stat">
                    <div class="signup-regional-stat-value">${totals.participants > 0 ? ((totals.newContacts / totals.participants) * 100).toFixed(1) : 0}%</div>
                    <div class="signup-regional-stat-label">New Contact Rate</div>
                </div>
            `;

            // Render table rows
            const fragment = document.createDocumentFragment();
            sortedData.forEach(function(item) {
                const newContactRate = item.totalUniqueParticipants > 0
                    ? ((item.totalUniqueNewContacts / item.totalUniqueParticipants) * 100).toFixed(1)
                    : 0;
                const percentOfTotal = totals.participants > 0
                    ? ((item.totalUniqueParticipants / totals.participants) * 100).toFixed(1)
                    : 0;

                const cultureInfo = getCultureInfo(item.userCulture);
                const pendingCount = getPendingContactsForSignupRegion(signupDetailSource, item.userCulture);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cultureInfo.flag} ${item.userCulture}</td>
                    <td class="fw-bold">${item.totalUniqueParticipants.toLocaleString()}</td>
                    <td>${pendingCount.toLocaleString()}</td>
                    <td>${item.totalUniqueNewContacts.toLocaleString()}</td>
                    <td>${newContactRate}%</td>
                    <td>${percentOfTotal}%</td>
                `;
                fragment.appendChild(row);
            });
            tbody.innerHTML = '';
            tbody.appendChild(fragment);
        }

        function renderSignupDetailChart() {
            const canvas = document.getElementById('signupDetailRegionalChart');
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            // Destroy previous chart instance
            if (signupDetailChart) {
                signupDetailChart.destroy();
                signupDetailChart = null;
            }

            const regional = signupSourceRegionalData || [];
            if (regional.length === 0) {
                const container = document.getElementById('signupDetailChartContainer');
                if (container) container.innerHTML = '<div class="signup-detail-no-data">No regional data available for chart</div>';
                return;
            }

            // Sort by participants descending
            const sortedData = [...regional].sort(function(a, b) {
                return b.totalUniqueParticipants - a.totalUniqueParticipants;
            });

            const labels = sortedData.map(function(item) {
                const info = getCultureInfo(item.userCulture);
                return info.flag + ' ' + item.userCulture;
            });
            const participantValues = sortedData.map(function(item) {
                return item.totalUniqueParticipants;
            });
            const newContactValues = sortedData.map(function(item) {
                return item.totalUniqueNewContacts;
            });

            // Dynamic chart height based on number of regions
            const chartHeight = Math.max(300, sortedData.length * 28);
            canvas.parentElement.style.height = chartHeight + 'px';

            signupDetailChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Participants',
                            data: participantValues,
                            backgroundColor: 'rgba(219, 2, 29, 0.85)',
                            borderColor: '#DB021D',
                            borderWidth: 1
                        },
                        {
                            label: 'New Contacts',
                            data: newContactValues,
                            backgroundColor: 'rgba(40, 167, 69, 0.7)',
                            borderColor: '#28a745',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: { font: { weight: 'bold', size: 12 } }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ': ' + context.parsed.x.toLocaleString();
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString();
                                }
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        },
                        y: {
                            ticks: { font: { size: 11 } },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Reuse existing function for pending contacts lookup
        function getPendingContactsForSignupRegion(signupIdentifier, region) {
            if (typeof pendingContactsData === 'undefined' || !Array.isArray(pendingContactsData)) return 0;
            const normalizedIdentifier = (signupIdentifier || '').trim().toUpperCase();
            const normalizedRegion = (region || '').trim().toUpperCase();
            
            return pendingContactsData
                .filter(function(item) {
                    const itemIdentifier = (item.signupIdentifier || '').trim().toUpperCase();
                    const itemRegion = (item.region || '').trim().toUpperCase();
                    return itemIdentifier === normalizedIdentifier && itemRegion === normalizedRegion;
                })
                .reduce(function(sum, item) { return sum + (item.pendingCount || 0); }, 0);
        }

        // Tab state management
        const tabState = {
            activeTab: 'overview',
            filters: {
                overview: { dateFrom: '', dateTo: '', region: '', trade: '' },
                email: { period: 'current-month', region: '' },
                campaigns: { dateFrom: '', dateTo: '', region: '', search: '' },
                growth: { grouping: 'day', dateFrom: '', dateTo: '', region: '' },
                signups: { minSends: 0, search: '' },
                myaccount: { dateFrom: '', dateTo: '', culture: '' }
            }
        };

        // Switch between tabs
        function switchTab(tabName) {
            // Check if we need to reload the page with new data
            // This happens when switching to a tab that wasn't loaded on initial page load
            const currentTab = new URLSearchParams(window.location.search).get('tab') || 'overview';
            
            if (currentTab !== tabName) {
                // If loaded inside the loader iframe, delegate navigation to the parent.
                // The parent manages an iframe pool and may show a cached tab instantly.
                if (window.parent !== window) {
                    try {
                        window.parent.postMessage({ type: 'tabSwitch', tab: tabName }, '*');
                    } catch(e) { /* Ignore cross-origin errors */ }
                    return; // Parent handles navigation — don't self-navigate
                }
                // Standalone mode (no loader): reload page with new tab parameter
                const url = new URL(window.location);
                url.searchParams.set('tab', tabName);
                url.searchParams.set('sessionkey', sessionKey);
                url.searchParams.set('u', currentUser);
                window.location.href = url.toString();
                return;
            }
            
            // Same tab - just update UI (no reload needed)
            // Update active states on tab buttons
            // For signup-detail sub-page, highlight the "Signups" parent tab
            const highlightTab = tabName === 'signup-detail' ? 'signups' : tabName;
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tab === highlightTab);
            });
            
            // Update mobile dropdown to match
            const mobileSelector = document.getElementById('mobileTabSelector');
            if (mobileSelector) {
                mobileSelector.value = highlightTab;
            }
            
            // Update active states on tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.toggle('active', pane.id === `${tabName}-tab`);
            });
            
            // Store active tab
            tabState.activeTab = tabName;
            
            // Initialize tab content if needed
            initializeTabContent(tabName);
        }

        // Initialize content for specific tab
        function initializeTabContent(tabName) {
            switch(tabName) {
                case 'overview':
                    // Overview charts - initialize with delay to ensure DOM and Chart.js are ready
                    setTimeout(() => {
                        // Update overview stats on tab load
                        updateOverviewStats();
                        // Render pending contacts section
                        renderPendingContactsSection();
                        // Render overview charts
                        const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
                        const latestTradeSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
                        renderSubscriberSnapshotChart(latestSnapshotData);
                        renderTradeSnapshotChart(latestTradeSnapshotData);
                        // Apply filters if any are set
                        if (tabState.filters.overview.dateFrom || tabState.filters.overview.dateTo || 
                            tabState.filters.overview.region || tabState.filters.overview.trade) {
                            applyTabFilters('overview');
                        }
                    }, 100);
                    break;
                case 'email':
                    // Email analytics - set default period if not already set
                    const dateFromInput = document.getElementById('dateFrom');
                    const dateToInput = document.getElementById('dateTo');
                    if (!dateFromInput.value && !dateToInput.value) {
                        // No period set yet - default to current month
                        setEmailPeriod('current-month', { target: document.querySelector('.period-btn.active') });
                    } else if (typeof emailChart === 'undefined' || !emailChart) {
                        // Period already set, just render
                        renderEmailAnalytics();
                    }
                    break;
                case 'campaigns':
                    // Campaign details - always render table (no chart variable to check)
                    renderCampaignTable();
                    break;
                case 'growth':
                    // Growth charts - initialize with delay to ensure DOM is ready
                    setTimeout(() => {
                        // Update overview stats
                        updateOverviewStats();
                        // Render subscriber and trade charts to Growth tab canvases
                        const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
                        const latestTradeSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
                        renderGrowthSubscriberSnapshotChart(latestSnapshotData);
                        renderGrowthTradeSnapshotChart(latestTradeSnapshotData);
                        // Update growth chart if exists
                        if (typeof growthChart === 'undefined' || !growthChart) {
                            updateChart();
                        }
                    }, 100);
                    break;
                case 'signups':
                    // Signup performance - always render table
                    renderSignupPerformanceTable();
                    break;
                case 'signup-detail':
                    // Signup source detail sub-page
                    setTimeout(function() {
                        renderSignupDetailPage();
                    }, 100);
                    break;
                case 'myaccount':
                    // MyAccount tab - initialize charts and render demo data
                    setTimeout(() => {
                        initializeMyAccountTab();
                    }, 100);
                    break;
            }
        }

        // ==================================================================================
        // == MULTI-SELECT REGION FILTER FUNCTIONS =========================================
        // ==================================================================================

        // Region groups configuration
        const regionGroups = {
            'GALP': {
                name: 'GALP (German-speaking)',
                regions: ['DE-DE', 'DE-CH', 'DE-AT']
            },
            'Benelux': {
                name: 'Benelux',
                regions: ['NL-NL', 'NL-BE', 'FR-BE', 'BE-FR', 'BE-NL']
            },
            'MEA': {
                name: 'MEA (Middle East & Africa)',
                regions: ['AR-AE', 'EN-AE', 'EN-ZA']
            },
            'Iberia': {
                name: 'Iberia',
                regions: ['ES-ES', 'PT-PT']
            },
            'EE': {
                name: 'EE (Eastern Europe)',
                regions: ['PL-PL', 'HU-HU', 'CS-CZ', 'RO-RO', 'SK-SK']
            },
            'IRIS': {
                name: 'IRIS',
                regions: ['BG-BG', 'SL-SI', 'HR-HR']
            },
            'Nordics': {
                name: 'Nordics',
                regions: ['DA-DK', 'NN-NO', 'NO-NO', 'FI-FI', 'SV-SE', 'ET-EE', 'LT-LT', 'LV-LV']
            },
            'UK & Ireland': {
                name: 'UK & Ireland',
                regions: ['EN-GB', 'EN-IE']
            },
            'France': {
                name: 'France',
                regions: ['FR-FR', 'FR-CH']
            },
            'Italy': {
                name: 'Italy',
                regions: ['IT-IT']
            },
            'Other': {
                name: 'Other Regions',
                regions: ['EN-WW', 'TR-TR', 'GLOBAL']
            }
        };

        // Helper: Find which country group a region belongs to
        function getCountryGroupForRegion(regionCode) {
            if (!regionCode) return null;
            const normalizedRegion = regionCode.toUpperCase();
            for (const [groupKey, group] of Object.entries(regionGroups)) {
                if (group.regions.some(r => r.toUpperCase() === normalizedRegion)) {
                    return groupKey;
                }
            }
            return null;
        }

        // Helper: Get all regions for a country group
        function getRegionsForCountryGroup(groupKey) {
            if (!groupKey || !regionGroups[groupKey]) return [];
            return regionGroups[groupKey].regions;
        }

        // Helper: Get country group from selected regions (uses first selected region's group)
        function getCountryGroupFromSelectedRegions(selectedRegions) {
            if (!selectedRegions || selectedRegions.length === 0) return null;
            // Use the first selected region to determine the country group
            return getCountryGroupForRegion(selectedRegions[0]);
        }

        // Helper: Filter trade data by country group (for historical view)
        // This limits the data displayed to only regions within the same country group
        function filterTradeDataByCountryGroup(tradeDataArray, selectedRegions) {
            if (!selectedRegions || selectedRegions.length === 0) {
                // No filter selected - return all data (existing behavior)
                return tradeDataArray;
            }
            
            // Get the country group for the first selected region
            const countryGroup = getCountryGroupFromSelectedRegions(selectedRegions);
            if (!countryGroup) {
                // Can't determine group - filter by exact selected regions
                return tradeDataArray.filter(item => 
                    item && selectedRegions.includes(item.region)
                );
            }
            
            // Get all regions in this country group
            const groupRegions = getRegionsForCountryGroup(countryGroup);
            
            // Filter trade data to only include regions from this group
            return tradeDataArray.filter(item => 
                item && groupRegions.some(r => r.toUpperCase() === (item.region || '').toUpperCase())
            );
        }

        // Store selected regions per filter context
        const selectedRegions = {
            overview: []
        };

        // Helper: Select all regions in a country group for a filter context
        // Used when loading historical data to pre-select the corresponding regions
        function selectRegionGroupInFilter(context, groupKey) {
            if (!regionGroups[groupKey]) {
                console.warn('Unknown region group:', groupKey);
                return;
            }
            
            const group = regionGroups[groupKey];
            
            // Check the group checkbox
            const groupCheckbox = document.getElementById(`${context}-group-${groupKey}`);
            if (groupCheckbox) {
                groupCheckbox.checked = true;
            }
            
            // Check all region checkboxes in this group
            group.regions.forEach(regionCode => {
                const checkbox = document.querySelector(`.${context}-region-checkbox[value="${regionCode}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
            
            // Update the filter label
            updateRegionFilterLabel(context);
            
            // Expand the group to show selected regions
            const groupItems = document.getElementById(`${context}-group-items-${groupKey}`);
            if (groupItems) {
                groupItems.classList.add('expanded');
                const header = groupItems.previousElementSibling;
                if (header) {
                    const toggle = header.querySelector('.region-group-toggle');
                    if (toggle) toggle.textContent = '▲';
                }
            }
        }

        // Initialize region filter for a specific context
        function initializeRegionFilter(context) {
            const container = document.getElementById(`${context}-region-groups`);
            if (!container) return;

            container.innerHTML = '';

            Object.keys(regionGroups).forEach(groupKey => {
                const group = regionGroups[groupKey];
                
                const groupDiv = document.createElement('div');
                groupDiv.className = 'region-group';
                
                const groupHeader = document.createElement('div');
                groupHeader.className = 'region-group-header';
                groupHeader.onclick = () => toggleRegionGroup(context, groupKey);
                
                groupHeader.innerHTML = `
                    <div class="region-group-title">
                        <input type="checkbox" 
                               class="region-group-checkbox" 
                               id="${context}-group-${groupKey}" 
                               onclick="event.stopPropagation(); toggleGroupSelection(event, '${context}', '${groupKey}')"
                               onchange="updateRegionFilterLabel('${context}'); if ('${context}' === 'global') applyGlobalFiltersDebounced(); if ('${context}' === 'campaign') filterCampaigns();">
                        <span>${group.name}</span>
                    </div>
                    <span class="region-group-toggle">▼</span>
                `;
                
                const groupItems = document.createElement('div');
                groupItems.className = 'region-group-items';
                groupItems.id = `${context}-group-items-${groupKey}`;
                
                group.regions.forEach(regionCode => {
                    const item = document.createElement('div');
                    item.className = 'region-item';
                    item.innerHTML = `
                        <label>
                            <input type="checkbox" 
                                   value="${regionCode}" 
                                   class="${context}-region-checkbox"
                                   data-group="${groupKey}"
                                   onchange="updateGroupCheckboxState('${context}', '${groupKey}'); updateRegionFilterLabel('${context}'); if ('${context}' === 'global') applyGlobalFiltersDebounced(); if ('${context}' === 'campaign') filterCampaigns();">
                            <span class="region-code">${regionCode}</span>
                        </label>
                    `;
                    groupItems.appendChild(item);
                });
                
                groupDiv.appendChild(groupHeader);
                groupDiv.appendChild(groupItems);
                container.appendChild(groupDiv);
            });
        }

        // Toggle region filter dropdown visibility
        function toggleRegionFilter(context) {
            const dropdown = document.getElementById(`${context}-region-dropdown`);
            const button = document.getElementById(`${context}-region-button`);
            
            if (!dropdown || !button) {
                console.error(`Region filter elements not found for context: ${context}`);
                return;
            }
            
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
                dropdown.classList.add('d-none');
                button.classList.remove('active');
            } else {
                // Close any other open dropdowns
                document.querySelectorAll('.region-filter-dropdown.show').forEach(d => {
                    d.classList.remove('show');
                    d.classList.add('d-none');
                    const btn = d.previousElementSibling;
                    if (btn) btn.classList.remove('active');
                });
                
                dropdown.classList.remove('d-none');
                dropdown.classList.add('show');
                button.classList.add('active');
            }
        }

        // Toggle region group expansion
        function toggleRegionGroup(context, groupKey) {
            const items = document.getElementById(`${context}-group-items-${groupKey}`);
            const header = items.previousElementSibling;
            const toggle = header.querySelector('.region-group-toggle');
            
            if (items.classList.contains('expanded')) {
                items.classList.remove('expanded');
                toggle.textContent = '▼';
            } else {
                items.classList.add('expanded');
                toggle.textContent = '▲';
            }
        }

        // Toggle entire group selection
        function toggleGroupSelection(event, context, groupKey) {
            const groupCheckbox = event.target;
            const isChecked = groupCheckbox.checked;
            const group = regionGroups[groupKey];
            
            // Update all region checkboxes in this group
            group.regions.forEach(regionCode => {
                const checkbox = document.querySelector(`.${context}-region-checkbox[value="${regionCode}"]`);
                if (checkbox) {
                    checkbox.checked = isChecked;
                }
            });
            
            updateRegionFilterLabel(context);
        }

        // Update group checkbox state based on individual selections
        function updateGroupCheckboxState(context, groupKey) {
            const group = regionGroups[groupKey];
            const groupCheckbox = document.getElementById(`${context}-group-${groupKey}`);
            
            if (!groupCheckbox) return;
            
            const checkedCount = group.regions.filter(regionCode => {
                const checkbox = document.querySelector(`.${context}-region-checkbox[value="${regionCode}"]`);
                return checkbox && checkbox.checked;
            }).length;
            
            if (checkedCount === 0) {
                groupCheckbox.checked = false;
                groupCheckbox.indeterminate = false;
            } else if (checkedCount === group.regions.length) {
                groupCheckbox.checked = true;
                groupCheckbox.indeterminate = false;
            } else {
                groupCheckbox.checked = false;
                groupCheckbox.indeterminate = true;
            }
        }

        // Update the filter button label
        function updateRegionFilterLabel(context) {
            const checkboxes = document.querySelectorAll(`.${context}-region-checkbox:checked`);
            const label = document.getElementById(`${context}-region-label`);
            const button = document.getElementById(`${context}-region-button`);
            
            if (checkboxes.length === 0) {
                label.innerHTML = 'All Regions';
                const countBadge = button.querySelector('.selected-count');
                if (countBadge) countBadge.remove();
            } else {
                const selectedList = Array.from(checkboxes).map(cb => cb.value).join(', ');
                if (checkboxes.length <= 3) {
                    label.innerHTML = selectedList;
                } else {
                    label.innerHTML = `${checkboxes.length} Regions Selected`;
                }
                
                // Add count badge
                let countBadge = button.querySelector('.selected-count');
                if (!countBadge) {
                    countBadge = document.createElement('span');
                    countBadge.className = 'selected-count';
                    button.insertBefore(countBadge, button.lastElementChild);
                }
                countBadge.textContent = checkboxes.length;
            }
        }

        // Select all regions
        function selectAllRegions(context) {
            document.querySelectorAll(`.${context}-region-checkbox`).forEach(checkbox => {
                checkbox.checked = true;
            });
            
            // Update all group checkboxes
            Object.keys(regionGroups).forEach(groupKey => {
                const groupCheckbox = document.getElementById(`${context}-group-${groupKey}`);
                if (groupCheckbox) {
                    groupCheckbox.checked = true;
                    groupCheckbox.indeterminate = false;
                }
            });
            
            updateRegionFilterLabel(context);
            
            // Auto-apply filters
            if (context === 'global') applyGlobalFiltersDebounced();
            if (context === 'campaign') filterCampaigns();
        }

        // Clear all regions
        function clearAllRegions(context) {
            document.querySelectorAll(`.${context}-region-checkbox`).forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // Update all group checkboxes
            Object.keys(regionGroups).forEach(groupKey => {
                const groupCheckbox = document.getElementById(`${context}-group-${groupKey}`);
                if (groupCheckbox) {
                    groupCheckbox.checked = false;
                    groupCheckbox.indeterminate = false;
                }
            });
            
            updateRegionFilterLabel(context);
            
            // Auto-apply filters
            if (context === 'global') applyGlobalFiltersDebounced();
            if (context === 'campaign') filterCampaigns();
        }

        // Get selected regions for a context
        function getSelectedRegions(context) {
            const checkboxes = document.querySelectorAll(`.${context}-region-checkbox:checked`);
            return Array.from(checkboxes).map(cb => cb.value);
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', function(event) {
            if (!event.target.closest('.region-filter-container')) {
                document.querySelectorAll('.region-filter-dropdown.show').forEach(dropdown => {
                    dropdown.classList.remove('show');
                    const button = dropdown.previousElementSibling;
                    if (button) button.classList.remove('active');
                });
            }
        });

        // ==================================================================================
        // == END MULTI-SELECT REGION FILTER FUNCTIONS =====================================
        // ==================================================================================

        // Debounce timer for auto-apply filters
        var globalFilterDebounceTimer = null;
        
        // Debounced version of applyGlobalFilters to prevent excessive calls
        function applyGlobalFiltersDebounced() {
            if (globalFilterDebounceTimer) {
                clearTimeout(globalFilterDebounceTimer);
            }
            globalFilterDebounceTimer = setTimeout(function() {
                applyGlobalFilters();
            }, 300); // 300ms delay
        }

        // Apply global filters across all tabs
        function applyGlobalFilters() {
            const dateFrom = document.getElementById('global-date-from').value;
            const dateTo = document.getElementById('global-date-to').value;
            const regions = getSelectedRegions('global');
            const trade = document.getElementById('global-trade').value;
            
            // Store global filter state
            window.globalFilters = {
                dateFrom: dateFrom,
                dateTo: dateTo,
                regions: regions,
                trade: trade
            };
            
            // Apply filters to all data
            applyGlobalDataFilters(dateFrom, dateTo, regions, trade);
            
            // Refresh all tabs with filtered data
            refreshAllTabs();
        }

        // Apply global filters to all datasets
        function applyGlobalDataFilters(dateFrom, dateTo, regions, trade) {
            const fromDateObj = dateFrom ? new Date(dateFrom) : null;
            const toDateObj = dateTo ? new Date(dateTo) : null;
            if (fromDateObj) fromDateObj.setHours(0, 0, 0, 0);
            if (toDateObj) toDateObj.setHours(23, 59, 59, 999);

            // Filter subscriber data
            filteredSubscriberData = subscriberData.filter(item => {
                if (!item) return false;
                const itemDate = parseDate(item.date);
                let include = true;

                if (fromDateObj && itemDate < fromDateObj) include = false;
                if (toDateObj && itemDate > toDateObj) include = false;
                if (regions && regions.length > 0 && !regions.includes(item.region)) include = false;

                return include;
            });

            // Filter trade data
            filteredTradeData = tradeData.filter(item => {
                if (!item) return false;
                const itemDate = parseDate(item.date);
                let include = true;

                if (fromDateObj && itemDate < fromDateObj) include = false;
                if (toDateObj && itemDate > toDateObj) include = false;
                if (regions && regions.length > 0 && !regions.includes(item.region)) include = false;
                if (trade && item.trade !== trade) include = false;

                return include;
            });
            
            // Filter regional metrics data (for Email Analytics)
            if (typeof regionalMetricsData !== 'undefined' && regionalMetricsData) {
                filteredRegionalMetricsData = regionalMetricsData.filter(item => {
                    if (!item) return false;
                    let include = true;
                    
                    // Filter by regions if any are selected
                    if (regions && regions.length > 0) {
                        const normalizedRegion = normalizeRegionCode(item.region);
                        include = regions.includes(normalizedRegion) || regions.includes(item.region);
                    }
                    
                    return include;
                });
            }
        }

        // Refresh all tabs with current filtered data
        function refreshAllTabs() {
            // Refresh Overview tab
            updateOverviewStats();
            const latestSnapshotData = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            const latestTradeSnapshotData = getLatestSnapshot(filteredTradeData, 'trade');
            renderSubscriberSnapshotChart(latestSnapshotData);
            renderTradeSnapshotChart(latestTradeSnapshotData);
            
            // Refresh Growth tab charts
            updateChart();
            renderGrowthSubscriberSnapshotChart(latestSnapshotData);
            renderGrowthTradeSnapshotChart(latestTradeSnapshotData);
            
            // Refresh Email Analytics
            renderEmailAnalytics();
            
            // Refresh Campaigns
            filterCampaigns();
            
            // Refresh Signup Sources
            filterSignupPerformance();
            
            // Refresh MyAccount tab
            applyGlobalFiltersToMyAccount();
        }

        // Initialize global filters
        function initializeGlobalFilters() {
            // Initialize the region filter dropdown
            initializeRegionFilter('global');
            
            // Populate the trade dropdown
            populateGlobalTradeDropdown();
        }

        // Populate trade dropdown with available trades
        function populateGlobalTradeDropdown() {
            const tradeSelect = document.getElementById('global-trade');
            if (!tradeSelect) return;
            
            // Get unique trades from trade data
            const uniqueTrades = [...new Set(tradeData.map(item => item.trade).filter(Boolean))].sort();
            
            // Clear and rebuild options
            tradeSelect.innerHTML = '<option value="">All Trades</option>';
            uniqueTrades.forEach(trade => {
                if (trade && trade !== 'UNKNOWN' && trade !== 'NOT_SET') {
                    const option = document.createElement('option');
                    option.value = trade;
                    option.textContent = trade.replace(/_/g, ' ');
                    tradeSelect.appendChild(option);
                }
            });
        }

        // Apply filters for specific tab (legacy - now uses global filters)
        function applyTabFilters(tabName) {
            // All tabs now use global filters
            applyGlobalFilters();
        }


        // Update overview statistics
        // Update overview statistics
        function updateOverviewStats() {
            log('=== UPDATE OVERVIEW STATS DEBUG ===');
            log('filteredSubscriberData length:', filteredSubscriberData.length);
            log('filteredTradeData length:', filteredTradeData.length);
            
            // Get the latest snapshot data (not sum all records)
            const latestSnapshot = getLatestSnapshot(filteredSubscriberData, 'subscriber');
            log('latestSnapshot length:', latestSnapshot.length);
            
            if (latestSnapshot.length > 0) {
                log('Sample latestSnapshot (first 3):', latestSnapshot.slice(0, 3));
            } else {
                console.warn('⚠️ latestSnapshot is EMPTY!');
            }
            
            // Exclude GLOBAL region as it's an aggregate/rollup of other regions
            const latestSnapshotWithoutGlobal = latestSnapshot.filter(item => item.region !== 'GLOBAL');
            log('latestSnapshotWithoutGlobal length:', latestSnapshotWithoutGlobal.length);
            
            // Sum only the latest snapshot counts (excluding GLOBAL to avoid double counting)
            const totalSubscribers = latestSnapshotWithoutGlobal.reduce((sum, item) => {
                return sum + (item.count || item.totalSubscribers || 0);
            }, 0);
            log('totalSubscribers calculated:', totalSubscribers);
            
            // Count unique regions from latest snapshot (excluding GLOBAL)
            const regions = new Set(latestSnapshotWithoutGlobal.map(item => item.region)).size;
            log('unique regions count:', regions);
            
            // Get unique trades from filtered trade data's latest snapshot
            const latestTradeSnapshot = getLatestSnapshot(filteredTradeData, 'trade');
            log('latestTradeSnapshot length:', latestTradeSnapshot.length);
            const trades = new Set(latestTradeSnapshot.map(item => item.trade)).size;
            log('unique trades count:', trades);
            
            // Calculate average per region
            const avgPerRegion = regions > 0 ? Math.round(totalSubscribers / regions) : 0;
            log('avgPerRegion:', avgPerRegion);
            log('=== END STATS DEBUG ===\n');

            document.getElementById('totalSubscribers').textContent = totalSubscribers.toLocaleString();
            document.getElementById('totalRegions').textContent = regions;
            document.getElementById('totalTrades').textContent = trades;
            document.getElementById('avgSubscribers').textContent = avgPerRegion.toLocaleString();
        }

        // ==================================================================================
        // == DOI PENDING CONTACTS FUNCTIONS ===============================================
        // ==================================================================================

        // Track current pending contacts view
        let currentPendingView = 'region';

        // Toggle between Region and Identifier views
        function togglePendingView(view) {
            currentPendingView = view;
            
            // Update button states
            document.querySelectorAll('.pending-view-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });
            
            // Toggle table visibility
            const regionContainer = document.getElementById('pendingRegionTableContainer');
            const identifierContainer = document.getElementById('pendingIdentifierTableContainer');
            
            if (view === 'region') {
                regionContainer.classList.remove('d-none');
                identifierContainer.classList.add('d-none');
            } else {
                regionContainer.classList.add('d-none');
                identifierContainer.classList.remove('d-none');
            }
        }

        // Render the DOI Pending Contacts section with dual views
        function renderPendingContactsSection() {
            const data = typeof pendingContactsData !== 'undefined' ? pendingContactsData : [];
            
            // Calculate summary statistics
            let totalPending = 0;
            let genericTotal = 0;
            let pemTotal = 0;
            const regionsWithPending = new Set();
            const identifiersWithPending = new Set();
            let lastUpdated = null;
            
            data.forEach(item => {
                const count = item.pendingCount || 0;
                totalPending += count;
                
                if (item.journeyType === 'Generic') {
                    genericTotal += count;
                } else if (item.journeyType === 'PEM') {
                    pemTotal += count;
                }
                
                if (count > 0) {
                    if (item.region) regionsWithPending.add(item.region);
                    if (item.signupIdentifier) identifiersWithPending.add(item.signupIdentifier);
                }
                
                // Track the most recent inserted date
                if (item.insertedDate && (!lastUpdated || item.insertedDate > lastUpdated)) {
                    lastUpdated = item.insertedDate;
                }
            });
            
            // Update stat cards
            document.getElementById('pendingTotalCount').textContent = totalPending.toLocaleString();
            document.getElementById('pendingGenericCount').textContent = genericTotal.toLocaleString();
            document.getElementById('pendingPEMCount').textContent = pemTotal.toLocaleString();
            document.getElementById('pendingRegionCount').textContent = regionsWithPending.size;
            document.getElementById('pendingIdentifierCount').textContent = identifiersWithPending.size;
            
            // Update last updated timestamp
            // SFMC returns US format (M/D/YYYY H:MM:SS AM/PM) but stores in UTC-6 offset from display timezone
            const lastUpdatedEl = document.getElementById('pendingLastUpdated');
            if (lastUpdated) {
                const date = new Date(lastUpdated);
                // (BUGFIX) Only apply the +6h server-clock adjustment when the
                // timestamp has no explicit offset; if the string is already
                // zoned (Z / +hh:mm), new Date() has handled it and adding 6
                // hours would double-shift the display.
                const hasExplicitOffset = /Z$|[+-]\d{2}:?\d{2}$/.test(String(lastUpdated));
                if (!hasExplicitOffset) date.setHours(date.getHours() + 6); // Adjust to match SFMC Automation Studio display
                const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                const d = date.getDate();
                const m = months[date.getMonth()];
                const y = date.getFullYear();
                const hh = String(date.getHours()).padStart(2, '0');
                const mm = String(date.getMinutes()).padStart(2, '0');
                lastUpdatedEl.textContent = `Last updated: ${d} ${m} ${y}, ${hh}:${mm}`;
            } else {
                lastUpdatedEl.textContent = '';
            }
            
            // Render both tables
            renderPendingByRegionTable(data);
            renderPendingByIdentifierTable(data);
        }

        // Render the "By Region" table (aggregates across identifiers)
        function renderPendingByRegionTable(data) {
            const tbody = document.getElementById('pendingRegionTableBody');
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="pending-no-data">No pending DOI contacts data available. Please ensure the DOI_Pending_Contacts_Aggregated Data Extension has been created and populated by the automation.</td></tr>';
                return;
            }
            
            // Aggregate by region
            const regionMap = new Map();
            
            data.forEach(item => {
                const region = item.region || 'Unknown';
                if (!regionMap.has(region)) {
                    regionMap.set(region, {
                        region: region,
                        total: 0,
                        generic: 0,
                        pem: 0,
                        oldestDate: null,
                        newestDate: null
                    });
                }
                
                const regionData = regionMap.get(region);
                regionData.total += item.pendingCount || 0;
                
                if (item.journeyType === 'Generic') {
                    regionData.generic += item.pendingCount || 0;
                } else if (item.journeyType === 'PEM') {
                    regionData.pem += item.pendingCount || 0;
                }
                
                // Track oldest and newest dates
                if (item.oldestPendingDate) {
                    if (!regionData.oldestDate || item.oldestPendingDate < regionData.oldestDate) {
                        regionData.oldestDate = item.oldestPendingDate;
                    }
                }
                if (item.newestPendingDate) {
                    if (!regionData.newestDate || item.newestPendingDate > regionData.newestDate) {
                        regionData.newestDate = item.newestPendingDate;
                    }
                }
            });
            
            // Convert to array and sort by total descending
            const sortedRegions = Array.from(regionMap.values())
                .filter(r => r.total > 0)
                .sort((a, b) => b.total - a.total);
            
            if (sortedRegions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="pending-no-data">🎉 Great news! No contacts are currently pending DOI confirmation.</td></tr>';
                return;
            }
            
            let tableHTML = '';
            sortedRegions.forEach(item => {
                const oldestDate = item.oldestDate ? formatDateForDisplay(item.oldestDate) : '-';
                const newestDate = item.newestDate ? formatDateForDisplay(item.newestDate) : '-';
                
                tableHTML += `
                    <tr>
                        <td class="pending-region">${item.region}</td>
                        <td class="pending-count">${item.total.toLocaleString()}</td>
                        <td>${item.generic.toLocaleString()}</td>
                        <td>${item.pem.toLocaleString()}</td>
                        <td class="pending-date">${oldestDate}</td>
                        <td class="pending-date">${newestDate}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = tableHTML;
        }

        // Render the "By Identifier" table (aggregates across regions)
        function renderPendingByIdentifierTable(data) {
            const tbody = document.getElementById('pendingIdentifierTableBody');
            
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="pending-no-data">No pending DOI contacts data available. Please ensure the DOI_Pending_Contacts_Aggregated Data Extension has been created and populated by the automation.</td></tr>';
                return;
            }
            
            // Aggregate by signup identifier
            const identifierMap = new Map();
            
            data.forEach(item => {
                const identifier = item.signupIdentifier || 'Unknown';
                if (!identifierMap.has(identifier)) {
                    identifierMap.set(identifier, {
                        signupIdentifier: identifier,
                        total: 0,
                        generic: 0,
                        pem: 0,
                        regions: new Set(),
                        oldestDate: null,
                        newestDate: null
                    });
                }
                
                const identifierData = identifierMap.get(identifier);
                identifierData.total += item.pendingCount || 0;
                
                if (item.journeyType === 'Generic') {
                    identifierData.generic += item.pendingCount || 0;
                } else if (item.journeyType === 'PEM') {
                    identifierData.pem += item.pendingCount || 0;
                }
                
                // Track regions
                if (item.region && item.pendingCount > 0) {
                    identifierData.regions.add(item.region);
                }
                
                // Track oldest and newest dates
                if (item.oldestPendingDate) {
                    if (!identifierData.oldestDate || item.oldestPendingDate < identifierData.oldestDate) {
                        identifierData.oldestDate = item.oldestPendingDate;
                    }
                }
                if (item.newestPendingDate) {
                    if (!identifierData.newestDate || item.newestPendingDate > identifierData.newestDate) {
                        identifierData.newestDate = item.newestPendingDate;
                    }
                }
            });
            
            // Convert to array and sort by total descending
            const sortedIdentifiers = Array.from(identifierMap.values())
                .filter(i => i.total > 0)
                .sort((a, b) => b.total - a.total);
            
            if (sortedIdentifiers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="pending-no-data">🎉 Great news! No contacts are currently pending DOI confirmation.</td></tr>';
                return;
            }
            
            let tableHTML = '';
            sortedIdentifiers.forEach(item => {
                const oldestDate = item.oldestDate ? formatDateForDisplay(item.oldestDate) : '-';
                const newestDate = item.newestDate ? formatDateForDisplay(item.newestDate) : '-';
                
                tableHTML += `
                    <tr>
                        <td class="pending-identifier">${item.signupIdentifier}</td>
                        <td class="pending-count">${item.total.toLocaleString()}</td>
                        <td>${item.regions.size}</td>
                        <td>${item.generic.toLocaleString()}</td>
                        <td>${item.pem.toLocaleString()}</td>
                        <td class="pending-date">${oldestDate}</td>
                        <td class="pending-date">${newestDate}</td>
                    </tr>
                `;
            });
            
            tbody.innerHTML = tableHTML;
        }
        
        // Helper function to format date for display
        function formatDateForDisplay(dateStr) {
            if (!dateStr) return '-';
            try {
                const date = new Date(dateStr);
                if (isNaN(date.getTime())) return dateStr;
                return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                });
            } catch (e) {
                return dateStr;
            }
        }

        // ==================================================================================
        // == MYACCOUNT TAB FUNCTIONS ======================================================
        // ==================================================================================
        //
        // MyAccount Analytics - Aggregated Data Implementation
        // Updated: May 2026
        //
        // Reads from 3 pre-aggregated DEs built daily by MYACCOUNT_DASHBOARD_AGGREGATION_DAILY:
        //   myAccountSummaryData  -> MyAccount_Daily_Summary      (headline totals per date)
        //   myAccountRegionData   -> MyAccount_Daily_Region_Summary (totals by date + culture)
        //   myAccountTradeData    -> MyAccount_Daily_Trade_Summary  (totals by date + trade)
        //
        // All normalisation (consent mapping, trade normalisation) has already been done
        // in SQL by the automation. ConsentCategory values are 'Opted-In' / 'Not Opted-In'.
        //
        // ==================================================================================

        // Chart instances for MyAccount tab
        let myAccountTradeChart = null;
        let myAccountRegionChart = null;
        let myAccountGrowthChart = null;
        
        // MyAccount state
        let myAccountSortColumn = 'totalAccounts';
        let myAccountSortDirection = 'desc';
        let maGrowthChartType = 'line';
        let maGrowthGrouping = 'month';
        
        // Helper: Get region display name
        function getRegionDisplayName(regionCode) {
            const cultureInfo = getCultureInfo(regionCode);
            return cultureInfo ? cultureInfo.name : regionCode;
        }

        // Check whether any MyAccount aggregated data is available
        function hasMyAccountData() {
            return (typeof myAccountSummaryData !== 'undefined' && Array.isArray(myAccountSummaryData) && myAccountSummaryData.length > 0)
                || (typeof myAccountRegionData !== 'undefined' && Array.isArray(myAccountRegionData) && myAccountRegionData.length > 0);
        }

        // Compute MyAccount metrics from the pre-aggregated DEs.
        // Parameters:
        //   dateFrom      - 'YYYY-MM-DD' string or ''  (registration date range start)
        //   dateTo        - 'YYYY-MM-DD' string or ''  (registration date range end, inclusive)
        //   filterRegions - array of uppercase region code strings, or [] for all
        //   filterTrade   - normalised trade string or '' for all
        function computeMyAccountMetrics(dateFrom, dateTo, filterRegions, filterTrade) {
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate   = dateTo   ? new Date(dateTo + 'T23:59:59') : null;
            const hasRegionFilter = filterRegions && filterRegions.length > 0;
            const hasTradeFilter  = filterTrade && filterTrade.length > 0;

            // Helper: does a registrationDateOnly string pass the date filter?
            function passesDate(dateStr) {
                if (!fromDate && !toDate) return true;
                if (!dateStr) return false;
                const d = new Date(dateStr);
                if (fromDate && d < fromDate) return false;
                if (toDate   && d > toDate)   return false;
                return true;
            }

            // === HEADLINE TOTALS ===
            // Use summaryData (no region/trade filter) or regionData (region filter) or tradeData (trade filter)
            let totalAccounts = 0;
            let marketingOptedIn = 0;
            let marketingNotOptedIn = 0;

            if (!hasRegionFilter && !hasTradeFilter) {
                // No dimensional filters — sum the summary DE for accurate totals
                (myAccountSummaryData || []).filter(r => passesDate(r.registrationDateOnly)).forEach(r => {
                    totalAccounts       += r.totalAccounts;
                    marketingOptedIn    += r.marketingOptedIn;
                    marketingNotOptedIn += r.marketingNotOptedIn;
                });
            } else if (hasRegionFilter && !hasTradeFilter) {
                // Region filter only — aggregate from region DE filtered by culture
                (myAccountRegionData || []).filter(r => passesDate(r.registrationDateOnly) && filterRegions.includes(r.userCulture)).forEach(r => {
                    totalAccounts       += r.totalAccounts;
                    marketingOptedIn    += r.marketingOptedIn;
                    marketingNotOptedIn += r.marketingNotOptedIn;
                });
            } else if (!hasRegionFilter && hasTradeFilter) {
                // Trade filter only — aggregate from trade DE filtered by trade
                (myAccountTradeData || []).filter(r => passesDate(r.registrationDateOnly) && r.primaryTradeNormalised === filterTrade).forEach(r => {
                    totalAccounts       += r.totalAccounts;
                    marketingOptedIn    += r.marketingOptedIn;
                    marketingNotOptedIn += r.marketingNotOptedIn;
                });
            } else {
                // Both region + trade — best available is region-filtered totals (trade breakdown still shown per-trade)
                (myAccountRegionData || []).filter(r => passesDate(r.registrationDateOnly) && filterRegions.includes(r.userCulture)).forEach(r => {
                    totalAccounts       += r.totalAccounts;
                    marketingOptedIn    += r.marketingOptedIn;
                    marketingNotOptedIn += r.marketingNotOptedIn;
                });
            }

            // === REGION BREAKDOWN ===
            // Aggregate from regionData, filtered by date and optionally by culture
            const regionMap = new Map();
            (myAccountRegionData || []).forEach(r => {
                if (!passesDate(r.registrationDateOnly)) return;
                if (hasRegionFilter && !filterRegions.includes(r.userCulture)) return;
                if (!regionMap.has(r.userCulture)) {
                    regionMap.set(r.userCulture, { totalAccounts: 0, marketingOptedIn: 0, marketingNotOptedIn: 0 });
                }
                const e = regionMap.get(r.userCulture);
                e.totalAccounts       += r.totalAccounts;
                e.marketingOptedIn    += r.marketingOptedIn;
                e.marketingNotOptedIn += r.marketingNotOptedIn;
            });

            const activeRegions  = regionMap.size;
            const regionTotal    = totalAccounts || 1; // prevent division by zero
            const regionBreakdown = Array.from(regionMap.entries())
                .map(([region, e]) => ({
                    region:    region,
                    name:      getRegionDisplayName(region),
                    count:     e.totalAccounts,
                    uniqueCount: e.totalAccounts,
                    percent:   Math.round((e.totalAccounts / regionTotal) * 1000) / 10,
                    optedIn:   e.marketingOptedIn,
                    optedOut:  e.marketingNotOptedIn,
                    optinRate: e.totalAccounts > 0 ? Math.round((e.marketingOptedIn / e.totalAccounts) * 1000) / 10 : 0
                }))
                .sort((a, b) => b.count - a.count);

            // === TRADE BREAKDOWN ===
            // Aggregate from tradeData, filtered by date and optionally by trade
            const tradeMap = new Map();
            (myAccountTradeData || []).forEach(r => {
                if (!passesDate(r.registrationDateOnly)) return;
                if (hasTradeFilter && r.primaryTradeNormalised !== filterTrade) return;
                if (!tradeMap.has(r.primaryTradeNormalised)) {
                    tradeMap.set(r.primaryTradeNormalised, { totalAccounts: 0, marketingOptedIn: 0 });
                }
                const e = tradeMap.get(r.primaryTradeNormalised);
                e.totalAccounts    += r.totalAccounts;
                e.marketingOptedIn += r.marketingOptedIn;
            });

            const tradeTotal = totalAccounts || 1;
            const tradeBreakdown = Array.from(tradeMap.entries())
                .map(([trade, e]) => ({
                    trade:     trade,
                    count:     e.totalAccounts,
                    percent:   Math.round((e.totalAccounts / tradeTotal) * 1000) / 10,
                    optedIn:   e.marketingOptedIn,
                    optinRate: e.totalAccounts > 0 ? Math.round((e.marketingOptedIn / e.totalAccounts) * 1000) / 10 : 0
                }))
                .sort((a, b) => b.count - a.count);

            const tradeCategories = Array.from(tradeMap.keys()).filter(k => k !== 'Not Specified').length;

            return {
                totalAccounts:   totalAccounts,
                uniqueContacts:  totalAccounts, // exact unique contacts not available from aggregated DEs
                optedIn:         marketingOptedIn,
                optedOut:        marketingNotOptedIn,
                activeRegions:   activeRegions,
                tradeCategories: tradeCategories,
                tradeBreakdown:  tradeBreakdown,
                regionBreakdown: regionBreakdown,
                consentBreakdown: []
            };
        }

        // ===== MYACCOUNT GROWTH CHART =====

        // Build grouped time-series from myAccountSummaryData (or region-filtered subset)
        // Returns { labels, accountData, optinData, periods }
        function prepareMAGrowthData(dateFrom, dateTo, filterRegions) {
            const fromDate = dateFrom ? new Date(dateFrom) : null;
            const toDate   = dateTo   ? new Date(dateTo + 'T23:59:59') : null;
            const hasRegionFilter = filterRegions && filterRegions.length > 0;

            // Helper: does this registration date pass the date filter?
            function passesDate(dateStr) {
                if (!fromDate && !toDate) return true;
                if (!dateStr) return false;
                const d = new Date(dateStr);
                if (fromDate && d < fromDate) return false;
                if (toDate   && d > toDate)   return false;
                return true;
            }

            // Choose source: regionData when filtered by culture, summaryData otherwise
            let rows;
            if (hasRegionFilter) {
                rows = (myAccountRegionData || [])
                    .filter(r => passesDate(r.registrationDateOnly) && filterRegions.includes(r.userCulture));
            } else {
                rows = (myAccountSummaryData || [])
                    .filter(r => passesDate(r.registrationDateOnly));
            }

            // Group by period key
            const periodMap = new Map();
            rows.forEach(r => {
                const d = new Date(r.registrationDateOnly);
                if (isNaN(d.getTime())) return;

                let key;
                if (maGrowthGrouping === 'year') {
                    key = String(d.getFullYear());
                } else if (maGrowthGrouping === 'month') {
                    key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
                } else {
                    key = r.registrationDateOnly.split('T')[0];
                }

                if (!periodMap.has(key)) {
                    periodMap.set(key, { totalAccounts: 0, marketingOptedIn: 0 });
                }
                const e = periodMap.get(key);
                e.totalAccounts    += r.totalAccounts    || 0;
                e.marketingOptedIn += r.marketingOptedIn || 0;
            });

            const sortedKeys = Array.from(periodMap.keys()).sort();

            const labels = sortedKeys.map(key => {
                if (maGrowthGrouping === 'year') return key;
                if (maGrowthGrouping === 'month') {
                    const [yr, mo] = key.split('-');
                    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
                    return monthNames[parseInt(mo) - 1] + ' ' + yr;
                }
                return new Date(key).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
            });

            const accountData = sortedKeys.map(k => periodMap.get(k).totalAccounts);
            const optinData   = sortedKeys.map(k => periodMap.get(k).marketingOptedIn);

            return { labels, accountData, optinData, periods: sortedKeys };
        }

        function renderMyAccountGrowthChart(dateFrom, dateTo, filterRegions) {
            const canvas = document.getElementById('myaccountGrowthChart');
            if (!canvas) return;

            if (myAccountGrowthChart) {
                myAccountGrowthChart.destroy();
                myAccountGrowthChart = null;
            }

            if (!hasMyAccountData()) return;

            const chartData = prepareMAGrowthData(dateFrom || '', dateTo || '', filterRegions || []);

            // Update insight cards
            updateMAGrowthInsightCards(chartData);

            if (!chartData.accountData.length) return;

            const ctx = canvas.getContext('2d');

            myAccountGrowthChart = new Chart(ctx, {
                type: maGrowthChartType,
                data: {
                    labels: chartData.labels,
                    datasets: [
                        {
                            label: 'Total Registrations',
                            data: chartData.accountData,
                            borderColor: '#DB021D',
                            backgroundColor: maGrowthChartType === 'line' ? 'rgba(219, 2, 29, 0.12)' : 'rgba(219, 2, 29, 0.8)',
                            borderWidth: maGrowthChartType === 'line' ? 3 : 1,
                            tension: 0.4,
                            fill: maGrowthChartType === 'line',
                            pointBackgroundColor: '#DB021D',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: maGrowthChartType === 'line' ? 4 : 0,
                            pointHoverRadius: 6
                        },
                        {
                            label: 'Opted-In Registrations',
                            data: chartData.optinData,
                            borderColor: '#28a745',
                            backgroundColor: maGrowthChartType === 'line' ? 'rgba(40, 167, 69, 0.08)' : 'rgba(40, 167, 69, 0.7)',
                            borderWidth: maGrowthChartType === 'line' ? 2 : 1,
                            tension: 0.4,
                            fill: maGrowthChartType === 'line',
                            pointBackgroundColor: '#28a745',
                            pointBorderColor: '#ffffff',
                            pointBorderWidth: 2,
                            pointRadius: maGrowthChartType === 'line' ? 3 : 0,
                            pointHoverRadius: 5,
                            borderDash: maGrowthChartType === 'line' ? [5, 3] : []
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: {
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                color: '#333333',
                                font: { size: 11 },
                                usePointStyle: true,
                                boxWidth: 10
                            }
                        },
                        tooltip: {
                            backgroundColor: 'rgba(255,255,255,0.97)',
                            titleColor: '#333333',
                            bodyColor: '#555555',
                            borderColor: '#DB021D',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                afterBody: function(items) {
                                    const total = items[0] ? items[0].parsed.y : 0;
                                    const optin = items[1] ? items[1].parsed.y : 0;
                                    const rate = total > 0 ? ((optin / total) * 100).toFixed(1) : '0.0';
                                    return ['Opt-In Rate: ' + rate + '%'];
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { color: '#e0e0e0' },
                            ticks: { color: '#555555', font: { weight: 600 }, maxRotation: 45, minRotation: 0 }
                        },
                        y: {
                            grid: { color: '#e0e0e0' },
                            ticks: {
                                color: '#555555',
                                font: { weight: 600 },
                                callback: function(v) { return v.toLocaleString(); }
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }

        function updateMAGrowthInsightCards(chartData) {
            const totalEl   = document.getElementById('maGrowthTotal');
            const peakEl    = document.getElementById('maGrowthPeak');
            const avgEl     = document.getElementById('maGrowthAvg');
            const optinEl   = document.getElementById('maGrowthOptinRate');

            if (!chartData || !chartData.accountData || chartData.accountData.length === 0) {
                if (totalEl) totalEl.textContent = '-';
                if (peakEl)  peakEl.textContent  = '-';
                if (avgEl)   avgEl.textContent    = '-';
                if (optinEl) optinEl.textContent  = '-';
                return;
            }

            const arr   = chartData.accountData;
            const optin = chartData.optinData;
            const total = arr.reduce((s, v) => s + v, 0);
            const peak  = Math.max(...arr);
            const avg   = Math.round(total / arr.length);
            const totalOptin = optin.reduce((s, v) => s + v, 0);
            const rate  = total > 0 ? ((totalOptin / total) * 100).toFixed(1) : '0.0';

            if (totalEl) totalEl.textContent = total.toLocaleString();
            if (peakEl)  peakEl.textContent  = peak.toLocaleString();
            if (avgEl)   avgEl.textContent   = avg.toLocaleString();
            if (optinEl) optinEl.textContent = rate + '%';
        }

        function toggleMAGrowthChartType(type) {
            maGrowthChartType = type;
            document.querySelectorAll('.myaccount-chart-controls .myaccount-chart-toggle').forEach(btn => {
                const t = btn.textContent.trim().toLowerCase();
                if (t === 'line' || t === 'bar') {
                    btn.classList.toggle('active', t === type);
                }
            });
            const filters = tabState.filters.myaccount || {};
            const filterRegions = filters.culture ? [filters.culture.toUpperCase()] : [];
            renderMyAccountGrowthChart(filters.dateFrom || '', filters.dateTo || '', filterRegions);
        }

        function toggleMAGrowthGrouping(grouping) {
            maGrowthGrouping = grouping;
            document.querySelectorAll('.myaccount-chart-controls .myaccount-chart-toggle').forEach(btn => {
                const t = btn.textContent.trim().toLowerCase();
                if (t === 'daily' || t === 'monthly' || t === 'yearly') {
                    btn.classList.toggle('active', t === grouping + 'ly' || t === grouping);
                }
            });
            const filters = tabState.filters.myaccount || {};
            const filterRegions = filters.culture ? [filters.culture.toUpperCase()] : [];
            renderMyAccountGrowthChart(filters.dateFrom || '', filters.dateTo || '', filterRegions);
        }

        // Initialize MyAccount tab
        function initializeMyAccountTab() {
            if (hasMyAccountData()) {
                const banner = document.querySelector('.myaccount-placeholder-banner');
                if (banner) banner.style.display = 'none';

                const metrics = computeMyAccountMetrics('', '', [], '');
                updateMyAccountStats(metrics);
                renderMyAccountGrowthChart('', '', []);
                renderMyAccountTradeChart(metrics.tradeBreakdown);
                renderMyAccountRegionChart(metrics.regionBreakdown);
                renderMyAccountBreakdownLists(metrics);
                renderMyAccountOptinTable(metrics.regionBreakdown);
            } else {
                const banner = document.querySelector('.myaccount-placeholder-banner');
                if (banner) {
                    banner.style.display = 'flex';
                    const p = banner.querySelector('.banner-content p');
                    if (p) p.textContent = 'No data currently available. The MyAccount aggregation automation may not have run yet.';
                }
                updateMyAccountStatsEmpty();
            }
        }

        // Update MyAccount statistics display
        function updateMyAccountStats(data) {
            const optinPercent  = data.totalAccounts > 0 ? Math.round((data.optedIn / data.totalAccounts) * 100) : 0;
            const optoutPercent = 100 - optinPercent;
            
            const totalEl   = document.getElementById('myaccountTotalAccounts');
            const optedInEl = document.getElementById('myaccountOptedIn');
            const regionsEl = document.getElementById('myaccountRegions');
            const tradesEl  = document.getElementById('myaccountTrades');
            
            if (totalEl)   totalEl.textContent   = data.totalAccounts.toLocaleString();
            if (optedInEl) optedInEl.textContent  = data.optedIn.toLocaleString();
            if (regionsEl) regionsEl.textContent  = data.activeRegions;
            if (tradesEl)  tradesEl.textContent   = data.tradeCategories;
            
            const optinSublabel = document.querySelector('#myAccountStatsGrid .myaccount-stat-card.highlight .myaccount-stat-sublabel');
            if (optinSublabel) optinSublabel.textContent = optinPercent + '% of total accounts';
            
            const optinBar = document.getElementById('myaccountOptinBar');
            if (optinBar) {
                optinBar.innerHTML = `
                    <div class="myaccount-optin-segment optin"  style="width: ${optinPercent}%;">${optinPercent}%</div>
                    <div class="myaccount-optin-segment optout" style="width: ${optoutPercent}%;">${optoutPercent}%</div>
                `;
            }
            
            const optinCountEl  = document.getElementById('myaccountOptinCount');
            const optoutCountEl = document.getElementById('myaccountOptoutCount');
            if (optinCountEl)  optinCountEl.textContent  = data.optedIn.toLocaleString();
            if (optoutCountEl) optoutCountEl.textContent = data.optedOut.toLocaleString();
        }
        
        // Update MyAccount stats to show empty state
        function updateMyAccountStatsEmpty() {
            const elements = ['myaccountTotalAccounts', 'myaccountOptedIn', 'myaccountRegions', 'myaccountTrades'];
            elements.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '0';
            });
            
            const optinBar = document.getElementById('myaccountOptinBar');
            if (optinBar) {
                optinBar.innerHTML = '<div class="myaccount-optin-segment" style="width: 100%; background: #ddd; color: #666;">No data</div>';
            }
            
            const optinCountEl  = document.getElementById('myaccountOptinCount');
            const optoutCountEl = document.getElementById('myaccountOptoutCount');
            if (optinCountEl)  optinCountEl.textContent  = '0';
            if (optoutCountEl) optoutCountEl.textContent = '0';
        }
        
        // Render breakdown lists
        function renderMyAccountBreakdownLists(data) {
            const tradeList = document.getElementById('myaccountTradeBreakdown');
            if (tradeList) {
                const tradeItems = data.tradeBreakdown.slice(0, 10).map(item => `
                    <li>
                        <span class="breakdown-label">${escapeHtml(item.trade)}</span>
                        <span><span class="breakdown-value">${item.count.toLocaleString()}</span><span class="breakdown-percent">(${item.percent}%)</span></span>
                    </li>
                `).join('');
                tradeList.innerHTML = tradeItems || '<li>No data available</li>';
            }
            
            const regionList = document.getElementById('myaccountRegionBreakdown');
            if (regionList) {
                const regionItems = data.regionBreakdown.slice(0, 10).map(item => `
                    <li>
                        <span class="breakdown-label">${item.region} (${escapeHtml(item.name)})</span>
                        <span><span class="breakdown-value">${item.count.toLocaleString()}</span><span class="breakdown-percent">(${item.percent}%)</span></span>
                    </li>
                `).join('');
                regionList.innerHTML = regionItems || '<li>No data available</li>';
            }
        }

        // Render trade distribution doughnut chart
        function renderMyAccountTradeChart(tradeData) {
            const canvas = document.getElementById('myaccountTradeChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (myAccountTradeChart) {
                myAccountTradeChart.destroy();
            }
            
            if (!tradeData || tradeData.length === 0) {
                canvas.style.display = 'none';
                return;
            }
            canvas.style.display = 'block';
            
            let chartData = tradeData.slice(0, 7);
            if (tradeData.length > 7) {
                const otherCount = tradeData.slice(7).reduce((sum, t) => sum + t.count, 0);
                const totalCount = tradeData.reduce((sum, t) => sum + t.count, 0);
                chartData.push({
                    trade:   'Other',
                    count:   otherCount,
                    percent: totalCount > 0 ? Math.round((otherCount / totalCount) * 1000) / 10 : 0
                });
            }
            
            const colors = [
                '#DB021D', '#B50018', '#FF4444', '#333333',
                '#555555', '#777777', '#999999', '#BBBBBB'
            ];
            
            myAccountTradeChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.map(item => item.trade),
                    datasets: [{
                        data: chartData.map(item => item.count),
                        backgroundColor: colors.slice(0, chartData.length),
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: 0 },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#333333', font: { size: 10 }, padding: 8, usePointStyle: true, boxWidth: 8 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw.toLocaleString();
                                    const item = chartData[context.dataIndex];
                                    return `${context.label}: ${value} (${item.percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Render region distribution doughnut chart
        function renderMyAccountRegionChart(regionData) {
            const canvas = document.getElementById('myaccountRegionChart');
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            
            if (myAccountRegionChart) {
                myAccountRegionChart.destroy();
            }
            
            if (!regionData || regionData.length === 0) {
                canvas.style.display = 'none';
                return;
            }
            canvas.style.display = 'block';
            
            const chartData = regionData.slice(0, 10);
            
            const colors = [
                '#DB021D', '#B50018', '#FF4444', '#FF6666',
                '#333333', '#555555', '#777777', '#999999', '#BBBBBB', '#DDDDDD'
            ];
            
            myAccountRegionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: chartData.map(item => `${item.region} (${item.name})`),
                    datasets: [{
                        data: chartData.map(item => item.count),
                        backgroundColor: colors.slice(0, chartData.length),
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: 0 },
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#333333', font: { size: 10 }, padding: 6, usePointStyle: true, boxWidth: 8 }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw.toLocaleString();
                                    const item = chartData[context.dataIndex];
                                    return `${context.label}: ${value} (${item.percent}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Render opt-in table by region
        function renderMyAccountOptinTable(regionData) {
            const tableBody = document.getElementById('myaccountOptinTableBody');
            if (!tableBody) return;
            
            if (!regionData || regionData.length === 0) {
                tableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No data available</td></tr>';
                return;
            }
            
            let sortedData = [...regionData];
            sortedData.sort((a, b) => {
                let aVal, bVal;
                switch (myAccountSortColumn) {
                    case 'region':       aVal = a.region;    bVal = b.region;    break;
                    case 'totalAccounts': aVal = a.count;    bVal = b.count;    break;
                    case 'optedIn':      aVal = a.optedIn;   bVal = b.optedIn;   break;
                    case 'optedOut':     aVal = a.optedOut;  bVal = b.optedOut;  break;
                    case 'optinRate':    aVal = a.optinRate; bVal = b.optinRate; break;
                    default:             aVal = a.count;     bVal = b.count;
                }
                if (typeof aVal === 'string') {
                    return myAccountSortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return myAccountSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
            });
            
            const rows = sortedData.map(item => {
                const rateColor = item.optinRate >= 75 ? 'var(--success)' : item.optinRate >= 50 ? '#ffa500' : 'var(--milwaukee-red)';
                return `
                    <tr>
                        <td>${item.region} (${escapeHtml(item.name)})</td>
                        <td>${item.count.toLocaleString()}</td>
                        <td style="color: var(--success); font-weight: 700;">${item.optedIn.toLocaleString()}</td>
                        <td style="color: var(--milwaukee-silver);">${item.optedOut.toLocaleString()}</td>
                        <td><span style="color: ${rateColor}; font-weight: 700;">${item.optinRate}%</span></td>
                    </tr>
                `;
            }).join('');
            
            tableBody.innerHTML = rows;
            updateMyAccountTableHeaders();
        }
        
        // Update table header sort indicators
        function updateMyAccountTableHeaders() {
            const headers = document.querySelectorAll('#myaccountOptinTable thead th.sortable');
            headers.forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
            
            const columnMap = { region: 0, totalAccounts: 1, optedIn: 2, optedOut: 3, optinRate: 4 };
            const headerIndex = columnMap[myAccountSortColumn];
            if (headerIndex !== undefined && headers[headerIndex]) {
                headers[headerIndex].classList.add(myAccountSortDirection === 'asc' ? 'sort-asc' : 'sort-desc');
            }
        }

        // Apply global filters to MyAccount tab
        function applyGlobalFiltersToMyAccount() {
            if (!hasMyAccountData()) return;
            
            const globalDateFrom = document.getElementById('global-date-from')?.value || '';
            const globalDateTo   = document.getElementById('global-date-to')?.value   || '';
            const globalTrade    = document.getElementById('global-trade')?.value      || '';
            
            const globalRegions = [];
            document.querySelectorAll('#global-region-dropdown input[type="checkbox"]:checked').forEach(cb => {
                if (cb.value) globalRegions.push(cb.value.toUpperCase());
            });
            
            tabState.filters.myaccount = {
                dateFrom: globalDateFrom,
                dateTo:   globalDateTo,
                culture:  globalRegions.length === 1 ? globalRegions[0] : ''
            };
            
            // Sync any local filter inputs that exist in the HTML
            const localDateFrom = document.getElementById('myaccountDateFrom');
            const localDateTo   = document.getElementById('myaccountDateTo');
            const localCulture  = document.getElementById('myaccountCulture');
            if (localDateFrom) localDateFrom.value = globalDateFrom;
            if (localDateTo)   localDateTo.value   = globalDateTo;
            if (localCulture) {
                localCulture.value = globalRegions.length === 1 ? globalRegions[0] : '';
            }
            
            const metrics = computeMyAccountMetrics(globalDateFrom, globalDateTo, globalRegions, globalTrade);
            updateMyAccountStats(metrics);
            renderMyAccountGrowthChart(globalDateFrom, globalDateTo, globalRegions);
            renderMyAccountTradeChart(metrics.tradeBreakdown);
            renderMyAccountRegionChart(metrics.regionBreakdown);
            renderMyAccountBreakdownLists(metrics);
            renderMyAccountOptinTable(metrics.regionBreakdown);
        }

        // Filter MyAccount data (local tab filters)
        function filterMyAccountData() {
            const dateFrom = document.getElementById('myaccountDateFrom')?.value || '';
            const dateTo   = document.getElementById('myaccountDateTo')?.value   || '';
            const culture  = document.getElementById('myaccountCulture')?.value  || '';
            
            tabState.filters.myaccount = { dateFrom, dateTo, culture };
            
            const filterRegions = culture ? [culture.toUpperCase()] : [];
            const metrics = computeMyAccountMetrics(dateFrom, dateTo, filterRegions, '');
            updateMyAccountStats(metrics);
            renderMyAccountGrowthChart(dateFrom, dateTo, filterRegions);
            renderMyAccountTradeChart(metrics.tradeBreakdown);
            renderMyAccountRegionChart(metrics.regionBreakdown);
            renderMyAccountBreakdownLists(metrics);
            renderMyAccountOptinTable(metrics.regionBreakdown);
        }

        // Clear MyAccount filters
        function clearMyAccountFilters() {
            const dateFromEl = document.getElementById('myaccountDateFrom');
            const dateToEl   = document.getElementById('myaccountDateTo');
            const cultureEl  = document.getElementById('myaccountCulture');
            if (dateFromEl) dateFromEl.value = '';
            if (dateToEl)   dateToEl.value   = '';
            if (cultureEl)  cultureEl.value  = '';
            
            tabState.filters.myaccount = { dateFrom: '', dateTo: '', culture: '' };
            initializeMyAccountTab();
        }

        // Sort MyAccount table
        function sortMyAccountTable(column) {
            if (myAccountSortColumn === column) {
                myAccountSortDirection = myAccountSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                myAccountSortColumn = column;
                myAccountSortDirection = 'desc';
            }
            
            if (!hasMyAccountData()) return;
            
            const filters = tabState.filters.myaccount || {};
            const filterRegions = filters.culture ? [filters.culture.toUpperCase()] : [];
            const metrics = computeMyAccountMetrics(filters.dateFrom || '', filters.dateTo || '', filterRegions, '');
            renderMyAccountOptinTable(metrics.regionBreakdown);
        }
