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
 * Parse timestamp from Google Forms format
 * Format: "21.1.2026. 12:10:13" -> ISO 8601
 */
function parseTimestamp(timestamp: string): string {
  if (!timestamp) {
    return new Date().toISOString();
  }

  try {
    // Format: DD.M.YYYY. HH:MM:SS
    const parts = timestamp.split(' ');
    const datePart = parts[0]; // "21.1.2026."
    const timePart = parts[1] || '00:00:00'; // "12:10:13"

    const dateParts = datePart.replace('.', '').split('.');
    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    const year = parseInt(dateParts[2], 10);

    const timeParts = timePart.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);
    const seconds = parseInt(timeParts[2], 10);

    const date = new Date(year, month, day, hours, minutes, seconds);
    return date.toISOString();
  } catch (error) {
    console.warn(chalk.yellow('Warning: Could not parse timestamp, using current time'));
    return new Date().toISOString();
  }
}

/**
 * Convert submission to FIRA webhook payload
 */
function submissionToPayload(submission: any, config: any): WebshopOrderModel {
  const { city, country } = parseCityAndCountry(submission.cityAndCountry);
  const createdAt = parseTimestamp(submission.timestamp);
  const payment = parseFloat(submission.payment) || config.defaultPrice || 0;
  const taxRate = config.defaultTaxRate || 0.25;

  // Calculate totals
  const netto = payment;
  const taxValue = netto * taxRate;
  const brutto = netto + taxValue;

  // Calculate due date (14 days from now)
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);
  const dueDateStr = dueDate.toISOString().split('T')[0];

  // Build internal note
  const internalNoteParts = [
    'Registracija iz Google Forms',
    submission.gender ? `Spol: ${submission.gender}` : '',
    submission.yearOfBirth ? `Godina rođenja: ${submission.yearOfBirth}` : '',
    submission.occupation ? `Zanimanje: ${submission.occupation}` : '',
    submission.howDidYouFind ? `Kako saznali: ${submission.howDidYouFind}` : '',
    submission.diet ? `Prehrana: ${submission.diet}` : '',
    submission.experience ? `Iskustvo: ${submission.experience}` : '',
    submission.whyRegistering ? `Razlog: ${submission.whyRegistering}` : '',
    submission.expectations ? `Očekivanja: ${submission.expectations}` : '',
    submission.questions ? `Pitanja: ${submission.questions}` : ''
  ];

  const internalNote = internalNoteParts.filter(p => p).join('\n');

  // Build payload
  const payload: WebshopOrderModel = {
    webshopOrderId: Math.floor(Math.random() * 1000000),
    webshopType: 'CUSTOM',
    webshopEvent: 'google_forms_registration',
    webshopOrderNumber: `GF-${Date.now()}`,
    invoiceType: config.invoiceType || 'PONUDA',
    paymentGatewayCode: 'google-forms',
    paymentGatewayName: 'Google Forms',
    createdAt: createdAt,
    dueDate: dueDateStr,
    currency: config.currency || 'EUR',
    taxesIncluded: true,
    billingAddress: {
      name: submission.nameAndSurname,
      email: submission.email,
      city: city,
      country: country,
      phone: submission.phone,
      address1: '',
      zipCode: '',
      company: '',
      oib: '',
      vatNumber: ''
    },
    taxValue: taxValue,
    brutto: brutto,
    netto: netto,
    lineItems: [
      {
        name: config.serviceName || 'Registracija za susret',
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
    totalShipping: {
      name: 'Shipping',
      price: 0,
      quantity: 1,
      unit: 'usluga',
      taxRate: taxRate
    }
  };

  return payload;
}

/**
 * Send webhook to FIRA API
 */
async function sendWebhook(payload: WebshopOrderModel): Promise<void> {
  const apiKey = process.env.FIRA_API_KEY;
  const apiUrl = process.env.FIRA_API_URL || 'https://app.fira.finance';

  if (!apiKey) {
    console.error(chalk.red('❌ Error: FIRA_API_KEY not found in environment variables'));
    console.log(chalk.yellow('Please create a .env file with your FIRA API key'));
    console.log(chalk.gray('Example: FIRA_API_KEY=your_api_key_here'));
    process.exit(1);
  }

  console.log(chalk.blue('🚀 Sending webhook to FIRA...'));
  console.log(chalk.gray(`   Endpoint: ${apiUrl}/api/v1/webshop/order/custom`));
  console.log(chalk.gray(`   Invoice Type: ${payload.invoiceType}`));
  console.log(chalk.gray(`   Customer: ${payload.billingAddress?.name}`));
  console.log(chalk.gray(`   Email: ${payload.billingAddress?.email}`));
  console.log(chalk.gray(`   Amount: ${payload.brutto} ${payload.currency}`));
  console.log('');

  try {
    const response = await axios.post(
      `${apiUrl}/api/v1/webshop/order/custom`,
      null,
      {
        params: {
          webshopModel: JSON.stringify(payload)
        },
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log(chalk.green('✅ Success! Invoice created in FIRA'));
    console.log('');
    console.log(chalk.bold('Response:'));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('');
    console.log(chalk.green('🎉 Check your FIRA dashboard: https://app.fira.finance'));

  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorDetails>;

      console.log(chalk.red('❌ Error: Failed to create invoice'));
      console.log('');

      if (axiosError.response) {
        const status = axiosError.response.status;
        const errorData = axiosError.response.data;

        console.log(chalk.yellow(`Status Code: ${status}`));

        if (status === 401) {
          console.log(chalk.red('Authentication failed - check your API key'));
        } else if (status === 400) {
          console.log(chalk.red('Bad Request - validation errors:'));
          if (errorData?.validationErrors) {
            errorData.validationErrors.forEach(err => {
              console.log(chalk.gray(`  - ${err.fieldName}: ${err.message}`));
            });
          }
        }

        console.log('');
        console.log(chalk.bold('Error Details:'));
        console.log(JSON.stringify(errorData, null, 2));

      } else if (axiosError.request) {
        console.log(chalk.red('No response received from server'));
        console.log(chalk.gray('Check your internet connection and API URL'));
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
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE || '0.25'),
    defaultPrice: parseFloat(process.env.DEFAULT_PRICE || '100'),
    serviceName: process.env.DEFAULT_SERVICE_NAME || 'Registracija za susret'
  };

  console.log(chalk.blue('⚙️  Configuration:'));
  console.log(chalk.gray('  Invoice Type: ' + config.invoiceType));
  console.log(chalk.gray('  Currency: ' + config.currency));
  console.log(chalk.gray('  Tax Rate: ' + (config.defaultTaxRate * 100) + '%'));
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
  console.log(chalk.gray('  Tax: ' + payload.taxValue + ' ' + payload.currency));
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
