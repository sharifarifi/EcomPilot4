import type { Request, Response } from 'firebase-functions/v2/https';
import { createShopifyAdminClient, testShopConnection } from '../shopify/shopifyClient.js';

export const connectionTest = async (req: Request, res: Response) => {
  const shopDomain = String(req.query.shop || req.body?.shop || '').trim();
  const accessToken = typeof req.body?.accessToken === 'string' ? req.body.accessToken : undefined;

  if (!shopDomain) {
    res.status(400).json({ error: 'Missing shop domain.' });
    return;
  }

  const client = createShopifyAdminClient(shopDomain, accessToken);
  const result = await testShopConnection(client);

  res.status(200).json({
    shopDomain,
    ...result
  });
};
