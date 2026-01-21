# Real Submission Test - Testiranje s Pravim Podacima

## 📋 Pregled

Ova skripta (`cli/test-real-submission.ts`) testira FIRA webhook sa stvarnim podacima iz vašeg Google Forms submissiona.

**Vaši podaci:**
- Ime: Matija Stepanić
- Email: stepanic.matija@gmail.com
- Grad: Lukavec, Hrvatska
- Telefon: +385989679022
- Zanimanje: Programer

---

## 🚀 Kako pokrenuti

### Priprema (prvi put)

1. **Provjerite da su dependencies instalirane:**
   ```bash
   npm install
   ```

2. **Kopirajte .env.example u .env:**
   ```bash
   cp .env.example .env
   ```

3. **Uredite .env i dodajte FIRA API ključ:**
   ```bash
   # Otvorite .env u editoru
   code .env  # ili vi .env, nano .env...

   # Dodajte vaš API ključ:
   FIRA_API_KEY=vaš_pravi_api_ključ_ovdje
   ```

4. **Opcionalno: Prilagodite postavke u .env:**
   ```bash
   DEFAULT_INVOICE_TYPE=PONUDA        # ili RAČUN
   DEFAULT_CURRENCY=EUR
   DEFAULT_PAYMENT_TYPE=TRANSAKCIJSKI
   DEFAULT_TAX_RATE=0.25              # 25%
   DEFAULT_PRICE=100                  # Zadana cijena ako Payment je prazan
   DEFAULT_SERVICE_NAME=Registracija za susret
   ```

### Pokretanje

```bash
npm run test:real
```

---

## 📊 Što skripta radi

### 1. Parsiranje podataka

Skripta parsira vaš submission row sa separator `-----`:

```
21.1.2026. 12:10:13-----stepanic.matija@gmail.com----------Matija Stepanić-----Male (muški)-----Lukavec, Hrvatska-----1990-----...
```

### 2. Mapiranje stupaca

| Pozicija | Stupac | Vrijednost (iz vašeg submissiona) |
|----------|--------|-----------------------------------|
| 0 | Timestamp | 21.1.2026. 12:10:13 |
| 1 | E-adresa | stepanic.matija@gmail.com |
| 2 | Payment | (prazan - koristi DEFAULT_PRICE) |
| 3 | Name and surname | Matija Stepanić |
| 4 | Gender | Male (muški) |
| 5 | City and Country | Lukavec, Hrvatska |
| 6 | Year of birth | 1990 |
| 7 | How did you find | Through friends / acquaintances |
| 8 | Phone number | +385989679022 |
| 9 | Conf. mail | (prazan) |
| 10 | Marital status | Unmarried - in a relationship... |
| 11 | Why registering | FIRA.finance testiranje... |
| 12 | Occupation | Programer |
| 13 | Diet | Nemam |
| 14 | Experience | Razne konferencije :D |
| 15 | Questions | Bok Tomislav, ovo je proba |
| 16 | Expectations | Da mogu dobiti fiskalizirani racun :)) |
| 17 | Notice | I am familiar with... |
| 18 | AKCIJA_FIRA_RACUN | (status - prazan) |

### 3. Parsiranje grada i države

Iz `Lukavec, Hrvatska` parsira:
- **city:** "Lukavec"
- **country:** "HR"

Parser prepoznaje:
- Croatia, Hrvatska → HR
- Germany, Njemačka → DE
- Austria → AT
- Slovenia, Slovenija → SI
- Serbia, Srbija → RS
- Bosnia, Bosna → BA
- Italy, Italija → IT

### 4. Kreiranje FIRA payloada

```json
{
  "invoiceType": "PONUDA",
  "billingAddress": {
    "name": "Matija Stepanić",
    "email": "stepanic.matija@gmail.com",
    "city": "Lukavec",
    "country": "HR",
    "phone": "+385989679022"
  },
  "lineItems": [{
    "name": "Registracija za susret",
    "description": "Registracija sudionika: Matija Stepanić",
    "price": 100.00,
    "quantity": 1,
    "taxRate": 0.25
  }],
  "netto": 100.00,
  "taxValue": 25.00,
  "brutto": 125.00,
  "internalNote": "Registracija iz Google Forms\nSpol: Male (muški)\nGodina rođenja: 1990\nZanimanje: Programer\n..."
}
```

### 5. Slanje na FIRA

Skripta:
1. Prikazuje sve parsane podatke
2. Prikazuje kompletan payload
3. Čeka 3 sekunde (možete pritisnuti Ctrl+C za otkazivanje)
4. Šalje webhook na FIRA API
5. Prikazuje rezultat (success ili error)

---

## 📤 Output primjer

