/**
 * Event Configuration: Ljetni duhovni kamp Ćunski / Krk 2026
 * Organizator: Katolička udruga "Prilika za Susret" Osijek
 *
 * Kroz ISTU Google formu prijavljuje se na jedan od TRI termina:
 *   Termin I   — Ćunski (Mali Lošinj) / Betanija   · 12. – 18. 7. 2026.
 *   Termin II  — Ćunski (Mali Lošinj) / Betanija   · 19. – 25. 7. 2026.
 *   Termin III — Krk / Oaza Kraljice Mira          ·  2. –  8. 8. 2026.
 *
 * Stupac u Sheetu: "Prijavljujem se na termin"
 * Sadrži EXACT vrijednosti iz Google Forms intro teksta (s 2 spacea između
 * "Termin I"/"Termin II" i "Ćunski"). Mapa TERMIN_OVERRIDES (dolje) preslikava
 * te vrijednosti u serviceName / deliveryPlace / conferenceDate koje se onda
 * primjenjuju per-row preko shared helpera resolveTerminOverride_() u
 * modules/Mapping.gs (no-op za eventove bez TERMIN_OVERRIDES).
 *
 * Dolazak: nedjelja u 18:00 · Odlazak: subota u 10:00
 * Rok prijave: do 1.7.2026.
 * Broj mjesta: max. 35 sudionika
 *
 * DOMAĆI EVENT (HR forma) — ali multilingual jer sudionici dolaze i iz
 * inozemstva. FIRA bira jezik PDF-a po billingAddress.country
 * (parsira se iz stupca "Grad ili mjesto stanovanja").
 *
 * Cijene (per row — iznos ide u stupac UPLATA):
 *   Akcija (do 15.5.):          350 € (jednokratno na račun)
 *   Early Bird (do 1.6.):       420 € (6 dana × 70 €)
 *   Regular (do 1.7.):          450 € (6 dana × 75 €)
 *   Last Minute (nakon 1.7.):   480 € (6 dana × 80 €)
 *   Akontacija / predujam:      100 € (do 15 dana nakon prijave)
 *
 * Split payment: akontacija 100 € + ostatak (gotovina ili uplata)
 *
 * Ova datoteka definira CONFIG objekt koji koristi modules/Mapping.gs.
 * U GAS projektu smije biti SAMO JEDNA Config-Event-*.gs datoteka aktivna!
 */

