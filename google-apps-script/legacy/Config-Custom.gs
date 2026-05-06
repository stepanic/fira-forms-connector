/**
 * FIRA.finance Configuration Module - Custom Version
 *
 * Prilagođeno za registracije na susrete
 */

/**
 * Get configuration from Script Properties
 */
function getConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();

  return {
    // API Configuration
    apiKey: scriptProperties.getProperty('FIRA_API_KEY') || '',
    apiUrl: scriptProperties.getProperty('FIRA_API_URL') || 'https://app.fira.finance',

    // Invoice Defaults
    defaultInvoiceType: scriptProperties.getProperty('DEFAULT_INVOICE_TYPE') || 'PONUDA',
    defaultCurrency: scriptProperties.getProperty('DEFAULT_CURRENCY') || 'EUR',
    defaultPaymentType: scriptProperties.getProperty('DEFAULT_PAYMENT_TYPE') || 'TRANSAKCIJSKI',
    defaultTaxRate: parseFloat(scriptProperties.getProperty('DEFAULT_TAX_RATE') || '0.25'),
    defaultCountry: scriptProperties.getProperty('DEFAULT_COUNTRY') || 'HR',

    // Service-specific defaults for registrations
    defaultServiceName: scriptProperties.getProperty('DEFAULT_SERVICE_NAME') || 'Registracija za susret',
    defaultPrice: parseFloat(scriptProperties.getProperty('DEFAULT_PRICE') || '0'),

    // Column Mapping - your specific columns
    columnMapping: {
      timestamp: 'Vremenska oznaka',
      email: 'E-adresa',
      payment: 'Payment',
      nameAndSurname: 'Name and surname (Ime i prezime)',
      gender: 'Gender (Spol)',
      cityAndCountry: 'City and Country (Mjesto i država)',
      yearOfBirth: 'Year of birth (Godina rođenja)',
      howDidYouFind: 'How did I find out about this program (Kako ste saznali za naš program)?',
      phone: 'Phone number (Kontakt broj)',
      maritalStatus: 'Marital status (Bračni status)',
      whyRegistering: 'Why am I registering for the meeting (Zašto se prijavljujem na susret) ?',
      occupation: 'Occupation / profession / job (Zanimanje/profesija/posao)',
      diet: 'Do you have a specific diet - vegetarian, gluten, allergies... (if so, which ones)? - Ukoliko imate posebnu prehranu navedite (bezglutenska, alergije, vegetarijanska...)',
      experience: 'Do I have (and if so, what kind of) experience of similar encounters (Imate li iskustvo sa sličnim susretima i kojima)?',
      questions: 'Do you have any questions or messages for the organizers? (Imate li pitanja za organizatore)',
      expectations: 'What do you expect from the meeting (Što očekujete od susreta)?',
      firaStatus: 'AKCIJA_FIRA_RACUN'
    }
  };
}

/**
 * Update configuration
 */
function updateConfiguration(config) {
  const scriptProperties = PropertiesService.getScriptProperties();

  if (config.apiKey !== undefined) {
    scriptProperties.setProperty('FIRA_API_KEY', config.apiKey);
  }

  if (config.apiUrl !== undefined) {
    scriptProperties.setProperty('FIRA_API_URL', config.apiUrl);
  }

  if (config.defaultInvoiceType !== undefined) {
    scriptProperties.setProperty('DEFAULT_INVOICE_TYPE', config.defaultInvoiceType);
  }

  if (config.defaultCurrency !== undefined) {
    scriptProperties.setProperty('DEFAULT_CURRENCY', config.defaultCurrency);
  }

  if (config.defaultPaymentType !== undefined) {
    scriptProperties.setProperty('DEFAULT_PAYMENT_TYPE', config.defaultPaymentType);
  }

  if (config.defaultTaxRate !== undefined) {
    scriptProperties.setProperty('DEFAULT_TAX_RATE', config.defaultTaxRate.toString());
  }

  if (config.defaultCountry !== undefined) {
    scriptProperties.setProperty('DEFAULT_COUNTRY', config.defaultCountry);
  }

  if (config.defaultServiceName !== undefined) {
    scriptProperties.setProperty('DEFAULT_SERVICE_NAME', config.defaultServiceName);
  }

  if (config.defaultPrice !== undefined) {
    scriptProperties.setProperty('DEFAULT_PRICE', config.defaultPrice.toString());
  }
}

