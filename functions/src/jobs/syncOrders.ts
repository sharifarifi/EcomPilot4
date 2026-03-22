import { adminDb } from '../config/firebaseAdmin.js';

export const syncOrders = async (shopDomain: string) => {
  const startedAt = new Date().toISOString();

  await adminDb.collection('sync_states').doc(`shopify-orders-${shopDomain || 'unknown'}`).set({
    source: 'shopify',
    resource: 'orders',
    shopDomain,
    status: 'todo',
    startedAt,
    message: 'TODO: Shopify sipariş senkronizasyonu henüz implement edilmedi.'
  }, { merge: true });

  return { resource: 'orders', status: 'todo', startedAt };
};
