import type { Request, Response } from 'firebase-functions/v2/https';
import { adminDb } from '../config/firebaseAdmin.js';
import {
  exchangeAccessToken,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain,
  verifyCallbackHmac
} from '../shopify/shopifyAuth.js';

export const authCallback = async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const shop = normalizeShopDomain(String(req.query.shop || '').trim());
  const code = String(req.query.code || '').trim();
  const state = String(req.query.state || '').trim();

  if (!shop || !code || !state || !isValidShopDomain(shop)) {
    res.status(400).json({ error: 'Missing or invalid callback parameters.' });
    return;
  }

  if (!verifyCallbackHmac(params)) {
    res.status(400).json({ error: 'Invalid Shopify callback signature.' });
    return;
  }

  const stateHash = hashInstallState(state);
  const installSessionRef = adminDb.collection('shopify_install_sessions').doc(stateHash);
  const installSession = await installSessionRef.get();

  if (!installSession.exists) {
    res.status(400).json({ error: 'Invalid or expired install state.' });
    return;
  }

  const installSessionData = installSession.data();
  if (installSessionData?.shopDomain && installSessionData.shopDomain !== shop) {
    res.status(400).json({ error: 'Install state does not match requested shop.' });
    return;
  }

  let grantedScopes: string[] = [];
  let tokenExchangeStatus: 'skipped' | 'succeeded' | 'failed' = 'skipped';
  let callbackMessage = 'Callback alındı. Güvenli metadata kaydedildi.';

  try {
    const tokenResponse = await exchangeAccessToken(shop, code);
    grantedScopes = tokenResponse.scope.split(',').map((scope) => scope.trim()).filter(Boolean);
    tokenExchangeStatus = tokenResponse.accessToken ? 'succeeded' : 'failed';
    callbackMessage = tokenResponse.accessToken
      ? 'OAuth callback tamamlandı. Access token alındı ancak bu iskelet sürümünde saklanmadı.'
      : 'OAuth callback tamamlandı ancak access token dönmedi.';
  } catch (error) {
    tokenExchangeStatus = 'failed';
    callbackMessage = error instanceof Error ? error.message : 'Token exchange başarısız oldu.';
  }

  await adminDb.collection('shopify_stores').doc(shop).set({
    shopDomain: shop,
    connectionState: tokenExchangeStatus === 'succeeded' ? 'connected' : 'pending_secure_storage',
    connected: tokenExchangeStatus === 'succeeded',
    grantedScopes,
    authCodeReceivedAt: new Date().toISOString(),
    tokenExchangeStatus,
    updatedAt: new Date().toISOString(),
    lastError: tokenExchangeStatus === 'failed' ? callbackMessage : null,
    note: tokenExchangeStatus === 'succeeded'
      ? 'Access token bu iskelet sürümünde Firestore plaintext olarak saklanmaz.'
      : 'TODO: Güvenli token saklama katmanı henüz implement edilmedi.'
  }, { merge: true });

  await installSessionRef.set({
    status: tokenExchangeStatus,
    completedAt: new Date().toISOString(),
    shopDomain: shop
  }, { merge: true });

  res.status(tokenExchangeStatus === 'failed' ? 202 : 200).json({
    ok: true,
    shop,
    tokenExchangeStatus,
    grantedScopes,
    message: callbackMessage
  });
};
