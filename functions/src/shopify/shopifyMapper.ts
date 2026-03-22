import type {
  ShopifyOrderLineItemPayload,
  ShopifyOrderPayload,
  ShopifyProductPayload,
  ShopifyProductVariantPayload,
  ShopifyShippingAddressPayload
} from './shopifyClient.js';

export type NormalizedShopifyVariant = {
  shopifyVariantId: string;
  title: string;
  sku: string;
  price: string;
};

export type NormalizedShopifyProduct = {
  shopifyProductId: string;
  title: string;
  status: string;
  vendor: string;
  variants: NormalizedShopifyVariant[];
  image: string | null;
  updatedAtShopify: string | null;
  syncedAt: string;
  storeId: string;
};

export type NormalizedShopifyLineItem = {
  shopifyLineItemId: string;
  title: string;
  sku: string;
  quantity: number;
  price: string;
};

export type NormalizedShopifyShippingAddress = {
  name: string;
  address1: string;
  city: string;
  province: string;
  zip: string;
  country: string;
};

export type NormalizedShopifyCustomer = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type NormalizedShopifyOrder = {
  source: 'shopify';
  storeId: string;
  shopifyOrderId: string;
  orderName: string;
  customer: NormalizedShopifyCustomer;
  financialStatus: string;
  fulfillmentStatus: string;
  totalPrice: string;
  currency: string;
  lineItems: NormalizedShopifyLineItem[];
  shippingAddress: NormalizedShopifyShippingAddress;
  createdAtShopify: string | null;
  updatedAtShopify: string | null;
  syncedAt: string;
};

const asRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

const asString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
};

const asNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const mapVariant = (payload: ShopifyProductVariantPayload): NormalizedShopifyVariant => {
  const record = asRecord(payload);

  return {
    shopifyVariantId: asString(record.id),
    title: asString(record.title),
    sku: asString(record.sku),
    price: asString(record.price)
  };
};

const mapLineItem = (payload: ShopifyOrderLineItemPayload): NormalizedShopifyLineItem => {
  const record = asRecord(payload);

  return {
    shopifyLineItemId: asString(record.id),
    title: asString(record.title),
    sku: asString(record.sku),
    quantity: asNumber(record.quantity),
    price: asString(record.price)
  };
};

const mapShippingAddress = (payload: ShopifyShippingAddressPayload | null | undefined): NormalizedShopifyShippingAddress => {
  const record = asRecord(payload);

  return {
    name: [asString(record.first_name), asString(record.last_name)].filter(Boolean).join(' ').trim(),
    address1: asString(record.address1),
    city: asString(record.city),
    province: asString(record.province),
    zip: asString(record.zip),
    country: asString(record.country)
  };
};

const mapCustomer = (payload: Record<string, unknown> | null | undefined): NormalizedShopifyCustomer => {
  const record = asRecord(payload);

  return {
    firstName: asString(record.first_name),
    lastName: asString(record.last_name),
    email: asString(record.email),
    phone: asString(record.phone)
  };
};

const getProductImage = (payload: ShopifyProductPayload) => {
  const directImage = asRecord(payload.image);
  if (asString(directImage.src)) {
    return asString(directImage.src);
  }

  const firstImage = Array.isArray(payload.images) ? asRecord(payload.images[0]) : {};
  return asString(firstImage.src) || null;
};

export const mapShopifyOrder = (payload: ShopifyOrderPayload, options: { storeId: string; syncedAt?: string }): NormalizedShopifyOrder => ({
  source: 'shopify',
  storeId: options.storeId,
  shopifyOrderId: asString(payload.id),
  orderName: asString(payload.name),
  customer: mapCustomer(payload.customer),
  financialStatus: asString(payload.financial_status),
  fulfillmentStatus: asString(payload.fulfillment_status),
  totalPrice: asString(payload.total_price),
  currency: asString(payload.currency),
  lineItems: Array.isArray(payload.line_items) ? payload.line_items.map(mapLineItem) : [],
  shippingAddress: mapShippingAddress(payload.shipping_address),
  createdAtShopify: asString(payload.created_at) || null,
  updatedAtShopify: asString(payload.updated_at) || null,
  syncedAt: options.syncedAt || new Date().toISOString()
});

export const mapShopifyProduct = (payload: ShopifyProductPayload, options: { storeId: string; syncedAt?: string }): NormalizedShopifyProduct => ({
  shopifyProductId: asString(payload.id),
  title: asString(payload.title),
  status: asString(payload.status),
  vendor: asString(payload.vendor),
  variants: Array.isArray(payload.variants) ? payload.variants.map(mapVariant) : [],
  image: getProductImage(payload),
  updatedAtShopify: asString(payload.updated_at) || null,
  syncedAt: options.syncedAt || new Date().toISOString(),
  storeId: options.storeId
});

export const mapShopifyCustomer = (payload: Record<string, unknown>) => ({
  id: payload.id,
  source: 'shopify',
  raw: payload
});

export const mapShopifyInventoryItem = (payload: Record<string, unknown>) => ({
  id: payload.id,
  source: 'shopify',
  raw: payload
});
