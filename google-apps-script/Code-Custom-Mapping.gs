/**
 * FIRA.finance Google Sheets Integration - Custom Mapping Version
 *
 * Prilagođeno za vaš Google Form sa stupcima:
 * - Vremenska oznaka, E-adresa, Payment, Name and surname, Gender, City and Country, itd.
 *
 * VAŽNO: Ovaj kod koristi JSON body method (ne query param) i FIRA-Api-Key header.
 * Testirano i radi s FIRA API-jem.
 */

// ============================================================================
// KONFIGURACIJA - PRILAGODITE SVOJE POSTAVKE OVDJE
// ============================================================================
var CONFIG = {
  // Naziv usluge na računu
  SERVICE_NAME: 'Kotizacija za Međunarodni susret Zagreb',

  // Default cijena ako Payment stupac nije popunjen
  DEFAULT_PRICE: 80,

  // Mjesto isporuke (delivery place na računu)
  DELIVERY_PLACE: 'Osijek',

  // Tip dokumenta: 'PONUDA', 'RAČUN', ili 'FISKALNI_RAČUN'
  DEFAULT_INVOICE_TYPE: 'PONUDA',

  // Valuta
  DEFAULT_CURRENCY: 'EUR',

  // Način plaćanja: 'GOTOVINA', 'TRANSAKCIJSKI', 'KARTICA'
  DEFAULT_PAYMENT_TYPE: 'TRANSAKCIJSKI',

  // PDV postavke (false = nije u sustavu PDV-a)
  VAT_ENABLED: false,
  DEFAULT_TAX_RATE: 0.25,

  // Klauzula za oslobođenje PDV-a
  TERMS_HR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.',

  // Max duljina internalNote (FIRA DB limit)
  MAX_INTERNAL_NOTE_LENGTH: 250,

  // Default država
  DEFAULT_COUNTRY: 'HR'
};

// ============================================================================
// MENU I SETUP FUNKCIJE
// ============================================================================

/**
 * Add custom menu when sheet opens
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('FIRA Actions')
    .addItem('Napravi račun u FIRA', 'createFiraInvoice')
    .addSeparator()
    .addItem('⚙️ Postavi API ključ', 'setupFiraIntegration')
    .addItem('ℹ️ Prikaži postavke', 'showConfiguration')
    .addToUi();
}

/**
 * Setup wizard - configure FIRA API key
 */
function setupFiraIntegration() {
  var ui = SpreadsheetApp.getUi();

  var result = ui.prompt(
    'FIRA.finance API Konfiguracija',
    'Unesite vaš FIRA API ključ:\n(Preuzmite ga sa https://app.fira.finance/settings/integrations)',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    var apiKey = result.getResponseText().trim();

    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('FIRA_API_KEY', apiKey);
      ui.alert('Uspjeh', 'FIRA API ključ je uspješno spremljen!', ui.ButtonSet.OK);
    } else {
      ui.alert('Greška', 'API ključ ne može biti prazan', ui.ButtonSet.OK);
    }
  }
}

/**
 * Show current configuration
 */
function showConfiguration() {
  var ui = SpreadsheetApp.getUi();
  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');

  var configText =
    'Naziv usluge: ' + CONFIG.SERVICE_NAME + '\n' +
    'Default cijena: ' + CONFIG.DEFAULT_PRICE + ' ' + CONFIG.DEFAULT_CURRENCY + '\n' +
    'Mjesto isporuke: ' + CONFIG.DELIVERY_PLACE + '\n' +
    'Tip dokumenta: ' + CONFIG.DEFAULT_INVOICE_TYPE + '\n' +
    'PDV omogućen: ' + (CONFIG.VAT_ENABLED ? 'Da' : 'Ne') + '\n' +
    'API ključ: ' + (apiKey ? '***' + apiKey.slice(-4) : 'Nije postavljen');

  ui.alert('Trenutne postavke', configText, ui.ButtonSet.OK);
}

// ============================================================================
// GLAVNE FUNKCIJE
// ============================================================================

/**
 * Main function: Create invoice in FIRA from selected row
 */
