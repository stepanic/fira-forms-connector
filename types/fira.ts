/**
 * FIRA.finance API Type Definitions
 * Based on FIRA Custom Webshop API v1.0.0
 */

export type InvoiceType = 'PONUDA' | 'RAČUN' | 'FISKALNI_RAČUN';
export type WebshopType = 'WOO_COMMERCE' | 'SHOPIFY' | 'CUSTOM';
export type PaymentType = 'GOTOVINA' | 'TRANSAKCIJSKI' | 'KARTICA';

export interface WebshopCustomerAddressModel {
  name?: string;
  address1?: string;
  address2?: string;
  city?: string;
  country?: string; // Use abbreviations: HR, AT, DE, etc.
  phone?: string;
  zipCode?: string;
  email?: string;
  vatNumber?: string;
  oib?: string;
  company?: string;
}

export interface WebshopLineItemModel {
  name?: string;
  description?: string;
  lineItemId?: string;
  price?: number;
  quantity?: number;
  unit?: string;
  taxRate?: number; // Use decimal format (0.25 for 25%)
  kpdCode?: string; // KPD code for the line item
  productCode?: string; // Match product from FIRA database
}

export interface WebshopOrderModel {
  webshopOrderId?: number;
  webshopType?: WebshopType;
  webshopEvent?: string;
  webshopOrderNumber?: string;
  invoiceType?: InvoiceType;
  paymentGatewayCode?: string;
  paymentGatewayName?: string;
  createdAt?: string; // Format: 'YYYY-MM-DDTHH:mm:ssZ'
  dueDate?: string; // Format: 'YYYY-MM-DD'
  validTo?: string; // Format: 'YYYY-MM-DD'
  currency?: string; // EUR, USD, AUD, BAM, etc.
  taxesIncluded?: boolean;
  billingAddress?: WebshopCustomerAddressModel;
  shippingAddress?: WebshopCustomerAddressModel;
  taxValue?: number;
  brutto?: number;
  netto?: number;
  discounts?: WebshopLineItemModel[];
  totalShipping?: WebshopLineItemModel;
  customerLocale?: string;
  lineItems?: WebshopLineItemModel[];
  note?: string; // Deprecated
  internalNote?: string;
  taxRate?: number; // Deprecated
  paymentType?: PaymentType;
  termsHR?: string;
  termsEN?: string;
  termsDE?: string;
}

export interface ViolationError {
  fieldName?: string;
  message?: string;
  rejectedValue?: string;
}

export interface ErrorDetails {
  timestamp?: string;
  message?: string;
  details?: string;
  validationErrors?: ViolationError[];
}

export interface FiraApiResponse {
  success: boolean;
  data?: any;
  error?: ErrorDetails;
}
