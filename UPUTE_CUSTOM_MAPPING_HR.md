# FIRA Integracija - Prilagođeno mapiranje za vaš Google Form

## 📋 Vaši stupci u Google Sheetu

Vaš Google Sheet ima sljedeće stupce iz Google Forma:

1. `Vremenska oznaka` - Vrijeme ispunjavanja forme
2. `E-adresa` - Email sudionika
3. `Payment` - **Cijena registracije (broj)**
4. `Name and surname (Ime i prezime)` - Ime sudionika
5. `Gender (Spol)` - Spol
6. `City and Country (Mjesto i država)` - Grad i država
7. `Year of birth (Godina rođenja)` - Godina rođenja
8. `How did I find out about this program` - Kako ste saznali
9. `Phone number (Kontakt broj)` - Telefon
10. `Conf. mail` - Potvrda emaila
11. `Marital status (Bračni status)` - Bračni status
12. `Why am I registering` - Razlog prijave
13. `Occupation / profession / job` - Zanimanje
14. `Do you have a specific diet` - Prehrana
15. `Do I have experience` - Iskustvo
16. `Do you have any questions` - Pitanja
17. `What do you expect` - Očekivanja
18. `Notice to participants` - Obavijest (GDPR)
19. `AKCIJA_FIRA_RACUN` - **Status (ovdje se upisuje SUCCESS/ERROR)**

---

## 🎯 Kako radi mapiranje

Google Apps Script automatski čita podatke iz vaših stupaca i šalje ih u FIRA:

### Glavni podaci → FIRA polja

| Vaš stupac | FIRA polje | Napomena |
|------------|------------|----------|
| `Name and surname (Ime i prezime)` | `billingAddress.name` | Obavezno ✅ |
| `E-adresa` | `billingAddress.email` | Obavezno ✅ |
| `Payment` | `lineItems[0].price` | Cijena registracije (obavezno ✅) |
| `City and Country (Mjesto i država)` | `billingAddress.city` + `country` | Parser odvaja grad i državu |
| `Phone number (Kontakt broj)` | `billingAddress.phone` | Opcionalno |
| `Vremenska oznaka` | `createdAt` | Automatski |

### Dodatni podaci → Interna bilješka

Sljedeći podaci se **ne šalju na račun**, ali se spremaju u internu bilješku u FIRA (vidljivo samo vama):

- `Gender (Spol)`
- `Year of birth (Godina rođenja)`
- `Occupation / profession / job (Zanimanje)`

---

## 📄 Što se stvara u FIRA?

Svaki put kad kliknete gumb, stvara se račun/ponuda sa:

**Stavka na računu:**
- **Naziv:** "Registracija za susret" (može se prilagoditi)
- **Opis:** "Registracija sudionika: [Ime i prezime]"
- **Cijena:** Vrijednost iz `Payment` stupca
- **Količina:** 1
- **Porezna stopa:** 25% (0.25) - može se prilagoditi

**Kupac (billing address):**
- **Ime:** Iz `Name and surname`
- **Email:** Iz `E-adresa`
- **Grad:** Iz `City and Country` (parser odvaja grad)
- **Država:** Iz `City and Country` (parser odvaja državu: Croatia → HR)
- **Telefon:** Iz `Phone number`

**Interna bilješka:**
```
Registracija iz Google Forms
Spol: M/Ž
Godina rođenja: XXXX
Zanimanje: ...
```

---

## 🛠️ Instalacija (Korak po korak)

### Korak 1: Otvorite Apps Script

1. Otvorite vaš Google Sheet: https://docs.google.com/spreadsheets/d/12H5vxFiSNxW7kyQm1Z0OVzC3Zsqi-eE9y4Ud_nBl1ds/
2. **Extensions → Apps Script**

### Korak 2: Dodajte prilagođeni kod

#### 2a. Zamijenite Code.gs

1. U Apps Script editoru, otvorite `Code.gs`
2. **Obrišite** sav postojeći kod
3. **Kopirajte** sav kod iz datoteke: [`Code-Custom-Mapping.gs`](./google-apps-script/Code-Custom-Mapping.gs)
4. **Zalijepite** u editor
5. **Save** (💾)

#### 2b. Zamijenite Config.gs

1. Otvorite `Config.gs` (ili kreirajte novu datoteku klikanjem na + → Script → ime: `Config`)
2. **Obrišite** sav postojeći kod
3. **Kopirajte** sav kod iz datoteke: [`Config-Custom.gs`](./google-apps-script/Config-Custom.gs)
4. **Zalijepite** u editor
5. **Save** (💾)

### Korak 3: Postavite API ključ

