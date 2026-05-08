/**
 * FIRA.finance Split Payment Module
 *
 * Dvostruko fakturiranje: AVANS (predujam) + FINALNI račun (s odbitkom avansa).
 *
 * Tijek:
 *   1. Sudionik plati AVANS (npr. 110 €) → uneseš u "Advance payment (predujam)"
 *      → checkbox AKCIJA_AVANS_RACUN ili meni "Napravi račun za AVANS"
 *      → kreira se 1. račun: 1 stavka, iznos = avans
 *
 *   2. Sudionik plati OSTATAK → uneseš u "Payment" (ostatak)
 *      → checkbox AKCIJA_FINALNI_RACUN ili meni "Napravi FINALNI račun"
 *      → kreira se 2. račun: 2 stavke
 *           + SERVICE_NAME — ukupan iznos (avans + ostatak)
 *           − Avans / Predujam plaćen — negativna stavka (-avans)
 *         Brutto = ostatak
 *
 * Stupci u Sheetu (definirani u CONFIG.COLUMNS event configa):
 *   ADVANCE_PAYMENT — iznos uplaćenog avansa (cijeli broj > 0)
 *   PAYMENT         — iznos ostatka (cijeli broj > 0)  [istoimeni stupac kao single-flow]
 *   AKCIJA_AVANS    — checkbox za kreiranje AVANS računa
 *   AKCIJA_FINAL    — checkbox za kreiranje FINALNOG računa
 *
 * Status tracking (zasebne kolone od single-flow):
 *   "FIRA Avans Status", "FIRA Avans Timestamp", "FIRA Avans URL"
 *   "FIRA Final Status", "FIRA Final Timestamp", "FIRA Final URL"
 *
 * NAPOMENA o PDV-u:
 *   Ovaj modul pretpostavlja VAT_ENABLED = false (udruga van PDV sustava).
 *   Za PDV obveznike trebalo bi računati taxValue posebno za AVANS i FINAL,
 *   uz odbitak već prijavljenog PDV-a iz avansa.
 *
 * NAPOMENA o negativnoj stavci:
 *   FIRA OpenAPI spec ne zabranjuje negativan price u lineItems.
 *   Ako FIRA ipak odbije, alternativa je premjestiti odbitak u 'discounts' array.
 */

// ============================================================================
// MENU — poziva se iz onOpen u Code-Custom-Mapping.gs
// ============================================================================

function addSplitPaymentMenu() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('FIRA Split Payment')
    .addItem('💰 Napravi AVANS račun (odabrani redak)', 'createAdvanceInvoice')
    .addItem('🧾 Napravi FINALNI račun (odabrani redak)', 'createFinalInvoice')
    .addSeparator()
    .addItem('📦 Bulk: AVANS računi (sve označene)', 'createAdvanceInvoicesBulk')
    .addItem('📦 Bulk: FINALNI računi (sve označene)', 'createFinalInvoicesBulk')
    .addSeparator()
    .addItem('📋 Dodaj stupce za split payment', 'addSplitPaymentColumns')
    .addItem('🗑️ Ukloni AKCIJA_FIRA_RACUN stupac', 'removeStandardActionColumn')
    .addToUi();
}

/**
 * Ukloni AKCIJA_FIRA_RACUN stupac na split-payment eventu.
 * Taj stupac se kreira ako je korisnik prije pokrenuo "Dodaj stupce za fiskalizaciju";
 * na split flow-u je opasan jer može stvoriti dupli račun.
 */
function removeStandardActionColumn() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var colName = (CONFIG.COLUMNS && CONFIG.COLUMNS.ACTION) || 'AKCIJA_FIRA_RACUN';
  var col = findColumnIndex(headers, colName);

  if (col === -1) {
    ui.alert('Stupac "' + colName + '" ne postoji — ništa za ukloniti.');
    return;
  }

  var confirm = ui.alert(
    'Ukloniti stupac "' + colName + '"?',
    'Na ovom split-payment eventu ne smije se koristiti.\n' +
    'Brisanje je sigurno — sve oznake se gube, ali nisu se ni smjele koristiti.\n\nNastaviti?',
    ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  sheet.deleteColumn(col);
  ui.alert('✓ Stupac uklonjen.');
}

// ============================================================================
// COLUMN RESOLUTION — fallback ako event config nema split-payment polja
// ============================================================================

