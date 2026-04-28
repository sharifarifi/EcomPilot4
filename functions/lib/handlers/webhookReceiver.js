"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookReceiver = void 0;
const firebaseAdmin_js_1 = require("../config/firebaseAdmin.js");
const shopifyWebhook_js_1 = require("../shopify/shopifyWebhook.js");
const webhookReceiver = async (req, res) => {
    const rawBody = req.rawBody?.toString('utf8') || JSON.stringify(req.body || {});
    const signature = String(req.get('x-shopify-hmac-sha256') || '');
    const context = (0, shopifyWebhook_js_1.getWebhookContext)({
        topic: req.get('x-shopify-topic'),
        shopDomain: req.get('x-shopify-shop-domain'),
        webhookId: req.get('x-shopify-webhook-id')
    });
    if (!(0, shopifyWebhook_js_1.verifyWebhookSignature)(rawBody, signature)) {
        res.status(401).json({ error: 'Invalid webhook signature.' });
        return;
    }
    const dispatchPayload = (0, shopifyWebhook_js_1.buildWebhookDispatchPayload)(context);
    const receivedAt = new Date().toISOString();
    const dispatchId = context.webhookId || `${context.topic || 'unknown'}-${Date.now()}`;
    await firebaseAdmin_js_1.adminDb.collection('integration_logs').doc(dispatchId).set({
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
        await firebaseAdmin_js_1.adminDb.collection('sync_states').doc(dispatchId).set({
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
exports.webhookReceiver = webhookReceiver;
