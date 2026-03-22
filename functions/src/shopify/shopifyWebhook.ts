import crypto from 'node:crypto';
import { getShopifyEnv } from '../config/env.js';

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