function getSplitColumns_() {
  var c = (typeof CONFIG !== 'undefined' && CONFIG.COLUMNS) ? CONFIG.COLUMNS : {};
  return {
    ADVANCE_PAYMENT: c.ADVANCE_PAYMENT || 'Advance payment (predujam)',
    AKCIJA_AVANS:    c.AKCIJA_AVANS    || 'AKCIJA_AVANS_RACUN',
    AKCIJA_FINAL:    c.AKCIJA_FINAL    || 'AKCIJA_FINALNI_RACUN'
  };
}

/**
 * Avans za FINALNI račun — dopušta prazno/0 (single-pay), inače validira > 0.
 * @returns {{ amount: number, error?: string }}
 *   amount = 0 znači single-pay (bez deduction stavke).
 */
function readAdvanceForFinal_(rawValue) {
  if (rawValue === null || rawValue === undefined || rawValue === '') {
    return { amount: 0 };
  }
  var num = Number(rawValue);
  if (isNaN(num)) {
    return { amount: -1, error: 'AVANS sadrži "' + rawValue + '" — nije broj.' };
  }
  if (num === 0) return { amount: 0 };
  if (num < 0) {
    return { amount: -1, error: 'AVANS = ' + num + ' — mora biti 0 ili pozitivan.' };
  }
  if (!Number.isInteger(num)) {
    return { amount: -1, error: 'AVANS mora biti cijeli broj (npr. 110, ne 110.50).' };
  }
  return { amount: num };
}

// ============================================================================
// SETUP
// ============================================================================

function addSplitPaymentColumns() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var lastRow = sheet.getLastRow();
  var sc = getSplitColumns_();
  var added = [];

  // ADVANCE_PAYMENT — broj
  var headers = getHeaders(sheet);
  if (findColumnIndex(headers, sc.ADVANCE_PAYMENT) === -1) {
    var apCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, apCol).setValue(sc.ADVANCE_PAYMENT);
    added.push(sc.ADVANCE_PAYMENT);
  }

  // AKCIJA_AVANS — checkbox
  headers = getHeaders(sheet);
  var aaCol = findColumnIndex(headers, sc.AKCIJA_AVANS);
  if (aaCol === -1) {
    aaCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, aaCol).setValue(sc.AKCIJA_AVANS);
    added.push(sc.AKCIJA_AVANS);
  }
  if (lastRow > 1) sheet.getRange(2, aaCol, lastRow - 1, 1).insertCheckboxes();

  // AKCIJA_FINAL — checkbox
  headers = getHeaders(sheet);
  var afCol = findColumnIndex(headers, sc.AKCIJA_FINAL);
  if (afCol === -1) {
    afCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, afCol).setValue(sc.AKCIJA_FINAL);
    added.push(sc.AKCIJA_FINAL);
  }
  if (lastRow > 1) sheet.getRange(2, afCol, lastRow - 1, 1).insertCheckboxes();

  SpreadsheetApp.getUi().alert('Gotovo!',
    added.length > 0
      ? 'Dodani stupci: ' + added.join(', ') +
        '\n\nPodsjetnik: ovo je split-payment flow.\n' +
        '  • "' + sc.ADVANCE_PAYMENT + '" = avans (npr. 110)\n' +
        '  • "Payment" = OSTATAK (ne ukupno)\n' +
        '  • Ukupno = avans + ostatak (računa se automatski)'
      : 'Stupci već postoje. Checkboxovi osvježeni.',
    SpreadsheetApp.getUi().ButtonSet.OK);
}

// ============================================================================
// MENU HANDLERS — single row from active selection
// ============================================================================

function createAdvanceInvoice() {
  var row = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Odaberite redak s podacima (ne zaglavlje)');
    return;
  }
  promptAndCreateAdvance_(row);
}

function createFinalInvoice() {
  var row = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();
  if (row <= 1) {
    SpreadsheetApp.getUi().alert('Odaberite redak s podacima (ne zaglavlje)');
    return;
  }
  promptAndCreateFinal_(row);
}

// ============================================================================
// CHECKBOX TRIGGER DISPATCH — pozvan iz onCheckboxEdit u Code-Custom-Mapping.gs
// ============================================================================

/**
 * @returns {boolean} true ako je event obrađen u split-payment moduluu
 *                    (glavni handler tada treba ranije izaći).
 */
