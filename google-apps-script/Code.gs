/**
 * FIRA.finance Google Sheets Integration
 *
 * This script adds a custom menu to Google Sheets with an action button
 * that creates invoices in FIRA.finance from selected rows.
 *
 * Setup:
 * 1. Open your Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Copy this code and Config.gs into the script editor
 * 4. Run setupFiraIntegration() once to set up your API key
 * 5. Reload the sheet
 *
 * Usage:
 * 1. Select a row with data
 * 2. Click "FIRA Actions" → "Create Invoice in FIRA"
 * 3. Wait for confirmation
 */

/**
 * Add custom menu when sheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('FIRA Actions')
    .addItem('Create Invoice in FIRA', 'createFiraInvoice')
    .addSeparator()
    .addItem('⚙️ Configure API Key', 'setupFiraIntegration')
    .addToUi();
}

/**
 * Setup wizard - configure FIRA API key
 */
function setupFiraIntegration() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.prompt(
    'FIRA.finance API Configuration',
    'Enter your FIRA API key:\n(Get it from https://app.fira.finance/settings/integrations)',
    ui.ButtonSet.OK_CANCEL
  );

  if (result.getSelectedButton() === ui.Button.OK) {
    const apiKey = result.getResponseText().trim();

    if (apiKey) {
      PropertiesService.getScriptProperties().setProperty('FIRA_API_KEY', apiKey);
      ui.alert('Success', 'FIRA API key saved successfully!', ui.ButtonSet.OK);
    } else {
      ui.alert('Error', 'API key cannot be empty', ui.ButtonSet.OK);
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
    ui.alert('Error', 'Please select a data row (not the header)', ui.ButtonSet.OK);
    return;
  }

  // Get configuration
  const config = getConfiguration();

  if (!config.apiKey) {
    ui.alert(
      'Configuration Required',
      'Please configure your FIRA API key first.\nGo to: FIRA Actions → Configure API Key',
      ui.ButtonSet.OK
    );
    return;
  }

  try {
    // Show loading message
    SpreadsheetApp.getActiveSpreadsheet().toast('Creating invoice in FIRA...', 'Processing', -1);

    // Get row data
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Build payload from row
    const payload = mapRowToPayload(headers, rowData, config);

    // Validate required fields
    const validation = validatePayload(payload);
    if (!validation.valid) {
      ui.alert('Validation Error', validation.error, ui.ButtonSet.OK);
      SpreadsheetApp.getActiveSpreadsheet().toast('Validation failed', 'Error', 3);
      return;
    }

    // Send to FIRA
    const response = sendToFira(payload, config);

    // Mark row as processed
    markRowAsProcessed(sheet, row, 'SUCCESS', new Date());

    // Show success message
    ui.alert(
      'Success!',
      'Invoice created successfully in FIRA.finance\n\nCheck your FIRA dashboard to view the invoice.',
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Invoice created successfully!', 'Success', 5);

  } catch (error) {
    Logger.log('Error creating FIRA invoice: ' + error.toString());

    // Mark row as failed
    markRowAsProcessed(sheet, row, 'ERROR: ' + error.message, new Date());

    // Show error to user
    ui.alert(
      'Error',
      'Failed to create invoice in FIRA:\n\n' + error.message + '\n\nCheck the status column for details.',
      ui.ButtonSet.OK
    );

    SpreadsheetApp.getActiveSpreadsheet().toast('Failed to create invoice', 'Error', 5);
  }
}

/**
 * Map sheet row to FIRA webhook payload
 */
function mapRowToPayload(headers, rowData, config) {
  // Create a map of column names to values
  const data = {};
  headers.forEach(function(header, index) {
    data[header] = rowData[index];
  });

  // Helper function to get value or default
  function getValue(key, defaultValue) {
    return data[key] !== undefined && data[key] !== '' ? data[key] : defaultValue;
  }

  // Helper function to parse number
  function getNumber(key, defaultValue) {
    const value = getValue(key, defaultValue);
    return typeof value === 'number' ? value : parseFloat(value) || defaultValue;
  }

  // Build line items
  const lineItems = [];
  const itemName = getValue('Product/Service', getValue('Product', getValue('Item', null)));
  const itemPrice = getNumber('Price', getNumber('Unit Price', 0));
  const itemQuantity = getNumber('Quantity', 1);
  const itemTaxRate = getNumber('Tax Rate', config.defaultTaxRate);

  if (itemName) {
    lineItems.push({
      name: itemName,
      description: getValue('Description', ''),
      lineItemId: 'ITEM-001',
      price: itemPrice,
      quantity: itemQuantity,
      unit: getValue('Unit', 'kom'),
      taxRate: itemTaxRate
    });
  }

  // Calculate totals
  const netto = itemPrice * itemQuantity;
  const taxValue = netto * itemTaxRate;
  const brutto = netto + taxValue;

  // Build billing address
  const billingAddress = {
    name: getValue('Customer Name', getValue('Name', '')),
    email: getValue('Email', getValue('Email Address', '')),
    company: getValue('Company', ''),
    address1: getValue('Address', getValue('Street Address', '')),
    city: getValue('City', ''),
    zipCode: getValue('ZIP Code', getValue('Postal Code', '')),
    country: getValue('Country', config.defaultCountry),
    phone: getValue('Phone', getValue('Phone Number', '')),
    oib: getValue('OIB', ''),
    vatNumber: getValue('VAT Number', getValue('VAT ID', ''))
  };

  // Parse timestamp
  let createdAt = new Date();
  if (data['Timestamp']) {
    createdAt = new Date(data['Timestamp']);
  }

  // Calculate due date (14 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  // Build complete payload
  const payload = {
    webshopOrderId: Math.floor(Math.random() * 1000000),
    webshopType: 'CUSTOM',
    webshopEvent: 'google_forms_submission',
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
    internalNote: 'Created from Google Forms via FIRA integration',
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
    errors.push('At least one line item is required (missing Product/Service name)');
  }

  if (!payload.billingAddress || !payload.billingAddress.name) {
    errors.push('Customer name is required');
  }

  if (!payload.billingAddress || !payload.billingAddress.email) {
    errors.push('Customer email is required');
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

  // FIRA API expects the payload as a query parameter (unusual but per their spec)
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
    throw new Error('Authentication failed - check your API key');
  } else if (responseCode === 400) {
    const errorData = JSON.parse(responseBody);
    const errorMessage = errorData.message || 'Bad request';
    throw new Error('Validation error: ' + errorMessage);
  } else {
    throw new Error('API error (HTTP ' + responseCode + '): ' + responseBody);
  }
}

/**
 * Mark row as processed with status and timestamp
 */
function markRowAsProcessed(sheet, row, status, timestamp) {
  // Find or create status column
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  let statusCol = headers.indexOf('FIRA Status') + 1;
  let timestampCol = headers.indexOf('FIRA Timestamp') + 1;

  // Create columns if they don't exist
  if (statusCol === 0) {
    statusCol = lastCol + 1;
    sheet.getRange(1, statusCol).setValue('FIRA Status');
  }

  if (timestampCol === 0) {
    timestampCol = lastCol + 2;
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