function createFiraInvoice() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  var activeRange = sheet.getActiveRange();
  var row = activeRange.getRow();

  // Check if a valid row is selected (not header)
  if (row <= 1) {
    ui.alert('Greška', 'Molimo odaberite redak s podacima (ne zaglavlje)', ui.ButtonSet.OK);
    return;
  }

  // Get API key
  var apiKey = PropertiesService.getScriptProperties().getProperty('FIRA_API_KEY');

  if (!apiKey) {
    ui.alert(
      'Potrebna konfiguracija',
      'Molimo prvo postavite FIRA API ključ.\nIdite na: FIRA Actions → Postavi API ključ',
      ui.ButtonSet.OK
    );
    return;
  }

  try {
    // Show loading message
    SpreadsheetApp.getActiveSpreadsheet().toast('Stvaram račun u FIRA...', 'Obrada', -1);

    // Get row data
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build payload from row
    var payload = mapRowToPayload(headers, rowData);

    // Validate required fields
    var validation = validatePayload(payload);
    if (!validation.valid) {
      ui.alert('Greška validacije', validation.error, ui.ButtonSet.OK);
      SpreadsheetApp.getActiveSpreadsheet().toast('Validacija nije uspjela', 'Greška', 3);
      return;
    }

    // Log payload for debugging
    Logger.log('Payload: ' + JSON.stringify(payload, null, 2));

    // Send to FIRA
    var response = sendToFira(payload, apiKey);

    // Build document URL
    var documentUrl = 'https://app.fira.finance/user/offers/details/' + response.id;

    // Mark row as processed
    markRowAsProcessed(sheet, row, 'SUCCESS', new Date(), documentUrl);

    // Show success message
    ui.alert(
      'Uspjeh!',
      'Račun je uspješno kreiran u FIRA.finance\n\nProvjerite FIRA dashboard za pregled računa.',
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Račun uspješno kreiran!', 'Uspjeh', 5);

  } catch (error) {
    Logger.log('Greška pri kreiranju FIRA računa: ' + error.toString());

    // Mark row as failed
    markRowAsProcessed(sheet, row, 'GREŠKA: ' + error.message, new Date(), null);

    // Show error to user
    ui.alert(
      'Greška',
      'Nije uspjelo kreiranje računa u FIRA:\n\n' + error.message + '\n\nProvjerite FIRA Status stupac za detalje.',
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Neuspješno kreiranje računa', 'Greška', 5);
  }
}

// ============================================================================
// PAYLOAD MAPPING
// ============================================================================

/**
 * Map sheet row to FIRA webhook payload
 *
 * VAŽNO: Ova verzija koristi istu strukturu kao testirani CLI koji radi!
 */
function mapRowToPayload(headers, rowData) {
  // Create a map of column names to values
  var data = {};
  headers.forEach(function(header, index) {
    data[header] = rowData[index];
  });

  // Helper function to get value or default
  function getValue(key, defaultValue) {
    if (defaultValue === undefined) defaultValue = '';
    return data[key] !== undefined && data[key] !== '' ? data[key] : defaultValue;
  }

  // Helper function to parse number
  function getNumber(key, defaultValue) {
    if (defaultValue === undefined) defaultValue = 0;
    var value = getValue(key, defaultValue);
    return typeof value === 'number' ? value : parseFloat(value) || defaultValue;
  }

  // Extract data from your specific columns
  var email = getValue('E-adresa');
  var payment = getNumber('Payment', CONFIG.DEFAULT_PRICE);
  var nameAndSurname = getValue('Name and surname (Ime i prezime)');
  var cityAndCountry = getValue('City and Country (Mjesto i država)');
  var phone = getValue('Phone number (Kontakt broj)');
  var gender = getValue('Gender (Spol)');
  var yearOfBirth = getValue('Year of birth (Godina rođenja)');
  var occupation = getValue('Occupation / profession / job (Zanimanje/profesija/posao)');

  // Parse City and Country (format: "Zagreb, Croatia" → city: Zagreb, country: HR)
  var cityCountryParsed = parseCityAndCountry(cityAndCountry);
  var city = cityCountryParsed.city;
  var country = cityCountryParsed.country;

  // VAT/PDV settings
  var vatEnabled = CONFIG.VAT_ENABLED;
  var taxRate = vatEnabled ? CONFIG.DEFAULT_TAX_RATE : 0;

  // Calculate totals (no tax if VAT not enabled)
  var netto = payment;
  var taxValue = vatEnabled ? netto * taxRate : 0;
  var brutto = netto + taxValue;

  // Calculate dates
  var now = new Date();
  var createdAt = formatDateTimeForFira(now);

  var dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);
  var dueDateStr = formatDateForFira(dueDate);

  // Build internal note (limited to 250 chars due to FIRA API database limit)
  var internalNoteParts = [
    'Registracija iz Google Forms',
    gender ? 'Spol: ' + gender : '',
    yearOfBirth ? 'Godina rođenja: ' + yearOfBirth : '',
    occupation ? 'Zanimanje: ' + occupation : ''
  ];

  var internalNote = internalNoteParts.filter(function(p) { return p; }).join('\n');
  if (internalNote.length > CONFIG.MAX_INTERNAL_NOTE_LENGTH) {
    internalNote = internalNote.substring(0, CONFIG.MAX_INTERNAL_NOTE_LENGTH - 3) + '...';
  }

  // Build complete payload - EXACT SAME STRUCTURE AS WORKING CLI TEST
  var payload = {
    webshopOrderId: Math.floor(Math.random() * 1000000),
    webshopType: 'CUSTOM',
    webshopEvent: 'google_forms_registration',
    invoiceType: CONFIG.DEFAULT_INVOICE_TYPE,
    paymentGatewayCode: 'google-forms',
    createdAt: createdAt,
    dueDate: dueDateStr,
    currency: CONFIG.DEFAULT_CURRENCY,
    taxesIncluded: vatEnabled,
    billingAddress: {
      name: nameAndSurname,
      email: email,
      city: city,
      country: country,
      phone: phone || '',
      address1: '',
      zipCode: '',
      company: '',
      oib: '',
      vatNumber: ''
    },
    shippingAddress: {
      name: nameAndSurname,
      city: CONFIG.DELIVERY_PLACE,
      country: 'HR'
    },
    taxValue: taxValue,
    brutto: brutto,
    netto: netto,
    lineItems: [
      {
        name: CONFIG.SERVICE_NAME,
        description: 'Registracija sudionika: ' + nameAndSurname,
        lineItemId: 'REG-001',
        price: payment,
        quantity: 1,
        unit: 'usluga',
        taxRate: taxRate
      }
    ],
    internalNote: internalNote,
    paymentType: CONFIG.DEFAULT_PAYMENT_TYPE,
    discounts: [],
    termsHR: CONFIG.TERMS_HR
  };

  return payload;
}

