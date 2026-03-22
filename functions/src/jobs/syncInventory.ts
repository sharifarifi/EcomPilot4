import { adminDb } from '../config/firebaseAdmin.js';

export const syncInventory = async (shopDomain: string) => {
  const startedAt = new Date().toISOString();

  await adminDb.collection('sync_states').doc(`shopify-inventory-${shopDomain || 'unknown'}`).set({
    source: 'shopify',
    resource: 'inventory',
    shopDomain,
    status: 'todo',
    startedAt,
    message: 'TODO: Shopify stok senkronizasyonu henüz implement edilmedi.'
  }, { merge: true });

  return { resource: 'inventory', status: 'todo', startedAt };
};
