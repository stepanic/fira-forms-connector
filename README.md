# FIRA.finance + Google Forms Integration

> Open-source integration that automatically creates invoices in FIRA.finance from Google Forms submissions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🎯 Overview

This integration allows you to create invoices in [FIRA.finance](https://fira.finance) directly from Google Forms submissions stored in Google Sheets. Simply click an action button in your spreadsheet, and the integration will create a professional invoice in FIRA.

**Perfect for:**
- Service providers collecting client information via forms
- E-commerce stores using Google Forms for orders
- Freelancers and consultants managing invoices
- Small businesses automating their invoicing workflow

## ✨ Features

- ✅ One-click invoice creation from Google Sheets
- ✅ Automatic field mapping from form submissions
- ✅ Support for all FIRA invoice types (Offers, Invoices, Fiscal Invoices)
- ✅ CLI testing tool for local development
- ✅ Status tracking in spreadsheet
- ✅ Configurable defaults (currency, tax rate, payment type)
- ✅ Full TypeScript type definitions
- ✅ Comprehensive error handling

## 📋 Prerequisites

- **FIRA.finance account** with API access
  - Sign up at [fira.finance](https://fira.finance)
  - Get your API key from Settings → Integrations
- **Google account** with access to Google Forms and Sheets
- **Node.js** 18+ (for CLI testing tool)

## 🚀 Quick Start

### Option 1: Google Sheets Integration (No coding required)

1. **Set up your Google Form** connected to a Google Sheet
2. **Open your Google Sheet** with form responses
3. **Go to Extensions → Apps Script**
4. **Copy the code** from `google-apps-script/Code.gs` and `google-apps-script/Config.gs`
5. **Configure your FIRA API key** via the menu
6. **Click on a row** and select **FIRA Actions → Create Invoice in FIRA**

📖 [Detailed Google Sheets Setup Guide](./google-apps-script/README.md)

### Option 2: CLI Testing Tool (For developers)

1. **Clone this repository**
   ```bash
   git clone https://github.com/yourusername/fira-forms-connector.git
   cd fira-forms-connector
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your FIRA_API_KEY
   ```

4. **Test the webhook**
   ```bash
   npm run test:sample
   ```

## 📚 Documentation

### For Non-Technical Users

- **[Google Sheets Setup Guide](./google-apps-script/README.md)** - Step-by-step instructions for setting up the integration in Google Sheets
- **[Troubleshooting Guide](./google-apps-script/README.md#troubleshooting)** - Common issues and solutions

### For Developers

- **[CLI Tool Documentation](#cli-tool-usage)** - Using the command-line testing tool
- **[API Reference](#api-reference)** - FIRA webhook payload structure
- **[Development Guide](#development)** - Contributing and extending the integration

## 🛠️ CLI Tool Usage

### Installation

```bash
npm install
```

### Basic Usage

Test with the sample payload:
```bash
npm run test:sample
```

Test with a custom JSON file:
```bash
npm run test:webhook -- --file path/to/payload.json
```

Validate payload without sending:
```bash
npm run test:webhook -- --sample --validate-only
```

Specify invoice type:
```bash
npm run test:webhook -- --sample --invoice-type RAČUN
```

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --sample` | Use sample payload from examples/ | - |
| `-f, --file <path>` | Load payload from JSON file | - |
| `-i, --invoice-type <type>` | Invoice type (PONUDA, RAČUN, FISKALNI_RAČUN) | PONUDA |
| `--validate-only` | Validate without sending | false |

## 📊 Google Sheets Column Mapping

The integration automatically maps your form columns to FIRA fields:

| Google Sheets Column | FIRA Field | Required |
|---------------------|------------|----------|
| Customer Name / Name | billingAddress.name | ✅ Yes |
| Email / Email Address | billingAddress.email | ✅ Yes |
| Product/Service / Product | lineItems[].name | ✅ Yes |
| Price / Unit Price | lineItems[].price | ✅ Yes |
| Company | billingAddress.company | No |
| Address | billingAddress.address1 | No |
| City | billingAddress.city | No |
| ZIP Code / Postal Code | billingAddress.zipCode | No |
| Country | billingAddress.country | No |
| Phone / Phone Number | billingAddress.phone | No |
| OIB | billingAddress.oib | No |
| VAT Number / VAT ID | billingAddress.vatNumber | No |
| Description | lineItems[].description | No |
| Quantity | lineItems[].quantity | No |
| Tax Rate | lineItems[].taxRate | No |

See [examples/sheets-mapping.json](./examples/sheets-mapping.json) for customization options.

## ⚙️ Configuration

### Environment Variables (.env)

```bash
# Required
FIRA_API_KEY=your_fira_api_key_here

# Optional (with defaults)
FIRA_API_URL=https://app.fira.finance
DEFAULT_INVOICE_TYPE=PONUDA
DEFAULT_CURRENCY=EUR
DEFAULT_PAYMENT_TYPE=TRANSAKCIJSKI
DEFAULT_TAX_RATE=0.25
```

### Google Apps Script Configuration

Configure via **FIRA Actions → ⚙️ Configure API Key** menu or Script Properties:

| Property | Description | Default |
|----------|-------------|---------|
| `FIRA_API_KEY` | Your FIRA API key | Required |
| `FIRA_API_URL` | FIRA API endpoint | https://app.fira.finance |
| `DEFAULT_INVOICE_TYPE` | PONUDA, RAČUN, FISKALNI_RAČUN | PONUDA |
| `DEFAULT_CURRENCY` | EUR, USD, HRK, etc. | EUR |
| `DEFAULT_PAYMENT_TYPE` | GOTOVINA, TRANSAKCIJSKI, KARTICA | TRANSAKCIJSKI |
| `DEFAULT_TAX_RATE` | Decimal (0.25 = 25%) | 0.25 |
| `DEFAULT_COUNTRY` | 2-letter code (HR, DE, AT) | HR |

## 🔧 API Reference

### FIRA Webhook Endpoint

```
POST https://app.fira.finance/api/v1/webshop/order/custom
```

### Authentication

```
Authorization: Bearer YOUR_API_KEY
```

### Payload Structure

See [examples/sample-payload.json](./examples/sample-payload.json) for a complete example.

**Key Fields:**

```typescript
{
  invoiceType: 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN',
  billingAddress: {
    name: string,      // Required
    email: string,     // Required
    company?: string,
    address1?: string,
    city?: string,
    country?: string,  // 2-letter ISO code
    // ...
  },
  lineItems: [{        // At least 1 required
    name: string,
    price: number,
    quantity: number,
    taxRate: number,   // Decimal format (0.25 = 25%)
    // ...
  }],
  currency: string,    // EUR, USD, etc.
  paymentType?: 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA',
  // ...
}
```

**Important Notes:**

- Tax rates must be in decimal format: `0.25` (not `25`)
- Country codes: 2-letter ISO codes (`HR`, `DE`, `AT`)
- Dates:
  - `createdAt`: ISO 8601 format (`2025-11-11T22:56:00Z`)
  - `dueDate`, `validTo`: `YYYY-MM-DD` format (`2025-11-25`)

### Invoice Types

| Type | Description | Use Case |
|------|-------------|----------|
| `PONUDA` | Offer/Quote | Testing, non-binding quotes |
| `RAČUN` | Invoice | Standard invoices |
| `FISKALNI_RAČUN` | Fiscal Invoice | Croatian SMEs with fiscal settings |

**💡 Recommendation:** Start with `PONUDA` for testing to avoid fiscal complications.

## 🧪 Testing

### Test with Sample Data

```bash
npm run test:sample
```

This sends a test invoice to FIRA using the sample payload.

### Test with Custom Data

1. Create a JSON file with your payload
2. Run:
   ```bash
   npm run test:webhook -- --file my-payload.json
   ```

### Validate Payload

```bash
npm run test:webhook -- --sample --validate-only
```

## 🤝 Development

### Project Structure

```
fira-forms-connector/
├── cli/
│   └── test-webhook.ts          # CLI testing tool
├── google-apps-script/
│   ├── Code.gs                   # Main Apps Script
│   ├── Config.gs                 # Configuration management
│   └── README.md                 # Setup instructions
├── types/
│   └── fira.ts                   # TypeScript type definitions
├── examples/
│   ├── sample-payload.json       # Example FIRA payload
│   └── sheets-mapping.json       # Column mapping config
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

### Building

```bash
npm run build
```

### Code Quality

```bash
# Lint
npm run lint

# Format
npm run format
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔒 Security

- **API keys** are stored securely in environment variables (.env) and Google Script Properties
- **Never commit** `.env` files to version control
- **HTTPS only** - all API calls use encrypted connections
- **Data privacy** - no data is sent to third parties except FIRA.finance

## ❓ Troubleshooting

### Common Issues

**"FIRA_API_KEY not found"**
- Solution: Create `.env` file and add your API key

**"Authentication failed"**
- Solution: Verify your API key is correct in FIRA settings

**"Validation error"**
- Solution: Check required fields (name, email, product, price)

**Tax rate issues**
- Solution: Use decimal format (0.25, not 25)

**Google Sheets menu not appearing**
- Solution: Reload the sheet after installing the script

See [Google Sheets Troubleshooting Guide](./google-apps-script/README.md#troubleshooting) for more details.

## 📖 Resources

- **FIRA.finance**: [https://fira.finance](https://fira.finance)
- **FIRA API Documentation**: [https://app.swaggerhub.com/apis-docs/FIRAFinance/Custom_webshop/v1.0.0](https://app.swaggerhub.com/apis-docs/FIRAFinance/Custom_webshop/v1.0.0)
- **Google Apps Script**: [https://developers.google.com/apps-script](https://developers.google.com/apps-script)

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 👏 Credits

Created by [Matija Stepanic](https://github.com/stepanic)

## 🌟 Support

If you find this integration helpful, please:
- ⭐ Star this repository
- 🐛 Report issues on [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)
- 💡 Suggest features or improvements
- 🤝 Contribute to the project

---

**Made with ❤️ for the FIRA.finance community**
