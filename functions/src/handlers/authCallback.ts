import type { Request, Response } from 'firebase-functions/v2/https';
import { adminDb } from '../config/firebaseAdmin.js';
import { verifyCallbackHmac } from '../shopify/shopifyAuth.js';

export const authCallback = async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const shop = String(req.query.shop || '').trim();

  if (!shop) {
    res.status(400).json({ error: 'Missing required query parameter: shop' });
    return;
  }

  if (!verifyCallbackHmac(params)) {
    res.status(400).json({ error: 'Invalid Shopify callback signature.' });
    return;
  }

  await adminDb.collection('shopify_stores').doc(shop).set({
    shopDomain: shop,
    connectionState: 'pending_token_exchange',
    updatedAt: new Date().toISOString(),
    note: 'TODO: Gerçek token exchange henüz implement edilmedi.'
  }, { merge: true });

  res.status(202).json({
    ok: true,
    shop,
    message: 'Callback alındı. Gerçek token exchange akışı henüz implement edilmedi.'
  });
};
