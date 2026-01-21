# Payload Comparison: Working vs Real

## Working Payload (test:payload - SUCCESS)

```json
{
  "webshopOrderId": 436950,
  "webshopType": "CUSTOM",
  "webshopEvent": "google_forms_registration",
  "webshopOrderNumber": "GF-TEST-1768997638235",
  "invoiceType": "PONUDA",
  "paymentGatewayCode": "google-forms",
  "paymentGatewayName": "Google Forms",
  "createdAt": "2026-01-21T12:13:58Z",
  "dueDate": "2026-02-04",
  "currency": "EUR",
  "taxesIncluded": false,
  "billingAddress": {
    "name": "Marko Marković",
    "email": "[email protected]",
    "city": "Zagreb",
    "country": "HR",
    "phone": "+385912345678",
    "address1": "",
    "zipCode": "",
    "company": "",
    "oib": "",
    "vatNumber": ""
  },
  "shippingAddress": {
    "name": "Marko Marković",
    "city": "Zagreb",
    "country": "HR"
  },
  "taxValue": 0,
  "brutto": 100,
  "netto": 100,
  "lineItems": [
    {
      "name": "Registracija za susret",
      "description": "Registracija sudionika: Marko Marković",
      "lineItemId": "REG-001",
      "price": 100,
      "quantity": 1,
      "unit": "usluga",
      "taxRate": 0
    }
  ],
  "discounts": [],
  "totalShipping": {
    "name": "Shipping",
    "price": 0,
    "quantity": 1,
    "unit": "usluga",
    "taxRate": 0
  },
  "internalNote": "Registracija iz Google Forms\nSpol: M\nGodina rođenja: 1990\nZanimanje: Inženjer",
  "paymentType": "TRANSAKCIJSKI",
  "termsHR": ""
}
```

## Real Payload (test:real - FAILED with SQL error)

```json
{
  "webshopOrderId": 885376,
  "webshopType": "CUSTOM",
  "webshopEvent": "google_forms_registration",
  "webshopOrderNumber": "GF-1768997376129",
  "invoiceType": "PONUDA",
  "paymentGatewayCode": "google-forms",
  "paymentGatewayName": "Google Forms",
  "createdAt": "2026-01-21T12:09:36Z",
  "dueDate": "2026-02-04",
  "validTo": "2026-02-20",
  "currency": "EUR",
  "taxesIncluded": false,
  "billingAddress": {
    "name": "Matija Stepanić",
    "email": "stepanic.matija@gmail.com",
    "city": "Lukavec",
    "country": "HR",
    "phone": "+385989679022",
    "address1": "",
    "zipCode": "",
    "company": "",
    "oib": "",
    "vatNumber": ""
  },
  "taxValue": 0,
  "brutto": 100,
  "netto": 100,
  "lineItems": [
    {
      "name": "Registracija za susret",
      "description": "Registracija sudionika: Matija Stepanić",
      "lineItemId": "REG-001",
      "price": 100,
      "quantity": 1,
      "unit": "usluga",
      "taxRate": 0
    }
  ],
  "internalNote": "Registracija iz Google Forms\nSpol: Male (muški)\nGodina rođenja: 1990\nZanimanje: Programer\nKako saznali: Through friends / acquaintances\nPrehrana: Nemam\nIskustvo: Razne konferencije :D\nRazlog: FIRA.finance testiranje izrade računa sa Google Scripts i sa Claude Desktop (Code)\nOčekivanja: Da mogu dobiti fiskalizirani racun :)) ✝️❤️🇭🇷\nPitanja: Bok Tomislav, ovo je proba",
  "paymentType": "TRANSAKCIJSKI",
  "discounts": [],
  "totalShipping": {
    "name": "Shipping",
    "description": "No shipping",
    "lineItemId": "SHIP-001",
    "price": 0,
    "quantity": 1,
    "unit": "usluga",
    "taxRate": 0
  }
}
```

## Key Differences

| Field | Working | Real | Potential Issue? |
|-------|---------|------|------------------|
| `validTo` | NOT PRESENT | `"2026-02-20"` | Maybe causes issue? |
| `shippingAddress` | PRESENT (minimal) | NOT PRESENT | Maybe required? |
| `totalShipping.description` | NOT PRESENT | `"No shipping"` | - |
| `totalShipping.lineItemId` | NOT PRESENT | `"SHIP-001"` | - |
| `termsHR` | `""` (empty string) | NOT PRESENT | Maybe required? |
| `internalNote` | Short, ASCII only | Long, has EMOJIS | **LIKELY ISSUE: Emojis!** |

## Suspected Issues (in order of likelihood)

### 1. EMOJIS in internalNote (MOST LIKELY)
The real payload has emojis: `✝️❤️🇭🇷`

These might cause SQL encoding issues. The error was:
```
could not execute statement; SQL [n/a]; nested exception is org.hibernate.exception.DataException
```

### 2. validTo field
Working payload doesn't have it, real does.

### 3. Missing shippingAddress
Working has minimal shippingAddress, real doesn't have it at all.

### 4. Missing termsHR
Working has empty string `""`, real doesn't have the field.

## Test Plan

1. **Test 1**: Remove emojis from internalNote
2. **Test 2**: Remove validTo field
3. **Test 3**: Add shippingAddress
4. **Test 4**: Add termsHR: ""
