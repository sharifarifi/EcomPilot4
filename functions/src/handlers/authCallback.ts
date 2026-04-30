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

export const authCallback = async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const shop = normalizeShopDomain(String(req.query.shop || '').trim());
  const code = String(req.query.code || '').trim();
  const state = String(req.query.state || '').trim();

  // 1. Temel Parametre Kontrolü
  if (!shop || !code || !state || !isValidShopDomain(shop)) {
    return res.status(400).json({ error: 'Missing callback parameters.' });
  }

  // 2. Güvenlik Kontrolü (HMAC)
  if (!verifyCallbackHmac(params)) {
    return res.status(400).json({ error: 'Invalid Shopify signature.' });
  }

  // 3. Session Kontrolü (Güvenlik için yükleme oturumunu doğrula)
  const stateHash = hashInstallState(state);
  const installSessionRef = adminDb.collection('shopify_install_sessions').doc(stateHash);
  const installSession = await installSessionRef.get();

  if (!installSession.exists) {
    return res.status(400).json({ error: 'Invalid install state.' });
  }

  try {
    // 4. Shopify'dan Access Token'ı al (En kritik adım)
    const tokenResponse = await exchangeAccessToken(shop, code);
    const updatedAt = new Date().toISOString();

    // 5. Veritabanına Kaydet (Eksik olan kısım burasıydı)
    await adminDb.collection('shopify_stores').doc(shop).set({
      shopDomain: shop,
      accessToken: tokenResponse.accessToken, // Anahtarı buraya kaydediyoruz
      scopes: tokenResponse.scope,
      status: 'active',
      isConnected: true,
      updatedAt
    }, { merge: true });

    // Panel ayarlarını güncelle
    await adminDb.collection('settings').doc('integrations').set({
      shopify: {
        connected: true,
        shopDomain: shop,
        updatedAt
      }
    }, { merge: true });

    // 6. Oturumu temizle ve yönlendir
    await installSessionRef.update({ status: 'succeeded', completedAt: updatedAt });

    const { appBaseUrl } = getBackendEnv();
    res.redirect(`${appBaseUrl.replace(/\/$/, '')}/?shopify=succeeded&shop=${shop}`);

  } catch (error: any) {
    console.error("❌ Auth Hatası:", error.message);
    res.status(500).json({ error: 'Token exchange failed', details: error.message });
  }
};