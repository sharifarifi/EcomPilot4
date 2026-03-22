import type { Request, Response } from 'firebase-functions/v2/https';
import { adminDb } from '../config/firebaseAdmin.js';
import { verifyWebhookSignature } from '../shopify/shopifyWebhook.js';

export const webhookReceiver = async (req: Request, res: Response) => {
  const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body || {});
  const signature = String(req.get('x-shopify-hmac-sha256') || '');

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  await adminDb.collection('integration_logs').add({
    source: 'shopify',
    topic: req.get('x-shopify-topic') || 'unknown',
    shopDomain: req.get('x-shopify-shop-domain') || null,
    receivedAt: new Date().toISOString(),
    note: 'TODO: Webhook payload işleme akışı henüz implement edilmedi.'
  });

  res.status(202).json({ ok: true });
};
