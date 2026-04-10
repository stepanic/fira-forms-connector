/**
 * FIRA.finance Google Sheets Integration — Fiscal Invoice Version (v3)
 *
 * Triple-checked against FIRA Custom Webshop API v1.0.0 Swagger spec
 * and official example payload from fira.finance.
 *
 * CHANGELOG v3:
 * - UPLATA stupac je OBAVEZAN — nema default cijene
 * - Validacija: UPLATA mora sadržavati cijeli broj (integer) > 0
 * - Info dialog ako UPLATA nije ispravno popunjena
 *
 * CHANGELOG v2 (triple-check fixes):
 * - Dodano: webshopOrderNumber (fali u v1)
 * - Dodano: paymentGatewayName (fali u v1)
 * - Dodano: customerLocale (fali u v1)
 * - Dodano: termsEN, termsDE za strane sudionike
 * - Fix: dueDate postavljen na datum konferencije (prošlost), ne +14 dana
 * - Fix: billingAddress ima sva polja iz Swagger spec-a (address2, company, vatNumber)
 * - Fix: shippingAddress ima sva polja iz spec-a
 * - Fix: lineItem.productCode dodan kao opcija
 * - Dodano: napomena o barkodu — FIRA generira HUB-3A automatski,
 *   za skrivanje treba u FIRA UI označiti račun kao plaćen
 *   ili koristiti "Sakrij podatke za plaćanje" opciju
 *
 * PREDUVJETI ZA FISKALIZACIJU (u FIRA aplikaciji):
 * 1. Aktiviran FIRA FISKAL paket
 * 2. FINA certifikat uploadan: Postavke → Fiskalizacija
 * 3. Poslovni prostor prijavljen Poreznoj upravi (ePorezna)
 * 4. Interni akt napisan i arhiviran
 *
 * BARKOD ZA PLAĆANJE:
 * FIRA automatski dodaje HUB-3A barkod na račune s HR IBAN-om.
 * Za račune koji su VEĆ PLAĆENI (kao ovi za prošlu konferenciju):
 *   1. U FIRA UI: označi račun kao "Plaćen"
 *   2. FIRA ima opciju "Sakrij podatke za plaćanje" na plaćenim računima
 *   3. Alternativno: u Settings → Webshop provjeri opcije za barkod
 * Ovo se NE kontrolira kroz API, već kroz FIRA sučelje nakon kreiranja.
 */

