import type { Request, Response } from 'firebase-functions/v2/https';
import { buildInstallUrl, createInstallState } from '../shopify/shopifyAuth.js';
import { hasShopifyEnv } from '../config/env.js';

export const startInstall = async (req: Request, res: Response) => {
  const shop = String(req.query.shop || '').trim();

  if (!hasShopifyEnv()) {
    res.status(500).json({ error: 'Shopify environment variables are not fully configured.' });
    return;
  }

  if (!shop) {
    res.status(400).json({ error: 'Missing required query parameter: shop' });
    return;
  }

  const state = createInstallState();
  const installUrl = buildInstallUrl(shop, state);

  res.status(200).json({ shop, state, installUrl });
};
