# FIRA.finance Google Sheets Integration

This Google Apps Script integration adds an action button to your Google Sheets that creates invoices in FIRA.finance from form submission data.

## Installation

### Step 1: Open Apps Script Editor

1. Open your Google Sheet (the one connected to your Google Form)
2. Go to **Extensions → Apps Script**
3. Delete any existing code in the editor

### Step 2: Add the Script Files

1. Copy the contents of `Code.gs` and paste it into the script editor
2. Click the **+** button next to "Files" to add a new script file
3. Name it `Config` (it will automatically add .gs)
4. Copy the contents of `Config.gs` and paste it

### Step 3: Configure Your FIRA API Key

1. Get your FIRA API key from [FIRA.finance Settings](https://app.fira.finance/settings/integrations)
2. In the Apps Script editor, click **Save** (💾 icon)
3. Close the Apps Script editor and return to your Google Sheet
4. Reload the sheet (refresh the page)
5. You should see a new menu: **FIRA Actions**
6. Click **FIRA Actions → ⚙️ Configure API Key**
7. Enter your FIRA API key when prompted
8. Click **OK**

### Step 4: Authorize the Script

1. Try creating an invoice: **FIRA Actions → Create Invoice in FIRA**
2. Google will ask you to authorize the script
3. Click **Review Permissions**
4. Select your Google account
5. Click **Advanced → Go to FIRA Integration (unsafe)**
   - This appears because the script is not published by Google
   - It's safe - you're running your own code
6. Click **Allow**

## Usage

### Creating an Invoice

1. **Select a row** with form submission data (click on any cell in that row)
2. Click **FIRA Actions → Create Invoice in FIRA**
3. Wait for the confirmation message
4. Check the **FIRA Status** column for success/error status
5. View your invoice in the [FIRA.finance dashboard](https://app.fira.finance)

### Column Mapping

The script automatically maps your Google Sheets columns to FIRA fields:

| Google Sheets Column | FIRA Field |
|---------------------|------------|
| Timestamp | createdAt |
| Customer Name / Name | billingAddress.name |
| Email / Email Address | billingAddress.email |
| Company | billingAddress.company |
| Address / Street Address | billingAddress.address1 |
| City | billingAddress.city |
| ZIP Code / Postal Code | billingAddress.zipCode |
| Country | billingAddress.country |
| Phone / Phone Number | billingAddress.phone |
| OIB | billingAddress.oib |
| VAT Number / VAT ID | billingAddress.vatNumber |
| Product/Service / Product / Item | lineItems[0].name |
| Description | lineItems[0].description |
| Quantity | lineItems[0].quantity |
| Price / Unit Price | lineItems[0].price |
| Tax Rate | lineItems[0].taxRate |

### Status Columns

After processing, the script adds two columns:

- **FIRA Status**: Shows SUCCESS (green) or ERROR (red)
- **FIRA Timestamp**: When the invoice was created

## Configuration

### Default Settings

The integration uses these default settings:

- **Invoice Type**: PONUDA (Offer)
- **Currency**: EUR
- **Payment Type**: TRANSAKCIJSKI (Bank Transfer)
- **Tax Rate**: 0.25 (25%)
- **Country**: HR (Croatia)

### Customizing Defaults

To change default settings, you can modify the Script Properties:

1. In Apps Script editor, go to **Project Settings** (⚙️ icon)
2. Scroll down to **Script Properties**
3. Add/modify properties:
   - `DEFAULT_INVOICE_TYPE` → PONUDA, RAČUN, or FISKALNI_RAČUN
   - `DEFAULT_CURRENCY` → EUR, USD, HRK, etc.
   - `DEFAULT_PAYMENT_TYPE` → GOTOVINA, TRANSAKCIJSKI, or KARTICA
   - `DEFAULT_TAX_RATE` → 0.25 (for 25%), 0.13 (for 13%), etc.
   - `DEFAULT_COUNTRY` → HR, DE, AT, etc.

## Troubleshooting

### "Configuration Required" Error

**Problem**: The script shows "Please configure your FIRA API key first"

**Solution**:
1. Click **FIRA Actions → ⚙️ Configure API Key**
2. Enter your FIRA API key
3. Make sure you copied the entire key (no spaces)

### "Validation Error" Message

**Problem**: Missing required fields

**Common Causes**:
- Missing customer name
- Missing email address
- Missing product/service name
- Missing price

**Solution**: Make sure your form submissions include all required fields

### "Authentication failed" Error

**Problem**: API key is invalid

**Solution**:
1. Check your API key in [FIRA Settings](https://app.fira.finance/settings/integrations)
2. Reconfigure: **FIRA Actions → ⚙️ Configure API Key**
3. Paste the correct key

### "API error (HTTP 400)" Message

**Problem**: Data validation failed in FIRA

**Solution**:
- Check the FIRA Status column for specific error details
- Verify tax rate is in decimal format (0.25, not 25)
- Verify country code is correct (HR, not Croatia)
- Verify dates are valid

### Script Menu Not Appearing

**Problem**: "FIRA Actions" menu doesn't show up

**Solution**:
1. Reload the Google Sheet
2. Make sure you saved the script
3. Try running the `onOpen()` function manually from Apps Script editor

## Advanced Usage

### Custom Column Names

If your form uses different column names, you can customize the mapping:

1. In Apps Script editor, open `Config.gs`
2. Find the `columnMapping` section in `getConfiguration()`
3. Update the default values to match your column names
4. Save the script

Example:
```javascript
customerName: scriptProperties.getProperty('COL_CUSTOMER_NAME') || 'Your Custom Name Column',
```

### Processing Multiple Rows

To process multiple invoices at once:

1. Create a custom function in `Code.gs`:
```javascript
function createMultipleInvoices() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const selection = sheet.getActiveRange();

  for (let i = selection.getRow(); i <= selection.getLastRow(); i++) {
    // Process each row
  }
}
```

2. Add it to the menu in `onOpen()`

## Security Notes

- Your API key is stored in Script Properties (encrypted by Google)
- The script only sends data to FIRA.finance (app.fira.finance)
- No data is sent to any other third-party services
- You can review all the code in the Apps Script editor

## Support

For issues with:
- **This integration**: [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)
- **FIRA.finance**: [FIRA Support](https://fira.finance/support)
- **Google Forms/Sheets**: [Google Support](https://support.google.com)

## License

MIT License - see LICENSE file