function dispatchSplitPaymentCheckbox(e) {
  if (!e || !e.range) return false;

  var sheet = e.source.getActiveSheet();
  var row = e.range.getRow();
  var col = e.range.getColumn();
  if (row <= 1) return false;
  if (e.value !== 'TRUE') return false;

  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();
  var avansCol = findColumnIndex(headers, sc.AKCIJA_AVANS);
  var finalCol = findColumnIndex(headers, sc.AKCIJA_FINAL);

  if (col === avansCol) { promptAndCreateAdvance_(row); return true; }
  if (col === finalCol) { promptAndCreateFinal_(row); return true; }
  return false;
}

// ============================================================================
// CONFIRMATION PROMPTS
// ============================================================================

function promptAndCreateAdvance_(row) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();
  var data = getRowDataAsMap(sheet, row, headers);
  var ui = SpreadsheetApp.getUi();

  var advanceVal = validatePaymentAmount(data[sc.ADVANCE_PAYMENT]);
  if (!advanceVal.valid) {
    ui.alert('ℹ️ Avans nije unesen',
      advanceVal.message + '\n\n' +
      'Unesi iznos avansa u stupac "' + sc.ADVANCE_PAYMENT + '" (cijeli broj > 0).',
      ui.ButtonSet.OK);
    setCheckboxFalse_(sheet, row, sc.AKCIJA_AVANS);
    return;
  }
  var amount = advanceVal.amount;
  var name = data[CONFIG.COLUMNS.NAME] || 'N/A';
  var email = data[CONFIG.COLUMNS.EMAIL] || 'N/A';
  var oib = data[CONFIG.COLUMNS.OIB] || '';
  var paymentType = data[CONFIG.COLUMNS.PAYMENT_TYPE] || CONFIG.DEFAULT_PAYMENT_TYPE;

  var result = ui.alert('AVANS — odaberi tip dokumenta',
    '👤 ' + name + '\n' +
    '🆔 OIB: ' + (oib || '(nije unesen)') + '\n' +
    '💰 AVANS: ' + amount + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
    '💳 ' + paymentType + '\n' +
    '📧 ' + email + '\n\n' +
    '── Odaberi tip ──\n' +
    '✅ DA   → FISKALNI_RAČUN (Poreznoj upravi, NE briše se)\n' +
    '🧪 NE   → RAČUN (običan, deletable u FIRA UI)\n' +
    '✖️ ODUSTANI',
    ui.ButtonSet.YES_NO_CANCEL);

  var chosenType = null;
  if (result === ui.Button.YES) chosenType = 'FISKALNI_RAČUN';
  else if (result === ui.Button.NO) chosenType = 'RAČUN';
  if (!chosenType) { setCheckboxFalse_(sheet, row, sc.AKCIJA_AVANS); return; }

  createAdvanceInvoiceForRow(row, false, chosenType);
}