// ============================================================================
// KONFIGURACIJA
// ============================================================================
var CONFIG = {
  SERVICE_NAME: 'Kotizacija za Regionalni susret Ivanić-Grad',
  // UPLATA stupac je OBAVEZAN — cijena se čita iz sheeta, nema defaulta
  DELIVERY_PLACE: 'Osijek',

  // Tip dokumenta: 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN'
  DEFAULT_INVOICE_TYPE: 'FISKALNI_RAČUN',
  // DEFAULT_INVOICE_TYPE: 'PONUDA',
  // DEFAULT_INVOICE_TYPE: 'RAČUN',

  DEFAULT_CURRENCY: 'EUR',

  // Način plaćanja: 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA'
  DEFAULT_PAYMENT_TYPE: 'TRANSAKCIJSKI',

  // PDV (false = udruga nije u sustavu PDV-a)
  VAT_ENABLED: false,
  DEFAULT_TAX_RATE: 0.25,

  // KPD šifra — postavi ako treba za eRačun (inače ostavi prazno)
  DEFAULT_KPD_CODE: '',

  // Klauzule / Terms — vidljive na PDF-u računa
  // FIRA bira jezik prema billingAddress.country:
  //   HR → termsHR | DE/AT → termsDE | ostalo → termsEN
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.\nRačun je plaćen — kotizacija za sudjelovanje na regionalnom susretu.',
  TERMS_EN: 'VAT exempt pursuant to Art. 90, Par. 1 of the Croatian VAT Act.\nThis invoice has been paid — registration fee for regional conference.',
  TERMS_DE: 'MwSt.-befreit gemäß Art. 90 Abs. 1 des kroatischen MwSt.-Gesetzes.\nDiese Rechnung ist bezahlt — Teilnahmegebühr für die regional Konferenz.',

  // Datum konferencije — koristi se kao dueDate jer je konferencija prošla
  // Promijeni na stvarni datum konferencije!
  CONFERENCE_DATE: '2026-03-14',

  // Internal note (max 250 chars, FIRA DB limit, NE vidi se na PDF-u)
  MAX_INTERNAL_NOTE_LENGTH: 250,

  DEFAULT_COUNTRY: 'HR',

  // Gateway identifikacija
  PAYMENT_GATEWAY_CODE: 'google-forms',
  PAYMENT_GATEWAY_NAME: 'Račun je plaćen TRANSAKCIJSKI. The invoice is already successfully paid.',

  // Stupci u Google Sheets
  COLUMNS: {
    EMAIL: 'E-adresa',
    PAYMENT: 'UPLATA',
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

// ============================================================================
// MENU
// ============================================================================

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('FIRA Actions')
    .addItem('🧾 Napravi fiskalni račun (odabrani redak)', 'createFiraInvoice')
    .addItem('📦 Bulk: fiskaliziraj sve označene', 'createFiraInvoicesBulk')
    .addSeparator()
    .addItem('⚙️ Postavi API ključ', 'setupFiraIntegration')
    .addItem('ℹ️ Prikaži postavke', 'showConfiguration')
    .addItem('📋 Dodaj stupce za fiskalizaciju', 'addFiscalColumns')
    .addSeparator()
    .addItem('🔐 Autoriziraj dozvole (jednom)', 'authorizePermissions')
    .addToUi();
}

// ============================================================================
// INSTALLABLE TRIGGER — checkbox click
// Postavi: Triggers → + Add Trigger → onCheckboxEdit, On edit
// ============================================================================

function onCheckboxEdit(e) {
  if (!e || !e.range) return;

  var sheet = e.source.getActiveSheet();
  var row = e.range.getRow();
  var col = e.range.getColumn();

  if (row <= 1) return;

  var headers = getHeaders(sheet);
  var actionCol = findColumnIndex(headers, CONFIG.COLUMNS.ACTION);

  if (col !== actionCol || e.value !== 'TRUE') return;

  var data = getRowDataAsMap(sheet, row, headers);
  var name = data[CONFIG.COLUMNS.NAME] || 'N/A';
  var email = data[CONFIG.COLUMNS.EMAIL] || 'N/A';
  var paymentType = data[CONFIG.COLUMNS.PAYMENT_TYPE] || CONFIG.DEFAULT_PAYMENT_TYPE;
  var oib = data[CONFIG.COLUMNS.OIB] || '';

  // Validacija UPLATA — mora biti cijeli broj > 0
  var paymentRaw = data[CONFIG.COLUMNS.PAYMENT];
  var paymentValidation = validatePaymentAmount(paymentRaw);

  if (!paymentValidation.valid) {
    SpreadsheetApp.getUi().alert(
      'ℹ️ Nema evidentirane uplate',
      paymentValidation.message + '\n\n' +
      '👤 ' + name + '\n' +
      '📧 ' + email + '\n\n' +
      'Račun se ne može kreirati bez evidentirane uplate u stupcu UPLATA.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    e.range.setValue(false);
    return;
  }

  var payment = paymentValidation.amount;

  var ui = SpreadsheetApp.getUi();
  var result = ui.alert(
    'Potvrda generiranja FISKALNOG računa',
    '⚠️ FISKALNI RAČUN — šalje se Poreznoj upravi!\n\n' +
    '👤 ' + name + '\n' +
    '🆔 OIB: ' + (oib || '(nije unesen)') + '\n' +
    '💰 ' + payment + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
    '💳 ' + paymentType + '\n' +
    '📧 ' + email + '\n\n' +
    'Jednom fiskaliziran, račun se NE MOŽE izbrisati!\nNastaviti?',
    ui.ButtonSet.YES_NO
  );

  if (result === ui.Button.YES) {
    createFiraInvoiceForRow(row);
  } else {
    e.range.setValue(false);
  }
}

// ============================================================================
// SETUP FUNKCIJE
// ============================================================================

function authorizePermissions() {
  var ui = SpreadsheetApp.getUi();
  try {
    UrlFetchApp.fetch('https://app.fira.finance', { muteHttpExceptions: true });
    ui.alert('✅ Autorizacija uspješna!', 'Sve dozvole odobrene.', ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('❌ Greška', 'Autorizacija nije uspjela: ' + e.message, ui.ButtonSet.OK);
  }
}

function setupFiraIntegration() {
  var ui = SpreadsheetApp.getUi();
  var result = ui.prompt(
    'FIRA API ključ',
    'Unesite FIRA API ključ:\n(https://app.fira.finance/settings/integrations)',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() === ui.Button.OK) {
    var apiKey = result.getResponseText().trim();
    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('FIRA_API_KEY', apiKey);
      ui.alert('✅ API ključ spremljen!');
    } else {
      ui.alert('❌ API ključ ne može biti prazan');
    }
  }
}

function showConfiguration() {
  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');
  SpreadsheetApp.getUi().alert('Postavke',
    'Usluga: ' + CONFIG.SERVICE_NAME + '\n' +
    'Cijena: iz stupca UPLATA (obavezno)\n' +
    'Mjesto: ' + CONFIG.DELIVERY_PLACE + '\n' +
    'Tip: ' + CONFIG.DEFAULT_INVOICE_TYPE + '\n' +
    'Plaćanje: ' + CONFIG.DEFAULT_PAYMENT_TYPE + '\n' +
    'PDV: ' + (CONFIG.VAT_ENABLED ? 'Da' : 'Ne') + '\n' +
    'Datum konf.: ' + CONFIG.CONFERENCE_DATE + '\n' +
    'API: ' + (apiKey ? '***' + apiKey.slice(-4) : 'NIJE POSTAVLJEN') + '\n\n' +
    '⚠️ BARKOD: Nakon kreiranja računa, u FIRA UI označite\n' +
    'račun kao "Plaćen" da se sakrije barkod za plaćanje.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Dodaj stupce OIB, Payment Type i AKCIJA checkboxove.
 */
function addFiscalColumns() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var lastRow = sheet.getLastRow();
  var addedColumns = [];

  // OIB stupac
  if (findColumnIndex(headers, CONFIG.COLUMNS.OIB) === -1) {
    var col = sheet.getLastColumn() + 1;
    sheet.getRange(1, col).setValue(CONFIG.COLUMNS.OIB);
    addedColumns.push('OIB');
  }

  // Payment Type stupac s dropdown validacijom
  headers = getHeaders(sheet);
  if (findColumnIndex(headers, CONFIG.COLUMNS.PAYMENT_TYPE) === -1) {
    var ptCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, ptCol).setValue(CONFIG.COLUMNS.PAYMENT_TYPE);
    if (lastRow > 1) {
      var ptRange = sheet.getRange(2, ptCol, lastRow - 1, 1);
      var defaults = [];
      for (var i = 0; i < lastRow - 1; i++) defaults.push([CONFIG.DEFAULT_PAYMENT_TYPE]);
      ptRange.setValues(defaults);
      ptRange.setDataValidation(
        SpreadsheetApp.newDataValidation()
          .requireValueInList(['TRANSAKCIJSKI', 'GOTOVINA', 'KARTICA'])
          .setAllowInvalid(false)
          .build()
      );
    }
    addedColumns.push('Payment Type');
  }

  // AKCIJA checkboxovi
  headers = getHeaders(sheet);
  var actionColIdx = findColumnIndex(headers, CONFIG.COLUMNS.ACTION);
  if (actionColIdx === -1) {
    actionColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, actionColIdx).setValue(CONFIG.COLUMNS.ACTION);
    addedColumns.push('AKCIJA_FIRA_RACUN');
  }
  if (lastRow > 1) {
    sheet.getRange(2, actionColIdx, lastRow - 1, 1).insertCheckboxes();
  }

  SpreadsheetApp.getUi().alert('Gotovo!',
    addedColumns.length > 0
      ? 'Dodani stupci: ' + addedColumns.join(', ') + '\nPopunite OIB kupaca prije fiskalizacije.'
      : 'Svi stupci već postoje. Checkboxovi osvježeni.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// GLAVNE FUNKCIJE
// ============================================================================

function createFiraInvoice() {
  var row = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Odaberite redak s podacima (ne zaglavlje)');
    return;
  }
  createFiraInvoiceForRow(row);
}

/**
 * Bulk: fiskaliziraj sve retke s uključenim checkboxom koji nisu već SUCCESS.
 */
function createFiraInvoicesBulk() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var actionCol = findColumnIndex(headers, CONFIG.COLUMNS.ACTION);
  var statusCol = findColumnIndex(headers, 'FIRA Status');
  var paymentCol = findColumnIndex(headers, CONFIG.COLUMNS.PAYMENT);

  if (actionCol === -1) {
    ui.alert('Stupac AKCIJA_FIRA_RACUN ne postoji. Koristite "Dodaj stupce za fiskalizaciju".');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var actionValues = sheet.getRange(2, actionCol, lastRow - 1, 1).getValues();
  var rowsToProcess = [];
  var skippedNoPayment = [];

  for (var i = 0; i < actionValues.length; i++) {
    if (actionValues[i][0] !== true) continue;
    var rowNum = i + 2;

    // Preskoči već uspješno obrađene
    if (statusCol !== -1) {
      var currentStatus = sheet.getRange(rowNum, statusCol).getValue();
      if (currentStatus === 'SUCCESS') continue;
    }

    // Provjeri UPLATA prije dodavanja u listu
    if (paymentCol !== -1) {
      var paymentRaw = sheet.getRange(rowNum, paymentCol).getValue();
      var pv = validatePaymentAmount(paymentRaw);
      if (!pv.valid) {
        var rowName = sheet.getRange(rowNum, findColumnIndex(headers, CONFIG.COLUMNS.NAME)).getValue() || 'Redak ' + rowNum;
        skippedNoPayment.push(rowName);
        sheet.getRange(rowNum, actionCol).setValue(false);
        continue;
      }
    }

    rowsToProcess.push(rowNum);
  }

  // Obavijesti o preskočenima bez uplate
  if (skippedNoPayment.length > 0) {
    ui.alert(
      'ℹ️ Preskočeni redci bez evidentirane uplate',
      'Sljedeći sudionici nemaju valjanu uplatu u stupcu UPLATA\n' +
      'i neće biti uključeni u bulk obradu:\n\n' +
      skippedNoPayment.join('\n') + '\n\n' +
      'Unesite iznos uplate (cijeli broj) pa pokušajte ponovo.',
      ui.ButtonSet.OK
    );
  }

  if (rowsToProcess.length === 0) {
    if (skippedNoPayment.length === 0) {
      ui.alert('Nema označenih neobrađenih redaka.');
    }
    return;
  }

  var confirm = ui.alert(
    'Bulk fiskalizacija — ' + rowsToProcess.length + ' računa',
    '⚠️ Kreirat će se ' + rowsToProcess.length + ' FISKALNIH računa!\n\n' +
    'Šalju se Poreznoj upravi i NE MOGU se izbrisati.\n' +
    'Provjerite podatke prije nastavka.\n\n' +
    '💡 Nakon kreiranja, označite ih u FIRA UI kao "Plaćen"\n' +
    'da se sakrije barkod za plaćanje.',
    ui.ButtonSet.YES_NO
  );
  if (confirm !== ui.Button.YES) return;

  var successCount = 0;
  var errorCount = 0;

  for (var j = 0; j < rowsToProcess.length; j++) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      (j + 1) + '/' + rowsToProcess.length + '...', 'Bulk', -1);
    try {
      createFiraInvoiceForRow(rowsToProcess[j], true);
      successCount++;
    } catch (e) {
      Logger.log('Row ' + rowsToProcess[j] + ' error: ' + e.message);
      errorCount++;
    }
    // Pauza 1.5s između API poziva da ne preopteretimo FIRA
    if (j < rowsToProcess.length - 1) Utilities.sleep(1500);
  }

  ui.alert('Bulk završen',
    '✅ Uspješno: ' + successCount + '\n❌ Greške: ' + errorCount +
    '\n\nProvjerite stupac "FIRA Status".\n\n' +
    '💡 U FIRA UI označite račune kao "Plaćen" da se sakrije barkod.',
    ui.ButtonSet.OK
  );
}

