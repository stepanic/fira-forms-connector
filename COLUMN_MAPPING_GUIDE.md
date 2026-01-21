# Column Mapping Guide - FIRA Forms Connector

## Overview

This document explains how Google Sheets columns are mapped to FIRA.finance webhook fields for both generic use cases and your specific registration form.

---

## Your Specific Columns (Registration Form)

### Source Columns in Google Sheet

```
1.  Vremenska oznaka
2.  E-adresa
3.  Payment
4.  Name and surname (Ime i prezime)
5.  Gender (Spol)
6.  City and Country (Mjesto i država)
7.  Year of birth (Godina rođenja)
8.  How did I find out about this program (Kako ste saznali za naš program)?
9.  Phone number (Kontakt broj)
10. Conf. mail
11. Marital status (Bračni status)
12. Why am I registering for the meeting (Zašto se prijavljujem na susret)?
13. Occupation / profession / job (Zanimanje/profesija/posao)
14. Do you have a specific diet - vegetarian, gluten, allergies... (if so, which ones)?
15. Do I have (and if so, what kind of) experience of similar encounters (Imate li iskustvo sa sličnim susretima i kojima)?
16. Do you have any questions or messages for the organizers? (Imate li pitanja za organizatore)
17. What do you expect from the meeting (Što očekujete od susreta)?
18. Notice to participants (GDPR notice)
19. AKCIJA_FIRA_RACUN (Status column - auto-populated)
```

### Mapping to FIRA Fields

#### Required Fields

| Google Sheet Column | FIRA Field | Type | Example | Notes |
|---------------------|------------|------|---------|-------|
| `Name and surname (Ime i prezime)` | `billingAddress.name` | string | "Marko Marković" | **Required** |
| `E-adresa` | `billingAddress.email` | string | "[email protected]" | **Required** |
| `Payment` | `lineItems[0].price` | number | 100.00 | **Required**, must be > 0 |

#### Optional Fields (Billing Address)

| Google Sheet Column | FIRA Field | Type | Example | Notes |
|---------------------|------------|------|---------|-------|
| `City and Country (Mjesto i država)` | `billingAddress.city` | string | "Zagreb" | Parsed from combined field |
| `City and Country (Mjesto i država)` | `billingAddress.country` | string | "HR" | Country code, parsed from combined field |
| `Phone number (Kontakt broj)` | `billingAddress.phone` | string | "+385912345678" | Optional |

#### Internal Note Fields (Not shown on invoice)

These fields are included in the `internalNote` field, visible only to you in FIRA:

| Google Sheet Column | Included in Internal Note |
|---------------------|---------------------------|
| `Gender (Spol)` | Yes |
| `Year of birth (Godina rođenja)` | Yes |
| `Occupation / profession / job` | Yes |

#### Ignored Fields (Not sent to FIRA)

These fields are for your internal records only and are not sent to FIRA:

- `How did I find out about this program`
- `Conf. mail`
- `Marital status`
- `Why am I registering for the meeting`
- `Do you have a specific diet`
- `Do I have experience of similar encounters`
- `Do you have any questions or messages`
- `What do you expect from the meeting`
- `Notice to participants` (GDPR)

---

## City and Country Parsing

The `City and Country` column is parsed into separate city and country fields.

### Expected Format

```
[City], [Country]
```

### Examples

| Input | Parsed City | Parsed Country Code |
|-------|-------------|---------------------|
| `Zagreb, Croatia` | Zagreb | HR |
| `Zagreb, Hrvatska` | Zagreb | HR |
| `Vienna, Austria` | Vienna | AT |
| `Berlin, Germany` | Berlin | DE |
| `Berlin, Njemačka` | Berlin | DE |
| `Munich` | Munich | HR (default) |

### Country Name Recognition

The parser recognizes these country names (case-insensitive):

| Country Names | ISO Code |
|---------------|----------|
| Croatia, Hrvatska, Croatian | HR |
| Germany, Njemačka, German | DE |
| Austria, Österreich, Austrian | AT |

**Fallback:** If country is not recognized, uses `DEFAULT_COUNTRY` setting (default: `HR`)

To add more countries, edit the parsing logic in `Code-Custom-Mapping.gs`:

