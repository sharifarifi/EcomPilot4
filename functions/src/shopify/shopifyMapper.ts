import type { ShopifyProductPayload, ShopifyProductVariantPayload } from './shopifyClient.js';

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

const asRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' ? value as Record<string, unknown> : {}
);

const asString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
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

const getProductImage = (payload: ShopifyProductPayload) => {
  const directImage = asRecord(payload.image);
  if (asString(directImage.src)) {
    return asString(directImage.src);
  }

  const firstImage = Array.isArray(payload.images) ? asRecord(payload.images[0]) : {};
  return asString(firstImage.src) || null;
};

export const mapShopifyOrder = (payload: Record<string, unknown>) => ({
  id: payload.id,
  source: 'shopify',
  raw: payload
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