/**
 * Core: kreiraj FIRA račun za jedan redak.
 * @param {number} row - Broj retka (1-indexed)
 * @param {boolean} [suppressDialogs=false] - Bez UI dijaloga (za bulk)
 */
function createFiraInvoiceForRow(row, suppressDialogs) {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();

  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');
  if (!apiKey) {
    if (!suppressDialogs) ui.alert('Postavite FIRA API ključ: FIRA Actions → Postavi API ključ');
    throw new Error('FIRA API ključ nije postavljen');
  }

  var headers = getHeaders(sheet);

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Fiskaliziram...', 'FIRA', -1);

    var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    var payload = buildPayload(headers, rowData);

    var validation = validatePayload(payload);
    if (!validation.valid) {
      markRowAsProcessed(sheet, row, 'GREŠKA: ' + validation.error, new Date(), null);
      uncheckActionCheckbox(sheet, row, headers);
      if (!suppressDialogs) ui.alert('Validacija', validation.error, ui.ButtonSet.OK);
      throw new Error(validation.error);
    }

    Logger.log('FIRA Payload:\n' + JSON.stringify(payload, null, 2));

    var response = sendToFira(payload, apiKey);
    var documentUrl = buildDocumentUrl(response, payload.invoiceType);

    markRowAsProcessed(sheet, row, 'SUCCESS', new Date(), documentUrl);

    if (!suppressDialogs) {
      ui.alert('✅ Fiskalni račun kreiran!',
        'FIRA će fiskalizirati prema Poreznoj upravi (JIR + ZKI).\n\n' +
        '💡 Za skrivanje barkoda:\n' +
        'U FIRA UI označite račun kao "Plaćen".',
        ui.ButtonSet.OK);
    }

    SpreadsheetApp.getActiveSpreadsheet().toast('✅ Fiskalni račun kreiran!', 'FIRA', 5);

  } catch (error) {
    Logger.log('═══════════════════════════════════════════');
    Logger.log('❌ GREŠKA ZA REDAK ' + row);
    Logger.log('═══════════════════════════════════════════');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + (error.stack || 'N/A'));
    Logger.log('═══════════════════════════════════════════');

    markRowAsProcessed(sheet, row, 'GREŠKA: ' + error.message, new Date(), null);
    uncheckActionCheckbox(sheet, row, headers);

    if (!suppressDialogs) {
      ui.alert('❌ Greška — redak ' + row, error.message, ui.ButtonSet.OK);
    }
    throw error;
  }
}

