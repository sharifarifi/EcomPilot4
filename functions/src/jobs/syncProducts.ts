import { adminDb } from '../config/firebaseAdmin.js';

export const syncProducts = async (shopDomain: string) => {
  const startedAt = new Date().toISOString();

  await adminDb.collection('sync_states').doc(`shopify-products-${shopDomain || 'unknown'}`).set({
    source: 'shopify',
    resource: 'products',
    shopDomain,
    status: 'todo',
    startedAt,
    message: 'TODO: Shopify ürün senkronizasyonu henüz implement edilmedi.'
  }, { merge: true });

  return { resource: 'products', status: 'todo', startedAt };
};
