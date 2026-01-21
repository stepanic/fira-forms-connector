#!/usr/bin/env node

/**
 * FIRA.finance Real Submission Testing CLI
 *
 * Testira stvarni submission iz Google Forme s vašim podacima
 */

import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import { WebshopOrderModel, ErrorDetails } from '../types/fira';

// Load environment variables
dotenv.config();

/**
 * Parse Google Forms submission row
 * Separator: -----
 */
function parseSubmissionRow(rowData: string): any {
  const columns = rowData.split('-----');

  // Remove any trailing empty columns
  while (columns.length > 0 && columns[columns.length - 1].trim() === '') {
    columns.pop();
  }

  return {
    timestamp: columns[0]?.trim() || '',
    email: columns[1]?.trim() || '',
    payment: columns[2]?.trim() || '',
    nameAndSurname: columns[3]?.trim() || '',
    gender: columns[4]?.trim() || '',
    cityAndCountry: columns[5]?.trim() || '',
    yearOfBirth: columns[6]?.trim() || '',
    howDidYouFind: columns[7]?.trim() || '',
    phone: columns[8]?.trim() || '',
    confMail: columns[9]?.trim() || '',
    maritalStatus: columns[10]?.trim() || '',
    whyRegistering: columns[11]?.trim() || '',
    occupation: columns[12]?.trim() || '',
    diet: columns[13]?.trim() || '',
    experience: columns[14]?.trim() || '',
    questions: columns[15]?.trim() || '',
    expectations: columns[16]?.trim() || '',
    notice: columns[17]?.trim() || '',
    akcija: columns[18]?.trim() || ''
  };
}

/**
 * Parse City and Country field
 * Format: "City, Country" -> { city: "City", country: "HR" }
 */
function parseCityAndCountry(cityAndCountry: string): { city: string; country: string } {
  let city = '';
  let country = 'HR'; // Default

  if (!cityAndCountry) {
    return { city, country };
  }

  const parts = cityAndCountry.split(',');

  if (parts.length > 0) {
    city = parts[0].trim();
  }

  if (parts.length > 1) {
    const countryName = parts[1].trim().toLowerCase();

    // Map country names to ISO codes
    if (countryName.includes('croat') || countryName.includes('hrvat')) {
      country = 'HR';
    } else if (countryName.includes('german') || countryName.includes('njemač')) {
      country = 'DE';
    } else if (countryName.includes('austri')) {
      country = 'AT';
    } else if (countryName.includes('sloven')) {
      country = 'SI';
    } else if (countryName.includes('serb') || countryName.includes('srb')) {
      country = 'RS';
    } else if (countryName.includes('bosn') || countryName.includes('bosnia')) {
      country = 'BA';
    } else if (countryName.includes('italy') || countryName.includes('italija')) {
      country = 'IT';
    }
  }

  return { city, country };
}

/**
 * Format date to ISO without milliseconds (FIRA API format)
 * Input: Date object
 * Output: "2025-11-11T22:56:00Z"
 */
