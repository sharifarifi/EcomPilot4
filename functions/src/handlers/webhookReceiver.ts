import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import {
  buildWebhookDispatchPayload,
  getWebhookContext,
  verifyWebhookSignature
} from '../shopify/shopifyWebhook.js';
import { DEFAULT_SHOP_DOMAIN, normalizeShopifyOrder } from '../shopify/normalizeShopifyOrder.js';

type FirebaseRequest = Request & { rawBody?: Buffer };

export const webhookReceiver = async (req: FirebaseRequest, res: Response) => {
  const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body || {});
  const signature = String(req.get('x-shopify-hmac-sha256') || '');

  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(401).json({ error: 'Invalid webhook signature.' });
    return;
  }

  let payload: any = req.body;
  if (!payload || Object.keys(payload).length === 0) {
    try {
      payload = JSON.parse(rawBody);
    } catch {
      payload = {};
    }
  }

  const context = getWebhookContext({
    topic: req.get('x-shopify-topic'),
    shopDomain: req.get('x-shopify-shop-domain') || payload?.shop_domain,
    webhookId: req.get('x-shopify-webhook-id')
  });

  const shopDomain = context.shopDomain || String(payload?.shop_domain || '').trim().toLowerCase() || DEFAULT_SHOP_DOMAIN;
  if (shopDomain !== DEFAULT_SHOP_DOMAIN) {
    res.status(400).json({ error: `Unsupported shop domain: ${shopDomain}` });
    return;
  }

  const dispatchPayload = buildWebhookDispatchPayload(context);
  const receivedAt = new Date().toISOString();
  const dispatchId = context.webhookId || `${context.topic || 'unknown'}-${Date.now()}`;

  await adminDb.collection('integration_logs').doc(dispatchId).set({
    source: 'shopify',
    topic: context.topic || 'unknown',
    shopDomain,
    webhookId: context.webhookId || null,
    receivedAt,
    routeStatus: dispatchPayload.supported ? 'queued' : 'ignored',
    note: dispatchPayload.supported
      ? `Webhook kabul edildi; ${dispatchPayload.resource}/${dispatchPayload.action} işi işlendi.`
      : 'Bu webhook konusu için henüz route tanımlı değil.'
  }, { merge: true });

  if (dispatchPayload.route === 'orders/create' || dispatchPayload.route === 'orders/updated') {
    try {
      const orderId = String(payload?.id || '');
      if (!orderId) {
        res.status(400).json({ error: 'Order payload is missing id.' });
        return;
      }

      await adminDb.collection('shopify_orders').doc(orderId).set(
        normalizeShopifyOrder(payload, shopDomain, {
          topic: context.topic,
          webhookId: context.webhookId
        }),
        { merge: true }
      );

      res.status(200).json({
        ok: true,
        topic: context.topic,
        shopDomain,
        orderId,
        action: 'upserted'
      });
      return;
    } catch (error: any) {
      console.error('❌ Webhook order upsert error:', {
        message: error?.message,
        topic: context.topic,
        webhookId: context.webhookId,
        shopDomain
      });
      res.status(500).json({ error: 'Webhook processing failed.' });
      return;
    }
  }

  if (dispatchPayload.supported) {
    await adminDb.collection('sync_states').doc(dispatchId).set({
      source: 'shopify',
      trigger: 'webhook',
      topic: context.topic,
      shopDomain,
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
    shopDomain,
    supported: dispatchPayload.supported
  });
};
