# Quick Start Guide - FIRA.finance + Google Forms Integration

## For Google Sheets Users (5 minutes)

### Step 1: Get Your FIRA API Key
1. Go to [https://app.fira.finance/settings/integrations](https://app.fira.finance/settings/integrations)
2. Copy your API key

### Step 2: Open Your Google Sheet
1. Open the Google Sheet connected to your Google Form
2. Go to **Extensions → Apps Script**

### Step 3: Install the Code
1. Delete any existing code in the editor
2. Copy code from `google-apps-script/Code.gs` → paste in editor
3. Click **+** next to "Files" → name it `Config`
4. Copy code from `google-apps-script/Config.gs` → paste there
5. Click **💾 Save**

### Step 4: Configure
1. Close Apps Script editor
2. Reload your Google Sheet (F5 or Cmd+R)
3. Click **FIRA Actions → ⚙️ Configure API Key**
4. Paste your FIRA API key → Click OK

### Step 5: Create Your First Invoice
1. Click on any row with form data
2. Click **FIRA Actions → Create Invoice in FIRA**
3. Authorize the script (first time only)
4. Wait for success message
5. Check [FIRA dashboard](https://app.fira.finance) for your invoice!

## For Developers (CLI Testing)

### Step 1: Clone & Install
```bash
git clone https://github.com/yourusername/fira-forms-connector.git
cd fira-forms-connector
npm install
```

### Step 2: Configure
```bash
cp .env.example .env
# Edit .env and add your FIRA_API_KEY
```

### Step 3: Test
```bash
# Validate sample payload
npm run test:webhook -- --sample --validate-only

# Send test invoice (creates PONUDA in FIRA)
npm run test:sample
```

## Your Google Form Columns

Make sure your form includes at least:

**Required:**
- Customer Name
- Email
- Product/Service
- Price

**Optional (but recommended):**
- Company
- Address
- City
- Country
- Phone
- Quantity

## Default Settings

The integration uses these defaults:
- **Invoice Type**: PONUDA (Offer) - safe for testing
- **Currency**: EUR
- **Tax Rate**: 25% (0.25)
- **Payment Type**: Bank Transfer (TRANSAKCIJSKI)

You can change these in the script configuration.

## Need Help?

- **Detailed Setup**: See [google-apps-script/README.md](./google-apps-script/README.md)
- **Troubleshooting**: See [google-apps-script/README.md#troubleshooting](./google-apps-script/README.md#troubleshooting)
- **Issues**: [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)

## What Gets Created in FIRA?

When you click the button, the integration:
1. ✅ Reads data from the selected Google Sheets row
2. ✅ Maps columns to FIRA fields
3. ✅ Calculates totals (price × quantity + tax)
4. ✅ Sends to FIRA via webhook
5. ✅ Creates invoice/offer in your FIRA account
6. ✅ Marks the row as SUCCESS (green) or ERROR (red)

## Example Workflow

1. Customer fills out your Google Form
2. Form data appears in Google Sheets
3. You select the row
4. Click "Create Invoice in FIRA"
5. Invoice is created in FIRA
6. Send invoice to customer from FIRA

---

**That's it! You're ready to automate your invoicing! 🎉**
