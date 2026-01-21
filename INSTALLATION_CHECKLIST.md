# Installation Checklist - FIRA Forms Connector

## For Your Specific Google Form (Registration)

### ✅ Step 1: Get FIRA API Key (2 minutes)

- [ ] Go to https://app.fira.finance/settings/integrations
- [ ] Log in to your FIRA account
- [ ] Copy your API key
- [ ] Keep it somewhere safe (you'll need it in Step 4)

### ✅ Step 2: Open Apps Script Editor (1 minute)

- [ ] Open your Google Sheet: https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/
- [ ] Click **Extensions → Apps Script**

### ✅ Step 3: Install Custom Code (3 minutes)

#### Part A: Code-Custom-Mapping.gs

- [ ] In Apps Script editor, select `Code.gs`
- [ ] Delete all existing code
- [ ] Open file: `google-apps-script/Code-Custom-Mapping.gs`
- [ ] Copy ALL the code
- [ ] Paste into Apps Script editor
- [ ] Click Save (💾)

#### Part B: Config-Custom.gs

- [ ] Click + next to "Files"
- [ ] Select "Script"
- [ ] Name it: `Config`
- [ ] Open file: `google-apps-script/Config-Custom.gs`
- [ ] Copy ALL the code
- [ ] Paste into the new Config file
- [ ] Click Save (💾)

#### Part C: Verify

- [ ] You should see two files in the sidebar:
  - `Code.gs` ✅
  - `Config.gs` ✅

### ✅ Step 4: Configure API Key (2 minutes)

- [ ] Close Apps Script tab
- [ ] Return to your Google Sheet
- [ ] Reload the page (F5 or Cmd+R)
- [ ] Wait 5-10 seconds
- [ ] You should see new menu: **FIRA Actions**
- [ ] Click **FIRA Actions → ⚙️ Configure API Key**
- [ ] Paste your FIRA API key
- [ ] Click OK
- [ ] You should see "Success!" message

### ✅ Step 5: Authorize (First Time - 2 minutes)

- [ ] Click on any row with data (not the header)
- [ ] Click **FIRA Actions → Create Invoice in FIRA**
- [ ] Google shows authorization dialog
- [ ] Click **Review Permissions**
- [ ] Select your Google account
- [ ] See "Google hasn't verified this app" → Click **Advanced**
- [ ] Click **Go to FIRA Integration (unsafe)** - it's safe, it's your code!
- [ ] Click **Allow**

### ✅ Step 6: Test! (30 seconds)

- [ ] Click on a row with form data
- [ ] Click **FIRA Actions → Create Invoice in FIRA**
- [ ] Wait for success message
- [ ] Check for new columns:
  - `FIRA Status` (should be green with "SUCCESS")
  - `FIRA Timestamp` (should show current date/time)
- [ ] Open https://app.fira.finance
- [ ] Verify your invoice/offer appears in FIRA

### ✅ Step 7: Configure Settings (Optional - 2 minutes)

#### To create RAČUN instead of PONUDA:

- [ ] **Extensions → Apps Script**
- [ ] Click **Project Settings** (⚙️ icon)
- [ ] Scroll to **Script Properties**
- [ ] Click **Add script property**
  - Property: `DEFAULT_INVOICE_TYPE`
  - Value: `RAČUN`
- [ ] Click Save

#### To change service name:

- [ ] **Script Properties → Add script property**
  - Property: `DEFAULT_SERVICE_NAME`
  - Value: `Your custom service name`
- [ ] Click Save

#### To set default price (if Payment is empty):

- [ ] **Script Properties → Add script property**
  - Property: `DEFAULT_PRICE`
  - Value: `100` (or any number)
- [ ] Click Save

---

## File Reference

### Files to Copy to Apps Script

| File to Copy | Purpose | Location |
|--------------|---------|----------|
| ✅ `Code-Custom-Mapping.gs` | Main script for your form | `google-apps-script/Code-Custom-Mapping.gs` |
| ✅ `Config-Custom.gs` | Configuration for your form | `google-apps-script/Config-Custom.gs` |

### Alternative (Generic Version)

If you want generic code for other use cases:

| File | Purpose | Location |
|------|---------|----------|
| `Code.gs` | Generic version | `google-apps-script/Code.gs` |
| `Config.gs` | Generic config | `google-apps-script/Config.gs` |

### Documentation Files

| File | Description | Language |
|------|-------------|----------|
| ✅ `UPUTE_CUSTOM_MAPPING_HR.md` | **Main guide for your form** | Hrvatski |
| ✅ `COLUMN_MAPPING_GUIDE.md` | Column mapping reference | English |
| `CITAJME_HR.md` | Overview | Hrvatski |
| `UPUTE_HR.md` | Generic instructions | Hrvatski |
| `README.md` | Main documentation | English |
| `QUICKSTART.md` | Quick start | English |
| `GOOGLE_SHEETS_SETUP.md` | Step-by-step setup | English |
| `PROJECT_SUMMARY.md` | Project overview | English |

### Example Files (for reference)

| File | Description |
|------|-------------|
| `examples/sample-payload-registration.json` | Example payload for your form |
| `examples/sample-payload.json` | Generic example payload |
| `examples/sheets-mapping.json` | Column mapping examples |

---

## Verification Checklist

### After Installation

- [ ] "FIRA Actions" menu appears in Google Sheets
- [ ] Clicking "Configure API Key" opens a dialog
- [ ] API key is saved successfully
- [ ] Clicking "Create Invoice in FIRA" shows authorization (first time)
- [ ] After authorization, clicking the button creates an invoice
- [ ] Success message appears
- [ ] FIRA Status column shows "SUCCESS" in green
- [ ] Invoice appears in FIRA dashboard

### Required Data in Sheet

For successful invoice creation, each row must have:

- [ ] ✅ Name and surname (Ime i prezime) - filled
- [ ] ✅ E-adresa - filled with valid email
- [ ] ✅ Payment - number greater than 0

### Optional but Recommended

- [ ] City and Country (Mjesto i država) - filled
- [ ] Phone number (Kontakt broj) - filled

---

## Troubleshooting

### Issue: Menu doesn't appear

**Solutions:**
- [ ] Save both Code.gs and Config.gs
- [ ] Reload Google Sheet (F5)
- [ ] Wait 10 seconds
- [ ] Check browser console for errors (F12)

### Issue: "Configuration Required"

**Solutions:**
- [ ] Click **FIRA Actions → ⚙️ Configure API Key**
- [ ] Paste API key (no spaces)
- [ ] Click OK

### Issue: "Validation Error"

**Solutions:**
- [ ] Check that Name and surname is filled
- [ ] Check that E-adresa is filled
- [ ] Check that Payment has a number > 0

### Issue: "Authentication failed"

**Solutions:**
- [ ] Go to https://app.fira.finance/settings/integrations
- [ ] Copy new API key
- [ ] Reconfigure: **FIRA Actions → ⚙️ Configure API Key**

---

## Success Criteria

You'll know it's working when:

✅ Menu appears in Google Sheets
✅ API key saves successfully
✅ Authorization completes without errors
✅ Clicking button shows "Processing..." toast
✅ Success message appears
✅ FIRA Status column turns green
✅ Invoice appears in FIRA dashboard

---

## Next Steps After Installation

1. **Test with PONUDA (Offer)** - Safe for testing
2. **Verify in FIRA** - Check dashboard
3. **Configure settings** - Change to RAČUN if needed
4. **Train users** - Show them how to use the button
5. **Monitor status** - Check FIRA Status column regularly

---

## Getting Help

- **Croatian Instructions:** [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md)
- **Column Mapping:** [COLUMN_MAPPING_GUIDE.md](./COLUMN_MAPPING_GUIDE.md)
- **Full Documentation:** [README.md](./README.md)
- **Project Overview:** [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

## Developer Checklist (CLI Tool)

If you're also setting up the CLI tool:

- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Add `FIRA_API_KEY` to `.env`
- [ ] Run `npm run test:webhook -- --sample --validate-only`
- [ ] Verify validation passes
- [ ] Run `npm run test:sample` (creates test invoice)
- [ ] Check FIRA dashboard for test invoice

---

**Installation Time:** ~10 minutes
**Difficulty:** Easy (no coding required)
**Support:** See documentation files listed above