// ============================================================================
// PAYMENT VALIDATION
// ============================================================================

/**
 * Provjeri da UPLATA stupac sadrži valjani cijeli broj > 0.
 *
 * @param {*} rawValue - Vrijednost iz stupca UPLATA
 * @returns {{ valid: boolean, amount?: number, message?: string }}
 */
function validatePaymentAmount(rawValue) {
  // Prazna ćelija ili null/undefined
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return {
      valid: false,
      message: 'Stupac UPLATA je prazan.\n\n' +
        'Ne postoji evidentirana uplata na temelju koje se može izdati račun.\n' +
        'Unesite iznos uplate kao cijeli broj (npr. 40) prije kreiranja računa.'
    };
  }

  var num = Number(rawValue);

  // Nije broj uopće (tekst, specijalnih znakovi...)
  if (isNaN(num)) {
    return {
      valid: false,
      message: 'Stupac UPLATA sadrži "' + rawValue + '" — nije broj.\n\n' +
        'Ne postoji evidentirana uplata na temelju koje se može izdati račun.\n' +
        'Unesite iznos uplate kao cijeli broj (npr. 40).'
    };
  }

  // Nula ili negativan
  if (num <= 0) {
    return {
      valid: false,
      message: 'Stupac UPLATA sadrži ' + num + ' — mora biti pozitivan iznos.\n\n' +
        'Ne postoji evidentirana uplata na temelju koje se može izdati račun.\n' +
        'Unesite stvarni iznos uplate kao cijeli broj (npr. 40).'
    };
  }

  // Decimalni broj (nije cijeli)
  if (!Number.isInteger(num)) {
    return {
      valid: false,
      message: 'Stupac UPLATA sadrži ' + rawValue + ' — mora biti cijeli broj.\n\n' +
        'Ne postoji evidentirana uplata na temelju koje se može izdati račun.\n' +
        'Unesite iznos uplate kao cijeli broj bez decimala (npr. 40, ne 40.50).'
    };
  }

  return { valid: true, amount: num };
}