function promptAndCreateFinal_(row) {
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();
  var data = getRowDataAsMap(sheet, row, headers);
  var ui = SpreadsheetApp.getUi();

  var advRead = readAdvanceForFinal_(data[sc.ADVANCE_PAYMENT]);
  if (advRead.error) {
    ui.alert('ℹ️ Neispravan avans', advRead.error, ui.ButtonSet.OK);
    setCheckboxFalse_(sheet, row, sc.AKCIJA_FINAL);
    return;
  }
  var paymentVal = validatePaymentAmount(data[CONFIG.COLUMNS.PAYMENT]);
  if (!paymentVal.valid) {
    ui.alert('ℹ️ Iznos uplate nije unesen',
      'Stupac "' + CONFIG.COLUMNS.PAYMENT + '" mora sadržavati iznos.\n' +
      '  • Single-pay (avans = 0/prazno): puni iznos\n' +
      '  • Split (avans > 0): ostatak\n\n' +
      paymentVal.message,
      ui.ButtonSet.OK);
    setCheckboxFalse_(sheet, row, sc.AKCIJA_FINAL);
    return;
  }

  var advance = advRead.amount;
  var remainder = paymentVal.amount;
  var isSinglePay = advance === 0;
  var total = isSinglePay ? remainder : advance + remainder;

  var name = data[CONFIG.COLUMNS.NAME] || 'N/A';
  var email = data[CONFIG.COLUMNS.EMAIL] || 'N/A';
  var oib = data[CONFIG.COLUMNS.OIB] || '';
  var paymentType = data[CONFIG.COLUMNS.PAYMENT_TYPE] || CONFIG.DEFAULT_PAYMENT_TYPE;

  var amountBlock;
  var avansWarning = '';
  if (isSinglePay) {
    amountBlock = '💰 Iznos: ' + total + ' ' + CONFIG.DEFAULT_CURRENCY + '   (single-pay, bez avansa)\n';
  } else {
    amountBlock =
      '💰 Ukupno:   ' + total + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
      '   ‒ Avans:   -' + advance + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
      '   = Ostatak:  ' + remainder + ' ' + CONFIG.DEFAULT_CURRENCY + '\n';
    var avansStatusCol = findColumnIndex(headers, 'FIRA Avans Status');
    var avansStatus = avansStatusCol !== -1 ? sheet.getRange(row, avansStatusCol).getValue() : '';
    if (avansStatus !== 'SUCCESS') {
      avansWarning = '\n⚠️ AVANS račun još nije uspješno kreiran (status: ' + (avansStatus || '(prazno)') + ')\n';
    }
  }

  var title = isSinglePay
    ? 'RAČUN (single-pay) — odaberi tip dokumenta'
    : 'FINALNI RAČUN (split) — odaberi tip dokumenta';

  var result = ui.alert(title,
    '👤 ' + name + '\n' +
    '🆔 OIB: ' + (oib || '(nije unesen)') + '\n' +
    amountBlock +
    '💳 ' + paymentType + '\n' +
    '📧 ' + email + avansWarning + '\n' +
    '── Odaberi tip ──\n' +
    '✅ DA   → FISKALNI_RAČUN\n' +
    '🧪 NE   → RAČUN (deletable)\n' +
    '✖️ ODUSTANI',
    ui.ButtonSet.YES_NO_CANCEL);

  var chosenType = null;
  if (result === ui.Button.YES) chosenType = 'FISKALNI_RAČUN';
  else if (result === ui.Button.NO) chosenType = 'RAČUN';
  if (!chosenType) { setCheckboxFalse_(sheet, row, sc.AKCIJA_FINAL); return; }

  createFinalInvoiceForRow(row, false, chosenType);
}

// ============================================================================
// CORE — AVANS RAČUN
// ============================================================================

function createAdvanceInvoiceForRow(row, suppressDialogs, invoiceTypeOverride) {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');
  if (!apiKey) {
    if (!suppressDialogs) ui.alert('Postavite FIRA API ključ: FIRA Actions → Postavi API ključ');
    throw new Error('FIRA API ključ nije postavljen');
  }

  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Kreiram AVANS račun...', 'FIRA', -1);

    var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = mapHeadersToValues(headers, rowData);

    var advanceVal = validatePaymentAmount(data[sc.ADVANCE_PAYMENT]);
    if (!advanceVal.valid) throw new Error('AVANS — ' + advanceVal.message);
    var amount = advanceVal.amount;

    var name = getVal(data, CONFIG.COLUMNS.NAME);
    var taxRate = CONFIG.VAT_ENABLED ? CONFIG.DEFAULT_TAX_RATE : 0;

    var lineItem = {
      name: 'Advance / Predujam — ' + CONFIG.SERVICE_NAME,
      description: 'Advance payment for reservation / Predujam za rezervaciju mjesta — ' + name,
      price: amount,
      quantity: 1,
      unit: 'usluga',
      taxRate: taxRate
    };
    if (CONFIG.DEFAULT_KPD_CODE) lineItem.kpdCode = CONFIG.DEFAULT_KPD_CODE;

    var taxValue = CONFIG.VAT_ENABLED ? amount * taxRate : 0;
    var payload = buildSplitPayload_(headers, rowData, {
      lineItems: [lineItem],
      netto: amount,
      brutto: amount + taxValue,
      taxValue: taxValue,
      invoiceTypeOverride: invoiceTypeOverride
    });

    var validation = validatePayload(payload);
    if (!validation.valid) {
      markSplitRowAsProcessed_(sheet, row, 'AVANS', 'GREŠKA: ' + validation.error, new Date(), null);
      setCheckboxFalse_(sheet, row, sc.AKCIJA_AVANS);
      if (!suppressDialogs) ui.alert('Validacija', validation.error, ui.ButtonSet.OK);
      throw new Error(validation.error);
    }

    Logger.log('AVANS Payload:\n' + JSON.stringify(payload, null, 2));
    var response = sendToFira(payload, apiKey);
    var docUrl = buildDocumentUrl(response, payload.invoiceType);

    markSplitRowAsProcessed_(sheet, row, 'AVANS', 'SUCCESS', new Date(), docUrl);

    var isFiscal = payload.invoiceType === 'FISKALNI_RAČUN';
    var title = isFiscal ? '✅ AVANS fiskalni račun kreiran' : '✅ AVANS račun kreiran';
    if (!suppressDialogs) {
      ui.alert(title,
        'Iznos avansa: ' + amount + ' ' + CONFIG.DEFAULT_CURRENCY +
        (isFiscal ? '\n\n⚠️ Fiskaliziran — ne briše se.' :
                    '\n\nObičan RAČUN — može se obrisati u FIRA UI.'),
        ui.ButtonSet.OK);
    }
    SpreadsheetApp.getActiveSpreadsheet().toast(title, 'FIRA', 5);

  } catch (error) {
    Logger.log('AVANS row ' + row + ' error: ' + error.message);
    Logger.log('Stack: ' + (error.stack || 'N/A'));
    markSplitRowAsProcessed_(sheet, row, 'AVANS', 'GREŠKA: ' + error.message, new Date(), null);
    setCheckboxFalse_(sheet, row, sc.AKCIJA_AVANS);
    if (!suppressDialogs) ui.alert('❌ Greška AVANS — redak ' + row, error.message, ui.ButtonSet.OK);
    throw error;
  }
}

