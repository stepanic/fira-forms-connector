/**
 * FIRA.finance Google Sheets Integration - Custom Mapping Version
 *
 * Prilagođeno za vaš Google Form sa stupcima:
 * - Vremenska oznaka, E-adresa, Payment, Name and surname, Gender, City and Country, itd.
 *
 * Ovaj kod koristi Payment stupac za cijenu i stvara račun za registraciju na susret.
 */

/**
 * Add custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
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
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt(
    'FIRA.finance API Konfiguracija',
    'Unesite vaš FIRA API ključ:\n(Preuzmite ga sa https://app.fira.finance/settings/integrations)',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();

    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('FIRA_API_KEY', apiKey);
      ui.alert('Uspjeh', 'FIRA API ključ je uspješno spremljen!', ui.ButtonSet.OK);
    } else {
      ui.alert('Greška', 'API ključ ne može biti prazan', ui.ButtonSet.OK);
    }
  }
}

/**
 * Main function: Create invoice in FIRA from selected row
 */
function createFiraInvoice() {
  const ui = SpreadsheetApp.getUi();
  const sheet = SpreadsheetApp.getActiveSheet();
  const activeRange = sheet.getActiveRange();
  const row = activeRange.getRow();

  // Check if a valid row is selected (not header)
  if (row <= 1) {
    ui.alert('Greška', 'Molimo odaberite redak s podacima (ne zaglavlje)', ui.ButtonSet.OK);
    return;
  }

  // Get configuration
  const config = getConfiguration();

  if (!config.apiKey) {
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
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build payload from row
    const payload = mapRowToPayload(headers, rowData, config);

    // Validate required fields
    const validation = validatePayload(payload);
    if (!validation.valid) {
      ui.alert('Greška validacije', validation.error, ui.ButtonSet.OK);
      SpreadsheetApp.getActiveSpreadsheet().toast('Validacija nije uspjela', 'Greška', 3);
      return;
    }

    // Send to FIRA
    const response = sendToFira(payload, config);

    // Mark row as processed
    markRowAsProcessed(sheet, row, 'SUCCESS', new Date());

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
    markRowAsProcessed(sheet, row, 'GREŠKA: ' + error.message, new Date());

    // Show error to user
    ui.alert(
      'Greška',
      'Nije uspjelo kreiranje računa u FIRA:\n\n' + error.message + '\n\nProvjerite FIRA Status stupac za detalje.',
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Neuspješno kreiranje računa', 'Greška', 5);
  }
}

/**
 * Map sheet row to FIRA webhook payload
 *
 * Mapiranje specifično za vaše stupce:
 * - Vremenska oznaka → createdAt
 * - E-adresa → billingAddress.email
 * - Payment → lineItems[].price (cijena registracije)
 * - Name and surname → billingAddress.name
 * - City and Country → billingAddress.city
 * - Phone number → billingAddress.phone
 */
function mapRowToPayload(headers, rowData, config) {
  // Create a map of column names to values
  const data = {};
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
    const value = getValue(key, defaultValue);
    return typeof value === 'number' ? value : parseFloat(value) || defaultValue;
  }

  // Extract data from your specific columns
  const timestamp = getValue('Vremenska oznaka', new Date());
  const email = getValue('E-adresa');
  const payment = getNumber('Payment', 0);
  const nameAndSurname = getValue('Name and surname (Ime i prezime)');
  const cityAndCountry = getValue('City and Country (Mjesto i država)');
  const phone = getValue('Phone number (Kontakt broj)');
  const gender = getValue('Gender (Spol)');
  const yearOfBirth = getValue('Year of birth (Godina rođenja)');
  const occupation = getValue('Occupation / profession / job (Zanimanje/profesija/posao)');

  // Parse City and Country (format: "Zagreb, Croatia" → city: Zagreb, country: HR)
  let city = '';
  let country = config.defaultCountry;
  if (cityAndCountry) {
    const parts = cityAndCountry.split(',');
    if (parts.length > 0) {
      city = parts[0].trim();
    }
    if (parts.length > 1) {
      const countryName = parts[1].trim().toLowerCase();
      // Map country names to codes
      if (countryName.includes('croat') || countryName.includes('hrvat')) {
        country = 'HR';
      } else if (countryName.includes('german') || countryName.includes('njemač')) {
        country = 'DE';
      } else if (countryName.includes('austri') || countryName.includes('austri')) {
        country = 'AT';
      }
      // Add more country mappings as needed
    }
  }

  // Build line items - in your case, it's registration fee
  const lineItems = [];
  const itemPrice = payment || config.defaultPrice || 0;
  const itemTaxRate = config.defaultTaxRate;

  if (itemPrice > 0) {
    lineItems.push({
      name: config.defaultServiceName || 'Registracija za susret',
      description: 'Registracija sudionika: ' + nameAndSurname,
      lineItemId: 'REG-001',
      price: itemPrice,
      quantity: 1,
      unit: 'usluga',
      taxRate: itemTaxRate
    });
  }

  // Calculate totals
  const netto = itemPrice * 1;
  const taxValue = netto * itemTaxRate;
  const brutto = netto + taxValue;

  // Build billing address
  const billingAddress = {
    name: nameAndSurname,
    email: email,
    city: city,
    country: country,
    phone: phone,
    address1: '', // Not provided in your form
    zipCode: '', // Not provided in your form
    company: '', // Not provided in your form
    oib: '', // Not provided in your form
    vatNumber: '' // Not provided in your form
  };

  // Parse timestamp
  let createdAt = new Date();
  if (timestamp) {
    createdAt = new Date(timestamp);
  }

  // Calculate due date (14 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  // Build internal note with additional info
  const internalNote = [
    'Registracija iz Google Forms',
    'Spol: ' + gender,
    'Godina rođenja: ' + yearOfBirth,
    'Zanimanje: ' + occupation
  ].filter(function(line) { return line.split(':')[1].trim() !== ''; }).join('\n');

  // Build complete payload
  const payload = {
    webshopOrderId: Math.floor(Math.random() * 1000000),
    webshopType: 'CUSTOM',
    webshopEvent: 'google_forms_registration',
    webshopOrderNumber: 'GF-' + createdAt.getTime(),
    invoiceType: config.defaultInvoiceType,
    paymentGatewayCode: 'google-forms',
    paymentGatewayName: 'Google Forms',
    createdAt: createdAt.toISOString(),
    dueDate: formatDate(dueDate),
    currency: config.defaultCurrency,
    taxesIncluded: true,
    billingAddress: billingAddress,
    taxValue: taxValue,
    brutto: brutto,
    netto: netto,
    lineItems: lineItems,
    internalNote: internalNote,
    paymentType: config.defaultPaymentType,
    discounts: [],
    totalShipping: {
      name: 'Shipping',
      price: 0,
      quantity: 1,
      unit: 'usluga',
      taxRate: itemTaxRate
    }
  };

  return payload;
}

