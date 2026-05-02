/**
 * Event Configuration: International Summer Camp Badija (Korčula) 2026
 * Organizatori: Katolička udruga "Prilika za Susret" Osijek & katSus.org
 * Lokacija: Franjevački samostan Uznesenja Marijina, Badija (Korčula)
 * Datum: 12. – 17. kolovoza 2026.
 * Početak: srijeda 12.8. u 19:00 · Završetak: ponedjeljak 17.8. u 15:00
 * Rok prijave: do 1.8.2026.
 *
 * MEĐUNARODNI EVENT — službeni jezici: HR / EN
 * FIRA automatski bira jezik PDF-a po billingAddress.country:
 *   HR → termsHR · AT/DE → termsDE · sve ostalo → termsEN
 *
 * Cijene (per row — iznos ide u stupac UPLATA):
 *   Super Early Bird (do 31.5.): 550 € (5 dana × 110 €)
 *   Regular (do 25.7.):          600 € (5 dana × 120 €)
 *   Last Minute (nakon 25.7.):   650 € (5 dana × 130 €)
 *   Deposit / akontacija:        110 € (rezervacija smještaja)
 *
 * Ova datoteka definira CONFIG objekt koji koristi Code-Custom-Mapping.gs.
 * U GAS projektu smije biti SAMO JEDNA Config-Event-*.gs datoteka aktivna!
 */

var CONFIG = {
  // ── Event-specific ──────────────────────────────────────────────────────
  // Bilingual SERVICE_NAME — pojavljuje se kao naziv stavke na PDF-u
  // (FIRA ne prevodi naziv, pa ga držimo dvojezično za međunarodne sudionike)
  SERVICE_NAME: 'Fee for Summer Camp Badija / Kotizacija za ljetni kamp Badija — Prilika Za Susret',
  DELIVERY_PLACE: 'Badija, Korčula',
  CONFERENCE_DATE: '2026-08-12',   // ISO format YYYY-MM-DD (srijeda — početak)

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
  // FIRA bira jezik prema billingAddress.country (parsira se iz stupca
  // "Grad ili mjesto stanovanja"):
  //   HR → termsHR | DE/AT → termsDE | ostalo → termsEN
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na međunarodnom ljetnom kampu Badija.',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for the International Summer Camp Badija.',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für das internationale Sommercamp Badija.',

  // ── Internal note (max 250 chars, NE vidi se na PDF-u) ─────────────────
  MAX_INTERNAL_NOTE_LENGTH: 250,

  // ── Defaults ────────────────────────────────────────────────────────────
  DEFAULT_COUNTRY: 'HR',

  // ── Gateway identifikacija ─────────────────────────────────────────────
  PAYMENT_GATEWAY_CODE: 'google-forms',
  PAYMENT_GATEWAY_NAME: 'Račun je plaćen TRANSAKCIJSKI. The invoice is already successfully paid.',

  // ── Stupci u Google Sheets ─────────────────────────────────────────────
  // Bilingual headeri (EN / HR) — međunarodni Google Form ima oba jezika.
  // Provjeri da se EXACT match s headerima u tvom Sheetu (case + razmaci).
  // Ako tvoj Form koristi drugačije nazive, prilagodi vrijednosti ovdje.
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'Payment',
    NAME: 'Name and surname (Ime i prezime)',
    GENDER: 'Gender (Spol)',
    CITY_COUNTRY: 'City and Country (Mjesto i država)',
    PHONE: 'Phone number (Kontakt broj)',
    YEAR_OF_BIRTH: 'Year of birth (Godina rođenja)',
    OCCUPATION: 'Occupation / profession / job (Zanimanje/profesija/posao)',
    OIB: 'OIB',
    PAYMENT_TYPE: 'Payment Type',
    INVOICE_TYPE: 'Tip dokumenta',
    ACTION: 'AKCIJA_FIRA_RACUN'
  }
};

// ============================================================================
// KRAJ KONFIGURACIJE — ispod ide Code-Custom-Mapping.gs (ako ljepite u 1 file)
// ============================================================================