var CONFIG = {
  // ── Event-specific (DEFAULT vrijednosti — per-row override preko TERMIN_OVERRIDES) ──
  // Ovi default-i se koriste samo ako stupac "Prijavljujem se na termin" prazan
  // ili nema match-a u TERMIN_OVERRIDES.
  SERVICE_NAME: 'Kotizacija za ljetni duhovni kamp Ćunski / Krk — Prilika Za Susret',
  DELIVERY_PLACE: 'Ćunski, Mali Lošinj',
  CONFERENCE_DATE: '2026-07-12',   // ISO YYYY-MM-DD (nedjelja — početak Termin I, najraniji)

  // ── Tip dokumenta ──────────────────────────────────────────────────────
  // 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
  // Per-row override moguć preko stupca "Tip dokumenta" ili 3-button promptа
  DEFAULT_INVOICE_TYPE: 'FISKALNI_RAČUN',

  // ── Valuta i plaćanje ──────────────────────────────────────────────────
  DEFAULT_CURRENCY: 'EUR',
  // 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA'
  // Napomena: ostatak je moguć u gotovini po dolasku — za te slučajeve
  // override stupac "Payment Type" u Sheetu na GOTOVINA
  DEFAULT_PAYMENT_TYPE: 'TRANSAKCIJSKI',

  // ── PDV ─────────────────────────────────────────────────────────────────
  // false = udruga nije u sustavu PDV-a
  VAT_ENABLED: false,
  DEFAULT_TAX_RATE: 0.25,

  // ── KPD šifra (obavezno za eRačune od 2026., inače prazno) ────────────
  DEFAULT_KPD_CODE: '',

  // ── Klauzule / Terms — vidljive na PDF-u računa ────────────────────────
  // FIRA bira jezik prema billingAddress.country (parsira se iz stupca
  // "Grad ili mjesto stanovanja"):
  //   HR → termsHR | DE/AT → termsDE | ostalo → termsEN
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na ljetnom duhovnom kampu (Ćunski / Krk).',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for the Summer Spiritual Camp (Ćunski / Krk).',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für das geistliche Sommercamp (Ćunski / Krk).',

  // ── Internal note (max 250 chars, NE vidi se na PDF-u) ─────────────────
  MAX_INTERNAL_NOTE_LENGTH: 250,

  // ── Defaults ────────────────────────────────────────────────────────────
  DEFAULT_COUNTRY: 'HR',

  // ── Gateway identifikacija ─────────────────────────────────────────────
  PAYMENT_GATEWAY_CODE: 'google-forms',
  PAYMENT_GATEWAY_NAME: 'Račun je plaćen TRANSAKCIJSKI.',

  // ── Stupci u Google Sheets ─────────────────────────────────────────────
  // EXACT headeri iz Google Forms response sheeta za Ćunski / Krk 2026.
  // VAŽNO: findColumnIndex koristi EXACT string match — pazi na razmake!
  //
  // Headeri s trailing spaceom (artefakt iz Google Forms):
  //   - 'Grad ili mjesto stanovanja ' — trailing space
  //   - 'Godina rođenja ' — trailing space
  //
  // Stupac "Grad ili mjesto stanovanja" se koristi za parseCityAndCountry()
  // koja podržava formate: "Zagreb", "Wien, Austria", "München, Deutschland"
  // → automatski detektira country za multilingual PDF (HR/EN/DE).
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'Uplata - ostatak',
    NAME: 'Ime i prezime',
    GENDER: 'Spol',
    CITY_COUNTRY: 'Grad ili mjesto stanovanja ',    // ⚠️ trailing space!
    PHONE: 'Broj telefona (mobitela)',
    YEAR_OF_BIRTH: 'Godina rođenja ',               // ⚠️ trailing space!
    OCCUPATION: 'Zanimanje / struka / posao',
    OIB: 'OIB',
    PAYMENT_TYPE: 'Payment Type',
    INVOICE_TYPE: 'Tip dokumenta',
    TERMIN: 'Prijavljujem se na termin',
    ACTION: 'AKCIJA_FIRA_RACUN',
    // ── Split payment (modules/SplitPayment.gs) ──────────────────────────
    // Akontacija 100 € + ostatak → 2 računa po retku
    // PAYMENT (gore) u split modu znači OSTATAK, a ne ukupan iznos
    ADVANCE_PAYMENT: 'Predujam',
    AKCIJA_AVANS: 'AKCIJA_AVANS_RACUN',
    AKCIJA_FINAL: 'AKCIJA_FINALNI_RACUN'
  },

  // ── Per-row TERMIN override ─────────────────────────────────────────────
  // Ključ = EXACT vrijednost iz stupca "Prijavljujem se na termin"
  // (kako je Google Forms vraća — pazi: "Termin I" / "Termin II" imaju 2 spacea
  // prije "Ćunski" jer je tako u intro tekstu forme).
  //
  // Vrijednost = override za:
  //   serviceName     → CONFIG.SERVICE_NAME (line item name na PDF-u)
  //   deliveryPlace   → CONFIG.DELIVERY_PLACE (shippingAddress.city na PDF-u)
  //   conferenceDate  → CONFIG.CONFERENCE_DATE (ISO YYYY-MM-DD)
  //
  // Helper resolveTerminOverride_() u modules/Mapping.gs:
  //   - prvo pokušava EXACT match po raw vrijednosti
  //   - fallback: trim + collapse whitespace pa match po normaliziranom ključu
  //     (tolerira slučajne single-space varijante kad Forms tekst evoluira)
  //   - ako nema matcha → koristi CONFIG defaults (gore)
  TERMIN_OVERRIDES: {
    'Termin I  Ćunski / Lošinj 12.-18.7.2026.': {
      serviceName: 'Kotizacija za ljetni duhovni kamp Ćunski — Termin I (12.–18.7.2026.) — Prilika Za Susret',
      deliveryPlace: 'Ćunski, Mali Lošinj (Betanija)',
      conferenceDate: '2026-07-12'
    },
    'Termin II  Ćunski / Lošinj 19.-25.7.2026.': {
      serviceName: 'Kotizacija za ljetni duhovni kamp Ćunski — Termin II (19.–25.7.2026.) — Prilika Za Susret',
      deliveryPlace: 'Ćunski, Mali Lošinj (Betanija)',
      conferenceDate: '2026-07-19'
    },
    'Ljetni kamp Krk - Oaza Kraljice Mira 2.-8.8.2026.': {
      serviceName: 'Kotizacija za ljetni duhovni kamp Krk — Oaza Kraljice Mira (2.–8.8.2026.) — Prilika Za Susret',
      deliveryPlace: 'Lakmartin, Krk (Oaza Kraljice Mira)',
      conferenceDate: '2026-08-02'
    }
  }
};

// ============================================================================
// KRAJ KONFIGURACIJE — ispod ide modules/Mapping.gs (ako ljepite u 1 file)
// ============================================================================
