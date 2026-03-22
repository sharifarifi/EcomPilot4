import crypto from 'node:crypto';
import { getShopifyEnv } from '../config/env.js';

export type SupportedWebhookTopic = 'orders/create' | 'orders/updated';

export type ShopifyWebhookContext = {
  topic: string;
  shopDomain: string;
  webhookId: string;
};

export const verifyWebhookSignature = (rawBody: string, signature = '') => {
  const { webhookSecret } = getShopifyEnv();

  if (!webhookSecret) {
    return false;
  }

  const digest = crypto.createHmac('sha256', webhookSecret).update(rawBody, 'utf8').digest('base64');
  if (digest.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
};

export const getWebhookContext = (headers: {
  topic?: string | null;
  shopDomain?: string | null;
  webhookId?: string | null;
}): ShopifyWebhookContext => ({
  topic: String(headers.topic || '').trim().toLowerCase(),
  shopDomain: String(headers.shopDomain || '').trim().toLowerCase(),
  webhookId: String(headers.webhookId || '').trim()
});

export const getWebhookRoute = (topic: string): SupportedWebhookTopic | null => {
  if (topic === 'orders/create' || topic === 'orders/updated') {
    return topic;
  }

  return null;
};

export const buildWebhookDispatchPayload = (context: ShopifyWebhookContext) => {
  const route = getWebhookRoute(context.topic);

  if (!route) {
    return {
      supported: false,
      resource: 'unknown',
      action: 'ignored'
    };
  }

  return {
    supported: true,
    resource: 'orders',
    action: route.split('/')[1],
    route
  };
};
