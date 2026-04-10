/**
 * Event Configuration: Regionalni susret Osijek 2026
 * Organizator: Prilika Za Susret
 *
 * Ova datoteka definira CONFIG objekt koji koristi Code-Custom-Mapping.gs.
 * Za novi event: kopiraj ovu datoteku, promijeni vrijednosti, i zamijeni
 * staru Config-Event-*.gs u Google Apps Script projektu.
 *
 * U GAS projektu smije biti SAMO JEDNA Config-Event-*.gs datoteka aktivna!
 */

var CONFIG = {
  // ── Event-specific ──────────────────────────────────────────────────────
  SERVICE_NAME: 'Kotizacija za Regionalni susret Osijek — Prilika Za Susret',
  DELIVERY_PLACE: 'Osijek',
  CONFERENCE_DATE: '2026-03-14',   // ISO format YYYY-MM-DD

  // ── Tip dokumenta ──────────────────────────────────────────────────────
  // 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
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
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na regionalnom susretu.',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for regional conference.',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für die regional Konferenz.',

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
    ACTION: 'AKCIJA_FIRA_RACUN'
  }
};