```javascript
if (countryName.includes('italy') || countryName.includes('italija')) {
  country = 'IT';
} else if (countryName.includes('spain') || countryName.includes('španjolska')) {
  country = 'ES';
}
```

---

## Line Item Structure

### Registration Service Line Item

For your registration form, each row creates a single line item:

```json
{
  "name": "Registracija za susret",
  "description": "Registracija sudionika: Marko Marković",
  "lineItemId": "REG-001",
  "price": 100.00,
  "quantity": 1,
  "unit": "usluga",
  "taxRate": 0.25
}
```

| Field | Source | Default | Configurable |
|-------|--------|---------|--------------|
| `name` | Config | "Registracija za susret" | Yes, via `DEFAULT_SERVICE_NAME` |
| `description` | Computed | "Registracija sudionika: [Name]" | No |
| `price` | `Payment` column | N/A | Can set `DEFAULT_PRICE` fallback |
| `quantity` | Fixed | 1 | No |
| `unit` | Fixed | "usluga" | No |
| `taxRate` | Config | 0.25 (25%) | Yes, via `DEFAULT_TAX_RATE` |

---

## Automatic Calculations

### Tax and Total Calculation

```javascript
netto = price × quantity
taxValue = netto × taxRate
brutto = netto + taxValue
```

**Example:**
- Price: 100.00 EUR
- Quantity: 1
- Tax Rate: 0.25 (25%)

**Result:**
- Netto: 100.00 EUR
- Tax Value: 25.00 EUR
- Brutto: 125.00 EUR

---

## Metadata Fields

These fields are auto-generated:

| FIRA Field | Source | Example | Notes |
|------------|--------|---------|-------|
| `webshopOrderId` | Random number | 123456 | Unique identifier |
| `webshopOrderNumber` | Timestamp-based | "GF-1737465360000" | Prefixed with "GF-" |
| `createdAt` | `Vremenska oznaka` | "2025-01-21T10:30:00Z" | ISO 8601 format |
| `dueDate` | createdAt + 14 days | "2025-02-04" | YYYY-MM-DD format |
| `webshopType` | Fixed | "CUSTOM" | Always CUSTOM |
| `webshopEvent` | Fixed | "google_forms_registration" | Event type |
| `paymentGatewayCode` | Fixed | "google-forms" | Payment gateway |
| `paymentGatewayName` | Fixed | "Google Forms" | Gateway display name |

---

## Configuration Options

### Script Properties

You can customize these values via **Project Settings → Script Properties** in Apps Script:

| Property | Default | Description | Example |
|----------|---------|-------------|---------|
| `FIRA_API_KEY` | - | Your FIRA API key | *Required* |
| `FIRA_API_URL` | https://app.fira.finance | FIRA API endpoint | - |
| `DEFAULT_INVOICE_TYPE` | PONUDA | Invoice type | RAČUN |
| `DEFAULT_CURRENCY` | EUR | Currency code | EUR, USD, HRK |
| `DEFAULT_PAYMENT_TYPE` | TRANSAKCIJSKI | Payment method | GOTOVINA, KARTICA |
| `DEFAULT_TAX_RATE` | 0.25 | Tax rate (decimal) | 0.13, 0.25 |
| `DEFAULT_COUNTRY` | HR | Default country code | HR, DE, AT |
| `DEFAULT_SERVICE_NAME` | Registracija za susret | Service name on invoice | Custom name |
| `DEFAULT_PRICE` | 0 | Fallback price if Payment empty | 100 |

---

## Generic Column Mapping (For Other Use Cases)

If you're using this integration for e-commerce or other purposes, the generic code maps these columns:

### Customer Information

| Generic Column Names | FIRA Field |
|---------------------|------------|
| Customer Name, Name, Full Name, Client Name | `billingAddress.name` |
| Email, Email Address, E-mail, Contact Email | `billingAddress.email` |
| Company | `billingAddress.company` |
| Address, Street Address, Address Line 1 | `billingAddress.address1` |
| City | `billingAddress.city` |
| ZIP Code, Postal Code, ZIP, Post Code | `billingAddress.zipCode` |
| Country | `billingAddress.country` |
| Phone, Phone Number, Contact Phone, Mobile | `billingAddress.phone` |
| OIB | `billingAddress.oib` |
| VAT Number, VAT ID, VAT No, Tax ID | `billingAddress.vatNumber` |

