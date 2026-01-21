#!/usr/bin/env node

/**
 * FIRA.finance - Simple Payload Test
 *
 * Tests sending a sample payload from examples/sample-payload-registration.json
 * Or use TEST_REAL=true to test with real submission data
 */

import axios from 'axios';
import chalk from 'chalk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
dotenv.config();

async function main() {
  console.log(chalk.blue.bold('🧪 FIRA.finance - Sample Payload Test'));
  console.log('');

  const apiKey = process.env.FIRA_API_KEY;
  const apiUrl = process.env.FIRA_API_URL || 'https://app.fira.finance';
  const debugMode = process.env.DEBUG === 'true' || process.env.DEBUG === '1';
  const testReal = process.env.TEST_REAL === 'true';

  if (!apiKey) {
    console.error(chalk.red('❌ Error: FIRA_API_KEY not found'));
    process.exit(1);
  }

  let rawPayload: any;

  if (testReal) {
    // Use real submission data (like test:real but with fixes)
    console.log(chalk.yellow('📋 Using REAL submission data (with sanitization)'));

    // Test with ASCII-only characters to isolate encoding issues
    rawPayload = {
      webshopOrderId: Math.floor(Math.random() * 1000000),
      webshopType: "CUSTOM",
      webshopEvent: "google_forms_registration",
      webshopOrderNumber: `GF-${Date.now()}`,
      invoiceType: "RAČUN",
      paymentGatewayCode: "google-forms",
      paymentGatewayName: "Google Forms",
      createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      currency: "EUR",
      taxesIncluded: false,
      billingAddress: {
        name: "Matija Stepanić",  // ASCII only - no ć
        email: "stepanic.matija@gmail.com",
        city: "Lukavec",
        country: "HR",
        phone: "+385989679022",
        address1: "",
        zipCode: "",
        company: "",
        oib: "",
        vatNumber: ""
      },
      shippingAddress: {
        name: "Matija Stepanic",
        city: "Lukavec",
        country: "HR"
      },
      taxValue: 0,
      brutto: 100,
      netto: 100,
      lineItems: [
        {
          name: "Registracija za susret",
          description: "Registracija sudionika: Matija Stepanić",
          lineItemId: "REG-001",
          price: 100,
          quantity: 1,
          unit: "usluga",
          taxRate: 0
        }
      ],
      discounts: [],
      totalShipping: {
        name: "Shipping",
        price: 0,
        quantity: 1,
        unit: "usluga",
        taxRate: 0
      },
      // ASCII-only internalNote
      internalNote: "Registracija iz Google Forms\nSpol: Male (muški)\nGodina rođenja: 1990\nZanimanje: Programer",
      //  internalNote: sanitizeString("Registracija iz Google Forms\nSpol: Male (muški)\nGodina rođenja: 1990\nZanimanje: Programer\nKako saznali: Through friends / acquaintances\nPrehrana: Nemam\nIskustvo: Razne konferencije :D\nRazlog: FIRA.finance testiranje izrade računa sa Google Scripts i sa Claude Desktop (Code)\nOčekivanja: Da mogu dobiti fiskalizirani racun :))\nPitanja: Bok Tomislav, ovo je proba"),
      paymentType: "TRANSAKCIJSKI",
      termsHR: ""
    };
  } else {
    // Read sample payload from file
    const payloadPath = path.join(__dirname, '../examples/sample-payload-registration.json');
    console.log(chalk.gray(`📄 Reading payload from: ${payloadPath}`));
    rawPayload = JSON.parse(fs.readFileSync(payloadPath, 'utf-8'));
  }

  // Prepare payload
  let payload: any;

  if (testReal) {
    // Already prepared above
    payload = rawPayload;
  } else {
    // Modify sample payload for non-PDV business
    payload = {
      ...rawPayload,
      webshopOrderId: Math.floor(Math.random() * 1000000),
      webshopOrderNumber: `GF-TEST-${Date.now()}`,
      createdAt: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // Remove taxes for non-PDV business
      taxesIncluded: false,
      taxValue: 0,
      brutto: 100,  // Same as netto when no tax
      netto: 100,
      lineItems: rawPayload.lineItems.map((item: any) => ({
        ...item,
        taxRate: 0
      })),
      totalShipping: {
        ...rawPayload.totalShipping,
        taxRate: 0
      }
    };
  }

  console.log(chalk.green('✅ Payload prepared (no VAT):'));
  console.log(chalk.gray(`   Order ID: ${payload.webshopOrderId}`));
  console.log(chalk.gray(`   Order Number: ${payload.webshopOrderNumber}`));
  console.log(chalk.gray(`   Customer: ${payload.billingAddress.name}`));
  console.log(chalk.gray(`   Amount: ${payload.brutto} ${payload.currency}`));
  console.log('');

  if (debugMode) {
    console.log(chalk.magenta('📋 Full Payload:'));
    console.log(chalk.gray('─'.repeat(80)));
    console.log(JSON.stringify(payload, null, 2));
    console.log(chalk.gray('─'.repeat(80)));
    console.log('');
  }

  // Send to FIRA
  const endpoint = `${apiUrl}/api/v1/webshop/order/custom`;

  console.log(chalk.blue('🚀 Sending to FIRA...'));
  console.log(chalk.gray(`   Endpoint: ${endpoint}`));
  console.log('');

  try {
    const response = await axios.post(
      endpoint,
      payload,
      {
        headers: {
          'FIRA-Api-Key': apiKey,
          'Content-Type': 'application/json'
        },
        timeout: 30000,
        validateStatus: () => true
      }
    );

    console.log(chalk.cyan(`Response Status: ${response.status} ${response.statusText}`));
    console.log('');

    if (debugMode) {
      console.log(chalk.magenta('Response Headers:'));
      Object.entries(response.headers).forEach(([key, value]) => {
        console.log(chalk.gray(`   ${key}: ${value}`));
      });
      console.log('');
    }

    console.log(chalk.bold('Response Body:'));
    if (typeof response.data === 'string') {
      console.log(response.data || '(empty)');
    } else {
      console.log(JSON.stringify(response.data, null, 2));
    }

    if (response.status >= 200 && response.status < 300) {
      console.log('');
      console.log(chalk.green('✅ Success!'));
    } else {
      console.log('');
      console.log(chalk.red('❌ Failed'));
      process.exit(1);
    }

  } catch (error: any) {
    console.error(chalk.red('❌ Request failed:'), error.message);
    process.exit(1);
  }
}

main();
