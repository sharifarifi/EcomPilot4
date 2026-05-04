import type { Request, Response } from 'express';
import { adminDb } from '../config/firebaseAdmin.js';
import axios from 'axios';
import { DEFAULT_SHOP_DOMAIN, normalizeShopifyOrder } from '../shopify/normalizeShopifyOrder.js';

const SHOP_DOMAIN = DEFAULT_SHOP_DOMAIN;

export const manualSync = async (req: Request, res: Response): Promise<void> => {
  const requestedShop = String(req.query.shop || '').trim().toLowerCase();
  const shop = requestedShop || SHOP_DOMAIN;

  if (shop !== SHOP_DOMAIN) {
    res.status(400).send(`Geçersiz shop domain. Desteklenen domain: ${SHOP_DOMAIN}`);
    return;
  }

  try {
    const storeDoc = await adminDb.collection('shopify_stores').doc(shop).get();
    
    if (!storeDoc.exists) {
      res.status(404).send('Mağaza veritabanında bulunamadı.');
      return;
    }
    
    const storeData = storeDoc.data();
    const accessToken = storeData?.accessToken;

    if (!accessToken) {
      res.status(400).send('Mağaza için Access Token bulunamadı.');
      return;
    }

    const response = await axios.get(
      `https://${shop}/admin/api/2024-04/orders.json?status=any&limit=50`,
      { headers: { 'X-Shopify-Access-Token': accessToken } }
    );

    const orders = response.data.orders;
    const batch = adminDb.batch();

    orders.forEach((order: any) => {
      const orderRef = adminDb.collection('shopify_orders').doc(String(order.id));
      batch.set(orderRef, normalizeShopifyOrder(order, SHOP_DOMAIN), { merge: true });
    });

    await batch.commit();

    res.status(200).json({ 
      success: true, 
      message: `${orders.length} adet sipariş başarıyla senkronize edildi.` 
    });

  } catch (error: any) {
    console.error("❌ Sync Hatası:", error.response?.data || error.message);
    res.status(500).json({ error: 'Siparişler çekilirken bir hata oluştu.' });
  }
};