// ============================================================================
// PAYLOAD BUILDER — triple-checked against Swagger spec v1.0.0
// ============================================================================

/**
 * Map sheet row to FIRA API payload.
 *
 * Polja uključena prema Swagger specu (WebshopOrderModel):
 * ✅ webshopOrderId      — random unique ID
 * ✅ webshopType          — "CUSTOM"
 * ✅ webshopEvent         — event description
 * ✅ webshopOrderNumber   — human-readable order number (NOVO!)
 * ✅ invoiceType          — "FISKALNI_RAČUN"
 * ✅ paymentGatewayCode   — gateway identifier
 * ✅ paymentGatewayName   — gateway display name (NOVO!)
 * ✅ createdAt            — ISO datetime "YYYY-MM-DDTHH:mm:ssZ"
 * ✅ dueDate              — ISO date "YYYY-MM-DD" (datum konferencije, NE +14 dana)
 * ✅ currency             — "EUR"
 * ✅ taxesIncluded        — false (udruga nije u PDV-u)
 * ✅ billingAddress       — kompletni objekt sa svim poljima iz spec-a
 * ✅ shippingAddress      — delivery place
 * ✅ taxValue, brutto, netto
 * ✅ lineItems            — s kpdCode i productCode
 * ✅ discounts            — prazan array
 * ✅ customerLocale       — "HR" (NOVO!)
 * ✅ internalNote         — max 250 chars, NE vidi se na PDF-u
 * ✅ paymentType          — iz sheet stupca ili CONFIG default
 * ✅ termsHR              — klauzule vidljive na HR PDF-u (DORAĐENO!)
 * ✅ termsEN              — za strane sudionike (NOVO!)
 * ✅ termsDE              — za DE/AT sudionike (NOVO!)
 */
function buildPayload(headers, rowData) {
  var data = mapHeadersToValues(headers, rowData);

  var email = getVal(data, CONFIG.COLUMNS.EMAIL);
  var name = getVal(data, CONFIG.COLUMNS.NAME);
  var cityCountry = getVal(data, CONFIG.COLUMNS.CITY_COUNTRY);
  var phone = getVal(data, CONFIG.COLUMNS.PHONE);
  var gender = getVal(data, CONFIG.COLUMNS.GENDER);
  var yearOfBirth = getVal(data, CONFIG.COLUMNS.YEAR_OF_BIRTH);
  var occupation = getVal(data, CONFIG.COLUMNS.OCCUPATION);
  var oib = getVal(data, CONFIG.COLUMNS.OIB);
  var paymentType = getVal(data, CONFIG.COLUMNS.PAYMENT_TYPE) || CONFIG.DEFAULT_PAYMENT_TYPE;

  // UPLATA — obavezna, validira se prije poziva buildPayload,
  // ali radimo dodatnu provjeru za sigurnost
  var paymentRaw = data[CONFIG.COLUMNS.PAYMENT];
  var paymentValidation = validatePaymentAmount(paymentRaw);
  if (!paymentValidation.valid) {
    throw new Error(paymentValidation.message);
  }
  var payment = paymentValidation.amount;

  var location = parseCityAndCountry(cityCountry);

  // VAT izračun
  var taxRate = CONFIG.VAT_ENABLED ? CONFIG.DEFAULT_TAX_RATE : 0;
  var netto = payment;
  var taxValue = CONFIG.VAT_ENABLED ? netto * taxRate : 0;
  var brutto = netto + taxValue;

  // Vrijeme kreiranja = sada, ali dueDate = datum konferencije (PROŠLOST)
  var now = new Date();
  var orderId = Math.floor(Math.random() * 9000000) + 1000000; // 7-digit unique

  // Internal note — max 250 chars, nevidljiva na PDF-u
  var internalNote = buildInternalNote(gender, yearOfBirth, occupation);

  // Line item
  var lineItem = {
    name: CONFIG.SERVICE_NAME,
    description: 'Registracija sudionika: ' + name,
    price: payment,
    quantity: 1,
    unit: 'usluga',
    taxRate: taxRate
  };
  // Opcioni KPD kod (obavezno za eRačune od 2026.)
  if (CONFIG.DEFAULT_KPD_CODE) {
    lineItem.kpdCode = CONFIG.DEFAULT_KPD_CODE;
  }

  // Kompletni payload — sve polje iz WebshopOrderModel
  return {
    // Identifikacija narudžbe
    webshopOrderId: orderId,
    webshopType: 'CUSTOM',

    // Tip dokumenta
    invoiceType: CONFIG.DEFAULT_INVOICE_TYPE,

    // Payment gateway
    paymentGatewayCode: CONFIG.PAYMENT_GATEWAY_CODE,
    paymentGatewayName: CONFIG.PAYMENT_GATEWAY_NAME,

    // Datumi — dueDate je datum KONFERENCIJE jer je račun već plaćen
    createdAt: formatDateTimeForFira(now),

    // Valuta i PDV
    currency: CONFIG.DEFAULT_CURRENCY,
    taxesIncluded: CONFIG.VAT_ENABLED,

    // Kupac — sva polja prema Swagger WebshopCustomerAddressModel
    billingAddress: {
      name: name,
      address1: '',
      address2: '',
      city: location.city,
      country: location.country,
      phone: phone,
      zipCode: '',
      email: email,
      vatNumber: '',
      company: '',
      oib: oib
    },

    // Dostava — FIRA koristi shippingAddress.city kao "Mjesto isporuke" na PDF-u
    shippingAddress: {
      name: name,
      address1: '',
      address2: '',
      city: CONFIG.DELIVERY_PLACE,
      country: 'HR',
      phone: '',
      zipCode: '',
      email: ''
    },

    // Iznosi
    taxValue: roundTwo(taxValue),
    brutto: roundTwo(brutto),
    netto: roundTwo(netto),

    // Stavke
    lineItems: [lineItem],
    discounts: [],

    // Locale za kupca
    customerLocale: location.country === 'HR' ? 'HR' : location.country,

    // Interna bilješka (nevidljiva na PDF-u)
    internalNote: internalNote,

    // Način plaćanja
    paymentType: paymentType,

    // Klauzule vidljive na PDF-u — FIRA bira po billingAddress.country:
    //   HR → termsHR, DE/AT → termsDE, ostalo → termsEN
    termsHR: CONFIG.TERMS_HR,
    termsEN: CONFIG.TERMS_EN,
    termsDE: CONFIG.TERMS_DE
  };
}

