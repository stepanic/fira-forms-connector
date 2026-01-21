# CLI Commands Reference

## Available Commands

### 1. Test with Sample Payload
```bash
npm run test:sample
```
Tests with generic sample data from `examples/sample-payload.json`

**Use case:** Quick test to verify FIRA API connection

---

### 2. Test with Real Google Forms Submission ⭐
```bash
npm run test:real
```
Tests with actual data from your Google Forms submission

**Use case:** Test with real data before deploying to Google Sheets

**Features:**
- Parses real submission row with `-----` separator
- Maps your specific columns
- Shows full payload before sending
- 3-second delay (Ctrl+C to cancel)

📖 **Documentation:** [REAL_SUBMISSION_TEST.md](./REAL_SUBMISSION_TEST.md)

---

### 3. Test with Custom File
```bash
npm run test:webhook -- --file path/to/your-payload.json
```
Tests with custom JSON payload file

**Use case:** Test with custom scenarios

---

### 4. Validate Payload (No API call)
```bash
npm run test:webhook -- --sample --validate-only
```
Validates payload structure without sending to FIRA

**Use case:** Check payload format before sending

---

### 5. Test Different Invoice Types
```bash
# PONUDA (Offer) - safe for testing
npm run test:webhook -- --sample --invoice-type PONUDA

# RAČUN (Invoice)
npm run test:webhook -- --sample --invoice-type RAČUN

# FISKALNI_RAČUN (Fiscal Invoice)
npm run test:webhook -- --sample --invoice-type FISKALNI_RAČUN
```

---

### 6. Build TypeScript
```bash
npm run build
```
Compiles TypeScript to JavaScript in `dist/` folder

---

### 7. Lint Code
```bash
npm run lint
```
Checks code for errors with ESLint

---

### 8. Format Code
```bash
npm run format
```
Auto-formats code with Prettier

---

## Quick Reference

| Command | Purpose | API Call |
|---------|---------|----------|
| `npm run test:sample` | Test with sample data | ✅ Yes |
| `npm run test:real` | Test with your real submission | ✅ Yes |
| `npm run test:webhook -- --file FILE` | Test with custom file | ✅ Yes |
| `npm run test:webhook -- --sample --validate-only` | Validate only | ❌ No |
| `npm run build` | Build TypeScript | ❌ No |

---

## Configuration

All commands read from `.env` file:

```bash
FIRA_API_KEY=your_api_key
FIRA_API_URL=https://app.fira.finance
DEFAULT_INVOICE_TYPE=PONUDA
DEFAULT_CURRENCY=EUR
DEFAULT_PAYMENT_TYPE=TRANSAKCIJSKI
DEFAULT_TAX_RATE=0.25
DEFAULT_PRICE=100
DEFAULT_SERVICE_NAME=Registracija za susret
```

---

## Workflow

### First Time Setup
```bash
# 1. Install dependencies
npm install

# 2. Create .env file
cp .env.example .env

# 3. Edit .env and add FIRA_API_KEY
code .env

# 4. Test validation (no API call)
npm run test:webhook -- --sample --validate-only

# 5. Test with sample data (creates PONUDA in FIRA)
npm run test:sample

# 6. Test with your real data (creates PONUDA in FIRA)
npm run test:real
```

### Testing Loop
```bash
# Quick validation check
npm run test:webhook -- --sample --validate-only

# Test with real data
npm run test:real

# Check FIRA dashboard
open https://app.fira.finance
```

---

## Examples

### Test with Different Prices

Edit `.env`:
```bash
DEFAULT_PRICE=150
```

Then run:
```bash
npm run test:real
```

### Test with Different Service Name

Edit `.env`:
```bash
DEFAULT_SERVICE_NAME=Kotizacija za event
```

Then run:
```bash
npm run test:real
```

### Test Creating RAČUN Instead of PONUDA

Edit `.env`:
```bash
DEFAULT_INVOICE_TYPE=RAČUN
```

Then run:
```bash
npm run test:real
```

---

## Troubleshooting

### Error: "FIRA_API_KEY not found"

**Solution:**
```bash
cp .env.example .env
# Edit .env and add your API key
```

### Error: "Module not found"

**Solution:**
```bash
npm install
```

### Error: "Authentication failed"

**Solution:**
- Check API key in `.env`
- Get new key from https://app.fira.finance/settings/integrations

---

## See Also

- [README.md](./README.md) - Main documentation
- [REAL_SUBMISSION_TEST.md](./REAL_SUBMISSION_TEST.md) - Real submission testing guide
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
- [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md) - Croatian setup guide