// ============================================================================
// CORE — FINALNI RAČUN s odbitkom avansa
// ============================================================================

function createFinalInvoiceForRow(row, suppressDialogs, invoiceTypeOverride) {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');
  if (!apiKey) {
    if (!suppressDialogs) ui.alert('Postavite FIRA API ključ');
    throw new Error('FIRA API ključ nije postavljen');
  }

  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();

  try {
    SpreadsheetApp.getActiveSpreadsheet().toast('Kreiram FINALNI račun...', 'FIRA', -1);

    var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
    var data = mapHeadersToValues(headers, rowData);

    var advRead = readAdvanceForFinal_(data[sc.ADVANCE_PAYMENT]);
    if (advRead.error) throw new Error('AVANS — ' + advRead.error);
    var paymentVal = validatePaymentAmount(data[CONFIG.COLUMNS.PAYMENT]);
    if (!paymentVal.valid) throw new Error('IZNOS UPLATE — ' + paymentVal.message);

    var advance = advRead.amount;
    var remainder = paymentVal.amount;
    var isSinglePay = advance === 0;
    var total = isSinglePay ? remainder : advance + remainder;

    var name = getVal(data, CONFIG.COLUMNS.NAME);
    var taxRate = CONFIG.VAT_ENABLED ? CONFIG.DEFAULT_TAX_RATE : 0;

    var serviceItem = {
      name: CONFIG.SERVICE_NAME,
      description: 'Registration / Registracija sudionika: ' + name +
        (isSinglePay ? '' : ' (ukupan iznos)'),
      price: total,
      quantity: 1,
      unit: 'usluga',
      taxRate: taxRate
    };
    if (CONFIG.DEFAULT_KPD_CODE) serviceItem.kpdCode = CONFIG.DEFAULT_KPD_CODE;

    var lineItems = [serviceItem];
    if (!isSinglePay) {
      lineItems.push({
        name: 'Advance paid / Plaćeni avans',
        description: 'Deduction of previously paid advance / Odbitak prethodno plaćenog avansa',
        price: -advance,
        quantity: 1,
        unit: 'usluga',
        taxRate: taxRate
      });
    }

    var nettoFinal = remainder;
    var taxValueFinal = CONFIG.VAT_ENABLED ? nettoFinal * taxRate : 0;
    var bruttoFinal = nettoFinal + taxValueFinal;

    var payload = buildSplitPayload_(headers, rowData, {
      lineItems: lineItems,
      netto: nettoFinal,
      brutto: bruttoFinal,
      taxValue: taxValueFinal,
      invoiceTypeOverride: invoiceTypeOverride
    });

    var validation = validatePayload(payload);
    if (!validation.valid) {
      markSplitRowAsProcessed_(sheet, row, 'FINAL', 'GREŠKA: ' + validation.error, new Date(), null);
      setCheckboxFalse_(sheet, row, sc.AKCIJA_FINAL);
      if (!suppressDialogs) ui.alert('Validacija', validation.error, ui.ButtonSet.OK);
      throw new Error(validation.error);
    }

    Logger.log('FINAL Payload:\n' + JSON.stringify(payload, null, 2));
    var response = sendToFira(payload, apiKey);
    var docUrl = buildDocumentUrl(response, payload.invoiceType);

    markSplitRowAsProcessed_(sheet, row, 'FINAL', 'SUCCESS', new Date(), docUrl);

    var isFiscal = payload.invoiceType === 'FISKALNI_RAČUN';
    var titleSuffix = isSinglePay ? 'račun' : 'FINALNI račun';
    var title = '✅ ' + (isFiscal ? 'Fiskalni ' + titleSuffix : titleSuffix) + ' kreiran';
    if (!suppressDialogs) {
      var body = isSinglePay
        ? 'Iznos: ' + total + ' ' + CONFIG.DEFAULT_CURRENCY + '   (single-pay, bez avansa)'
        : 'Ukupno: ' + total + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
          '− Avans: -' + advance + '\n' +
          '= Naplaćeno: ' + remainder + ' ' + CONFIG.DEFAULT_CURRENCY;
      ui.alert(title, body, ui.ButtonSet.OK);
    }
    SpreadsheetApp.getActiveSpreadsheet().toast(title, 'FIRA', 5);

  } catch (error) {
    Logger.log('FINAL row ' + row + ' error: ' + error.message);
    Logger.log('Stack: ' + (error.stack || 'N/A'));
    markSplitRowAsProcessed_(sheet, row, 'FINAL', 'GREŠKA: ' + error.message, new Date(), null);
    setCheckboxFalse_(sheet, row, sc.AKCIJA_FINAL);
    if (!suppressDialogs) ui.alert('❌ Greška FINAL — redak ' + row, error.message, ui.ButtonSet.OK);
    throw error;
  }
}

