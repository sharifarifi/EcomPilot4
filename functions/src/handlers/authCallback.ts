import type { Request, Response } from 'express';
import axios from 'axios';
import { adminDb } from '../config/firebaseAdmin.js';
import { getBackendEnv } from '../config/env.js';
import {
  exchangeAccessToken,
  hashInstallState,
  isValidShopDomain,
  normalizeShopDomain,
  verifyCallbackHmac
} from '../shopify/shopifyAuth.js';

const WEBHOOK_ADDRESS = 'https://us-central1-ecom-prototip.cloudfunctions.net/shopifyWebhookReceiver';
const WEBHOOK_TOPICS = ['orders/create', 'orders/updated'] as const;

const ensureOrderWebhooks = async (shop: string, accessToken: string) => {
  const headers = { 'X-Shopify-Access-Token': accessToken };
  const baseUrl = `https://${shop}/admin/api/2024-04/webhooks.json`;

  const listResponse = await axios.get(baseUrl, { headers });
  const existing = Array.isArray(listResponse.data?.webhooks) ? listResponse.data.webhooks : [];

  for (const topic of WEBHOOK_TOPICS) {
    const duplicate = existing.find((w: any) => w?.topic === topic && w?.address === WEBHOOK_ADDRESS);
    if (duplicate) {
      console.log('Webhook already exists, skipping.', { shop, topic, webhookId: duplicate.id });
      continue;
    }

    await axios.post(baseUrl, {
      webhook: {
        topic,
        address: WEBHOOK_ADDRESS,
        format: 'json'
      }
    }, { headers });

    console.log('Webhook registered.', { shop, topic, address: WEBHOOK_ADDRESS });
  }
};

export const authCallback = async (req: Request, res: Response) => {
  const params = new URLSearchParams(req.query as Record<string, string>);
  const shop = normalizeShopDomain(String(req.query.shop || '').trim());
  const code = String(req.query.code || '').trim();
  const state = String(req.query.state || '').trim();

  if (!shop || !code || !state || !isValidShopDomain(shop)) {
    return res.status(400).json({ error: 'Missing callback parameters.' });
  }

  if (!verifyCallbackHmac(params)) {
    return res.status(400).json({ error: 'Invalid Shopify signature.' });
  }

  const stateHash = hashInstallState(state);
  const installSessionRef = adminDb.collection('shopify_install_sessions').doc(stateHash);
  const installSession = await installSessionRef.get();

  if (!installSession.exists) {
    return res.status(400).json({ error: 'Invalid install state.' });
  }

  try {
    const tokenResponse = await exchangeAccessToken(shop, code);
    const updatedAt = new Date().toISOString();

    await adminDb.collection('shopify_stores').doc(shop).set({
      shopDomain: shop,
      accessToken: tokenResponse.accessToken,
      scopes: tokenResponse.scope,
      status: 'active',
      isConnected: true,
      updatedAt
    }, { merge: true });

    await ensureOrderWebhooks(shop, tokenResponse.accessToken);

    await adminDb.collection('settings').doc('integrations').set({
      shopify: {
        connected: true,
        shopDomain: shop,
        updatedAt
      }
    }, { merge: true });

    await installSessionRef.update({ status: 'succeeded', completedAt: updatedAt });

    const { appBaseUrl } = getBackendEnv();
    res.redirect(`${appBaseUrl.replace(/\/$/, '')}/?shopify=succeeded&shop=${shop}`);
  } catch (error: any) {
    console.error('❌ Auth callback error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Token exchange failed' });
  }
};