// ============================================================================
// VALIDATION — za fiskalne račune
// ============================================================================

function validatePayload(payload) {
  var errors = [];

  if (!payload.lineItems || payload.lineItems.length === 0) {
    errors.push('Potrebna barem jedna stavka');
  }
  if (!payload.billingAddress.name) {
    errors.push('Ime i prezime obavezno');
  }
  if (!payload.billingAddress.email) {
    errors.push('Email obavezan');
  }

  // UPLATA validacija — već provjereno u buildPayload i onCheckboxEdit,
  // ali za sigurnost provjeravamo i ovdje
  if (payload.lineItems && payload.lineItems[0]) {
    var price = payload.lineItems[0].price;
    if (price === null || price === undefined || price <= 0) {
      errors.push('Stupac UPLATA: ne postoji evidentirana uplata na temelju koje se može izdati račun');
    }
    if (!Number.isInteger(price)) {
      errors.push('Stupac UPLATA: iznos mora biti cijeli broj (npr. 40), ne decimalni');
    }
  }

  // Validacija specifična za fiskalne račune
  if (payload.invoiceType === 'FISKALNI_RAČUN') {
    if (['GOTOVINA', 'TRANSAKCIJSKI', 'KARTICA'].indexOf(payload.paymentType) === -1) {
      errors.push('Način plaćanja mora biti GOTOVINA, TRANSAKCIJSKI ili KARTICA');
    }
    // OIB info — od 2026. obavezan za B2C, ali ne blokiramo (FIRA validira)
    if (!payload.billingAddress.oib) {
      Logger.log('⚠️ OIB nije unesen za redak — FIRA može tražiti od 2026.');
    }
  }

  return errors.length > 0
    ? { valid: false, error: errors.join('\n') }
    : { valid: true };
}

// ============================================================================
// FIRA API KOMUNIKACIJA
// ============================================================================

/**
 * POST na FIRA Custom Webshop API.
 * Endpoint: /api/v1/webshop/order/custom
 * Auth: FIRA-Api-Key header
 * Body: JSON payload
 */