// ============================================================================
// PAYLOAD BUILDER — paralela buildPayload-a, s injektiranim line items i totals
// ============================================================================

function buildSplitPayload_(headers, rowData, opts) {
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
  var invoiceType = opts.invoiceTypeOverride
    || getVal(data, CONFIG.COLUMNS.INVOICE_TYPE)
    || CONFIG.DEFAULT_INVOICE_TYPE;

  var location = parseCityAndCountry(cityCountry);
  var now = new Date();
  var orderId = Math.floor(Math.random() * 9000000) + 1000000;
  var internalNote = buildInternalNote(gender, yearOfBirth, occupation);

  return {
    webshopOrderId: orderId,
    webshopType: 'CUSTOM',
    invoiceType: invoiceType,
    paymentGatewayCode: CONFIG.PAYMENT_GATEWAY_CODE,
    paymentGatewayName: CONFIG.PAYMENT_GATEWAY_NAME,
    createdAt: formatDateTimeForFira(now),
    currency: CONFIG.DEFAULT_CURRENCY,
    taxesIncluded: CONFIG.VAT_ENABLED,
    billingAddress: {
      name: name, address1: '', address2: '',
      city: location.city, country: location.country,
      phone: phone, zipCode: '', email: email,
      vatNumber: '', company: '', oib: oib
    },
    shippingAddress: {
      name: name, address1: '', address2: '',
      city: CONFIG.DELIVERY_PLACE, country: 'HR',
      phone: '', zipCode: '', email: ''
    },
    taxValue: roundTwo(opts.taxValue),
    brutto: roundTwo(opts.brutto),
    netto: roundTwo(opts.netto),
    lineItems: opts.lineItems,
    discounts: [],
    customerLocale: localeForCountry(location.country),
    internalNote: internalNote,
    paymentType: paymentType,
    termsHR: CONFIG.TERMS_HR,
    termsEN: CONFIG.TERMS_EN,
    termsDE: CONFIG.TERMS_DE
  };
}

// ============================================================================
// BULK
// ============================================================================

function createAdvanceInvoicesBulk() { bulkProcessSplit_('AVANS'); }
function createFinalInvoicesBulk()   { bulkProcessSplit_('FINAL'); }