```bash
$ npm run test:real

🧪 FIRA.finance - Real Submission Test
Testing with actual Google Forms submission data

📄 Parsing submission data...
✅ Parsed submission:
  Name: Matija Stepanić
  Email: stepanic.matija@gmail.com
  Payment:
  City/Country: Lukavec, Hrvatska
  Phone: +385989679022
  Gender: Male (muški)
  Year of Birth: 1990
  Occupation: Programer

⚙️  Configuration:
  Invoice Type: PONUDA
  Currency: EUR
  Tax Rate: 25%
  Default Price: 100 EUR
  Service Name: Registracija za susret

🔄 Converting to FIRA payload...
✅ Payload created:
  Order ID: 123456
  Order Number: GF-1737465360000
  Netto: 100 EUR
  Tax: 25 EUR
  Brutto: 125 EUR

📋 Full Payload:
────────────────────────────────────────────────────────────────────────────────
{
  "webshopOrderId": 123456,
  "webshopType": "CUSTOM",
  "webshopEvent": "google_forms_registration",
  ...
}
────────────────────────────────────────────────────────────────────────────────

⚠️  This will create a real invoice in FIRA!
Press Ctrl+C to cancel, or wait 3 seconds to continue...

🚀 Sending webhook to FIRA...
   Endpoint: https://app.fira.finance/api/v1/webshop/order/custom
   Invoice Type: PONUDA
   Customer: Matija Stepanić
   Email: stepanic.matija@gmail.com
   Amount: 125 EUR

✅ Success! Invoice created in FIRA

Response:
{
  "success": true,
  ...
}

🎉 Check your FIRA dashboard: https://app.fira.finance
```

---

## ⚙️ Konfiguracija

### Promjena vrste računa

U `.env` datoteci:

```bash
# Za testiranje (preporučeno)
DEFAULT_INVOICE_TYPE=PONUDA

# Za stvarne račune
DEFAULT_INVOICE_TYPE=RAČUN

# Za fiskalizirane račune (samo HR s fiskalnim postavkama)
DEFAULT_INVOICE_TYPE=FISKALNI_RAČUN
```

### Promjena cijene

Ako stupac `Payment` nije popunjen:

```bash
DEFAULT_PRICE=150  # Cijena u EUR-ima
```

### Promjena naziva usluge

```bash
DEFAULT_SERVICE_NAME=Kotizacija za susret
DEFAULT_SERVICE_NAME=Registracija za event
```

### Promjena porezne stope

```bash
DEFAULT_TAX_RATE=0.25  # 25% (HR standardna)
DEFAULT_TAX_RATE=0.13  # 13% (HR snižena)
DEFAULT_TAX_RATE=0.05  # 5%
```

---

## 🧪 Testiranje bez slanja

Ako želite samo vidjeti payload bez slanja na FIRA:

**Opcija 1:** Pritisnite `Ctrl+C` kada skripta čeka 3 sekunde

**Opcija 2:** Dodajte privremeni code koji zaustavlja prije slanja:

```typescript
// U cli/test-real-submission.ts, dodaj prije sendWebhook:
console.log('Stopping before sending...');
process.exit(0);
```

---

## 🐛 Troubleshooting

### "FIRA_API_KEY not found"

**Rješenje:**
```bash
cp .env.example .env
# Uredite .env i dodajte API ključ
```

### "Authentication failed"

**Rješenje:**
- Provjerite da je API ključ ispravan
- Idite na https://app.fira.finance/settings/integrations
- Kopirajte novi ključ u `.env`

### Payment je prazan, koristi se 0

**Rješenje:**
```bash
# U .env dodajte:
DEFAULT_PRICE=100
```

### Država nije prepoznata

**Rješenje:**
- Dodajte mapiranje u `parseCityAndCountry()` funkciju u skripti
- Ili direktno unesite ISO kod (npr. "Lukavec, HR")

---

## 📝 Interna bilješka

Svi dodatni podaci se spremaju u internu bilješku (vidljivo samo vama u FIRA):

```
Registracija iz Google Forms
Spol: Male (muški)
Godina rođenja: 1990
Zanimanje: Programer
Kako saznali: Through friends / acquaintances
Prehrana: Nemam
Iskustvo: Razne konferencije :D
Razlog: FIRA.finance testiranje izrade računa sa Google Scripts i sa Claude Desktop (Code)
Očekivanja: Da mogu dobiti fiskalizirani racun :)) ✝️❤️🇭🇷
Pitanja: Bok Tomislav, ovo je proba
```

---

## 🔄 Testiranje s novim submissionom

Za testiranje s drugim submission podacima:

1. **Kopirajte novi submission row** iz Google Sheets
2. **Zamijenite TAB sa `-----`** (u VS Code: Find & Replace)
3. **Uredite skriptu** `cli/test-real-submission.ts`
4. **Zamijenite `realSubmission` varijablu** s novim podacima
5. **Pokrenite:** `npm run test:real`

---

## 📊 Usporedba s drugim skriptama

| Skripta | Svrha | Podaci |
|---------|-------|--------|
| `test:webhook` | Generičko testiranje | Proizvoljni JSON |
| `test:sample` | Test sa sample payloadom | `examples/sample-payload.json` |
| **`test:real`** | **Test s pravim submissionom** | **Vaši pravi podaci iz Google Forms** |

---

## ✅ Sljedeći koraci

Nakon uspješnog testa:

1. ✅ Provjerite račun na https://app.fira.finance
2. ✅ Postavite Google Apps Script kod u vaš sheet
3. ✅ Kopirajte `Code-Custom-Mapping.gs` i `Config-Custom.gs`
4. ✅ Testirajte direktno iz Google Sheets
5. ✅ Prilagodite postavke po potrebi

---

## 📞 Podrška

- **Dokumentacija:** [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md)
- **Column Mapping:** [COLUMN_MAPPING_GUIDE.md](./COLUMN_MAPPING_GUIDE.md)
- **Project Summary:** [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)

---

**Sretno s testiranjem! 🎉**
