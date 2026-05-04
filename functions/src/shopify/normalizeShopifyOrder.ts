import type { ShopifyOrderPayload } from './shopifyClient.js';

export const DEFAULT_SHOP_DOMAIN = 'z50nyc-dm.myshopify.com';

export type NormalizeContext = {
  topic?: string;
  webhookId?: string;
};

export const normalizeShopifyOrder = (
  order: ShopifyOrderPayload,
  shopDomain: string,
  context: NormalizeContext = {}
) => {
  const firstName = String(order.customer?.first_name || '').trim();
  const lastName = String(order.customer?.last_name || '').trim();
  const email = String(order.customer?.email || order.email || '').trim();
  const customerName = `${firstName} ${lastName}`.trim() || 'Müşteri Bilgisi Yok';
  const now = new Date().toISOString();

  return {
    order_id: order.id,
    shopifyOrderId: String(order.id || ''),
    order_number: order.name || '',
    orderName: order.name || '',
    total_price: order.total_price ?? '0',
    totalPrice: Number(order.total_price || 0),
    currency: order.currency || '',
    customer: {
      firstName,
      lastName,
      email
    },
    customerName,
    email,
    created_at: order.created_at || now,
    createdAt: order.created_at || now,
    financial_status: order.financial_status || '',
    financialStatus: order.financial_status || '',
    fulfillment_status: order.fulfillment_status || 'unfulfilled',
    fulfillmentStatus: order.fulfillment_status || 'unfulfilled',
    shopDomain,
    syncedAt: now,
    updatedAt: now,
    webhookTopic: context.topic || null,
    webhookId: context.webhookId || null
  };
};
