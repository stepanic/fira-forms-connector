/**
 * Event Configuration: Regionalni susret Sinj 2026
 * Organizator: Katolička udruga "Prilika za Susret" Osijek
 * Lokacija: Bazilika i svetište Čudotvorne Gospe Sinjske, Fratarski prolaz 4, Sinj
 * Datum: 19. rujna 2026. (subota), 9:30 – 19:00
 * Duhovni pratitelj: fra Antonio Mravak · Glavna gošća: Maja Jakšić
 *
 * Prijave: do 15.9.2026. (ograničen broj mjesta)
 *
 * Cijene (per row — iznos ide u stupac UPLATA):
 *   Rana kotizacija (do 1.9.2026.):        50 €  (povrat moguć do 1.9. i uz zamjensku prijavu)
 *   Redovna kotizacija (nakon 1.9.2026.):  55 €
 *   Na dan susreta, gotovinski (19.9.):    60 €  → stupac "Payment Type" postavi na GOTOVINA
 * Rok uplate na račun Udruge: 15.9.2026.
 * Opis uplate: KOTIZACIJA ZA REGIONALNI SUSRET SINJ (model HR99, poziv na broj prazan)
 *
 * Jednodnevni event — BEZ split paymenta (nema akontacije/predujma),
 * pa se modules/SplitPayment.gs ne uključuje u build.
 *
 * Ova datoteka definira CONFIG objekt koji koristi modules/Mapping.gs.
 * U GAS projektu smije biti SAMO JEDNA Config-Event-*.gs datoteka aktivna!
 */

var CONFIG = {
  // ── Event-specific ──────────────────────────────────────────────────────
  SERVICE_NAME: 'Kotizacija za Regionalni susret Sinj — Prilika Za Susret',
  DELIVERY_PLACE: 'Sinj',
  CONFERENCE_DATE: '2026-09-19',   // ISO format YYYY-MM-DD (subota)

  // ── Tip dokumenta ──────────────────────────────────────────────────────
  // 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
  // Per-row override moguć preko stupca "Tip dokumenta" ili 3-button prompta
  DEFAULT_INVOICE_TYPE: 'FISKALNI_RAČUN',

  // ── Valuta i plaćanje ──────────────────────────────────────────────────
  DEFAULT_CURRENCY: 'EUR',
  // 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA'
  // Napomena: uplata na dan susreta je gotovinska (60 €) — za te retke
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
  // Multilingual jer se očekuju i sudionici iz dijaspore.
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
  // EXACT headeri iz response sheeta "Regionalni susret, Sinj 19.9.2026. (Odgovori)"
  // VAŽNO: findColumnIndex koristi EXACT string match — pazi na razmake!
  //
  // Headeri s trailing spaceom (artefakt iz Google Forms):
  //   - 'Grad ili mjesto stanovanja ' — trailing space
  //   - 'Godina rođenja ' — trailing space
  //
  // Stupci UPLATA, OIB, Payment Type, Tip dokumenta i AKCIJA_FIRA_RACUN ne
  // dolaze iz forme: OIB/Payment Type/Tip dokumenta/AKCIJA dodaje
  // "FIRA Actions → 📋 Dodaj stupce za fiskalizaciju", a stupac "Uplata"
  // organizator dodaje ručno i upisuje iznos po retku.
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'Uplata',
    NAME: 'Ime i prezime',
    GENDER: 'Spol',
    CITY_COUNTRY: 'Grad ili mjesto stanovanja ',   // ⚠️ trailing space!
    PHONE: 'Broj telefona (mobitela)',
    YEAR_OF_BIRTH: 'Godina rođenja ',              // ⚠️ trailing space!
    OCCUPATION: 'Zanimanje / struka / posao',
    OIB: 'OIB',
    PAYMENT_TYPE: 'Payment Type',
    INVOICE_TYPE: 'Tip dokumenta',
    ACTION: 'AKCIJA_FIRA_RACUN'
  }
};

// ============================================================================
// KRAJ KONFIGURACIJE — ispod ide modules/Mapping.gs (ako ljepite u 1 file)
// ============================================================================
