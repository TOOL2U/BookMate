# Reports Phase 2 - Quick Start Guide

## How to Use the New Reports Features

### Generating a Report

1. Navigate to **Reports** in the sidebar
2. Select your **Report Type**:
   - Monthly Report
   - Quarterly Report
   - Year-to-Date
   - Custom Date Range
3. For custom dates, choose start and end dates
4. Toggle **Include AI Summary** if you want AI insights
5. Click **Generate Report**
6. Wait 2-5 seconds for generation (+ 3-5s more if AI is enabled)

### Understanding the Report Preview

The preview shows exactly what will be in your PDF export:

**Header Section:**
- BookMate logo and branding
- Report title and period
- Generation timestamp

**KPI Dashboard:**
- 📊 Total Revenue (green)
- 📉 Total Expenses (red)
- 💰 Net Profit/Loss (green/red based on performance)
- 💵 Cash Position (blue)

**Charts:**
- Bar chart comparing revenue vs expenses
- Pie chart showing expense breakdown by category
- Horizontal bar chart of account balances

**AI Insights** (if enabled):
- 📊 Executive Summary - High-level overview
- 📈 Key Trends - Notable patterns
- ⚠️ Risks & Considerations - Areas needing attention
- 💡 Opportunities - Growth potential

**Summary Table:**
- Detailed breakdown of revenue and expenses
- Percentage calculations
- Net profit summary

### Exporting Your Report

**Excel Export:**
- 5-sheet workbook
- Includes all data, calculations, and transactions
- Best for: Detailed analysis, pivot tables, further calculations

**CSV Export:**
- Single file with all sections
- Includes summary data
- Best for: Simple imports, data transfer, email

**Transactions CSV:**
- Raw transaction data only
- Best for: Ledger imports, reconciliation

**PDF Export:**
- Branded, investor-ready document
- Includes charts as images
- Includes AI insights (if enabled)
- Best for: Sharing with stakeholders, presentations, archiving

### Tips & Tricks

**Performance:**
- Generate report once, export multiple times (data is cached)
- Toggle AI on/off without regenerating the report
- PDF export may take 5-10 seconds for detailed reports

**AI Insights:**
- Toggle on before generating for faster results
- Can toggle on after report is generated (will fetch AI separately)
- AI failures don't break the report - you'll get a message but data remains

**PDF Quality:**
- Larger screens produce higher quality PDFs
- Charts are captured as images (not interactive in PDF)
- Multi-page PDFs automatically split at page boundaries

**Data Accuracy:**
- All numbers come from your existing Dashboard/P&L
- AI never alters calculations
- AI only provides narrative interpretation

### Troubleshooting

**"Failed to generate report"**
- Check your internet connection
- Verify Google Sheets API is accessible
- Try refreshing the page

**"AI insights could not be generated"**
- Report still works! AI is optional
- Check OPENAI_API_KEY environment variable
- Try toggling AI off and on again

**PDF export fails**
- Try on a modern browser (Chrome, Firefox, Safari, Edge)
- Disable browser extensions that might block downloads
- Check browser console for errors

**Charts not showing**
- Generate the report first
- Ensure you have data in the selected period
- Check browser console for errors

### Environment Setup (Admin Only)

Required environment variables:
```bash
OPENAI_API_KEY=sk-...  # For AI insights
GOOGLE_SHEETS_CREDENTIALS=...  # Existing
SPREADSHEET_ID=...  # Existing
```

### What's Coming in Phase 3

- 📋 Report Presets (Investor Update, Internal, Property-Level)
- 🎨 Custom Branding (upload logo, colors)
- 📅 Scheduled Reports (automated generation)
- 📧 Email Delivery
- 🔗 Share Links
- 📊 Comparison Mode (period-over-period)
- 📱 Mobile-optimized PDF

---

*Last Updated: November 2025*
