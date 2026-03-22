import { adminDb } from '../config/firebaseAdmin.js';
import type { NormalizedShopifyOrder } from '../shopify/shopifyMapper.js';

const getOrderDocId = (storeId: string, shopifyOrderId: string) => `${storeId}__${shopifyOrderId}`;

export const saveShopifyOrders = async (orders: NormalizedShopifyOrder[]) => {
  if (orders.length === 0) {
    return { savedCount: 0 };
  }

  const batch = adminDb.batch();

  orders.forEach((order) => {
    const docRef = adminDb.collection('shopify_orders').doc(getOrderDocId(order.storeId, order.shopifyOrderId));
    batch.set(docRef, order, { merge: true });
  });

  await batch.commit();

  return { savedCount: orders.length };
};
