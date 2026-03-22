import { adminDb } from '../config/firebaseAdmin.js';
import { saveShopifyOrders } from '../firestore/ordersRepo.js';
import { fetchOrdersPage, createShopifyAdminClient } from '../shopify/shopifyClient.js';
import { mapShopifyOrder } from '../shopify/shopifyMapper.js';

export const syncOrders = async (shopDomain: string, accessToken?: string) => {
  const startedAt = new Date().toISOString();
  const client = createShopifyAdminClient(shopDomain, accessToken);
  const syncStateRef = adminDb.collection('sync_states').doc(`shopify-orders-${shopDomain || 'unknown'}`);

  let nextPageCursor: string | null = null;
  let pageCount = 0;
  let syncedCount = 0;
  let fetchMode: 'placeholder' = 'placeholder';

  do {
    const page = await fetchOrdersPage(client, nextPageCursor);
    fetchMode = page.mode;
    pageCount += 1;

    const normalizedOrders = page.orders
      .map((order) => mapShopifyOrder(order, { storeId: shopDomain, syncedAt: startedAt }))
      .filter((order) => order.shopifyOrderId);

    const result = await saveShopifyOrders(normalizedOrders);
    syncedCount += result.savedCount;
    nextPageCursor = page.nextPageCursor;
  } while (nextPageCursor && pageCount < 25);

  const status = fetchMode === 'placeholder' ? 'skipped' : 'completed';
  const message = fetchMode === 'placeholder'
    ? 'TODO: Shopify sipariş API çağrısı doğrulanmadığı için placeholder paginated sync yapısı çalıştı.'
    : 'Shopify sipariş senkronizasyonu tamamlandı.';

  await syncStateRef.set({
    source: 'shopify',
    resource: 'orders',
    shopDomain,
    status,
    startedAt,
    completedAt: new Date().toISOString(),
    pageCount,
    syncedCount,
    message
  }, { merge: true });

  return { resource: 'orders', status, startedAt, pageCount, syncedCount };
};