/**
 * Setup wizard - advanced configuration
 */
function setupAdvancedConfiguration() {
  const ui = SpreadsheetApp.getUi();
  const config = getConfiguration();

  // Service Name
  const serviceNameResult = ui.prompt(
    'Naziv usluge',
    'Unesite naziv usluge koji će se prikazati na računu:\n(Trenutno: ' + config.defaultServiceName + ')',
    ui.ButtonSet.OK_CANCEL
  );

  if (serviceNameResult.getSelectedButton() === ui.Button.OK) {
    const serviceName = serviceNameResult.getResponseText().trim();
    if (serviceName) {
      updateConfiguration({ defaultServiceName: serviceName });
    }
  }

  // Default Price (if Payment column is empty)
  const priceResult = ui.prompt(
    'Zadana cijena',
    'Unesite zadanu cijenu (ako Payment stupac nije popunjen):\n(Trenutno: ' + config.defaultPrice + ')',
    ui.ButtonSet.OK_CANCEL
  );

  if (priceResult.getSelectedButton() === ui.Button.OK) {
    const price = parseFloat(priceResult.getResponseText().trim());
    if (!isNaN(price)) {
      updateConfiguration({ defaultPrice: price });
    }
  }

  ui.alert('Uspjeh', 'Napredne postavke su ažurirane!', ui.ButtonSet.OK);
}

/**
 * Reset configuration to defaults
 */
function resetConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const apiKey = scriptProperties.getProperty('FIRA_API_KEY'); // Save API key

  scriptProperties.deleteAllProperties();

  // Restore API key
  if (apiKey) {
    scriptProperties.setProperty('FIRA_API_KEY', apiKey);
  }

  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Resetirano',
    'Sve postavke su vraćene na zadane vrijednosti.\n\nAPI ključ je zadržan.',
    ui.ButtonSet.OK
  );
}

/**
 * Show current configuration (for debugging)
 */
function showConfiguration() {
  const config = getConfiguration();
  const ui = SpreadsheetApp.getUi();

  const configText =
    '=== FIRA API Postavke ===\n' +
    'API URL: ' + config.apiUrl + '\n' +
    'API Key: ' + (config.apiKey ? '✓ Postavljen (' + config.apiKey.slice(0, 4) + '...******)' : '✗ Nije postavljen') + '\n\n' +
    '=== Postavke računa ===\n' +
    'Vrsta: ' + config.defaultInvoiceType + '\n' +
    'Valuta: ' + config.defaultCurrency + '\n' +
    'Plaćanje: ' + config.defaultPaymentType + '\n' +
    'Porezna stopa: ' + (config.defaultTaxRate * 100) + '%\n' +
    'Država: ' + config.defaultCountry + '\n\n' +
    '=== Postavke usluge ===\n' +
    'Naziv usluge: ' + config.defaultServiceName + '\n' +
    'Zadana cijena: ' + config.defaultPrice + ' ' + config.defaultCurrency;

  ui.alert('Trenutne postavke', configText, ui.ButtonSet.OK);
}

/**
 * Add advanced configuration menu (call this from onOpen in Code.gs if needed)
 */
function addAdvancedMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('FIRA Advanced')
    .addItem('⚙️ Napredne postavke', 'setupAdvancedConfiguration')
    .addItem('🔄 Resetiraj postavke', 'resetConfiguration')
    .addItem('ℹ️ Prikaži postavke', 'showConfiguration')
    .addToUi();
}
