/**
 * Event Configuration: Vikend susret Šibenik 2026
 * Organizator: Katolička udruga "Prilika za Susret" Osijek
 * Lokacija: Katolička osnovna škola Šibenik, Velimira Škorpika 8
 * Datum: 6. – 7. lipnja 2026. (subota – nedjelja)
 * Rok za prijavu i uplatu: 1.6.2026.
 *
 * Cijene (per row — iznos ide u stupac UPLATA):
 *   Opcija 1 — 100 € (subota+nedjelja program, noćenje sub, 4 obroka)
 *   Opcija 2 —  70 € (bez noćenja, 3 obroka)
 *   Opcija 3 — 120 € (petak+subota noćenje, svi obroci, cjelovit program)
 *
 * Ova datoteka definira CONFIG objekt koji koristi Code-Custom-Mapping.gs.
 * Za novi event: kopiraj ovu datoteku, promijeni vrijednosti, i zamijeni
 * staru Config-Event-*.gs u Google Apps Script projektu.
 *
 * U GAS projektu smije biti SAMO JEDNA Config-Event-*.gs datoteka aktivna!
 */

var CONFIG = {
  // ── Event-specific ──────────────────────────────────────────────────────
  SERVICE_NAME: 'Kotizacija za Vikend susret Šibenik — Prilika Za Susret',
  DELIVERY_PLACE: 'Šibenik',
  CONFERENCE_DATE: '2026-06-06',   // ISO format YYYY-MM-DD (subota — prvi dan susreta)

  // ── Tip dokumenta ──────────────────────────────────────────────────────
  // 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
  // Per-row override moguć preko stupca "Tip dokumenta" ili 3-button promptа
  DEFAULT_INVOICE_TYPE: 'FISKALNI_RAČUN',

  // ── Valuta i plaćanje ──────────────────────────────────────────────────
  DEFAULT_CURRENCY: 'EUR',
  // 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA'
  DEFAULT_PAYMENT_TYPE: 'TRANSAKCIJSKI',

  // ── PDV ─────────────────────────────────────────────────────────────────
  // false = udruga nije u sustavu PDV-a
  VAT_ENABLED: false,
  DEFAULT_TAX_RATE: 0.25,

  // ── KPD šifra (obavezno za eRačune od 2026., inače prazno) ────────────
  DEFAULT_KPD_CODE: '',

  // ── Klauzule / Terms — vidljive na PDF-u računa ────────────────────────
  // FIRA bira jezik prema billingAddress.country:
  //   HR → termsHR | DE/AT → termsDE | ostalo → termsEN
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na vikend susretu.',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for the weekend gathering.',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für das Wochenendtreffen.',

  // ── Internal note (max 250 chars, NE vidi se na PDF-u) ─────────────────
  MAX_INTERNAL_NOTE_LENGTH: 250,

  // ── Defaults ────────────────────────────────────────────────────────────
  DEFAULT_COUNTRY: 'HR',

  // ── Gateway identifikacija ─────────────────────────────────────────────
  PAYMENT_GATEWAY_CODE: 'google-forms',
  PAYMENT_GATEWAY_NAME: 'Račun je plaćen TRANSAKCIJSKI. The invoice is already successfully paid.',

  // ── Stupci u Google Sheets ─────────────────────────────────────────────
  // Prilagodi nazive stupaca prema svom Google Forms sheetu
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'Uplata',
    NAME: 'Ime i prezime',
    GENDER: 'Spol',
    CITY_COUNTRY: 'Grad ili mjesto stanovanja',
    PHONE: 'Broj telefona (mobitela)',
    YEAR_OF_BIRTH: 'Godina rođenja',
    OCCUPATION: 'Zanimanje / struka / posao',
    OIB: 'OIB',
    PAYMENT_TYPE: 'Payment Type',
    INVOICE_TYPE: 'Tip dokumenta',
    ACTION: 'AKCIJA_FIRA_RACUN'
  }
};

// ============================================================================
// KRAJ KONFIGURACIJE — ispod ide Code-Custom-Mapping.gs (ako ljepite u 1 file)
// ============================================================================
