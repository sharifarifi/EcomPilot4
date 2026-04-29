import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import { createShopifyAdminClient, testShopConnection } from '../shopify/shopifyClient.js';
import { HttpError, requireManagementAuth } from './_authz.js';
import { getValidatedShopDomain } from './_validation.js';

export const connectionTest = async (req: Request, res: Response) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  try {
    await requireManagementAuth(req);
    const shopDomain = getValidatedShopDomain(req);

    // Güvenlik gereği accessToken client body'den alınmaz.
    // Eğer ileride güvenli token saklama eklenecekse buradan okunmalıdır.
    const storeSnapshot = await adminDb.collection('shopify_stores').doc(shopDomain).get();
    const storeData = storeSnapshot.exists ? storeSnapshot.data() : null;
    const persistedAccessToken = typeof storeData?.accessToken === 'string' ? storeData.accessToken : undefined;

    if (!persistedAccessToken) {
      res.status(200).json({
        ok: false,
        code: 'missing_connection_token',
        message: 'Shopify bağlantı tokenı bulunamadı. Entegrasyonu yeniden bağlayın veya OAuth token saklama akışını tamamlayın.'
      });
      return;
    }

    const client = createShopifyAdminClient(shopDomain, persistedAccessToken);
    const result = await testShopConnection(client);

    res.status(200).json({
      shopDomain,
      ok: result.ok,
      message: result.ok ? 'connection_ok' : 'connection_check_failed'
    });
  } catch (error) {
    if (error instanceof HttpError) {
      res.status(error.status).json({ error: error.code });
      return;
    }

    res.status(502).json({ error: 'upstream_error' });
  }
};
