import { adminDb } from '../config/firebaseAdmin.js';

export const syncCustomers = async (shopDomain: string) => {
  const startedAt = new Date().toISOString();

  await adminDb.collection('sync_states').doc(`shopify-customers-${shopDomain || 'unknown'}`).set({
    source: 'shopify',
    resource: 'customers',
    shopDomain,
    status: 'todo',
    startedAt,
    message: 'TODO: Shopify müşteri senkronizasyonu henüz implement edilmedi.'
  }, { merge: true });

  return { resource: 'customers', status: 'todo', startedAt };
};