1. Zatvorite Apps Script tab
2. Vratite se na Google Sheet
3. **Osvježite** stranicu (F5)
4. Trebao bi se pojaviti izbornik **FIRA Actions**
5. Kliknite **FIRA Actions → Postavi API ključ**
6. Zalijepite svoj FIRA API ključ (preuzmite sa https://app.fira.finance/settings/integrations)
7. Kliknite **OK**

### Korak 4: Autorizirajte

1. Odaberite bilo koji redak s podacima
2. Kliknite **FIRA Actions → Napravi račun u FIRA**
3. Google traži autorizaciju:
   - **Review Permissions** → **Advanced** → **Go to FIRA Integration** → **Allow**

### Korak 5: Testirajte!

1. Odaberite redak s podacima
2. Kliknite **FIRA Actions → Napravi račun u FIRA**
3. Pričekajte poruku "Uspjeh!"
4. U stupcu `AKCIJA_FIRA_RACUN` trebalo bi pisati **SUCCESS** (zelena boja)
5. Provjerite račun na https://app.fira.finance

---

## ⚙️ Prilagodba postavki

### Promjena naziva usluge

Zadano: "Registracija za susret"

Za promjenu:
1. **Extensions → Apps Script**
2. **Project Settings** (⚙️)
3. **Script Properties → Add script property**
   - **Property:** `DEFAULT_SERVICE_NAME`
   - **Value:** `Vaš naziv usluge`
4. **Save**

### Promjena zadane cijene

Ako stupac `Payment` nije popunjen, koristi se zadana cijena.

Za postavljanje:
1. **Project Settings** (⚙️)
2. **Script Properties → Add script property**
   - **Property:** `DEFAULT_PRICE`
   - **Value:** `100` (primjer: 100 EUR)
3. **Save**

### Promjena vrste računa

Zadano: **PONUDA** (sigurno za testiranje)

Za stvaranje **RAČUNA**:
1. **Project Settings** (⚙️)
2. **Script Properties → Add script property**
   - **Property:** `DEFAULT_INVOICE_TYPE`
   - **Value:** `RAČUN`
3. **Save**

Opcije:
- `PONUDA` - Ponuda (zadano, najbolje za testiranje)
- `RAČUN` - Račun
- `FISKALNI_RAČUN` - Fiskalni račun (samo za Hrvatsku s fiskalnim postavkama)

### Promjena porezne stope

Zadano: **25%** (0.25)

Za promjenu (npr. na 13%):
1. **Project Settings** (⚙️)
2. **Script Properties → Add script property**
   - **Property:** `DEFAULT_TAX_RATE`
   - **Value:** `0.13`
3. **Save**

**VAŽNO:** Koristite decimalni format:
- 25% = `0.25`
- 13% = `0.13`
- 5% = `0.05`

---

## 🔧 Parsiranje grada i države

Kod automatski parsira stupac `City and Country` u sljedećem formatu:

**Format:** `Grad, Država`

**Primjeri:**
- `Zagreb, Croatia` → city: "Zagreb", country: "HR"
- `Vienna, Austria` → city: "Vienna", country: "AT"
- `Berlin, Germany` → city: "Berlin", country: "DE"

**Prepoznate države:**
- Croatia / Hrvatska → `HR`
- Germany / Njemačka → `DE`
- Austria → `AT`

Ako država nije prepoznata, koristi se zadana država (`HR`).

---

## ✅ Obavezna polja

Da bi kreiranje računa uspjelo, **moraju** biti popunjeni sljedeći stupci:

1. ✅ `Name and surname (Ime i prezime)` - mora biti popunjeno
2. ✅ `E-adresa` - mora biti popunjeno
3. ✅ `Payment` - mora biti broj veći od 0

Ako bilo koje od ovih polja nedostaje, dobit ćete grešku validacije.

---

## 📊 Status stupci

Nakon klika na gumb, skripta dodaje/ažurira:

1. **AKCIJA_FIRA_RACUN** - Status kreiranja
   - `SUCCESS` (zelena boja) - Račun uspješno kreiran
   - `GREŠKA: ...` (crvena boja) - Greška pri kreiranju + opis greške

2. **FIRA Timestamp** - Vrijeme kreiranja računa

---

## ❓ Česta pitanja

### Što ako Payment stupac nije popunjen?

Skripta će koristiti zadanu cijenu (ako ste je postavili u Script Properties).
Ako zadana cijena također nije postavljena, dobit ćete grešku validacije.

### Mogu li promijeniti naziv stavke na računu?

Da! Postavite `DEFAULT_SERVICE_NAME` u Script Properties.

### Što se događa s GDPR obavijesti?

GDPR obavijest (stupac "Notice to participants") se **ne šalje** u FIRA.
To je samo za evidenciju u Google Sheetu.

### Mogu li dodati više stavki na račun?

Trenutna verzija podržava samo jednu stavku (registracija).
Za više stavki, potrebno je prilagoditi kod u `Code-Custom-Mapping.gs`.

### Kako mogu testirati bez stvaranja pravih računa?

Koristite zadanu postavku `PONUDA` (offer). To je sigurno za testiranje.
Ponude se ne fiskaliziraju i možete ih testirati koliko god želite.

---

## 🐛 Rješavanje problema

### "Greška validacije: Potrebna je barem jedna stavka"

**Uzrok:** Payment stupac nije popunjen ili je 0

**Rješenje:**
- Provjerite da Payment stupac ima vrijednost > 0
- Ili postavite `DEFAULT_PRICE` u Script Properties

### "Greška validacije: Ime i prezime je obavezno"

**Uzrok:** Stupac "Name and surname (Ime i prezime)" nije popunjen

**Rješenje:** Provjerite da redak ima ime i prezime

### "Greška validacije: E-mail adresa je obavezna"

**Uzrok:** Stupac "E-adresa" nije popunjen

**Rješenje:** Provjerite da redak ima email adresu

### "Autentifikacija nije uspjela"

**Uzrok:** API ključ nije ispravan

**Rješenje:**
1. Idite na https://app.fira.finance/settings/integrations
2. Kopirajte novi API ključ
3. **FIRA Actions → Postavi API ključ**
4. Zalijepite novi ključ

---

## 📞 Podrška

Za pomoć:
- Pogledajte [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) za pregled projekta
- Otvorite issue na GitHub-u
- Kontaktirajte FIRA podršku za pitanja o FIRA API-ju

---

## ✨ Sretno s automatizacijom računa!

**Napomena:** Ovo je prilagođena verzija koda posebno za vaš Google Form sa stupcima za registraciju na susrete. Ako promijenite stupce u formi, trebat ćete ažurirati mapiranje u kodu.
