import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import { hasShopifyEnv } from '../config/env.js';
import {
  buildInstallUrl,
  createInstallState,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain
} from '../shopify/shopifyAuth.js';

export const startInstall = async (req: Request, res: Response) => {
  const shop = normalizeShopDomain(String(req.query.shop || '').trim());
  const returnTo = String(req.query.returnTo || '/?shopify=oauth').trim() || '/?shopify=oauth';
  const redirectMode = String(req.query.redirect || '').trim() === '1';

  if (!hasShopifyEnv()) {
    res.status(500).json({ error: 'Shopify environment variables are not fully configured.' });
    return;
  }

  if (!shop || !isValidShopDomain(shop)) {
    res.status(400).json({ error: 'Missing or invalid required query parameter: shop' });
    return;
  }

  const state = createInstallState();
  const installUrl = buildInstallUrl(shop, state);
  const stateHash = hashInstallState(state);

  await adminDb.collection('shopify_install_sessions').doc(stateHash).set({
    shopDomain: shop,
    stateHash,
    returnTo,
    status: 'created',
    createdAt: new Date().toISOString()
  }, { merge: true });

  if (redirectMode) {
    res.redirect(installUrl);
    return;
  }

  res.status(200).json({ shop, state, installUrl, returnTo });
};
