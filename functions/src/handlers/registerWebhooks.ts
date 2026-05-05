import type { Request, Response } from 'express';
import axios from 'axios';
import { adminDb } from '../config/firebaseAdmin.js';

const SHOP_DOMAIN = 'z50nyc-dm.myshopify.com';
const WEBHOOK_ADDRESS = 'https://shopifywebhookreceiver-bi372exr4a-uc.a.run.app';
const WEBHOOK_TOPICS = ['orders/create', 'orders/updated'] as const;

export const registerWebhooks = async (req: Request, res: Response): Promise<void> => {
  const requestedShop = String(req.query.shop || '').trim().toLowerCase();
  const shop = requestedShop || SHOP_DOMAIN;

  if (shop !== SHOP_DOMAIN) {
    res.status(400).json({ error: `Unsupported shop domain. Allowed: ${SHOP_DOMAIN}` });
    return;
  }

  try {
    const storeDoc = await adminDb.collection('shopify_stores').doc(shop).get();
    if (!storeDoc.exists) {
      res.status(404).json({ error: 'Shop store document not found.' });
      return;
    }

    const accessToken = String(storeDoc.data()?.accessToken || '').trim();
    if (!accessToken) {
      res.status(400).json({ error: 'Missing access token for shop.' });
      return;
    }

    const headers = { 'X-Shopify-Access-Token': accessToken };
    const apiUrl = `https://${shop}/admin/api/2024-04/webhooks.json`;

    const listResponse = await axios.get(apiUrl, { headers });
    const existingWebhooks = Array.isArray(listResponse.data?.webhooks) ? listResponse.data.webhooks : [];

    const createdWebhooks: Array<{ topic: string; id?: string | number; address: string }> = [];
    const skippedWebhooks: Array<{ topic: string; reason: string; id?: string | number }> = [];
    const errors: Array<{ topic: string; error: string }> = [];

    for (const topic of WEBHOOK_TOPICS) {
      const duplicate = existingWebhooks.find((w: any) => w?.topic === topic && w?.address === WEBHOOK_ADDRESS);
      if (duplicate) {
        skippedWebhooks.push({ topic, reason: 'already_exists', id: duplicate.id });
        continue;
      }

      try {
        const createResponse = await axios.post(apiUrl, {
          webhook: {
            topic,
            address: WEBHOOK_ADDRESS,
            format: 'json'
          }
        }, { headers });

        createdWebhooks.push({
          topic,
          id: createResponse.data?.webhook?.id,
          address: WEBHOOK_ADDRESS
        });
      } catch (error: any) {
        console.error('❌ Webhook create error:', { topic, message: error.response?.data || error.message });
        errors.push({ topic, error: error.response?.data ? JSON.stringify(error.response.data) : String(error.message) });
      }
    }

    res.status(200).json({
      ok: true,
      shop,
      webhookAddress: WEBHOOK_ADDRESS,
      existingWebhooks,
      createdWebhooks,
      skippedWebhooks,
      errors
    });
  } catch (error: any) {
    console.error('❌ Register webhooks failed:', error.response?.data || error.message);
    res.status(500).json({
      ok: false,
      shop,
      webhookAddress: WEBHOOK_ADDRESS,
      existingWebhooks: [],
      createdWebhooks: [],
      skippedWebhooks: [],
      errors: [{ topic: 'all', error: 'Webhook registration failed.' }]
    });
  }
};
