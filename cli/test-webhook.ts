#!/usr/bin/env node

/**
 * FIRA.finance Webhook Testing CLI
 * Test the FIRA webhook locally from the command line
 */

import * as fs from 'fs';
import * as path from 'path';
import axios, { AxiosError } from 'axios';
import chalk from 'chalk';
import { Command } from 'commander';
import * as dotenv from 'dotenv';
import Joi from 'joi';
import { WebshopOrderModel, ErrorDetails } from '../types/fira';

// Load environment variables
dotenv.config();

const program = new Command();

// Validation schema for FIRA webhook payload
const webhookSchema = Joi.object({
  webshopOrderId: Joi.number().optional(),
  webshopType: Joi.string().valid('WOO_COMMERCE', 'SHOPIFY', 'CUSTOM').optional(),
  webshopEvent: Joi.string().optional(),
  webshopOrderNumber: Joi.string().optional(),
  invoiceType: Joi.string().valid('PONUDA', 'RAČUN', 'FISKALNI_RAČUN').required(),
  paymentGatewayCode: Joi.string().optional(),
  paymentGatewayName: Joi.string().optional(),
  createdAt: Joi.string().isoDate().optional(),
  dueDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  validTo: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  currency: Joi.string().optional(),
  taxesIncluded: Joi.boolean().optional(),
  billingAddress: Joi.object().optional(),
  shippingAddress: Joi.object().optional(),
  taxValue: Joi.number().optional(),
  brutto: Joi.number().optional(),
  netto: Joi.number().optional(),
  discounts: Joi.array().optional(),
  totalShipping: Joi.object().optional(),
  customerLocale: Joi.string().optional(),
  lineItems: Joi.array().min(1).required(),
  internalNote: Joi.string().optional(),
  paymentType: Joi.string().valid('GOTOVINA', 'TRANSAKCIJSKI', 'KARTICA').optional(),
  termsHR: Joi.string().optional(),
  termsEN: Joi.string().optional(),
  termsDE: Joi.string().optional(),
}).unknown(true);

/**
 * Validate the webhook payload
 */
function validatePayload(payload: WebshopOrderModel): { valid: boolean; error?: string } {
  const { error } = webhookSchema.validate(payload, { abortEarly: false });

  if (error) {
    return {
      valid: false,
      error: error.details.map(d => `${d.path.join('.')}: ${d.message}`).join('\n')
    };
  }

  return { valid: true };
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
  console.log('');

  try {
    // Note: FIRA API uses query parameters for the payload (unusual but per their spec)
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
 * Load sample payload
 */
function loadSamplePayload(): WebshopOrderModel {
  const samplePath = path.join(__dirname, '../examples/sample-payload.json');

  if (!fs.existsSync(samplePath)) {
    console.error(chalk.red('❌ Error: sample-payload.json not found'));
    process.exit(1);
  }

  const content = fs.readFileSync(samplePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Main program
 */
program
  .name('test-webhook')
  .description('Test FIRA.finance webhook integration')
  .version('1.0.0');

program
  .option('-s, --sample', 'Use sample payload from examples/sample-payload.json')
  .option('-f, --file <path>', 'Load payload from JSON file')
  .option('-i, --invoice-type <type>', 'Invoice type (PONUDA, RAČUN, FISKALNI_RAČUN)', 'PONUDA')
  .option('--validate-only', 'Only validate payload without sending')
  .action(async (options) => {
    let payload: WebshopOrderModel;

    // Load payload
    if (options.sample) {
      console.log(chalk.blue('📄 Loading sample payload...'));
      payload = loadSamplePayload();
    } else if (options.file) {
      console.log(chalk.blue(`📄 Loading payload from ${options.file}...`));
      const content = fs.readFileSync(options.file, 'utf-8');
      payload = JSON.parse(content);
    } else {
      console.log(chalk.yellow('⚠️  No payload specified'));
      console.log(chalk.gray('Usage: npm run test:webhook -- --sample'));
      console.log(chalk.gray('   or: npm run test:webhook -- --file path/to/payload.json'));
      process.exit(1);
    }

    // Override invoice type if specified
    if (options.invoiceType) {
      payload.invoiceType = options.invoiceType as any;
    }

    // Validate payload
    console.log(chalk.blue('🔍 Validating payload...'));
    const validation = validatePayload(payload);

    if (!validation.valid) {
      console.log(chalk.red('❌ Validation failed:'));
      console.log(chalk.gray(validation.error));
      process.exit(1);
    }

    console.log(chalk.green('✅ Payload is valid'));
    console.log('');

    // If validate-only, exit here
    if (options.validateOnly) {
      console.log(chalk.blue('Validation complete (--validate-only mode)'));
      process.exit(0);
    }

    // Send webhook
    await sendWebhook(payload);
  });

program.parse();
