# Milwaukee Power Tools - Enhanced Subscriber Analytics Dashboard

## Overview
This enhanced SFMC CloudPage dashboard provides comprehensive analytics for Milwaukee Power Tools' global subscriber base with support for multiple user cultures and regions.

## New Features Added

### 1. Culture-Specific Views
- **30 Supported Cultures** with country flags and localized names
- Individual dashboard views for each culture/region
- Culture-specific analytics and metrics

### 2. Enhanced Navigation
- **Combined View**: Overall analytics across all regions (default view)
- **Culture Dropdown**: Easy selection between different cultures/regions
- Country flags for visual identification

### 3. Supported Cultures
The dashboard now supports 30 different cultures including:

#### Western Europe
- 🇬🇧 English (UK)
- 🇺🇸 English (US) 
- 🇩🇪 German (Germany)
- 🇫🇷 French (France)
- 🇪🇸 Spanish (Spain)
- 🇮🇹 Italian (Italy)
- 🇳🇱 Dutch (Netherlands)
- 🇧🇪 Dutch/French (Belgium)
- 🇨🇭 German/French/Italian (Switzerland)
- 🇦🇹 German (Austria)
- 🇵🇹 Portuguese (Portugal)
- 🇱🇺 Luxembourgish (Luxembourg)

#### Nordic Countries
- 🇩🇰 Danish (Denmark)
- 🇸🇪 Swedish (Sweden)
- 🇳🇴 Norwegian (Norway)
- 🇫🇮 Finnish (Finland)

#### Eastern Europe
- 🇵🇱 Polish (Poland)
- 🇨🇿 Czech (Czech Republic)
- 🇸🇰 Slovak (Slovakia)
- 🇭🇺 Hungarian (Hungary)
- 🇷🇴 Romanian (Romania)
- 🇧🇬 Bulgarian (Bulgaria)
- 🇪🇪 Estonian (Estonia)
- 🇱🇻 Latvian (Latvia)
- 🇱🇹 Lithuanian (Lithuania)

#### Other Regions
- 🇿🇦 English (South Africa)
- 🇦🇪 Arabic (UAE)
- 🇹🇷 Turkish (Turkey)

## Dashboard Features

### Combined View
- **Global Email Analytics**: Performance metrics across all regions
- **Subscriber Growth Charts**: Visualize total subscriber growth over time
- **Trade Distribution**: Analysis of primary trades across all cultures
- **Regional Comparisons**: Side-by-side comparison of different regions

### Culture-Specific Views
Each culture view includes:

#### Culture Header
- Large country flag display
- Culture name and country information
- Key performance indicators for that specific culture

#### Email Performance Analytics
- Culture-specific email campaign metrics
- Delivery rates, open rates, click-through rates
- Historical performance trends
- Visual charts showing performance over time

#### Subscriber Growth Analysis
- Culture-specific subscriber count tracking
- Growth trends with daily/weekly/monthly grouping options
- Interactive charts (line/bar chart options)

#### Trade Distribution
- Primary trade breakdown for the selected culture
- Historical trade data analysis
- Trade-specific subscriber counts

## Technical Implementation

### Data Sources
The dashboard queries the following Data Extensions (see `DATA_EXTENSION_SCHEMA.md` for full schemas):

- **Audience_Daily_Snapshot_Milwaukee**: Daily subscriber counts by region
- **L1_Trade_Daily_Snapshot_Milwaukee**: Trade distribution data by region
- **Regional_Email_Metrics_Milwaukee**: Aggregated regional email performance metrics
- **SendFact_Milwaukee**: Individual email campaign send data
- **SignupIdentifier_Performance_Milwaukee**: Signup source performance (Shared DE with `ENT.` prefix)
- **My Account**: MyAccount registration data with consent status (local DE)

### Authentication
- OAuth 2.0 integration with Marketing Cloud
- Session management with encrypted keys
- Automatic token refresh handling

### Responsive Design
- Mobile-friendly responsive layout
- Touch-optimized controls for mobile devices
- Adaptive chart sizing for different screen sizes

## Usage Instructions

### Accessing Culture Views
1. Click the "Select Culture" dropdown in the navigation bar
2. Choose "Combined View" for global analytics
3. Select any specific culture to view culture-specific data

### Navigation Features
- **Home Button**: Click the Milwaukee logo to return to Combined View
- **Culture Dropdown**: Access any of the 30 supported cultures
- **Responsive Navigation**: Optimized for both desktop and mobile

### Data Filtering
- Date range filtering (From/To dates)
- Region-specific filtering in Combined View
- Trade-specific filtering
- Real-time chart updates based on filters

### Chart Interactions
- Toggle between Line and Bar charts
- Switch between Daily, Weekly, and Monthly grouping
- Hover for detailed data points
- Export capabilities (via browser print)

## Data Extension Requirements

Ensure your Marketing Cloud instance has the following Data Extensions:

| Data Extension | Key Fields | Description |
|----------------|------------|-------------|
| `Audience_Daily_Snapshot_Milwaukee` | SnapshotDate, Region, SubscriberCount | Daily subscriber counts |
| `L1_Trade_Daily_Snapshot_Milwaukee` | SnapshotDate, Region, L1Trade, SubscriberCount | Trade distribution |
| `Regional_Email_Metrics_Milwaukee` | YearNumber, MonthNumber, Region, + metrics | Regional email performance |
| `SendFact_Milwaukee` | JobID, EmailName, SendDate, Region, + metrics | Campaign-level data |
| `ENT.SignupIdentifier_Performance_Milwaukee` | SnapshotDate, SignupIdentifier, Region | Signup source metrics (Shared DE) |
| `My Account` | Id, ContactId, RegistrationDate, UserCulture, ConsentStatus | MyAccount registrations |

See `DATA_EXTENSION_SCHEMA.md` for complete field definitions.

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Features
- Encrypted session management
- OAuth 2.0 authentication
- Automatic session timeout
- Secure token handling

## Performance Optimizations
- Efficient data caching
- Optimized chart rendering
- Lazy loading for culture-specific data
- Minimal API calls through intelligent filtering

This enhanced dashboard provides Milwaukee Power Tools with comprehensive insights into their global subscriber base while maintaining the ability to drill down into specific cultural markets for targeted analysis and decision-making.