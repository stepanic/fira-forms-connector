# FIRA Forms Connector - Automatsko kreiranje računa iz Google Forma

> Open-source integracija između FIRA.finance i Google Forms/Sheets

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🎯 Što radi ova integracija?

Automatski kreira račune/ponude u [FIRA.finance](https://fira.finance) iz podataka Google Forms koji su spremljeni u Google Sheets.

**Jednostavno:**
1. Osoba ispuni vaš Google Form
2. Podaci se spremi u Google Sheet
3. Vi kliknete gumb u sheetu
4. Račun se automatski kreira u FIRA.finance

---

## 📁 Vaš Google Sheet

https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/

---

## 🚀 Kako postaviti? (10 minuta)

### Za vaš specifični Google Form (registracija):

📖 **[UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md)** - Kompletne upute korak-po-korak (na hrvatskom)

### Brzi pregled:

1. **Preuzmite FIRA API ključ** sa https://app.fira.finance/settings/integrations
2. **Otvorite Google Sheet** → Extensions → Apps Script
3. **Kopirajte kod** iz `Code-Custom-Mapping.gs` i `Config-Custom.gs`
4. **Postavite API ključ** preko izbornika
5. **Kliknite gumb** i stvorite račun!

---

## 📚 Dokumentacija

### Hrvatski jezik

1. **[UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md)** - Glavne upute za postavljanje (detaljno)
2. **[UPUTE_HR.md](./UPUTE_HR.md)** - Osnovne upute (generičke)

### English

1. **[README.md](./README.md)** - Main documentation
2. **[QUICKSTART.md](./QUICKSTART.md)** - Quick start guide
3. **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** - Step-by-step Google Sheets setup
4. **[COLUMN_MAPPING_GUIDE.md](./COLUMN_MAPPING_GUIDE.md)** - Column mapping reference
5. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Complete project overview

---

## 🛠️ Datoteke koje trebate

### Google Apps Script (kopirajte u Apps Script editor)

1. **[Code-Custom-Mapping.gs](./google-apps-script/Code-Custom-Mapping.gs)** - Glavni kod **← KORISTITE OVU VERZIJU**
2. **[Config-Custom.gs](./google-apps-script/Config-Custom.gs)** - Konfiguracija **← KORISTITE OVU VERZIJU**

**Alternativno (generička verzija):**
- [Code.gs](./google-apps-script/Code.gs) - Generička verzija
- [Config.gs](./google-apps-script/Config.gs) - Generička konfiguracija

---

## 📊 Mapiranje stupaca

Vaši stupci iz Google Forma → FIRA polja:

| Google Sheet stupac | FIRA polje | Obavezno |
|---------------------|------------|----------|
| `Name and surname (Ime i prezime)` | Ime kupca | ✅ DA |
| `E-adresa` | Email | ✅ DA |
| `Payment` | Cijena | ✅ DA (mora biti > 0) |
| `City and Country (Mjesto i država)` | Grad + Država | Ne |
| `Phone number (Kontakt broj)` | Telefon | Ne |
| `Gender (Spol)` | Interna bilješka | Ne |
| `Year of birth` | Interna bilješka | Ne |
| `Occupation` | Interna bilješka | Ne |

**Detalje:** Pogledajte [COLUMN_MAPPING_GUIDE.md](./COLUMN_MAPPING_GUIDE.md)

---

## ⚙️ Postavke

### Zadane vrijednosti

- **Vrsta računa:** PONUDA (sigurno za testiranje)
- **Valuta:** EUR
- **Plaćanje:** TRANSAKCIJSKI (bankovni prijenos)
- **Porezna stopa:** 25% (0.25)
- **Država:** HR (Hrvatska)
- **Naziv usluge:** "Registracija za susret"

### Kako promijeniti?

**Extensions → Apps Script → Project Settings → Script Properties**

Dodajte property:
- `DEFAULT_INVOICE_TYPE` = `RAČUN` (za stvarne račune)
- `DEFAULT_SERVICE_NAME` = `Vaš naziv usluge`
- `DEFAULT_PRICE` = `100` (zadana cijena ako Payment nije popunjen)
- `DEFAULT_TAX_RATE` = `0.13` (za 13% poreza)

---

## ✅ Što će se kreirati u FIRA?

### Račun/Ponuda sa:

**Kupac:**
- Ime: Iz "Name and surname"
- Email: Iz "E-adresa"
- Grad: Iz "City and Country" (parsira se)
- Država: Iz "City and Country" (parsira se)
- Telefon: Iz "Phone number"

**Stavka:**
- Naziv: "Registracija za susret"
- Opis: "Registracija sudionika: [Ime]"
- Cijena: Iz "Payment" stupca
- Količina: 1
- PDV: 25%

**Interna bilješka (vidljivo samo vama):**
```
Registracija iz Google Forms
Spol: M/Ž
Godina rođenja: 1990
Zanimanje: ...
```

---

## 🧪 CLI Test Tool (za developere)

### Instalacija

```bash
npm install
cp .env.example .env
# Dodajte FIRA_API_KEY u .env
```

### Testiranje

```bash
# Samo validacija (ne šalje na FIRA)
npm run test:webhook -- --sample --validate-only

# Stvaranje test računa u FIRA
npm run test:sample

# Custom payload
npm run test:webhook -- --file examples/sample-payload-registration.json
```

---

## ❓ Najčešća pitanja

### Što ako Payment stupac nije popunjen?

Postavite `DEFAULT_PRICE` u Script Properties.

### Kako promijeniti "Registracija za susret"?

Postavite `DEFAULT_SERVICE_NAME` u Script Properties.

### Mogu li koristiti RAČUN umjesto PONUDA?

Da! Postavite `DEFAULT_INVOICE_TYPE` = `RAČUN` u Script Properties.
**Napomena:** Za FISKALNI_RAČUN trebate imati fiskalne postavke u FIRA.

### Što ako zelim dodati više stavki na račun?

Trenutno podržava jednu stavku po redu. Za više stavki potrebno je prilagoditi kod.

---

## 🐛 Problemi?

### "FIRA Actions" izbornik se ne pojavljuje

1. Provjerite da ste spremili Code i Config datoteke
2. Osvježite Google Sheet (F5)
3. Pričekajte 10 sekundi

### "Greška validacije"

Provjerite da su popunjeni:
- ✅ Name and surname
- ✅ E-adresa
- ✅ Payment (broj > 0)

### "Autentifikacija nije uspjela"

1. Idite na https://app.fira.finance/settings/integrations
2. Kopirajte novi API ključ
3. **FIRA Actions → Postavi API ključ**

**Više:** Pogledajte [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md#-rješavanje-problema)

---

## 📦 Struktura projekta

```
fira-forms-connector/
├── google-apps-script/
│   ├── Code-Custom-Mapping.gs   ← Koristite ovu verziju za vaš form
│   ├── Config-Custom.gs          ← Koristite ovu verziju za vaš form
│   ├── Code.gs                   (generička verzija)
│   ├── Config.gs                 (generička verzija)
│   └── README.md
├── cli/
│   └── test-webhook.ts           (CLI testing tool)
├── examples/
│   ├── sample-payload.json
│   └── sample-payload-registration.json
├── types/
│   └── fira.ts                   (TypeScript types)
├── UPUTE_CUSTOM_MAPPING_HR.md    ← Glavni dokument (HR)
├── UPUTE_HR.md                   (Generičke upute HR)
├── COLUMN_MAPPING_GUIDE.md       (Mapiranje stupaca)
├── README.md                     (English main docs)
├── QUICKSTART.md
└── ...
```

---

## 🔒 Sigurnost

- ✅ API ključ pohranjen sigurno (Script Properties)
- ✅ Podaci se šalju samo na FIRA.finance
- ✅ Nema slanja podataka trećim stranama
- ✅ HTTPS enkriptirana komunikacija

---

## 📞 Podrška

- **FIRA API dokumentacija:** https://app.swaggerhub.com/apis-docs/FIRAFinance/Custom_webshop/v1.0.0
- **FIRA Dashboard:** https://app.fira.finance
- **GitHub Issues:** Za prijavu bugova i pitanja

---

## 📄 Licenca

MIT License - see [LICENSE](./LICENSE)

Autor: Matija Stepanic

---

## 🎉 Sretno!

Za bilo kakva pitanja ili pomoć, pogledajte dokumentaciju ili otvorite issue na GitHubu.

**Preporučeni redoslijed čitanja:**
1. [UPUTE_CUSTOM_MAPPING_HR.md](./UPUTE_CUSTOM_MAPPING_HR.md) - Glavni vodič za postavljanje
2. [COLUMN_MAPPING_GUIDE.md](./COLUMN_MAPPING_GUIDE.md) - Detalji o mapiranju stupaca
3. [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Pregled cijelog projekta
