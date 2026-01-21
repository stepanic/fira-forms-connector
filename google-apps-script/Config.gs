/**
 * FIRA.finance Configuration Module
 *
 * Handles configuration storage and retrieval for the FIRA integration
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

    // Column Mapping (can be customized)
    columnMapping: {
      customerName: scriptProperties.getProperty('COL_CUSTOMER_NAME') || 'Customer Name',
      email: scriptProperties.getProperty('COL_EMAIL') || 'Email',
      company: scriptProperties.getProperty('COL_COMPANY') || 'Company',
      address: scriptProperties.getProperty('COL_ADDRESS') || 'Address',
      city: scriptProperties.getProperty('COL_CITY') || 'City',
      zipCode: scriptProperties.getProperty('COL_ZIP') || 'ZIP Code',
      country: scriptProperties.getProperty('COL_COUNTRY') || 'Country',
      phone: scriptProperties.getProperty('COL_PHONE') || 'Phone',
      oib: scriptProperties.getProperty('COL_OIB') || 'OIB',
      vatNumber: scriptProperties.getProperty('COL_VAT') || 'VAT Number',
      product: scriptProperties.getProperty('COL_PRODUCT') || 'Product/Service',
      description: scriptProperties.getProperty('COL_DESCRIPTION') || 'Description',
      quantity: scriptProperties.getProperty('COL_QUANTITY') || 'Quantity',
      price: scriptProperties.getProperty('COL_PRICE') || 'Price',
      taxRate: scriptProperties.getProperty('COL_TAX_RATE') || 'Tax Rate'
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
}

/**
 * Reset configuration to defaults
 */
function resetConfiguration() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.deleteAllProperties();

  const ui = SpreadsheetApp.getUi();
  ui.alert('Configuration Reset', 'All configuration has been reset to defaults.', ui.ButtonSet.OK);
}

/**
 * Show current configuration (for debugging)
 */
function showConfiguration() {
  const config = getConfiguration();
  const ui = SpreadsheetApp.getUi();

  const configText =
    'API URL: ' + config.apiUrl + '\n' +
    'API Key: ' + (config.apiKey ? '***' + config.apiKey.slice(-4) : 'Not set') + '\n' +
    'Invoice Type: ' + config.defaultInvoiceType + '\n' +
    'Currency: ' + config.defaultCurrency + '\n' +
    'Payment Type: ' + config.defaultPaymentType + '\n' +
    'Tax Rate: ' + (config.defaultTaxRate * 100) + '%' + '\n' +
    'Country: ' + config.defaultCountry;

  ui.alert('Current Configuration', configText, ui.ButtonSet.OK);
}