function bulkProcessSplit_(type) {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = getHeaders(sheet);
  var sc = getSplitColumns_();
  var actionColName = type === 'AVANS' ? sc.AKCIJA_AVANS : sc.AKCIJA_FINAL;
  var statusColName = (type === 'AVANS' ? 'FIRA Avans' : 'FIRA Final') + ' Status';

  var actionCol = findColumnIndex(headers, actionColName);
  var statusCol = findColumnIndex(headers, statusColName);

  if (actionCol === -1) {
    ui.alert('Stupac ' + actionColName + ' ne postoji.\nKoristite "Dodaj stupce za split payment".');
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var actionValues = sheet.getRange(2, actionCol, lastRow - 1, 1).getValues();
  var rowsToProcess = [];

  for (var i = 0; i < actionValues.length; i++) {
    if (actionValues[i][0] !== true) continue;
    var rowNum = i + 2;
    if (statusCol !== -1) {
      var currentStatus = sheet.getRange(rowNum, statusCol).getValue();
      if (currentStatus === 'SUCCESS') continue;
    }
    rowsToProcess.push(rowNum);
  }

  if (rowsToProcess.length === 0) {
    ui.alert('Nema označenih neobrađenih redaka.');
    return;
  }

  var confirm = ui.alert(
    'Bulk ' + type + ' — ' + rowsToProcess.length + ' računa',
    'Kreirat će se ' + rowsToProcess.length + ' ' + type + ' računa.\n' +
    'Tip dokumenta čita se iz stupca "' +
      (CONFIG.COLUMNS.INVOICE_TYPE || 'Tip dokumenta') + '" (fallback: ' +
      CONFIG.DEFAULT_INVOICE_TYPE + ').\n\nNastaviti?',
    ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) return;

  var successCount = 0, errorCount = 0;
  for (var j = 0; j < rowsToProcess.length; j++) {
    SpreadsheetApp.getActiveSpreadsheet().toast(
      (j + 1) + '/' + rowsToProcess.length + '...', 'Bulk ' + type, -1);
    try {
      if (type === 'AVANS') createAdvanceInvoiceForRow(rowsToProcess[j], true);
      else                  createFinalInvoiceForRow(rowsToProcess[j], true);
      successCount++;
    } catch (e) {
      Logger.log('Row ' + rowsToProcess[j] + ' ' + type + ' error: ' + e.message);
      errorCount++;
    }
    if (j < rowsToProcess.length - 1) Utilities.sleep(1500);
  }

  ui.alert('Bulk ' + type + ' završen',
    '✅ Uspješno: ' + successCount + '\n❌ Greške: ' + errorCount +
    '\n\nProvjerite stupac "' + statusColName + '".',
    ui.ButtonSet.OK);
}

// ============================================================================
// STATUS TRACKING — odvojeni stupci AVANS/FINAL
// ============================================================================

function markSplitRowAsProcessed_(sheet, row, type, status, timestamp, documentUrl) {
  var prefix = type === 'AVANS' ? 'FIRA Avans' : 'FIRA Final';
  var headers = getHeaders(sheet);
  var nextCol = sheet.getLastColumn() + 1;

  var statusCol = findColumnIndex(headers, prefix + ' Status');
  var tsCol = findColumnIndex(headers, prefix + ' Timestamp');
  var urlCol = findColumnIndex(headers, prefix + ' URL');

  if (statusCol === -1) { statusCol = nextCol++; sheet.getRange(1, statusCol).setValue(prefix + ' Status'); }
  if (tsCol === -1)     { tsCol = nextCol++;     sheet.getRange(1, tsCol).setValue(prefix + ' Timestamp'); }
  if (urlCol === -1)    { urlCol = nextCol++;    sheet.getRange(1, urlCol).setValue(prefix + ' URL'); }

  sheet.getRange(row, statusCol).setValue(status);
  sheet.getRange(row, tsCol).setValue(timestamp);

  if (documentUrl) {
    // RichText link umjesto =HYPERLINK formule — Google Sheets auto-extenda
    // formule u nove Form redove, što propagira tuđi invoice URL u prazne redove.
    var richLink = SpreadsheetApp.newRichTextValue()
      .setText('Otvori u FIRA')
      .setLinkUrl(documentUrl)
      .build();
    sheet.getRange(row, urlCol).setRichTextValue(richLink);
  } else {
    sheet.getRange(row, urlCol).setValue('');
  }

  sheet.getRange(row, statusCol).setBackground(status === 'SUCCESS' ? '#d9ead3' : '#f4cccc');
}

// ============================================================================
// HELPERS
// ============================================================================

function setCheckboxFalse_(sheet, row, columnName) {
  var col = findColumnIndex(getHeaders(sheet), columnName);
  if (col !== -1) sheet.getRange(row, col).setValue(false);
}