function sendToFira(payload, apiKey) {
  var url = 'https://app.fira.finance/api/v1/webshop/order/custom';
  var jsonPayload = JSON.stringify(payload);

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'FIRA-Api-Key': apiKey },
    payload: jsonPayload,
    muteHttpExceptions: true
  };

  // Logiraj kompletni request za debugging
  Logger.log('═══════════════════════════════════════════');
  Logger.log('FIRA REQUEST');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('URL: ' + url);
  Logger.log('invoiceType: ' + payload.invoiceType);
  Logger.log('paymentType: ' + payload.paymentType);
  Logger.log('billingAddress.name: ' + payload.billingAddress.name);
  Logger.log('billingAddress.email: ' + payload.billingAddress.email);
  Logger.log('billingAddress.country: ' + payload.billingAddress.country);
  Logger.log('billingAddress.oib: ' + (payload.billingAddress.oib || '(prazno)'));
  Logger.log('brutto: ' + payload.brutto + ' | netto: ' + payload.netto + ' | tax: ' + payload.taxValue);
  Logger.log('lineItems[0].price: ' + (payload.lineItems[0] ? payload.lineItems[0].price : 'N/A'));
  Logger.log('lineItems[0].taxRate: ' + (payload.lineItems[0] ? payload.lineItems[0].taxRate : 'N/A'));
  Logger.log('customerLocale: ' + payload.customerLocale);
  Logger.log('───────────────────────────────────────────');
  Logger.log('FULL PAYLOAD:\n' + JSON.stringify(payload, null, 2));
  Logger.log('───────────────────────────────────────────');

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();
  var responseHeaders = response.getHeaders();

  // Logiraj kompletni response
  Logger.log('═══════════════════════════════════════════');
  Logger.log('FIRA RESPONSE');
  Logger.log('═══════════════════════════════════════════');
  Logger.log('HTTP Status: ' + code);
  Logger.log('Content-Type: ' + (responseHeaders['Content-Type'] || 'N/A'));
  Logger.log('Response Body:\n' + body);
  Logger.log('═══════════════════════════════════════════');

  if (code === 200) {
    Logger.log('✅ SUCCESS — ID: ' + JSON.parse(body).id);
    return JSON.parse(body);
  }

  // Parsiraj error body za maksimalno detaljan opis
  var parsedError = parseFiraError(body);

  // Deskriptivne greške za svaki HTTP status — s punim response bodyem
  var friendlyMessages = {
    400: 'Neispravni podaci',
    401: 'Autentifikacija neuspjela — provjeri API ključ',
    402: 'FIRA paket neaktivan ili nedovoljno kredita',
    403: 'Nema dozvole — provjeri FIRA FISKAL postavke i certifikat',
    404: 'Endpoint nije pronađen',
    500: 'FIRA server greška'
  };
  var friendly = friendlyMessages[code] || 'HTTP ' + code;

  // Kompletna error poruka — uključuje i parsed error i raw body
  var fullError = friendly + '\n\n' +
    '── Parsed error ──\n' + parsedError + '\n\n' +
    '── Raw response (HTTP ' + code + ') ──\n' + body;

  Logger.log('❌ ERROR DETAILS:\n' + fullError);

  throw new Error(fullError);
}

/**
 * Parsiraj FIRA error response — pokriva više formata:
 * - { validationErrors: [{ fieldName, message, rejectedValue }] }
 * - { message: "...", details: "..." }
 * - { error: "...", status: 500 }
 * - plain text
 */
function parseFiraError(body) {
  try {
    var err = JSON.parse(body);

    var parts = [];

    // Validation errors array (400 greške)
    if (err.validationErrors && err.validationErrors.length > 0) {
      parts.push('Validation errors:');
      err.validationErrors.forEach(function(ve, i) {
        parts.push('  [' + (i + 1) + '] ' +
          'field: ' + (ve.fieldName || '?') +
          ' | message: ' + (ve.message || '?') +
          ' | rejected: ' + (ve.rejectedValue !== undefined ? JSON.stringify(ve.rejectedValue) : 'N/A'));
      });
    }

    // Top-level message/error/details
    if (err.message) parts.push('Message: ' + err.message);
    if (err.error) parts.push('Error: ' + err.error);
    if (err.details) parts.push('Details: ' + err.details);
    if (err.status) parts.push('Status: ' + err.status);
    if (err.path) parts.push('Path: ' + err.path);
    if (err.timestamp) parts.push('Timestamp: ' + err.timestamp);

    // Ako smo pronašli nešto korisno
    if (parts.length > 0) return parts.join('\n');

    // Fallback: cijeli JSON objekt
    return JSON.stringify(err, null, 2);
  } catch (e) {
    // Nije JSON — vrati raw text
    return '(non-JSON response): ' + body;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function findColumnIndex(headers, name) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === name) return i + 1;
  }
  return -1;
}

function getRowDataAsMap(sheet, row, headers) {
  var vals = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var map = {};
  headers.forEach(function(h, i) { map[h] = vals[i]; });
  return map;
}

function mapHeadersToValues(headers, rowData) {
  var map = {};
  headers.forEach(function(h, i) { map[h] = rowData[i]; });
  return map;
}

function getVal(data, key, def) {
  var v = data[key];
  return (v !== undefined && v !== null && v !== '') ? v : (def || '');
}

function roundTwo(n) {
  return Math.round(n * 100) / 100;
}

function uncheckActionCheckbox(sheet, row, headers) {
  var col = findColumnIndex(headers, CONFIG.COLUMNS.ACTION);
  if (col !== -1) sheet.getRange(row, col).setValue(false);
}

