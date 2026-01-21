# FIRA Forms Connector - Upute za postavljanje (Hrvatski)

## 📋 Pregled

Ova integracija automatski stvara račune u FIRA.finance iz podataka Google Forms koji su pohranjeni u Google Sheets.

**Link na vaš Google Sheet:** https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/

---

## 🚀 Brzo postavljanje (10 minuta)

### Korak 1: Preuzmite FIRA API ključ (2 minute)

1. Otvorite [FIRA.finance Postavke](https://app.fira.finance/settings/integrations)
2. Prijavite se u svoj FIRA račun
3. Pronađite sekciju **API Key**
4. **Kopirajte** svoj API ključ (trebat će vam u koraku 4)

> **Napomena:** Čuvajte API ključ kao tajnu! Ne dijelite ga javno.

---

### Korak 2: Otvorite Apps Script editor (1 minuta)

1. Otvorite vaš Google Sheet: [Klikni ovdje](https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/)
2. U izborniku, kliknite **Proširenja → Apps Script** (Extensions → Apps Script)
3. Otvara se nova kartica s Apps Script editorom

---

### Korak 3: Dodajte kod (3 minute)

#### 3a. Dodajte Code.gs

1. U Apps Script editoru, vidjet ćete `Code.gs` na lijevoj strani
2. **Obrišite** sav postojeći kod (odaberite sve i obrišite)
3. **Kopirajte** sav kod iz ove datoteke: [`google-apps-script/Code.gs`](./google-apps-script/Code.gs)
4. **Zalijepite** ga u editor
5. Kliknite **💾 Save** (ili Ctrl+S / Cmd+S)

#### 3b. Dodajte Config.gs

1. Kliknite **+** gumb pored "Files" u lijevoj traci
2. Odaberite **Script**
3. Nazovite ga: `Config` (automatski će dodati `.gs`)
4. **Kopirajte** sav kod iz ove datoteke: [`google-apps-script/Config.gs`](./google-apps-script/Config.gs)
5. **Zalijepite** ga u novu datoteku
6. Kliknite **💾 Save** (ili Ctrl+S / Cmd+S)

#### 3c. Provjera

Sada biste trebali vidjeti dvije datoteke u lijevoj traci:
- ✅ Code.gs
- ✅ Config.gs

---

### Korak 4: Konfigurirajte API ključ (2 minute)

1. **Zatvorite** Apps Script karticu
2. Vratite se na svoj Google Sheet
3. **Osvježite** stranicu (F5 ili Cmd+R)
4. Pričekajte nekoliko sekundi - trebali biste vidjeti novi izbornik: **FIRA Actions**
5. Kliknite **FIRA Actions → ⚙️ Configure API Key**
6. Pojavljuje se dijalog - zalijepite svoj FIRA API ključ (iz koraka 1)
7. Kliknite **OK**
8. Trebali biste vidjeti "Success! FIRA API key saved successfully!"

---

### Korak 5: Autorizirajte skriptu (Samo prvi put - 2 minute)

1. Kliknite na **bilo koji redak** s podacima u vašem sheetu (ne na zaglavlje)
2. Kliknite **FIRA Actions → Create Invoice in FIRA**
3. Google će prikazati dijalog za autorizaciju:
   - Kliknite **Review Permissions**
   - Odaberite svoj Google račun
   - Vidjet ćete "Google hasn't verified this app"
   - Kliknite **Advanced**
   - Kliknite **Go to FIRA Integration (unsafe)**
     - *(Ne brinite - to je VAŠ kod, siguran je!)*
   - Kliknite **Allow**

---

### Korak 6: Stvorite prvi račun! (30 sekundi)

1. Kliknite na **bilo koji redak** s podacima iz forme
2. Kliknite **FIRA Actions → Create Invoice in FIRA**
3. Pričekajte nekoliko sekundi...
4. Trebali biste vidjeti: **"Success! Invoice created successfully in FIRA.finance"**
5. Pojavljuje se novi stupac: **FIRA Status** (zeleno = uspjeh)
6. Još jedan stupac: **FIRA Timestamp** (kada je stvoreno)

---

### Korak 7: Provjerite FIRA Dashboard

1. Otvorite [FIRA.finance Dashboard](https://app.fira.finance)
2. Trebali biste vidjeti svoj novi račun/ponudu!
3. Kliknite na njega da vidite detalje

---

## ✅ Gotovo!

Od sada, za stvaranje računa:

1. Kliknite na redak s podacima
2. Kliknite **FIRA Actions → Create Invoice in FIRA**
3. Gotovo! ✨

---

## 🔧 Postavke

### Zadane postavke

Integracija koristi ove zadane postavke:
- **Vrsta računa:** PONUDA (sigurno za testiranje)
- **Valuta:** EUR
- **Način plaćanja:** TRANSAKCIJSKI (bankovni prijenos)
- **Porezna stopa:** 25% (0.25)
- **Država:** HR (Hrvatska)

### Promjena vrste računa

Ako želite stvarati **RAČUN** umjesto PONUDA:

1. Otvorite Apps Script editor (**Proširenja → Apps Script**)
2. Kliknite na **Project Settings** (⚙️ ikona na lijevoj strani)
3. Skrolajte dolje do **Script Properties**
4. Kliknite **Add script property**
   - **Property:** `DEFAULT_INVOICE_TYPE`
   - **Value:** `RAČUN`
5. Kliknite **Save**

---

## 📊 Mapiranje stupaca

Skripta automatski mapira stupce iz vašeg sheeta:

| Stupac u Google Sheets | FIRA polje | Obavezno |
|------------------------|------------|----------|
| Customer Name / Name | Ime kupca | ✅ Da |
| Email / Email Address | Email | ✅ Da |
| Product/Service | Proizvod/Usluga | ✅ Da |
| Price / Unit Price | Cijena | ✅ Da |
| Company | Tvrtka | Ne |
| Address | Adresa | Ne |
| City | Grad | Ne |
| ZIP Code | Poštanski broj | Ne |
| Country | Država | Ne |
| Phone | Telefon | Ne |
| OIB | OIB | Ne |
| VAT Number | PDV broj | Ne |

---

## ❓ Rješavanje problema

### "FIRA Actions" izbornik se ne pojavljuje

**Rješenje:**
1. Provjerite jeste li spremili Code.gs i Config.gs
2. Osvježite Google Sheet (F5)
3. Pričekajte 10 sekundi i provjerite ponovno

### "Configuration Required" greška

**Rješenje:**
1. Kliknite **FIRA Actions → ⚙️ Configure API Key**
2. Zalijepite svoj API ključ
3. Provjerite da nema dodatnih razmaka

### "Validation Error: Customer name is required"

**Rješenje:**
- Provjerite da vaš sheet ima stupac nazvan "Customer Name" ili "Name"
- Provjerite da odabrani redak ima podatke u tom stupcu

### "Authentication failed"

**Rješenje:**
1. Idite na [FIRA Postavke](https://app.fira.finance/settings/integrations)
2. Kopirajte API ključ ponovno
3. Kliknite **FIRA Actions → ⚙️ Configure API Key**
4. Zalijepite novi ključ

---

## 📞 Podrška

Za pomoć:
- **Detaljne upute (engleski):** [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
- **Problemi:** [GitHub Issues](https://github.com/yourusername/fira-forms-connector/issues)
- **FIRA podrška:** [fira.finance/support](https://fira.finance/support)

---

## 🎯 Napredne mogućnosti

### Promjena zadane valute

Script Properties → Add:
- **Property:** `DEFAULT_CURRENCY`
- **Value:** `EUR` ili `HRK` ili `USD`...

### Promjena porezne stope

Script Properties → Add:
- **Property:** `DEFAULT_TAX_RATE`
- **Value:** `0.25` (za 25%) ili `0.13` (za 13%)

### Promjena načina plaćanja

Script Properties → Add:
- **Property:** `DEFAULT_PAYMENT_TYPE`
- **Value:** `GOTOVINA`, `TRANSAKCIJSKI`, ili `KARTICA`

---

## 🔒 Sigurnost

- ✅ API ključ je pohranjen sigurno (Google Script Properties)
- ✅ Podaci se šalju samo na FIRA.finance
- ✅ Nema slanja podataka trećim stranama
- ✅ Sav kod možete pregledati u Apps Script editoru

---

## ✨ Sretno s fakturiranjem!

Za dodatna pitanja ili pomoć, pogledajte:
- [README.md](./README.md) - Glavna dokumentacija (engleski)
- [QUICKSTART.md](./QUICKSTART.md) - Brzi početak (engleski)
- [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Pregled projekta (engleski)
