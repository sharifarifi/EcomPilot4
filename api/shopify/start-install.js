import {
  buildCookie,
  buildInstallUrl,
  createInstallState,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain,
  serializeInstallContext,
  getEnv,
} from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { apiKey, apiSecret, scopes } = getEnv();
  if (!apiKey || !apiSecret || scopes.length === 0) {
    res.status(500).json({ error: 'Shopify environment variables are not fully configured.' });
    return;
  }

  const shop = normalizeShopDomain(req.query.shop || '');
  const returnTo = String(req.query.returnTo || '/?shopify=oauth').trim() || '/?shopify=oauth';
  const redirectMode = String(req.query.redirect || '').trim() === '1';

  if (!shop || !isValidShopDomain(shop)) {
    res.status(400).json({ error: 'Missing or invalid required query parameter: shop' });
    return;
  }

  const state = createInstallState();
  const installUrl = buildInstallUrl({ req, shop, state });
  const cookieValue = serializeInstallContext({
    stateHash: hashInstallState(state),
    returnTo,
    shopDomain: shop,
    createdAt: new Date().toISOString(),
  });

  res.setHeader('Set-Cookie', buildCookie(cookieValue));

  if (redirectMode) {
    res.redirect(302, installUrl);
    return;
  }

  res.status(200).json({ shop, installUrl, returnTo });
}