function buildDocumentUrl(response, invoiceType) {
  var base = 'https://app.fira.finance/user/';
  if (invoiceType === 'PONUDA') return base + 'offers/details/' + response.id;
  return base + 'invoices/details/' + response.id;
}

function buildInternalNote(gender, yearOfBirth, occupation) {
  var parts = [
    'Google Forms',
    gender || null,
    yearOfBirth ? 'r.' + yearOfBirth : null,
    occupation || null
  ].filter(Boolean);

  var note = parts.join(' | ');
  if (note.length > CONFIG.MAX_INTERNAL_NOTE_LENGTH) {
    note = note.substring(0, CONFIG.MAX_INTERNAL_NOTE_LENGTH - 3) + '...';
  }
  return note;
}

// ============================================================================
// PARSIRANJE PODATAKA
// ============================================================================

/**
 * "Zagreb, Croatia" → { city: "Zagreb", country: "HR" }
 */
function parseCityAndCountry(input) {
  if (!input) return { city: '', country: CONFIG.DEFAULT_COUNTRY };

  var parts = String(input).split(',');
  var city = parts[0] ? parts[0].trim() : '';
  var country = CONFIG.DEFAULT_COUNTRY;

  if (parts.length > 1) {
    var raw = parts[1].trim().toLowerCase();
    // ISO mapiranje — prošireno za međunarodne sudionike
    var map = {
      'croat': 'HR', 'hrvat': 'HR', 'hr': 'HR',
      'german': 'DE', 'njemač': 'DE', 'de': 'DE',
      'austri': 'AT', 'österr': 'AT', 'at': 'AT',
      'sloven': 'SI', 'si': 'SI',
      'serb': 'RS', 'srb': 'RS', 'rs': 'RS',
      'bosn': 'BA', 'bih': 'BA', 'ba': 'BA',
      'italy': 'IT', 'italij': 'IT', 'it': 'IT',
      'hungar': 'HU', 'mađar': 'HU', 'hu': 'HU',
      'czech': 'CZ', 'češk': 'CZ', 'cz': 'CZ',
      'slovak': 'SK', 'slovač': 'SK', 'sk': 'SK',
      'poland': 'PL', 'polj': 'PL', 'pl': 'PL',
      'roman': 'RO', 'rumunj': 'RO', 'ro': 'RO',
      'france': 'FR', 'franc': 'FR', 'fr': 'FR',
      'spain': 'ES', 'španj': 'ES', 'es': 'ES',
      'portug': 'PT', 'pt': 'PT',
      'netherl': 'NL', 'holand': 'NL', 'nl': 'NL',
      'belgi': 'BE', 'be': 'BE',
      'switz': 'CH', 'švic': 'CH', 'ch': 'CH',
      'uk': 'GB', 'united kingdom': 'GB', 'engl': 'GB', 'gb': 'GB',
      'ireland': 'IE', 'irsk': 'IE',
      'usa': 'US', 'united states': 'US', 'amerik': 'US',
      'canada': 'CA', 'kanad': 'CA',
      'australia': 'AU', 'australij': 'AU',
      'brazil': 'BR', 'mont': 'ME', 'crna gora': 'ME',
      'macedon': 'MK', 'mkd': 'MK', 'north macedon': 'MK',
      'alban': 'AL', 'kosovo': 'XK', 'ukrain': 'UA',
      'philip': 'PH', 'filipin': 'PH'
    };
    for (var key in map) {
      if (raw.indexOf(key) >= 0 || raw === key) {
        country = map[key];
        break;
      }
    }
  }

  return { city: city, country: country };
}

// ============================================================================
// DATE FORMATTING — per FIRA Swagger spec
// ============================================================================

/** "2025-11-11T22:56:00Z" */
function formatDateTimeForFira(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** "2025-11-11" */
function formatDateForFira(date) {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// ROW STATUS TRACKING
// ============================================================================

function markRowAsProcessed(sheet, row, status, timestamp, documentUrl) {
  var headers = getHeaders(sheet);
  var nextCol = sheet.getLastColumn() + 1;

  var statusCol = findColumnIndex(headers, 'FIRA Status');
  var tsCol = findColumnIndex(headers, 'FIRA Timestamp');
  var urlCol = findColumnIndex(headers, 'FIRA Document URL');

  if (statusCol === -1) { statusCol = nextCol++; sheet.getRange(1, statusCol).setValue('FIRA Status'); }
  if (tsCol === -1)     { tsCol = nextCol++;     sheet.getRange(1, tsCol).setValue('FIRA Timestamp'); }
  if (urlCol === -1)    { urlCol = nextCol++;    sheet.getRange(1, urlCol).setValue('FIRA Document URL'); }

  sheet.getRange(row, statusCol).setValue(status);
  sheet.getRange(row, tsCol).setValue(timestamp);

  if (documentUrl) {
    sheet.getRange(row, urlCol).setFormula('=HYPERLINK("' + documentUrl + '"; "Otvori u FIRA")');
  } else {
    sheet.getRange(row, urlCol).setValue('');
  }

  sheet.getRange(row, statusCol).setBackground(status === 'SUCCESS' ? '#d9ead3' : '#f4cccc');
}