/**
 * Parse City and Country string
 * Format: "Zagreb, Croatia" → { city: "Zagreb", country: "HR" }
 */
function parseCityAndCountry(cityAndCountry) {
  var city = '';
  var country = CONFIG.DEFAULT_COUNTRY;

  if (!cityAndCountry) {
    return { city: city, country: country };
  }

  var parts = cityAndCountry.split(',');

  if (parts.length > 0) {
    city = parts[0].trim();
  }

  if (parts.length > 1) {
    var countryName = parts[1].trim().toLowerCase();

    // Map country names to ISO codes
    if (countryName.indexOf('croat') >= 0 || countryName.indexOf('hrvat') >= 0) {
      country = 'HR';
    } else if (countryName.indexOf('german') >= 0 || countryName.indexOf('njemač') >= 0) {
      country = 'DE';
    } else if (countryName.indexOf('austri') >= 0) {
      country = 'AT';
    } else if (countryName.indexOf('sloven') >= 0) {
      country = 'SI';
    } else if (countryName.indexOf('serb') >= 0 || countryName.indexOf('srb') >= 0) {
      country = 'RS';
    } else if (countryName.indexOf('bosn') >= 0) {
      country = 'BA';
    } else if (countryName.indexOf('italy') >= 0 || countryName.indexOf('italij') >= 0) {
      country = 'IT';
    }
  }

  return { city: city, country: country };
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format date to ISO without milliseconds (FIRA API format)
 * Output: "2025-11-11T22:56:00Z"
 */
function formatDateTimeForFira(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateForFira(date) {
  return date.toISOString().split('T')[0];
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate payload before sending
 */
function validatePayload(payload) {
  var errors = [];

  if (!payload.lineItems || payload.lineItems.length === 0) {
    errors.push('Potrebna je barem jedna stavka');
  }

  if (!payload.billingAddress || !payload.billingAddress.name) {
    errors.push('Ime i prezime je obavezno');
  }

  if (!payload.billingAddress || !payload.billingAddress.email) {
    errors.push('E-mail adresa je obavezna');
  }

  if (payload.lineItems && payload.lineItems.length > 0 && payload.lineItems[0].price <= 0) {
    errors.push('Cijena mora biti veća od 0');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('\n')
    };
  }

  return { valid: true };
}

// ============================================================================
// FIRA API COMMUNICATION
// ============================================================================

/**
 * Send payload to FIRA API
 *
 * VAŽNO: Koristi JSON body method i FIRA-Api-Key header (testirano i radi!)
 */
function sendToFira(payload, apiKey) {
  var url = 'https://app.fira.finance/api/v1/webshop/order/custom';

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'FIRA-Api-Key': apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  Logger.log('Sending request to: ' + url);
  Logger.log('Headers: FIRA-Api-Key: ***' + apiKey.slice(-4));
  Logger.log('Payload length: ' + options.payload.length + ' chars');

  var response = UrlFetchApp.fetch(url, options);
  var responseCode = response.getResponseCode();
  var responseBody = response.getContentText();

  Logger.log('FIRA API Response Code: ' + responseCode);
  Logger.log('FIRA API Response Body: ' + responseBody);

  if (responseCode === 200) {
    return JSON.parse(responseBody);
  } else if (responseCode === 401) {
    throw new Error('Autentifikacija nije uspjela - provjerite API ključ');
  } else if (responseCode === 400) {
    throw new Error('Neispravni podaci: ' + responseBody);
  } else if (responseCode === 500) {
    throw new Error('FIRA server greška: ' + responseBody);
  } else {
    throw new Error('API greška (HTTP ' + responseCode + '): ' + responseBody);
  }
}

// ============================================================================
// ROW STATUS TRACKING
// ============================================================================

/**
 * Mark row as processed with status, timestamp, and document URL
 */
function markRowAsProcessed(sheet, row, status, timestamp, documentUrl) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  var statusCol = -1;
  var timestampCol = -1;
  var urlCol = -1;

  // Find existing columns
  for (var i = 0; i < headers.length; i++) {
    if (headers[i] === 'FIRA Status') {
      statusCol = i + 1;
    }
    if (headers[i] === 'FIRA Timestamp') {
      timestampCol = i + 1;
    }
    if (headers[i] === 'FIRA Document URL') {
      urlCol = i + 1;
    }
  }

  // Create columns if they don't exist
  var nextCol = lastCol + 1;

  if (statusCol === -1) {
    statusCol = nextCol;
    sheet.getRange(1, statusCol).setValue('FIRA Status');
    nextCol++;
  }

  if (timestampCol === -1) {
    timestampCol = nextCol;
    sheet.getRange(1, timestampCol).setValue('FIRA Timestamp');
    nextCol++;
  }

  if (urlCol === -1) {
    urlCol = nextCol;
    sheet.getRange(1, urlCol).setValue('FIRA Document URL');
    nextCol++;
  }

  // Set values
  sheet.getRange(row, statusCol).setValue(status);
  sheet.getRange(row, timestampCol).setValue(timestamp);

  // Set document URL (as clickable hyperlink)
  if (documentUrl) {
    sheet.getRange(row, urlCol).setFormula('=HYPERLINK("' + documentUrl + '", "Otvori u FIRA")');
  } else {
    sheet.getRange(row, urlCol).setValue('');
  }

  // Color code: green for success, red for error
  if (status === 'SUCCESS') {
    sheet.getRange(row, statusCol).setBackground('#d9ead3');
  } else {
    sheet.getRange(row, statusCol).setBackground('#f4cccc');
  }
}
