import {
  clearCookie,
  exchangeAccessToken,
  getAdminDb,
  getAppBaseUrl,
  getCookieValue,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain,
  parseInstallContext,
  verifyCallbackHmac,
} from './_lib.js';

const buildReturnUrl = (req, returnTo, status, shop) => {
  const base = getAppBaseUrl(req).replace(/\/$/, '');
  const normalizedReturnTo = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
  const nextUrl = new URL(`${base}${normalizedReturnTo}`);
  nextUrl.searchParams.set('shopify', status);
  nextUrl.searchParams.set('shop', shop);
  return nextUrl.toString();
};

export default async function handler(req, res) {
  const shop = normalizeShopDomain(req.query.shop || '');
  const code = String(req.query.code || '').trim();
  const state = String(req.query.state || '').trim();

  if (!shop || !code || !state || !isValidShopDomain(shop) || !verifyCallbackHmac(req.query)) {
    res.status(400).json({ error: 'Missing or invalid callback parameters.' });
    return;
  }

  const context = parseInstallContext(getCookieValue(req));
  if (!context || context.stateHash !== hashInstallState(state) || context.shopDomain !== shop) {
    res.status(400).json({ error: 'Invalid or expired install state.' });
    return;
  }

  let tokenExchangeStatus = 'failed';
  let grantedScopes = [];
  let callbackMessage = 'Token exchange başarısız oldu.';

  try {
    const tokenResponse = await exchangeAccessToken({ shop, code });
    grantedScopes = tokenResponse.scope.split(',').map((scope) => scope.trim()).filter(Boolean);
    tokenExchangeStatus = tokenResponse.accessToken ? 'succeeded' : 'failed';
    callbackMessage = tokenResponse.accessToken
      ? 'OAuth callback tamamlandı. Access token bu skeleton sürümde plaintext saklanmıyor.'
      : 'OAuth callback tamamlandı ancak access token dönmedi.';
  } catch (error) {
    callbackMessage = error instanceof Error ? error.message : callbackMessage;
  }

  const db = await getAdminDb();
  if (db) {
    const updatedAt = new Date().toISOString();
    const isConnected = tokenExchangeStatus === 'succeeded';
    const connectionState = isConnected ? 'connected' : 'pending_secure_storage';

    await db.collection('shopify_stores').doc(shop).set({
      shopDomain: shop,
      connectionState,
      connected: isConnected,
      grantedScopes,
      authCodeReceivedAt: updatedAt,
      tokenExchangeStatus,
      updatedAt,
      lastError: isConnected ? null : callbackMessage,
    }, { merge: true });

    await db.collection('settings').doc('integrations').set({
      1: {
        connected: isConnected,
        connectionState,
        status: isConnected ? 'connected' : 'pending',
        shopDomain: shop,
        grantedScopes,
        lastError: isConnected ? null : callbackMessage,
        updatedAt,
        authCodeReceivedAt: updatedAt,
      },
    }, { merge: true });
  }

  res.setHeader('Set-Cookie', clearCookie());
  res.redirect(302, buildReturnUrl(req, context.returnTo || '/?shopify=oauth', tokenExchangeStatus, shop));
}
