import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import { getBackendEnv } from '../config/env.js';
import {
  exchangeAccessToken,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain,
  verifyCallbackHmac
} from '../shopify/shopifyAuth.js';

const buildReturnUrl = (returnTo: string, status: string, shop: string) => {
  const { appBaseUrl } = getBackendEnv();
  const base = appBaseUrl.replace(/\/$/, '');
  const normalizedReturnTo = returnTo.startsWith('/') ? returnTo : `/${returnTo}`;
  const nextUrl = new URL(`${base}${normalizedReturnTo}`);
  nextUrl.searchParams.set('shopify', status);
  nextUrl.searchParams.set('shop', shop);
  return nextUrl.toString();
};

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
  const returnTo = String(installSessionData?.returnTo || '/?shopify=oauth');
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

  const updatedAt = new Date().toISOString();
  const isConnected = tokenExchangeStatus === 'succeeded';
  const connectionState = isConnected ? 'connected' : 'pending_secure_storage';

  await adminDb.collection('shopify_stores').doc(shop).set({
    shopDomain: shop,
    connectionState,
    connected: isConnected,
    grantedScopes,
    authCodeReceivedAt: updatedAt,
    tokenExchangeStatus,
    updatedAt,
    lastError: tokenExchangeStatus === 'failed' ? callbackMessage : null,
    note: isConnected
      ? 'Access token bu iskelet sürümünde Firestore plaintext olarak saklanmaz.'
      : 'TODO: Güvenli token saklama katmanı henüz implement edilmedi.'
  }, { merge: true });

  await adminDb.collection('settings').doc('integrations').set({
    1: {
      connected: isConnected,
      connectionState,
      status: isConnected ? 'connected' : 'pending',
      shopDomain: shop,
      grantedScopes,
      lastError: tokenExchangeStatus === 'failed' ? callbackMessage : null,
      updatedAt,
      authCodeReceivedAt: updatedAt,
    }
  }, { merge: true });

  await installSessionRef.set({
    status: tokenExchangeStatus,
    completedAt: updatedAt,
    shopDomain: shop
  }, { merge: true });

  res.redirect(buildReturnUrl(returnTo, tokenExchangeStatus, shop));
};
