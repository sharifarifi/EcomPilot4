import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import {
  buildWebhookDispatchPayload,
  getWebhookContext,
  verifyWebhookSignature
} from '../shopify/shopifyWebhook.js';

type FirebaseRequest = Request & { rawBody?: Buffer };

export const webhookReceiver = async (req: FirebaseRequest, res: Response) => {
  const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body || {});
  const signature = String(req.get('x-shopify-hmac-sha256') || '');
  const context = getWebhookContext({
    topic: req.get('x-shopify-topic'),
    shopDomain: req.get('x-shopify-shop-domain'),
    webhookId: req.get('x-shopify-webhook-id')
  });

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  const dispatchPayload = buildWebhookDispatchPayload(context);
  const receivedAt = new Date().toISOString();
  const dispatchId = context.webhookId || `${context.topic || 'unknown'}-${Date.now()}`;

  await adminDb.collection('integration_logs').doc(dispatchId).set({
    source: 'shopify',
    topic: context.topic || 'unknown',
    shopDomain: context.shopDomain || null,
    webhookId: context.webhookId || null,
    receivedAt,
    routeStatus: dispatchPayload.supported ? 'queued' : 'ignored',
    note: dispatchPayload.supported
      ? `Webhook kabul edildi; ${dispatchPayload.resource}/${dispatchPayload.action} işi için placeholder dispatch oluşturuldu.`
      : 'Bu webhook konusu için henüz route tanımlı değil.'
  }, { merge: true });

  if (dispatchPayload.supported) {
    await adminDb.collection('sync_states').doc(dispatchId).set({
      source: 'shopify',
      trigger: 'webhook',
      topic: context.topic,
      shopDomain: context.shopDomain || null,
      webhookId: context.webhookId || null,
      resource: dispatchPayload.resource,
      action: dispatchPayload.action,
      status: 'queued',
      queuedAt: receivedAt,
      note: 'TODO: Ağır iş yükü için gerçek queue/job dispatch katmanı henüz implement edilmedi.'
    }, { merge: true });
  }

  res.status(202).json({
    ok: true,
    topic: context.topic || 'unknown',
    supported: dispatchPayload.supported
  });
};
