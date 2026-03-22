export const mapShopifyOrder = (payload: Record<string, unknown>) => ({
  id: payload.id,
  source: 'shopify',
  raw: payload
});

export const mapShopifyProduct = (payload: Record<string, unknown>) => ({
  id: payload.id,
  source: 'shopify',
  raw: payload
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
