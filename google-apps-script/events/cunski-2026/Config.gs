/**
 * Event Configuration: Ljetni duhovni kamp Ćunski (Mali Lošinj) 2026
 * Organizator: Katolička udruga "Prilika za Susret" Osijek
 * Lokacija: Dom za duhovne susrete "Betanija", Ćunski, Mali Lošinj
 *
 * Termini:
 *   I: 12. – 18. srpnja 2026.
 *  II: 19. – 25. srpnja 2026.
 *
 * Dolazak: nedjelja u 18:00 · Odlazak: subota u 10:00
 * Rok prijave: do 1.7.2026.
 * Broj mjesta: max. 35 sudionika
 *
 * DOMAĆI EVENT — samo HR jezik
 *
 * Cijene (per row — iznos ide u stupac UPLATA):
 *   Akcija (do 15.5.):          350 € (jednokratno)
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
  // ── Event-specific ──────────────────────────────────────────────────────
  SERVICE_NAME: 'Kotizacija za ljetni duhovni kamp Ćunski — Prilika Za Susret',
  DELIVERY_PLACE: 'Ćunski, Mali Lošinj',
  CONFERENCE_DATE: '2026-07-12',   // ISO format YYYY-MM-DD (nedjelja — početak Termin I)

  // ── Tip dokumenta ──────────────────────────────────────────────────────
  // 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
  // Per-row override moguć preko stupca "Tip dokumenta" ili 3-button promptа
  DEFAULT_INVOICE_TYPE: 'FISKALNI_RAČUN',

  // ── Valuta i plaćanje ──────────────────────────────────────────────────
  DEFAULT_CURRENCY: 'EUR',
  // 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA'
  // Napomena: dio uplate moguć i u gotovini po dolasku — za te slučajeve
  // override stupac "Payment Type" u Sheetu na GOTOVINA
  DEFAULT_PAYMENT_TYPE: 'TRANSAKCIJSKI',

  // ── PDV ─────────────────────────────────────────────────────────────────
  // false = udruga nije u sustavu PDV-a
  VAT_ENABLED: false,
  DEFAULT_TAX_RATE: 0.25,

  // ── KPD šifra (obavezno za eRačune od 2026., inače prazno) ────────────
  DEFAULT_KPD_CODE: '',

  // ── Klauzule / Terms — vidljive na PDF-u računa ────────────────────────
  // Domaći event — HR terms je primarni, EN i DE kao fallback za eventualne strance
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na ljetnom duhovnom kampu Ćunski.',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for the Summer Spiritual Camp Ćunski.',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für das geistliche Sommercamp Ćunski.',

  // ── Internal note (max 250 chars, NE vidi se na PDF-u) ─────────────────
  MAX_INTERNAL_NOTE_LENGTH: 250,

  // ── Defaults ────────────────────────────────────────────────────────────
  DEFAULT_COUNTRY: 'HR',

  // ── Gateway identifikacija ─────────────────────────────────────────────
  PAYMENT_GATEWAY_CODE: 'google-forms',
  PAYMENT_GATEWAY_NAME: 'Račun je plaćen TRANSAKCIJSKI.',

  // ── Stupci u Google Sheets ─────────────────────────────────────────────
  // HR-only headeri — usklađeno s Google Form pitanjima za Ćunski.
  // VAŽNO: findColumnIndex koristi EXACT string match — pazi na razmake!
  // Ako naknadno preimenuješ pitanje u Formi, ovdje također promijeni.
  //
  // NAPOMENA: Ovi nazivi stupaca su placeholder — prilagodi ih TOČNIM
  // headerima iz Google Forms response sheeta kad forma bude kreirana.
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'Uplata (ostatak)',
    NAME: 'Ime i prezime',
    GENDER: 'Spol',
    CITY_COUNTRY: 'Grad i država',
    PHONE: 'Kontakt broj',
    YEAR_OF_BIRTH: 'Godina rođenja',
    OCCUPATION: 'Zanimanje',
    OIB: 'OIB',
    PAYMENT_TYPE: 'Payment Type',
    INVOICE_TYPE: 'Tip dokumenta',
    ACTION: 'AKCIJA_FIRA_RACUN',
    // ── Split payment (modules/SplitPayment.gs) ──────────────────────────
    // Akontacija 100 € + ostatak → 2 računa po retku
    // PAYMENT (gore) u split modu znači OSTATAK, a ne ukupan iznos
    ADVANCE_PAYMENT: 'Predujam (akontacija)',
    AKCIJA_AVANS: 'AKCIJA_AVANS_RACUN',
    AKCIJA_FINAL: 'AKCIJA_FINALNI_RACUN'
  }
};

// ============================================================================
// KRAJ KONFIGURACIJE — ispod ide modules/Mapping.gs (ako ljepite u 1 file)
// ============================================================================
