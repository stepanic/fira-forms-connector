# Google Sheets Setup - Step by Step

## For Your Google Sheet: https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/

This guide shows you exactly how to add the FIRA action button to your Google Sheet.

---

## Step 1: Get Your FIRA API Key (2 minutes)

1. Open [FIRA.finance Settings](https://app.fira.finance/settings/integrations)
2. Log in to your FIRA account
3. Find the **API Key** section
4. **Copy** your API key (you'll need it in Step 4)

> **Note:** Keep your API key secret! Don't share it publicly.

---

## Step 2: Open Apps Script Editor (1 minute)

1. Open your Google Sheet: [Click here](https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/)
2. In the menu, click **Extensions → Apps Script**
3. A new tab opens with the Apps Script editor

---

## Step 3: Add the Code (3 minutes)

### 3a. Add Code.gs

1. In the Apps Script editor, you'll see `Code.gs` on the left
2. **Delete** all existing code (select all and delete)
3. **Copy** all the code from this file: [`google-apps-script/Code.gs`](./google-apps-script/Code.gs)
4. **Paste** it into the editor
5. Click **💾 Save** (or Ctrl+S / Cmd+S)

### 3b. Add Config.gs

1. Click the **+** button next to "Files" in the left sidebar
2. Select **Script**
3. Name it: `Config` (it will automatically add `.gs`)
4. **Copy** all the code from this file: [`google-apps-script/Config.gs`](./google-apps-script/Config.gs)
5. **Paste** it into the new file
6. Click **💾 Save** (or Ctrl+S / Cmd+S)

### 3c. Verify

You should now see two files in the left sidebar:
- ✅ Code.gs
- ✅ Config.gs

---

## Step 4: Configure Your API Key (2 minutes)

1. **Close** the Apps Script tab
2. Go back to your Google Sheet
3. **Reload** the page (F5 or Cmd+R)
4. Wait a few seconds - you should see a new menu: **FIRA Actions**
5. Click **FIRA Actions → ⚙️ Configure API Key**
6. A dialog appears - paste your FIRA API key (from Step 1)
7. Click **OK**
8. You should see "Success! FIRA API key saved successfully!"

---

## Step 5: Authorize the Script (First Time Only - 2 minutes)

1. Click on **any row** with data in your sheet (not the header row)
2. Click **FIRA Actions → Create Invoice in FIRA**
3. Google will show an authorization dialog:
   - Click **Review Permissions**
   - Select your Google account
   - You'll see "Google hasn't verified this app"
   - Click **Advanced**
   - Click **Go to FIRA Integration (unsafe)**
     - *(Don't worry - it's YOUR code, it's safe!)*
   - Click **Allow**

---

## Step 6: Create Your First Invoice! (30 seconds)

1. Click on **any row** with form data
2. Click **FIRA Actions → Create Invoice in FIRA**
3. Wait a few seconds...
4. You should see: **"Success! Invoice created successfully in FIRA.finance"**
5. A new column appears: **FIRA Status** (green = success)
6. Another column: **FIRA Timestamp** (when it was created)

---

## Step 7: Check FIRA Dashboard

1. Open [FIRA.finance Dashboard](https://app.fira.finance)
2. You should see your new invoice/offer!
3. Click on it to view details

---

## ✅ You're Done!

From now on, to create invoices:

1. Click on a row with data
2. Click **FIRA Actions → Create Invoice in FIRA**
3. Done! ✨

---

## Troubleshooting

### "FIRA Actions" menu doesn't appear

**Solution:**
1. Make sure you saved both Code.gs and Config.gs
2. Reload the Google Sheet (F5)
3. Wait 10 seconds and check again

### "Configuration Required" error

**Solution:**
1. Click **FIRA Actions → ⚙️ Configure API Key**
2. Paste your API key
3. Make sure there are no extra spaces

### "Validation Error: Customer name is required"

**Solution:**
- Make sure your sheet has a column named "Customer Name" or "Name"
- Make sure the row you selected has data in that column

### "Validation Error: At least one line item is required"

**Solution:**
- Make sure your sheet has a column named "Product/Service", "Product", or "Item"
- Make sure the row has data in that column
- Make sure you have a "Price" column with a number

### "Authentication failed - check your API key"

**Solution:**
1. Go to [FIRA Settings](https://app.fira.finance/settings/integrations)
2. Copy your API key again
3. Click **FIRA Actions → ⚙️ Configure API Key**
4. Paste the new key

---

## Your Sheet Columns

Based on your Google Form, make sure you have these columns:

**Required:**
- Customer Name (or "Name")
- Email (or "Email Address")
- Product/Service (or "Product" or "Item")
- Price (or "Unit Price")

**Optional:**
- Company
- Address
- City
- ZIP Code
- Country
- Phone
- OIB
- VAT Number
- Description
- Quantity
- Tax Rate

The script will automatically find these columns even if they have slightly different names!

---

## What Invoice Type is Created?

By default, the integration creates **PONUDA** (Offer/Quote) invoices.

This is the safest option for testing because:
- ✅ It's not a fiscal document
- ✅ No fiscal complications
- ✅ You can test freely

### To Change Invoice Type

If you want to create **RAČUN** (Invoice) instead:

1. Open Apps Script editor (**Extensions → Apps Script**)
2. Click on **Project Settings** (⚙️ icon on left sidebar)
3. Scroll down to **Script Properties**
4. Click **Add script property**
   - **Property:** `DEFAULT_INVOICE_TYPE`
   - **Value:** `RAČUN`
5. Click **Save**

---

## Advanced: Customizing Defaults

You can customize these settings in **Script Properties**:

| Property | Default | Options |
|----------|---------|---------|
| `DEFAULT_INVOICE_TYPE` | PONUDA | PONUDA, RAČUN, FISKALNI_RAČUN |
| `DEFAULT_CURRENCY` | EUR | EUR, USD, HRK, etc. |
| `DEFAULT_PAYMENT_TYPE` | TRANSAKCIJSKI | GOTOVINA, TRANSAKCIJSKI, KARTICA |
| `DEFAULT_TAX_RATE` | 0.25 | 0.25 (25%), 0.13 (13%), etc. |
| `DEFAULT_COUNTRY` | HR | HR, DE, AT, etc. |

To add these:
1. **Extensions → Apps Script**
2. **Project Settings** (⚙️ icon)
3. **Script Properties**
4. **Add script property** for each one you want to customize

---

## Need More Help?

- **Detailed Documentation:** See [google-apps-script/README.md](./google-apps-script/README.md)
- **Full README:** See [README.md](./README.md)
- **Quick Start:** See [QUICKSTART.md](./QUICKSTART.md)
- **Report Issues:** [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)

---

**Happy Invoicing! 🎉**