/**
 * Validate payload before sending
 */
function validatePayload(payload) {
  const errors = [];

  if (!payload.lineItems || payload.lineItems.length === 0) {
    errors.push('Potrebna je barem jedna stavka (provjerite Payment stupac)');
  }

  if (!payload.billingAddress || !payload.billingAddress.name) {
    errors.push('Ime i prezime je obavezno');
  }

  if (!payload.billingAddress || !payload.billingAddress.email) {
    errors.push('E-mail adresa je obavezna');
  }

  if (payload.lineItems && payload.lineItems.length > 0 && payload.lineItems[0].price <= 0) {
    errors.push('Cijena mora biti veća od 0 (provjerite Payment stupac)');
  }

  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.join('\n')
    };
  }

  return { valid: true };
}

/**
 * Send payload to FIRA API
 */
function sendToFira(payload, config) {
  const url = config.apiUrl + '/api/v1/webshop/order/custom';

  // FIRA API expects the payload as a query parameter
  const fullUrl = url + '?webshopModel=' + encodeURIComponent(JSON.stringify(payload));

  const options = {
    method: 'post',
    headers: {
      'Authorization': 'Bearer ' + config.apiKey,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(fullUrl, options);
  const responseCode = response.getResponseCode();
  const responseBody = response.getContentText();

  Logger.log('FIRA API Response Code: ' + responseCode);
  Logger.log('FIRA API Response Body: ' + responseBody);

  if (responseCode === 200) {
    return JSON.parse(responseBody);
  } else if (responseCode === 401) {
    throw new Error('Autentifikacija nije uspjela - provjerite API ključ');
  } else if (responseCode === 400) {
    const errorData = JSON.parse(responseBody);
    const errorMessage = errorData.message || 'Neispravni podaci';
    throw new Error('Greška validacije: ' + errorMessage);
  } else {
    throw new Error('API greška (HTTP ' + responseCode + '): ' + responseBody);
  }
}

/**
 * Mark row as processed with status and timestamp
 */
function markRowAsProcessed(sheet, row, status, timestamp) {
  // Find or create status column (look for AKCIJA_FIRA_RACUN column)
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let statusCol = -1;
  let timestampCol = -1;

  // Find AKCIJA_FIRA_RACUN column
  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === 'AKCIJA_FIRA_RACUN') {
      statusCol = i + 1;
      timestampCol = i + 2; // Next column for timestamp
      break;
    }
  }

  // If not found, find FIRA Status column
  if (statusCol === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === 'FIRA Status') {
        statusCol = i + 1;
        break;
      }
    }
  }

  // If still not found, create new columns
  if (statusCol === -1) {
    statusCol = lastCol + 1;
    sheet.getRange(1, statusCol).setValue('FIRA Status');
  }

  // Find or create timestamp column
  if (timestampCol === -1) {
    for (let i = 0; i < headers.length; i++) {
      if (headers[i] === 'FIRA Timestamp') {
        timestampCol = i + 1;
        break;
      }
    }
  }

  if (timestampCol === -1) {
    timestampCol = statusCol + 1;
    sheet.getRange(1, timestampCol).setValue('FIRA Timestamp');
  }

  // Set values
  sheet.getRange(row, statusCol).setValue(status);
  sheet.getRange(row, timestampCol).setValue(timestamp);

  // Color code: green for success, red for error
  if (status === 'SUCCESS') {
    sheet.getRange(row, statusCol).setBackground('#d9ead3');
  } else {
    sheet.getRange(row, statusCol).setBackground('#f4cccc');
  }
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
}
