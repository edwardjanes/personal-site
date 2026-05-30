# Personal Metrics Dashboard

A password-protected dashboard for viewing personal health and productivity metrics from a Google Sheet.

## Features

- **Health Metrics**: Weight, calories, sleep, steps tracking
- **Productivity Metrics**: Focus scores, task completion, secondary focus
- **Period Comparison**: Compare current vs previous period metrics
- **Date Range Filtering**: View data by week, month, or custom date range
- **Interactive Charts**: Line, bar, and scatter charts for trend analysis
- **Responsive Design**: Works on desktop and mobile

## Security

The dashboard is **password-protected**. Enter your password on the login screen to access your metrics.

**Important**: The password is stored in the HTML file. For enhanced security with a public repo, consider:
- Moving to a private repository
- Using GitHub Pages with authentication
- Hosting on a private server with OAuth

## Data Source

Metrics are fetched from a Google Sheet via Apps Script. The data is not stored in this repository—the dashboard pulls live data from your Google Sheet.

## Usage

1. Open `dashboard.html` in a web browser
2. Enter your password to unlock the dashboard
3. Use the date range presets or custom date picker to filter data
4. View health and productivity metrics in separate tabs

## Customization

To change the password, edit the `DASHBOARD_PASSWORD` variable in the script:

```javascript
const DASHBOARD_PASSWORD = 'metrics2026'; // Change this value
```

The authentication uses browser session storage, so logging out happens automatically when you close your browser.