### Product/Service Information

| Generic Column Names | FIRA Field |
|---------------------|------------|
| Product/Service, Product, Service, Item, Product Name | `lineItems[0].name` |
| Description | `lineItems[0].description` |
| Price, Unit Price, Price per Unit, Cost | `lineItems[0].price` |
| Quantity | `lineItems[0].quantity` |
| Unit | `lineItems[0].unit` |
| Tax Rate | `lineItems[0].taxRate` |

---

## Status Tracking

After processing, these columns are auto-created/updated:

| Column | Values | Color Coding |
|--------|--------|--------------|
| AKCIJA_FIRA_RACUN or FIRA Status | SUCCESS, GREŠKA: [message] | Green (success), Red (error) |
| FIRA Timestamp | Date/time of creation | - |

---

## Custom Column Mapping

To customize column mapping for your specific needs:

### Option 1: Edit Config File

Edit `Config-Custom.gs`:

```javascript
columnMapping: {
  // Your custom mappings
  customerName: 'Your Column Name Here',
  email: 'Your Email Column',
  // ...
}
```

### Option 2: Script Properties

Add property mappings in **Project Settings → Script Properties**:

```
COL_CUSTOMER_NAME = "Your Custom Column Name"
COL_EMAIL = "Your Email Column"
...
```

### Option 3: Modify Mapping Function

Edit the `mapRowToPayload()` function in `Code-Custom-Mapping.gs`:

```javascript
const customerName = getValue('Your Exact Column Name');
const email = getValue('Your Email Column');
```

---

## Example Payload

Here's what gets sent to FIRA from your registration form:

```json
{
  "webshopOrderId": 123456,
  "webshopType": "CUSTOM",
  "webshopEvent": "google_forms_registration",
  "webshopOrderNumber": "GF-1737465360000",
  "invoiceType": "PONUDA",
  "currency": "EUR",
  "billingAddress": {
    "name": "Marko Marković",
    "email": "[email protected]",
    "city": "Zagreb",
    "country": "HR",
    "phone": "+385912345678"
  },
  "lineItems": [
    {
      "name": "Registracija za susret",
      "description": "Registracija sudionika: Marko Marković",
      "price": 100.00,
      "quantity": 1,
      "unit": "usluga",
      "taxRate": 0.25
    }
  ],
  "netto": 100.00,
  "taxValue": 25.00,
  "brutto": 125.00,
  "internalNote": "Registracija iz Google Forms\nSpol: M\nGodina rođenja: 1990\nZanimanje: Inženjer",
  "paymentType": "TRANSAKCIJSKI"
}
```

---

## Best Practices

1. **Keep Column Names Consistent**: Don't rename columns after setup
2. **Use Required Fields**: Always ensure name, email, and price are filled
3. **Test with PONUDA**: Use offer type for testing before switching to RAČUN
4. **Validate Data**: Check that Payment column has valid numbers
5. **Monitor Status**: Check AKCIJA_FIRA_RACUN column for errors
6. **Backup Settings**: Document your Script Properties configuration

---

## Troubleshooting

### "Validation Error: Missing required field"

- Check that `Name and surname`, `E-adresa`, and `Payment` columns are filled
- Verify column names match exactly (case-sensitive)

### "Price must be greater than 0"

- Check `Payment` column has a number > 0
- Set `DEFAULT_PRICE` in Script Properties as fallback

### Country not recognized

- Add country parsing logic in `Code-Custom-Mapping.gs`
- Or use 2-letter ISO code directly in the column

---

## See Also

- [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md) - Croatian setup guide
- [Code-Custom-Mapping.gs](./google-apps-script/Code-Custom-Mapping.gs) - Source code
- [Config-Custom.gs](./google-apps-script/Config-Custom.gs) - Configuration code
- [FIRA API Documentation](https://app.swaggerhub.com/apis-docs/FIRAFinance/Custom_webshop/v1.0.0)