function formatDateTimeForFira(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/**
 * Format date to YYYY-MM-DD (FIRA API date format)
 */
function formatDateForFira(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Convert submission to FIRA webhook payload
 */
function submissionToPayload(submission: any, config: any): WebshopOrderModel {
  const { city, country } = parseCityAndCountry(submission.cityAndCountry);
  const payment = parseFloat(submission.payment) || config.defaultPrice || 0;

  // Check if VAT/PDV is enabled (default: false for non-PDV businesses)
  const vatEnabled = config.vatEnabled === true;
  const taxRate = vatEnabled ? (config.defaultTaxRate || 0.25) : 0;

  // Calculate totals (no tax if VAT not enabled)
  const netto = payment;
  const taxValue = vatEnabled ? netto * taxRate : 0;
  const brutto = netto + taxValue;

  // Calculate dates
  const now = new Date();
  const createdAt = formatDateTimeForFira(now);

  const dueDate = new Date(now);
  dueDate.setDate(dueDate.getDate() + 14);
  const dueDateStr = formatDateForFira(dueDate);

  // Build internal note (limited to 250 chars due to FIRA API database limit)
  const MAX_INTERNAL_NOTE_LENGTH = 250;
  const internalNoteParts = [
    'Registracija iz Google Forms',
    submission.gender ? `Spol: ${submission.gender}` : '',
    submission.yearOfBirth ? `Godina rođenja: ${submission.yearOfBirth}` : '',
    submission.occupation ? `Zanimanje: ${submission.occupation}` : ''
  ];

  let internalNote = internalNoteParts.filter(p => p).join('\n');
  if (internalNote.length > MAX_INTERNAL_NOTE_LENGTH) {
    internalNote = internalNote.substring(0, MAX_INTERNAL_NOTE_LENGTH - 3) + '...';
  }

  // Build payload matching FIRA API spec exactly
  const payload: WebshopOrderModel = {
    webshopOrderId: Math.floor(Math.random() * 1000000),
    webshopType: 'CUSTOM',
    webshopEvent: 'google_forms_registration',
    // webshopOrderNumber: `GF-${Date.now()}`,
    // webshopOrderNumber: `GF-${submission.timestamp}`,
    invoiceType: config.invoiceType || 'PONUDA',
    paymentGatewayCode: 'google-forms',
    // paymentGatewayName: 'Google Forms',
    createdAt: createdAt,
    dueDate: dueDateStr,
    currency: config.currency || 'EUR',
    taxesIncluded: vatEnabled,
    billingAddress: {
      name: submission.nameAndSurname,
      email: submission.email,
      city: city,
      country: country,
      phone: submission.phone || '',
      address1: '',
      zipCode: '',
      company: '',
      oib: '',
      vatNumber: ''
    },
    shippingAddress: {
      name: submission.nameAndSurname,
      city: 'Osijek',  // Delivery place
      country: 'HR'
    },
    taxValue: taxValue,
    brutto: brutto,
    netto: netto,
    lineItems: [
      {
        name: config.serviceName || 'Kotizacija za Međunarodni susret Zagreb',
        description: `Registracija sudionika: ${submission.nameAndSurname}`,
        lineItemId: 'REG-001',
        price: payment,
        quantity: 1,
        unit: 'usluga',
        taxRate: taxRate
      }
    ],
    internalNote: internalNote,
    paymentType: config.paymentType || 'TRANSAKCIJSKI',
    discounts: [],
    // totalShipping: {
    //   name: 'Shipping',
    //   price: 0,
    //   quantity: 1,
    //   unit: 'usluga',
    //   taxRate: taxRate
    // },
    // totalShipping: {},
    termsHR: 'Oslobođeno od plaćanja PDV-a sukladno čl. 90. st. 1. Zakona o porezu na dodanu vrijednost.'
  };

  return payload;
}

/**
 * Send webhook to FIRA API
 */
async function sendWebhook(payload: WebshopOrderModel): Promise<void> {
  const apiKey = process.env.FIRA_API_KEY;
  const apiUrl = process.env.FIRA_API_URL || 'https://app.fira.finance';
  const debugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1';

  if (!apiKey) {
    console.error(chalk.red('❌ Error: FIRA_API_KEY not found in environment variables'));
    console.log(chalk.yellow('Please create a .env file with your FIRA API key'));
    console.log(chalk.gray('Example: FIRA_API_KEY=your_api_key_here'));
    process.exit(1);
  }

  const endpoint = `${apiUrl}/api/v1/webshop/order/custom`;
  const requestHeaders = {
    'FIRA-Api-Key': apiKey,
    'Content-Type': 'application/json'
  };

  console.log(chalk.blue('🚀 Sending webhook to FIRA...'));
  console.log(chalk.gray(`   Endpoint: ${endpoint}`));
  console.log(chalk.gray(`   Invoice Type: ${payload.invoiceType}`));
  console.log(chalk.gray(`   Customer: ${payload.billingAddress?.name}`));
  console.log(chalk.gray(`   Email: ${payload.billingAddress?.email}`));
  console.log(chalk.gray(`   Amount: ${payload.brutto} ${payload.currency}`));
  console.log('');

  // Prepare the JSON payload
  const jsonPayload = JSON.stringify(payload);
  const encodedPayload = encodeURIComponent(jsonPayload);

  // Debug: Show request details
  if (debugMode) {
    console.log(chalk.magenta('🔍 DEBUG - Request Details:'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log(chalk.cyan('Request Headers:'));
    console.log(chalk.gray(`   FIRA-Api-Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`));
    console.log(chalk.gray(`   Content-Type: ${requestHeaders['Content-Type']}`));
    console.log(chalk.cyan('API Key Info:'));
    console.log(chalk.gray(`   Length: ${apiKey.length} characters`));
    console.log(chalk.gray(`   First 8 chars: ${apiKey.substring(0, 8)}`));
    console.log(chalk.gray(`   Last 4 chars: ${apiKey.substring(apiKey.length - 4)}`));
    console.log(chalk.gray(`   Contains whitespace: ${/\s/.test(apiKey)}`));
    console.log(chalk.gray(`   Contains newline: ${/[\r\n]/.test(apiKey)}`));
    console.log(chalk.cyan('Payload Info:'));
    console.log(chalk.gray(`   JSON length: ${jsonPayload.length} chars`));
    console.log(chalk.gray(`   URL-encoded length: ${encodedPayload.length} chars`));
    console.log(chalk.gray(`   Full URL length: ${endpoint.length + 14 + encodedPayload.length} chars`));
    console.log(chalk.cyan('Full Request URL:'));
    console.log(chalk.gray(`   ${endpoint}?webshopModel=${encodedPayload.substring(0, 200)}...`));
    console.log(chalk.gray('─'.repeat(80)));
    console.log('');
  }

  // Try different request methods based on env var
  const useBodyMethod = process.env.FIRA_USE_BODY === 'true';

  try {
    let response;

    if (useBodyMethod) {
      // Method 2: Send JSON in request body
      if (debugMode) {
        console.log(chalk.cyan('Using method: JSON in request BODY'));
      }
      response = await axios.post(
        endpoint,
        payload,
        {
          headers: requestHeaders,
          timeout: 30000,
          validateStatus: () => true
        }
      );
    } else {
      // Method 1: Send JSON as query parameter (per OpenAPI spec)
      if (debugMode) {
        console.log(chalk.cyan('Using method: JSON in QUERY parameter'));
      }
      response = await axios.post(
        endpoint,
        null,
        {
          params: {
            webshopModel: jsonPayload
          },
          headers: requestHeaders,
          timeout: 30000,
          validateStatus: () => true
        }
      );
    }

    // Debug: Show response details
    if (debugMode) {
      console.log(chalk.magenta('🔍 DEBUG - Response Details:'));
      console.log(chalk.gray('─'.repeat(80)));
      console.log(chalk.cyan('Response Status:'), response.status, response.statusText);
      console.log(chalk.cyan('Response Headers:'));
      Object.entries(response.headers).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}: ${value}`));
      });
      console.log(chalk.cyan('Response Data (raw):'));
      console.log(chalk.gray(`   Type: ${typeof response.data}`));
      console.log(chalk.gray(`   Value: ${JSON.stringify(response.data)}`));
      console.log(chalk.gray('─'.repeat(80)));
      console.log('');
    }

    // Check if request was successful
    if (response.status >= 200 && response.status < 300) {
      console.log(chalk.green('✅ Success! Invoice created in FIRA'));
      console.log('');
      console.log(chalk.bold('Response:'));
      console.log(JSON.stringify(response.data, null, 2));
      console.log('');
      console.log(chalk.green('🎉 Check your FIRA dashboard: https://app.fira.finance'));
    } else {
      // Handle error responses
      const status = response.status;
      const errorData = response.data;

      console.log(chalk.red('❌ Error: Failed to create invoice'));
      console.log('');
      console.log(chalk.yellow(`Status Code: ${status} ${response.statusText}`));

      if (status === 401) {
        console.log(chalk.red('Authentication failed - check your API key'));
        console.log('');
        console.log(chalk.yellow('Possible causes:'));
        console.log(chalk.gray('  1. API key is invalid or expired'));
        console.log(chalk.gray('  2. API key has extra whitespace or newlines'));
        console.log(chalk.gray('  3. API key is for wrong environment (test vs production)'));
        console.log(chalk.gray('  4. Bearer token format might be wrong'));
        console.log('');
        console.log(chalk.yellow('Try running with DEBUG=true for more details:'));
        console.log(chalk.gray('  DEBUG=true npm run test:real'));
      } else if (status === 400) {
        console.log(chalk.red('Bad Request - validation errors:'));
        if (errorData?.validationErrors) {
          errorData.validationErrors.forEach((err: any) => {
            console.log(chalk.gray(`  - ${err.fieldName}: ${err.message}`));
          });
        }
      } else if (status === 403) {
        console.log(chalk.red('Forbidden - API key may not have required permissions'));
      } else if (status === 404) {
        console.log(chalk.red('Not Found - endpoint may be incorrect'));
      } else if (status >= 500) {
        console.log(chalk.red('Server Error - FIRA API may be experiencing issues'));
      }

      console.log('');
      console.log(chalk.bold('Response Headers:'));
      const relevantHeaders = ['content-type', 'www-authenticate', 'x-request-id', 'x-error-code', 'x-error-message'];
      relevantHeaders.forEach(header => {
        if (response.headers[header]) {
          console.log(chalk.gray(`  ${header}: ${response.headers[header]}`));
        }
      });

      console.log('');
      console.log(chalk.bold('Response Body:'));
      if (errorData) {
        if (typeof errorData === 'string') {
          console.log(chalk.gray(errorData || '(empty string)'));
        } else {
          console.log(JSON.stringify(errorData, null, 2));
        }
      } else {
        console.log(chalk.gray('(no response body)'));
      }

      process.exit(1);
    }

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorDetails>;

      console.log(chalk.red('❌ Error: Request failed'));
      console.log('');

      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;

        console.log(chalk.yellow(`Status Code: ${status}`));

        // Debug: Full response
        if (debugMode) {
          console.log(chalk.magenta('🔍 DEBUG - Error Response:'));
          console.log(chalk.gray('─'.repeat(80)));
          console.log(chalk.cyan('Response Headers:'));
          Object.entries(axiosError.response.headers).forEach(([key, value]) => {
            console.log(chalk.gray(`   ${key}: ${value}`));
          });
          console.log(chalk.cyan('Response Data:'));
          console.log(JSON.stringify(errorData, null, 2));
          console.log(chalk.gray('─'.repeat(80)));
        }

        console.log('');
        console.log(chalk.bold('Error Details:'));
        console.log(JSON.stringify(errorData, null, 2));

      } else if (axiosError.request) {
        console.log(chalk.red('No response received from server'));
        console.log(chalk.gray('Check your internet connection and API URL'));

        if (debugMode) {
          console.log(chalk.magenta('🔍 DEBUG - Request that failed:'));
          console.log(chalk.gray(`   Method: ${axiosError.request.method}`));
          console.log(chalk.gray(`   Path: ${axiosError.request.path}`));
        }
      } else {
        console.log(chalk.red(`Request setup error: ${axiosError.message}`));
      }
    } else {
      console.log(chalk.red('Unexpected error:'));
      console.log(error);
    }

    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log(chalk.blue.bold('🧪 FIRA.finance - Real Submission Test'));
  console.log(chalk.gray('Testing with actual Google Forms submission data'));
  console.log('');

  // Your real submission data
  const realSubmission = `21.1.2026. 12:10:13-----stepanic.matija@gmail.com----------Matija Stepanić-----Male (muški)-----Lukavec, Hrvatska-----1990-----Through friends / acquaintances-----+385989679022----------Unmarried - in a relationship (slobodan/na - u vezi)-----FIRA.finance testiranje izrade računa sa Google Scripts i sa Claude Desktop (Code)-----Programer-----Nemam-----Razne konferencije :D-----Bok Tomislav, ovo je proba-----Da mogu dobiti fiskalizirani racun :)) ✝️❤️🇭🇷-----I am familiar with the information contained in the notice on the processing of personal data and documentation of the organizer's activities (Upoznat/a sam s informacijama sadržanim u obavijesti o obradi osobnih podataka i dokumentaciji aktivnosti organizatora), I would like to subscribe to the Newsletter (Želim primati Newsletter obavijesti)------------------------------‚‚`;

  // Parse submission
  console.log(chalk.blue('📄 Parsing submission data...'));
  const submission = parseSubmissionRow(realSubmission);

  console.log(chalk.green('✅ Parsed submission:'));
  console.log(chalk.gray('  Name: ' + submission.nameAndSurname));
  console.log(chalk.gray('  Email: ' + submission.email));
  console.log(chalk.gray('  Payment: ' + submission.payment));
  console.log(chalk.gray('  City/Country: ' + submission.cityAndCountry));
  console.log(chalk.gray('  Phone: ' + submission.phone));
  console.log(chalk.gray('  Gender: ' + submission.gender));
  console.log(chalk.gray('  Year of Birth: ' + submission.yearOfBirth));
  console.log(chalk.gray('  Occupation: ' + submission.occupation));
  console.log('');

  // Configuration
  const config = {
    invoiceType: process.env.DEFAULT_INVOICE_TYPE || 'PONUDA',
    currency: process.env.DEFAULT_CURRENCY || 'EUR',
    paymentType: process.env.DEFAULT_PAYMENT_TYPE || 'TRANSAKCIJSKI',
    vatEnabled: process.env.VAT_ENABLED === 'true',
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.25'),
    defaultPrice: parseFloat(process.env.DEFAULT_PRICE || '80'),
    serviceName: process.env.DEFAULT_SERVICE_NAME || 'Kotizacija za Međunarodni susret Zagreb'
  };

  console.log(chalk.blue('⚙️  Configuration:'));
  console.log(chalk.gray('  Invoice Type: ' + config.invoiceType));
  console.log(chalk.gray('  Currency: ' + config.currency));
  console.log(chalk.gray('  VAT/PDV Enabled: ' + (config.vatEnabled ? 'Yes' : 'No')));
  if (config.vatEnabled) {
    console.log(chalk.gray('  Tax Rate: ' + (config.defaultTaxRate * 100) + '%'));
  }
  console.log(chalk.gray('  Default Price: ' + config.defaultPrice + ' ' + config.currency));
  console.log(chalk.gray('  Service Name: ' + config.serviceName));
  console.log('');

  // Convert to payload
  console.log(chalk.blue('🔄 Converting to FIRA payload...'));
  const payload = submissionToPayload(submission, config);

  console.log(chalk.green('✅ Payload created:'));
  console.log(chalk.gray('  Order ID: ' + payload.webshopOrderId));
  console.log(chalk.gray('  Order Number: ' + payload.webshopOrderNumber));
  console.log(chalk.gray('  Netto: ' + payload.netto + ' ' + payload.currency));
  if (config.vatEnabled) {
    console.log(chalk.gray('  Tax: ' + payload.taxValue + ' ' + payload.currency));
  } else {
    console.log(chalk.gray('  Tax: N/A (VAT not enabled)'));
  }
  console.log(chalk.gray('  Brutto: ' + payload.brutto + ' ' + payload.currency));
  console.log('');

  // Show full payload
  console.log(chalk.bold('📋 Full Payload:'));
  console.log(chalk.gray('─'.repeat(80)));
  console.log(JSON.stringify(payload, null, 2));
  console.log(chalk.gray('─'.repeat(80)));
  console.log('');

  // Ask for confirmation
  console.log(chalk.yellow('⚠️  This will create a real invoice in FIRA!'));
  console.log(chalk.gray('Press Ctrl+C to cancel, or wait 3 seconds to continue...'));
  console.log('');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Send to FIRA
  await sendWebhook(payload);
}

// Run
main().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});
